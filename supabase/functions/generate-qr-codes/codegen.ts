/**
 * Pure QR-token generation logic. No I/O, no Deno APIs — unit tested in isolation.
 */

export const DEFAULT_ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ23456789';

/** Split `total` into `groupCount` buckets as evenly as possible; remainder to the earliest. */
export function splitCount(total: number, groupCount: number): number[] {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error('total must be a non-negative integer');
  }
  if (!Number.isInteger(groupCount) || groupCount <= 0) {
    throw new Error('groupCount must be a positive integer');
  }
  const base = Math.floor(total / groupCount);
  const remainder = total % groupCount;
  return Array.from({ length: groupCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Uppercase, de-duplicated alphabet with the prefix's own letters removed. */
export function bodyAlphabet(alphabet: string, prefix: string): string {
  const exclude = new Set(prefix.toUpperCase().split(''));
  const chars = Array.from(new Set(alphabet.toUpperCase().split(''))).filter(
    (c) => !exclude.has(c) && c.trim().length > 0,
  );
  if (chars.length < 2) {
    throw new Error('alphabet has fewer than 2 usable characters after removing prefix letters');
  }
  return chars.join('');
}

export type RandomInt = (maxExclusive: number) => number;

/** Uniform integer in [0, max) via rejection sampling over crypto bytes. */
export const cryptoRandomInt: RandomInt = (max) => {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error('max must be a positive integer');
  }
  const limit = Math.floor(0xffffffff / max) * max;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0]!;
  } while (x >= limit);
  return x % max;
};

export function randomBody(length: number, alphabet: string, randomInt: RandomInt): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[randomInt(alphabet.length)];
  }
  return out;
}

export interface PlanOptions {
  count: number;
  prefixes: string[];
  tokenLength: number;
  alphabet: string;
  /** Existing tokens to avoid (any case). */
  existing: Iterable<string>;
  randomInt?: RandomInt;
  maxAttemptsPerToken?: number;
}

export interface PlannedToken {
  token: string;
  prefix: string | null;
}

/**
 * Build `count` unique tokens. With prefixes, the count is split evenly across them and
 * each token is `<PREFIX><body>` drawn from the alphabet minus the prefix's letters.
 * Retries on collision against `existing` and tokens planned so far.
 */
export function planTokens(opts: PlanOptions): PlannedToken[] {
  const randomInt = opts.randomInt ?? cryptoRandomInt;
  const maxAttempts = opts.maxAttemptsPerToken ?? 50;

  const used = new Set<string>();
  for (const t of opts.existing) {
    used.add(t.toLowerCase());
  }

  const groups: Array<{ prefix: string | null; n: number }> =
    opts.prefixes.length > 0
      ? splitCount(opts.count, opts.prefixes.length).map((n, i) => ({
          prefix: opts.prefixes[i]!.toUpperCase(),
          n,
        }))
      : [{ prefix: null, n: opts.count }];

  const planned: PlannedToken[] = [];
  for (const group of groups) {
    const alpha = bodyAlphabet(opts.alphabet, group.prefix ?? '');
    for (let i = 0; i < group.n; i += 1) {
      let token = '';
      let attempt = 0;
      do {
        attempt += 1;
        if (attempt > maxAttempts) {
          throw new Error('exhausted attempts generating a unique token');
        }
        token = (group.prefix ?? '') + randomBody(opts.tokenLength, alpha, randomInt);
      } while (used.has(token.toLowerCase()));
      used.add(token.toLowerCase());
      planned.push({ token, prefix: group.prefix });
    }
  }
  return planned;
}

/** Normalise a prefixes array: trim, uppercase, drop empties, de-duplicate. */
export function normalisePrefixes(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') {
      continue;
    }
    const p = raw.trim().toUpperCase();
    if (p.length === 0 || p.length > 8 || seen.has(p)) {
      continue;
    }
    seen.add(p);
    out.push(p);
  }
  return out;
}

export function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === 'number' ? Math.floor(value) : Number.NaN;
  if (Number.isNaN(n)) {
    return min;
  }
  return Math.min(max, Math.max(min, n));
}
