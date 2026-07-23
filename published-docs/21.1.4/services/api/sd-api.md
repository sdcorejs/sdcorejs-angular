# `SdApiService`

**Type:** root injectable HTTP service
**Import path:** `@sdcorejs/angular/services/api`

`SdApiService` wraps Angular `HttpClient` with safe request deduplication, per-caller cancellation, bounded retry, optional persistent cache and host-specific response mapping.

## Methods

```ts
get<T = unknown>(url: string, option?: SdGetOption): Promise<T>;
post<T = unknown>(url: string, body?: unknown, option?: SdPostOption): Promise<T>;
put<T = unknown>(url: string, body?: unknown, option?: SdPutOption): Promise<T>;
patch<T = unknown>(url: string, body?: unknown, option?: SdPatchOption): Promise<T>;
delete<T = unknown>(url: string, option?: SdDeleteOption): Promise<T>;
upload<T = unknown>(url: string, option?: UploadOption): Promise<T | null | undefined>;
uploadFile<T = unknown>(url: string, file: File | null | undefined): Promise<T | null>;
```

Specify `T` at the call site. The default is intentionally `unknown` so an untyped response is not treated as trusted application data.

## Deduplication

- GET deduplicates by default.
- POST, PUT, PATCH and DELETE never deduplicate by default.
- A mutation may opt in with `{ dedupe: true }` only when replaying the operation is known to be safe.
- `{ dedupe: false }` disables sharing for any request.
- `autoCache` remains as a deprecated compatibility alias; use `dedupe` for new code.
- The key includes method, URL, params, headers, context/body identity, response-affecting options, handler identity and retry policy. `FormData`, non-canonical values and unsafe callback identities do not collapse accidentally.
- `dedupeWindowMs` controls how long a successful result remains replayable. Errors and cancellations evict immediately.

```ts
const first = api.get<User[]>('/api/users');
const second = api.get<User[]>('/api/users'); // shares the in-flight GET

await Promise.all([
  api.post('/api/orders', order),
  api.post('/api/orders', order), // a separate mutation
]);
```

## Cancellation

Pass an `AbortSignal` through `option.signal`. Cancellation rejects that caller with an `AbortError`. When a request is shared, the underlying HTTP subscription continues while another caller still owns it; it is unsubscribed when the final pending owner cancels. Cancellation also stops pending retry delays.

```ts
const controller = new AbortController();
const request = api.get<Report>('/api/report', { signal: controller.signal });
controller.abort();
await request; // rejects with AbortError
```

## Retry

Retry is opt-in and bounded to ten retries after the initial request.

```ts
await api.get<Summary>('/api/summary', {
  retry: {
    attempts: 3,
    delayMs: 250,
    backoff: 2,
    retryWhen: (_error, attempt) => attempt <= 3,
  },
});
```

The default predicate retries timeouts, network status `0`, and transient HTTP statuses `408`, `425`, `429`, `500`, `502`, `503`, `504`. Mutations require both a retry policy and `retry.mutations: true`; they are never retried implicitly.

## Persistent response cache

`cacheOption` layers `SdCacheService` around the request. Cache identity includes the request contract. A cached `undefined` is distinguishable from a miss through the cache snapshot API.

```ts
const metadata = await api.get<Metadata>('/api/metadata', {
  cacheOption: { type: 'session', ttlMs: 60_000, namespace: 'portal', version: 2 },
});
```

Do not cache mutations unless the endpoint is explicitly idempotent and returning a reusable resource representation.

## Configuration and interceptors

`SD_API_CONFIG` registers `SdApiHandler` values by host. `mapResponse` is applied by the service. `intercept`, `beforeRemote` and `afterRemote` are executed by `SdHttpInterceptor`, so standalone applications must register Angular HTTP with DI interceptors (or import `SdApiModule` in an NgModule application).

`SD_API_CONFIGURATION` remains a deprecated alias of the same token.

## SSR, browser APIs and cleanup

- Normal HTTP methods use Angular `HttpClient` and follow the host application's SSR transfer/backend setup.
- `upload()` opens a browser file picker and is browser-only; use `uploadFile()` only when a real `File` exists.
- Destroying the injector unsubscribes active requests, rejects their callers, clears replay timers and removes abort listeners.
- Failure, cancellation and successful replay expiry all remove in-flight registry entries.

## Migration from pre-1.4 behavior

- Add `<T>` to calls that previously relied on an implicit unsafe response type.
- Replace direct `api.http.patch(...)` calls with `api.patch<T>(...)` when wrapper behavior is desired.
- Mutations no longer share automatically. Use `dedupe: true` only after proving idempotency.
- Replace `autoCache` with `dedupe`; persistent caching still uses `cacheOption`.
- Add an explicit retry policy; there are no implicit retries.

Focused coverage lives in `api.service.spec.ts` and `interceptors/api.interceptor.spec.ts`.
