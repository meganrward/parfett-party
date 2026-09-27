import type { ReactNode } from 'react';
import { spanBoth } from './styles';

export function Field({
  label,
  error,
  span,
  children,
}: {
  label: string;
  error?: string;
  span?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--pf-space-1)',
        ...(span ? spanBoth : null),
      }}
    >
      <span
        style={{ fontSize: 'var(--pf-font-size-sm)', fontWeight: 'var(--pf-font-weight-medium)' }}
      >
        {label}
      </span>
      {children}
      {error ? <span style={{ color: 'var(--pf-color-danger)' }}>{error}</span> : null}
    </label>
  );
}
