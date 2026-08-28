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
   'authenticated', 'authenticated', 'super@parfett.test'),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'housemate-a@parfett.test'),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'housemate-b@parfett.test');

insert into public.admins (user_id, display_name, is_super)
values
  ('11111111-1111-1111-1111-111111111111', 'Party Setup', true),
  ('22222222-2222-2222-2222-222222222222', 'Housemate A', false),
  ('33333333-3333-3333-3333-333333333333', 'Housemate B', false);

insert into public.parties (id, slug, name, event_start)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'christmas', 'Parfett Christmas', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'my-birthday', 'Birthday Bash', now());

-- Housemate A can access Christmas only.
insert into public.party_admins (party_id, user_id)
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
select throws_ok('select * from public.admins',       '42501', null, 'anon cannot read admins');
select throws_ok('select * from public.party_admins', '42501', null, 'anon cannot read party_admins');
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
-- RLS: authenticated admins
-- ---------------------------------------------------------------------

-- Assertions filter to the fixture slugs so the suite is independent of any
-- other rows already in the local database.

-- Housemate A: sees Christmas, not Birthday.
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::int from public.parties where slug in ('christmas', 'my-birthday')),
  1,
  'housemate A sees only the party they are assigned to'
);
select is(
  (select slug from public.parties where slug in ('christmas', 'my-birthday')),
  'christmas',
  'housemate A sees the Christmas party'
);
select is(public.is_super(), false, 'is_super() is false for a housemate');

reset role;

-- Super-admin: sees every party.
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::int from public.parties where slug in ('christmas', 'my-birthday')),
  2,
  'super-admin sees all fixture parties'
);
select is(public.is_super(), true, 'is_super() is true for the setup account');

reset role;

select * from finish();
rollback;
