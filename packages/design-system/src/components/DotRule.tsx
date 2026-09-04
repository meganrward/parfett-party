import type { HTMLAttributes } from 'react';
import { classNames } from './classNames';
import './DotRule.css';

export type DotRuleProps = HTMLAttributes<HTMLDivElement>;

/** Decorative divider from the invite card — a sand dot between two hairlines. */
export function DotRule({ className, ...rest }: DotRuleProps) {
  return (
    <div className={classNames('pf-dot-rule', className)} aria-hidden="true" {...rest}>
      <span className="pf-dot-rule__dot" />
    </div>
  );
}
