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
- Useful when multiple parallel API calls may return `401` simultaneously — the built-in `#unauthorizedHandled` guard ensures `signout()` fires exactly once regardless of concurrency

## Behavior
Pipes every outgoing request through `next.handle(...)` and inspects errors:

- **`error.status === 401`**:
  1. Checks internal guard flag `#unauthorizedHandled`
  2. If not handled yet, sets `#unauthorizedHandled = true`
  3. Calls `authService.signout()` (delegates actual signout + redirect behavior to your auth configuration)
  4. Re-throws the original HTTP error
- **Any other status** (`400`, `403`, `404`, `500`, ...):
  - Does nothing special
  - Re-throws untouched

State held on the singleton instance: `#unauthorizedHandled`.
This prevents duplicate signout triggers when many parallel requests return `401` at the same time.

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
- Do NOT use the modern `withInterceptors([...])` functional form to register this — it is a class-based interceptor that depends on constructor DI; use `withInterceptorsFromDi()` + `HTTP_INTERCEPTORS` multi-provider as shown in the Setup section above.

## Related
- `SdAuthService.signout()` — invoked on first `401`
- `ISdAuthConfiguration.action.signout` — app-specific logout + redirect logic
- `SdNoInternetInterceptor` — complementary resilience interceptor for offline/`503` cases
