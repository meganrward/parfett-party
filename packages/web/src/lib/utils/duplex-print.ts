/** Which edge the printer flips the sheet on for double-sided printing. */
export type DuplexFlip = 'long-edge' | 'short-edge';

// A4 portrait, matching the @page rule in CodeSheet.css.
const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 12;
const CARD_GAP_MM = 6;

/** How many cards fit per printed page, given the card size and the fixed page/margin/gap above. */
export function cardsPerPage(
  cardWidthMm: number,
  cardHeightMm: number,
): { columns: number; rows: number } {
  const usableWidth = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
  const usableHeight = PAGE_HEIGHT_MM - PAGE_MARGIN_MM * 2;
  const columns = Math.max(
    1,
    Math.floor((usableWidth + CARD_GAP_MM) / (cardWidthMm + CARD_GAP_MM)),
  );
  const rows = Math.max(1, Math.floor((usableHeight + CARD_GAP_MM) / (cardHeightMm + CARD_GAP_MM)));
  return { columns, rows };
}

/** The grid slot on the back page that ends up physically behind `frontIndex` once flipped. */
function backSlotFor(frontIndex: number, columns: number, rows: number, flip: DuplexFlip): number {
  const row = Math.floor(frontIndex / columns);
  const col = frontIndex % columns;
  return flip === 'long-edge'
    ? row * columns + (columns - 1 - col)
    : (rows - 1 - row) * columns + col;
}

export interface DuplexPage<T> {
  front: Array<T | null>;
  back: Array<T | null>;
}

/**
 * Splits `items` into duplex-aligned pages of `columns * rows` slots each (null = blank slot).
 * Each page's `back` array places every item at the slot that lands behind its `front` slot
 * once the sheet is flipped over on the given edge, so printing front pages then back pages
 * (or duplex-printing them back to back) lines the two sides up.
 */
export function paginateForDuplex<T>(
  items: readonly T[],
  columns: number,
  rows: number,
  flip: DuplexFlip,
): Array<DuplexPage<T>> {
  const perPage = columns * rows;
  const pages: Array<DuplexPage<T>> = [];
  for (let start = 0; start < items.length; start += perPage) {
    const slice = items.slice(start, start + perPage);
    const front: Array<T | null> = Array.from({ length: perPage }, (_, i) => slice[i] ?? null);
    const back: Array<T | null> = new Array(perPage).fill(null);
    front.forEach((item, i) => {
      if (item !== null) {
        back[backSlotFor(i, columns, rows, flip)] = item;
      }
    });
    pages.push({ front, back });
  }
  return pages;
}
