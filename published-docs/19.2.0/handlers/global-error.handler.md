# `SdGlobalErrorHandler`

**Type**: ErrorHandler (Angular `ErrorHandler` implementation)
**Class**: `SdGlobalErrorHandler implements ErrorHandler`
**Import path**: `@sdcorejs/angular/handlers`
**Provided in**: NOT provided by default — consumer app must wire it via `providers` in `app.config.ts`

## One-line purpose
Catches uncaught application errors at the Angular root and, when the error is a chunk-load / dynamic-import failure (typical after a new build is deployed while the user has the old SPA cached), prompts the user to reload the page so they pick up the new bundle. All other errors fall through to `console.error`.

## When to use
- Wire it in every Angular SPA built with `@sdcorejs/angular` so users are not left staring at a broken page after a fresh deploy
- Especially useful for apps using lazy-loaded routes / dynamic `import()` (Angular 17+ esbuild/Vite, lazy modules, dynamic component loading)

## Behavior
The handler implements `handleError(error: any)` and runs:

1. Extracts a lowercase error message via a private `#extractErrorMessage` helper. The helper handles three shapes:
   - plain string error
   - `Error`-like object with `.message`
   - rejection wrapper (`{ rejection: ... }`) emitted by Angular for unhandled promise rejections
2. Matches the message against a list of chunk-load signatures:
   - `Loading chunk` (Webpack)
   - `Importing a module script failed` (some browsers)
   - `Failed to fetch dynamically imported module` (Angular esbuild/Vite — most common today)
   - `error loading dynamically imported module` (Firefox/Safari variants)
   - `missing source map`
3. If matched: logs a `console.warn` (dev mode only), then — **on the browser platform only** — shows a
   native `window.confirm` dialog whose text is composed via `I18nService.t()` using keys
   `core.handler.global-error.update-title` and `core.handler.global-error.update-body`.
   On OK → `window.location.reload()`.
4. If NOT matched: `console.error('Application error:', error)` — **always, dev and production** — and the error continues to propagate normally for devtools.

DI dependencies: `I18nService` (localises the confirm dialog text) and `PLATFORM_ID` (platform detection).
It has no constructor parameters and no side-effects beyond the log, the confirm dialog, and the optional reload.

### SSR safety

`window.confirm` and `window.location.reload` run only when `isPlatformBrowser(inject(PLATFORM_ID))` is true. On the server the chunk branch classifies and logs, then returns.

Calling those browser APIs unguarded meant the handler itself threw during server rendering — and an `ErrorHandler` that throws masks the original error completely, which is the worst possible failure for a diagnostic component.

### What `isDevMode()` gates — and what it must never gate

| Log | Gated behind `isDevMode()`? | Why |
| --- | --- | --- |
| `console.warn('=> Chunk Load error detected:', …)` | **Yes** | Verbose developer diagnostics that dumps the raw lowercased message. The chunk branch already has a user-facing outcome (the reload confirm dialog), so silencing the dump in production loses nothing. |
| `console.error('Application error:', error)` | **No — unconditional** | Providing this class replaces Angular's default `ErrorHandler`, whose entire job is to log. Gating it makes a production build swallow every non-chunk application error: nothing in the console, nothing for browser-side log collectors, production bugs invisible. |

An app that genuinely wants silence in production should provide its own `ErrorHandler` — that is an application decision, not a library default.

Note that unconditional `console.error` is a floor, not a telemetry strategy: attach a real reporter (Sentry, Datadog, …) alongside this handler for production monitoring.

## Setup

```ts
// app.config.ts
import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { SdGlobalErrorHandler } from '@sdcorejs/angular/handlers';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: ErrorHandler, useClass: SdGlobalErrorHandler },
    // ... other providers
  ],
};
```

## Anti-patterns
- Do NOT subclass it just to add a Sentry/Datadog hook — wrap it instead, or call your reporter from a sibling provider so the chunk-reload UX is preserved.
- Do NOT swallow errors — the non-chunk branch deliberately re-logs to `console.error` in every build so devtools still surface stack traces. Putting that call behind `isDevMode()` (or removing it) turns a production `ErrorHandler` into a black hole, because registering this class already replaced Angular's default logging handler.
- Do NOT rely on `console.error` alone for production diagnostics — it keeps errors visible, but attach a real reporter (Sentry, Datadog, …) for anything you need to monitor off-device.
- Do NOT replace the `confirm()` with a silent `location.reload()` — silent reloads create infinite loops if the error is actually a server-side 404 on the chunk file.
- Do NOT register inside a feature module's providers — `ErrorHandler` is a root-singleton DI token; only the root `ApplicationConfig` / `AppModule` should provide it.

## Related
- `SdNoInternetInterceptor` — sibling resilience layer for HTTP failures (status 0 / 503)
- `SD_CORE_CONFIGURATION` — root config token; usually provided alongside this handler in `app.config.ts`
