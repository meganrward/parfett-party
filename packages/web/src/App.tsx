import { useEffect } from 'react';
import { HashRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { Card, Heading, Stack } from '@parfett/design-system';
import { Landing } from './routes/Landing';
import { GuestFlow } from './routes/GuestFlow';
import { PartyInfo } from './routes/PartyInfo';
import { AdminLayout } from './routes/admin/AdminLayout';
import { PartyPicker } from './routes/admin/PartyPicker';
import { Guests } from './routes/admin/Guests';
import { CodeSheet } from './routes/admin/CodeSheet';
import { Parties } from './routes/admin/Parties';
import { Hosts } from './routes/admin/Hosts';
import { SetPassword } from './routes/admin/SetPassword';
import { RequirePartyAccess, RequireAdmin } from './routes/admin/guards';
import { supabase } from './lib/supabase';

/**
 * Supabase's invite/recovery links land on the site root with tokens appended as a
 * URL fragment (`#access_token=...&type=invite|recovery`), which the HashRouter
 * can't parse as a route — it 404s (or, once a session exists, falls through to
 * whatever route that garbage path happens to match, e.g. the party picker).
 * supabase-js still picks the tokens up on load (`detectSessionInUrl`), but only
 * `type=recovery` gets its own `PASSWORD_RECOVERY` event — an invite link fires the
 * ordinary `SIGNED_IN` event, so we also check the raw hash for `type=invite`.
 */
function useAuthRecoveryRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const isInviteOrRecoveryHash = () =>
      /access_token=/.test(window.location.hash) &&
      /type=(invite|recovery)/.test(window.location.hash);

    if (isInviteOrRecoveryHash()) {
      navigate('/admin/set-password', { replace: true });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || isInviteOrRecoveryHash()) {
        navigate('/admin/set-password', { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);
}

function Routing() {
  useAuthRecoveryRedirect();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/:slug/c/:token" element={<GuestFlow />} />
      <Route path="/:slug/c/:token/info" element={<PartyInfo />} />

      <Route path="/admin/set-password" element={<SetPassword />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<PartyPicker />} />
        <Route element={<RequirePartyAccess />}>
          <Route path=":slug/guests" element={<Guests />} />
          <Route path=":slug/codes" element={<CodeSheet />} />
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="parties" element={<Parties />} />
          <Route path="hosts" element={<Hosts />} />
        </Route>
      </Route>

      <Route path="*" element={<Placeholder title="Not found" />} />
    </Routes>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem' }}>
      <Card>
        <Stack gap={4}>
          <Heading level={1}>{title}</Heading>
          <p style={{ margin: 0, color: 'var(--pf-color-text-muted)' }}>Coming soon.</p>
        </Stack>
      </Card>
    </main>
  );
}

export function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routing />
    </HashRouter>
  );
}
