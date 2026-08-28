-- =====================================================================
-- Grant table access to service_role.
-- =====================================================================
-- With "Automatically expose new tables" OFF, the hosted project does NOT
-- apply Supabase's default privileges, so service_role (used by the
-- bootstrap script and the generate-qr-codes Edge Function) has no table
-- privileges. service_role already bypasses RLS; it just needs the grants.
-- =====================================================================

grant usage on schema public to service_role;

grant select, insert, update, delete on public.parties      to service_role;
grant select, insert, update, delete on public.admins       to service_role;
grant select, insert, update, delete on public.party_admins to service_role;
grant select, insert, update, delete on public.qr_codes     to service_role;
grant select, insert, update, delete on public.guests       to service_role;

grant execute on function public.is_super()                            to service_role;
grant execute on function public.can_access(uuid)                      to service_role;
grant execute on function public.get_qr(text)                          to service_role;
grant execute on function public.list_guests(text)                     to service_role;
grant execute on function public.add_guest(text, text, text)           to service_role;
grant execute on function public.update_guest(text, uuid, text, text)  to service_role;
