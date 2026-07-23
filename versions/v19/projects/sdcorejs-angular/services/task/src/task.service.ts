import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import {
  SdTaskConnectionState,
  SdTaskRetryPolicy,
  SdTaskSource,
  SdTaskState,
  SdTaskSubscription,
  SdTaskView,
  SdTaskWatchOptions,
  isSdTaskTerminal,
} from './task.model';
import { SD_TASK_EVENT_SOURCE_FACTORY, SD_TASK_RANDOM, SdTaskEventSource } from './task.tokens';

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_RETRY_POLICY: Required<SdTaskRetryPolicy> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoff: 2,
  maxDelayMs: 30_000,
  jitter: 0.2,
};
const MAX_TIMER_MS = 2_147_483_647;

interface TaskEntry<TResult = unknown> {
  readonly id: string;
  readonly source: SdTaskSource<TResult>;
  readonly stateSignal: ReturnType<typeof signal<SdTaskState<TResult>>>;
  readonly connectionSignal: ReturnType<typeof signal<SdTaskConnectionState>>;
  readonly errorSignal: ReturnType<typeof signal<unknown | null>>;
  readonly subscriberCountSignal: ReturnType<typeof signal<number>>;
  readonly view: SdTaskView<TResult>;
  timer?: ReturnType<typeof setTimeout>;
  controller?: AbortController;
  eventSource?: SdTaskEventSource;
  pendingCancel?: Promise<boolean>;
  readonly pendingCancelSignal: ReturnType<typeof signal<boolean>>;
  messageQueue: Promise<void>;
  generation: number;
  failures: number;
  requestAttempt: number;
  destroyed: boolean;
}

@Injectable({ providedIn: 'root' })
export class SdTaskService {
  readonly #eventSourceFactory = inject(SD_TASK_EVENT_SOURCE_FACTORY);
  readonly #random = inject(SD_TASK_RANDOM);
  readonly #destroyRef = inject(DestroyRef);
  readonly #entries = signal<ReadonlyMap<string, TaskEntry>>(new Map());

  readonly tasks = computed(() => [...this.#entries().values()].map(entry => entry.view));

  constructor() {
    this.#destroyRef.onDestroy(() => {
      for (const entry of this.#entries().values()) {
        entry.destroyed = true;
        this.#stop(entry);
      }
      this.#entries.set(new Map());
    });
  }

  watch<TResult = unknown>(options: SdTaskWatchOptions<TResult>): SdTaskSubscription<TResult> {
    const existing = this.#entries().get(options.id) as TaskEntry<TResult> | undefined;
    if (existing) {
      existing.subscriberCountSignal.update(count => count + 1);
      return this.#createLease(existing);
    }

    const initialState = normalizeState(options.id, options.initialState ?? { id: options.id, status: 'queued' });
    const stateSignal = signal(initialState);
    const connectionSignal = signal<SdTaskConnectionState>(options.source.mode === 'manual' ? 'idle' : 'connecting');
    const errorSignal = signal<unknown | null>(null);
    const subscriberCountSignal = signal(1);
    const pendingCancelSignal = signal(false);
    const entry = {} as TaskEntry<TResult>;
    const view: SdTaskView<TResult> = {
      id: options.id,
      state: stateSignal.asReadonly(),
      connection: connectionSignal.asReadonly(),
      error: errorSignal.asReadonly(),
      subscriberCount: subscriberCountSignal.asReadonly(),
      canCancel: computed(() => {
        const status = stateSignal().status;
        return !pendingCancelSignal() && (status === 'queued' || status === 'running');
      }),
      canRetry: computed(() => {
        const status = stateSignal().status;
        return connectionSignal() === 'error' || status === 'failed' || status === 'cancelled';
      }),
      cancel: () => this.#cancel(entry),
      retry: () => this.#retry(entry),
    };
    Object.assign(entry, {
      id: options.id,
      source: options.source,
      stateSignal,
      connectionSignal,
      errorSignal,
      subscriberCountSignal,
      pendingCancelSignal,
      view,
      messageQueue: Promise.resolve(),
      generation: 0,
      failures: 0,
      requestAttempt: 0,
      destroyed: false,
    });
    this.#entries.update(entries => new Map(entries).set(options.id, entry as unknown as TaskEntry));

    if (!isSdTaskTerminal(initialState.status)) this.#start(entry);
    else connectionSignal.set('closed');
    return this.#createLease(entry);
  }

  get<TResult = unknown>(id: string): SdTaskView<TResult> | undefined {
    return this.#entries().get(id)?.view as SdTaskView<TResult> | undefined;
  }

  update<TResult = unknown>(id: string, patch: Partial<Omit<SdTaskState<TResult>, 'id'>>): boolean {
    const entry = this.#entries().get(id) as TaskEntry<TResult> | undefined;
    if (!entry) return false;
    this.#applyState(entry, { ...entry.stateSignal(), ...patch, id });
    return true;
  }

  cancel(id: string): Promise<boolean> {
    const entry = this.#entries().get(id);
    return entry ? this.#cancel(entry) : Promise.resolve(false);
  }

  retry(id: string): boolean {
    const entry = this.#entries().get(id);
    if (!entry) return false;
    this.#retry(entry);
    return true;
  }

  #createLease<TResult>(entry: TaskEntry<TResult>): SdTaskSubscription<TResult> {
    const destroyed = signal(false);
    return {
      ...entry.view,
      destroyed: destroyed.asReadonly(),
      destroy: () => {
        if (destroyed()) return;
        destroyed.set(true);
        entry.subscriberCountSignal.update(count => Math.max(0, count - 1));
        if (entry.subscriberCountSignal() > 0) return;
        entry.destroyed = true;
        this.#stop(entry);
        this.#entries.update(entries => {
          if (entries.get(entry.id) !== entry) return entries;
          const next = new Map(entries);
          next.delete(entry.id);
          return next;
        });
      },
    };
  }

  #start<TResult>(entry: TaskEntry<TResult>): void {
    if (entry.destroyed || entry.subscriberCountSignal() === 0 || isSdTaskTerminal(entry.stateSignal().status)) return;
    this.#stop(entry);
    entry.destroyed = false;
    entry.failures = 0;
    entry.requestAttempt = 0;
    entry.errorSignal.set(null);
    const generation = entry.generation;

    if (entry.source.mode === 'manual') {
      entry.connectionSignal.set('idle');
      return;
    }
    entry.connectionSignal.set('connecting');
    if (entry.source.mode === 'poll') void this.#runPoll(entry, generation);
    else this.#openSse(entry, generation);
  }

  #stop<TResult>(entry: TaskEntry<TResult>): void {
    entry.generation += 1;
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = undefined;
    entry.controller?.abort();
    entry.controller = undefined;
    entry.eventSource?.close();
    entry.eventSource = undefined;
  }

  async #runPoll<TResult>(entry: TaskEntry<TResult>, generation: number): Promise<void> {
    if (!this.#isCurrent(entry, generation) || entry.source.mode !== 'poll') return;
    const controller = new AbortController();
    entry.controller = controller;
    const attempt = ++entry.requestAttempt;

    try {
      const state = await Promise.resolve(
        entry.source.load({ id: entry.id, signal: controller.signal, attempt, state: entry.stateSignal() })
      );
      if (!this.#isCurrent(entry, generation) || controller.signal.aborted) return;
      entry.controller = undefined;
      entry.failures = 0;
      entry.errorSignal.set(null);
      entry.connectionSignal.set('open');
      this.#applyState(entry, state);
      if (!this.#isCurrent(entry, generation) || isSdTaskTerminal(entry.stateSignal().status)) return;
      this.#schedule(entry, normalizeTimer(entry.source.intervalMs, DEFAULT_POLL_INTERVAL_MS), () => this.#runPoll(entry, generation));
    } catch (error) {
      if (!this.#isCurrent(entry, generation) || controller.signal.aborted) return;
      entry.controller = undefined;
      this.#handleConnectionFailure(entry, generation, error, entry.source.retry, () => this.#runPoll(entry, generation));
    }
  }

  #openSse<TResult>(entry: TaskEntry<TResult>, generation: number): void {
    if (!this.#isCurrent(entry, generation) || entry.source.mode !== 'sse') return;
    if (!this.#eventSourceFactory) {
      entry.connectionSignal.set('error');
      entry.errorSignal.set(new Error('EventSource is unavailable in this environment.'));
      return;
    }

    let eventSource: SdTaskEventSource;
    try {
      const url = typeof entry.source.url === 'function' ? entry.source.url() : entry.source.url;
      eventSource = this.#eventSourceFactory.create(url, entry.source.eventSourceInit);
    } catch (error) {
      this.#handleConnectionFailure(entry, generation, error, entry.source.retry, () => this.#openSse(entry, generation));
      return;
    }
    entry.eventSource = eventSource;

    eventSource.onopen = () => {
      if (!this.#isCurrentEventSource(entry, generation, eventSource)) return;
      entry.failures = 0;
      entry.errorSignal.set(null);
      entry.connectionSignal.set('open');
    };
    eventSource.onmessage = event => {
      entry.messageQueue = entry.messageQueue.then(() => this.#handleSseMessage(entry, generation, eventSource, event));
    };
    eventSource.onerror = event => {
      if (!this.#isCurrentEventSource(entry, generation, eventSource)) return;
      eventSource.close();
      entry.eventSource = undefined;
      this.#handleConnectionFailure(entry, generation, event, entry.source.mode === 'sse' ? entry.source.retry : undefined, () =>
        this.#openSse(entry, generation)
      );
    };
  }

  async #handleSseMessage<TResult>(
    entry: TaskEntry<TResult>,
    generation: number,
    eventSource: SdTaskEventSource,
    event: MessageEvent<string>
  ): Promise<void> {
    if (!this.#isCurrentEventSource(entry, generation, eventSource) || entry.source.mode !== 'sse') return;
    try {
      const state = entry.source.parse
        ? await Promise.resolve(entry.source.parse(event))
        : (JSON.parse(event.data) as SdTaskState<TResult>);
      if (!this.#isCurrentEventSource(entry, generation, eventSource)) return;
      entry.errorSignal.set(null);
      this.#applyState(entry, state);
    } catch (error) {
      if (!this.#isCurrentEventSource(entry, generation, eventSource)) return;
      eventSource.close();
      entry.eventSource = undefined;
      this.#handleConnectionFailure(entry, generation, error, entry.source.retry, () => this.#openSse(entry, generation));
    }
  }

  #handleConnectionFailure<TResult>(
    entry: TaskEntry<TResult>,
    generation: number,
    error: unknown,
    policy: SdTaskRetryPolicy | undefined,
    retry: () => void | Promise<void>
  ): void {
    if (!this.#isCurrent(entry, generation)) return;
    entry.failures += 1;
    entry.errorSignal.set(error);
    const normalized = normalizeRetryPolicy(policy);
    if (entry.failures > normalized.maxAttempts) {
      entry.connectionSignal.set('error');
      return;
    }
    entry.connectionSignal.set('reconnecting');
    this.#schedule(entry, this.#retryDelay(normalized, entry.failures), retry);
  }

  #retryDelay(policy: Required<SdTaskRetryPolicy>, failure: number): number {
    const exponential = Math.min(policy.maxDelayMs, policy.initialDelayMs * Math.pow(policy.backoff, failure - 1));
    const jitter = exponential * policy.jitter * (this.#random() * 2 - 1);
    return Math.max(0, Math.min(policy.maxDelayMs, Math.round(exponential + jitter)));
  }

  #schedule<TResult>(entry: TaskEntry<TResult>, delayMs: number, callback: () => void | Promise<void>): void {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(
      () => {
        entry.timer = undefined;
        void callback();
      },
      normalizeTimer(delayMs, 0)
    );
  }

  #applyState<TResult>(entry: TaskEntry<TResult>, state: SdTaskState<TResult>): void {
    const normalized = normalizeState(entry.id, state);
    entry.stateSignal.set(normalized);
    if (!isSdTaskTerminal(normalized.status)) return;
    this.#stop(entry);
    entry.connectionSignal.set('closed');
  }

  #cancel<TResult>(entry: TaskEntry<TResult>): Promise<boolean> {
    if (entry.pendingCancel) return entry.pendingCancel;
    if (entry.destroyed || entry.subscriberCountSignal() === 0 || isSdTaskTerminal(entry.stateSignal().status)) {
      return Promise.resolve(false);
    }

    const generation = entry.generation;
    entry.pendingCancelSignal.set(true);
    let actionResult: ReturnType<NonNullable<typeof entry.source.cancel>> | undefined;
    try {
      actionResult = entry.source.cancel?.({ id: entry.id, state: entry.stateSignal() });
    } catch (error) {
      entry.pendingCancelSignal.set(false);
      entry.errorSignal.set(error);
      return Promise.resolve(false);
    }

    const pending = Promise.resolve(actionResult)
      .then(result => {
        if (result === false) return false;
        if (!this.#isCurrent(entry, generation)) return true;
        if (result && typeof result === 'object') this.#applyState(entry, result);
        else this.#applyState(entry, { ...entry.stateSignal(), id: entry.id, status: 'cancelled' });
        return true;
      })
      .catch((error: unknown) => {
        if (this.#isCurrent(entry, generation)) entry.errorSignal.set(error);
        return false;
      })
      .finally(() => {
        if (entry.pendingCancel === pending) {
          entry.pendingCancel = undefined;
          entry.pendingCancelSignal.set(false);
        }
      });
    entry.pendingCancel = pending;
    return pending;
  }

  #retry<TResult>(entry: TaskEntry<TResult>): void {
    if (entry.destroyed || entry.subscriberCountSignal() === 0 || entry.stateSignal().status === 'succeeded') return;
    const status = entry.stateSignal().status;
    if (entry.connectionSignal() !== 'error' && status !== 'failed' && status !== 'cancelled') return;
    if (status === 'failed' || status === 'cancelled') {
      entry.stateSignal.set({ ...entry.stateSignal(), status: 'queued', progress: undefined, error: undefined });
    }
    this.#start(entry);
  }

  #isCurrent<TResult>(entry: TaskEntry<TResult>, generation: number): boolean {
    return !entry.destroyed && entry.subscriberCountSignal() > 0 && entry.generation === generation;
  }

  #isCurrentEventSource<TResult>(entry: TaskEntry<TResult>, generation: number, eventSource: SdTaskEventSource): boolean {
    return this.#isCurrent(entry, generation) && entry.eventSource === eventSource;
  }
}

function normalizeState<TResult>(id: string, state: SdTaskState<TResult>): SdTaskState<TResult> {
  const progress = state.progress;
  return {
    ...state,
    id,
    progress: progress === undefined || !Number.isFinite(progress) ? undefined : Math.max(0, Math.min(100, progress)),
  };
}

function normalizeRetryPolicy(policy: SdTaskRetryPolicy | undefined): Required<SdTaskRetryPolicy> {
  return {
    maxAttempts: normalizeInteger(policy?.maxAttempts, DEFAULT_RETRY_POLICY.maxAttempts, 0, 100),
    initialDelayMs: normalizeTimer(policy?.initialDelayMs, DEFAULT_RETRY_POLICY.initialDelayMs),
    backoff: normalizeNumber(policy?.backoff, DEFAULT_RETRY_POLICY.backoff, 1, 100),
    maxDelayMs: normalizeTimer(policy?.maxDelayMs, DEFAULT_RETRY_POLICY.maxDelayMs),
    jitter: normalizeNumber(policy?.jitter, DEFAULT_RETRY_POLICY.jitter, 0, 1),
  };
}

function normalizeTimer(value: number | undefined, fallback: number): number {
  return normalizeInteger(value, fallback, 0, MAX_TIMER_MS);
}

function normalizeInteger(value: number | undefined, fallback: number, min: number, max: number): number {
  return Math.round(normalizeNumber(value, fallback, min, max));
}

function normalizeNumber(value: number | undefined, fallback: number, min: number, max: number): number {
  const normalized = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.max(min, Math.min(max, normalized));
}
