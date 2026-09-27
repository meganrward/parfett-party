import { Link, Navigate, useParams } from 'react-router-dom';
import { Card, DotRule, Heading, Stack } from '@parfett/design-system';
import {
  GuestEyebrow,
  GuestErrorState,
  GuestLoadingState,
  GuestScreen,
  GuestUnknownCodeState,
} from '../components/guest';
import { WhenAndWhere, WhosComing, AddToCalendar } from '../components/party-info';
import { usePartyInfo } from '../lib/hooks/party-info';
import { qrInfoToCalendarEvent } from '../lib/supabase/api-mappers';
import { inviteWhenParts } from '../lib/utils/calendar';
import { Game } from '../game';

const detailBody = {
  margin: 0,
  fontSize: 16.5,
  lineHeight: 1.6,
  color: 'var(--pf-guest-muted)',
  textWrap: 'pretty',
} as const;

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

        <WhosComing
          count={info.showGuestCount ? info.partyGuestCount : null}
          names={info.showGuestList ? state.partyGuestNames : []}
        />

        <AddToCalendar event={calendarEvent} />
      </Card>

      <Game />
    </GuestScreen>
  );
}
