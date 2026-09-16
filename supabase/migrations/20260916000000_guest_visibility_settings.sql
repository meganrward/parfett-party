-- =====================================================================
-- Per-party guest visibility settings.
--   * show_guest_list / show_guest_count: independently toggleable,
--     control whether guests see the party-wide guest list / headcount
--     (as opposed to the guests on their own card, always shown).
--   * hosts_can_edit_visibility: whether a host (not just the admin) may
--     flip the two settings above from the host portal.
-- Defaults are off / admin-only, matching today's behaviour (no
-- party-wide guest info is shown anywhere yet).
-- =====================================================================

alter table public.parties
  add column show_guest_list        boolean not null default false,
  add column show_guest_count       boolean not null default false,
  add column hosts_can_edit_visibility boolean not null default false;

-- ---------------------------------------------------------------------
-- Authenticated: hosts may flip the two visibility flags on a party they
-- can access, but only when the admin has allowed it; the admin can
-- always flip them (they already have full write access via RLS, but we
-- route through this RPC too so admin and host share one code path).
-- ---------------------------------------------------------------------
create function public.set_guest_visibility(
  p_party_id uuid,
  p_show_guest_list boolean,
  p_show_guest_count boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_hosts_can_edit boolean;
begin
  if not public.can_access(p_party_id) then
    raise exception 'not permitted' using errcode = '42501';
  end if;

  select hosts_can_edit_visibility into v_hosts_can_edit
  from public.parties
  where id = p_party_id;

  if not found then
    raise exception 'unknown party' using errcode = 'P0002';
  end if;

  if not public.is_admin() and not v_hosts_can_edit then
    raise exception 'not permitted' using errcode = '42501';
  end if;

  update public.parties
  set show_guest_list = p_show_guest_list,
      show_guest_count = p_show_guest_count
  where id = p_party_id;
end;
$$;

revoke all on function public.set_guest_visibility(uuid, boolean, boolean) from public;
grant execute on function public.set_guest_visibility(uuid, boolean, boolean)
  to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Anonymous RPCs: extend get_qr with the two flags + a party-wide going
-- count (null when show_guest_count is off), and add list_party_guests
-- for the party-wide list (empty when show_guest_list is off). Both are
-- gated server-side, not just hidden in the UI.
-- ---------------------------------------------------------------------
drop function if exists public.get_qr(text);

create function public.get_qr(p_token text)
returns table (
  found              boolean,
  slug               text,
  party_name         text,
  event_start        timestamptz,
  event_end          timestamptz,
  location           text,
  description        text,
  guest_count        integer,
  show_guest_list    boolean,
  show_guest_count   boolean,
  party_guest_count  integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  rec record;
begin
  select p.id as party_id, p.slug, p.name, p.event_start, p.event_end, p.location,
         p.description, p.show_guest_list, p.show_guest_count, q.id as qr_id
  into rec
  from public.qr_codes q
  join public.parties p on p.id = q.party_id
  where lower(q.token) = lower(btrim(p_token));

  if not found then
    return query
      select false, null::text, null::text, null::timestamptz, null::timestamptz,
             null::text, null::text, 0, false, false, null::integer;
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
      (select count(*)::int from public.guests g where g.qr_code_id = rec.qr_id),
      rec.show_guest_list,
      rec.show_guest_count,
      case when rec.show_guest_count
        then (
          select count(*)::int from public.guests g
          where g.party_id = rec.party_id and g.rsvp_status = 'going'
        )
        else null
      end;
end;
$$;

revoke all on function public.get_qr(text) from public;
grant execute on function public.get_qr(text) to anon, authenticated, service_role;

-- List every guest going to the party (across every card), oldest first.
-- Empty when the token is unknown or the party has the list switched off.
create function public.list_party_guests(p_token text)
returns table (
  id   uuid,
  name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.id, g.name
  from public.guests g
  join public.parties p on p.id = g.party_id
  where p.id = (
    select q.party_id
    from public.qr_codes q
    where lower(q.token) = lower(btrim(p_token))
  )
  and p.show_guest_list
  and g.rsvp_status = 'going'
  order by g.created_at asc, g.id asc;
$$;

revoke all on function public.list_party_guests(text) from public;
grant execute on function public.list_party_guests(text) to anon, authenticated, service_role;
