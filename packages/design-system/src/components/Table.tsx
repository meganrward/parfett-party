import type { TableHTMLAttributes } from 'react';
import { classNames } from './classNames';
import './Table.css';

export type TableProps = TableHTMLAttributes<HTMLTableElement>;

/** Styled <table>. Consumers provide their own <thead>/<tbody>. Scrolls horizontally on overflow. */
export function Table({ className, children, ...rest }: TableProps) {
  return (
    <div className="pf-table-wrap">
      <table className={classNames('pf-table', className)} {...rest}>
        {children}
      </table>
    </div>
  );
}
