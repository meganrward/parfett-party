import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Game } from './index';

describe('Game (placeholder)', () => {
  it('renders the coming-soon card', () => {
    render(<Game />);
    expect(screen.getByRole('heading', { name: /secret mini-game/i })).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
