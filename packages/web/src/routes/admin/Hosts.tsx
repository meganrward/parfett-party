import { useEffect, useState } from 'react';
import { Button, Heading, Stack } from '@parfett/design-system';
import * as api from '../../lib/supabase/api';
import type { HostRow } from '../../lib/supabase/api-types';
import { HostRowItem, muted, NewHostForm } from '../../components/admin/hosts';

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

  const resend = async (host: HostRow) => {
    await api.invokeResendHostInvite(host.userId);
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
                onResend={() => resend(host)}
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
