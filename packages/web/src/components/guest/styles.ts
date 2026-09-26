import type { CSSProperties } from 'react';

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

export const bodyStyle: CSSProperties = {
  margin: 0,
  fontSize: 16,
  lineHeight: 1.55,
  color: 'var(--pf-guest-muted)',
  textWrap: 'pretty',
};
