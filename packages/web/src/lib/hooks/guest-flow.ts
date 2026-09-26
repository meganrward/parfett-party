import { useCallback, useEffect, useMemo, useState } from 'react';
import * as api from './api';
import { canonicalRedirectPath } from './slug';
import { isPlausibleToken } from './token';
import { getMyGuestIds, rememberMyGuestId } from './my-guests-store';
import { sortGuests, type Guest, type RsvpStatus } from './guests';
import type { QrInfo } from './api-types';

export interface GuestDraft {
  name: string | null;
  status: RsvpStatus | null;
}

export interface GuestFlowActions {
  addGuest: (draft: GuestDraft) => Promise<void>;
  editGuest: (guestId: string, draft: GuestDraft) => Promise<void>;
  reload: () => Promise<void>;
}

export interface GuestFlowState {
  loading: boolean;
  /** Token is malformed or unknown to the server. */
  notFound: boolean;
  /** Path to redirect to when the URL slug isn't the party's canonical slug. */
  redirectTo: string | null;
  info: QrInfo | null;
  guests: Guest[];
  /** Guest ids created on this device for this token. */
  myGuestIds: Set<string>;
  error: string | null;
  actions: GuestFlowActions;
}

/**
 * Drives the /:slug/c/:token guest page: loads the QR + its guests, decides on a
 * canonical-slug redirect, and exposes add/edit actions that keep the list in
 * sync. Router-free by design — the component turns `redirectTo` into navigation.
 */
export function useGuestFlow(slug: string, token: string): GuestFlowState {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [info, setInfo] = useState<QrInfo | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [myIds, setMyIds] = useState<string[]>(() => getMyGuestIds(token));
  const [error, setError] = useState<string | null>(null);

  const loadGuests = useCallback(async () => {
    const rows = await api.listGuests(token);
    setGuests(sortGuests(rows));
  }, [token]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setRedirectTo(null);
    setError(null);
    setMyIds(getMyGuestIds(token));

    const load = async () => {
      if (!isPlausibleToken(token)) {
        if (active) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }
      try {
        const qr = await api.getQr(token);
        if (!active) {
          return;
        }
        if (!qr) {
          setNotFound(true);
          return;
        }
        const redirect = canonicalRedirectPath({
          urlSlug: slug,
          canonicalSlug: qr.slug,
          token,
        });
        if (redirect) {
          setRedirectTo(redirect);
          return;
        }
        setInfo(qr);
        await loadGuests();
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Something went wrong');
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
  }, [slug, token, loadGuests]);

  const addGuest = useCallback(
    async (draft: GuestDraft) => {
      const id = await api.addGuest({ token, name: draft.name, status: draft.status });
      rememberMyGuestId(token, id);
      setMyIds(getMyGuestIds(token));
      await loadGuests();
    },
    [token, loadGuests],
  );

  const editGuest = useCallback(
    async (guestId: string, draft: GuestDraft) => {
      await api.updateGuest({ token, guestId, name: draft.name, status: draft.status });
      await loadGuests();
    },
    [token, loadGuests],
  );

  const myGuestIds = useMemo(() => new Set(myIds), [myIds]);

  return {
    loading,
    notFound,
    redirectTo,
    info,
    guests,
    myGuestIds,
    error,
    actions: { addGuest, editGuest, reload: loadGuests },
  };
}
