import { useState } from 'react';
import { Button, Card, SegmentedControl, Stack, StatusPill } from '@parfett/design-system';
import type { GuestEntry } from '../../../lib/hooks/admin-guests';
import { handedOutByLabel } from '../../../lib/utils/prefixes';
import { guestDisplayName, rsvpStatusLabel, rsvpStatusTone } from '../../../lib/utils/guests';
import type { GuestPatch } from '../../../lib/supabase/api-types';
import { muted } from './styles';

const RSVP_OPTIONS = [
  { label: 'Going', value: 'going' },
  { label: 'Not going', value: 'not_going' },
] as const;

export function GuestRowCard({
  entry,
  sameCardAs,
  onEdit,
  onRemove,
}: {
  entry: GuestEntry;
  sameCardAs: string | null;
  onEdit: (id: string, patch: GuestPatch) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { guest } = entry;
  const [name, setName] = useState(guest.name ?? '');

  const commitName = () => {
    const next = name.trim() || null;
    if (next !== guest.name) {
      void onEdit(guest.id, { name: next, status: guest.rsvpStatus });
    }
  };

  return (
    <Card role="group" aria-label={guestDisplayName(guest)} padding={4}>
      <Stack gap={3}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            aria-label={`Name for ${guestDisplayName(guest)}`}
            value={name}
            placeholder="No name"
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '11px 12px',
              border: '1px solid var(--pf-color-border)',
              borderRadius: 8,
              background: 'var(--pf-color-surface)',
              color: 'var(--pf-color-text)',
              fontSize: 16,
              fontWeight: 'var(--pf-font-weight-medium)',
            }}
          />
          <StatusPill tone={rsvpStatusTone(guest.rsvpStatus)}>
            {rsvpStatusLabel(guest.rsvpStatus)}
          </StatusPill>
        </div>

        <SegmentedControl
          label={`Response for ${guestDisplayName(guest)}`}
          options={RSVP_OPTIONS}
          value={guest.rsvpStatus}
          onChange={(status) => void onEdit(guest.id, { name: guest.name, status })}
          fullWidth
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            borderTop: '1px solid var(--pf-color-border)',
            paddingTop: 10,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span
              style={{ fontFamily: 'var(--pf-font-mono)', fontSize: 14, letterSpacing: '0.06em' }}
            >
              {entry.token}
            </span>
            <span style={{ ...muted, fontSize: 12 }}>
              handed out by {handedOutByLabel(entry.prefix)}
              {sameCardAs ? ` · same card as ${sameCardAs}` : ''}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void onRemove(guest.id)}>
            Remove
          </Button>
        </div>
      </Stack>
    </Card>
  );
}
