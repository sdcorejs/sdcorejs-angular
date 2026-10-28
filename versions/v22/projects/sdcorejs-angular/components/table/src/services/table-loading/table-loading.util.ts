import { signal } from '@angular/core';
import type { SdTableOptionLoading } from '../../models/table-option-loading.model';

/** What the loading layer draws: nothing, skeleton rows, or the progress bar over dimmed rows. */
export type SdTableLoadingView = 'none' | 'skeleton' | 'refresh';

/** `SdTableOptionLoading` after merging; `skeletonRows` stays unset when nobody set it (5, or fill the table). */
export interface TableLoadingSettings {
  readonly skeleton: boolean;
  readonly skeletonRows?: number;
  readonly showDelay: number;
  readonly minDuration: number;
  readonly dim: boolean;
}

export const TABLE_SKELETON_ROWS = 5;
export const TABLE_SKELETON_MAX_ROWS = 20;

const firstFlag = (...values: unknown[]): boolean | undefined => values.find((value): value is boolean => typeof value === 'boolean');
const firstNonNegative = (...values: unknown[]): number | undefined =>
  values.find((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);

/** Field by field: `option.loading`, then `SD_TABLE_CONFIGURATION.loading`, then the defaults. Invalid values count as not set. */
export function resolveTableLoading(
  option?: SdTableOptionLoading | null,
  configuration?: SdTableOptionLoading | null
): TableLoadingSettings {
  const rows = firstNonNegative(option?.skeletonRows, configuration?.skeletonRows);
  return {
    skeleton: firstFlag(option?.skeleton, configuration?.skeleton) ?? true,
    skeletonRows: rows === undefined ? undefined : Math.min(TABLE_SKELETON_MAX_ROWS, Math.max(1, Math.floor(rows))),
    showDelay: firstNonNegative(option?.showDelay, configuration?.showDelay) ?? 300,
    minDuration: firstNonNegative(option?.minDuration, configuration?.minDuration) ?? 400,
    dim: firstFlag(option?.dim, configuration?.dim) ?? true,
  };
}

/** A displayed column as the skeleton sees it. */
export interface TableSkeletonColumn {
  readonly field: string;
  /** `SdTableColumn['type']`; unset for the table's own columns (`sdSelection`, `sdIndex`, …). */
  readonly type?: string;
  readonly align?: 'right';
  readonly badge?: boolean;
  readonly template?: boolean;
}

/** One skeleton cell. `none` leaves it empty; `hidden` mirrors the hidden cell of a `children` column. */
export interface TableSkeletonCell {
  readonly field: string;
  readonly shape: 'bar' | 'pill' | 'box' | 'none';
  readonly align: 'start' | 'end' | 'center';
  readonly width?: string;
  readonly maxWidth?: string;
  readonly hidden?: boolean;
}

const TEXT_WIDTHS = [72, 54, 84, 62, 46];
const NUMBER_WIDTHS = [64, 48, 80, 56, 72];
const FIXED_WIDTHS: Readonly<Record<string, string>> = { date: '76px', datetime: '116px', time: '44px', boolean: '40px' };
const TEXT_TYPES = new Set(['string', 'values', 'lazy-values']);
const EMPTY_COLUMNS = new Set(['sdCommand', 'sdReorder', 'sdSubInformationAction', 'sdFiller']);

function skeletonCell(column: TableSkeletonColumn, row: number, dataColumn: number): TableSkeletonCell {
  const { field, type } = column;
  if (field === 'sdSelection') return { field, shape: 'box', align: 'center' };
  if (field === 'sdIndex') return { field, shape: 'bar', align: 'center', width: '16px' };
  if (!type || EMPTY_COLUMNS.has(field)) return { field, shape: 'none', align: 'start' };
  if (type === 'children') return { field, shape: 'none', align: 'start', hidden: true };
  const align = column.align === 'right' ? 'end' : 'start';
  const step = (row + dataColumn) % 5;
  if (column.badge) return { field, shape: 'pill', align, width: '64px' };
  if (type === 'number' && !column.template) return { field, shape: 'bar', align, width: `${NUMBER_WIDTHS[step]}%`, maxWidth: '120px' };
  if (FIXED_WIDTHS[type] && !column.template) return { field, shape: 'bar', align, width: FIXED_WIDTHS[type], maxWidth: '100%' };
  if (TEXT_TYPES.has(type) || column.template) return { field, shape: 'bar', align, width: `${TEXT_WIDTHS[step]}%`, maxWidth: '240px' };
  return { field, shape: 'none', align };
}

/**
 * `rows` skeleton rows over the displayed columns. Bar widths follow the column type, the row `i` and the data
 * column `j` (the table's own columns do not count), so the rows look like text without repeating.
 */
export function buildTableSkeleton(columns: readonly TableSkeletonColumn[], rows: number): TableSkeletonCell[][] {
  return Array.from({ length: rows }, (_, row) => {
    let dataColumn = 0;
    return columns.map(column => skeletonCell(column, row, column.type && column.type !== 'children' ? dataColumn++ : dataColumn));
  });
}

/** 5 rows × 4 text columns, without a header: what the table shows before its configuration is ready. */
export const TABLE_GENERIC_SKELETON = buildTableSkeleton(
  ['a', 'b', 'c', 'd'].map(field => ({ field, type: 'string' })),
  TABLE_SKELETON_ROWS
);

/**
 * Rows that fill the visible body of a table with a fixed height, at most `pageSize` and 20; `undefined` when
 * the height is not fixed or not measurable yet.
 */
export function skeletonFillRows(body: number, rowHeight: number, pageSize?: number): number | undefined {
  if (!(body > 0) || !(rowHeight > 0)) return undefined;
  const rows = Math.max(1, Math.floor(body / rowHeight));
  return Math.min(rows, TABLE_SKELETON_MAX_ROWS, pageSize && pageSize > 0 ? pageSize : TABLE_SKELETON_MAX_ROWS);
}

/** A resolved `max-height` in pixels; `undefined` for `none`, percentages and anything else not measurable. */
export function pixelLength(value: string | null | undefined): number | undefined {
  return value && /^-?\d+(\.\d+)?px$/.test(value.trim()) ? parseFloat(value) : undefined;
}

/**
 * - `skeleton`: the table has no rows and something is on its way — a read is loading, the first read of the
 *   option is scheduled, the configuration is not ready yet, or a read replaces one that showed the skeleton
 *   (`pending`).
 * - `refresh`: the progress bar is on and there is something under it: a read, a read waiting to replace it
 *   (`scheduled`), or the rows it keeps.
 */
export function tableLoadingView(state: {
  skeleton: boolean;
  loading: boolean;
  pending: boolean;
  scheduled: boolean;
  rows: boolean;
  refresh: boolean;
}): SdTableLoadingView {
  if (state.skeleton && !state.rows && (state.loading || state.pending)) return 'skeleton';
  return state.refresh && (state.loading || state.scheduled || state.rows) ? 'refresh' : 'none';
}

/** Cancels a callback that `schedule` registered. */
export type TableTimerCancel = () => void;

/**
 * Turns the progress bar of a table on and off. It comes on once the table has been busy for `showDelay` and
 * stays for at least `minDuration`. Busy means a read is loading, or a read that replaces it is waiting in the
 * schedule while the bar already shows: the debounce between two reads must not switch the bar off, but it
 * never switches the bar on either.
 */
export class TableRefreshTimer {
  readonly #shown = signal(false);
  /** Progress bar (and dimmed rows) on. */
  readonly shown = this.#shown.asReadonly();
  #busy = false;
  #shownAt = 0;
  #cancel?: TableTimerCancel;
  #destroyed = false;

  constructor(
    private readonly schedule: (callback: () => void, ms: number) => TableTimerCancel,
    private readonly now: () => number = () => Date.now()
  ) {}

  /**
   * @param state.loading `loading()` of the table.
   * @param state.scheduled a read waits in the schedule (debounce).
   * @param state.skeleton the table draws skeleton rows for this read, so no bar is scheduled.
   * @param state.rows the table has rows; `minDuration` is only kept over a result with rows.
   */
  update(
    state: { loading: boolean; scheduled: boolean; skeleton: boolean; rows: boolean },
    settings: Pick<TableLoadingSettings, 'showDelay' | 'minDuration'>
  ): void {
    if (this.#destroyed) return;
    // why: rows that went away while nothing loads (an option change resets the table) leave nothing for a held
    // bar to cover; it must not come back over the next rows.
    if (!state.loading && !state.scheduled && !state.rows && this.#shown()) {
      this.#clear();
      this.#shown.set(false);
    }
    const busy = state.loading || (this.#shown() && state.scheduled);
    if (busy === this.#busy) return;
    this.#busy = busy;
    this.#clear();
    if (busy) {
      // why: a skeleton read has no rows to keep; a bar still held over rows that are gone (an option change
      // during the hold) must not come back over the new rows.
      if (state.skeleton) {
        this.#shown.set(false);
        return;
      }
      // A new read while the bar shows (or is being held) keeps it and its start time.
      if (this.#shown()) return;
      this.#after(settings.showDelay, () => {
        this.#shownAt = this.now();
        this.#shown.set(true);
      });
      return;
    }
    if (!this.#shown()) return;
    const remaining = this.#shownAt + settings.minDuration - this.now();
    // why: an empty or failed result removes the rows; its empty/error region must show at once.
    if (remaining > 0 && state.rows) this.#after(remaining, () => this.#shown.set(false));
    else this.#shown.set(false);
  }

  destroy(): void {
    this.#destroyed = true;
    this.#clear();
  }

  #after(ms: number, callback: () => void): void {
    if (ms <= 0) {
      callback();
      return;
    }
    this.#cancel = this.schedule(() => {
      this.#cancel = undefined;
      if (!this.#destroyed) callback();
    }, ms);
  }

  #clear(): void {
    this.#cancel?.();
    this.#cancel = undefined;
  }
}
