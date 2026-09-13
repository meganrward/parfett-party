-- =====================================================================
-- Host status: 'pending' until they set a password, then 'active'.
-- Existing rows default to 'active' (they already have passwords); new
-- hosts are inserted as 'pending' by the create-host Edge Function.
-- =====================================================================

alter table public.hosts
  add column status text not null default 'active'
    check (status in ('pending', 'active'));

-- A pending host flips themself to 'active' right after setting their
-- password (see SetPassword.tsx). Security definer so we don't need to
-- loosen the admin-only hosts_write RLS policy or grant column-level
-- update privileges to authenticated — this only ever touches the
-- caller's own row, and only the status column.
create function public.activate_own_host()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.hosts
  set status = 'active'
  where user_id = (select auth.uid())
    and status = 'pending';
$$;

revoke all on function public.activate_own_host() from public;
grant execute on function public.activate_own_host() to authenticated;
