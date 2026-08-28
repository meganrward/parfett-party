import type { CSSProperties, HTMLAttributes } from 'react';
import { space } from '../tokens/tokens';

type SpaceKey = keyof typeof space;

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column';
  gap?: SpaceKey;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
}

export function Stack({
  direction = 'column',
  gap = 4,
  align,
  justify,
  wrap = false,
  style,
  ...rest
}: StackProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: space[gap],
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style,
      }}
      {...rest}
    />
  );
}
