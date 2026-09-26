/** QR-token helpers. Tokens are compared case-insensitively server-side. */

export const TOKEN_MIN = 4;
export const TOKEN_MAX = 40;

const TOKEN_RE = /^[A-Z0-9]{4,40}$/;

/** Canonical form for lookups/display: strip all whitespace, uppercase. */
export function normaliseToken(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

/**
 * Cheap client-side sanity check before hitting the server. Not authoritative —
 * an unknown-but-well-formed token still has to be checked with get_qr.
 */
export function isPlausibleToken(input: string): boolean {
  return TOKEN_RE.test(normaliseToken(input));
}
