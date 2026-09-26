import { Stack } from '@parfett/design-system';
import { GuestScreen } from './GuestScreen';
import { GuestCard } from './GuestCard';
import { bodyStyle } from './styles';

/** G4 — loading. Skeleton in the shape of the form. */
export function GuestLoadingState({ message }: { message: string }) {
  return (
    <GuestScreen>
      <GuestCard>
        <Stack gap={3}>
          <span
            style={{
              fontFamily: 'var(--pf-guest-font-script)',
              fontSize: 30,
              textAlign: 'center',
              color: 'var(--pf-guest-ink)',
            }}
          >
            You&rsquo;re invited
          </span>
          <p style={{ ...bodyStyle, lineHeight: 1.5 }}>{message}</p>
          <Stack gap={2}>
            <div
              style={{
                height: 14,
                width: '62%',
                borderRadius: 999,
                background: 'var(--pf-guest-sunken)',
              }}
            />
            <div
              style={{
                height: 14,
                width: '88%',
                borderRadius: 999,
                background: 'var(--pf-guest-sunken)',
              }}
            />
            <div style={{ height: 48, borderRadius: 8, background: 'var(--pf-guest-sunken)' }} />
          </Stack>
        </Stack>
      </GuestCard>
    </GuestScreen>
  );
}
