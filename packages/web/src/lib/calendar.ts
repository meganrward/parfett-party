/** "Add to calendar" helpers — a Google template URL and an .ics document. */

export interface CalendarEvent {
  name: string;
  description?: string | null;
  location?: string | null;
  /** ISO 8601 strings (Supabase timestamptz). */
  eventStart?: string | null;
  eventEnd?: string | null;
}

const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

/** The calendar buttons only make sense once a start time exists. */
export function hasCalendarInfo(event: Pick<CalendarEvent, 'eventStart'>): boolean {
  return Boolean(event.eventStart) && !Number.isNaN(Date.parse(event.eventStart as string));
}

function resolveRange(event: CalendarEvent): { start: Date; end: Date } | null {
  if (!hasCalendarInfo(event)) {
    return null;
  }
  const start = new Date(event.eventStart as string);
  const end =
    event.eventEnd && !Number.isNaN(Date.parse(event.eventEnd))
      ? new Date(event.eventEnd)
      : new Date(start.getTime() + DEFAULT_DURATION_MS);
  return { start, end };
}

/** UTC basic format, e.g. 20261224T190000Z. */
export function toICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function googleCalendarUrl(event: CalendarEvent): string | null {
  const range = resolveRange(event);
  if (!range) {
    return null;
  }
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${toICSDate(range.start)}/${toICSDate(range.end)}`,
  });
  if (event.description) {
    params.set('details', event.description);
  }
  if (event.location) {
    params.set('location', event.location);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Escape a value for an iCalendar text field (RFC 5545 §3.3.11). */
export function escapeICSText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line to <=75 octets with CRLF + space continuations. */
export function foldICSLine(line: string): string {
  if (line.length <= 75) {
    return line;
  }
  const chunks: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 74) {
    chunks.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  chunks.push(` ${rest}`);
  return chunks.join('\r\n');
}

function slugishName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'event'
  );
}

function stableUid(event: CalendarEvent, start: Date): string {
  return `${slugishName(event.name)}-${toICSDate(start)}@parfett.party`;
}

export function icsContent(event: CalendarEvent, now: Date = new Date()): string | null {
  const range = resolveRange(event);
  if (!range) {
    return null;
  }
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Parfett Party//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${stableUid(event, range.start)}`,
    `DTSTAMP:${toICSDate(now)}`,
    `DTSTART:${toICSDate(range.start)}`,
    `DTEND:${toICSDate(range.end)}`,
    `SUMMARY:${escapeICSText(event.name)}`,
  ];
  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`);
  }
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(foldICSLine).join('\r\n');
}

export function icsDownloadFilename(event: Pick<CalendarEvent, 'name'>): string {
  return `${slugishName(event.name)}.ics`;
}

/** Thin DOM wrapper; the string builder above is what tests exercise. */
export function icsBlob(event: CalendarEvent): Blob | null {
  const content = icsContent(event);
  return content === null ? null : new Blob([content], { type: 'text/calendar;charset=utf-8' });
}
