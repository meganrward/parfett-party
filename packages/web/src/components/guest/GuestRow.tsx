import { useState } from 'react';
import { Card, SegmentedControl, Stack, StatusPill } from '@parfett/design-system';
import { GuestLabel } from './GuestLabel';
import { YouPill } from './YouPill';
import { RSVP_OPTIONS, WHITE_TRACK } from './constants';
import type { GuestDraft } from '../../lib/hooks/guest-flow';
import {
  guestDisplayName,
  rsvpStatusLabel,
  rsvpStatusTone,
  type Guest,
} from '../../lib/utils/guests';

// ---------------------------------------------------------------------------
// G2 — the card's guest list
// ---------------------------------------------------------------------------

export function GuestRow({
  guest,
  isYou,
  onEdit,
}: {
  guest: Guest;
  isYou: boolean;
  onEdit: (draft: GuestDraft) => Promise<void>;
}) {
  const [name, setName] = useState(guest.name ?? '');
  const nameLabel = isYou ? 'Name (you)' : 'Name';

  const commitName = () => {
    const next = name.trim() || null;
    if (next !== guest.name) {
      void onEdit({ name: next, status: guest.rsvpStatus });
    }
  };

  return (
    <Card
      role="group"
      aria-label={guestDisplayName(guest)}
      style={{
        padding: 16,
        ...(isYou
          ? {
              background: 'var(--pf-guest-blue-tint)',
              border: '1px solid var(--pf-guest-blue-border)',
              borderLeft: '3px solid var(--pf-guest-blue-light)',
            }
          : null),
      }}
    >
      <Stack gap={3}>
        <Stack direction="row" gap={2} align="center" justify="space-between">
          <Stack direction="row" gap={2} align="center">
            <GuestLabel>Name</GuestLabel>
            {isYou ? <YouPill /> : null}
          </Stack>
          <StatusPill
            tone={rsvpStatusTone(guest.rsvpStatus)}
            style={
              isYou
                ? {
                    background: '#fff',
                    border: '1px solid rgba(47, 95, 120, 0.4)',
                    color: 'var(--pf-guest-action)',
                  }
                : undefined
            }
          >
            {rsvpStatusLabel(guest.rsvpStatus)}
          </StatusPill>
        </Stack>
        <input
          className="pf-input"
          aria-label={nameLabel}
          value={name}
          placeholder="Add a name"
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          style={isYou ? { borderColor: 'var(--pf-guest-blue-border)' } : undefined}
        />
        <div style={isYou ? WHITE_TRACK : undefined}>
          <SegmentedControl
            label={`Update ${guestDisplayName(guest)}'s response`}
            options={RSVP_OPTIONS}
            value={guest.rsvpStatus}
            onChange={(status) => void onEdit({ name: guest.name, status })}
            fullWidth
          />
        </div>
      </Stack>
    </Card>
  );
}
