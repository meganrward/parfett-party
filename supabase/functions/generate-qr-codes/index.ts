// Edge Function: generate a batch of unique QR codes for a party.
// Super-admin only. Never trusts the client for identity — the caller's JWT is
// verified, then a service-role client does the privileged work.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  clampInt,
  DEFAULT_ALPHABET,
  normalisePrefixes,
  planTokens,
  type PlannedToken,
} from './codegen.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

interface RequestBody {
  party_id?: unknown;
  count?: unknown;
  prefixes?: unknown;
  token_length?: unknown;
  alphabet?: unknown;
  mode?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceKey || !anonKey) {
    return json({ error: 'function is misconfigured' }, 500);
  }

  // 1. Identify the caller from their bearer token.
  const authHeader = req.headers.get('Authorization') ?? '';
  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: caller, error: callerErr } = await asCaller.auth.getUser();
  if (callerErr || !caller.user) {
    return json({ error: 'unauthorized' }, 401);
  }

  // 2. Everything else runs with the service role (bypasses RLS).
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: adminRow } = await admin
    .from('admins')
    .select('is_super')
    .eq('user_id', caller.user.id)
    .maybeSingle();
  if (!adminRow?.is_super) {
    return json({ error: 'forbidden: super-admin only' }, 403);
  }

  // 3. Parse the request.
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }
  const partyId = body.party_id;
  if (typeof partyId !== 'string' || partyId.length === 0) {
    return json({ error: 'party_id is required' }, 400);
  }
  const mode = body.mode === 'regenerate-unused' ? 'regenerate-unused' : 'append';

  // 4. Load the party for its generation defaults.
  const { data: party, error: partyErr } = await admin
    .from('parties')
    .select('qr_count, prefixes, token_length, alphabet')
    .eq('id', partyId)
    .maybeSingle();
  if (partyErr || !party) {
    return json({ error: 'party not found' }, 404);
  }

  const count = clampInt(body.count ?? party.qr_count, 1, 2000);
  const prefixes = normalisePrefixes(body.prefixes ?? party.prefixes ?? []);
  const tokenLength = clampInt(body.token_length ?? party.token_length, 4, 24);
  const alphabet =
    typeof body.alphabet === 'string' && body.alphabet.length >= 10
      ? body.alphabet
      : (party.alphabet ?? DEFAULT_ALPHABET);

  // 5. Optionally clear this party's unused codes first.
  let deleted = 0;
  if (mode === 'regenerate-unused') {
    const { data: rows, error: rowsErr } = await admin
      .from('qr_codes')
      .select('id, guests(count)')
      .eq('party_id', partyId);
    if (rowsErr) {
      return json({ error: 'failed to inspect existing codes', detail: rowsErr.message }, 500);
    }
    const unusedIds = (rows ?? [])
      .filter((r) => {
        const g = r.guests as Array<{ count: number }> | null;
        return !g || g.length === 0 || g[0]!.count === 0;
      })
      .map((r) => r.id as string);
    if (unusedIds.length > 0) {
      const { error: delErr } = await admin.from('qr_codes').delete().in('id', unusedIds);
      if (delErr) {
        return json({ error: 'failed to delete unused codes', detail: delErr.message }, 500);
      }
      deleted = unusedIds.length;
    }
  }

  // 6. Plan unique tokens against every existing token (the unique index is global).
  const { data: existingRows, error: existingErr } = await admin.from('qr_codes').select('token');
  if (existingErr) {
    return json({ error: 'failed to read existing tokens', detail: existingErr.message }, 500);
  }
  const existing = (existingRows ?? []).map((r) => r.token as string);

  let planned: PlannedToken[];
  try {
    planned = planTokens({ count, prefixes, tokenLength, alphabet, existing });
  } catch (err) {
    return json({ error: 'could not generate unique codes', detail: String(err) }, 422);
  }

  // 7. Insert and return.
  const { data: created, error: insertErr } = await admin
    .from('qr_codes')
    .insert(planned.map((p) => ({ party_id: partyId, token: p.token, prefix: p.prefix })))
    .select('id, token, prefix');
  if (insertErr) {
    return json({ error: 'failed to insert codes', detail: insertErr.message }, 500);
  }

  return json({ mode, deleted, count: created?.length ?? 0, created: created ?? [] }, 200);
});
