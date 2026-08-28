/**
 * Manual end-to-end check for the generate-qr-codes Edge Function against a
 * running local stack. Not part of `vitest` / `deno test`.
 *
 *   npx supabase start
 *   npx supabase functions serve generate-qr-codes --no-verify-jwt --env-file supabase/functions/.env.local &
 *   SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SERVICE_ROLE_KEY=<local service_role> \
 *   SUPABASE_ANON_KEY=<local anon> \
 *   tsx supabase/functions/generate-qr-codes/integration-check.ts
 */
import { createClient } from '@supabase/supabase-js';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

const url = required('SUPABASE_URL');
const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY');
const anonKey = required('SUPABASE_ANON_KEY');
const email = process.env.SUPER_ADMIN_EMAIL ?? 'setup@parfett.party';
const password = process.env.SUPER_ADMIN_PASSWORD ?? 'local-dev-passphrase-123';
const fnUrl = `${url}/functions/v1/generate-qr-codes`;

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`ASSERT FAILED: ${msg}`);
  console.log(`  ok: ${msg}`);
}

async function ensureSuperAdmin(): Promise<void> {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  let user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error('createUser failed');
    user = data.user;
  }
  const { error } = await admin
    .from('admins')
    .upsert({ user_id: user.id, display_name: 'Party Setup', is_super: true });
  if (error) throw error;
}

async function makeParty(): Promise<string> {
  const slug = `itest-${Date.now().toString(36)}`;
  const { data, error } = await admin
    .from('parties')
    .insert({ slug, name: 'Integration Test Party', qr_count: 12, prefixes: ['J', 'K', 'X'] })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

async function accessToken(): Promise<string> {
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error ?? new Error('sign-in failed');
  return data.session.access_token;
}

async function callFn(token: string | null, body: unknown): Promise<{ status: number; json: any }> {
  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json() };
}

async function run(partyId: string): Promise<void> {
  const token = await accessToken();

  console.log('1. happy path: 12 codes, prefixes J/K/X');
  const ok = await callFn(token, { party_id: partyId });
  assert(ok.status === 200, `status 200 (got ${ok.status} ${JSON.stringify(ok.json)})`);
  assert(ok.json.count === 12, `created 12 (got ${ok.json.count})`);
  const byPrefix = (p: string) =>
    ok.json.created.filter((c: { prefix: string }) => c.prefix === p).length;
  assert(byPrefix('J') === 4 && byPrefix('K') === 4 && byPrefix('X') === 4, 'even 4/4/4 split');
  const tokens = new Set(ok.json.created.map((c: { token: string }) => c.token.toLowerCase()));
  assert(tokens.size === 12, 'all tokens unique');
  assert(
    ok.json.created.every((c: { token: string; prefix: string }) => c.token.startsWith(c.prefix)),
    'each token carries its prefix',
  );

  console.log('2. append mode adds more without touching existing');
  const more = await callFn(token, { party_id: partyId, count: 3, prefixes: [] });
  assert(more.status === 200 && more.json.count === 3, 'added 3 prefix-less codes');
  const { count: total } = await admin
    .from('qr_codes')
    .select('*', { count: 'exact', head: true })
    .eq('party_id', partyId);
  assert(total === 15, `party now has 15 codes (got ${total})`);

  console.log('3. regenerate-unused clears codes with no guests');
  const regen = await callFn(token, { party_id: partyId, count: 5, mode: 'regenerate-unused' });
  assert(regen.status === 200, `status 200 (got ${regen.status})`);
  assert(regen.json.deleted === 15, `deleted all 15 unused (got ${regen.json.deleted})`);
  assert(regen.json.count === 5, `generated 5 fresh (got ${regen.json.count})`);

  console.log('4. no auth -> 401');
  const noAuth = await callFn(null, { party_id: partyId });
  assert(noAuth.status === 401, `got ${noAuth.status}`);

  console.log('5. unknown party -> 404');
  const bad = await callFn(token, { party_id: '00000000-0000-0000-0000-000000000000' });
  assert(bad.status === 404, `got ${bad.status}`);

  console.log('6. non-super caller -> 403');
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const hEmail = `housemate-${Date.now().toString(36)}@parfett.test`;
  const { data: hUser } = await admin.auth.admin.createUser({
    email: hEmail,
    password: 'housemate-pw-123',
    email_confirm: true,
  });
  await admin.from('admins').insert({
    user_id: hUser.user!.id,
    display_name: 'Housemate',
    is_super: false,
  });
  const { data: hSession } = await anon.auth.signInWithPassword({
    email: hEmail,
    password: 'housemate-pw-123',
  });
  const forbidden = await callFn(hSession.session!.access_token, { party_id: partyId });
  assert(forbidden.status === 403, `got ${forbidden.status}`);
  await admin.auth.admin.deleteUser(hUser.user!.id);
}

async function main(): Promise<void> {
  await ensureSuperAdmin();
  const partyId = await makeParty();
  try {
    await run(partyId);
    console.log('\nAll integration checks passed.');
  } finally {
    await admin.from('parties').delete().eq('id', partyId);
  }
}

try {
  await main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
