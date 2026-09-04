import { Link, Navigate, useParams } from 'react-router-dom';
import { Button, Card, DotRule, Heading, Stack } from '@parfett/design-system';
import {
  GuestEyebrow,
  GuestErrorState,
  GuestLoadingState,
  GuestScreen,
  GuestUnknownCodeState,
  guestHeadingStyle,
} from '../components/guest';
import { usePartyInfo } from '../lib/party-info';
import { qrInfoToCalendarEvent } from '../lib/api-mappers';
import {
  googleCalendarUrl,
  hasCalendarInfo,
  icsContent,
  icsDownloadFilename,
  inviteWhenParts,
} from '../lib/calendar';
import { downloadTextFile } from '../lib/download';
import { Game } from '../game';

const detailBody = {
  margin: 0,
  fontSize: 16.5,
  lineHeight: 1.6,
  color: 'var(--pf-guest-muted)',
  textWrap: 'pretty',
} as const;

const addressStyle = { margin: 0, fontSize: 16, color: 'var(--pf-guest-muted)' } as const;

function WhenAndWhere({
  when,
  location,
}: {
  when: ReturnType<typeof inviteWhenParts>;
  location: string | null;
}) {
  if (!when) {
    return location ? <p style={addressStyle}>{location}</p> : null;
  }
  return (
    <Stack gap={1} align="center">
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--pf-guest-font-display)',
          fontWeight: 500,
          fontSize: 19,
          letterSpacing: '0.03em',
        }}
      >
        {when.time} · {when.day}
        <sup style={{ fontSize: '0.6em' }}>{when.ordinal}</sup> {when.monthYear}
      </p>
      {location ? <p style={addressStyle}>{location}</p> : null}
    </Stack>
  );
}

function AddToCalendar({ event }: { event: ReturnType<typeof qrInfoToCalendarEvent> }) {
  if (!hasCalendarInfo(event)) {
    return null;
  }
  const googleUrl = googleCalendarUrl(event);
  const ics = icsContent(event);

  return (
    <div
      style={{
        borderTop: '1px solid var(--pf-guest-blue-border)',
        background: 'var(--pf-guest-blue-tint)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Heading level={3} style={{ ...guestHeadingStyle, fontSize: 21, textAlign: 'center' }}>
        Add to calendar
      </Heading>
      {/* Buttons stack — never side by side; at 390px a row breaks the .ics label. */}
      <Stack gap={2}>
        {googleUrl ? (
          <a
            className="pf-button pf-button--primary pf-button--mobile"
            href={googleUrl}
            target="_blank"
            rel="noreferrer"
          >
            Google Calendar
          </a>
        ) : null}
        {ics ? (
          <Button
            variant="secondary"
            size="mobile"
            onClick={() =>
              downloadTextFile(icsDownloadFilename(event), ics, 'text/calendar;charset=utf-8')
            }
          >
            Apple / other (.ics)
          </Button>
        ) : null}
      </Stack>
    </div>
  );
}

export function PartyInfo() {
  const params = useParams();
  const slug = params.slug ?? '';
  const token = params.token ?? '';
  const state = usePartyInfo(slug, token);

  if (state.redirectTo) {
    return <Navigate to={state.redirectTo} replace />;
  }
  if (state.loading) {
    return <GuestLoadingState message="Loading party details…" />;
  }
  if (state.notFound) {
    return <GuestUnknownCodeState />;
  }
  if (state.error || !state.info) {
    return (
      <GuestErrorState
        message={state.error ?? 'We couldn’t reach the party details just now.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const { info } = state;
  const when = inviteWhenParts(info);
  const calendarEvent = qrInfoToCalendarEvent(info);

  return (
    <GuestScreen
      bar={
        <Link
          className="pf-button pf-button--secondary pf-button--mobile"
          to={`/${slug}/c/${token}`}
        >
          Back to the guest list
        </Link>
      }
    >
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Stack gap={4} align="center" style={{ padding: '22px 20px', textAlign: 'center' }}>
          <GuestEyebrow>You’re invited</GuestEyebrow>
          <Heading
            level={1}
            style={{
              fontFamily: 'var(--pf-guest-font-script)',
              fontWeight: 400,
              fontSize: 42,
              lineHeight: 1.15,
              color: 'var(--pf-guest-ink)',
            }}
          >
            {info.partyName}
          </Heading>

          <WhenAndWhere when={when} location={info.location} />

          <DotRule />

          <p style={detailBody}>{info.description ?? 'More details coming soon.'}</p>
        </Stack>

        <AddToCalendar event={calendarEvent} />
      </Card>

      <Game />
    </GuestScreen>
  );
}
