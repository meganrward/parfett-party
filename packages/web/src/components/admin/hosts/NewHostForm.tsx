import { useState } from 'react';
import { Button, Card, Heading, Stack, TextInput } from '@parfett/design-system';
import * as api from '../../../lib/supabase/api';
import type { HostRow } from '../../../lib/supabase/api-types';
import {
  clearNewHostDraft,
  readNewHostDraft,
  writeNewHostDraft,
  type NewHostDraft,
} from '../../../lib/utils/host-draft';
import { muted, panel } from './styles';

export function NewHostForm({ onCreated }: { onCreated: (host: HostRow) => void }) {
  const [{ name, email }, setDraft] = useState<NewHostDraft>(readNewHostDraft);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  const setName = (next: string) =>
    setDraft((prev) => {
      const draft = { ...prev, name: next };
      writeNewHostDraft(draft);
      return draft;
    });
  const setEmail = (next: string) =>
    setDraft((prev) => {
      const draft = { ...prev, email: next };
      writeNewHostDraft(draft);
      return draft;
    });

  const submit = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    setCreated(false);
    try {
      const res = await api.invokeCreateHost({ name: name.trim(), email: email.trim() });
      onCreated(res.host);
      setCreated(true);
      setDraft({ name: '', email: '' });
      clearNewHostDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the host');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding={5}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Stack gap={3}>
          <Heading level={3}>New host</Heading>
          <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <TextInput
            label="Email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" disabled={busy}>
            {busy ? 'Adding…' : 'Add host'}
          </Button>

          {error ? (
            <div style={panel('bad')}>
              <Stack gap={1}>
                <span style={{ fontWeight: 'var(--pf-font-weight-medium)' }}>
                  Could not create the host
                </span>
                <span style={muted}>{error}</span>
              </Stack>
            </div>
          ) : null}

          {created ? (
            <div style={panel('ok')}>
              <Stack gap={2}>
                <span>Invite email sent — they can follow the link to set a password.</span>
                <Button size="sm" variant="ghost" onClick={() => setCreated(false)}>
                  Done
                </Button>
              </Stack>
            </div>
          ) : null}
        </Stack>
      </form>
    </Card>
  );
}
