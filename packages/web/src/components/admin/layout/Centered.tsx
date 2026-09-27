import type { ReactNode } from 'react';

export function Centered({ children }: { children: ReactNode }) {
  return (
    <main
      style={{ maxWidth: 400, margin: '0 auto', padding: 'var(--pf-space-7) var(--pf-space-5)' }}
    >
      <p style={{ color: 'var(--pf-color-text-muted)' }}>{children}</p>
    </main>
  );
}
