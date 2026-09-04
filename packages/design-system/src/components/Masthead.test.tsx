import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Masthead } from './Masthead';

describe('Masthead', () => {
  it('renders the wordmark as an h1 by default', () => {
    render(<Masthead eyebrow="You're invited" wordmark="19 Parfett Street" />);
    expect(
      screen.getByRole('heading', { level: 1, name: '19 Parfett Street' }),
    ).toBeInTheDocument();
    expect(screen.getByText("You're invited")).toBeInTheDocument();
  });

  it('can render the wordmark without a heading role', () => {
    render(<Masthead eyebrow="Hosts only" wordmark="19 Parfett Street" headingLevel={null} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('applies a custom wordmark size', () => {
    render(<Masthead eyebrow="e" wordmark="Party" wordmarkSize={38} />);
    expect(screen.getByRole('heading', { name: 'Party' })).toHaveStyle({ fontSize: '38px' });
  });

  it('has no axe violations', async () => {
    const { container } = render(<Masthead eyebrow="You're invited" wordmark="Party" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
