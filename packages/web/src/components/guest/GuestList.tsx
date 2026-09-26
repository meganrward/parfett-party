import { Button, Masthead, Stack } from '@parfett/design-system';
import { GuestScreen } from './GuestScreen';
import { SavedPanel } from './SavedPanel';
import { GuestRow } from './GuestRow';
import { AddAnotherGuest } from './AddAnotherGuest';
import type { GuestDraft } from '../../lib/hooks/guest-flow';
import type { Guest } from '../../lib/utils/guests';

export function GuestList({
  partyName,
  guests,
  onEdit,
  onAdd,
  onContinue,
}: {
  partyName: string;
  guests: Guest[];
  onEdit: (id: string, draft: GuestDraft) => Promise<void>;
  onAdd: (draft: GuestDraft) => Promise<void>;
  onContinue: () => void;
}) {
  // The first guest holds the card; anyone below is a plus-one they added.
  const cardHolder = guests[0];

  return (
    <GuestScreen
      bar={
        <Button size="mobile" onClick={onContinue}>
          Continue to party details
        </Button>
      }
    >
      <Masthead eyebrow="Everyone on this card" wordmark={partyName} wordmarkSize={38} />

      {cardHolder?.rsvpStatus ? <SavedPanel guest={cardHolder} /> : null}

      <Stack gap={3}>
        {guests.map((guest, index) => (
          <GuestRow
            key={guest.id}
            guest={guest}
            isYou={index === 0}
            onEdit={(draft) => onEdit(guest.id, draft)}
          />
        ))}
      </Stack>

      <AddAnotherGuest onAdd={onAdd} />
    </GuestScreen>
  );
}
