import { describe, expect, it } from 'vitest';
import {
  mapAdmin,
  mapGuest,
  mapParty,
  mapQrCodeWithGuests,
  mapQrInfo,
  partyInputToRow,
  qrInfoToCalendarEvent,
  toRsvpStatus,
} from './api-mappers';

describe('toRsvpStatus', () => {
  it('passes through the two valid values, nulls everything else', () => {
    expect(toRsvpStatus('going')).toBe('going');
    expect(toRsvpStatus('not_going')).toBe('not_going');
    expect(toRsvpStatus('maybe')).toBeNull();
    expect(toRsvpStatus(null)).toBeNull();
    expect(toRsvpStatus(undefined)).toBeNull();
  });
});

describe('mapGuest', () => {
  it('camelCases and coerces the status', () => {
    expect(
      mapGuest({
        id: 'g1',
        name: ' Dave ',
        rsvp_status: 'going',
        created_at: '2026-01-01T00:00:00Z',
      }),
    ).toEqual({ id: 'g1', name: ' Dave ', rsvpStatus: 'going', createdAt: '2026-01-01T00:00:00Z' });
    expect(
      mapGuest({ id: 'g2', name: null, rsvp_status: 'weird', created_at: 't' }).rsvpStatus,
    ).toBeNull();
  });
});

describe('mapQrInfo', () => {
  it('maps the get_qr row shape', () => {
    expect(
      mapQrInfo({
        found: true,
        slug: 'christmas',
        party_name: 'Parfett Christmas',
        event_start: '2026-12-24T19:00:00Z',
        event_end: null,
        location: 'Home',
        description: null,
        guest_count: 3,
      }),
    ).toEqual({
      slug: 'christmas',
      partyName: 'Parfett Christmas',
      eventStart: '2026-12-24T19:00:00Z',
      eventEnd: null,
      location: 'Home',
      description: null,
      guestCount: 3,
    });
  });
});

const partyRow = {
  id: 'p1',
  slug: 'christmas',
  name: 'Parfett Christmas',
  event_start: null,
  event_end: null,
  location: null,
  description: null,
  qr_count: 75,
  prefixes: ['J', 'K'],
  token_length: 10,
  alphabet: 'ABCDEFGHJKLMNPQRTUVWXYZ23456789',
  created_at: '2026-01-01T00:00:00Z',
};

describe('qrInfoToCalendarEvent', () => {
  it('renames partyName -> name and carries the event fields', () => {
    expect(
      qrInfoToCalendarEvent({
        slug: 'christmas',
        partyName: 'Parfett Christmas',
        eventStart: '2026-12-24T19:00:00Z',
        eventEnd: null,
        location: 'Home',
        description: 'BYOB',
        guestCount: 3,
      }),
    ).toEqual({
      name: 'Parfett Christmas',
      description: 'BYOB',
      location: 'Home',
      eventStart: '2026-12-24T19:00:00Z',
      eventEnd: null,
    });
  });
});

describe('mapParty', () => {
  it('camelCases every column and defaults prefixes', () => {
    const party = mapParty(partyRow);
    expect(party).toMatchObject({ id: 'p1', slug: 'christmas', qrCount: 75, prefixes: ['J', 'K'] });
    expect(mapParty({ ...partyRow, prefixes: null as unknown as string[] }).prefixes).toEqual([]);
  });
});

describe('mapAdmin', () => {
  it('camelCases', () => {
    expect(
      mapAdmin({ user_id: 'u1', display_name: 'Meg', is_super: true, created_at: 't' }),
    ).toEqual({
      userId: 'u1',
      displayName: 'Meg',
      isSuper: true,
    });
  });
});

describe('mapQrCodeWithGuests', () => {
  it('maps the code and its nested guests, tolerating a null guests array', () => {
    expect(
      mapQrCodeWithGuests({
        id: 'q1',
        token: 'JX4K',
        prefix: 'J',
        guests: [{ id: 'g1', name: 'A', rsvp_status: 'going', created_at: 't' }],
      }),
    ).toEqual({
      id: 'q1',
      token: 'JX4K',
      prefix: 'J',
      guests: [{ id: 'g1', name: 'A', rsvpStatus: 'going', createdAt: 't' }],
    });
    expect(
      mapQrCodeWithGuests({ id: 'q2', token: 'W9', prefix: null, guests: null }).guests,
    ).toEqual([]);
  });
});

describe('partyInputToRow', () => {
  it('snake_cases provided fields and omits undefined ones', () => {
    expect(
      partyInputToRow({
        name: 'X',
        slug: 'x',
        eventStart: '2026-01-01T00:00:00Z',
        prefixes: ['A'],
      }),
    ).toEqual({ name: 'X', slug: 'x', event_start: '2026-01-01T00:00:00Z', prefixes: ['A'] });
  });

  it('keeps explicit null (clearing a field) but drops undefined', () => {
    const row = partyInputToRow({ location: null, description: undefined });
    expect(row).toEqual({ location: null });
    expect('description' in row).toBe(false);
  });

  it('maps every optional generation field', () => {
    expect(
      partyInputToRow({
        eventEnd: '2026-12-25T02:00:00Z',
        qrCount: 30,
        tokenLength: 8,
        alphabet: 'ABCDEFGHJK',
        description: 'copy',
      }),
    ).toEqual({
      event_end: '2026-12-25T02:00:00Z',
      qr_count: 30,
      token_length: 8,
      alphabet: 'ABCDEFGHJK',
      description: 'copy',
    });
  });
});
