// Edge Function: the admin resends the set-password email to a pending host.
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

  const { data: target } = await admin
    .from('hosts')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle();
  if (!target) {
    return json({ error: 'host not found' }, 404);
  }
  if (target.status !== 'pending') {
    return json({ error: 'this host already has a password set' }, 400);
  }

  // 3. Look up their email and resend.
  const { data: user, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !user.user?.email) {
    return json({ error: 'could not look up the host', detail: userErr?.message }, 500);
  }

  const reset = await admin.auth.resetPasswordForEmail(user.user.email);
  if (reset.error) {
    return json({ error: `could not send the invite email: ${reset.error.message}` }, 502);
  }

  return json({ ok: true });
});
