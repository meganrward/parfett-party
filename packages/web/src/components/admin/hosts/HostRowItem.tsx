import { useState } from 'react';
import { Button, Card, Stack, StatusPill, TextInput } from '@parfett/design-system';
import type { HostRow } from '../../../lib/supabase/api-types';
import { muted } from './styles';

export function HostRowItem({
  host,
  onRename,
  onRemove,
  onResend,
}: {
  host: HostRow;
  onRename: (name: string) => Promise<void>;
  onRemove: () => Promise<void>;
  onResend: () => Promise<void>;
}) {
  const [name, setName] = useState(host.name);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const commit = async () => {
    const next = name.trim();
    if (!next || next === host.name || saving) {
      setName(host.name);
      return;
    }
    setSaving(true);
    try {
      await onRename(next);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (removing || !window.confirm(`Remove ${host.name}? They'll lose access immediately.`)) {
      return;
    }
    setRemoving(true);
    setRemoveError(null);
    try {
      await onRemove();
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Could not remove the host');
      setRemoving(false);
    }
  };

  const resend = async () => {
    if (resending) {
      return;
    }
    setResending(true);
    setResendError(null);
    setResent(false);
    try {
      await onResend();
      setResent(true);
    } catch (err) {
      setResendError(err instanceof Error ? err.message : 'Could not resend the invite');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card padding={4}>
      <Stack direction="row" gap={3} align="center" justify="space-between" wrap>
        <div style={{ maxWidth: 260, width: '100%' }}>
          <TextInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => void commit()}
          />
        </div>
        <Stack direction="row" gap={3} align="center">
          {saving ? (
            <span style={{ ...muted, fontSize: 'var(--pf-font-size-sm)' }}>Saving…</span>
          ) : null}
          {removeError ? (
            <span style={{ color: 'var(--pf-color-danger)', fontSize: 'var(--pf-font-size-sm)' }}>
              {removeError}
            </span>
          ) : null}
          {resendError ? (
            <span style={{ color: 'var(--pf-color-danger)', fontSize: 'var(--pf-font-size-sm)' }}>
              {resendError}
            </span>
          ) : null}
          {resent ? (
            <span style={{ ...muted, fontSize: 'var(--pf-font-size-sm)' }}>Invite resent</span>
          ) : null}
          {host.status === 'pending' ? (
            <>
              <StatusPill tone="warning">Pending</StatusPill>
              <Button size="sm" variant="ghost" disabled={resending} onClick={() => void resend()}>
                {resending ? 'Resending…' : 'Resend email'}
              </Button>
            </>
          ) : null}
          {host.isAdmin ? <StatusPill tone="warning">Admin</StatusPill> : null}
          {!host.isAdmin ? (
            <Button size="sm" variant="ghost" disabled={removing} onClick={() => void remove()}>
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Card>
  );
}
