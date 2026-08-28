/**
 * One-off: create the shared super-admin account and its admins row.
 *
 * The first super-admin cannot be made through the app (that needs a super-admin),
 * so seed it here with the service-role key.
 *
 *   SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   SUPER_ADMIN_EMAIL=setup@parfett.party \
 *   SUPER_ADMIN_PASSWORD='a long shared passphrase' \
 *   npm run bootstrap:super-admin
 *
 * Idempotent: re-running finds the existing user and ensures the admins row.
 */
import { createClient, type User } from '@supabase/supabase-js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function findUserByEmail(
  admin: ReturnType<typeof createClient>['auth']['admin'],
  email: string,
): Promise<User | null> {
  // listUsers is paginated; walk pages until we find the email or run out.
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      return match;
    }
    if (data.users.length < 200) {
      return null;
    }
  }
  return null;
}

async function main(): Promise<void> {
  const url = required('SUPABASE_URL');
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
  const email = required('SUPER_ADMIN_EMAIL');
  const password = required('SUPER_ADMIN_PASSWORD');
  const displayName = process.env.SUPER_ADMIN_DISPLAY_NAME ?? 'Party Setup';

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let user = await findUserByEmail(supabase.auth.admin, email);

  if (user) {
    console.log(`Found existing auth user ${email} (${user.id}).`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw error ?? new Error('createUser returned no user');
    }
    user = data.user;
    console.log(`Created auth user ${email} (${user.id}).`);
  }

  const { error: upsertError } = await supabase
    .from('admins')
    .upsert(
      { user_id: user.id, display_name: displayName, is_super: true },
      { onConflict: 'user_id' },
    );
  if (upsertError) {
    throw upsertError;
  }

  console.log(`admins row ensured for ${email} with is_super = true.`);
  console.log('Done. Sign in with these credentials at /#/admin to set up parties.');
}

try {
  await main();
} catch (err: unknown) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
