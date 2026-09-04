/**
 * Typed mirror of tokens.css. Import these in TS/JS; import tokens.css once at the
 * app root so the custom properties exist at runtime.
 */
export const color = {
  bg: 'var(--pf-color-bg)',
  surface: 'var(--pf-color-surface)',
  surfaceSunken: 'var(--pf-color-surface-sunken)',
  border: 'var(--pf-color-border)',
  text: 'var(--pf-color-text)',
  textMuted: 'var(--pf-color-text-muted)',
  textInverse: 'var(--pf-color-text-inverse)',
  brand: 'var(--pf-color-brand)',
  brandHover: 'var(--pf-color-brand-hover)',
  brandSubtle: 'var(--pf-color-brand-subtle)',
  success: 'var(--pf-color-success)',
  successSubtle: 'var(--pf-color-success-subtle)',
  danger: 'var(--pf-color-danger)',
  dangerSubtle: 'var(--pf-color-danger-subtle)',
  warning: 'var(--pf-color-warning)',
  warningSubtle: 'var(--pf-color-warning-subtle)',
  focusRing: 'var(--pf-color-focus-ring)',
} as const;

export const space = {
  1: 'var(--pf-space-1)',
  2: 'var(--pf-space-2)',
  3: 'var(--pf-space-3)',
  4: 'var(--pf-space-4)',
  5: 'var(--pf-space-5)',
  6: 'var(--pf-space-6)',
  7: 'var(--pf-space-7)',
  8: 'var(--pf-space-8)',
} as const;

export const fontSize = {
  xs: 'var(--pf-font-size-xs)',
  sm: 'var(--pf-font-size-sm)',
  md: 'var(--pf-font-size-md)',
  lg: 'var(--pf-font-size-lg)',
  xl: 'var(--pf-font-size-xl)',
  '2xl': 'var(--pf-font-size-2xl)',
} as const;

export const fontWeight = {
  regular: 'var(--pf-font-weight-regular)',
  medium: 'var(--pf-font-weight-medium)',
  bold: 'var(--pf-font-weight-bold)',
} as const;

export const font = {
  sans: 'var(--pf-font-sans)',
  mono: 'var(--pf-font-mono)',
} as const;

export const lineHeight = {
  tight: 'var(--pf-line-height-tight)',
  normal: 'var(--pf-line-height-normal)',
} as const;

export const radius = {
  sm: 'var(--pf-radius-sm)',
  md: 'var(--pf-radius-md)',
  lg: 'var(--pf-radius-lg)',
  pill: 'var(--pf-radius-pill)',
} as const;

export const shadow = {
  sm: 'var(--pf-shadow-sm)',
  md: 'var(--pf-shadow-md)',
  lg: 'var(--pf-shadow-lg)',
} as const;

/**
 * Guest palette — raw invite-card values. Most screens should just wrap markup
 * in `.pf-guest` and use the shared components; reach for these only for the
 * bespoke guest furniture (masthead, dot rule, the "YOU" marker).
 */
export const guest = {
  ink: 'var(--pf-guest-ink)',
  action: 'var(--pf-guest-action)',
  actionHover: 'var(--pf-guest-action-hover)',
  blueLight: 'var(--pf-guest-blue-light)',
  blueTint: 'var(--pf-guest-blue-tint)',
  blueBorder: 'var(--pf-guest-blue-border)',
  sand: 'var(--pf-guest-sand)',
  sandTint: 'var(--pf-guest-sand-tint)',
  paper: 'var(--pf-guest-paper)',
  surface: 'var(--pf-guest-surface)',
  border: 'var(--pf-guest-border)',
  muted: 'var(--pf-guest-muted)',
  sunken: 'var(--pf-guest-sunken)',
  shadowSm: 'var(--pf-guest-shadow-sm)',
  shadowMd: 'var(--pf-guest-shadow-md)',
  fontScript: 'var(--pf-guest-font-script)',
  fontDisplay: 'var(--pf-guest-font-display)',
  fontBody: 'var(--pf-guest-font-body)',
} as const;

export const tokens = {
  color,
  space,
  fontSize,
  fontWeight,
  font,
  lineHeight,
  radius,
  shadow,
  guest,
} as const;
