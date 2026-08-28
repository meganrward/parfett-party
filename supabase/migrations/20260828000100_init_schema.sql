-- =====================================================================
-- Parfett Party — core schema, role helpers, RLS, grants, and anon RPCs
-- =====================================================================
-- Access model:
--   * anonymous invitees  -> no table access; only EXECUTE on the four
--                            SECURITY DEFINER RPCs, all keyed by a QR token
--   * authenticated admins -> table DML gated by RLS via can_access()/is_super()
--   * super-admin          -> bypasses per-party checks via is_super()
-- The Supabase project has "Automatically expose new tables" OFF, so every
-- privilege below is granted explicitly.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.parties (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique
                  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40),
  name          text not null check (char_length(name) between 1 and 120),
  event_start   timestamptz,
  event_end     timestamptz,
  location      text check (char_length(location) <= 300),
  description   text check (char_length(description) <= 4000),
  qr_count      integer not null default 75 check (qr_count between 1 and 2000),
  prefixes      text[] not null default '{}'::text[],
  token_length  integer not null default 10 check (token_length between 4 and 24),
  alphabet      text not null default 'ABCDEFGHJKLMNPQRTUVWXYZ23456789'
                  check (char_length(alphabet) between 10 and 64),
  created_at    timestamptz not null default now(),
  constraint parties_event_order
    check (event_end is null or event_start is null or event_end >= event_start)
);

comment on table public.parties is 'One row per party. Holds display info + QR generation options.';

create table public.admins (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 80),
  is_super      boolean not null default false,
  created_at    timestamptz not null default now()
);

comment on table public.admins is 'Admin accounts. Exactly one shared setup account has is_super = true.';

create table public.party_admins (
  party_id    uuid not null references public.parties(id) on delete cascade,
  user_id     uuid not null references public.admins(user_id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (party_id, user_id)
);

comment on table public.party_admins is 'Which housemate admins may access which parties.';

create table public.qr_codes (
  id          uuid primary key default gen_random_uuid(),
  party_id    uuid not null references public.parties(id) on delete cascade,
  token       text not null check (char_length(token) between 4 and 40),
  prefix      text check (char_length(prefix) <= 8),
  created_at  timestamptz not null default now()
);

create unique index qr_codes_token_lower_key on public.qr_codes (lower(token));
create index qr_codes_party_id_idx on public.qr_codes (party_id);

comment on table public.qr_codes is 'One row per printed card. token is globally unique (case-insensitive).';

create table public.guests (
  id           uuid primary key default gen_random_uuid(),
  qr_code_id   uuid not null references public.qr_codes(id) on delete cascade,
  party_id     uuid not null references public.parties(id) on delete cascade,
  name         text check (char_length(name) <= 80),
  rsvp_status  text check (rsvp_status in ('going', 'not_going')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index guests_qr_code_id_idx on public.guests (qr_code_id);
create index guests_party_id_idx on public.guests (party_id);

comment on table public.guests is 'Zero or more guests per QR code (shared cards).';

-- ---------------------------------------------------------------------
-- updated_at trigger for guests
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger guests_set_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER so policies are cheap and recursion-free)
-- ---------------------------------------------------------------------

create or replace function public.is_super()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = (select auth.uid())
      and a.is_super
  );
$$;

create or replace function public.can_access(p_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_super()
    or exists (
      select 1
      from public.party_admins pa
      where pa.party_id = p_party_id
        and pa.user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_super() from public;
revoke all on function public.can_access(uuid) from public;
grant execute on function public.is_super() to authenticated;
grant execute on function public.can_access(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.parties      enable row level security;
alter table public.admins       enable row level security;
alter table public.party_admins enable row level security;
alter table public.qr_codes     enable row level security;
alter table public.guests       enable row level security;

-- admins: any authenticated admin may read the roster; only super may write
create policy admins_select on public.admins
  for select to authenticated using (true);
create policy admins_write on public.admins
  for all to authenticated using (public.is_super()) with check (public.is_super());

-- party_admins: super sees all; a housemate sees their own grants; super writes
create policy party_admins_select on public.party_admins
  for select to authenticated
  using (public.is_super() or user_id = (select auth.uid()));
create policy party_admins_write on public.party_admins
  for all to authenticated
  using (public.is_super()) with check (public.is_super());

-- parties: readable to admins who can access it; only super may create/edit/delete
create policy parties_select on public.parties
  for select to authenticated using (public.can_access(id));
create policy parties_write on public.parties
  for all to authenticated
  using (public.is_super()) with check (public.is_super());

-- qr_codes: readable to admins who can access the party; only super may delete;
-- inserts happen through the Edge Function (service role), never the client
create policy qr_codes_select on public.qr_codes
  for select to authenticated using (public.can_access(party_id));
create policy qr_codes_delete on public.qr_codes
  for delete to authenticated using (public.is_super());

-- guests: full DML for admins who can access the party
create policy guests_select on public.guests
  for select to authenticated using (public.can_access(party_id));
create policy guests_insert on public.guests
  for insert to authenticated with check (public.can_access(party_id));
create policy guests_update on public.guests
  for update to authenticated
  using (public.can_access(party_id)) with check (public.can_access(party_id));
create policy guests_delete on public.guests
  for delete to authenticated using (public.can_access(party_id));

-- ---------------------------------------------------------------------
-- Grants (explicit — new tables are not auto-exposed)
-- ---------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

-- Supabase ships ALTER DEFAULT PRIVILEGES that hand table DML to anon (and the
-- PUBLIC pseudo-role) for everything in `public`. Take it back: anonymous
-- invitees only ever reach data through the SECURITY DEFINER RPCs below.
revoke all on public.parties      from anon, public;
revoke all on public.admins       from anon, public;
revoke all on public.party_admins from anon, public;
revoke all on public.qr_codes     from anon, public;
revoke all on public.guests       from anon, public;

grant select, insert, update, delete on public.parties      to authenticated;
grant select, insert, update, delete on public.admins       to authenticated;
grant select, insert, update, delete on public.party_admins to authenticated;
grant select, delete                 on public.qr_codes     to authenticated;
grant select, insert, update, delete on public.guests       to authenticated;

-- ---------------------------------------------------------------------
-- Anonymous RPCs — the only way the public touches the data.
-- All keyed by a QR token; all SECURITY DEFINER with a locked search_path.
-- ---------------------------------------------------------------------

-- Resolve a QR token to its party + a guest count. Returns a single row;
-- found = false when the token is unknown.
create or replace function public.get_qr(p_token text)
returns table (
  found        boolean,
  slug         text,
  party_name   text,
  event_start  timestamptz,
  event_end    timestamptz,
  location     text,
  description  text,
  guest_count  integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  rec record;
begin
  select p.slug, p.name, p.event_start, p.event_end, p.location, p.description, q.id as qr_id
  into rec
  from public.qr_codes q
  join public.parties p on p.id = q.party_id
  where lower(q.token) = lower(btrim(p_token));

  if not found then
    return query
      select false, null::text, null::text, null::timestamptz, null::timestamptz,
             null::text, null::text, 0;
    return;
  end if;

  return query
    select
      true,
      rec.slug,
      rec.name,
      rec.event_start,
      rec.event_end,
      rec.location,
      rec.description,
      (select count(*)::int from public.guests g where g.qr_code_id = rec.qr_id);
end;
$$;

-- List every guest on a QR code, oldest first.
create or replace function public.list_guests(p_token text)
returns table (
  id           uuid,
  name         text,
  rsvp_status  text,
  created_at   timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name, g.rsvp_status, g.created_at
  from public.guests g
  join public.qr_codes q on q.id = g.qr_code_id
  where lower(q.token) = lower(btrim(p_token))
  order by g.created_at asc, g.id asc;
$$;

-- Add a guest to a QR code. Returns the new guest id.
create or replace function public.add_guest(p_token text, p_name text, p_status text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_qr   public.qr_codes%rowtype;
  v_name text;
  v_id   uuid;
begin
  if p_status is not null and p_status not in ('going', 'not_going') then
    raise exception 'invalid rsvp status: %', p_status using errcode = '22023';
  end if;

  select * into v_qr
  from public.qr_codes q
  where lower(q.token) = lower(btrim(p_token));

  if not found then
    raise exception 'unknown code' using errcode = 'P0002';
  end if;

  v_name := nullif(btrim(coalesce(p_name, '')), '');
  if v_name is not null then
    v_name := left(v_name, 80);
  end if;

  insert into public.guests (qr_code_id, party_id, name, rsvp_status)
  values (v_qr.id, v_qr.party_id, v_name, p_status)
  returning id into v_id;

  return v_id;
end;
$$;

-- Update one guest's name + status to exactly the given values. The guest must
-- belong to the QR code identified by p_token (no per-guest ownership beyond that).
create or replace function public.update_guest(
  p_token text,
  p_guest_id uuid,
  p_name text,
  p_status text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_qr_id uuid;
  v_name  text;
begin
  if p_status is not null and p_status not in ('going', 'not_going') then
    raise exception 'invalid rsvp status: %', p_status using errcode = '22023';
  end if;

  select q.id into v_qr_id
  from public.qr_codes q
  where lower(q.token) = lower(btrim(p_token));

  if not found then
    raise exception 'unknown code' using errcode = 'P0002';
  end if;

  v_name := nullif(btrim(coalesce(p_name, '')), '');
  if v_name is not null then
    v_name := left(v_name, 80);
  end if;

  update public.guests g
  set name = v_name,
      rsvp_status = p_status
  where g.id = p_guest_id
    and g.qr_code_id = v_qr_id;

  if not found then
    raise exception 'guest not on this code' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.get_qr(text) from public;
revoke all on function public.list_guests(text) from public;
revoke all on function public.add_guest(text, text, text) from public;
revoke all on function public.update_guest(text, uuid, text, text) from public;

grant execute on function public.get_qr(text)       to anon, authenticated;
grant execute on function public.list_guests(text)  to anon, authenticated;
grant execute on function public.add_guest(text, text, text) to anon, authenticated;
grant execute on function public.update_guest(text, uuid, text, text) to anon, authenticated;
