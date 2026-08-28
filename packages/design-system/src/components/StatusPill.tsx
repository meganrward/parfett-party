import type { HTMLAttributes } from 'react';

export type StatusTone = 'neutral' | 'positive' | 'negative' | 'warning';

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

const toneStyles: Record<StatusTone, { bg: string; fg: string }> = {
  neutral: { bg: 'var(--pf-color-surface-sunken)', fg: 'var(--pf-color-text-muted)' },
  positive: { bg: 'var(--pf-color-success-subtle)', fg: 'var(--pf-color-success)' },
  negative: { bg: 'var(--pf-color-danger-subtle)', fg: 'var(--pf-color-danger)' },
  warning: { bg: 'var(--pf-color-warning-subtle)', fg: 'var(--pf-color-warning)' },
};

export function StatusPill({ tone = 'neutral', style, ...rest }: StatusPillProps) {
  const { bg, fg } = toneStyles[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.15rem 0.6rem',
        borderRadius: 'var(--pf-radius-pill)',
        background: bg,
        color: fg,
        fontSize: 'var(--pf-font-size-sm)',
        fontWeight: 'var(--pf-font-weight-medium)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    />
  );
}
