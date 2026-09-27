import type { CSSProperties } from 'react';

export const muted = { color: 'var(--pf-color-text-muted)' } as const;

export const fieldLabel: CSSProperties = { fontSize: 13, color: 'var(--pf-color-text-muted)' };

export const controlBox: CSSProperties = {
  padding: '13px 14px',
  border: '1px solid var(--pf-color-border)',
  borderRadius: 8,
  background: 'var(--pf-color-surface)',
  fontSize: 15,
  color: 'var(--pf-color-text)',
  width: '100%',
};

export const statValue: CSSProperties = {
  fontSize: 24,
  fontWeight: 'var(--pf-font-weight-bold)',
  lineHeight: 1.1,
};
