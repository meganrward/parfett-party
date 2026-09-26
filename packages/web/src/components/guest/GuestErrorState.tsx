import { Button, Heading, Stack } from '@parfett/design-system';
import { GuestScreen } from './GuestScreen';
import { GuestCard } from './GuestCard';
import { bodyStyle, guestHeadingStyle } from './styles';

/** G4 — something failed; offer a retry. */
export function GuestErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <GuestScreen>
      <GuestCard>
        <Stack gap={3}>
          <Heading level={2} style={{ ...guestHeadingStyle, fontSize: 24 }}>
            Something went wrong
          </Heading>
          <p style={{ ...bodyStyle, lineHeight: 1.5 }}>{message}</p>
          <Button variant="secondary" size="mobile" onClick={onRetry}>
            Try again
          </Button>
        </Stack>
      </GuestCard>
    </GuestScreen>
  );
}
