import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Button, Heading, Stack } from '@parfett/design-system';
import { GuestCard, GuestScreen, guestHeadingStyle } from '../../components/guest';
import { useAdminRole, useSession } from '../../lib/roles';
import { signOut } from '../../lib/auth';
import { Login } from './Login';

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{ maxWidth: 400, margin: '0 auto', padding: 'var(--pf-space-7) var(--pf-space-5)' }}
    >
      <p style={{ color: 'var(--pf-color-text-muted)' }}>{children}</p>
    </main>
  );
}

function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void signOut();
      }}
    >
      Sign out
    </Button>
  );
}

/**
 * Gate for everything under /admin: shows the login form when signed out, a
 * "not an admin" notice when the account has no admins row, otherwise the admin
 * shell with a header and the matched child route.
 */
export function AdminLayout() {
  const { session, loading: sessionLoading } = useSession();
  const { role, loading: roleLoading } = useAdminRole();

  if (sessionLoading) {
    return <Centered>Loading…</Centered>;
  }
  if (!session) {
    return <Login />;
  }
  if (roleLoading) {
    return (
      <GuestScreen contentStyle={{ justifyContent: 'flex-start', paddingTop: 'var(--pf-space-6)' }}>
        <GuestCard>
          <p style={{ margin: 0, fontSize: 16, color: 'var(--pf-guest-muted)' }}>
            Checking access…
          </p>
        </GuestCard>
      </GuestScreen>
    );
  }
  if (!role) {
    return (
      <GuestScreen contentStyle={{ justifyContent: 'flex-start', paddingTop: 'var(--pf-space-6)' }}>
        <div
          style={{
            background: 'var(--pf-guest-sand-tint)',
            border: '1px solid var(--pf-guest-sand)',
            borderRadius: 'var(--pf-radius-lg)',
            padding: '22px 20px',
          }}
        >
          <Stack gap={3}>
            <Heading level={2} style={{ ...guestHeadingStyle, fontSize: 24 }}>
              No access
            </Heading>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                lineHeight: 1.55,
                color: 'var(--pf-guest-muted)',
                textWrap: 'pretty',
              }}
            >
              This account isn&apos;t set up as a host. Ask the setup account to add you.
            </p>
            <div>
              <SignOutButton />
            </div>
          </Stack>
        </div>
      </GuestScreen>
    );
  }

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--pf-space-4)',
          padding: 'var(--pf-space-3) var(--pf-space-5)',
          borderBottom: '1px solid var(--pf-color-border)',
        }}
      >
        <Stack direction="row" gap={4} align="center">
          <Link to="/admin" style={{ fontWeight: 'var(--pf-font-weight-bold)', color: 'inherit' }}>
            Parfett admin
          </Link>
          {role === 'admin' ? (
            <>
              <Link to="/admin/parties">Parties</Link>
              <Link to="/admin/hosts">Hosts</Link>
            </>
          ) : null}
        </Stack>
        <SignOutButton />
      </header>
      <Outlet />
    </div>
  );
}
