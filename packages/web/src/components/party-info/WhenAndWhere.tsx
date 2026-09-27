import { Stack } from '@parfett/design-system';
import type { inviteWhenParts } from '../../lib/utils/calendar';

const addressStyle = { margin: 0, fontSize: 16, color: 'var(--pf-guest-muted)' } as const;

export function WhenAndWhere({
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
