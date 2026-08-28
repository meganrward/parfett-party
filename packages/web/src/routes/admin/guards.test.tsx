import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/roles', () => ({ useAdminRole: vi.fn(), useMyParties: vi.fn() }));

import { useAdminRole, useMyParties } from '../../lib/roles';
import { RequirePartyAccess, RequireSuper } from './guards';

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
          <Route index element={<div>SUPER PAGE</div>} />
        </Route>
        <Route path="/admin/:slug/guests" element={guard}>
          <Route index element={<div>GUESTS PAGE</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireSuper', () => {
  it('shows a checking state while the role loads', () => {
    vi.mocked(useAdminRole).mockReturnValue({ role: null, isSuper: false, loading: true });
    renderAt('/admin/parties', <RequireSuper />);
    expect(screen.getByText(/checking access/i)).toBeInTheDocument();
  });

  it('redirects a non-super admin to the picker', () => {
    vi.mocked(useAdminRole).mockReturnValue({ role: 'admin', isSuper: false, loading: false });
    renderAt('/admin/parties', <RequireSuper />);
    expect(screen.getByText('PICKER')).toBeInTheDocument();
  });

  it('renders the child route for a super-admin', () => {
    vi.mocked(useAdminRole).mockReturnValue({ role: 'super', isSuper: true, loading: false });
    renderAt('/admin/parties', <RequireSuper />);
    expect(screen.getByText('SUPER PAGE')).toBeInTheDocument();
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
