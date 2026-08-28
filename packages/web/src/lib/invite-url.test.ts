import { describe, expect, it } from 'vitest';
import { inviteUrl } from './invite-url';

describe('inviteUrl', () => {
  it('builds the hash-router invite URL from an explicit base', () => {
    expect(inviteUrl('christmas', 'JX4K', 'https://example.test/parfett-party')).toBe(
      'https://example.test/parfett-party/#/christmas/c/JX4K',
    );
  });

  it('trims a trailing slash on the base', () => {
    expect(inviteUrl('christmas', 'JX4K', 'https://example.test/app/')).toBe(
      'https://example.test/app/#/christmas/c/JX4K',
    );
  });

  it('falls back to the running origin + base path', () => {
    // jsdom origin is http://localhost:54321 (see vitest.config.ts env); BASE_URL '/'
    expect(inviteUrl('christmas', 'JX4K')).toMatch(/^https?:\/\/[^/]+\/#\/christmas\/c\/JX4K$/);
  });
});
