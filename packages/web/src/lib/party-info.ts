import { useEffect, useState } from 'react';
import * as api from './api';
import { canonicalRedirectPath } from './slug';
import { isPlausibleToken } from './token';
import type { QrInfo } from './api-types';

export interface PartyInfoState {
  loading: boolean;
  notFound: boolean;
  redirectTo: string | null;
  info: QrInfo | null;
  error: string | null;
}

/**
 * Loads a party's public info for the `/:slug/c/:token/info` page and decides on
 * a canonical-slug redirect (keeping the `/info` suffix). Router-free.
 */
export function usePartyInfo(slug: string, token: string): PartyInfoState {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [info, setInfo] = useState<QrInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setRedirectTo(null);
    setError(null);

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
          suffix: '/info',
        });
        if (redirect) {
          setRedirectTo(redirect);
          return;
        }
        setInfo(qr);
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
  }, [slug, token]);

  return { loading, notFound, redirectTo, info, error };
}
