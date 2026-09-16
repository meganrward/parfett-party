import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type AuthCb = (event: string, session: unknown) => void;

const { auth, mockSupabase } = vi.hoisted(() => {
  const a = { listeners: [] as AuthCb[], unsubscribe: vi.fn() };
  const supabase = {
    auth: {
      onAuthStateChange: vi.fn((cb: AuthCb) => {
        a.listeners.push(cb);
        return { data: { subscription: { unsubscribe: a.unsubscribe } } };
      }),
    },
  };
  return { auth: a, mockSupabase: supabase };
});

vi.mock('./lib/supabase', () => ({ supabase: mockSupabase }));

const { App } = await import('./App');

beforeEach(() => {
  auth.listeners = [];
  vi.clearAllMocks();
  window.location.hash = '';
});

describe('App', () => {
  it('renders the landing page at the root route', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Parfett Party' })).toBeInTheDocument();
    expect(screen.getByText(/scan the qr code on your invite card/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /host sign in/i })).toHaveAttribute('href', '#/admin');
  });

  it('redirects to set-password on PASSWORD_RECOVERY regardless of the current hash', () => {
    render(<App />);
    act(() => auth.listeners.forEach((cb) => cb('PASSWORD_RECOVERY', {})));
    expect(window.location.hash).toBe('#/admin/set-password');
  });

  it('redirects to set-password on SIGNED_IN when the mount-time hash was an invite link', () => {
    window.location.hash = '#access_token=abc&type=invite';
    render(<App />);
    act(() => auth.listeners.forEach((cb) => cb('SIGNED_IN', {})));
    expect(window.location.hash).toBe('#/admin/set-password');
  });

  it('does not redirect on an ordinary SIGNED_IN with no invite/recovery hash', () => {
    render(<App />);
    act(() => auth.listeners.forEach((cb) => cb('SIGNED_IN', {})));
    expect(window.location.hash).not.toBe('#/admin/set-password');
  });

  it('does not treat a stale hash read after supabase clears it as an invite', () => {
    // supabase-js blanks window.location.hash before firing SIGNED_IN — a naive
    // re-check of the hash from inside the auth-state callback would see '' here
    // and correctly skip, but the real regression this guards is the opposite:
    // never redirecting from a re-read of an *already-cleared* hash.
    window.location.hash = '#access_token=abc&type=invite';
    render(<App />);
    window.location.hash = '';
    act(() => auth.listeners.forEach((cb) => cb('SIGNED_IN', {})));
    expect(window.location.hash).toBe('#/admin/set-password');
  });
});
