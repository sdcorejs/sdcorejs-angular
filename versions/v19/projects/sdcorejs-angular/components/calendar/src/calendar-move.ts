import { afterNextRender, computed, signal, untracked, type Injector } from '@angular/core';
import type { SdCalendarState } from './calendar.model';

// Pieces of the move pipeline (calendar.md §9.5, SHARED-CONTRACT §3) that do not depend on the calendar's layout, so
// sd-scheduler reuses them through the ɵ exports of the entry point.

/** What one `onMove` call ended with. `aborted`: the request was cancelled before or after it answered (SC-15). */
export type SdCalendarMoveOutcome =
  | { readonly kind: 'accepted' }
  | { readonly kind: 'rejected' }
  | { readonly kind: 'cancelled' }
  | { readonly kind: 'error'; readonly error: unknown }
  | { readonly kind: 'aborted' };

/** Evaluates a capability flag; an omitted flag allows (SC-05, SC-06). */
export function sdCalendarAllows<C>(state: SdCalendarState<C> | undefined, context: C): boolean {
  if (state === undefined) return true;
  return typeof state === 'function' ? state(context) : state;
}

/**
 * Calls `onMove` and classifies its answer (SC-09 … SC-13): `true` or nothing accepts, `false` rejects, `'cancel'`
 * cancels, a throw or a rejection is an error. Any answer that arrives after `request.signal` was aborted is `aborted`.
 */
export async function sdCalendarCallMove<R extends { readonly signal: AbortSignal }>(
  onMove: (request: R) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>,
  request: R
): Promise<SdCalendarMoveOutcome> {
  let result: boolean | 'cancel' | void;
  try {
    result = await onMove(request);
  } catch (error) {
    return request.signal.aborted ? { kind: 'aborted' } : { kind: 'error', error };
  }
  // why: a range change, reload, new option, lock or destroy aborted the request; its late answer must not apply.
  if (request.signal.aborted) return { kind: 'aborted' };
  if (result === 'cancel') return { kind: 'cancelled' };
  if (result === false) return { kind: 'rejected' };
  return { kind: 'accepted' };
}

/** One waiting create or move per component (SC-14): a second `begin` is refused until the first one ends. */
export class SdCalendarOperation<K extends string> {
  readonly #current = signal<{ readonly kind: K; readonly controller: AbortController } | null>(null);
  /** Kind of the waiting operation, or `null`. */
  readonly kind = computed(() => this.#current()?.kind ?? null);
  readonly busy = computed(() => this.#current() !== null);

  /** Starts an operation and returns its signal, or `null` while another one waits. */
  begin(kind: K): AbortSignal | null {
    if (this.#current()) return null;
    const controller = new AbortController();
    this.#current.set({ kind, controller });
    return controller.signal;
  }

  /** Ends the operation of `signal`; a stale signal is ignored. */
  end(signal: AbortSignal): void {
    if (this.#current()?.controller.signal === signal) this.#current.set(null);
  }

  /** Aborts the waiting operation when its kind is one of `kinds` (all kinds when omitted). Returns whether it did. */
  abort(kinds?: readonly K[]): boolean {
    const current = this.#current();
    if (!current || (kinds && !kinds.includes(current.kind))) return false;
    current.controller.abort();
    this.#current.set(null);
    return true;
  }
}

/** Text of the one live region of a component (SC-33). */
export class SdCalendarAnnouncer {
  readonly #text = signal('');
  readonly text = this.#text.asReadonly();

  /** Writes the live region; the same text twice in a row gets a trailing no-break space so it is read again (R1-G9). */
  announce(message: string): void {
    const current = untracked(this.#text);
    this.#text.set(current === message ? `${message}\xa0` : message);
  }
}

/**
 * Puts the focus back on an item after a move that started from the keyboard or the scope bar (SC-29, SC-30). The
 * item may first need the next range to load, so `pending()` runs again after every load.
 */
export class SdCalendarFocusKeeper {
  #target: string | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly injector: Injector,
    /** The focusable element of an item, from its id. */
    private readonly selector: (id: string) => string,
    /** The scope bar: a focus inside it is the component's own, the bar is about to be removed (R2 A-18). */
    private readonly scopeSelector: string
  ) {}

  /** Focuses `id` unless the user moved the focus somewhere else while waiting (`origin` is where it started). */
  restore(id: string, origin: Element | null): void {
    const active = document.activeElement;
    const inScopeBar = !!active && !!this.host.querySelector(this.scopeSelector)?.contains(active);
    if (active && active !== document.body && active !== origin && active.isConnected && !inScopeBar) return;
    this.#target = id;
    this.pending();
  }

  /** Focuses the waiting item once it is rendered. */
  pending(): void {
    if (!this.#target) return;
    afterNextRender(
      () => {
        const id = this.#target;
        if (!id) return;
        const element = this.host.querySelector<HTMLElement>(this.selector(id));
        if (!element) return;
        this.#target = null;
        element.focus();
      },
      { injector: this.injector }
    );
  }
}
