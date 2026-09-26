import type { CSSProperties, ReactNode } from 'react';

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
