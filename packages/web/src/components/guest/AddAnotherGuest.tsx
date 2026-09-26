import { useState } from 'react';
import { Button, Heading, SegmentedControl, Stack } from '@parfett/design-system';
import { GuestLabel } from './GuestLabel';
import { GuestHint } from './GuestHint';
import { guestFieldStyle, guestHeadingStyle } from './styles';
import { RSVP_OPTIONS } from './constants';
import type { GuestDraft } from '../../lib/hooks/guest-flow';
import type { RsvpStatus } from '../../lib/utils/guests';

export function AddAnotherGuest({ onAdd }: { onAdd: (draft: GuestDraft) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" size="mobile" onClick={() => setOpen(true)}>
        Add another guest
      </Button>
    );
  }

  const submit = async () => {
    if (!status || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onAdd({ name: name.trim() || null, status });
      setOpen(false);
      setName('');
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the guest');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      style={{
        borderTop: '1px solid var(--pf-guest-border)',
        paddingTop: 18,
      }}
    >
      <Stack gap={3}>
        <Heading level={3} style={{ ...guestHeadingStyle, fontSize: 21 }}>
          Add another guest
        </Heading>
        <label className="pf-field" style={guestFieldStyle}>
          <GuestLabel>Their name or nickname</GuestLabel>
          <GuestHint>Optional — shown to others who scan this card.</GuestHint>
          <input
            className="pf-input"
            placeholder="e.g. Alex"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </label>
        <Stack gap={2}>
          <GuestLabel>Are they coming?</GuestLabel>
          <SegmentedControl
            label="Are they coming?"
            options={RSVP_OPTIONS}
            value={status}
            onChange={setStatus}
            fullWidth
          />
        </Stack>
        {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
        <Button type="submit" variant="secondary" size="mobile" disabled={!status || busy}>
          {busy ? 'Adding…' : 'Add guest'}
        </Button>
      </Stack>
    </form>
  );
}
