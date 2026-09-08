import { TemplateRef, signal } from '@angular/core';

export type SdReadOperation = 'TABLE' | 'VALUE' | 'SEARCH';
export type SdReadStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

/** An accepted read result. Only an error snapshot contains the original exception. */
export type SdReadState = Readonly<
  { status: Exclude<SdReadStatus, 'error'>; operation: SdReadOperation } | { status: 'error'; operation: SdReadOperation; error: unknown }
>;

export type SdSearchReadState = SdReadState & {
  readonly channels: Readonly<{ VALUE: SdReadState; SEARCH: SdReadState }>;
};

/** VALUE errors take precedence; otherwise SEARCH errors, then the active SEARCH channel. */
export function combineReadStates(value: SdReadState, search: SdReadState): SdSearchReadState {
  const current = value.status === 'error' ? value : search.status !== 'idle' ? search : value;
  return Object.freeze({ ...current, channels: Object.freeze({ VALUE: value, SEARCH: search }) });
}

/** @internal Request guard shared by controls. Context is checked even before Angular effects run. */
export class SdReadChannel {
  readonly #state;
  readonly state;
  #revision = 0;
  #valid = () => true;

  constructor(
    readonly operation: SdReadOperation,
    private readonly changed?: (state: SdReadState) => void
  ) {
    this.#state = signal<SdReadState>(Object.freeze({ status: 'idle', operation }));
    this.state = this.#state.asReadonly();
  }

  begin(valid: () => boolean = () => true): number {
    this.#valid = valid;
    const revision = ++this.#revision;
    this.#set({ status: 'loading', operation: this.operation });
    return revision;
  }

  isCurrent(revision: number): boolean {
    return revision === this.#revision && this.#valid();
  }

  succeed(revision: number, count: number): boolean {
    if (!this.isCurrent(revision)) return false;
    this.#set({ status: count ? 'ready' : 'empty', operation: this.operation });
    return true;
  }

  fail(revision: number, error: unknown): boolean {
    if (!this.isCurrent(revision)) return false;
    this.#set({ status: 'error', operation: this.operation, error });
    return true;
  }

  invalidate(): void {
    ++this.#revision;
    this.#valid = () => true;
    if (this.state().status !== 'idle') this.#set({ status: 'idle', operation: this.operation });
  }

  #set(state: SdReadState): void {
    const snapshot = Object.freeze(state);
    this.#state.set(snapshot);
    this.changed?.(snapshot);
  }
}

/**
 * @internal Copy request-owned data, including Dates. Unlike ObjectUtilities.clone,
 * Dates must be copied too; structuredClone cannot retain table column callbacks.
 */
export function cloneReadRequest<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== 'object') return value;
  // why: TemplateRef là handle thuộc Angular view, không phải dữ liệu request có thể sao chép.
  if (value instanceof TemplateRef) return value;
  if (seen.has(value)) return seen.get(value) as T;
  if (value instanceof Date) return new Date(value.getTime()) as T;
  const copy = (Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value))) as T;
  seen.set(value, copy);
  for (const key of Object.keys(value)) {
    Object.defineProperty(copy, key, {
      value: cloneReadRequest((value as Record<string, unknown>)[key], seen),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return copy;
}
