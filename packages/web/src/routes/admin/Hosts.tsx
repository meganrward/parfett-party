import { useEffect, useState, type CSSProperties } from 'react';
import { Button, Card, Heading, Stack, StatusPill, TextInput } from '@parfett/design-system';
import * as api from '../../lib/api';
import type { HostRow } from '../../lib/api-types';

const muted = { color: 'var(--pf-color-text-muted)' } as const;

const panel = (accent: 'ok' | 'bad'): CSSProperties => ({
  border: `1px solid ${accent === 'ok' ? 'var(--pf-color-brand-border, #ddcbfb)' : 'var(--pf-color-danger)'}`,
  background: accent === 'ok' ? 'var(--pf-color-brand-subtle)' : 'var(--pf-color-danger-subtle)',
  borderRadius: 'var(--pf-radius-md)',
  padding: 'var(--pf-space-4)',
});

function HostRowItem({
  host,
  onRename,
  onRemove,
}: {
  host: HostRow;
  onRename: (name: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const [name, setName] = useState(host.name);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

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
          {host.isAdmin ? (
            <StatusPill tone="warning">Admin</StatusPill>
          ) : (
            <Button size="sm" variant="ghost" disabled={removing} onClick={() => void remove()}>
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

function NewHostForm({ onCreated }: { onCreated: (host: HostRow) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ invited: boolean; mailError: string | null } | null>(null);

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
      setResult({ invited: res.invited, mailError: res.mailError });
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

          {result ? (
            <div style={panel(result.invited ? 'ok' : 'bad')}>
              <Stack gap={2}>
                <span>
                  {result.invited
                    ? 'Invite email sent — they can follow the link to set a password.'
                    : "Host added, but the set-password email couldn't be sent."}
                </span>
                {result.mailError ? <span style={muted}>{result.mailError}</span> : null}
                <Button size="sm" variant="ghost" onClick={() => setResult(null)}>
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

  const remove = async (host: HostRow) => {
    await api.invokeDeleteHost(host.userId);
    setHosts((prev) => prev.filter((h) => h.userId !== host.userId));
  };

  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 380px',
          gap: 'var(--pf-space-5)',
          alignItems: 'start',
        }}
      >
        <section>
          <Stack gap={4}>
            <Heading level={1}>Hosts</Heading>
            <p style={muted}>
              Add a host by name and email. They&apos;ll get an email with a link to set their
              password. The admin flag stays on the shared admin account.
            </p>

            {loading ? <p style={muted}>Loading…</p> : null}
            {error ? (
              <Stack gap={2}>
                <span style={{ color: 'var(--pf-color-danger)' }}>Failed to load hosts</span>
                <Button variant="secondary" onClick={() => void load()}>
                  Try again
                </Button>
              </Stack>
            ) : null}

            {hosts.map((host) => (
              <HostRowItem
                key={host.userId}
                host={host}
                onRename={(name) => rename(host, name)}
                onRemove={() => remove(host)}
              />
            ))}
          </Stack>
        </section>

        <aside style={{ position: 'sticky', top: 'var(--pf-space-5)' }}>
          <NewHostForm onCreated={onCreated} />
        </aside>
      </div>
    </main>
  );
}
