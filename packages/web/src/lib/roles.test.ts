import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type AuthCb = (event: string, session: unknown) => void;

const { auth, mockSupabase } = vi.hoisted(() => {
  const a = {
    session: null as unknown,
    listeners: [] as AuthCb[],
    unsubscribe: vi.fn(),
  };
  const supabase = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: a.session } })),
      onAuthStateChange: vi.fn((cb: AuthCb) => {
        a.listeners.push(cb);
        return { data: { subscription: { unsubscribe: a.unsubscribe } } };
      }),
    },
  };
  return { auth: a, mockSupabase: supabase };
});

vi.mock('./supabase', () => ({ supabase: mockSupabase }));
vi.mock('./api', () => ({ getAdmin: vi.fn(), listMyParties: vi.fn() }));

import { getAdmin, listMyParties } from './api';
import { adminRole, useAdminRole, useMyParties, useSession } from './roles';

const sessionFor = (id: string) => ({ user: { id } });

beforeEach(() => {
  auth.session = null;
  auth.listeners = [];
  vi.clearAllMocks();
});

describe('adminRole', () => {
  it('maps a row to super / admin, and null to null', () => {
    expect(adminRole(null)).toBeNull();
    expect(adminRole({ userId: 'u', displayName: 'x', isSuper: true })).toBe('super');
    expect(adminRole({ userId: 'u', displayName: 'x', isSuper: false })).toBe('admin');
  });
});

describe('useSession', () => {
  it('loads the initial session then tracks auth changes and unsubscribes', async () => {
    auth.session = sessionFor('u1');
    const { result, unmount } = renderHook(() => useSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toEqual(sessionFor('u1'));

    act(() => auth.listeners[0]!('SIGNED_OUT', null));
    expect(result.current.session).toBeNull();

    unmount();
    expect(auth.unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('useAdminRole', () => {
  it('is null when signed out', async () => {
    const { result } = renderHook(() => useAdminRole());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.role).toBeNull();
    expect(result.current.isSuper).toBe(false);
    expect(getAdmin).not.toHaveBeenCalled();
  });

  it('resolves super for an is_super row', async () => {
    auth.session = sessionFor('u1');
    vi.mocked(getAdmin).mockResolvedValue({ userId: 'u1', displayName: 'Meg', isSuper: true });

    const { result } = renderHook(() => useAdminRole());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getAdmin).toHaveBeenCalledWith('u1');
    expect(result.current.role).toBe('super');
    expect(result.current.isSuper).toBe(true);
  });

  it('resolves admin for a non-super row and null for no row', async () => {
    auth.session = sessionFor('u2');
    vi.mocked(getAdmin).mockResolvedValueOnce({ userId: 'u2', displayName: 'H', isSuper: false });
    const first = renderHook(() => useAdminRole());
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.role).toBe('admin');

    vi.mocked(getAdmin).mockResolvedValueOnce(null);
    const second = renderHook(() => useAdminRole());
    await waitFor(() => expect(second.result.current.loading).toBe(false));
    expect(second.result.current.role).toBeNull();
  });
});

describe('useMyParties', () => {
  const party = { id: 'p1', slug: 'christmas', name: 'X' } as never;

  it('is empty when signed out', async () => {
    const { result } = renderHook(() => useMyParties());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.parties).toEqual([]);
    expect(listMyParties).not.toHaveBeenCalled();
  });

  it('loads parties for a session and refetches on refresh', async () => {
    auth.session = sessionFor('u1');
    vi.mocked(listMyParties).mockResolvedValue([party]);

    const { result } = renderHook(() => useMyParties());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.parties).toEqual([party]);
    expect(listMyParties).toHaveBeenCalledTimes(1);

    vi.mocked(listMyParties).mockResolvedValue([party, party]);
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.parties).toHaveLength(2));
    expect(listMyParties).toHaveBeenCalledTimes(2);
  });

  it('surfaces an error message', async () => {
    auth.session = sessionFor('u1');
    vi.mocked(listMyParties).mockRejectedValue(new Error('denied'));

    const { result } = renderHook(() => useMyParties());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('denied');
    expect(result.current.parties).toEqual([]);
  });
});
