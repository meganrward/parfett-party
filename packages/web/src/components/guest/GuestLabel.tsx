import type { ReactNode } from 'react';

/** A guest-palette field label (Playfair via `.pf-guest` scope). */
export function GuestLabel({ children }: { children: ReactNode }) {
  return <span className="pf-field__label">{children}</span>;
}
