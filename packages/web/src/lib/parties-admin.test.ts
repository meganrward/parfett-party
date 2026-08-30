import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BLANK_PARTY_FORM,
  DEFAULT_ALPHABET,
  fromDatetimeLocal,
  parsePrefixes,
  partyToForm,
  toDatetimeLocal,
  validatePartyForm,
} from './parties-admin';
import type { Party } from './api-types';

describe('datetime-local conversion', () => {
  it('round-trips an ISO string (TZ=UTC in tests)', () => {
    expect(toDatetimeLocal('2026-12-24T19:30:00Z')).toBe('2026-12-24T19:30');
    expect(fromDatetimeLocal('2026-12-24T19:30')).toBe('2026-12-24T19:30:00.000Z');
  });

  it('handles empty / invalid values', () => {
    expect(toDatetimeLocal(null)).toBe('');
    expect(toDatetimeLocal('nope')).toBe('');
    expect(fromDatetimeLocal('')).toBeNull();
  });
});

describe('parsePrefixes', () => {
  it('splits on spaces/commas, uppercases, de-dupes, drops junk', () => {
    expect(parsePrefixes(' j, k  W , j , toolongprefix, !! ')).toEqual(['J', 'K', 'W']);
    expect(parsePrefixes('')).toEqual([]);
  });
});

describe('validatePartyForm', () => {
  const ok = {
    ...BLANK_PARTY_FORM,
    name: 'Parfett Christmas',
    slug: 'christmas',
    prefixes: 'J, K',
  };

  it('accepts a good form and shapes the PartyInput', () => {
    const { errors, values } = validatePartyForm({
      ...ok,
      eventStartLocal: '2026-12-24T19:00',
      eventEndLocal: '2026-12-25T02:00',
      location: '  Home  ',
    });
    expect(errors).toEqual({});
    expect(values).toEqual({
      slug: 'christmas',
      name: 'Parfett Christmas',
      eventStart: '2026-12-24T19:00:00.000Z',
      eventEnd: '2026-12-25T02:00:00.000Z',
      location: 'Home',
      description: null,
      qrCount: 75,
      prefixes: ['J', 'K'],
      tokenLength: 10,
      alphabet: DEFAULT_ALPHABET,
    });
  });

  it('derives the slug from the name when the slug field is blank', () => {
    expect(validatePartyForm({ ...ok, slug: '', name: 'My Birthday!' }).values?.slug).toBe(
      'my-birthday',
    );
  });

  it('flags a reserved slug', () => {
    expect(validatePartyForm({ ...ok, slug: 'admin' }).errors.slug).toMatch(/reserved/i);
  });

  it('flags out-of-range counts and a too-short alphabet', () => {
    const { errors } = validatePartyForm({
      ...ok,
      qrCount: '9000',
      tokenLength: '2',
      alphabet: 'ABC',
    });
    expect(errors.qrCount).toBeDefined();
    expect(errors.tokenLength).toBeDefined();
    expect(errors.alphabet).toBeDefined();
  });

  it('flags an end before the start', () => {
    const { errors } = validatePartyForm({
      ...ok,
      eventStartLocal: '2026-12-24T19:00',
      eventEndLocal: '2026-12-24T18:00',
    });
    expect(errors.eventEndLocal).toMatch(/after the start/i);
  });
});

describe('partyToForm', () => {
  it('maps a Party to editable strings', () => {
    const party: Party = {
      id: 'p1',
      slug: 'christmas',
      name: 'Parfett Christmas',
      eventStart: '2026-12-24T19:00:00Z',
      eventEnd: null,
      location: 'Home',
      description: null,
      qrCount: 60,
      prefixes: ['J', 'K'],
      tokenLength: 12,
      alphabet: DEFAULT_ALPHABET,
      createdAt: 't',
    };
    expect(partyToForm(party)).toMatchObject({
      slug: 'christmas',
      eventStartLocal: '2026-12-24T19:00',
      eventEndLocal: '',
      qrCount: '60',
      prefixes: 'J, K',
      tokenLength: '12',
    });
  });
});

// ---------------------------------------------------------------------------

vi.mock('./api', () => ({
  listMyParties: vi.fn(),
  createParty: vi.fn(),
  updateParty: vi.fn(),
}));

import * as api from './api';
import { useSuperParties } from './parties-admin';

const party = { id: 'p1', slug: 'christmas', name: 'X' } as never;

describe('useSuperParties', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads parties on mount', async () => {
    vi.mocked(api.listMyParties).mockResolvedValue([party]);
    const { result } = renderHook(() => useSuperParties());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.parties).toEqual([party]);
  });

  it('create + update call the API then reload', async () => {
    vi.mocked(api.listMyParties).mockResolvedValue([party]);
    vi.mocked(api.createParty).mockResolvedValue(party);
    vi.mocked(api.updateParty).mockResolvedValue(party);
    const { result } = renderHook(() => useSuperParties());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(() => result.current.create({ slug: 'x', name: 'X' }));
    expect(api.createParty).toHaveBeenCalled();

    await act(() => result.current.update('p1', { name: 'Y' }));
    expect(api.updateParty).toHaveBeenCalledWith('p1', { name: 'Y' });
    expect(api.listMyParties).toHaveBeenCalledTimes(3);
  });

  it('surfaces a load error', async () => {
    vi.mocked(api.listMyParties).mockRejectedValue(new Error('denied'));
    const { result } = renderHook(() => useSuperParties());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('denied');
  });
});
