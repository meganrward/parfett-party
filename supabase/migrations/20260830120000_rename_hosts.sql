-- =====================================================================
-- Terminology rename (plan WU10.5)
--   admins       -> hosts   (display_name -> name, is_super -> is_admin)
--   party_admins -> party_hosts
--   is_super()   -> is_admin()   (can_access() repointed)
-- "admin" now means the single setup account; everyone else is a "host".
-- Existing rows are preserved by the renames.
-- =====================================================================

alter table public.admins rename to hosts;
alter table public.hosts rename column display_name to name;
alter table public.hosts rename column is_super to is_admin;
alter table public.party_admins rename to party_hosts;

-- Policies reference is_super()/can_access(); drop them, drop the helpers, rebuild.
drop policy if exists admins_select on public.hosts;
drop policy if exists admins_write on public.hosts;
drop policy if exists party_admins_select on public.party_hosts;
drop policy if exists party_admins_write on public.party_hosts;
drop policy if exists parties_select on public.parties;
drop policy if exists parties_write on public.parties;
drop policy if exists qr_codes_select on public.qr_codes;
drop policy if exists qr_codes_delete on public.qr_codes;
drop policy if exists guests_select on public.guests;
drop policy if exists guests_insert on public.guests;
drop policy if exists guests_update on public.guests;
drop policy if exists guests_delete on public.guests;

drop function if exists public.can_access(uuid);
drop function if exists public.is_super();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.hosts h
    where h.user_id = (select auth.uid())
      and h.is_admin
  );
$$;

create function public.can_access(p_party_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_admin()
    or exists (
      select 1
      from public.party_hosts ph
      where ph.party_id = p_party_id
        and ph.user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.can_access(uuid) from public;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.can_access(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Rebuilt RLS policies (same shape, new names)
-- ---------------------------------------------------------------------

create policy hosts_select on public.hosts
  for select to authenticated using (true);
create policy hosts_write on public.hosts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy party_hosts_select on public.party_hosts
  for select to authenticated
  using (public.is_admin() or user_id = (select auth.uid()));
create policy party_hosts_write on public.party_hosts
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy parties_select on public.parties
  for select to authenticated using (public.can_access(id));
create policy parties_write on public.parties
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy qr_codes_select on public.qr_codes
  for select to authenticated using (public.can_access(party_id));
create policy qr_codes_delete on public.qr_codes
  for delete to authenticated using (public.is_admin());

create policy guests_select on public.guests
  for select to authenticated using (public.can_access(party_id));
create policy guests_insert on public.guests
  for insert to authenticated with check (public.can_access(party_id));
create policy guests_update on public.guests
  for update to authenticated
  using (public.can_access(party_id)) with check (public.can_access(party_id));
create policy guests_delete on public.guests
  for delete to authenticated using (public.can_access(party_id));
