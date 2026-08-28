import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('renders its label', () => {
    render(<StatusPill tone="positive">Going</StatusPill>);
    expect(screen.getByText('Going')).toBeInTheDocument();
  });

  it('maps tone to token colours', () => {
    render(
      <StatusPill tone="negative" data-testid="p">
        Not going
      </StatusPill>,
    );
    expect(screen.getByTestId('p')).toHaveStyle({
      background: 'var(--pf-color-danger-subtle)',
      color: 'var(--pf-color-danger)',
    });
  });
});
