import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the landing page at the root route', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Parfett Party' })).toBeInTheDocument();
    expect(screen.getByText(/scan the qr code on your invite card/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /host sign in/i })).toHaveAttribute('href', '#/admin');
  });
});
