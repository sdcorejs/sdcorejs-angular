import { afterNextRender, computed, signal, untracked, type Injector } from '@angular/core';
import type { SdCalendarMoveScope, SdCalendarMoveSource, SdCalendarState } from './calendar.model';

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

/** One move handed to `SdCalendarMoveRunner`: what is specific to the component (calendar.md §9.5, scheduler.md §9.5). */
export interface SdCalendarMovePlan<R extends { readonly signal: AbortSignal }> {
  readonly id: string;
  readonly title: string;
  /** An occurrence of a series: the scope bar asks first, unless the move comes from `move()` (§9.6). */
  readonly recurring: boolean;
  readonly source: SdCalendarMoveSource;
  /** Started from the keyboard: the focus goes back to the item afterwards (SC-29). */
  readonly keyboard: boolean;
  /** The capability flags, evaluated again right before `onMove` (SC-06); `false` stops without a callback. */
  readonly allowed: () => boolean;
  readonly request: (scope: SdCalendarMoveScope | null, signal: AbortSignal) => R;
  readonly onMove: (request: R) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>;
  /** Draws the item at its target: `false` while the scope bar asks, `true` while `onMove` runs, `null` clears. */
  readonly show: (saving: boolean | null) => void;
  /** `onMove` accepted: change the data and emit the move output. Returns the text for the live region. */
  readonly accept: (request: R) => string;
  /** `onMove` rejected or failed: emit the error output. */
  readonly fail: (request: R, outcome: { readonly kind: 'rejected' } | { readonly kind: 'error'; readonly error: unknown }) => void;
}

/** What `SdCalendarMoveRunner` needs from its component. */
export interface SdCalendarMoveHost {
  readonly operation: SdCalendarOperation<'create' | 'move'>;
  readonly announcer: SdCalendarAnnouncer;
  readonly focus: SdCalendarFocusKeeper;
  readonly t: (key: string, params?: Record<string, string | number>) => string;
  /** Opens the scope bar and resolves with the answer; `null` is Cancel. */
  readonly ask: (title: string) => Promise<SdCalendarMoveScope | null>;
  /** Shows the failure band of an item, or clears it with `null`. */
  readonly band: (failure: { readonly id: string; readonly message: string } | null) => void;
  readonly reload: () => void;
}

/**
 * The move pipeline after the component's own checks (calendar.md §9.5 steps 4–6): one waiting operation (SC-14), the
 * scope bar of an occurrence, the flags once more (SC-06), `onMove` and its five results (SC-09 … SC-13), focus
 * (SC-29, SC-30) and the live region. Shared by sd-calendar and sd-scheduler.
 */
export class SdCalendarMoveRunner {
  constructor(private readonly host: SdCalendarMoveHost) {}

  async run<R extends { readonly signal: AbortSignal }>(plan: SdCalendarMovePlan<R>): Promise<boolean> {
    const { operation, announcer, focus, t } = this.host;
    const signal = operation.begin('move');
    if (!signal) return false;
    const origin = plan.keyboard ? document.activeElement : null;
    let restore = plan.keyboard;
    let scope: SdCalendarMoveScope | null = plan.recurring ? 'this' : null;
    if (plan.recurring && plan.source !== 'api') {
      // The scope bar takes the focus, so it goes back to the item when the bar closes, after a mouse drag too.
      restore = true;
      // §9.6: an occurrence waits at the proposal (dashed, no sync icon) until the user picks a scope.
      plan.show(false);
      scope = await this.host.ask(plan.title);
      if (signal.aborted) return false;
      if (scope === null) {
        operation.end(signal);
        plan.show(null);
        announcer.announce(t('core.component.calendar.cancelled'));
        focus.restore(plan.id, origin);
        return false;
      }
    }
    if (!plan.allowed()) {
      operation.end(signal);
      plan.show(null);
      return false;
    }
    const request = Object.freeze(plan.request(scope, signal));
    this.host.band(null);
    plan.show(true);
    announcer.announce(t('core.component.calendar.pending', { title: plan.title }));
    const outcome = await sdCalendarCallMove(plan.onMove, request);
    if (outcome.kind === 'aborted') return false;
    operation.end(signal);
    plan.show(null);
    if (restore) focus.restore(plan.id, origin);
    if (outcome.kind === 'cancelled') {
      announcer.announce(t('core.component.calendar.cancelled'));
      return false;
    }
    if (outcome.kind === 'rejected' || outcome.kind === 'error') {
      const message = t(`core.component.calendar.${outcome.kind === 'rejected' ? 'rejected' : 'error'}`);
      this.host.band({ id: plan.id, message });
      announcer.announce(message);
      plan.fail(request, outcome);
      return false;
    }
    announcer.announce(plan.accept(request));
    if (scope === 'following' || scope === 'all') this.host.reload();
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
