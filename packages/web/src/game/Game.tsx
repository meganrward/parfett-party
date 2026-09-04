import { Heading } from '@parfett/design-system';

/**
 * Placeholder for the reward mini-game. Swap the contents of this file (see
 * ./README.md) — the rest of the app only depends on this `<Game />` export.
 * The dashed blue slot below is where the real game mounts on the party-details
 * screen (G3).
 */
export function Game() {
  return (
    <div
      style={{
        border: '1px dashed var(--pf-guest-blue-light)',
        borderRadius: 'var(--pf-radius-lg)',
        background: 'var(--pf-guest-blue-tint)',
        minHeight: 150,
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textAlign: 'center',
      }}
    >
      <Heading
        level={3}
        style={{
          fontFamily: 'var(--pf-guest-font-display)',
          fontWeight: 600,
          color: 'var(--pf-guest-ink)',
        }}
      >
        Secret mini-game
      </Heading>
      <p style={{ margin: 0, fontSize: 16, color: 'var(--pf-guest-muted)' }}>
        Coming soon — thanks for RSVPing!
      </p>
    </div>
  );
}
