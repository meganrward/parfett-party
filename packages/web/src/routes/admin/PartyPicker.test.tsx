import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/roles', () => ({ useMyParties: vi.fn(), useAdminRole: vi.fn() }));

import { useAdminRole, useMyParties } from '../../lib/roles';
import { PartyPicker } from './PartyPicker';

const parties = [
  { id: 'p1', slug: 'christmas', name: 'Parfett Christmas' },
  { id: 'p2', slug: 'my-birthday', name: 'Birthday Bash' },
] as never;

function setup(myParties: unknown, role: unknown) {
  vi.mocked(useMyParties).mockReturnValue(myParties as never);
  vi.mocked(useAdminRole).mockReturnValue(role as never);
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PartyPicker />
    </MemoryRouter>,
  );
}

const asHost = { role: 'host', isAdmin: false, loading: false };
const asAdmin = { role: 'admin', isAdmin: true, loading: false };
const ready = (p: unknown) => ({ parties: p, loading: false, error: null, refresh: vi.fn() });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PartyPicker', () => {
  it('shows loading and error states', () => {
    const { rerender } = setup(
      { parties: [], loading: true, error: null, refresh: vi.fn() },
      asHost,
    );
    expect(screen.getByText('Loading…')).toBeInTheDocument();

    rerender(<div />);
    setup({ parties: [], loading: false, error: 'denied', refresh: vi.fn() }, asHost);
    expect(screen.getByText('denied')).toBeInTheDocument();
  });

  it('lists each accessible party as a link to its guests page', () => {
    setup(ready(parties), asHost);
    expect(screen.getByRole('link', { name: /Parfett Christmas/ })).toHaveAttribute(
      'href',
      '/admin/christmas/guests',
    );
    expect(screen.getByRole('link', { name: /Birthday Bash/ })).toHaveAttribute(
      'href',
      '/admin/my-birthday/guests',
    );
    expect(screen.queryByRole('link', { name: /manage parties/i })).not.toBeInTheDocument();
  });

  it('gives the super-admin a Manage parties link', () => {
    setup(ready(parties), asAdmin);
    expect(screen.getByRole('link', { name: /manage parties/i })).toHaveAttribute(
      'href',
      '/admin/parties',
    );
  });

  it('shows a role-appropriate empty state', () => {
    setup(ready([]), asHost);
    expect(screen.getByText(/don.t have access to any parties/i)).toBeInTheDocument();

    setup(ready([]), asAdmin);
    expect(screen.getByText(/no parties yet/i)).toBeInTheDocument();
  });
});
