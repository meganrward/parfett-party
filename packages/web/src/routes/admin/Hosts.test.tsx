import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api', () => ({ listHosts: vi.fn(), upsertHost: vi.fn() }));

import * as api from '../../lib/api';
import { Hosts } from './Hosts';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listHosts).mockResolvedValue([
    { userId: 'setup', name: 'Party Admin', isAdmin: true },
    { userId: 'u1', name: 'Host A', isAdmin: false },
  ]);
  vi.mocked(api.upsertHost).mockResolvedValue();
});

describe('Hosts', () => {
  it('lists accounts and marks the admin', async () => {
    render(<Hosts />);
    expect(await screen.findByDisplayValue('Party Admin')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Host A')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renames an account on blur', async () => {
    render(<Hosts />);
    const field = await screen.findByDisplayValue('Host A');
    await userEvent.clear(field);
    await userEvent.type(field, 'Alex');
    await userEvent.tab();
    expect(api.upsertHost).toHaveBeenCalledWith({
      userId: 'u1',
      name: 'Alex',
      isAdmin: false,
    });
  });

  it('does not call the API when the name is unchanged', async () => {
    render(<Hosts />);
    const field = await screen.findByDisplayValue('Host A');
    await userEvent.click(field);
    await userEvent.tab();
    expect(api.upsertHost).not.toHaveBeenCalled();
  });

  it('shows a load error with retry', async () => {
    vi.mocked(api.listHosts).mockReset();
    vi.mocked(api.listHosts).mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce([]);
    render(<Hosts />);
    await userEvent.click(await screen.findByRole('button', { name: /try again/i }));
    expect(api.listHosts).toHaveBeenCalledTimes(2);
  });
});
