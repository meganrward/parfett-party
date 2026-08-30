import { useCallback, useEffect, useState } from 'react';
import * as api from './api';
import { isValidSlug, normaliseSlug } from './slug';
import type { Party, PartyInput } from './api-types';

/** Ambiguity-free default (no 0/O/1/I/5/S); matches the DB column default. */
export const DEFAULT_ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ23456789';

// ---------------------------------------------------------------------------
// Party form <-> PartyInput
// ---------------------------------------------------------------------------

export const RESERVED_SLUGS = ['admin', 'parties', 'hosts', 'c', 'api'];

export interface PartyForm {
  slug: string;
  name: string;
  eventStartLocal: string; // datetime-local value, '' = unset
  eventEndLocal: string;
  location: string;
  description: string;
  qrCount: string;
  prefixes: string; // comma/space separated
  tokenLength: string;
  alphabet: string;
}

export const BLANK_PARTY_FORM: PartyForm = {
  slug: '',
  name: '',
  eventStartLocal: '',
  eventEndLocal: '',
  location: '',
  description: '',
  qrCount: '75',
  prefixes: '',
  tokenLength: '10',
  alphabet: DEFAULT_ALPHABET,
};

/** ISO string -> value for <input type="datetime-local"> ('' when empty/invalid). */
export function toDatetimeLocal(iso: string | null): string {
  if (!iso || Number.isNaN(Date.parse(iso))) {
    return '';
  }
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocal(local: string): string | null {
  if (!local) {
    return null;
  }
  const ms = Date.parse(local);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

export function parsePrefixes(input: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.split(/[\s,]+/)) {
    const p = raw.trim().toUpperCase();
    if (p && /^[A-Z0-9]{1,8}$/.test(p) && !seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

export function partyToForm(party: Party): PartyForm {
  return {
    slug: party.slug,
    name: party.name,
    eventStartLocal: toDatetimeLocal(party.eventStart),
    eventEndLocal: toDatetimeLocal(party.eventEnd),
    location: party.location ?? '',
    description: party.description ?? '',
    qrCount: String(party.qrCount),
    prefixes: party.prefixes.join(', '),
    tokenLength: String(party.tokenLength),
    alphabet: party.alphabet,
  };
}

export interface PartyFormResult {
  errors: Partial<Record<keyof PartyForm, string>>;
  values: PartyInput | null;
}

export function validatePartyForm(form: PartyForm): PartyFormResult {
  const errors: Partial<Record<keyof PartyForm, string>> = {};

  const slug = normaliseSlug(form.slug || form.name);
  if (!isValidSlug(slug)) {
    errors.slug = 'Use 2–40 lowercase letters, numbers and hyphens.';
  } else if (RESERVED_SLUGS.includes(slug)) {
    errors.slug = `"${slug}" is reserved — pick another.`;
  }

  const name = form.name.trim();
  if (name.length === 0 || name.length > 120) {
    errors.name = 'Give the party a name (up to 120 characters).';
  }

  const qrCount = Number(form.qrCount);
  if (!Number.isInteger(qrCount) || qrCount < 1 || qrCount > 2000) {
    errors.qrCount = 'Between 1 and 2000.';
  }

  const tokenLength = Number(form.tokenLength);
  if (!Number.isInteger(tokenLength) || tokenLength < 4 || tokenLength > 24) {
    errors.tokenLength = 'Between 4 and 24.';
  }

  const alphabet = form.alphabet.trim();
  if (alphabet.length < 10 || alphabet.length > 64) {
    errors.alphabet = 'Between 10 and 64 characters.';
  }

  const eventStart = fromDatetimeLocal(form.eventStartLocal);
  const eventEnd = fromDatetimeLocal(form.eventEndLocal);
  if (eventEnd && eventStart && Date.parse(eventEnd) < Date.parse(eventStart)) {
    errors.eventEndLocal = 'End must be after the start.';
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values: null };
  }

  return {
    errors,
    values: {
      slug,
      name,
      eventStart,
      eventEnd,
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      qrCount,
      prefixes: parsePrefixes(form.prefixes),
      tokenLength,
      alphabet,
    },
  };
}

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------

export interface SuperPartiesState {
  parties: Party[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  create: (input: PartyInput) => Promise<Party>;
  update: (id: string, patch: Partial<PartyInput>) => Promise<Party>;
}

export function useSuperParties(): SuperPartiesState {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setParties(await api.listMyParties());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(
    async (input: PartyInput) => {
      const party = await api.createParty(input);
      await reload();
      return party;
    },
    [reload],
  );

  const update = useCallback(
    async (id: string, patch: Partial<PartyInput>) => {
      const party = await api.updateParty(id, patch);
      await reload();
      return party;
    },
    [reload],
  );

  return { parties, loading, error, reload, create, update };
}
