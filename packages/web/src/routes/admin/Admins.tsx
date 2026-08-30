import { useEffect, useState } from 'react';
import { Button, Card, Heading, Stack, StatusPill, TextInput } from '@parfett/design-system';
import * as api from '../../lib/api';
import type { AdminRow } from '../../lib/api-types';

const muted = { color: 'var(--pf-color-text-muted)' } as const;

function AdminRowItem({
  admin,
  onRename,
}: {
  admin: AdminRow;
  onRename: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(admin.displayName);
  const [saving, setSaving] = useState(false);

  const commit = async () => {
    const next = name.trim();
    if (!next || next === admin.displayName || saving) {
      setName(admin.displayName);
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
          label="Display name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void commit()}
        />
        {admin.isSuper ? <StatusPill tone="warning">Super-admin</StatusPill> : null}
      </Stack>
    </Card>
  );
}

export function Admins() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setAdmins(await api.listAdmins());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rename = async (admin: AdminRow, displayName: string) => {
    await api.upsertAdmin({ userId: admin.userId, displayName, isSuper: admin.isSuper });
    setAdmins((prev) => prev.map((a) => (a.userId === admin.userId ? { ...a, displayName } : a)));
  };

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Stack gap={4}>
        <Heading level={1}>Admins</Heading>
        <p style={muted}>
          New housemate accounts are created in the Supabase dashboard (Authentication → Users),
          then appear here. You can rename them; the super-admin flag stays on the shared setup
          account.
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

        {admins.map((admin) => (
          <AdminRowItem key={admin.userId} admin={admin} onRename={(name) => rename(admin, name)} />
        ))}
      </Stack>
    </main>
  );
}
