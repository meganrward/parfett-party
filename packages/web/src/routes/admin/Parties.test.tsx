import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/parties-admin', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSuperParties: vi.fn(),
}));
vi.mock('../../lib/api', () => ({
  listHosts: vi.fn(),
  listPartyHosts: vi.fn(),
  setPartyHosts: vi.fn(),
  invokeGenerateQrCodes: vi.fn(),
}));

import * as api from '../../lib/api';
import { useSuperParties, type SuperPartiesState } from '../../lib/parties-admin';
import { Parties } from './Parties';
import type { Party } from '../../lib/api-types';

const party: Party = {
  id: 'p1',
  slug: 'christmas',
  name: 'Parfett Christmas',
  eventStart: null,
  eventEnd: null,
  location: null,
  description: null,
  qrCount: 75,
  prefixes: ['J', 'K'],
  tokenLength: 10,
  alphabet: 'ABCDEFGHJKLMNPQRTUVWXYZ23456789',
  createdAt: 't',
};

function makeParties(over: Partial<SuperPartiesState> = {}): SuperPartiesState {
  return {
    parties: [party],
    loading: false,
    error: null,
    reload: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(party),
    update: vi.fn().mockResolvedValue(party),
    ...over,
  };
}

function renderParties() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Parties />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.listHosts).mockResolvedValue([
    { userId: 'u1', name: 'Housemate A', isAdmin: false },
    { userId: 'u2', name: 'Housemate B', isAdmin: false },
    { userId: 'setup', name: 'Party Setup', isAdmin: true },
  ]);
  vi.mocked(api.listPartyHosts).mockResolvedValue(['u1']);
  vi.mocked(api.setPartyHosts).mockResolvedValue();
  vi.mocked(api.invokeGenerateQrCodes).mockResolvedValue({
    mode: 'append',
    deleted: 0,
    count: 75,
    created: [],
  });
});

describe('Parties', () => {
  it('lists parties and opens a blank editor from "New party"', async () => {
    vi.mocked(useSuperParties).mockReturnValue(makeParties());
    renderParties();
    expect(screen.getByRole('heading', { name: 'Parfett Christmas' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /new party/i }));
    expect(screen.getByRole('heading', { name: 'New party' })).toBeInTheDocument();
  });

  it('validates the create form before calling the API', async () => {
    const state = makeParties();
    vi.mocked(useSuperParties).mockReturnValue(state);
    renderParties();
    await userEvent.click(screen.getByRole('button', { name: /new party/i }));
    await userEvent.click(screen.getByRole('button', { name: /create party/i }));
    expect(screen.getByText(/give the party a name/i)).toBeInTheDocument();
    expect(state.create).not.toHaveBeenCalled();
  });

  it('edits an existing party and saves shaped values', async () => {
    const state = makeParties();
    vi.mocked(useSuperParties).mockReturnValue(state);
    renderParties();

    await userEvent.click(screen.getByRole('button', { name: /manage/i }));
    const editor = screen.getByRole('heading', { name: /edit parfett christmas/i }).closest('div')!;
    const name = within(editor.parentElement!).getByLabelText('Name');
    expect(name).toHaveValue('Parfett Christmas');
    await userEvent.clear(name);
    await userEvent.type(name, 'Xmas Do');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(state.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ name: 'Xmas Do', slug: 'christmas', qrCount: 75 }),
    );
  });

  it('assigns hosts', async () => {
    vi.mocked(useSuperParties).mockReturnValue(makeParties());
    renderParties();
    await userEvent.click(screen.getByRole('button', { name: /manage/i }));

    const boxA = await screen.findByRole('checkbox', { name: 'Housemate A' });
    const boxB = screen.getByRole('checkbox', { name: 'Housemate B' });
    expect(boxA).toBeChecked();
    expect(boxB).not.toBeChecked();
    // super account isn't offered
    expect(screen.queryByRole('checkbox', { name: 'Party Setup' })).not.toBeInTheDocument();

    await userEvent.click(boxB);
    await userEvent.click(screen.getByRole('button', { name: /save access/i }));
    expect(api.setPartyHosts).toHaveBeenCalledWith('p1', ['u1', 'u2']);
  });

  it('generates a batch and regenerates unused after confirming', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(useSuperParties).mockReturnValue(makeParties());
    renderParties();
    await userEvent.click(screen.getByRole('button', { name: /manage/i }));

    await userEvent.click(screen.getByRole('button', { name: /generate 75/i }));
    expect(api.invokeGenerateQrCodes).toHaveBeenCalledWith({ partyId: 'p1', mode: 'append' });
    expect(await screen.findByText(/made 75 codes/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /regenerate unused/i }));
    expect(confirm).toHaveBeenCalled();
    expect(api.invokeGenerateQrCodes).toHaveBeenCalledWith({
      partyId: 'p1',
      mode: 'regenerate-unused',
    });
    confirm.mockRestore();
  });

  it('shows a load error with retry', async () => {
    const state = makeParties({ error: 'denied', parties: [] });
    vi.mocked(useSuperParties).mockReturnValue(state);
    renderParties();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(state.reload).toHaveBeenCalledTimes(1);
  });
});
