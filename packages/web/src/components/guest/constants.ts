import type { CSSProperties } from 'react';

export const RSVP_OPTIONS = [
  { label: 'Going', value: 'going' },
  { label: 'Not going', value: 'not_going' },
] as const;

/** Override the segmented track to sit on white (the "you" row). */
export const WHITE_TRACK = { '--pf-color-surface-sunken': '#fff' } as CSSProperties;
