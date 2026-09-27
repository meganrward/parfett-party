import type { ReactNode } from 'react';

const muted = { color: 'var(--pf-color-text-muted)' } as const;

export function Page({ children, maxWidth = 900 }: { children: ReactNode; maxWidth?: number }) {
  return (
    <main style={{ maxWidth, margin: '0 auto', padding: 'var(--pf-space-6) var(--pf-space-5)' }}>
      <div style={muted}>{children}</div>
    </main>
  );
}
