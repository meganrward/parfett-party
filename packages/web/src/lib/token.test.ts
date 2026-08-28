import { describe, expect, it } from 'vitest';
import { isPlausibleToken, normaliseToken } from './token';

describe('normaliseToken', () => {
  it('strips whitespace and uppercases', () => {
    expect(normaliseToken('  jx 4k ')).toBe('JX4K');
    expect(normaliseToken('w9tf')).toBe('W9TF');
  });
});

describe('isPlausibleToken', () => {
  it('accepts well-formed tokens (any case, stray spaces)', () => {
    expect(isPlausibleToken('JX4K')).toBe(true);
    expect(isPlausibleToken(' j x 4 k ')).toBe(true);
    expect(isPlausibleToken('X6RU8ZKFBCN')).toBe(true);
  });

  it('rejects too-short, too-long and non-alphanumeric input', () => {
    expect(isPlausibleToken('ab')).toBe(false);
    expect(isPlausibleToken('J'.repeat(41))).toBe(false);
    expect(isPlausibleToken('jx-4k')).toBe(false);
    expect(isPlausibleToken('')).toBe(false);
  });
});
