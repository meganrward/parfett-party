import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Heading, Stack, TextInput } from '@parfett/design-system';
import { supabase } from '../../lib/supabase';
import { activateOwnHost } from '../../lib/api';

/**
 * Shown after following an invite/recovery email link. `useAuthRecoveryRedirect`
 * (in App.tsx) routes here once Supabase has parsed the recovery session out of the
 * URL, so by the time this renders there's already a session — this just sets the
 * password on it.
 */
export function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) {
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) {
        throw new Error(updateErr.message);
      }
      try {
        await activateOwnHost();
      } catch {
        // Non-critical: worst case they show as "pending" until an admin notices.
      }
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set password');
      setBusy(false);
    }
  };

  return (
    <main style={{ maxWidth: 400, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Card padding={5}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <Stack gap={4}>
            <Heading level={1}>Set your password</Heading>
            <TextInput
              label="New password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextInput
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              error={error ?? undefined}
            />
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Set password'}
            </Button>
          </Stack>
        </form>
      </Card>
    </main>
  );
}
