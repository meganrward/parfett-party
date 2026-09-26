import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./api', () => ({ getQr: vi.fn(), listPartyGuests: vi.fn() }));

import * as api from './api';
import { usePartyInfo } from './party-info';

const qr = {
  slug: 'christmas',
  partyName: 'Parfett Christmas',
  eventStart: '2026-12-24T19:00:00Z',
  eventEnd: null,
  location: 'Home',
  description: null,
  guestCount: 0,
  showGuestList: false,
  showGuestCount: false,
  partyGuestCount: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePartyInfo', () => {
  it('flags an implausible token without calling the server', async () => {
    const { result } = renderHook(() => usePartyInfo('christmas', '??'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(true);
    expect(api.getQr).not.toHaveBeenCalled();
  });

  it('marks not found for an unknown token', async () => {
    vi.mocked(api.getQr).mockResolvedValue(null);
    const { result } = renderHook(() => usePartyInfo('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(true);
  });

  it('redirects to the canonical slug, keeping the /info suffix', async () => {
    vi.mocked(api.getQr).mockResolvedValue(qr);
    const { result } = renderHook(() => usePartyInfo('xmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.redirectTo).toBe('/christmas/c/JX4KZZ/info');
  });

  it('returns the info for a canonical URL', async () => {
    vi.mocked(api.getQr).mockResolvedValue(qr);
    const { result } = renderHook(() => usePartyInfo('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.info).toEqual(qr);
    expect(result.current.redirectTo).toBeNull();
    expect(api.listPartyGuests).not.toHaveBeenCalled();
  });

  it('loads party-wide guest names when the party shows its guest list', async () => {
    vi.mocked(api.getQr).mockResolvedValue({ ...qr, showGuestList: true });
    vi.mocked(api.listPartyGuests).mockResolvedValue([
      { id: 'g1', name: 'Alex' },
      { id: 'g2', name: null },
    ]);
    const { result } = renderHook(() => usePartyInfo('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.listPartyGuests).toHaveBeenCalledWith('JX4KZZ');
    expect(result.current.partyGuestNames).toEqual(['Alex', 'Guest']);
  });

  it('surfaces an error', async () => {
    vi.mocked(api.getQr).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() => usePartyInfo('christmas', 'JX4KZZ'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('network');
  });
});
