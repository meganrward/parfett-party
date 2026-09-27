import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Heading, Stack } from '@parfett/design-system';
import * as api from '../../../lib/supabase/api';
import type { HostRow } from '../../../lib/supabase/api-types';
import { muted } from './styles';

// ---------------------------------------------------------------------------
// S2 — hosts panel
// ---------------------------------------------------------------------------

export function AssignHosts({ partyId }: { partyId: string }) {
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [all, current] = await Promise.all([api.listHosts(), api.listPartyHosts(partyId)]);
      if (active) {
        setHosts(all.filter((h) => !h.isAdmin));
        setSelected(new Set(current));
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [partyId]);

  const toggle = (userId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });

  const save = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await api.setPartyHosts(partyId, [...selected]);
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save access');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding={5}>
      <Stack gap={3}>
        <Heading level={3}>Hosts for this party</Heading>
        <p style={{ ...muted, margin: 0, fontSize: 'var(--pf-font-size-sm)' }}>
          Who can see the guest list and code sheet. The admin account always can.
        </p>
        {hosts.length === 0 ? (
          <p style={muted}>No host accounts yet — add them under Hosts.</p>
        ) : (
          hosts.map((h) => (
            <Checkbox
              key={h.userId}
              label={h.name}
              checked={selected.has(h.userId)}
              onChange={() => toggle(h.userId)}
            />
          ))
        )}
        <Stack direction="row" gap={3} align="center">
          <Button variant="secondary" disabled={busy} onClick={() => void save()}>
            Save access
          </Button>
          {status ? <span style={muted}>{status}</span> : null}
        </Stack>
      </Stack>
    </Card>
  );
}
