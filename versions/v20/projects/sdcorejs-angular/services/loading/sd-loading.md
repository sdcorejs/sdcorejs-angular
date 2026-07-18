# SdLoadingService

**Type**: Service (Angular `@Injectable`)
**Class**: `SdLoadingService`
**Provided in**: `'root'`
**Import path**: `@sdcorejs/angular/services/loading`

## One-line purpose
Imperatively attaches/detaches a full-cover spinner overlay to any DOM element (default `body`) by selector — uses Angular `Renderer2` and tracks per-element state via a `WeakMap`.

## When to use
- Show a global busy state during a route load, long task, or non-Observable async work.
- Block a specific panel/dialog only — pass a CSS selector to `start()` so only that element is masked.
- Imperative scenarios where `*ngIf="loading$ | async"` is awkward (e.g. service-layer code, interceptors, third-party callbacks).

## When NOT to use
- For per-button inline spinners — use the component-local loading state instead.
- For automatic HTTP loading — wire a `HttpInterceptor` that toggles `start/stop` for you (this service exposes no built-in interceptor).
- For nested concurrent operations on the same element — there is **no ref counting**. A second `start()` on an element that already has an overlay is a no-op, and a single `stop()` removes the overlay even if other callers still expect it to show. Use a counter pattern in calling code if needed.

## Public API

### `start(element?: string): void`
Creates and appends a full-cover spinner overlay to **every** DOM element matching `element` (CSS selector via `querySelectorAll`). No-op for hosts that already have an overlay, or when no element matches.

```typescript
start(element?: string): void
```

**Parameters**:
- `element` (`string`, optional, default `'body'`): CSS selector passed to `document.querySelectorAll`.

**Returns**: `void`

### `stop(element?: string): void`
Removes the overlay previously attached to **every** matched element. No-op for hosts without an overlay, or when no element matches the selector.

```typescript
stop(element?: string): void
```

**Parameters**:
- `element` (`string`, optional, default `'body'`): CSS selector of the target elements whose overlays should be removed.

**Returns**: `void`

### `isLoading(element?: string): Element | null | false`
Returns truthy when **any** matched element currently has an active overlay; falsy otherwise. Specifically returns the first loading `Element` if found, `false` if matches exist but none are loading, and `null` if no element matches the selector.

```typescript
isLoading(element?: string): Element | null | false
```

**Parameters**:
- `element` (`string`, optional, default `'body'`): CSS selector of the elements to check.

**Returns**: Truthy (`Element`) when at least one match has an overlay; falsy (`null` or `false`) otherwise.

## Configuration / DI tokens
None. The service has no external configuration.

## Behavior notes
- **Multi-match selectors**: `start` / `stop` / `isLoading` use `document.querySelectorAll`. When several hosts share a selector (e.g. router tabs that keep duplicate panel roots in the DOM), every match gets or clears an overlay together. Loading for a given selector is still one shared busy flag (`providedIn: 'root'`); the service mirrors that flag onto all current matches.
- **Tracking**: an internal `WeakMap<Element, HTMLElement>` maps target element → overlay node. Garbage-collected automatically when the target leaves the DOM.
- **No ref counting**: `start()` twice + `stop()` once = overlay gone. If you need balanced calls, wrap with a counter:
  ```typescript
  if (++count === 1) loading.start();
  if (--count === 0) loading.stop();
  ```
- **Overlay markup**: a `div.sd-loading` with inline styles (`position:absolute; inset:0; opacity:0.6; background:#FFFFFF; z-index:99999`) and a child `div.sd-loading-spinner` (5rem rotating ring using `var(--sd-primary)`).
- **Side effect**: a `<style>` tag containing the `@keyframes spin` rule is appended to `document.head` every time `start()` runs. (Repeated calls duplicate the style tag — harmless, but worth knowing.)
- **Positioning**: the overlay uses `position: absolute` so the target element must be a positioning context (`position: relative` or other) to stay inside it; otherwise it covers the document. `body` works because it sizes the viewport.
- **`element` ID**: every overlay gets the same id `L8d556b9b-f6dd-46e9-9710-757e65d82839`. If multiple overlays exist on different targets, the document has duplicate ids — avoid querying by id.

## Examples

### 1. Global spinner for the whole page
```typescript
import { SdLoadingService } from '@sdcorejs/angular/services/loading';
import { inject } from '@angular/core';

class AppShell {
  private loading = inject(SdLoadingService);
  async bootstrap() {
    this.loading.start();         // covers <body>
    try { await this.loadInitialData(); }
    finally { this.loading.stop(); }
  }
}
```

### 2. Mask only a specific panel
```typescript
this.loading.start('#editor-panel');   // panel must be position: relative
try { await this.api.post('/api/save', dto); }
finally { this.loading.stop('#editor-panel'); }
```

### 3. Multi-host selector (e.g. router tabs)
When several panels share a class (or other selector) and stay in the DOM at once, one `start` / `stop` updates **all** matches:

```typescript
this.loading.start('.tab-panel');
try { await this.loadActiveTab(); }
finally { this.loading.stop('.tab-panel'); }
```

### 4. Ref-counted wrapper
```typescript
class LoadingCounter {
  private count = 0;
  constructor(private loading: SdLoadingService) {}
  begin() { if (++this.count === 1) this.loading.start(); }
  end()   { if (--this.count === 0) this.loading.stop();  }
}
```

### 5. Use in an HTTP interceptor
```typescript
@Injectable()
class LoadingInterceptor implements HttpInterceptor {
  constructor(private loading: SdLoadingService) {}
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    this.loading.start();
    return next.handle(req).pipe(finalize(() => this.loading.stop()));
  }
}
```

## Anti-patterns
- Do NOT call `stop()` from a timeout/then handler that may run before `start()` paints — there's no queue; you'll just no-op and leak the overlay if `start()` runs after.
- Do NOT rely on the overlay's id (`L8d556b9b-...`) — it's the same on every instance.
- Do NOT use this on transient elements (rendered then removed by `*ngIf`) — the overlay is removed with the parent, but the `WeakMap` entry stays until GC. Stop before destroying the element.
- Do NOT expect ref counting — wrap if your code path can re-enter (concurrent saves, parallel fetches).

## Related
- `SdNotifyService` (`@sdcorejs/angular/services/notify`) — pair with toasts to confirm completion of the loaded operation.
- Angular `HttpInterceptor` — the canonical place to call `start`/`stop` for global request loading.
