export interface SdTableOptionPaginate {
  pageSize?: number;
  pages?: number[];
  showFirstLastButtons?: boolean;
  hidePageSize?: boolean;
  hidden?: boolean;
  /**
   * How the table learns the size of the result set.
   *
   * - `'known'` (default): server `items()` resolves `{ items, total }` and the paginator shows
   *   `from-to/total` with first/previous/next/last.
   * - `'unknown'`: for APIs that page by offset/limit but never return a count. Server `items()`
   *   resolves `{ items, hasMore }`; the paginator shows only the rows actually loaded (`26-32`),
   *   previous/next and page size, never a total or a last-page button. Applies to `type: 'server'`
   *   only; local tables always know their total.
   *
   * @defaultValue 'known'
   * @see SdTableServerHasMoreResult
   */
  total?: 'known' | 'unknown';
}
