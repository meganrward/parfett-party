import type { HTMLAttributes } from 'react';
import { color, radius, shadow, space } from '../tokens/tokens';

type SpaceKey = keyof typeof space;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: SpaceKey;
  elevated?: boolean;
}

export function Card({ padding = 5, elevated = false, style, ...rest }: CardProps) {
  return (
    <div
      style={{
        background: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: radius.lg,
        boxShadow: elevated ? shadow.md : shadow.sm,
        padding: space[padding],
        ...style,
      }}
      {...rest}
    />
  );
}
