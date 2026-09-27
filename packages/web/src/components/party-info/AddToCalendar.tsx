import { Button, Heading, Stack } from '@parfett/design-system';
import { guestHeadingStyle } from '../guest';
import {
  googleCalendarUrl,
  hasCalendarInfo,
  icsContent,
  icsDownloadFilename,
} from '../../lib/utils/calendar';
import { downloadTextFile } from '../../lib/utils/download';
import type { qrInfoToCalendarEvent } from '../../lib/supabase/api-mappers';

export function AddToCalendar({ event }: { event: ReturnType<typeof qrInfoToCalendarEvent> }) {
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
