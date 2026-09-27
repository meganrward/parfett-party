import { Heading } from '@parfett/design-system';
import type { Party } from '../../../lib/supabase/api-types';
import { muted, mono } from './styles';

// ---------------------------------------------------------------------------
// S1 — two-pane shell
// ---------------------------------------------------------------------------

export function RailRow({
  party,
  selected,
  onSelect,
}: {
  party: Party;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 'var(--pf-space-3) var(--pf-space-4)',
        border: 'none',
        borderLeft: `3px solid ${selected ? 'var(--pf-color-brand)' : 'transparent'}`,
        background: selected ? 'var(--pf-color-brand-subtle)' : 'transparent',
        cursor: 'pointer',
        borderRadius: 'var(--pf-radius-sm)',
      }}
    >
      <Heading level={3} style={{ fontSize: 'var(--pf-font-size-md)' }}>
        {party.name}
      </Heading>
      <span style={{ ...muted, ...mono, fontSize: 'var(--pf-font-size-xs)' }}>
        /{party.slug} · {party.qrCount} codes
      </span>
    </button>
  );
}
