/**
 * Which housemate hands out cards with each prefix. Edit this map to match your
 * housemates and the prefixes you generate. Prefixes not listed just show the
 * bare letter in the admin views.
 */
const HOUSEMATE_BY_PREFIX: Record<string, string> = {
  J: 'Housemate J',
  K: 'Housemate K',
  W: 'Housemate W',
  M: 'Housemate M',
  X: 'Housemate X',
};

export function housemateForPrefix(prefix: string | null | undefined): string | null {
  if (!prefix) {
    return null;
  }
  return HOUSEMATE_BY_PREFIX[prefix.toUpperCase()] ?? null;
}

/** Label for the "handed out by" column: the housemate name, or the bare prefix. */
export function handedOutByLabel(prefix: string | null | undefined): string {
  return housemateForPrefix(prefix) ?? prefix ?? '—';
}
