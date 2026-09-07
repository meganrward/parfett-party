// Edge Function: the admin removes a host account.
// Admin only. Deleting the auth user cascades to the hosts and party_hosts rows.
import { createClient } from 'npm:@supabase/supabase-js@2';

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

interface Body {
  userId?: unknown;
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

  // 1. Caller must be an admin.
  const asCaller = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: caller, error: callerErr } = await asCaller.auth.getUser();
  if (callerErr || !caller.user) {
    return json({ error: 'unauthorized' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: callerHost } = await admin
    .from('hosts')
    .select('is_admin')
    .eq('user_id', caller.user.id)
    .maybeSingle();
  if (!callerHost?.is_admin) {
    return json({ error: 'forbidden: admin only' }, 403);
  }

  // 2. Parse.
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }
  const userId = typeof body.userId === 'string' ? body.userId : '';
  if (!userId) {
    return json({ error: 'userId is required' }, 400);
  }
  if (userId === caller.user.id) {
    return json({ error: 'cannot remove your own account' }, 400);
  }

  const { data: target } = await admin
    .from('hosts')
    .select('is_admin')
    .eq('user_id', userId)
    .maybeSingle();
  if (target?.is_admin) {
    return json({ error: 'cannot remove the shared admin account' }, 400);
  }

  // 3. Delete the auth user; cascades to the hosts and party_hosts rows.
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) {
    return json({ error: 'could not remove the host', detail: deleteErr.message }, 500);
  }

  return json({ ok: true });
});
