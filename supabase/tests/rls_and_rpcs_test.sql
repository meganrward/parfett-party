-- pgTAP: RLS + anonymous RPC behaviour. Run with `supabase test db`.
-- Each file runs in its own transaction and is rolled back afterwards.

begin;

select plan(22);

-- ---------------------------------------------------------------------
-- Fixtures (created as the migration owner, bypassing RLS)
-- ---------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'admin@parfett.test'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'host-a@parfett.test'),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'host-b@parfett.test');

insert into public.hosts (user_id, name, is_admin)
values
  ('11111111-1111-1111-1111-111111111111', 'Party Admin', true),
  ('22222222-2222-2222-2222-222222222222', 'Host A', false),
  ('33333333-3333-3333-3333-333333333333', 'Host B', false);

insert into public.parties (id, slug, name, event_start)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'christmas', 'Parfett Christmas', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'my-birthday', 'Birthday Bash', now());

-- Host A can access Christmas only.
insert into public.party_hosts (party_id, user_id)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222');

insert into public.qr_codes (id, party_id, token, prefix)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'JX4K', 'J'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'AH7P', 'A');

-- ---------------------------------------------------------------------
-- Anon: no direct table access
-- ---------------------------------------------------------------------
set local role anon;

select throws_ok('select * from public.parties',      '42501', null, 'anon cannot read parties');
select throws_ok('select * from public.hosts',       '42501', null, 'anon cannot read hosts');
select throws_ok('select * from public.party_hosts', '42501', null, 'anon cannot read party_hosts');
select throws_ok('select * from public.qr_codes',     '42501', null, 'anon cannot read qr_codes');
select throws_ok('select * from public.guests',       '42501', null, 'anon cannot read guests');

-- ---------------------------------------------------------------------
-- Anon: RPCs
-- ---------------------------------------------------------------------
select is(
  (select found from public.get_qr('nope-nope')),
  false,
  'get_qr returns found = false for an unknown token'
);

select is(
  (select slug from public.get_qr('jx4k')),
  'christmas',
  'get_qr resolves a token case-insensitively to its party slug'
);

select throws_ok(
  $$ select public.add_guest('does-not-exist', 'Dave', 'going') $$,
  'P0002', null,
  'add_guest rejects an unknown token'
);

select throws_ok(
  $$ select public.add_guest('JX4K', 'Dave', 'maybe') $$,
  '22023', null,
  'add_guest rejects an invalid rsvp status'
);

-- Happy path: add two guests to the Christmas QR.
select lives_ok(
  $$ select public.add_guest('JX4K', '  Dave  ', 'going') $$,
  'add_guest inserts a guest'
);
select lives_ok(
  $$ select public.add_guest('jx4k', null, 'not_going') $$,
  'add_guest allows a nameless guest and lowercase token'
);

select is(
  (select count(*)::int from public.list_guests('JX4K')),
  2,
  'list_guests returns both guests on the code'
);

-- Look guests up by name (both rows share a transaction-fixed created_at, so
-- positional ordering is not deterministic).
select is(
  (select name from public.list_guests('JX4K') where name = 'Dave'),
  'Dave',
  'add_guest trims the supplied name'
);

select is(
  (select guest_count from public.get_qr('JX4K')),
  2,
  'get_qr reports the guest count'
);

-- update_guest cross-QR guard: a guest on the Christmas code cannot be edited
-- through the Birthday code.
select throws_ok(
  format(
    $$ select public.update_guest('AH7P', %L, 'Mallory', 'going') $$,
    (select id from public.list_guests('JX4K') where name = 'Dave')
  ),
  'P0002', null,
  'update_guest rejects a guest id that belongs to another QR code'
);

select lives_ok(
  format(
    $$ select public.update_guest('JX4K', %L, 'David', 'not_going') $$,
    (select id from public.list_guests('JX4K') where name = 'Dave')
  ),
  'update_guest edits a guest on its own QR code'
);

select is(
  (select rsvp_status from public.list_guests('JX4K') where name = 'David'),
  'not_going',
  'update_guest persists the new status'
);

reset role;

-- ---------------------------------------------------------------------
-- RLS: authenticated hosts
-- ---------------------------------------------------------------------

-- Assertions filter to the fixture slugs so the suite is independent of any
-- other rows already in the local database.

-- Host A: sees Christmas, not Birthday.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.parties where slug in ('christmas', 'my-birthday')),
  1,
  'host A sees only the party they are assigned to'
);
select is(
  (select slug from public.parties where slug in ('christmas', 'my-birthday')),
  'christmas',
  'host A sees the Christmas party'
);
select is(public.is_admin(), false, 'is_admin() is false for a host');

reset role;

-- Admin account: sees every party.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::int from public.parties where slug in ('christmas', 'my-birthday')),
  2,
  'admin sees all fixture parties'
);
select is(public.is_admin(), true, 'is_admin() is true for the setup account');

reset role;

select * from finish();
rollback;
