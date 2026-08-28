/**
 * Seed a throwaway party with QR codes for manual front-end testing.
 *
 *   npm run seed:test-party
 *
 * Needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. supabase/scripts/.env is loaded
 * automatically (same file the bootstrap script uses — points at the hosted
 * project). For a local run instead:
 *
 *   SUPABASE_URL=$(npx supabase status -o json | jq -r .API_URL) \
 *   SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status -o json | jq -r .SERVICE_ROLE_KEY) \
 *   npm run seed:test-party
 *
 * Options (env vars):
 *   TEST_PARTY_SLUG   default "test-bash"
 *   APP_BASE_URL      default "http://localhost:5273/parfett-party"
 *   RESEED=1          wipe and regenerate the codes (URLs change)
 *
 * Idempotent: re-running keeps the same codes/URLs. Use `npm run unseed:test-party`
 * to remove the party entirely.
 */
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_ALPHABET, planTokens } from '../functions/generate-qr-codes/codegen.ts';

const SLUG = process.env.TEST_PARTY_SLUG ?? 'test-bash';
const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:5273/parfett-party';
const PREFIXES = ['A', 'B'];
const COUNT = 6;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. See the header of this file for how to set it.`);
  }
  return value;
}

async function main(): Promise<void> {
  const db = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });

  const now = Date.now();
  const start = new Date(now + 14 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);

  const { data: party, error: partyErr } = await db
    .from('parties')
    .upsert(
      {
        slug: SLUG,
        name: 'Test Bash',
        event_start: start.toISOString(),
        event_end: end.toISOString(),
        location: '12 Parfett Street, London E1',
        description: 'A seeded party for local testing. BYOB; dress code: whatever.',
        qr_count: COUNT,
        prefixes: PREFIXES,
      },
      { onConflict: 'slug' },
    )
    .select('id, slug')
    .single();
  if (partyErr || !party) {
    throw partyErr ?? new Error('failed to upsert the party');
  }

  // Reuse existing codes so re-running keeps stable URLs. Pass RESEED=1 to force a
  // fresh batch (e.g. after changing COUNT / PREFIXES).
  const reseed = process.env.RESEED === '1';
  if (reseed) {
    await db.from('qr_codes').delete().eq('party_id', party.id);
  }

  let { data: codes } = await db
    .from('qr_codes')
    .select('id, token, prefix')
    .eq('party_id', party.id)
    .order('created_at', { ascending: true });

  if (!codes || codes.length < COUNT) {
    const { data: allTokens } = await db.from('qr_codes').select('token');
    const planned = planTokens({
      count: COUNT - (codes?.length ?? 0),
      prefixes: PREFIXES,
      tokenLength: 10,
      alphabet: DEFAULT_ALPHABET,
      existing: (allTokens ?? []).map((r) => r.token as string),
    });
    const { data: inserted, error: insErr } = await db
      .from('qr_codes')
      .insert(planned.map((p) => ({ party_id: party.id, token: p.token, prefix: p.prefix })))
      .select('id, token, prefix');
    if (insErr) {
      throw insErr;
    }
    codes = [...(codes ?? []), ...(inserted ?? [])];
  }

  // Ensure the first code has a guest so the "returning visitor" list view is reachable.
  const withGuests = codes[0]!;
  const { count: guestCount } = await db
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('qr_code_id', withGuests.id);
  if (!guestCount) {
    await db.from('guests').insert({
      qr_code_id: withGuests.id,
      party_id: party.id,
      name: 'Existing Ellie',
      rsvp_status: 'going',
    });
  }

  const link = (token: string) => `${APP_BASE_URL}/#/${party.slug}/c/${token}`;

  console.log(`\nParty "${party.slug}" seeded with ${codes.length} codes.\n`);
  console.log('Fresh code (welcome screen):');
  console.log(`  ${link(codes[1]!.token)}`);
  console.log('\nCode that already has a guest (list + add-another screen):');
  console.log(`  ${link(withGuests.token)}`);
  console.log('\nAll codes:');
  for (const c of codes) {
    console.log(`  ${c.prefix ?? '—'}  ${link(c.token)}`);
  }
  console.log('\nAdmin (once built): ' + `${APP_BASE_URL}/#/admin/${party.slug}/guests`);
}

try {
  await main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
