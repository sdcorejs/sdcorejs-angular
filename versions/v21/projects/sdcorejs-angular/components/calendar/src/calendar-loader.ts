import { signal } from '@angular/core';

// Lifecycle of `dataSource.onLoad` (SHARED-CONTRACT SC-22 … SC-24, calendar.md §13), shared with sd-scheduler through
// the ɵ exports of the entry point.

/** `loading`: first load or a new range (the grid is empty); `reloading`: same range, the items stay. */
export type SdCalendarLoadPhase = 'idle' | 'loading' | 'reloading' | 'error';

export class SdCalendarLoader<T> {
  /** Items of the last successful load; updated in place by accepted creates and moves. */
  readonly items = signal<readonly T[]>([]);
  readonly phase = signal<SdCalendarLoadPhase>('idle');
  /** At least one load succeeded: later loads show the progress bar only, never the skeleton. */
  readonly everLoaded = signal(false);
  #controller: AbortController | null = null;
  #key: string | null = null;

  /**
   * Aborts the running load and calls `call` for `key`. A different key clears the items first; the same key keeps
   * them until the result arrives. A late or aborted result is dropped. `onError` runs for a real failure only, after
   * the items were cleared (§13).
   */
  async load(
    key: string,
    call: (signal: AbortSignal) => readonly T[] | Promise<readonly T[]>,
    onError: (error: unknown) => void
  ): Promise<void> {
    const keep = key === this.#key;
    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;
    this.#key = key;
    if (!keep) this.items.set([]);
    this.phase.set(keep && this.everLoaded() ? 'reloading' : 'loading');
    let items: readonly T[];
    try {
      items = await call(controller.signal);
    } catch (error) {
      if (this.#controller !== controller || controller.signal.aborted) return;
      this.#controller = null;
      this.items.set([]);
      this.phase.set('error');
      onError(error);
      return;
    }
    // why: a newer key, option or reload aborted this request; its late result must not replace newer data.
    if (this.#controller !== controller || controller.signal.aborted) return;
    this.#controller = null;
    this.items.set(Array.isArray(items) ? items : []);
    this.everLoaded.set(true);
    this.phase.set('idle');
  }

  /** Aborts the running load (destroy). */
  abort(): void {
    this.#controller?.abort();
    this.#controller = null;
  }
}
