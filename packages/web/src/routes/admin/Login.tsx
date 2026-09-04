import { useState } from 'react';
import { Button, Masthead, Stack } from '@parfett/design-system';
import { GuestCard, GuestLabel, GuestScreen, guestFieldStyle } from '../../components/guest';
import { signIn } from '../../lib/auth';

/**
 * H1 — the front door. Shown by AdminLayout whenever there is no session, on the
 * invite-card system (the purple admin shell only appears once you're in).
 */
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      // On success the auth listener updates the session and AdminLayout re-renders.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
      setBusy(false);
    }
  };

  return (
    <GuestScreen contentStyle={{ justifyContent: 'flex-start', paddingTop: 'var(--pf-space-6)' }}>
      <GuestCard elevated>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Stack gap={4}>
            <Masthead eyebrow="Hosts only" wordmark="Parfett Party" wordmarkSize={40} />
            <label className="pf-field" style={guestFieldStyle}>
              <GuestLabel>Email</GuestLabel>
              <input
                className="pf-input"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="pf-field" style={guestFieldStyle}>
              <GuestLabel>Password</GuestLabel>
              <input
                className="pf-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={error ? { borderColor: 'var(--pf-guest-danger)' } : undefined}
              />
            </label>
            {error ? (
              <span style={{ color: 'var(--pf-guest-danger)', fontSize: 16 }}>{error}</span>
            ) : null}
            <Button type="submit" size="mobile" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </form>
      </GuestCard>
    </GuestScreen>
  );
}
