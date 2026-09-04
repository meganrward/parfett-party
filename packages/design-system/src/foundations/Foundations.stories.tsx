import type { Meta, StoryObj } from '@storybook/react';

/**
 * Visual token reference — the two palettes and the guest reading voice.
 * Mirrors the "components & tokens" board from the design handoff.
 */
const meta: Meta = {
  title: 'Foundations/Palette & Type',
  parameters: { layout: 'fullscreen', backgrounds: { default: 'surface' } },
};

export default meta;
type Story = StoryObj;

interface Swatch {
  name: string;
  value: string;
  ring?: boolean;
}

const GUEST_SWATCHES: Swatch[] = [
  { name: 'ink', value: '#14331f' },
  { name: 'action', value: '#2f5f78' },
  { name: 'action-hover', value: '#264d61' },
  { name: 'blue-light', value: '#91bcd1' },
  { name: 'blue-tint', value: '#e7f0f4', ring: true },
  { name: 'blue-border', value: '#c3dbe6', ring: true },
  { name: 'sand', value: '#beb48f' },
  { name: 'sand-tint', value: '#f1ece1', ring: true },
  { name: 'paper', value: '#fbfaf7', ring: true },
  { name: 'border', value: '#ddd7c8', ring: true },
  { name: 'muted', value: '#6f6a5e' },
  { name: 'sunken', value: '#f3f0e8', ring: true },
];

const GUEST_PILLS: Swatch[] = [
  { name: 'going', value: '#e6efe7', ring: true },
  { name: 'going text', value: '#1b4630' },
  { name: 'not going', value: '#f6e8e4', ring: true },
  { name: 'not going text', value: '#8f3a2f' },
  { name: 'awaiting', value: '#f2eddc', ring: true },
  { name: 'awaiting text', value: '#84702c' },
];

const HOST_SWATCHES: Swatch[] = [
  { name: 'brand', value: '#7c3aed' },
  { name: 'brand-subtle', value: '#f1e9fe', ring: true },
  { name: 'success', value: '#1a7f4b' },
  { name: 'danger', value: '#b3261e' },
  { name: 'warning', value: '#9a6700' },
  { name: 'sunken', value: '#f4f2ef', ring: true },
];

function SwatchGrid({ title, swatches }: { title: string; swatches: Swatch[] }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3
        style={{
          margin: 0,
          font: '700 12px/1 ui-monospace, Menlo, monospace',
          letterSpacing: '0.1em',
          color: '#6b6560',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 12,
        }}
      >
        {swatches.map((s) => (
          <div key={s.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                height: 52,
                borderRadius: 8,
                background: s.value,
                border: s.ring ? '1px solid #e4e0da' : undefined,
              }}
            />
            <span
              style={{
                font: '11px/1.4 ui-monospace, Menlo, monospace',
                color: '#6b6560',
              }}
            >
              {s.name}
              <br />
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export const Palette: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        padding: 32,
        background: '#fff',
        color: '#1d1b18',
      }}
    >
      <SwatchGrid title="Guest palette — from the invite card" swatches={GUEST_SWATCHES} />
      <SwatchGrid title="Guest status pills" swatches={GUEST_PILLS} />
      <SwatchGrid title="Host palette — unchanged" swatches={HOST_SWATCHES} />
    </div>
  ),
};

export const GuestTypography: Story = {
  render: () => (
    <div
      className="pf-guest"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 32,
        background: 'var(--pf-guest-paper)',
        color: 'var(--pf-guest-ink)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--pf-guest-font-display)',
          fontWeight: 500,
          fontSize: 13,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: 'var(--pf-guest-action)',
        }}
      >
        Eyebrow — Playfair Display, tracked caps
      </span>
      <span
        style={{
          fontFamily: 'var(--pf-guest-font-script)',
          fontSize: 46,
          lineHeight: 1.15,
        }}
      >
        19 Parfett Street
      </span>
      <span
        style={{
          fontFamily: 'var(--pf-guest-font-display)',
          fontWeight: 600,
          fontSize: 24,
          lineHeight: 1.25,
        }}
      >
        Heading — Playfair Display 600, 24px
      </span>
      <span
        style={{
          fontFamily: 'var(--pf-guest-font-display)',
          fontWeight: 500,
          fontSize: 19,
          letterSpacing: '0.03em',
        }}
      >
        19:00 · 21<sup style={{ fontSize: '0.6em' }}>ST</sup> NOVEMBER 2026
      </span>
      <span style={{ fontFamily: 'var(--pf-guest-font-body)', fontSize: 16.5, lineHeight: 1.6 }}>
        Body — EB Garamond 16.5 / 1.6, the card&rsquo;s reading voice.
      </span>
      <span
        style={{
          fontFamily: 'var(--pf-guest-font-body)',
          fontSize: 14,
          color: 'var(--pf-guest-muted)',
        }}
      >
        Hint — EB Garamond 14px muted.
      </span>
      <span
        style={{
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 15,
          letterSpacing: '0.08em',
        }}
      >
        JX4-92K — mono token
      </span>
    </div>
  ),
};
