import { renderHook, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_FILTERS,
  filterCodes,
  sortedPrefixes,
  summariseByPrefix,
  summariseCodes,
} from './admin-guests';
import type { QrCodeWithGuests } from './api-types';

let seq = 0;
const nextId = (p: string) => {
  seq += 1;
  return `${p}-${seq}`;
};

const g = (status: 'going' | 'not_going' | null) => ({
  id: nextId('g'),
  name: null,
  rsvpStatus: status,
  createdAt: '2026-01-01T00:00:00Z',
});

const code = (over: Partial<QrCodeWithGuests>): QrCodeWithGuests => ({
  id: nextId('c'),
  token: 'JX4K',
  prefix: 'J',
  guests: [],
  ...over,
});

const sample: QrCodeWithGuests[] = [
  code({ token: 'JAAA', prefix: 'J', guests: [g('going'), g('going')] }),
  code({ token: 'JBBB', prefix: 'J', guests: [g(null)] }),
  code({ token: 'KCCC', prefix: 'K', guests: [g('not_going')] }),
  code({ token: 'KDDD', prefix: 'K', guests: [] }),
];

describe('sortedPrefixes', () => {
  it('returns unique prefixes in order, ignoring null', () => {
    expect(sortedPrefixes(sample)).toEqual(['J', 'K']);
    expect(sortedPrefixes([code({ prefix: null })])).toEqual([]);
  });
});

describe('filterCodes', () => {
  it('passes everything with empty filters', () => {
    expect(filterCodes(sample, EMPTY_FILTERS)).toHaveLength(4);
  });

  it('filters by prefix', () => {
    expect(filterCodes(sample, { ...EMPTY_FILTERS, prefix: 'K' }).map((c) => c.token)).toEqual([
      'KCCC',
      'KDDD',
    ]);
  });

  it('status "going" keeps codes with a going guest', () => {
    expect(filterCodes(sample, { ...EMPTY_FILTERS, status: 'going' }).map((c) => c.token)).toEqual([
      'JAAA',
    ]);
  });

  it('status "none" keeps only guest-less codes', () => {
    expect(filterCodes(sample, { ...EMPTY_FILTERS, status: 'none' }).map((c) => c.token)).toEqual([
      'KDDD',
    ]);
  });

  it('search matches the token case-insensitively', () => {
    expect(filterCodes(sample, { ...EMPTY_FILTERS, query: 'kc' }).map((c) => c.token)).toEqual([
      'KCCC',
    ]);
  });

  it('combines filters', () => {
    expect(filterCodes(sample, { prefix: 'J', status: 'none', query: '' })).toEqual([]);
  });
});

describe('summariseCodes', () => {
  it('tallies codes, guests, each status and unused codes', () => {
    expect(summariseCodes(sample)).toEqual({
      codes: 4,
      guests: 4,
      going: 2,
      notGoing: 1,
      noResponse: 1,
      unusedCodes: 1,
    });
  });
});

describe('summariseByPrefix', () => {
  it('groups totals per prefix in order', () => {
    const byPrefix = summariseByPrefix(sample);
    expect(byPrefix.map((r) => r.prefix)).toEqual(['J', 'K']);
    expect(byPrefix[0]!.totals).toMatchObject({ codes: 2, guests: 3, going: 2, noResponse: 1 });
    expect(byPrefix[1]!.totals).toMatchObject({ codes: 2, guests: 1, notGoing: 1, unusedCodes: 1 });
  });
});

// ---------------------------------------------------------------------------

vi.mock('./api', () => ({
  getPartyBySlug: vi.fn(),
  listQrCodesWithGuests: vi.fn(),
  updateGuestAdmin: vi.fn(),
  deleteGuest: vi.fn(),
}));

import * as api from './api';
import { useAdminParty } from './admin-guests';

const party = { id: 'p1', slug: 'christmas', name: 'Parfett Christmas' } as never;

describe('useAdminParty', () => {
  beforeEach(() => vi.clearAllMocks());

  it('marks not found for an unknown slug', async () => {
    vi.mocked(api.getPartyBySlug).mockResolvedValue(null);
    const { result } = renderHook(() => useAdminParty('nope'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notFound).toBe(true);
    expect(api.listQrCodesWithGuests).not.toHaveBeenCalled();
  });

  it('loads the party and its codes', async () => {
    vi.mocked(api.getPartyBySlug).mockResolvedValue(party);
    vi.mocked(api.listQrCodesWithGuests).mockResolvedValue(sample);
    const { result } = renderHook(() => useAdminParty('christmas'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.party).toBe(party);
    expect(result.current.codes).toHaveLength(4);
  });

  it('editGuest and removeGuest call the API then reload', async () => {
    vi.mocked(api.getPartyBySlug).mockResolvedValue(party);
    vi.mocked(api.listQrCodesWithGuests).mockResolvedValue(sample);
    vi.mocked(api.updateGuestAdmin).mockResolvedValue();
    vi.mocked(api.deleteGuest).mockResolvedValue();
    const { result } = renderHook(() => useAdminParty('christmas'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.editGuest('g1', { name: 'Sam', status: 'going' }));
    expect(api.updateGuestAdmin).toHaveBeenCalledWith('g1', { name: 'Sam', status: 'going' });

    await act(() => result.current.removeGuest('g1'));
    expect(api.deleteGuest).toHaveBeenCalledWith('g1');
    // initial load + 2 reloads
    expect(api.listQrCodesWithGuests).toHaveBeenCalledTimes(3);
  });

  it('surfaces a load error', async () => {
    vi.mocked(api.getPartyBySlug).mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useAdminParty('christmas'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('denied');
  });
});
