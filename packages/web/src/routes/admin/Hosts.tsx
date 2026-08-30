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

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Stack gap={4}>
        <Heading level={1}>Hosts</Heading>
        <p style={muted}>
          New host accounts are created in the Supabase dashboard (Authentication → Users) for now,
          then appear here. You can rename them; the admin flag stays on the shared admin account.
        </p>

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
