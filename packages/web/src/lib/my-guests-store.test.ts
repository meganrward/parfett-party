import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyGuestIds, rememberMyGuestId } from './my-guests-store';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('my-guests-store', () => {
  it('starts empty and records guest ids per (normalised) token', () => {
    expect(getMyGuestIds('JX4K')).toEqual([]);
    rememberMyGuestId(' jx4k ', 'g1');
    rememberMyGuestId('JX4K', 'g2');
    expect(getMyGuestIds('JX4K')).toEqual(['g1', 'g2']);
  });

  it('keeps tokens separate and de-duplicates', () => {
    rememberMyGuestId('JX4K', 'g1');
    rememberMyGuestId('JX4K', 'g1');
    rememberMyGuestId('W9TF', 'g9');
    expect(getMyGuestIds('JX4K')).toEqual(['g1']);
    expect(getMyGuestIds('W9TF')).toEqual(['g9']);
  });

  it('tolerates corrupt storage', () => {
    window.localStorage.setItem('parfett:my-guests', 'not json');
    expect(getMyGuestIds('JX4K')).toEqual([]);
    rememberMyGuestId('JX4K', 'g1');
    expect(getMyGuestIds('JX4K')).toEqual(['g1']);
  });

  it('never throws when localStorage.setItem fails', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => rememberMyGuestId('JX4K', 'g1')).not.toThrow();
    spy.mockRestore();
  });
});
