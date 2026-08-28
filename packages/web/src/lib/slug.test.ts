import { describe, expect, it } from 'vitest';
import { canonicalRedirectPath, isValidSlug, normaliseSlug } from './slug';

describe('normaliseSlug', () => {
  it('lowercases, hyphenates and trims', () => {
    expect(normaliseSlug('  Megan’s Birthday Bash! ')).toBe('megan-s-birthday-bash');
    expect(normaliseSlug('Christmas')).toBe('christmas');
    expect(normaliseSlug('multi   space')).toBe('multi-space');
  });

  it('folds accented characters to ascii', () => {
    expect(normaliseSlug('Fête de Noël')).toBe('fete-de-noel');
  });

  it('never returns leading, trailing or doubled hyphens', () => {
    expect(normaliseSlug('---a---b---')).toBe('a-b');
    expect(normaliseSlug('!!!')).toBe('');
  });

  it('caps length at 40 without a trailing hyphen', () => {
    const out = normaliseSlug('a'.repeat(60));
    expect(out.length).toBe(40);
    expect(out.endsWith('-')).toBe(false);
  });
});

describe('isValidSlug', () => {
  it('accepts DB-legal slugs', () => {
    expect(isValidSlug('christmas')).toBe(true);
    expect(isValidSlug('my-birthday-2026')).toBe(true);
  });

  it('rejects too-short, edge-hyphen, uppercase and illegal chars', () => {
    expect(isValidSlug('a')).toBe(false);
    expect(isValidSlug('-nope')).toBe(false);
    expect(isValidSlug('nope-')).toBe(false);
    expect(isValidSlug('Christmas')).toBe(false);
    expect(isValidSlug('two words')).toBe(false);
    expect(isValidSlug('a'.repeat(41))).toBe(false);
  });
});

describe('canonicalRedirectPath', () => {
  it('returns null when the URL slug already matches', () => {
    expect(
      canonicalRedirectPath({ urlSlug: 'christmas', canonicalSlug: 'christmas', token: 'JX4K' }),
    ).toBeNull();
  });

  it('builds the canonical path when the slug is wrong', () => {
    expect(
      canonicalRedirectPath({ urlSlug: 'xmas', canonicalSlug: 'christmas', token: 'JX4K' }),
    ).toBe('/christmas/c/JX4K');
  });

  it('stays put when the canonical slug is unknown (bad token)', () => {
    expect(canonicalRedirectPath({ urlSlug: 'xmas', canonicalSlug: '', token: 'JX4K' })).toBeNull();
  });
});
