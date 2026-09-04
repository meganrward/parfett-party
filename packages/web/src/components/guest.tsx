import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { Button, Card, Heading, Stack } from '@parfett/design-system';

/**
 * Guest-palette screen shell — the invite-card system shared by the guest flow
 * (G1–G4) and admin sign-in (H1): a paper page that fills the viewport, a
 * content column capped at ~480px and centred, and an optional sticky bottom
 * bar that keeps the primary action in thumb reach while the body scrolls.
 */
export function GuestScreen({
  children,
  bar,
  contentStyle,
}: {
  children: ReactNode;
  bar?: ReactNode;
  contentStyle?: CSSProperties;
}) {
  return (
    <main
      className="pf-guest"
      style={{
        minHeight: '100dvh',
        background: 'var(--pf-guest-paper)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--pf-space-5)',
            padding: 'var(--pf-space-5) 24px',
            ...contentStyle,
          }}
        >
          {children}
        </div>
        {bar ? (
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              padding: '16px 24px 28px',
              borderTop: '1px solid var(--pf-guest-border)',
              background: 'rgba(251, 250, 247, 0.95)',
            }}
          >
            {bar}
          </div>
        ) : null}
      </div>
    </main>
  );
}

/** A guest-palette field label (Playfair via `.pf-guest` scope). */
export function GuestLabel({ children }: { children: ReactNode }) {
  return <span className="pf-field__label">{children}</span>;
}

/** The tracked small-caps line from the invite card. */
export function GuestEyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--pf-guest-font-display)',
        fontWeight: 500,
        fontSize: 13,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        color: 'var(--pf-guest-action)',
      }}
    >
      {children}
    </span>
  );
}

/** A guest-palette hint line. */
export function GuestHint({ children }: { children: ReactNode }) {
  return <span className="pf-field__hint">{children}</span>;
}

/** Playfair 600 — the guest heading voice. Merge into a `<Heading>` style prop. */
export const guestHeadingStyle: CSSProperties = {
  fontFamily: 'var(--pf-guest-font-display)',
  fontWeight: 600,
};

export const guestFieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--pf-space-2)',
};

/** White card with the invite-card padding — the surface for every guest state. */
export function GuestCard({ children, style, ...rest }: ComponentProps<typeof Card>) {
  return (
    <Card style={{ padding: 20, ...style }} {...rest}>
      {children}
    </Card>
  );
}

const bodyStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.55,
  color: 'var(--pf-guest-muted)',
  textWrap: 'pretty',
};

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
