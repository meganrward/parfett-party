import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/admin-guests', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useAdminParty: vi.fn(),
}));

import { useAdminParty, type AdminPartyState } from '../../lib/admin-guests';
import { Guests } from './Guests';
import type { QrCodeWithGuests } from '../../lib/api-types';

const guest = (
  id: string,
  status: 'going' | 'not_going' | null,
  name: string | null,
  ts: string,
) => ({ id, name, rsvpStatus: status, createdAt: ts });

const codes: QrCodeWithGuests[] = [
  {
    id: 'c1',
    token: 'JAAA',
    prefix: 'J',
    guests: [
      guest('g1', 'going', 'Ellie', '2026-01-01T00:00:00Z'),
      guest('g2', null, 'Sam', '2026-01-01T00:00:01Z'),
    ],
  },
  {
    id: 'c2',
    token: 'KBBB',
    prefix: 'K',
    guests: [guest('g3', 'not_going', 'Bob', '2026-01-01T00:00:02Z')],
  },
];

function makeState(over: Partial<AdminPartyState> = {}): AdminPartyState {
  return {
    loading: false,
    notFound: false,
    error: null,
    party: { id: 'p1', slug: 'christmas', name: 'Parfett Christmas' } as never,
    codes,
    reload: vi.fn().mockResolvedValue(undefined),
    editGuest: vi.fn().mockResolvedValue(undefined),
    removeGuest: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function renderGuests() {
  return render(
    <MemoryRouter
      initialEntries={['/admin/christmas/guests']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/admin/:slug/guests" element={<Guests />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Guests', () => {
  it('shows loading and error (with retry) states', async () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState({ loading: true }));
    const { rerender } = renderGuests();
    expect(screen.getByText(/loading guests/i)).toBeInTheDocument();

    const errored = makeState({ error: 'denied' });
    vi.mocked(useAdminParty).mockReturnValue(errored);
    rerender(<div />);
    renderGuests();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(errored.reload).toHaveBeenCalledTimes(1);
  });

  it('renders one row per guest response with its code + summary', () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState());
    renderGuests();
    expect(screen.getByRole('heading', { name: 'Parfett Christmas' })).toBeInTheDocument();

    expect(screen.getByDisplayValue('Ellie')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sam')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();

    // Ellie + Sam are on JAAA (prefix J), Bob on KBBB
    expect(screen.getAllByText('JAAA')).toHaveLength(2);
    expect(screen.getAllByText('Housemate J')).toHaveLength(2);

    const summary = screen.getByText('Guests').closest('div')!.parentElement!;
    expect(within(summary).getByText('3')).toBeInTheDocument();
  });

  it('filters by response status', async () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState());
    renderGuests();
    await userEvent.selectOptions(screen.getByLabelText('Response'), 'awaiting');
    expect(screen.getByDisplayValue('Sam')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Ellie')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('Bob')).not.toBeInTheDocument();
  });

  it('filters by token search', async () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState());
    renderGuests();
    await userEvent.type(screen.getByLabelText('Search token'), 'kb');
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Ellie')).not.toBeInTheDocument();
  });

  it('edits and removes a guest', async () => {
    const state = makeState();
    vi.mocked(useAdminParty).mockReturnValue(state);
    renderGuests();

    const bobRow = screen.getByDisplayValue('Bob').closest('tr')!;
    await userEvent.click(within(bobRow).getByRole('radio', { name: 'Going' }));
    expect(state.editGuest).toHaveBeenCalledWith('g3', { name: 'Bob', status: 'going' });

    await userEvent.click(within(bobRow).getByRole('button', { name: /remove/i }));
    expect(state.removeGuest).toHaveBeenCalledWith('g3');
  });

  it('shows a not-found message', () => {
    vi.mocked(useAdminParty).mockReturnValue(makeState({ notFound: true }));
    renderGuests();
    expect(screen.getByText(/doesn't exist/i)).toBeInTheDocument();
  });
});
