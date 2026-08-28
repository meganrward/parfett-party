/** Party slug helpers. Mirrors the DB check: ^[a-z0-9]+(-[a-z0-9]+)*$, length 2..40. */

export const SLUG_MIN = 2;
export const SLUG_MAX = 40;

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Best-effort conversion of free text (e.g. a party name) into a valid slug. */
export function normaliseSlug(input: string): string {
  return input
    .normalize('NFKD') // decompose accents: "é" -> "e" + combining mark
    .replace(/\p{Diacritic}/gu, '') // drop the marks so "fête" -> "fete"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // any other non-alphanumerics -> hyphen
    .replace(/-+/g, '-') // collapse runs
    .replace(/^-|-$/g, '') // trim hyphens
    .slice(0, SLUG_MAX)
    .replace(/-$/, ''); // slice may have left a trailing hyphen
}

export function isValidSlug(slug: string): boolean {
  return slug.length >= SLUG_MIN && slug.length <= SLUG_MAX && SLUG_RE.test(slug);
}

/**
 * Guest-flow canonicalisation: given the slug in the URL and the canonical slug
 * the token actually belongs to, return the path to redirect to, or null to stay.
 */
export function canonicalRedirectPath(args: {
  urlSlug: string;
  canonicalSlug: string;
  token: string;
}): string | null {
  const { urlSlug, canonicalSlug, token } = args;
  if (!canonicalSlug || urlSlug === canonicalSlug) {
    return null;
  }
  return `/${canonicalSlug}/c/${token}`;
}
