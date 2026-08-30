/**
 * One-off: create the shared admin account and its `hosts` row (is_admin = true).
 *
 * The first admin can't be made through the app (that needs an admin), so seed it
 * here with the service-role key.
 *
 *   SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   ADMIN_EMAIL=admin@parfett.party \
 *   ADMIN_PASSWORD='a long shared passphrase' \
 *   npm run bootstrap:admin
 *
 * (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD still work as fallbacks.)
 * Idempotent: re-running finds the existing user and ensures the hosts row.
 */
import { createClient, type User } from '@supabase/supabase-js';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function firstOf(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }
  throw new Error(`Missing required env var: one of ${names.join(', ')}`);
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
  const email = firstOf('ADMIN_EMAIL', 'SUPER_ADMIN_EMAIL');
  const password = firstOf('ADMIN_PASSWORD', 'SUPER_ADMIN_PASSWORD');
  const name = process.env.ADMIN_NAME ?? process.env.SUPER_ADMIN_DISPLAY_NAME ?? 'Party Admin';

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
    .from('hosts')
    .upsert({ user_id: user.id, name, is_admin: true }, { onConflict: 'user_id' });
  if (upsertError) {
    throw upsertError;
  }

  console.log(`hosts row ensured for ${email} with is_admin = true.`);
  console.log('Done. Sign in with these credentials at /#/admin to set up parties.');
}

try {
  await main();
} catch (err: unknown) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
}
