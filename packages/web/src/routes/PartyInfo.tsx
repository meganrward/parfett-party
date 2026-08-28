import { Navigate, useParams } from 'react-router-dom';
import { Button, Card, Heading, Stack } from '@parfett/design-system';
import { usePartyInfo } from '../lib/party-info';
import { qrInfoToCalendarEvent } from '../lib/api-mappers';
import {
  formatEventWhen,
  googleCalendarUrl,
  hasCalendarInfo,
  icsContent,
  icsDownloadFilename,
} from '../lib/calendar';
import { downloadTextFile } from '../lib/download';
import { Game } from '../game';

const muted = { margin: 0, color: 'var(--pf-color-text-muted)' } as const;

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: 'var(--pf-space-5)' }}>
      <Stack gap={5}>{children}</Stack>
    </main>
  );
}

function AddToCalendar({ event }: { event: ReturnType<typeof qrInfoToCalendarEvent> }) {
  if (!hasCalendarInfo(event)) {
    return null;
  }
  const googleUrl = googleCalendarUrl(event);
  const ics = icsContent(event);

  return (
    <Stack gap={3}>
      <Heading level={3}>Add to calendar</Heading>
      <Stack direction="row" gap={3} wrap>
        {googleUrl ? (
          <a
            className="pf-button pf-button--primary pf-button--md"
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
            onClick={() =>
              downloadTextFile(icsDownloadFilename(event), ics, 'text/calendar;charset=utf-8')
            }
          >
            Apple / other (.ics)
          </Button>
        ) : null}
      </Stack>
    </Stack>
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
    return (
      <Page>
        <p style={muted}>Loading party details…</p>
      </Page>
    );
  }
  if (state.notFound) {
    return (
      <Page>
        <Heading level={2}>We don&apos;t recognise that code</Heading>
        <p style={muted}>Double-check the code on your card.</p>
      </Page>
    );
  }
  if (state.error || !state.info) {
    return (
      <Page>
        <Heading level={2}>Something went wrong</Heading>
        <p style={muted}>{state.error ?? 'Please reload the page.'}</p>
      </Page>
    );
  }

  const { info } = state;
  const when = formatEventWhen(info);
  const calendarEvent = qrInfoToCalendarEvent(info);

  return (
    <Page>
      <Card padding={6}>
        <Stack gap={4}>
          <Heading level={1}>{info.partyName}</Heading>
          {when ? <p style={{ ...muted, color: 'var(--pf-color-text)' }}>{when}</p> : null}
          {info.location ? <p style={muted}>{info.location}</p> : null}
          <p style={muted}>{info.description ?? 'More details coming soon.'}</p>
          <AddToCalendar event={calendarEvent} />
        </Stack>
      </Card>

      <Game />
    </Page>
  );
}
