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
3. If matched: logs a `console.warn`, then shows a native `window.confirm` dialog whose text is
   composed via `I18nService.t()` using keys `core.handler.global-error.update-title` and
   `core.handler.global-error.update-body`. On OK → `window.location.reload()`.
4. If NOT matched: `console.error('Application error:', error)` and the error continues to propagate normally for devtools.

The handler has a single DI dependency (`I18nService`) for localising the confirm dialog text.
It has no constructor parameters and no side-effects beyond the warn log, the confirm dialog, and the optional reload.

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
- Do NOT swallow errors — the non-chunk branch deliberately re-logs to `console.error` so devtools still surface stack traces.
- Do NOT replace the `confirm()` with a silent `location.reload()` — silent reloads create infinite loops if the error is actually a server-side 404 on the chunk file.
- Do NOT register inside a feature module's providers — `ErrorHandler` is a root-singleton DI token; only the root `ApplicationConfig` / `AppModule` should provide it.

## Related
- `SdNoInternetInterceptor` — sibling resilience layer for HTTP failures (status 0 / 503)
- `SD_CORE_CONFIGURATION` — root config token; usually provided alongside this handler in `app.config.ts`
