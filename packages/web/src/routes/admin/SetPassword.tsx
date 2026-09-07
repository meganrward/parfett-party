import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Masthead, Stack } from '@parfett/design-system';
import { GuestCard, GuestLabel, GuestScreen, guestFieldStyle } from '../../components/guest';
import { supabase } from '../../lib/supabase';

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
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set password');
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
            <Masthead eyebrow="Hosts only" wordmark="Set your password" wordmarkSize={32} />
            <label className="pf-field" style={guestFieldStyle}>
              <GuestLabel>New password</GuestLabel>
              <input
                className="pf-input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <label className="pf-field" style={guestFieldStyle}>
              <GuestLabel>Confirm password</GuestLabel>
              <input
                className="pf-input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={error ? { borderColor: 'var(--pf-guest-danger)' } : undefined}
              />
            </label>
            {error ? (
              <span style={{ color: 'var(--pf-guest-danger)', fontSize: 16 }}>{error}</span>
            ) : null}
            <Button type="submit" size="mobile" disabled={busy}>
              {busy ? 'Saving…' : 'Set password'}
            </Button>
          </Stack>
        </form>
      </GuestCard>
    </GuestScreen>
  );
}
