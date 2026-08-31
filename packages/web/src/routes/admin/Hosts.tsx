import { useEffect, useState } from 'react';
import { Button, Card, Heading, Stack, StatusPill, TextInput } from '@parfett/design-system';
import * as api from '../../lib/api';
import type { HostRow } from '../../lib/api-types';

const muted = { color: 'var(--pf-color-text-muted)' } as const;

function HostRowItem({
  host,
  onRename,
}: {
  host: HostRow;
  onRename: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(host.name);
  const [saving, setSaving] = useState(false);

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

  return (
    <Card padding={4}>
      <Stack direction="row" gap={3} align="center" justify="space-between" wrap>
        <TextInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void commit()}
        />
        {host.isAdmin ? <StatusPill tone="warning">Admin</StatusPill> : null}
      </Stack>
    </Card>
  );
}

function NewHostForm({ onCreated }: { onCreated: (host: HostRow) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ invited: boolean; setupLink: string | null } | null>(null);

  const submit = async () => {
    if (busy) {
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.invokeCreateHost({ name: name.trim(), email: email.trim() });
      onCreated(res.host);
      setResult({ invited: res.invited, setupLink: res.setupLink });
      setName('');
      setEmail('');
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
          {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
          {result ? (
            <Stack gap={1}>
              <span style={muted}>
                {result.invited
                  ? 'Invite email sent.'
                  : 'Host added. Send them the link below to set a password:'}
              </span>
              {result.setupLink ? (
                <TextInput label="Setup link" value={result.setupLink} readOnly />
              ) : null}
            </Stack>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? 'Adding…' : 'Add host'}
          </Button>
        </Stack>
      </form>
    </Card>
  );
}

export function Hosts() {
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setHosts(await api.listHosts());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hosts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rename = async (host: HostRow, name: string) => {
    await api.upsertHost({ userId: host.userId, name, isAdmin: host.isAdmin });
    setHosts((prev) => prev.map((h) => (h.userId === host.userId ? { ...h, name } : h)));
  };

  const onCreated = (host: HostRow) =>
    setHosts((prev) => (prev.some((h) => h.userId === host.userId) ? prev : [...prev, host]));

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Stack gap={4}>
        <Heading level={1}>Hosts</Heading>
        <p style={muted}>
          Add a host by name + email. They get an invite (or a setup link you can forward). The
          admin flag stays on the shared admin account.
        </p>

        <NewHostForm onCreated={onCreated} />

        {loading ? <p style={muted}>Loading…</p> : null}
        {error ? (
          <Stack gap={2}>
            <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span>
            <Button variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          </Stack>
        ) : null}

        {hosts.map((host) => (
          <HostRowItem key={host.userId} host={host} onRename={(name) => rename(host, name)} />
        ))}
      </Stack>
    </main>
  );
}
