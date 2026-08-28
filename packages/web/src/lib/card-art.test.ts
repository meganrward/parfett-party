import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PLACEMENT,
  DEFAULT_RATIO,
  clampPlacement,
  clearCardArt,
  loadCardArt,
  movePlacement,
  readImageFile,
  resizePlacement,
  saveCardArt,
  useCardArt,
} from './card-art';

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

const stored = { art: 'data:image/png;base64,AAA', ratio: 1.5, placement: DEFAULT_PLACEMENT };

describe('card-art store', () => {
  it('round-trips through localStorage, scoped by slug', () => {
    expect(loadCardArt('christmas')).toBeNull();
    expect(saveCardArt('christmas', stored)).toBe(true);
    expect(loadCardArt('christmas')).toEqual(stored);
    expect(loadCardArt('my-birthday')).toBeNull();
  });

  it('rejects payloads over the size guard', () => {
    const huge = { ...stored, art: 'data:image/png;base64,' + 'A'.repeat(4_000_000) };
    expect(saveCardArt('christmas', huge)).toBe(false);
    expect(loadCardArt('christmas')).toBeNull();
  });

  it('tolerates corrupt storage', () => {
    window.localStorage.setItem('parfett:card-art:christmas', '{not json');
    expect(loadCardArt('christmas')).toBeNull();
  });

  it('clearCardArt removes the entry', () => {
    saveCardArt('christmas', stored);
    clearCardArt('christmas');
    expect(loadCardArt('christmas')).toBeNull();
  });
});

describe('placement geometry', () => {
  const ratio = 2; // card twice as wide as tall

  it('clampPlacement keeps the square QR fully inside the card', () => {
    // sizePct 30 -> height 60% of the card; y can go to 40
    expect(clampPlacement({ xPct: 90, yPct: 90, sizePct: 30 }, ratio)).toEqual({
      xPct: 70,
      yPct: 40,
      sizePct: 30,
    });
    expect(clampPlacement({ xPct: -10, yPct: -5, sizePct: 30 }, ratio)).toEqual({
      xPct: 0,
      yPct: 0,
      sizePct: 30,
    });
  });

  it('clampPlacement bounds the size', () => {
    expect(clampPlacement({ xPct: 0, yPct: 0, sizePct: 200 }, 1).sizePct).toBe(80);
    expect(clampPlacement({ xPct: 0, yPct: 0, sizePct: 1 }, 1).sizePct).toBe(8);
  });

  it('movePlacement applies a delta then clamps', () => {
    expect(
      movePlacement({ xPct: 10, yPct: 10, sizePct: 20 }, ratio, { dxPct: 5, dyPct: -20 }),
    ).toEqual({ xPct: 15, yPct: 0, sizePct: 20 });
  });

  it('resizePlacement grows the QR and re-clamps position', () => {
    // start near the right edge, grow -> x pulled back in
    expect(resizePlacement({ xPct: 75, yPct: 0, sizePct: 20 }, 1, 15)).toEqual({
      xPct: 65,
      yPct: 0,
      sizePct: 35,
    });
  });
});

describe('readImageFile', () => {
  class FakeFileReader {
    result = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    error: unknown = null;
    readAsDataURL() {
      this.result = 'data:image/png;base64,ART';
      this.onload?.();
    }
  }
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 300;
    naturalHeight = 200;
    set src(_v: string) {
      this.onload?.();
    }
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads a data URL and computes the aspect ratio', async () => {
    vi.stubGlobal('FileReader', FakeFileReader);
    vi.stubGlobal('Image', FakeImage);
    const out = await readImageFile(new File(['x'], 'c.png', { type: 'image/png' }));
    expect(out.dataUrl).toBe('data:image/png;base64,ART');
    expect(out.ratio).toBeCloseTo(1.5);
  });

  it('falls back to the default ratio when dimensions are missing', async () => {
    class ZeroImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 0;
      naturalHeight = 0;
      set src(_v: string) {
        this.onload?.();
      }
    }
    vi.stubGlobal('FileReader', FakeFileReader);
    vi.stubGlobal('Image', ZeroImage);
    const out = await readImageFile(new File(['x'], 'c.png', { type: 'image/png' }));
    expect(out.ratio).toBe(DEFAULT_RATIO);
  });
});

describe('useCardArt', () => {
  it('starts empty, then holds the art + placement after setArt', () => {
    const { result } = renderHook(() => useCardArt('christmas'));
    expect(result.current.art).toBeNull();
    expect(result.current.placement).toEqual(DEFAULT_PLACEMENT);

    act(() => {
      expect(result.current.setArt('data:image/png;base64,AAA', 1.6)).toBe(true);
    });
    expect(result.current.art).toBe('data:image/png;base64,AAA');
    expect(result.current.ratio).toBe(1.6);
    expect(loadCardArt('christmas')?.art).toBe('data:image/png;base64,AAA');
  });

  it('updates and persists placement', () => {
    const { result } = renderHook(() => useCardArt('christmas'));
    act(() => void result.current.setArt('data:image/png;base64,AAA', 1.6));
    act(() => result.current.setPlacement({ xPct: 10, yPct: 30, sizePct: 40 }));
    expect(result.current.placement).toEqual({ xPct: 10, yPct: 30, sizePct: 40 });
    expect(loadCardArt('christmas')?.placement).toEqual({ xPct: 10, yPct: 30, sizePct: 40 });
  });

  it('clear() removes everything', () => {
    const { result } = renderHook(() => useCardArt('christmas'));
    act(() => void result.current.setArt('data:image/png;base64,AAA', 1.6));
    act(() => result.current.clear());
    expect(result.current.art).toBeNull();
    expect(loadCardArt('christmas')).toBeNull();
  });

  it('reports memory-only when the art is too large to persist', () => {
    const { result } = renderHook(() => useCardArt('christmas'));
    let persisted = true;
    act(() => {
      persisted = result.current.setArt('data:image/png;base64,' + 'A'.repeat(4_000_000), 1.6);
    });
    expect(persisted).toBe(false);
    expect(result.current.art).toContain('base64,AAAA');
    expect(loadCardArt('christmas')).toBeNull();
  });
});
