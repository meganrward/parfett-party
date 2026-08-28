import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/party-info', () => ({ usePartyInfo: vi.fn() }));
vi.mock('../lib/download', () => ({ downloadTextFile: vi.fn() }));

import { usePartyInfo, type PartyInfoState } from '../lib/party-info';
import { downloadTextFile } from '../lib/download';
import { PartyInfo } from './PartyInfo';

function makeState(over: Partial<PartyInfoState> = {}): PartyInfoState {
  return {
    loading: false,
    notFound: false,
    redirectTo: null,
    error: null,
    info: {
      slug: 'christmas',
      partyName: 'Parfett Christmas',
      eventStart: '2026-12-24T19:00:00Z',
      eventEnd: '2026-12-25T02:00:00Z',
      location: '12 Parfett Street, London',
      description: 'BYOB; santa hats mandatory.',
      guestCount: 3,
    },
    ...over,
  };
}

function renderInfo() {
  return render(
    <MemoryRouter
      initialEntries={['/christmas/c/JX4KZZ/info']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/:slug/c/:token/info" element={<PartyInfo />} />
        <Route path="/christmas/c/JX4KZZ/info" element={<PartyInfo />} />
        <Route path="*" element={<div>ELSEWHERE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PartyInfo', () => {
  it('shows loading / not-found states', () => {
    vi.mocked(usePartyInfo).mockReturnValue(makeState({ loading: true }));
    const { rerender } = renderInfo();
    expect(screen.getByText(/loading party details/i)).toBeInTheDocument();

    vi.mocked(usePartyInfo).mockReturnValue(makeState({ notFound: true }));
    rerender(<div />);
    renderInfo();
    expect(screen.getByRole('heading', { name: /don't recognise that code/i })).toBeInTheDocument();
  });

  it('renders details, the game placeholder, and calendar controls with a Google href', () => {
    vi.mocked(usePartyInfo).mockReturnValue(makeState());
    renderInfo();

    expect(screen.getByRole('heading', { name: 'Parfett Christmas' })).toBeInTheDocument();
    expect(screen.getByText('Fri, 25 Dec 2026, 02:00', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('12 Parfett Street, London')).toBeInTheDocument();
    expect(screen.getByText(/santa hats mandatory/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /secret mini-game/i })).toBeInTheDocument();

    const google = screen.getByRole('link', { name: /google calendar/i });
    expect(google).toHaveAttribute('target', '_blank');
    const href = new URL(google.getAttribute('href')!);
    expect(href.origin + href.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(href.searchParams.get('dates')).toBe('20261224T190000Z/20261225T020000Z');
    expect(href.searchParams.get('text')).toBe('Parfett Christmas');
  });

  it('downloads an .ics when the Apple button is clicked', async () => {
    vi.mocked(usePartyInfo).mockReturnValue(makeState());
    renderInfo();

    await userEvent.click(screen.getByRole('button', { name: /\.ics/i }));
    expect(downloadTextFile).toHaveBeenCalledTimes(1);
    const [filename, content, mime] = vi.mocked(downloadTextFile).mock.calls[0]!;
    expect(filename).toBe('parfett-christmas.ics');
    expect(content).toContain('BEGIN:VCALENDAR');
    expect(mime).toContain('text/calendar');
  });

  it('hides calendar controls when there is no start time', () => {
    vi.mocked(usePartyInfo).mockReturnValue(
      makeState({ info: { ...makeState().info!, eventStart: null, eventEnd: null } }),
    );
    renderInfo();
    expect(screen.queryByRole('link', { name: /google calendar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /\.ics/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Parfett Christmas' })).toBeInTheDocument();
  });
});
