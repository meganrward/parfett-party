import { describe, expect, it } from 'vitest';
import {
  escapeICSText,
  foldICSLine,
  formatEventWhen,
  googleCalendarUrl,
  hasCalendarInfo,
  icsContent,
  icsDownloadFilename,
  inviteWhenParts,
  ordinalSuffix,
  toICSDate,
  type CalendarEvent,
} from './calendar';

const event: CalendarEvent = {
  name: 'Parfett Christmas',
  description: 'BYOB; santa hats mandatory',
  location: '12 Parfett St, London',
  eventStart: '2026-12-24T19:00:00Z',
  eventEnd: '2026-12-25T02:00:00Z',
};

describe('hasCalendarInfo', () => {
  it('needs a parseable start', () => {
    expect(hasCalendarInfo(event)).toBe(true);
    expect(hasCalendarInfo({ eventStart: null })).toBe(false);
    expect(hasCalendarInfo({ eventStart: 'not a date' })).toBe(false);
  });
});

describe('toICSDate', () => {
  it('formats as UTC basic', () => {
    expect(toICSDate(new Date('2026-12-24T19:00:00Z'))).toBe('20261224T190000Z');
  });
});

describe('googleCalendarUrl', () => {
  it('is null without a start time', () => {
    expect(googleCalendarUrl({ ...event, eventStart: null })).toBeNull();
  });

  it('encodes title, range, details and location', () => {
    const url = new URL(googleCalendarUrl(event)!);
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Parfett Christmas');
    expect(url.searchParams.get('dates')).toBe('20261224T190000Z/20261225T020000Z');
    expect(url.searchParams.get('details')).toBe('BYOB; santa hats mandatory');
    expect(url.searchParams.get('location')).toBe('12 Parfett St, London');
  });

  it('defaults the end to start + 3h when missing', () => {
    const url = new URL(googleCalendarUrl({ ...event, eventEnd: null })!);
    expect(url.searchParams.get('dates')).toBe('20261224T190000Z/20261224T220000Z');
  });
});

describe('escapeICSText', () => {
  it('escapes backslash, semicolon, comma and newlines', () => {
    expect(escapeICSText('a, b; c \\ d\ne')).toBe('a\\, b\\; c \\\\ d\\ne');
  });
});

describe('foldICSLine', () => {
  it('leaves short lines untouched', () => {
    expect(foldICSLine('SUMMARY:short')).toBe('SUMMARY:short');
  });

  it('folds long lines to <=75 octets with CRLF + space continuations', () => {
    const folded = foldICSLine('X'.repeat(200));
    const parts = folded.split('\r\n');
    expect(parts[0]!.length).toBe(75);
    expect(parts.slice(1).every((p) => p.startsWith(' ') && p.length <= 75)).toBe(true);
    expect(parts.map((p, i) => (i === 0 ? p : p.slice(1))).join('')).toBe('X'.repeat(200));
  });
});

describe('icsContent', () => {
  it('is null without a start time', () => {
    expect(icsContent({ ...event, eventStart: null })).toBeNull();
  });

  it('produces a VEVENT with UTC stamps, a stable UID and CRLF line endings', () => {
    const ics = icsContent(event, new Date('2026-11-01T09:00:00Z'))!;
    expect(ics).toContain('\r\n');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261224T190000Z');
    expect(ics).toContain('DTEND:20261225T020000Z');
    expect(ics).toContain('DTSTAMP:20261101T090000Z');
    expect(ics).toContain('UID:parfett-christmas-20261224T190000Z@parfett.party');
    expect(ics).toContain('SUMMARY:Parfett Christmas');
    expect(ics).toContain('LOCATION:12 Parfett St\\, London');
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
  });

  it('omits optional lines when absent', () => {
    const ics = icsContent({ name: 'Bare', eventStart: '2026-12-24T19:00:00Z' })!;
    expect(ics).not.toContain('LOCATION:');
    expect(ics).not.toContain('DESCRIPTION:');
  });
});

describe('icsDownloadFilename', () => {
  it('slugifies the name', () => {
    expect(icsDownloadFilename({ name: 'Parfett Christmas!' })).toBe('parfett-christmas.ics');
    expect(icsDownloadFilename({ name: '///' })).toBe('event.ics');
  });
});

describe('ordinalSuffix', () => {
  it('handles the teens as TH', () => {
    expect([11, 12, 13].map(ordinalSuffix)).toEqual(['TH', 'TH', 'TH']);
  });

  it('picks ST / ND / RD / TH by last digit', () => {
    expect([1, 21, 31].map(ordinalSuffix)).toEqual(['ST', 'ST', 'ST']);
    expect([2, 22].map(ordinalSuffix)).toEqual(['ND', 'ND']);
    expect([3, 23].map(ordinalSuffix)).toEqual(['RD', 'RD']);
    expect([4, 10, 20].map(ordinalSuffix)).toEqual(['TH', 'TH', 'TH']);
  });
});

describe('inviteWhenParts', () => {
  it('is null without a parseable start', () => {
    expect(inviteWhenParts({ eventStart: null })).toBeNull();
    expect(inviteWhenParts({ eventStart: 'nope' })).toBeNull();
  });

  it('breaks the start into time / day / ordinal / month-year (en-GB, 24h)', () => {
    expect(inviteWhenParts({ eventStart: '2026-11-21T19:00:00Z' })).toEqual({
      time: '19:00',
      day: 21,
      ordinal: 'ST',
      monthYear: 'NOVEMBER 2026',
    });
  });
});

describe('formatEventWhen', () => {
  // The suite runs with TZ=UTC (vitest.config.ts). Make that assumption explicit.
  it('assumes a UTC test timezone', () => {
    expect(new Date('2026-09-11T19:00:00Z').getUTCHours()).toBe(19);
    expect(new Date('2026-09-11T19:00:00Z').getHours()).toBe(19);
  });

  it('is null without a start', () => {
    expect(formatEventWhen({ eventStart: null, eventEnd: null })).toBeNull();
    expect(formatEventWhen({ eventStart: 'nope', eventEnd: null })).toBeNull();
  });

  it('formats a start-only event (en-GB, 24h)', () => {
    expect(formatEventWhen({ eventStart: '2026-09-11T19:00:00Z', eventEnd: null })).toBe(
      'Fri, 11 Sept 2026, 19:00',
    );
  });

  it('shows just the end time when the event ends the same day', () => {
    expect(
      formatEventWhen({ eventStart: '2026-09-11T19:00:00Z', eventEnd: '2026-09-11T23:30:00Z' }),
    ).toBe('Fri, 11 Sept 2026, 19:00 – 23:30');
  });

  it('shows the full end date when the event crosses midnight', () => {
    expect(
      formatEventWhen({ eventStart: '2026-09-11T19:00:00Z', eventEnd: '2026-09-12T02:00:00Z' }),
    ).toBe('Fri, 11 Sept 2026, 19:00 – Sat, 12 Sept 2026, 02:00');
  });
});
