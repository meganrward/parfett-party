import { useMemo, useState } from 'react';
import { Button, Heading, Stack } from '@parfett/design-system';
import { hasNewPartyDraft, useSuperParties } from '../../lib/hooks/parties-admin';
import type { Party, PartyInput } from '../../lib/supabase/api-types';
import {
  AssignHosts,
  DetailEmpty,
  GeneratePanel,
  muted,
  PartyEditor,
  RailRow,
  twoCol,
} from '../../components/admin/parties';

export function Parties() {
  const { parties, loading, error, reload, create, update } = useSuperParties();
  const [selection, setSelection] = useState<string | 'new' | null>(() =>
    hasNewPartyDraft() ? 'new' : null,
  );

  const handleSave = async (values: PartyInput, party: Party | null) => {
    if (party) {
      return update(party.id, values);
    }
    const created = await create(values);
    setSelection(created.id);
    return created;
  };

  const selectedParty = useMemo(
    () =>
      selection && selection !== 'new' ? (parties.find((p) => p.id === selection) ?? null) : null,
    [parties, selection],
  );

  function renderDetail() {
    if (selection === 'new') {
      return <PartyEditor party={null} onSave={handleSave} />;
    }
    if (selectedParty) {
      return (
        <Stack gap={4}>
          <PartyEditor party={selectedParty} onSave={handleSave} />
          <div style={twoCol}>
            <AssignHosts partyId={selectedParty.id} />
            <GeneratePanel party={selectedParty} />
          </div>
        </Stack>
      );
    }
    return <DetailEmpty onNew={() => setSelection('new')} />;
  }

  return (
    <main style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>
      <aside
        style={{
          flex: 'none',
          width: 320,
          borderRight: '1px solid var(--pf-color-border)',
          background: 'var(--pf-color-surface)',
          padding: 'var(--pf-space-4)',
        }}
      >
        <Stack gap={3}>
          <Stack direction="row" gap={3} align="center" justify="space-between">
            <Heading level={1} style={{ fontSize: 'var(--pf-font-size-lg)' }}>
              Parties
            </Heading>
            <Button size="sm" onClick={() => setSelection('new')}>
              New party
            </Button>
          </Stack>

          {loading ? <p style={muted}>Loading…</p> : null}
          {error ? (
            <Stack gap={2}>
              <span style={{ color: 'var(--pf-color-danger)' }}>Failed to load parties</span>
              <Button size="sm" variant="secondary" onClick={() => void reload()}>
                Try again
              </Button>
            </Stack>
          ) : null}

          {!loading && !error && parties.length === 0 ? (
            <p style={muted}>No parties yet — create the first one.</p>
          ) : null}

          <Stack gap={1}>
            {parties.map((p) => (
              <RailRow
                key={p.id}
                party={p}
                selected={selection === p.id}
                onSelect={() => setSelection((s) => (s === p.id ? null : p.id))}
              />
            ))}
          </Stack>
        </Stack>
      </aside>

      <div style={{ flex: 1, minWidth: 0, padding: 'var(--pf-space-5)' }}>{renderDetail()}</div>
    </main>
  );
}
