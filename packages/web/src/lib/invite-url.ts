/**
 * The full URL a QR code points at, e.g.
 * https://meganward.github.io/parfett-party/#/christmas/c/JX4K
 *
 * `base` defaults to this app's own origin + base path; pass it explicitly in tests.
 */
export function inviteUrl(slug: string, token: string, base?: string): string {
  const raw = base ?? `${window.location.origin}${import.meta.env.BASE_URL ?? '/'}`;
  return `${raw.replace(/\/$/, '')}/#/${slug}/c/${token}`;
}
