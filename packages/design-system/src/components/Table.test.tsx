import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table } from './Table';

describe('Table', () => {
  it('renders a table with the provided rows', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td>J4KQ</td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole('table')).toHaveClass('pf-table');
    expect(screen.getByRole('cell', { name: 'J4KQ' })).toBeInTheDocument();
  });

  it('wraps the table in a horizontally scrollable container', () => {
    const { container } = render(
      <Table>
        <tbody>
          <tr>
            <td>x</td>
          </tr>
        </tbody>
      </Table>,
    );
    expect(container.querySelector('.pf-table-wrap')).not.toBeNull();
  });
});
