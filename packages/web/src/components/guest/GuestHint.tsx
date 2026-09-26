import type { ReactNode } from 'react';

/** A guest-palette hint line. */
export function GuestHint({ children }: { children: ReactNode }) {
  return <span className="pf-field__hint">{children}</span>;
}
