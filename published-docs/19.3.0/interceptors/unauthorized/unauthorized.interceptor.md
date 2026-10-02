# `SdUnauthorizedInterceptor`

**Type**: HttpInterceptor (Angular `HttpInterceptor` class-based, multi-provider)
**Class**: `SdUnauthorizedInterceptor implements HttpInterceptor`
**Import path**: `@sdcorejs/angular/interceptors` — single entry point. There is NO `…/unauthorized` secondary entry point: the `interceptors/` folder has one `index.ts` + `ng-package.json` that barrel-exports both `SdUnauthorizedInterceptor` and `SdNoInternetInterceptor`. Always import from `@sdcorejs/angular/interceptors`.
**Provided in**: NOT provided by default — register via `HTTP_INTERCEPTORS` multi-provider
**Dependencies**: `SdAuthService`

## One-line purpose
Centralizes unauthorized handling for all HTTP calls: when a request fails with `401`, trigger `authService.signout()` once to kick off the app's signout/redirect-to-login flow, then rethrow the original error so feature-level handlers still work as usual.

## When to use
- Wire it in every Angular SPA built with `@sdcorejs/angular` that uses token-based authentication, so expired/revoked sessions are automatically signed out without per-screen 401 handling
- Useful when multiple parallel API calls may return `401` simultaneously — the debounce window ensures `signout()` fires once per burst regardless of concurrency

## Behavior
Pipes every outgoing request through `next.handle(...)` and inspects errors only:

- **Any successful response (`HttpResponse`)**: passes through untouched. It does NOT clear the signout latch — see below.
- **`error.status === 401`**:
  1. Checks the latch: has a signout already been triggered inside the debounce window?
  2. If not, records the current timestamp and calls `authService.signout()` (delegates actual signout + redirect behavior to your auth configuration)
  3. Re-throws the original HTTP error
- **Any other status** (`400`, `403`, `404`, `500`, ...):
  - Does nothing special
  - Re-throws untouched

### Signout latch

State held on the singleton instance: `#lastSignoutAt` (timestamp, or `null`). The latch closes for a **3-second debounce window** and reopens **only when that window elapses** — time is the single reopening condition.

This keeps the original benefit — many parallel requests failing with `401` at the same moment trigger exactly one `signout()` — without the two failure modes of the previous permanent boolean:

- **Session expiry after re-login was ignored.** The old flag was set on the first `401` and never reset, so every later `401` in the page lifetime did nothing. A user who signed back in and then hit an expired session again was never signed out. With a 3 s window the latch reopens by itself, so a later expiry is handled.
- **A missing `action.signout` burned the latch for nothing.** `SdAuthService.signout()` is a no-op when `SD_AUTH_CONFIGURATION.action.signout` is not configured, so the first `401` consumed the one-shot guard while performing no signout at all — and silenced every `401` afterwards.

**A successful response does NOT reopen the latch.** An earlier revision reset `#lastSignoutAt` on every `HttpResponse`, on the theory that a `2xx` proves the session is alive. It does not: public endpoints answer `2xx` with no valid token at all. In the exact burst the latch exists for — parallel requests where some hit public endpoints and return `2xx` while others return `401` — every interleaved `200` reopened the latch and the next `401` fired `signout()` again, once per interleaving. The debounce window is therefore purely time-based.

## Setup

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SdUnauthorizedInterceptor } from '@sdcorejs/angular/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: SdUnauthorizedInterceptor, multi: true },
  ],
};
```

To complete the flow, configure signout in auth config:

```ts
action: {
  signout: async () => {
    // clear token/session
    // navigate to login
  },
}
```

## Anti-patterns
- Do NOT swallow re-thrown errors in features that still need to show per-screen messages.
- Do NOT register this interceptor multiple times (root + feature) because duplicate instances can trigger duplicate signout actions.
- Do NOT put this interceptor after interceptors that fully consume/replace `401` errors; otherwise unauthorized handling may never execute.
- Do NOT assume this interceptor itself performs navigation. Navigation should remain in `SdAuthService` + auth configuration (`action.signout`).
- Do NOT rely on it to sign the user out when `SD_AUTH_CONFIGURATION.action.signout` is missing — the interceptor calls `SdAuthService.signout()`, which does nothing without that configuration. Configure the action; the interceptor only decides *when*.
- Do NOT make `action.signout` take longer than a few seconds. The latch reopens after 3 s, so a slower flow can be triggered twice by a second `401`; keep it idempotent.
- Do NOT use the modern `withInterceptors([...])` functional form to register this — it is a class-based interceptor that depends on constructor DI; use `withInterceptorsFromDi()` + `HTTP_INTERCEPTORS` multi-provider as shown in the Setup section above.

## Related
- `SdAuthService.signout()` — invoked on first `401`
- `ISdAuthConfiguration.action.signout` — app-specific logout + redirect logic
- `SdNoInternetInterceptor` — complementary resilience interceptor for offline/`503` cases
