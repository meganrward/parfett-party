import { useEffect, useState } from 'react';
import { Card, Checkbox, Heading, Stack } from '@parfett/design-system';
import * as api from '../../../lib/supabase/api';
import type { Party } from '../../../lib/supabase/api-types';
import { muted } from './styles';

/** H-portal panel: hosts may flip guest visibility only when the admin has allowed it. */
export function GuestVisibilityPanel({
  party,
  onSaved,
}: {
  party: Party;
  onSaved: () => Promise<void>;
}) {
  const [showGuestList, setShowGuestList] = useState(party.showGuestList);
  const [showGuestCount, setShowGuestCount] = useState(party.showGuestCount);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setShowGuestList(party.showGuestList);
    setShowGuestCount(party.showGuestCount);
  }, [party.showGuestList, party.showGuestCount]);

  const save = async (next: { showGuestList: boolean; showGuestCount: boolean }) => {
    setBusy(true);
    setStatus(null);
    try {
      await api.setGuestVisibility(party.id, next);
      await onSaved();
      setStatus('Saved.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding={5}>
      <Stack gap={3}>
        <Heading level={3}>Guest visibility</Heading>
        <p style={{ ...muted, margin: 0, fontSize: 'var(--pf-font-size-sm)' }}>
          What guests see about the party as a whole, beyond who&apos;s on their own card.
        </p>
        {party.hostsCanEditVisibility ? (
          <>
            <Checkbox
              label="Show the full guest list to guests"
              checked={showGuestList}
              disabled={busy}
              onChange={(e) => {
                setShowGuestList(e.target.checked);
                void save({ showGuestList: e.target.checked, showGuestCount });
              }}
            />
            <Checkbox
              label="Show the total number of guests to guests"
              checked={showGuestCount}
              disabled={busy}
              onChange={(e) => {
                setShowGuestCount(e.target.checked);
                void save({ showGuestList, showGuestCount: e.target.checked });
              }}
            />
            {status ? <span style={muted}>{status}</span> : null}
          </>
        ) : (
          <p style={muted}>
            Guest list: {party.showGuestList ? 'shown' : 'hidden'} · Guest count:{' '}
            {party.showGuestCount ? 'shown' : 'hidden'}. Ask the admin to change these.
          </p>
        )}
      </Stack>
    </Card>
  );
}
