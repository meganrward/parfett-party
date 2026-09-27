import type { CSSProperties } from 'react';

export const muted = { color: 'var(--pf-color-text-muted)' } as const;
export const mono = { fontFamily: 'var(--pf-font-mono)' } as const;

export const twoCol: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 'var(--pf-space-4)',
};

export const spanBoth: CSSProperties = { gridColumn: '1 / -1' };

export const savedButtonStyle = {
  ['--_bg' as string]: 'var(--pf-color-success)',
} as CSSProperties;
