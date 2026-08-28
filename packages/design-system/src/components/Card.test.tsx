import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('passes through DOM props and merges style', () => {
    render(
      <Card data-testid="c" style={{ color: 'rgb(1, 2, 3)' }}>
        x
      </Card>,
    );
    expect(screen.getByTestId('c')).toHaveStyle({ color: 'rgb(1, 2, 3)' });
  });
});
