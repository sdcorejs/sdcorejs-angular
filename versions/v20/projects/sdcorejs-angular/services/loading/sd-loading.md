# `SdLoadingService`

**Type:** root injectable browser presentation service
**Import path:** `@sdcorejs/angular/services/loading`

`SdLoadingService` places one accessible overlay on every host matched by a selector while reference-counting concurrent owners.

## Preferred handle API

```ts
interface SdLoadingRef {
  readonly closed: boolean;
  close(): void;
}

const ref = loading.start('#editor');
try {
  await save();
} finally {
  ref.close();
}
```

Each `start()` owns exactly the hosts matched at that moment. Closing a ref is idempotent. The overlay remains until every contribution for that host closes, so overlapping and out-of-order work cannot hide another task's loading state.

## `run()`

`run(task, selector?)` scopes the overlay to a synchronous value, promise-like value or task factory and always closes its ref without replacing the task result/error.

```ts
const result = await loading.run(() => api.get<Result>('/api/result'), '#result-panel');
```

## Compatibility methods

```ts
start(selector = 'body'): SdLoadingRef;
stop(selector = 'body'): void;
isLoading(selector = 'body'): Element | false | null;
```

`stop()` releases the oldest open `start()` with the exact selector. It also contains a current-host fallback for legacy code that used different selectors between start and stop. New code should retain and close the returned ref.

`isLoading()` returns the first busy matched host, `false` when matches exist but are idle, and `null` when the selector is unavailable, no host matches, SSR is active, or the service is destroyed.

## Accessibility, styling and cleanup

- Busy hosts receive `aria-busy="true"`; their previous value is restored after the final owner closes.
- The overlay uses `role="status"`, `aria-live="polite"` and one spinner hidden from assistive technology.
- One shared `style[data-sd-loading-styles]` is maintained per document. The service adopts an existing consumer style element without deleting consumer-owned content.
- Removing/reparenting an overlay is repaired on the next acquisition.
- Injector teardown closes all owned refs, removes library-owned overlays/style content and clears bookkeeping.
- Overlay and stylesheet nodes are written with direct `DOCUMENT` DOM calls rather than `Renderer2`, so every detach is synchronous. Under `provideAnimations()` / `provideNoopAnimations()` the injected `Renderer2` routes `removeChild` through the animation engine, which only detaches the node on its next flush; a `close()` outside a change-detection cycle, or an injector teardown, has no such flush and would strand the overlay (`z-index: 99999`) and the `<style>` element in the document.

## SSR behavior

On the server, `start()` returns an already-closed ref, `stop()` is a no-op, `isLoading()` returns `null`, and `run()` still runs/awaits the supplied task. No DOM query or mutation occurs, and no renderer is created.

## Migration from pre-1.4 behavior

Existing balanced `start()` / `stop()` calls remain valid. For concurrency safety, migrate new code to the returned handle or `run()`:

```diff
- loading.start('#panel');
+ const loadingRef = loading.start('#panel');
  try {
    await work();
  } finally {
-   loading.stop('#panel');
+   loadingRef.close();
  }
```

Focused coverage lives in `loading.service.spec.ts`.
