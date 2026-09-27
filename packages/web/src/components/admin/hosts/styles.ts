import type { CSSProperties } from 'react';

export const muted = { color: 'var(--pf-color-text-muted)' } as const;

export const panel = (accent: 'ok' | 'bad'): CSSProperties => ({
  border: `1px solid ${accent === 'ok' ? 'var(--pf-color-brand-border, #ddcbfb)' : 'var(--pf-color-danger)'}`,
  background: accent === 'ok' ? 'var(--pf-color-brand-subtle)' : 'var(--pf-color-danger-subtle)',
  borderRadius: 'var(--pf-radius-md)',
  padding: 'var(--pf-space-4)',
});
