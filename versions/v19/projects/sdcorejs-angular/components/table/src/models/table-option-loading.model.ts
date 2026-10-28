/**
 * How `sd-table` shows a read that is in progress.
 *
 * - No rows on screen (first read, after an empty result or an error): skeleton rows right away.
 * - Rows on screen: the rows stay. A read that takes longer than `showDelay` shows a 2px progress bar under
 *   the header and dims the rows; once shown, both stay for at least `minDuration`.
 *
 * Merged field by field: `option.loading`, then `SD_TABLE_CONFIGURATION.loading`, then the defaults. A
 * negative number or a value of the wrong type counts as not set.
 */
export interface SdTableOptionLoading {
  /**
   * Skeleton rows while a table without rows loads. `false`: such a read only shows the progress bar,
   * after `showDelay`.
   * @defaultValue true
   */
  skeleton?: boolean;
  /**
   * Number of skeleton rows, rounded down to 1–20.
   * @defaultValue 5, or enough rows to fill a table with a fixed height (fill mode, `style.maxHeight`),
   * at most `paginate.pageSize`
   */
  skeletonRows?: number;
  /**
   * Milliseconds a read of a table with rows waits before the progress bar and the dimmed rows show.
   * Faster reads show nothing. `0` shows them right away.
   * @defaultValue 300
   */
  showDelay?: number;
  /**
   * Once the progress bar shows, the minimum milliseconds it stays, so it does not flash. Only kept
   * when the new result has rows. `0` hides it as soon as the read ends.
   * @defaultValue 400
   */
  minDuration?: number;
  /**
   * Dim the rows and ignore pointer input on them while the progress bar shows. `false`: progress bar
   * only. The keyboard is never blocked.
   * @defaultValue true
   */
  dim?: boolean;
}
