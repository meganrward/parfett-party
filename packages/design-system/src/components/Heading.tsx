import type { HTMLAttributes } from 'react';
import { color, fontSize, fontWeight, lineHeight } from '../tokens/tokens';

export type HeadingLevel = 1 | 2 | 3;

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
}

const sizeByLevel: Record<HeadingLevel, string> = {
  1: fontSize['2xl'],
  2: fontSize.xl,
  3: fontSize.lg,
};

export function Heading({ level = 2, style, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      style={{
        margin: 0,
        color: color.text,
        fontSize: sizeByLevel[level],
        fontWeight: fontWeight.bold,
        lineHeight: lineHeight.tight,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
