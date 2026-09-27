import { Heading } from '@parfett/design-system';
import { guestHeadingStyle } from '../guest';

export function WhosComing({ count, names }: { count: number | null; names: string[] }) {
  if (count === null && names.length === 0) {
    return null;
  }
  return (
    <div
      style={{
        borderTop: '1px solid var(--pf-guest-border)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        textAlign: 'center',
      }}
    >
      <Heading level={3} style={{ ...guestHeadingStyle, fontSize: 21 }}>
        Who&rsquo;s coming
      </Heading>
      {count !== null ? (
        <p style={{ margin: 0, fontSize: 16, color: 'var(--pf-guest-muted)' }}>
          {count} guest{count === 1 ? '' : 's'} so far
        </p>
      ) : null}
      {names.length > 0 ? (
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6, color: 'var(--pf-guest-muted)' }}>
          {names.join(', ')}
        </p>
      ) : null}
    </div>
  );
}
