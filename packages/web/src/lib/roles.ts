import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { getHost, listMyParties } from './api';
import type { HostRow, Party } from './api-types';

export type AdminRoleName = 'admin' | 'host';

/** Pure: map a hosts row to a role name (null = not a host/admin at all). */
export function adminRole(row: HostRow | null): AdminRoleName | null {
  if (!row) {
    return null;
  }
  return row.isAdmin ? 'admin' : 'host';
}

export interface SessionState {
  session: Session | null;
  loading: boolean;
}

/** Current auth session, kept live via onAuthStateChange. */
export function useSession(): SessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    };
    void load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, loading };
}

export interface AdminRoleState {
  role: AdminRoleName | null;
  isAdmin: boolean;
  loading: boolean;
}

/** Resolves the signed-in user's role from the hosts table ('admin' | 'host' | null). */
export function useAdminRole(): AdminRoleState {
  const { session, loading: sessionLoading } = useSession();
  const [row, setRow] = useState<HostRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!session) {
      setRow(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    const load = async () => {
      try {
        const host = await getHost(session.user.id);
        if (active) {
          setRow(host);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();

    return () => {
      active = false;
    };
  }, [session, sessionLoading]);

  const role = adminRole(row);
  return { role, isAdmin: role === 'admin', loading: sessionLoading || loading };
}

export interface MyPartiesState {
  parties: Party[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** Parties the signed-in admin can access (RLS-scoped), with a manual refresh. */
export function useMyParties(): MyPartiesState {
  const { session, loading: sessionLoading } = useSession();
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!session) {
      setParties([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const rows = await listMyParties();
        if (active) {
          setParties(rows);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load parties');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();

    return () => {
      active = false;
    };
  }, [session, sessionLoading, nonce]);

  return { parties, loading: sessionLoading || loading, error, refresh };
}
