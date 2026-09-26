import { useState } from 'react';
import { Button, Masthead, SegmentedControl, Stack } from '@parfett/design-system';
import { GuestScreen } from './GuestScreen';
import { GuestCard } from './GuestCard';
import { GuestLabel } from './GuestLabel';
import { GuestHint } from './GuestHint';
import { guestFieldStyle } from './styles';
import { RSVP_OPTIONS } from './constants';
import type { GuestDraft } from '../../lib/hooks/guest-flow';
import type { RsvpStatus } from '../../lib/utils/guests';

// ---------------------------------------------------------------------------
// G1 — first response
// ---------------------------------------------------------------------------

export function FirstResponse({
  partyName,
  onSubmit,
}: {
  partyName: string;
  onSubmit: (draft: GuestDraft) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!status || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim() || null, status });
      // On success the parent navigates away; leave the bar in its busy state.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your response');
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      style={{ display: 'contents' }}
    >
      <GuestScreen
        bar={
          <Button type="submit" size="mobile" disabled={!status || busy}>
            {busy ? 'Saving…' : 'Save my response'}
          </Button>
        }
      >
        <Stack gap={3} align="center" style={{ textAlign: 'center' }}>
          <Masthead eyebrow="You’re invited" wordmark={partyName} wordmarkSize={46} />
          <p
            style={{
              margin: 0,
              fontSize: 17,
              lineHeight: 1.5,
              color: 'var(--pf-guest-muted)',
              textWrap: 'pretty',
            }}
          >
            Let us know if you can make it, then unlock the details.
          </p>
        </Stack>

        <GuestCard>
          <Stack gap={5}>
            <label className="pf-field" style={guestFieldStyle}>
              <GuestLabel>Your name or nickname</GuestLabel>
              <GuestHint>Optional — shown to others who scan this card.</GuestHint>
              <input
                className="pf-input"
                placeholder="e.g. Sam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
              />
            </label>
            <Stack gap={2}>
              <GuestLabel>Are you coming?</GuestLabel>
              <SegmentedControl
                label="Are you coming?"
                options={RSVP_OPTIONS}
                value={status}
                onChange={setStatus}
                fullWidth
              />
              <GuestHint>
                Nothing is pre-selected — the save button stays disabled until you pick.
              </GuestHint>
            </Stack>
            {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
          </Stack>
        </GuestCard>
      </GuestScreen>
    </form>
  );
}
