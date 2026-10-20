import { SdTableOption } from '../../models/table-option.model';
import { isUnknownTotal, readUnknownTotalPage, samePagePosition } from './unknown-total.util';

describe('unknown-total paging utilities', () => {
  const rows = (count: number) => Array.from({ length: count }, (_, index) => ({ id: index + 1 }));
  const server = (paginate: SdTableOption['paginate']) =>
    ({ type: 'server', columns: [], items: async () => ({ items: [], hasMore: false }), paginate }) as SdTableOption;

  it('only treats server tables that declare paginate.total "unknown" as unknown-total', () => {
    expect(isUnknownTotal(server({ total: 'unknown' }))).toBeTrue();
    expect(isUnknownTotal(server({ total: 'known' }))).toBeFalse();
    expect(isUnknownTotal(server({}))).toBeFalse();
    expect(isUnknownTotal(server(undefined))).toBeFalse();
    expect(isUnknownTotal({ type: 'local', columns: [], items: () => [], paginate: { total: 'unknown' } } as SdTableOption)).toBeFalse();
    expect(isUnknownTotal(undefined)).toBeFalse();
  });

  it('keeps hasMore exactly as the loader reported it for a full page', () => {
    expect(readUnknownTotalPage({ items: rows(3), hasMore: false }, 3)).toEqual({ items: rows(3), hasMore: false });
    expect(readUnknownTotalPage({ items: rows(3), hasMore: true }, 3)).toEqual({ items: rows(3), hasMore: true });
  });

  it('keeps a short page and its hasMore flag', () => {
    expect(readUnknownTotalPage({ items: rows(2), hasMore: false }, 3)).toEqual({ items: rows(2), hasMore: false });
  });

  it('drops lookahead rows beyond pageSize and treats them as proof of a next page', () => {
    const result = readUnknownTotalPage({ items: rows(4), hasMore: false }, 3);
    expect(result.items).toEqual(rows(3));
    expect(result.hasMore).toBeTrue();
  });

  it('ends paging on an empty page even when the loader claims more', () => {
    expect(readUnknownTotalPage({ items: [], hasMore: true }, 3)).toEqual({ items: [], hasMore: false });
  });

  for (const [name, result] of [
    ['a known-total result', { items: rows(1), total: 10 }],
    ['a non-boolean hasMore', { items: rows(1), hasMore: 'yes' }],
    ['missing items', { hasMore: true }],
    ['undefined', undefined],
    ['an array', rows(1)],
  ] as const) {
    it(`rejects ${name} instead of guessing`, () => {
      expect(() => readUnknownTotalPage(result, 3)).toThrowError(/paginate\.total 'unknown' requires items\(\) to resolve/);
    });
  }

  it('compares page positions by index and size only', () => {
    expect(samePagePosition({ pageIndex: 1, pageSize: 3 }, { pageIndex: 1, pageSize: 3 })).toBeTrue();
    expect(samePagePosition({ pageIndex: 1, pageSize: 3 }, { pageIndex: 2, pageSize: 3 })).toBeFalse();
    expect(samePagePosition({ pageIndex: 0, pageSize: 3 }, { pageIndex: 0, pageSize: 5 })).toBeFalse();
    expect(samePagePosition(undefined, { pageIndex: 0, pageSize: 3 })).toBeFalse();
  });
});
