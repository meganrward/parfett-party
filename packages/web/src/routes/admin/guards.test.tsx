import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/roles', () => ({ useAdminRole: vi.fn(), useMyParties: vi.fn() }));

import { useAdminRole, useMyParties } from '../../lib/roles';
import { RequirePartyAccess, RequireAdmin } from './guards';

beforeEach(() => {
  vi.clearAllMocks();
});

function renderAt(path: string, guard: React.ReactElement) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/admin" element={<div>PICKER</div>} />
        <Route path="/admin/parties" element={guard}>
          <Route index element={<div>ADMIN PAGE</div>} />
        </Route>
        <Route path="/admin/:slug/guests" element={guard}>
          <Route index element={<div>GUESTS PAGE</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAdmin', () => {
  it('shows a checking state while the role loads', () => {
    vi.mocked(useAdminRole).mockReturnValue({ role: null, isAdmin: false, loading: true });
    renderAt('/admin/parties', <RequireAdmin />);
    expect(screen.getByText(/checking access/i)).toBeInTheDocument();
  });

  it('redirects a host to the picker', () => {
    vi.mocked(useAdminRole).mockReturnValue({ role: 'host', isAdmin: false, loading: false });
    renderAt('/admin/parties', <RequireAdmin />);
    expect(screen.getByText('PICKER')).toBeInTheDocument();
  });

  it('renders the child route for the admin', () => {
    vi.mocked(useAdminRole).mockReturnValue({ role: 'admin', isAdmin: true, loading: false });
    renderAt('/admin/parties', <RequireAdmin />);
    expect(screen.getByText('ADMIN PAGE')).toBeInTheDocument();
  });
});

describe('RequirePartyAccess', () => {
  const parties = [{ slug: 'christmas' }, { slug: 'my-birthday' }] as never;

  it('redirects when the slug is not in the accessible list', () => {
    vi.mocked(useMyParties).mockReturnValue({
      parties,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    renderAt('/admin/secret-party/guests', <RequirePartyAccess />);
    expect(screen.getByText('PICKER')).toBeInTheDocument();
  });

  it('renders the child route when the slug is accessible', () => {
    vi.mocked(useMyParties).mockReturnValue({
      parties,
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
    renderAt('/admin/christmas/guests', <RequirePartyAccess />);
    expect(screen.getByText('GUESTS PAGE')).toBeInTheDocument();
  });
});
