import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/roles', () => ({ useSession: vi.fn(), useAdminRole: vi.fn() }));
vi.mock('../../lib/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
}));

import { useAdminRole, useSession } from '../../lib/roles';
import { signOut } from '../../lib/auth';
import { AdminLayout } from './AdminLayout';

const session = { user: { id: 'u1' } } as never;

function setup(sessionState: unknown, roleState: unknown) {
  vi.mocked(useSession).mockReturnValue(sessionState as never);
  vi.mocked(useAdminRole).mockReturnValue(roleState as never);
  return render(
    <MemoryRouter
      initialEntries={['/admin']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>DASHBOARD</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AdminLayout', () => {
  it('shows a loading state while the session resolves', () => {
    setup({ session: null, loading: true }, { role: null, loading: true });
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the login form when signed out', () => {
    setup({ session: null, loading: false }, { role: null, loading: false });
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows a no-access notice for a signed-in non-admin, with sign out', async () => {
    setup({ session, loading: false }, { role: null, loading: false });
    expect(screen.getByRole('heading', { name: /no admin access/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /sign out/i }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('renders the shell + child route for a regular admin, without super nav', () => {
    setup({ session, loading: false }, { role: 'admin', loading: false });
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Parfett admin' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Parties' })).not.toBeInTheDocument();
  });

  it('shows the super-admin nav links', () => {
    setup({ session, loading: false }, { role: 'super', loading: false });
    expect(screen.getByRole('link', { name: 'Parties' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Admins' })).toBeInTheDocument();
  });
});
