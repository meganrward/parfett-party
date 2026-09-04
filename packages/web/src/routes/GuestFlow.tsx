import { useState, type CSSProperties } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Heading,
  Masthead,
  SegmentedControl,
  Stack,
  StatusPill,
} from '@parfett/design-system';
import {
  GuestCard,
  GuestErrorState,
  GuestHint,
  GuestLabel,
  GuestLoadingState,
  GuestScreen,
  GuestUnknownCodeState,
  guestFieldStyle,
  guestHeadingStyle,
} from '../components/guest';
import { useGuestFlow, type GuestDraft } from '../lib/guest-flow';
import {
  guestDisplayName,
  rsvpStatusLabel,
  rsvpStatusTone,
  type Guest,
  type RsvpStatus,
} from '../lib/guests';

const RSVP_OPTIONS = [
  { label: 'Going', value: 'going' },
  { label: 'Not going', value: 'not_going' },
] as const;

/** Override the segmented track to sit on white (the "you" row). */
const WHITE_TRACK = { '--pf-color-surface-sunken': '#fff' } as CSSProperties;

/** The "you're on the list" acknowledgement at the top of the guest list. */
function SavedPanel({ guest }: { guest: Guest }) {
  return (
    <div
      style={{
        background: 'var(--pf-guest-blue-tint)',
        border: '1px solid var(--pf-guest-blue-border)',
        borderRadius: 'var(--pf-radius-lg)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--pf-guest-font-display)',
          fontWeight: 500,
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'var(--pf-guest-action)',
        }}
      >
        Thank you — you&rsquo;re on the list
      </span>
      <p style={{ margin: 0, fontSize: 16, color: 'var(--pf-guest-muted)' }}>
        {guestDisplayName(guest)} · {rsvpStatusLabel(guest.rsvpStatus)}. Tap any name to change a
        response.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// G1 — first response
// ---------------------------------------------------------------------------

function FirstResponse({
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

// ---------------------------------------------------------------------------
// G2 — the card's guest list
// ---------------------------------------------------------------------------

function YouPill() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 10px',
        borderRadius: 999,
        background: 'var(--pf-guest-action)',
        color: '#fff',
        fontFamily: 'var(--pf-guest-font-display)',
        fontWeight: 600,
        fontSize: 12.5,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      You
    </span>
  );
}

function GuestRow({
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

function AddAnotherGuest({ onAdd }: { onAdd: (draft: GuestDraft) => Promise<void> }) {
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

function GuestList({
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

// ---------------------------------------------------------------------------

export function GuestFlow() {
  const params = useParams();
  const slug = params.slug ?? '';
  const token = params.token ?? '';
  const navigate = useNavigate();
  const flow = useGuestFlow(slug, token);

  if (flow.redirectTo) {
    return <Navigate to={flow.redirectTo} replace />;
  }
  if (flow.loading) {
    return <GuestLoadingState message="Loading your invite…" />;
  }
  if (flow.notFound) {
    return <GuestUnknownCodeState />;
  }
  if (flow.error) {
    return <GuestErrorState message={flow.error} onRetry={() => void flow.actions.reload()} />;
  }

  const partyName = flow.info?.partyName ?? 'the party';
  const infoPath = `/${slug}/c/${token}/info`;

  if (flow.guests.length === 0) {
    return (
      <FirstResponse
        partyName={partyName}
        onSubmit={async (draft) => {
          await flow.actions.addGuest(draft);
          navigate(infoPath);
        }}
      />
    );
  }

  return (
    <GuestList
      partyName={partyName}
      guests={flow.guests}
      onEdit={(id, draft) => flow.actions.editGuest(id, draft)}
      onAdd={(draft) => flow.actions.addGuest(draft)}
      onContinue={() => navigate(infoPath)}
    />
  );
}
