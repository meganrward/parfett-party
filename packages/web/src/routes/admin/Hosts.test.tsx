import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/api', () => ({
  listHosts: vi.fn(),
  upsertHost: vi.fn(),
  invokeCreateHost: vi.fn(),
  invokeDeleteHost: vi.fn(),
}));

import * as api from '../../lib/api';
import { Hosts } from './Hosts';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listHosts).mockResolvedValue([
    { userId: 'setup', name: 'Party Admin', isAdmin: true },
    { userId: 'u1', name: 'Host A', isAdmin: false },
  ]);
  vi.mocked(api.upsertHost).mockResolvedValue();
  vi.mocked(api.invokeDeleteHost).mockResolvedValue();
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
    expect(api.upsertHost).toHaveBeenCalledWith({ userId: 'u1', name: 'Alex', isAdmin: false });
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

  it('creates a host and reports the invite', async () => {
    vi.mocked(api.invokeCreateHost).mockResolvedValue({
      host: { userId: 'u9', name: 'Kit', isAdmin: false },
      invited: true,
      mailError: null,
    });
    render(<Hosts />);
    const form = (await screen.findByRole('heading', { name: /new host/i })).closest('form')!;
    await userEvent.type(within(form).getByLabelText('Name'), 'Kit');
    await userEvent.type(within(form).getByLabelText('Email'), 'kit@example.com');
    await userEvent.click(within(form).getByRole('button', { name: /add host/i }));

    expect(api.invokeCreateHost).toHaveBeenCalledWith({ name: 'Kit', email: 'kit@example.com' });
    expect(await within(form).findByText(/invite email sent/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Kit')).toBeInTheDocument();
  });

  it('reports a failure to send the set-password email', async () => {
    vi.mocked(api.invokeCreateHost).mockResolvedValue({
      host: { userId: 'u9', name: 'Kit', isAdmin: false },
      invited: false,
      mailError: 'Email rate limit exceeded',
    });
    render(<Hosts />);
    const form = (await screen.findByRole('heading', { name: /new host/i })).closest('form')!;
    await userEvent.type(within(form).getByLabelText('Name'), 'Kit');
    await userEvent.type(within(form).getByLabelText('Email'), 'kit@example.com');
    await userEvent.click(within(form).getByRole('button', { name: /add host/i }));

    expect(await within(form).findByText(/couldn't be sent/i)).toBeInTheDocument();
    expect(within(form).getByText('Email rate limit exceeded')).toBeInTheDocument();
  });

  it('removes a host after confirming', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<Hosts />);
    await screen.findByDisplayValue('Host A');
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(api.invokeDeleteHost).toHaveBeenCalledWith('u1');
    await waitFor(() => expect(screen.queryByDisplayValue('Host A')).not.toBeInTheDocument());
  });

  it('does not remove a host when the confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Hosts />);
    await screen.findByDisplayValue('Host A');
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));

    expect(api.invokeDeleteHost).not.toHaveBeenCalled();
    expect(screen.getByDisplayValue('Host A')).toBeInTheDocument();
  });

  it('does not show a remove button for the admin account', async () => {
    render(<Hosts />);
    await screen.findByDisplayValue('Party Admin');
    expect(screen.getAllByRole('button', { name: /remove/i })).toHaveLength(1);
  });

  it('surfaces a create error', async () => {
    vi.mocked(api.invokeCreateHost).mockRejectedValue(new Error('a valid email is required'));
    render(<Hosts />);
    const form = (await screen.findByRole('heading', { name: /new host/i })).closest('form')!;
    await userEvent.type(within(form).getByLabelText('Name'), 'Kit');
    await userEvent.type(within(form).getByLabelText('Email'), 'nope');
    await userEvent.click(within(form).getByRole('button', { name: /add host/i }));
    expect(await within(form).findByText(/a valid email is required/i)).toBeInTheDocument();
  });
});
