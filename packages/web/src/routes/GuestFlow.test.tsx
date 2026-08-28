import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/guest-flow', () => ({ useGuestFlow: vi.fn() }));

import { useGuestFlow, type GuestFlowState } from '../lib/guest-flow';
import { GuestFlow } from './GuestFlow';
import type { Guest } from '../lib/guests';

const actions = () => ({
  addGuest: vi.fn().mockResolvedValue(undefined),
  editGuest: vi.fn().mockResolvedValue(undefined),
  reload: vi.fn().mockResolvedValue(undefined),
});

function makeFlow(over: Partial<GuestFlowState> = {}): GuestFlowState {
  return {
    loading: false,
    notFound: false,
    redirectTo: null,
    info: {
      slug: 'christmas',
      partyName: 'Parfett Christmas',
      eventStart: null,
      eventEnd: null,
      location: null,
      description: null,
      guestCount: 0,
    },
    guests: [],
    myGuestIds: new Set<string>(),
    error: null,
    actions: actions(),
    ...over,
  };
}

const guest = (id: string, over: Partial<Guest> = {}): Guest => ({
  id,
  name: null,
  rsvpStatus: null,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

function renderFlow() {
  return render(
    <MemoryRouter
      initialEntries={['/christmas/c/JX4KZZ']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/:slug/c/:token" element={<GuestFlow />} />
        <Route path="/:slug/c/:token/info" element={<div>INFO PAGE</div>} />
        <Route path="/fixed" element={<div>REDIRECTED</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GuestFlow', () => {
  it('shows a loading state', () => {
    vi.mocked(useGuestFlow).mockReturnValue(makeFlow({ loading: true }));
    renderFlow();
    expect(screen.getByText(/loading your invite/i)).toBeInTheDocument();
  });

  it('shows a friendly not-found message', () => {
    vi.mocked(useGuestFlow).mockReturnValue(makeFlow({ notFound: true }));
    renderFlow();
    expect(screen.getByRole('heading', { name: /don't recognise that code/i })).toBeInTheDocument();
  });

  it('navigates when the hook asks for a redirect', () => {
    vi.mocked(useGuestFlow).mockReturnValue(makeFlow({ redirectTo: '/fixed' }));
    renderFlow();
    expect(screen.getByText('REDIRECTED')).toBeInTheDocument();
  });

  it('shows an error with a working retry', async () => {
    const flow = makeFlow({ error: 'network' });
    vi.mocked(useGuestFlow).mockReturnValue(flow);
    renderFlow();
    expect(screen.getByText('network')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(flow.actions.reload).toHaveBeenCalledTimes(1);
  });

  it('first visit: adds a guest then navigates to the party details', async () => {
    const flow = makeFlow({ guests: [] });
    vi.mocked(useGuestFlow).mockReturnValue(flow);
    renderFlow();

    expect(screen.getByRole('heading', { name: 'Parfett Christmas' })).toBeInTheDocument();
    const save = screen.getByRole('button', { name: /save my response/i });
    expect(save).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/name or nickname/i), '  Sam  ');
    await userEvent.click(screen.getByRole('radio', { name: 'Going' }));
    expect(save).toBeEnabled();
    await userEvent.click(save);

    expect(flow.actions.addGuest).toHaveBeenCalledWith({ name: 'Sam', status: 'going' });
    await waitFor(() => expect(screen.getByText('INFO PAGE')).toBeInTheDocument());
  });

  it('returning visitor: marks "you", edits a status, adds another, and continues', async () => {
    const flow = makeFlow({
      guests: [guest('g1', { name: 'Me', rsvpStatus: 'going' }), guest('g2', { name: 'Friend' })],
      myGuestIds: new Set(['g1']),
    });
    vi.mocked(useGuestFlow).mockReturnValue(flow);
    renderFlow();

    const meRow = screen.getByRole('group', { name: 'Me' });
    expect(within(meRow).getByLabelText('Name (you)')).toHaveValue('Me');

    const friendRow = screen.getByRole('group', { name: 'Friend' });
    await userEvent.click(within(friendRow).getByRole('radio', { name: 'Not going' }));
    expect(flow.actions.editGuest).toHaveBeenCalledWith('g2', {
      name: 'Friend',
      status: 'not_going',
    });

    await userEvent.click(screen.getByRole('button', { name: /add another guest/i }));
    const addForm = screen.getByRole('button', { name: /^add guest$/i }).closest('form')!;
    await userEvent.click(within(addForm).getByRole('radio', { name: 'Going' }));
    await userEvent.click(within(addForm).getByRole('button', { name: /^add guest$/i }));
    expect(flow.actions.addGuest).toHaveBeenCalledWith({ name: null, status: 'going' });

    await userEvent.click(screen.getByRole('button', { name: /continue to party details/i }));
    await waitFor(() => expect(screen.getByText('INFO PAGE')).toBeInTheDocument());
  });
});
