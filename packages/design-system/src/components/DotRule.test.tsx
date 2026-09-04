import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { DotRule } from './DotRule';

describe('DotRule', () => {
  it('renders a decorative, aria-hidden divider', () => {
    const { container } = render(<DotRule />);
    const el = container.querySelector('.pf-dot-rule');
    expect(el).toBeInTheDocument();
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges an extra className', () => {
    const { container } = render(<DotRule className="mt" />);
    expect(container.querySelector('.pf-dot-rule')).toHaveClass('mt');
  });

  it('has no axe violations', async () => {
    const { container } = render(<DotRule />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
