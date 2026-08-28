import { useCallback, useEffect, useState } from 'react';
import * as api from './api';
import type { GuestPatch, Party, QrCodeWithGuests } from './api-types';
import type { RsvpStatus } from './guests';

// ---------------------------------------------------------------------------
// Pure filtering + summary logic
// ---------------------------------------------------------------------------

/** 'none' = codes with no guests at all. */
export type StatusFilter = 'all' | RsvpStatus | 'none';

export interface CodeFilters {
  prefix: string; // '' = any
  status: StatusFilter;
  query: string; // token substring, case-insensitive
}

export const EMPTY_FILTERS: CodeFilters = { prefix: '', status: 'all', query: '' };

export function sortedPrefixes(codes: readonly QrCodeWithGuests[]): string[] {
  const set = new Set<string>();
  for (const c of codes) {
    if (c.prefix) {
      set.add(c.prefix);
    }
  }
  return [...set].sort();
}

function codeMatchesStatus(code: QrCodeWithGuests, status: StatusFilter): boolean {
  if (status === 'all') {
    return true;
  }
  if (status === 'none') {
    return code.guests.length === 0;
  }
  return code.guests.some((g) => g.rsvpStatus === status);
}

export function filterCodes(
  codes: readonly QrCodeWithGuests[],
  filters: CodeFilters,
): QrCodeWithGuests[] {
  const query = filters.query.trim().toLowerCase();
  return codes.filter(
    (code) =>
      (!filters.prefix || code.prefix === filters.prefix) &&
      codeMatchesStatus(code, filters.status) &&
      (!query || code.token.toLowerCase().includes(query)),
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
