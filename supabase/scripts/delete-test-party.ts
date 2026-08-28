/**
 * Delete a party seeded by seed-test-party.ts (cascades to its QR codes and guests).
 *
 *   npm run unseed:test-party
 *
 * Same credentials as seed-test-party.ts: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY,
 * loaded from supabase/scripts/.env. Override the slug with TEST_PARTY_SLUG.
 */
import { createClient } from '@supabase/supabase-js';

const SLUG = process.env.TEST_PARTY_SLUG ?? 'test-bash';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. See supabase/scripts/seed-test-party.ts for how to set it.`);
  }
  return value;
}

async function main(): Promise<void> {
  const db = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });

  const { data, error } = await db.from('parties').delete().eq('slug', SLUG).select('id');
  if (error) {
    throw error;
  }
  if (!data || data.length === 0) {
    console.log(`No party with slug "${SLUG}" — nothing to delete.`);
    return;
  }
  console.log(`Deleted party "${SLUG}" (and its QR codes + guests).`);
}

try {
  await main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
