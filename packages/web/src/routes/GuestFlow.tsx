import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Heading,
  SegmentedControl,
  Stack,
  StatusPill,
  TextInput,
} from '@parfett/design-system';
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

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Card padding={6}>
        <Stack gap={5}>{children}</Stack>
      </Card>
    </main>
  );
}

/** Nickname + going/not-going, used both for the first RSVP and "add another guest". */
function GuestForm({
  submitLabel,
  onSubmit,
}: {
  submitLabel: string;
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
      setName('');
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your response');
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
    >
      <Stack gap={4}>
        <TextInput
          label="Your name or nickname"
          hint="Optional — shown to others who scan this card."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <SegmentedControl
          label="Are you coming?"
          options={RSVP_OPTIONS}
          value={status}
          onChange={setStatus}
        />
        {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
        <Button type="submit" disabled={!status || busy}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </Stack>
    </form>
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

  const commitName = () => {
    const next = name.trim() || null;
    if (next !== guest.name) {
      void onEdit({ name: next, status: guest.rsvpStatus });
    }
  };

  return (
    <Stack
      gap={2}
      role="group"
      aria-label={guestDisplayName(guest)}
      style={{
        borderTop: '1px solid var(--pf-color-border)',
        paddingTop: 'var(--pf-space-4)',
      }}
    >
      <Stack direction="row" gap={2} align="center" justify="space-between">
        <TextInput
          label={isYou ? 'Name (you)' : 'Name'}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          placeholder="Add a name"
        />
        <StatusPill tone={rsvpStatusTone(guest.rsvpStatus)}>
          {rsvpStatusLabel(guest.rsvpStatus)}
        </StatusPill>
      </Stack>
      <SegmentedControl
        label={`Update ${guestDisplayName(guest)}'s response`}
        options={RSVP_OPTIONS}
        value={guest.rsvpStatus}
        onChange={(status) => void onEdit({ name: guest.name, status })}
      />
    </Stack>
  );
}

export function GuestFlow() {
  const params = useParams();
  const slug = params.slug ?? '';
  const token = params.token ?? '';
  const navigate = useNavigate();
  const flow = useGuestFlow(slug, token);
  const [addingAnother, setAddingAnother] = useState(false);

  if (flow.redirectTo) {
    return <Navigate to={flow.redirectTo} replace />;
  }
  if (flow.loading) {
    return (
      <Page>
        <p style={{ color: 'var(--pf-color-text-muted)' }}>Loading your invite…</p>
      </Page>
    );
  }
  if (flow.notFound) {
    return (
      <Page>
        <Heading level={2}>We don&apos;t recognise that code</Heading>
        <p style={{ color: 'var(--pf-color-text-muted)' }}>
          Double-check the code on your card — it&apos;s easy to mix up letters and numbers.
        </p>
      </Page>
    );
  }
  if (flow.error) {
    return (
      <Page>
        <Heading level={2}>Something went wrong</Heading>
        <p style={{ color: 'var(--pf-color-text-muted)' }}>{flow.error}</p>
        <Button variant="secondary" onClick={() => void flow.actions.reload()}>
          Try again
        </Button>
      </Page>
    );
  }

  const partyName = flow.info?.partyName ?? 'the party';
  const infoPath = `/${slug}/c/${token}/info`;

  if (flow.guests.length === 0) {
    return (
      <Page>
        <Heading level={1}>{partyName}</Heading>
        <p style={{ color: 'var(--pf-color-text-muted)' }}>
          Let us know if you can make it, then unlock the party details.
        </p>
        <GuestForm
          submitLabel="Save my response"
          onSubmit={async (draft) => {
            await flow.actions.addGuest(draft);
            navigate(infoPath);
          }}
        />
      </Page>
    );
  }

  return (
    <Page>
      <Heading level={1}>{partyName}</Heading>
      <p style={{ color: 'var(--pf-color-text-muted)' }}>
        Everyone on this card so far. You can update anyone&apos;s response, or add another guest.
      </p>

      <Stack gap={2}>
        {flow.guests.map((guest) => (
          <GuestRow
            key={guest.id}
            guest={guest}
            isYou={flow.myGuestIds.has(guest.id)}
            onEdit={(draft) => flow.actions.editGuest(guest.id, draft)}
          />
        ))}
      </Stack>

      {addingAnother ? (
        <Stack
          gap={3}
          style={{ borderTop: '1px solid var(--pf-color-border)', paddingTop: 'var(--pf-space-4)' }}
        >
          <Heading level={3}>Add another guest</Heading>
          <GuestForm
            submitLabel="Add guest"
            onSubmit={async (draft) => {
              await flow.actions.addGuest(draft);
              setAddingAnother(false);
            }}
          />
        </Stack>
      ) : (
        <Button variant="secondary" onClick={() => setAddingAnother(true)}>
          Add another guest
        </Button>
      )}

      <Button onClick={() => navigate(infoPath)}>Continue to party details</Button>
    </Page>
  );
}
