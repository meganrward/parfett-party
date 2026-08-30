import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api', () => ({ listAdmins: vi.fn(), upsertAdmin: vi.fn() }));

import * as api from '../../lib/api';
import { Admins } from './Admins';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listAdmins).mockResolvedValue([
    { userId: 'setup', displayName: 'Party Setup', isSuper: true },
    { userId: 'u1', displayName: 'Housemate A', isSuper: false },
  ]);
  vi.mocked(api.upsertAdmin).mockResolvedValue();
});

describe('Admins', () => {
  it('lists accounts and marks the super-admin', async () => {
    render(<Admins />);
    expect(await screen.findByDisplayValue('Party Setup')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Housemate A')).toBeInTheDocument();
    expect(screen.getByText('Super-admin')).toBeInTheDocument();
  });

  it('renames an account on blur', async () => {
    render(<Admins />);
    const field = await screen.findByDisplayValue('Housemate A');
    await userEvent.clear(field);
    await userEvent.type(field, 'Alex');
    await userEvent.tab();
    expect(api.upsertAdmin).toHaveBeenCalledWith({
      userId: 'u1',
      displayName: 'Alex',
      isSuper: false,
    });
  });

  it('does not call the API when the name is unchanged', async () => {
    render(<Admins />);
    const field = await screen.findByDisplayValue('Housemate A');
    await userEvent.click(field);
    await userEvent.tab();
    expect(api.upsertAdmin).not.toHaveBeenCalled();
  });

  it('shows a load error with retry', async () => {
    vi.mocked(api.listAdmins).mockReset();
    vi.mocked(api.listAdmins).mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce([]);
    render(<Admins />);
    await userEvent.click(await screen.findByRole('button', { name: /try again/i }));
    expect(api.listAdmins).toHaveBeenCalledTimes(2);
  });
});
