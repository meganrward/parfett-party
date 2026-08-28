import { useCallback, useEffect, useState } from 'react';

/** Where the unique QR sits on the uploaded card, as % of the card. QR is square. */
export interface QrPlacement {
  xPct: number;
  yPct: number;
  sizePct: number;
}

export const DEFAULT_PLACEMENT: QrPlacement = { xPct: 8, yPct: 20, sizePct: 36 };
export const DEFAULT_RATIO = 1.545; // standard business card 85×55mm

const MIN_SIZE_PCT = 8;
const MAX_SIZE_PCT = 80;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** The QR is square: its width is `sizePct`% of the card width, so its height is
 * `sizePct * ratio`% of the card height (ratio = cardWidth / cardHeight). */
export function clampPlacement(placement: QrPlacement, ratio: number): QrPlacement {
  const sizePct = clamp(placement.sizePct, MIN_SIZE_PCT, MAX_SIZE_PCT);
  const heightPct = sizePct * ratio;
  return {
    sizePct,
    xPct: clamp(placement.xPct, 0, Math.max(0, 100 - sizePct)),
    yPct: clamp(placement.yPct, 0, Math.max(0, 100 - heightPct)),
  };
}

/** Move by a delta expressed in % of the card, keeping the QR inside it. */
export function movePlacement(
  placement: QrPlacement,
  ratio: number,
  delta: { dxPct: number; dyPct: number },
): QrPlacement {
  return clampPlacement(
    { ...placement, xPct: placement.xPct + delta.dxPct, yPct: placement.yPct + delta.dyPct },
    ratio,
  );
}

/** Resize by a delta on the size (%), keeping the QR anchored at its top-left and inside the card. */
export function resizePlacement(
  placement: QrPlacement,
  ratio: number,
  dSizePct: number,
): QrPlacement {
  return clampPlacement({ ...placement, sizePct: placement.sizePct + dSizePct }, ratio);
}

interface StoredCardArt {
  /** data: URL of the artwork */
  art: string;
  /** width / height of the artwork */
  ratio: number;
  placement: QrPlacement;
}

const STORE_PREFIX = 'parfett:card-art:';
const MAX_STORED_BYTES = 3_500_000;

const keyFor = (slug: string) => `${STORE_PREFIX}${slug}`;

function isPlacement(v: unknown): v is QrPlacement {
  return (
    !!v &&
    typeof v === 'object' &&
    ['xPct', 'yPct', 'sizePct'].every((k) => typeof (v as Record<string, unknown>)[k] === 'number')
  );
}

export function loadCardArt(slug: string): StoredCardArt | null {
  try {
    const raw = window.localStorage.getItem(keyFor(slug));
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof (parsed as StoredCardArt).art === 'string' &&
      typeof (parsed as StoredCardArt).ratio === 'number' &&
      isPlacement((parsed as StoredCardArt).placement)
    ) {
      return parsed as StoredCardArt;
    }
    return null;
  } catch {
    return null;
  }
}

/** Returns false when the value is too big / storage is unavailable (caller keeps it in memory). */
export function saveCardArt(slug: string, value: StoredCardArt): boolean {
  try {
    const raw = JSON.stringify(value);
    if (raw.length > MAX_STORED_BYTES) {
      return false;
    }
    window.localStorage.setItem(keyFor(slug), raw);
    return true;
  } catch {
    return false;
  }
}

export function clearCardArt(slug: string): void {
  try {
    window.localStorage.removeItem(keyFor(slug));
  } catch {
    // ignore
  }
}

/** Read an image File into a data URL + its aspect ratio. */
export async function readImageFile(file: File): Promise<{ dataUrl: string; ratio: number }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
  const ratio = await new Promise<number>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth / img.naturalHeight || DEFAULT_RATIO);
    img.onerror = () => reject(new Error('Could not decode the image'));
    img.src = dataUrl;
  });
  return { dataUrl, ratio };
}

export interface CardArtState {
  art: string | null;
  ratio: number;
  placement: QrPlacement;
  /** true = persisted, false = kept in memory only (too large) */
  setArt: (dataUrl: string, ratio: number) => boolean;
  setPlacement: (placement: QrPlacement) => void;
  clear: () => void;
}

/** Per-party uploaded card art + QR placement, persisted in localStorage when it fits. */
export function useCardArt(slug: string): CardArtState {
  const [stored, setStored] = useState<StoredCardArt | null>(() => loadCardArt(slug));

  useEffect(() => {
    setStored(loadCardArt(slug));
  }, [slug]);

  const setArt = useCallback(
    (dataUrl: string, ratio: number) => {
      const next: StoredCardArt = {
        art: dataUrl,
        ratio,
        placement: stored?.placement ?? DEFAULT_PLACEMENT,
      };
      setStored(next);
      return saveCardArt(slug, next);
    },
    [slug, stored],
  );

  const setPlacement = useCallback(
    (placement: QrPlacement) => {
      setStored((prev) => {
        if (!prev) {
          return prev;
        }
        const next = { ...prev, placement };
        saveCardArt(slug, next);
        return next;
      });
    },
    [slug],
  );

  const clear = useCallback(() => {
    clearCardArt(slug);
    setStored(null);
  }, [slug]);

  return {
    art: stored?.art ?? null,
    ratio: stored?.ratio ?? DEFAULT_RATIO,
    placement: stored?.placement ?? DEFAULT_PLACEMENT,
    setArt,
    setPlacement,
    clear,
  };
}
