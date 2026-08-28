import { Card, Heading, Stack } from '@parfett/design-system';

/**
 * Placeholder for the reward mini-game. Swap the contents of this file (see
 * ./README.md) — the rest of the app only depends on this `<Game />` export.
 */
export function Game() {
  return (
    <Card
      padding={5}
      style={{
        borderStyle: 'dashed',
        background: 'var(--pf-color-surface-sunken)',
        textAlign: 'center',
      }}
    >
      <Stack gap={2} align="center">
        <Heading level={3}>Secret mini-game</Heading>
        <p style={{ margin: 0, color: 'var(--pf-color-text-muted)' }}>
          Coming soon — thanks for RSVPing!
        </p>
      </Stack>
    </Card>
  );
}
