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

/**
 * - `skeleton`: the table has no rows and something is on its way — a read is loading, the first read of the
 *   option is scheduled, or the configuration is not ready yet (`pending`).
 * - `refresh`: the progress bar is on and there is something under it (a read, or the rows it keeps).
 */
export function tableLoadingView(state: {
  skeleton: boolean;
  loading: boolean;
  pending: boolean;
  rows: boolean;
  refresh: boolean;
}): SdTableLoadingView {
  if (state.skeleton && !state.rows && (state.loading || state.pending)) return 'skeleton';
  return state.refresh && (state.loading || state.rows) ? 'refresh' : 'none';
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
    const busy = state.loading || (this.#shown() && state.scheduled);
    if (busy === this.#busy) return;
    this.#busy = busy;
    this.#clear();
    if (busy) {
      // A new read while the bar shows (or is being held) keeps it and its start time.
      if (this.#shown() || state.skeleton) return;
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
