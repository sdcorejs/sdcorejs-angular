import type { SdTableOption } from '../../models/table-option.model';

/** Position the table asks the server for in unknown-total mode. */
export interface SdTablePagePosition {
  pageIndex: number;
  pageSize: number;
}

/** Page whose rows are on screen in unknown-total mode; written only by a successful read. */
export interface SdTableShownPage extends SdTablePagePosition {
  /** Root rows actually rendered for this page. */
  count: number;
  hasMore: boolean;
}

/** `paginate.total: 'unknown'` only applies to server tables; local tables always know their total. */
export function isUnknownTotal(option: SdTableOption | undefined): boolean {
  return option?.type === 'server' && option.paginate?.total === 'unknown';
}

/**
 * Validate and normalise one unknown-total server page.
 *
 * why: the paginator must never claim more than the loader proved. A missing `hasMore` is a read
 * error instead of a guess; rows beyond `pageSize` (a lookahead row) are dropped so that the next
 * offset (`pageNumber * pageSize`) never repeats them; an empty page ends paging so that Next
 * cannot loop over empty pages after the source shrank.
 */
export function readUnknownTotalPage<T>(result: unknown, pageSize: number): { items: T[]; hasMore: boolean } {
  const page = result as { items?: unknown; hasMore?: unknown } | null | undefined;
  if (!page || !Array.isArray(page.items) || typeof page.hasMore !== 'boolean') {
    throw new Error(`sd-table: paginate.total 'unknown' requires items() to resolve { items: T[]; hasMore: boolean }.`);
  }
  const items = page.items as T[];
  const lookahead = pageSize > 0 && items.length > pageSize;
  return {
    items: lookahead ? items.slice(0, pageSize) : items,
    hasMore: items.length > 0 && (page.hasMore || lookahead),
  };
}

/** Same page and page size; `count`/`hasMore` are ignored. */
export function samePagePosition(a: SdTablePagePosition | undefined, b: SdTablePagePosition | undefined): boolean {
  return !!a && !!b && a.pageIndex === b.pageIndex && a.pageSize === b.pageSize;
}
