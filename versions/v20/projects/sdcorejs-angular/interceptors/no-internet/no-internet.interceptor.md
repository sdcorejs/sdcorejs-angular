�# `SdNoInternetInterceptor`

**Type**: HttpInterceptor (Angular `HttpInterceptor` class-based, multi-provider)
**Class**: `SdNoInternetInterceptor implements HttpInterceptor`
**Import path**: `@sdcorejs/angular/interceptors/no-internet` (or barrel `@sdcorejs/angular/interceptors`)
**Provided in**: NOT provided by default � register via `HTTP_INTERCEPTORS` multi-provider
**Dependencies**: `MatSnackBar` (Angular Material), `I18nService` (`@sdcorejs/angular/i18n`), `HttpClient` (lazy, resolved via `Injector` to avoid circular DI), `Injector` (Angular core)

## When to use
- Wire it in every Angular SPA built with `@sdcorejs/angular` that makes HTTP calls to remote APIs, so users get a clear offline notification instead of silent failure
- Useful when requests fail intermittently in low-connectivity environments (mobile, flaky wifi) � the interceptor distinguishes real offline from CORS/SSL/server-block before showing any notification
- Pair with `SdUnauthorizedInterceptor` to cover all resilience scenarios: offline, CORS, 503, and 401

## One-line purpose
Detects loss of internet connectivity on outgoing HTTP calls (status `0`) and shows a sticky snackbar that polls a public endpoint every 3 s until the connection comes back, while disambiguating real "no internet" from CORS/SSL/server-block (which look identical to the browser). Also surfaces a friendly snackbar for `503` server-maintenance responses.

## Behavior
Pipes every outgoing request through `next.handle(...)` and inspects errors:

- **`error.status === 0` (first time only � guarded by `#isOffline` flag)**:
  1. Sets `#isOffline = true`
  2. Lazy-resolves `HttpClient` from the `Injector` (avoids `HTTP_INTERCEPTORS` circular DI)
  3. Pings `https://jsonplaceholder.typicode.com/todos/1`
     - If ping ALSO fails �  genuine offline. Shows a sticky snackbar (i18n key `core.interceptor.no-internet.offline`) with a `core.common.reload` action button, then starts polling the same endpoint every 3 s. When polling succeeds �  snackbar updates to i18n key `core.interceptor.no-internet.restored` (auto-dismiss 5 s) and `#isOffline` resets.
     - If ping SUCCEEDS �  it was a CORS/SSL/server-block error, NOT real offline. Shows a 5-s snackbar (i18n key `core.interceptor.no-internet.cors-error`) with a `core.common.close` action and resets `#isOffline`.
  4. Re-throws the original error so the caller still sees the failure.
- **`error.status === 503`**: Shows a 5-s snackbar (i18n key `core.interceptor.no-internet.maintenance`, action `core.common.close`) and re-throws.
- **Any other status** (`401`, `404`, `500`, ...): Re-throws untouched � caller handles normally.

State held on the singleton instance: `#isOffline`, `#snackBarRef`, `#pollInterval`, `#http`. Polling interval is cleared on recovery via `#stopPolling`.

The "Tải lại trang" snackbar action calls `window.location.reload()`.

## Setup

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SdNoInternetInterceptor } from '@sdcorejs/angular/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: SdNoInternetInterceptor, multi: true },
    // ... other providers (must include MatSnackBarModule providers, normally already done by Material setup)
  ],
};
```

## Anti-patterns
- Do NOT register it twice (e.g. once per feature module) � the singleton holds connection state, multiple instances will show duplicate snackbars and start duplicate poll loops.
- Do NOT change the health-check URL to your own API � if your API is the thing that's down, the interceptor will mis-classify a real outage as "offline". The current `jsonplaceholder` endpoint is third-party-public on purpose.
- Do NOT swallow the re-thrown error in your component � the interceptor only handles the UX; component-level error handling (form revert, retry button, etc.) is still needed.
- Do NOT use the modern `withInterceptors([...])` functional form to register this � it's a class-based interceptor and depends on constructor DI; use `withInterceptorsFromDi()` + `HTTP_INTERCEPTORS` multi-provider as shown.

## Related
- `SdGlobalErrorHandler` � sibling resilience layer for chunk-load errors after redeploy
- `SdUnauthorizedInterceptor` � complementary interceptor handling `401` / signout
- `MatSnackBar` � required peer; must be available in DI (Angular Material setup)
- `I18nService` � drives all user-visible strings via i18n keys (see keys above)
- `SD_CORE_CONFIGURATION` � root config; commonly provided alongside in `app.config.ts`
- `no-internet.interceptor.spec.ts` � Jasmine/Karma unit test suite (17 specs)

