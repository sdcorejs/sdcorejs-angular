import { Signal } from '@angular/core';

export type SdTaskMaybeAsync<T> = T | PromiseLike<T>;
export type SdTaskStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type SdTaskConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error';

export interface SdTaskState<TResult = unknown> {
  readonly id: string;
  readonly status: SdTaskStatus;
  readonly progress?: number;
  readonly title?: string;
  readonly message?: string;
  readonly error?: unknown;
  readonly result?: TResult;
  readonly updatedAt?: number | Date;
}

export interface SdTaskRetryPolicy {
  readonly maxAttempts?: number;
  readonly initialDelayMs?: number;
  readonly backoff?: number;
  readonly maxDelayMs?: number;
  readonly jitter?: number;
}

export interface SdTaskLoadContext<TResult = unknown> {
  readonly id: string;
  readonly signal: AbortSignal;
  readonly attempt: number;
  readonly state: SdTaskState<TResult>;
}

export interface SdTaskActionContext<TResult = unknown> {
  readonly id: string;
  readonly state: SdTaskState<TResult>;
}

export type SdTaskCancelResult<TResult = unknown> = void | boolean | SdTaskState<TResult>;
export type SdTaskCancelHandler<TResult = unknown> = (
  context: SdTaskActionContext<TResult>
) => SdTaskMaybeAsync<SdTaskCancelResult<TResult>>;

interface SdTaskSourceBase<TResult> {
  readonly cancel?: SdTaskCancelHandler<TResult>;
}

export interface SdTaskManualSource<TResult = unknown> extends SdTaskSourceBase<TResult> {
  readonly mode: 'manual';
}

export interface SdTaskPollingSource<TResult = unknown> extends SdTaskSourceBase<TResult> {
  readonly mode: 'poll';
  readonly load: (context: SdTaskLoadContext<TResult>) => SdTaskMaybeAsync<SdTaskState<TResult>>;
  readonly intervalMs?: number;
  readonly retry?: SdTaskRetryPolicy;
}

export interface SdTaskSseSource<TResult = unknown> extends SdTaskSourceBase<TResult> {
  readonly mode: 'sse';
  readonly url: string | (() => string);
  readonly eventSourceInit?: EventSourceInit;
  readonly parse?: (event: MessageEvent<string>) => SdTaskMaybeAsync<SdTaskState<TResult>>;
  readonly retry?: SdTaskRetryPolicy;
}

export type SdTaskSource<TResult = unknown> = SdTaskManualSource<TResult> | SdTaskPollingSource<TResult> | SdTaskSseSource<TResult>;

export interface SdTaskWatchOptions<TResult = unknown> {
  readonly id: string;
  readonly initialState?: SdTaskState<TResult>;
  readonly source: SdTaskSource<TResult>;
}

export interface SdTaskView<TResult = unknown> {
  readonly id: string;
  readonly state: Signal<SdTaskState<TResult>>;
  readonly connection: Signal<SdTaskConnectionState>;
  readonly error: Signal<unknown | null>;
  readonly subscriberCount: Signal<number>;
  readonly canCancel: Signal<boolean>;
  readonly canRetry: Signal<boolean>;
  cancel(): Promise<boolean>;
  retry(): void;
}

export interface SdTaskSubscription<TResult = unknown> extends SdTaskView<TResult> {
  readonly destroyed: Signal<boolean>;
  destroy(): void;
}

export function isSdTaskTerminal(status: SdTaskStatus): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled';
}
