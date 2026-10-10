# `SdTaskService`

**Type:** root signal service
**Import path:** `@sdcorejs/angular/services/task`

## Purpose

Track long-running work by a stable ID. Duplicate consumers share one polling or SSE connection, while each `watch()` call owns a lease that must be destroyed. Business task state and transport state are separate so a temporary network failure does not turn a running job into a failed job.

## State model

```ts
type SdTaskStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
type SdTaskConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error';

interface SdTaskState<TResult = unknown> {
  readonly id: string;
  readonly status: SdTaskStatus;
  readonly progress?: number;
  readonly title?: string;
  readonly message?: string;
  readonly error?: unknown;
  readonly result?: TResult;
}
```

Progress is normalized to `0..100`. Terminal states (`succeeded`, `failed`, `cancelled`) close the active transport immediately.

## Polling

```ts
readonly exportTask = inject(SdTaskService).watch<{ downloadUrl: string }>({
  id: exportId,
  source: {
    mode: 'poll',
    intervalMs: 2_000,
    retry: { maxAttempts: 4, initialDelayMs: 500, backoff: 2, maxDelayMs: 10_000, jitter: 0.2 },
    load: async ({ id, signal }) => {
      const response = await fetch(`/api/tasks/${id}`, { signal });
      return response.json() as Promise<SdTaskState<{ downloadUrl: string }>>;
    },
    cancel: ({ id }) => fetch(`/api/tasks/${id}/cancel`, { method: 'POST' }).then(() => undefined),
  },
});
```

The next poll is scheduled only after the current request settles, so requests never overlap. Retry delay uses bounded exponential backoff and jitter. `AbortSignal` is aborted when the last lease is destroyed, the task becomes terminal, or the service injector is destroyed.

## Server-sent events

```ts
readonly importTask = inject(SdTaskService).watch({
  id: importId,
  source: {
    mode: 'sse',
    url: `/api/tasks/${importId}/events`,
    parse: event => JSON.parse(event.data) as SdTaskState,
    retry: { maxAttempts: 5, initialDelayMs: 1_000 },
  },
});
```

`SD_TASK_EVENT_SOURCE_FACTORY` owns browser access and resolves to `null` during SSR. Override it for authenticated/polyfilled EventSource implementations and unit tests. Parser and transport failures close the old source before reconnecting. `SD_TASK_RANDOM` can be overridden to make jitter deterministic in tests.

## Manual state and actions

```ts
const ref = tasks.watch({
  id: 'local-import',
  initialState: { id: 'local-import', status: 'queued' },
  source: { mode: 'manual', cancel: () => worker.cancel() },
});

tasks.update('local-import', { status: 'running', progress: 50 });
await tasks.cancel('local-import');
ref.retry();
ref.destroy();
```

Cancellation calls are coalesced. A thrown/rejected cancel handler leaves business state unchanged and exposes the error through `view.error`. Retry is accepted only for a failed/cancelled task or an exhausted transport.

## Stable IDs and cleanup

The first watcher for an ID owns its source until the last lease is destroyed. Later watchers with the same ID share its signals and connection; their source options are intentionally ignored. Use globally stable IDs and do not reuse an active ID for unrelated work.

Call `destroy()` for every lease, normally from `DestroyRef.onDestroy`. The registry removes the entry and aborts its transport after the final lease. Root injector teardown also closes every timer, request and EventSource.
