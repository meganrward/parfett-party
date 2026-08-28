import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import {
  bodyAlphabet,
  clampInt,
  normalisePrefixes,
  planTokens,
  splitCount,
  type RandomInt,
} from './codegen.ts';

/**
 * Deterministic RNG for tests — reproducible with a good spread. Uses the high
 * bits of an LCG (the low bits have very short periods).
 */
function lcgRandomInt(seed = 0x9e3779b9): RandomInt {
  let state = seed >>> 0;
  return (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return Math.floor((state / 0x1_0000_0000) * max);
  };
}

Deno.test('splitCount distributes evenly with remainder to the earliest groups', () => {
  assertEquals(splitCount(60, 3), [20, 20, 20]);
  assertEquals(splitCount(61, 3), [21, 20, 20]);
  assertEquals(splitCount(62, 3), [21, 21, 20]);
  assertEquals(splitCount(2, 5), [1, 1, 0, 0, 0]);
  assertEquals(splitCount(0, 4), [0, 0, 0, 0]);
});

Deno.test('splitCount rejects bad input', () => {
  assertThrows(() => splitCount(10, 0));
  assertThrows(() => splitCount(-1, 3));
});

Deno.test('bodyAlphabet removes the prefix letters and de-duplicates', () => {
  assertEquals(bodyAlphabet('ABCDEF', 'A'), 'BCDEF');
  assertEquals(bodyAlphabet('AABBCC', 'c'), 'AB');
  // prefix-less
  assertEquals(bodyAlphabet('XYZ', ''), 'XYZ');
});

Deno.test('bodyAlphabet throws when too few characters remain', () => {
  assertThrows(() => bodyAlphabet('AB', 'A'));
});

Deno.test('planTokens: no prefixes -> pure-random tokens of the right shape', () => {
  const tokens = planTokens({
    count: 5,
    prefixes: [],
    tokenLength: 4,
    alphabet: 'ABCDEFGH',
    existing: [],
    randomInt: lcgRandomInt(),
  });
  assertEquals(tokens.length, 5);
  for (const t of tokens) {
    assertEquals(t.prefix, null);
    assertEquals(t.token.length, 4);
    assertEquals(/^[A-H]{4}$/.test(t.token), true);
  }
});

Deno.test('planTokens: splits the count across prefixes and prefixes each token', () => {
  const tokens = planTokens({
    count: 7,
    prefixes: ['J', 'K'],
    tokenLength: 3,
    alphabet: 'ABCDEFGHJKLMNP',
    existing: [],
    randomInt: lcgRandomInt(),
  });
  assertEquals(tokens.length, 7);
  assertEquals(tokens.filter((t) => t.prefix === 'J').length, 4);
  assertEquals(tokens.filter((t) => t.prefix === 'K').length, 3);
  // body never contains the prefix letter
  for (const t of tokens.filter((x) => x.prefix === 'J')) {
    assertEquals(t.token.startsWith('J'), true);
    assertEquals(t.token.slice(1).includes('J'), false);
  }
});

Deno.test('planTokens: all tokens are unique and avoid existing ones', () => {
  const existing = ['abcd', 'abdc']; // lower-case on purpose
  const tokens = planTokens({
    count: 12,
    prefixes: [],
    tokenLength: 4,
    alphabet: 'ABCD', // 256-token space
    existing,
    randomInt: (max) => Math.floor(Math.random() * max),
    maxAttemptsPerToken: 500,
  });
  const seen = new Set(tokens.map((t) => t.token.toLowerCase()));
  assertEquals(seen.size, tokens.length);
  for (const e of existing) {
    assertEquals(seen.has(e), false);
  }
});

Deno.test('planTokens: throws when the space is exhausted', () => {
  assertThrows(() =>
    planTokens({
      count: 100,
      prefixes: [],
      tokenLength: 2,
      alphabet: 'AB', // only 4 possible tokens
      existing: [],
      randomInt: (max) => Math.floor(Math.random() * max),
      maxAttemptsPerToken: 20,
    }),
  );
});

Deno.test('normalisePrefixes trims, uppercases, de-dupes and drops junk', () => {
  assertEquals(normalisePrefixes([' j ', 'J', 'k', '', 123, 'toolongprefix']), ['J', 'K']);
  assertEquals(normalisePrefixes('nope'), []);
  assertEquals(normalisePrefixes(undefined), []);
});

Deno.test('clampInt clamps and falls back to min for non-numbers', () => {
  assertEquals(clampInt(50, 1, 100), 50);
  assertEquals(clampInt(0, 1, 100), 1);
  assertEquals(clampInt(9999, 1, 100), 100);
  assertEquals(clampInt('x', 4, 24), 4);
  assertEquals(clampInt(undefined, 4, 24), 4);
});
