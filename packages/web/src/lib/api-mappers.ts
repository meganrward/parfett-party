import type { Database } from './database.types';
import type { CalendarEvent } from './calendar';
import type { Guest, RsvpStatus } from './guests';
import type { HostRow, Party, PartyInput, QrCodeWithGuests, QrInfo } from './api-types';

type PartyRow = Database['public']['Tables']['parties']['Row'];
type HostTableRow = Database['public']['Tables']['hosts']['Row'];
type PartyWrite = Database['public']['Tables']['parties']['Insert'];

/**
 * get_qr's generated Returns type marks every column non-null (Postgres can't
 * express nullability of a `returns table` column). At runtime the party fields
 * are null when unset, so accept a looser shape here.
 */
export interface GetQrRowish {
  found: boolean;
  slug?: string | null;
  party_name?: string | null;
  event_start?: string | null;
  event_end?: string | null;
  location?: string | null;
  description?: string | null;
  guest_count?: number | null;
}

/** Coerce a free-form DB string into our RsvpStatus union. */
export function toRsvpStatus(value: string | null | undefined): RsvpStatus | null {
  return value === 'going' || value === 'not_going' ? value : null;
}

export interface GuestRowish {
  id: string;
  name: string | null;
  rsvp_status: string | null;
  created_at: string;
}

export function mapGuest(row: GuestRowish): Guest {
  return {
    id: row.id,
    name: row.name,
    rsvpStatus: toRsvpStatus(row.rsvp_status),
    createdAt: row.created_at,
  };
}

export function mapQrInfo(row: GetQrRowish): QrInfo {
  return {
    slug: row.slug ?? '',
    partyName: row.party_name ?? '',
    eventStart: row.event_start ?? null,
    eventEnd: row.event_end ?? null,
    location: row.location ?? null,
    description: row.description ?? null,
    guestCount: row.guest_count ?? 0,
  };
}

/** Shape QrInfo for the calendar helpers. */
export function qrInfoToCalendarEvent(info: QrInfo): CalendarEvent {
  return {
    name: info.partyName,
    description: info.description,
    location: info.location,
    eventStart: info.eventStart,
    eventEnd: info.eventEnd,
  };
}

export function mapParty(row: PartyRow): Party {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    eventStart: row.event_start,
    eventEnd: row.event_end,
    location: row.location,
    description: row.description,
    qrCount: row.qr_count,
    prefixes: row.prefixes ?? [],
    tokenLength: row.token_length,
    alphabet: row.alphabet,
    createdAt: row.created_at,
  };
}

export function mapHost(row: HostTableRow): HostRow {
  return {
    userId: row.user_id,
    name: row.name,
    isAdmin: row.is_admin,
  };
}

export interface QrCodeRowish {
  id: string;
  token: string;
  prefix: string | null;
  guests: GuestRowish[] | null;
}

export function mapQrCodeWithGuests(row: QrCodeRowish): QrCodeWithGuests {
  return {
    id: row.id,
    token: row.token,
    prefix: row.prefix,
    guests: (row.guests ?? []).map(mapGuest),
  };
}

/** camelCase PartyInput -> the snake_case columns, omitting undefined fields. */
export function partyInputToRow(input: Partial<PartyInput>): PartyWrite {
  const row: Record<string, unknown> = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.name !== undefined) row.name = input.name;
  if (input.eventStart !== undefined) row.event_start = input.eventStart;
  if (input.eventEnd !== undefined) row.event_end = input.eventEnd;
  if (input.location !== undefined) row.location = input.location;
  if (input.description !== undefined) row.description = input.description;
  if (input.qrCount !== undefined) row.qr_count = input.qrCount;
  if (input.prefixes !== undefined) row.prefixes = input.prefixes;
  if (input.tokenLength !== undefined) row.token_length = input.tokenLength;
  if (input.alphabet !== undefined) row.alphabet = input.alphabet;
  return row as PartyWrite;
}
