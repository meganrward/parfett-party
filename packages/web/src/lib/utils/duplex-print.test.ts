import { describe, expect, it } from 'vitest';
import { cardsPerPage, paginateForDuplex } from './duplex-print';

describe('cardsPerPage', () => {
  it('fits standard 85x55mm business cards on an A4 page', () => {
    expect(cardsPerPage(85, 55)).toEqual({ columns: 2, rows: 4 });
  });

  it('never returns less than 1x1', () => {
    expect(cardsPerPage(500, 500)).toEqual({ columns: 1, rows: 1 });
  });
});

describe('paginateForDuplex', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];

  it('chunks items into front pages of columns*rows, padding the last with nulls', () => {
    const pages = paginateForDuplex(items, 2, 2, 'long-edge');
    expect(pages).toHaveLength(2);
    expect(pages[0]!.front).toEqual(['a', 'b', 'c', 'd']);
    expect(pages[1]!.front).toEqual(['e', null, null, null]);
  });

  it('long-edge flip mirrors columns within each row', () => {
    const [page] = paginateForDuplex(items, 2, 2, 'long-edge');
    // front row0: a b -> back row0 should read b a; front row1: c d -> back row1: d c
    expect(page!.back).toEqual(['b', 'a', 'd', 'c']);
  });

  it('short-edge flip mirrors rows top-to-bottom', () => {
    const [page] = paginateForDuplex(items, 2, 2, 'short-edge');
    // front row0: a b, row1: c d -> back row0 (behind front row1): c d; back row1: a b
    expect(page!.back).toEqual(['c', 'd', 'a', 'b']);
  });

  it('leaves blank front slots blank on the back too', () => {
    const [, second] = paginateForDuplex(items, 2, 2, 'long-edge');
    expect(second!.back.filter((v) => v !== null)).toEqual(['e']);
  });

  it('returns no pages for an empty list', () => {
    expect(paginateForDuplex([], 2, 2, 'long-edge')).toEqual([]);
  });
});
