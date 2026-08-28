import { describe, expect, it } from 'vitest';
import {
  guestDisplayName,
  isFirstVisit,
  rsvpStatusLabel,
  rsvpStatusTone,
  sortGuests,
  summariseGuests,
  type Guest,
} from './guests';

const guest = (over: Partial<Guest>): Guest => ({
  id: 'g1',
  name: null,
  rsvpStatus: null,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
});

describe('guestDisplayName', () => {
  it('falls back to "Guest" for empty / whitespace names', () => {
    expect(guestDisplayName({ name: null })).toBe('Guest');
    expect(guestDisplayName({ name: '   ' })).toBe('Guest');
    expect(guestDisplayName({ name: ' Dave ' })).toBe('Dave');
  });
});

describe('isFirstVisit', () => {
  it('is true only for an empty list', () => {
    expect(isFirstVisit([])).toBe(true);
    expect(isFirstVisit([guest({})])).toBe(false);
  });
});

describe('sortGuests', () => {
  it('orders by createdAt then id, without mutating the input', () => {
    const input = [
      guest({ id: 'b', createdAt: '2026-01-02T00:00:00Z' }),
      guest({ id: 'a', createdAt: '2026-01-01T00:00:00Z' }),
      guest({ id: 'c', createdAt: '2026-01-01T00:00:00Z' }),
    ];
    expect(sortGuests(input).map((g) => g.id)).toEqual(['a', 'c', 'b']);
    expect(input[0]!.id).toBe('b');
  });
});

describe('summariseGuests', () => {
  it('counts each status bucket and the total', () => {
    expect(
      summariseGuests([
        guest({ rsvpStatus: 'going' }),
        guest({ rsvpStatus: 'going' }),
        guest({ rsvpStatus: 'not_going' }),
        guest({ rsvpStatus: null }),
      ]),
    ).toEqual({ going: 2, notGoing: 1, noResponse: 1, total: 4 });
  });

  it('is all-zero for an empty list', () => {
    expect(summariseGuests([])).toEqual({ going: 0, notGoing: 0, noResponse: 0, total: 0 });
  });
});

describe('rsvp status presentation', () => {
  it('labels each status', () => {
    expect(rsvpStatusLabel('going')).toBe('Going');
    expect(rsvpStatusLabel('not_going')).toBe('Not going');
    expect(rsvpStatusLabel(null)).toBe('Awaiting response');
  });

  it('maps each status to a design-system tone', () => {
    expect(rsvpStatusTone('going')).toBe('positive');
    expect(rsvpStatusTone('not_going')).toBe('negative');
    expect(rsvpStatusTone(null)).toBe('warning');
  });
});
