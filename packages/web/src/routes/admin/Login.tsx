import { useState } from 'react';
import { Button, Card, Heading, Stack, TextInput } from '@parfett/design-system';
import { signIn } from '../../lib/auth';

/** Shown by AdminLayout whenever there is no session. */
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
    <main
      style={{ maxWidth: 400, margin: '0 auto', padding: 'var(--pf-space-6) var(--pf-space-5)' }}
    >
      <Card padding={6}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Stack gap={4}>
            <Heading level={1}>Parfett admin</Heading>
            <TextInput
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextInput
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
            <Button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </Button>
          </Stack>
        </form>
      </Card>
    </main>
  );
}
