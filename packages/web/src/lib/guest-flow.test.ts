import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({
  getQr: vi.fn(),
  listGuests: vi.fn(),
  addGuest: vi.fn(),
  updateGuest: vi.fn(),
}));

import * as api from './api';
import { useGuestFlow } from './guest-flow';

const qr = {
  slug: 'christmas',
  partyName: 'Parfett Christmas',
  eventStart: null,
  eventEnd: null,
  location: null,
  description: null,
  guestCount: 0,
};

const guest = (
  id: string,
  over: Partial<{ name: string | null; rsvpStatus: 'going' | 'not_going' | null }> = {},
) => ({
  id,
  name: null,
  rsvpStatus: null,
  createdAt: `2026-01-01T00:00:0${id.slice(-1)}Z`,
  ...over,
});

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe('useGuestFlow', () => {
  it('flags an implausible token as not found without calling the server', async () => {
    const { result } = renderHook(() => useGuestFlow('christmas', 'no'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(true);
    expect(api.getQr).not.toHaveBeenCalled();
  });

  it('marks not found when the server does not know the token', async () => {
    vi.mocked(api.getQr).mockResolvedValue(null);
    const { result } = renderHook(() => useGuestFlow('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(true);
  });

  it('asks for a redirect when the URL slug is not canonical', async () => {
    vi.mocked(api.getQr).mockResolvedValue(qr);
    const { result } = renderHook(() => useGuestFlow('xmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.redirectTo).toBe('/christmas/c/JX4KZZ');
    expect(api.listGuests).not.toHaveBeenCalled();
  });

  it('loads and sorts guests for a canonical URL', async () => {
    vi.mocked(api.getQr).mockResolvedValue(qr);
    vi.mocked(api.listGuests).mockResolvedValue([guest('g2'), guest('g1')]);
    const { result } = renderHook(() => useGuestFlow('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.info).toEqual(qr);
    expect(result.current.guests.map((g) => g.id)).toEqual(['g1', 'g2']);
  });

  it('addGuest sends the draft, records "mine", and reloads', async () => {
    vi.mocked(api.getQr).mockResolvedValue(qr);
    vi.mocked(api.listGuests).mockResolvedValue([]);
    vi.mocked(api.addGuest).mockResolvedValue('new-1');
    const { result } = renderHook(() => useGuestFlow('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(api.listGuests).mockResolvedValue([
      guest('new-1', { name: 'Me', rsvpStatus: 'going' }),
    ]);
    await act(() => result.current.actions.addGuest({ name: 'Me', status: 'going' }));

    expect(api.addGuest).toHaveBeenCalledWith({ token: 'JX4KZZ', name: 'Me', status: 'going' });
    expect(result.current.myGuestIds.has('new-1')).toBe(true);
    expect(result.current.guests).toHaveLength(1);
  });

  it('editGuest forwards the patch and reloads', async () => {
    vi.mocked(api.getQr).mockResolvedValue(qr);
    vi.mocked(api.listGuests).mockResolvedValue([guest('g1', { name: 'A' })]);
    vi.mocked(api.updateGuest).mockResolvedValue();
    const { result } = renderHook(() => useGuestFlow('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    vi.mocked(api.listGuests).mockResolvedValue([
      guest('g1', { name: 'A', rsvpStatus: 'not_going' }),
    ]);
    await act(() => result.current.actions.editGuest('g1', { name: 'A', status: 'not_going' }));

    expect(api.updateGuest).toHaveBeenCalledWith({
      token: 'JX4KZZ',
      guestId: 'g1',
      name: 'A',
      status: 'not_going',
    });
    expect(result.current.guests[0]!.rsvpStatus).toBe('not_going');
  });

  it('surfaces a load error', async () => {
    vi.mocked(api.getQr).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => useGuestFlow('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('network');
  });
});
