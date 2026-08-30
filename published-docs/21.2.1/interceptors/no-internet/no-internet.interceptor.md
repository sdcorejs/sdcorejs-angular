# `SdNoInternetInterceptor`

**Type**: HttpInterceptor (Angular `HttpInterceptor` class-based, multi-provider)
**Class**: `SdNoInternetInterceptor implements HttpInterceptor`
**Import path**: `@sdcorejs/angular/interceptors/no-internet` (or barrel `@sdcorejs/angular/interceptors`)
**Provided in**: NOT provided by default — register via `HTTP_INTERCEPTORS` multi-provider
**Dependencies**: `MatSnackBar` (Angular Material), `I18nService` (`@sdcorejs/angular/i18n`), `HttpBackend` (Angular common/http), `DestroyRef` (Angular core), `SD_NO_INTERNET_PROBE_URL`

## When to use
- Wire it in every Angular SPA built with `@sdcorejs/angular` that makes HTTP calls to remote APIs, so users get a clear offline notification instead of silent failure
- Useful when requests fail intermittently in low-connectivity environments (mobile, flaky wifi) — the interceptor distinguishes real offline from CORS/SSL/server-block before showing any notification
- Pair with `SdUnauthorizedInterceptor` to cover all resilience scenarios: offline, CORS, 503, and 401

## One-line purpose
Detects loss of internet connectivity on outgoing HTTP calls (status `0`) and shows a sticky snackbar that polls a connectivity probe every 3 s until the connection comes back, while disambiguating real "no internet" from CORS/SSL/server-block (which look identical to the browser). Also surfaces a friendly snackbar for `503` server-maintenance responses.

## Behavior
Pipes every outgoing request through `next.handle(...)` and inspects errors:

- **`error.status === 0` (first time only — guarded by `#isOffline` flag)**:
  1. Sets `#isOffline = true`
  2. Issues the connectivity probe (see below)
     - If the probe also fails to open a connection (its own status is `0`) → genuine offline. Shows a sticky snackbar (i18n key `core.interceptor.no-internet.offline`) with a `core.common.reload` action button, then starts polling the same probe every 3 s. When polling reports connectivity → snackbar updates to i18n key `core.interceptor.no-internet.restored` (auto-dismiss 5 s) and `#isOffline` resets.
     - If the probe reports connectivity — a `2xx`, **or any other HTTP status** — it was a CORS/SSL/server-block error, NOT real offline. Shows a 5-s snackbar (i18n key `core.interceptor.no-internet.cors-error`) with a `core.common.close` action and resets `#isOffline`.
  3. Re-throws the original error so the caller still sees the failure.
- **`error.status === 503`**: Shows a 5-s snackbar (i18n key `core.interceptor.no-internet.maintenance`, action `core.common.close`) and re-throws.
- **Any other status** (`401`, `404`, `500`, ...): Re-throws untouched — caller handles normally.

State held on the singleton instance: `#isOffline`, `#snackBarRef`, `#pollInterval`, `#pollSubscription`.

The "Tải lại trang" snackbar action calls `window.location.reload()`.

## Connectivity probe

`SD_NO_INTERNET_PROBE_URL: InjectionToken<string>` — default `'/favicon.ico'`.

```ts
import { SD_NO_INTERNET_PROBE_URL } from '@sdcorejs/angular/interceptors';

providers: [{ provide: SD_NO_INTERNET_PROBE_URL, useValue: '/assets/health.txt' }];
```

Properties of the probe request:

- **Same-origin by default.** Earlier versions hardcoded `https://jsonplaceholder.typicode.com/todos/1` with no override, so every consumer application pinged an unrelated third party every 3 s while offline.
- **Issued through `HttpBackend`, not `HttpClient`.** It therefore bypasses the application's interceptor chain entirely. When the probe went through the chain, any consumer interceptor attaching credentials unconditionally sent them to the probe target — off-origin token leakage for a third-party URL.
- `GET`, `responseType: 'text'`, with `Cache-Control: no-cache` and `Pragma: no-cache`. A probe served from the HTTP cache would report "online" while genuinely offline.

### How the probe result is classified

**Only `status === 0` counts as offline. Any HTTP status at all counts as online.**

`HttpBackend` raises an `HttpErrorResponse` for every non-`2xx` response, so "the probe errored" is not the same as "there is no network". Treating every probe error as a genuine outage mis-classified the very common `404` case — an app that deleted the Angular CLI's default `favicon.ico`, or a static host that answers `404`/`403` for unknown paths — as offline: sticky offline snackbar plus a 3 s poll loop that could never succeed, even though the `404` itself proves the connection is up. The probe therefore maps any `HttpErrorResponse` with `status !== 0` to "online" and only re-throws `status === 0`.

Point the token at a small static file that does not require authentication. Prefer something served by the same host as the SPA rather than the API being monitored: if the API itself is down, a probe against it mis-classifies a real outage as "offline". A probe URL that answers `404` is not fatal (it still proves connectivity), but a `2xx` is cheaper and clearer.

## Teardown

The interceptor registers `DestroyRef.onDestroy` and clears the poll interval plus any in-flight probe subscription when the injector is destroyed. Without it the 3 s timer and its HTTP calls outlived the application — a real leak for microfrontends and any test that tore down a `TestBed` while offline.

## Setup

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SD_NO_INTERNET_PROBE_URL, SdNoInternetInterceptor } from '@sdcorejs/angular/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: SdNoInternetInterceptor, multi: true },
    { provide: SD_NO_INTERNET_PROBE_URL, useValue: '/assets/health.txt' }, // optional — defaults to '/favicon.ico'
    // ... other providers (must include MatSnackBarModule providers, normally already done by Material setup)
  ],
};
```

## Anti-patterns
- Do NOT register it twice (e.g. once per feature module) — the singleton holds connection state, multiple instances will show duplicate snackbars and start duplicate poll loops.
- Do NOT point `SD_NO_INTERNET_PROBE_URL` at the API you are monitoring — if that API is the thing that's down, the interceptor mis-classifies a real outage as "offline".
- Do NOT point it at a third-party host. The probe fires every 3 s per offline client, and any URL outside your origin turns a connectivity check into an outbound signal you do not control.
- Do NOT point it at an authenticated endpoint. The probe deliberately skips the interceptor chain, so it carries no tokens and a protected URL would answer `401` — which the probe reads as "online" (correctly, but it tells you nothing about the API).
- Do NOT swallow the re-thrown error in your component — the interceptor only handles the UX; component-level error handling (form revert, retry button, etc.) is still needed.
- Do NOT use the modern `withInterceptors([...])` functional form to register this — it's a class-based interceptor and depends on constructor DI; use `withInterceptorsFromDi()` + `HTTP_INTERCEPTORS` multi-provider as shown.

## Related
- `SdGlobalErrorHandler` — sibling resilience layer for chunk-load errors after redeploy
- `SdUnauthorizedInterceptor` — complementary interceptor handling `401` / signout
- `MatSnackBar` — required peer; must be available in DI (Angular Material setup)
- `I18nService` — drives all user-visible strings via i18n keys (see keys above)
- `SD_CORE_CONFIGURATION` — root config; commonly provided alongside in `app.config.ts`
- `no-internet.interceptor.spec.ts` — Jasmine/Karma unit test suite (27 specs)
