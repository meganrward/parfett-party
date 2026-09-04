import type { HTMLAttributes, ReactNode } from 'react';
import { classNames } from './classNames';
import { DotRule } from './DotRule';
import './Masthead.css';

export interface MastheadProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Tracked small-caps line above the wordmark. */
  eyebrow: ReactNode;
  /** The script wordmark itself. */
  wordmark: ReactNode;
  /** Heading level for the wordmark. `null` renders a plain span. */
  headingLevel?: 1 | 2 | 3 | null;
  /** Wordmark font size in px — 46 on G1, down to 38–40 on denser screens. */
  wordmarkSize?: number;
}

export function Masthead({
  eyebrow,
  wordmark,
  headingLevel = 1,
  wordmarkSize,
  className,
  ...rest
}: MastheadProps) {
  const WordmarkTag = headingLevel === null ? 'span' : (`h${headingLevel}` as const);
  return (
    <div className={classNames('pf-masthead', className)} {...rest}>
      <span className="pf-masthead__eyebrow">{eyebrow}</span>
      <WordmarkTag
        className="pf-masthead__wordmark"
        style={wordmarkSize ? { fontSize: wordmarkSize } : undefined}
      >
        {wordmark}
      </WordmarkTag>
      <DotRule />
    </div>
  );
}
