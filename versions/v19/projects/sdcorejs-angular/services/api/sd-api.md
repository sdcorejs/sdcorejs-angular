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

### Key identity

Dedupe and cache keys are a **SHA-256 digest** (`sd-api@1:<64 hex>`) over a canonical serialization of the request contract. Object keys are sorted and reference cycles are encoded, so two semantically identical requests always produce the same key, and two different requests never do.

This replaced a 32-bit rolling hash that `Math.abs` collapsed to 31 effective bits. A collision there meant two unrelated requests shared one in-flight response or one cached body — a cross-request data leak.

**If a request contract cannot be canonicalized at all** (for example a body holding a `symbol` or a function), the service fails closed by producing **no key**. That call skips deduplication and skips the cache layer entirely, and simply issues its own HTTP request. It does *not* mint a synthetic unique key: the same value also feeds `SdCacheService.create`, so a per-call key combined with `cacheOption.type: 'local'` / `'session'` wrote one persistent storage entry per request that could never be read back (the key is never generated a second time) and was never evicted — an unbounded storage leak.

Key format is an internal detail. Do not persist it or reconstruct it in application code; read it from `SdCacheService.create` if a test needs it.

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

## Response envelope contract

A `200 OK` whose JSON body is an object with `ok === false` is treated as a **failed** request. The body is not returned; the call rejects with `SdApiError`.

```ts
export class SdApiError<TBody = unknown> extends Error {
  readonly name: 'SdApiError';
  /** The response body exactly as the server sent it. */
  readonly body: TBody;
  constructor(body: TBody, message?: string);
}
```

- `message` is taken from `body.message` when the envelope carries a non-empty string there; otherwise it is `'The API response envelope reported ok: false'`.
- `body` always holds the original object, so nothing is lost by the wrapping.

```ts
import { SdApiError } from '@sdcorejs/angular/services/api';

try {
  await api.post<Order>('/api/orders', order);
} catch (error) {
  if (error instanceof SdApiError) {
    // envelope failure — error.body is the server payload
    console.warn(error.message, error.body);
  }
  throw error;
}
```

Any other body shape — including `{ ok: true, ... }` and bodies with no `ok` key at all — is returned untouched and then passed through `mapResponse`.

Before 1.5 the raw body object was thrown directly. It was not an `Error`, so `instanceof Error` was `false`, `.message` was `undefined`, and `retry.retryWhen` predicates skipped it entirely. Application code that matched on the thrown value by shape must now read `error.body`.

## Configuration and interceptors

`SD_API_CONFIG` registers `SdApiHandler` values by host. `mapResponse` is applied by the service. `intercept`, `beforeRemote` and `afterRemote` are executed by `SdHttpInterceptor`.

### Host matching

`SdApiHandler.hosts` entries are matched by **parsed origin plus segment-aware path prefix**, never by raw string prefix:

| Configured host | Matches | Does not match |
| --- | --- | --- |
| `'https://api.example.com'` | any path on that exact origin | `https://api.example.com.attacker.tld/x` |
| `'https://api.example.com/v1'` | `/v1`, `/v1/users` | `/v1beta/users`, `/public/ping` |
| `'/api'` (relative) | same-origin `/api`, `/api/users` | `/public/ping`, any cross-origin URL |

A raw `url.startsWith(host)` test made `https://api.example.com.attacker.tld/x` match a handler registered for `https://api.example.com`, so the lookalike host received that handler's `intercept` hook — including any credentials it attaches. Matching now parses both sides via the shared `sdMatchesSecureRoute` helper from `@sdcorejs/angular/utilities`.

Under SSR there is no `window.location`, so relative hosts and relative URLs are resolved against a fixed synthetic origin. Relative-to-relative matching stays consistent; absolute hosts still require a real origin match.

### `SdApiModule` (NgModule applications)

`SdApiModule` contributes **only** the `HTTP_INTERCEPTORS` entry for `SdHttpInterceptor`. It does not call `provideHttpClient(...)`; configuring Angular HTTP is the application's job.

```ts
@NgModule({
  imports: [SdApiModule],
  providers: [provideHttpClient(withInterceptorsFromDi())], // required — the library does not do this for you
})
export class AppModule {}
```

Standalone applications do not need the module — provide the interceptor directly:

```ts
providers: [
  provideHttpClient(withInterceptorsFromDi()),
  { provide: HTTP_INTERCEPTORS, useClass: SdHttpInterceptor, multi: true },
];
```

#### BREAKING: `imports: [SdApiModule]` alone is no longer enough

Earlier versions shipped `provideHttpClient(withInterceptorsFromDi())` inside the module's own providers, and the documented setup was just `imports: [SdApiModule]`. A library NgModule re-registering root HttpClient configuration silently overrode what the application had already declared, so an app using `provideHttpClient(withInterceptors([...]))` lost its own functional interceptors just by importing `SdApiModule` — hence the removal.

The removal has no compile-time signal: an application that followed the old guidance still builds, and only fails at runtime with `NullInjectorError: No provider for HttpClient` on the **first API call**, far from the misconfiguration. `SdApiModule` therefore asserts in its constructor: in dev mode, if `HttpClient` is not resolvable, it logs the exact provider you are missing.

```
[sd-api] SdApiModule không còn tự cấu hình HttpClient. Thêm
`provideHttpClient(withInterceptorsFromDi())` vào providers của application
(app.config.ts hoặc AppModule) — nếu không, lời gọi API đầu tiên sẽ ném
`NullInjectorError: No provider for HttpClient`.
```

The message is exported as `SD_API_MISSING_HTTP_CLIENT_MESSAGE`. The check is dev-mode only (a production build never pays for it) and logs rather than throws, so a legitimate setup that provides `HttpClient` in a child injector or a bespoke test harness is not blocked.

**Migration:**

```diff
 @NgModule({
   imports: [SdApiModule],
+  providers: [provideHttpClient(withInterceptorsFromDi())],
 })
 export class AppModule {}
```

`withInterceptorsFromDi()` is the part that makes the module's `HTTP_INTERCEPTORS` contribution take effect. `provideHttpClient()` on its own registers `HttpClient` but ignores every DI-registered class interceptor, including `SdHttpInterceptor`.

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

## Migration from pre-1.5 behavior

- `{ ok: false }` responses now reject with `SdApiError`. Read the payload from `error.body`.
- Handler `hosts` are matched by origin + path segment. A host entry that relied on loose string-prefix matching (for example `'https://api.example'` intended to cover `https://api.example.com`) no longer matches; list each origin explicitly.
- `SdApiModule` no longer provides `HttpClient`. Add `provideHttpClient(withInterceptorsFromDi())` to the application if it was relying on the module for it — see [BREAKING: `imports: [SdApiModule]` alone is no longer enough](#breaking-imports-sdapimodule-alone-is-no-longer-enough). A dev-mode console assertion names the missing provider at module construction.
- Persistent cache entries written by an earlier version will not be read back — the key derivation changed. Entries simply miss once and are rewritten.
- A request whose contract cannot be canonicalized now skips cache and dedupe instead of receiving a unique per-call key. Behaviour is unchanged for callers; only the stray persistent-storage writes are gone.

Focused coverage lives in `api.service.spec.ts`, `api.module.spec.ts` and `interceptors/api.interceptor.spec.ts`.
