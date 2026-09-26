import type { ReactNode } from 'react';

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
