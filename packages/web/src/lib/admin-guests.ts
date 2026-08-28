import { useCallback, useEffect, useState } from 'react';
import * as api from './api';
import type { GuestPatch, Party, QrCodeWithGuests } from './api-types';
import { sortGuests, type Guest, type RsvpStatus } from './guests';

// ---------------------------------------------------------------------------
// Pure: flatten to one entry per guest response, then filter / summarise
// ---------------------------------------------------------------------------

/** 'awaiting' = guest with no response yet. */
export type StatusFilter = 'all' | RsvpStatus | 'awaiting';

export interface GuestFilters {
  prefix: string; // '' = any
  status: StatusFilter;
  query: string; // token substring, case-insensitive
}

export const EMPTY_FILTERS: GuestFilters = { prefix: '', status: 'all', query: '' };

/** One row of the guests table: a single guest plus the card they're on. */
export interface GuestEntry {
  guest: Guest;
  codeId: string;
  token: string;
  prefix: string | null;
}

export function sortedPrefixes(codes: readonly QrCodeWithGuests[]): string[] {
  const set = new Set<string>();
  for (const c of codes) {
    if (c.prefix) {
      set.add(c.prefix);
    }
  }
  return [...set].sort();
}

/** Explode the codes into guest entries, oldest guest first, grouped by code order. */
export function flattenGuestEntries(codes: readonly QrCodeWithGuests[]): GuestEntry[] {
  return codes.flatMap((code) =>
    sortGuests(code.guests).map((guest) => ({
      guest,
      codeId: code.id,
      token: code.token,
      prefix: code.prefix,
    })),
  );
}

function entryMatchesStatus(entry: GuestEntry, status: StatusFilter): boolean {
  if (status === 'all') {
    return true;
  }
  if (status === 'awaiting') {
    return entry.guest.rsvpStatus === null;
  }
  return entry.guest.rsvpStatus === status;
}

export function filterGuestEntries(
  entries: readonly GuestEntry[],
  filters: GuestFilters,
): GuestEntry[] {
  const query = filters.query.trim().toLowerCase();
  return entries.filter(
    (entry) =>
      (!filters.prefix || entry.prefix === filters.prefix) &&
      entryMatchesStatus(entry, filters.status) &&
      (!query || entry.token.toLowerCase().includes(query)),
  );
}

export interface GuestTotals {
  codes: number;
  guests: number;
  going: number;
  notGoing: number;
  noResponse: number;
  unusedCodes: number;
}

export function summariseCodes(codes: readonly QrCodeWithGuests[]): GuestTotals {
  const totals: GuestTotals = {
    codes: codes.length,
    guests: 0,
    going: 0,
    notGoing: 0,
    noResponse: 0,
    unusedCodes: 0,
  };
  for (const code of codes) {
    if (code.guests.length === 0) {
      totals.unusedCodes += 1;
    }
    for (const g of code.guests) {
      totals.guests += 1;
      if (g.rsvpStatus === 'going') {
        totals.going += 1;
      } else if (g.rsvpStatus === 'not_going') {
        totals.notGoing += 1;
      } else {
        totals.noResponse += 1;
      }
    }
  }
  return totals;
}

/** Totals for each prefix, in prefix order; the "" key holds prefix-less codes. */
export function summariseByPrefix(
  codes: readonly QrCodeWithGuests[],
): Array<{ prefix: string; totals: GuestTotals }> {
  const groups = new Map<string, QrCodeWithGuests[]>();
  for (const code of codes) {
    const key = code.prefix ?? '';
    const list = groups.get(key) ?? [];
    list.push(code);
    groups.set(key, list);
  }
  return [...groups.keys()]
    .sort()
    .map((prefix) => ({ prefix, totals: summariseCodes(groups.get(prefix)!) }));
}

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

export interface AdminPartyState {
  loading: boolean;
  notFound: boolean;
  error: string | null;
  party: Party | null;
  codes: QrCodeWithGuests[];
  reload: () => Promise<void>;
  editGuest: (id: string, patch: GuestPatch) => Promise<void>;
  removeGuest: (id: string) => Promise<void>;
}

/** Loads a party (by slug) and its QR codes + nested guests for the admin views. */
export function useAdminParty(slug: string): AdminPartyState {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [party, setParty] = useState<Party | null>(null);
  const [codes, setCodes] = useState<QrCodeWithGuests[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const found = await api.getPartyBySlug(slug);
      if (!found) {
        setNotFound(true);
        return;
      }
      setParty(found);
      setCodes(await api.listQrCodesWithGuests(found.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the party');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const editGuest = useCallback(
    async (id: string, patch: GuestPatch) => {
      await api.updateGuestAdmin(id, patch);
      await load();
    },
    [load],
  );

  const removeGuest = useCallback(
    async (id: string) => {
      await api.deleteGuest(id);
      await load();
    },
    [load],
  );

  return { loading, notFound, error, party, codes, reload: load, editGuest, removeGuest };
}
