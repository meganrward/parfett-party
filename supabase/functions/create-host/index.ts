// Edge Function: the admin adds a host account (name + email).
// Admin only. Creates/invites the auth user and upserts the hosts row.
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  name?: unknown;
  email?: unknown;
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
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (name.length === 0 || name.length > 80) {
    return json({ error: 'name is required (up to 80 chars)' }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return json({ error: 'a valid email is required' }, 400);
  }

  // 3. Find or create the auth user.
  let userId: string | null = null;
  let invited = false;
  for (let page = 1; page <= 20 && !userId; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      return json({ error: 'failed to look up users', detail: error.message }, 500);
    }
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) {
      userId = found.id;
    }
    if (data.users.length < 200) {
      break;
    }
  }

  if (!userId) {
    const invite = await admin.auth.admin.inviteUserByEmail(email);
    if (!invite.error && invite.data.user) {
      userId = invite.data.user.id;
      invited = true;
    } else {
      const created = await admin.auth.admin.createUser({ email, email_confirm: true });
      if (created.error || !created.data.user) {
        return json({ error: 'could not create the user', detail: created.error?.message }, 500);
      }
      userId = created.data.user.id;
    }
  }

  // 4. A password-set link the admin can forward if the invite email doesn't land.
  let setupLink: string | null = null;
  const link = await admin.auth.admin.generateLink({ type: 'recovery', email });
  if (!link.error) {
    setupLink = link.data.properties?.action_link ?? null;
  }

  // 5. Upsert the hosts row.
  const { error: upsertErr } = await admin
    .from('hosts')
    .upsert({ user_id: userId, name, is_admin: false }, { onConflict: 'user_id' });
  if (upsertErr) {
    return json({ error: 'failed to save the host', detail: upsertErr.message }, 500);
  }

  return json({
    host: { userId, name, isAdmin: false },
    invited,
    setupLink,
  });
});
