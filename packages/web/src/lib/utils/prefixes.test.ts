import { describe, expect, it } from 'vitest';
import { handedOutByLabel, housemateForPrefix } from './prefixes';

describe('housemateForPrefix', () => {
  it('maps known prefixes (case-insensitively) and returns null otherwise', () => {
    expect(housemateForPrefix('J')).toBe('Housemate J');
    expect(housemateForPrefix('k')).toBe('Housemate K');
    expect(housemateForPrefix('Z')).toBeNull();
    expect(housemateForPrefix(null)).toBeNull();
    expect(housemateForPrefix('')).toBeNull();
  });
});

describe('handedOutByLabel', () => {
  it('prefers the housemate name, falls back to the prefix, then a dash', () => {
    expect(handedOutByLabel('J')).toBe('Housemate J');
    expect(handedOutByLabel('Z')).toBe('Z');
    expect(handedOutByLabel(null)).toBe('—');
  });
});
