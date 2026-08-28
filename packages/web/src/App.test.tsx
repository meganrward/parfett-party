import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the landing placeholder at the root route', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Parfett Party' })).toBeInTheDocument();
  });
});
