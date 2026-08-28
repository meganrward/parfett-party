import { describe, expect, it } from 'vitest';
import {
  escapeICSText,
  foldICSLine,
  googleCalendarUrl,
  hasCalendarInfo,
  icsContent,
  icsDownloadFilename,
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
