import { Heading, Stack } from '@parfett/design-system';
import { GuestScreen } from './GuestScreen';
import { GuestCard } from './GuestCard';
import { bodyStyle, guestHeadingStyle } from './styles';

/** G4 — the token isn't one we know. */
export function GuestUnknownCodeState() {
  return (
    <GuestScreen>
      <GuestCard>
        <Stack gap={3}>
          <Heading level={2} style={{ ...guestHeadingStyle, fontSize: 24 }}>
            We don&apos;t recognise that code
          </Heading>
          <p style={bodyStyle}>
            Double-check the code on your card — it&apos;s easy to mix up letters and numbers.
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 8,
              background: 'var(--pf-guest-sand-tint)',
            }}
          >
            <span
              style={{
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 15,
                letterSpacing: '0.08em',
              }}
            >
              JX4-92K
            </span>
            <span style={{ fontSize: 14, color: 'var(--pf-guest-muted)' }}>
              printed on the back of your card
            </span>
          </div>
        </Stack>
      </GuestCard>
    </GuestScreen>
  );
}
