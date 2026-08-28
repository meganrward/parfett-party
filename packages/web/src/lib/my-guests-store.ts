/**
 * Per-device memory of which guest entries this browser created, keyed by QR
 * token. Used only to gently mark "you" in the guest list — never a security
 * boundary. All access is guarded: localStorage can throw or be unavailable.
 */
import { normaliseToken } from './token';

const KEY = 'parfett:my-guests';

type Store = Record<string, string[]>;

function read(): Store {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore — private mode, quota, etc.
  }
}

/** Guest ids this device created for the given token. */
export function getMyGuestIds(token: string): string[] {
  const store = read();
  return store[normaliseToken(token)] ?? [];
}

/** Record a guest id as belonging to this device for the given token. */
export function rememberMyGuestId(token: string, guestId: string): void {
  const key = normaliseToken(token);
  const store = read();
  const current = store[key] ?? [];
  if (current.includes(guestId)) {
    return;
  }
  store[key] = [...current, guestId];
  write(store);
}
