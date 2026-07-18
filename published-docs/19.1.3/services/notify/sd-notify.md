# SdNotifyService

**Type**: Service (Angular `@Injectable`)
**Class**: `SdNotifyService`
**Provided in**: `'root'`
**Import path**: `@sdcorejs/angular/services/notify`

## One-line purpose
Toast notification service that auto-mounts a `SdToastContainerComponent` on `body` and exposes immediate (`success`, `info`) and debounced/buffered (`warning`, `error`) APIs backed by an Angular `signal<ToastData[]>`.

## When to use
- Standard user feedback after an action: success ("Saved"), info ("Email sent"), warning, error.
- High-frequency error/warning sources (validation, network failures) — `error()` and `warning()` debounce by 500 ms and group repeats into a single toast with a count, preventing toast spam.
- When you want a single visual surface for messages across the entire app — the container is created once at service construction.

## When NOT to use
- For modal/blocking confirmations — use `SdConfirmService` instead.
- For inline form validation messages — bind directly to the form state.
- For long-running progress — toasts auto-dismiss; render a dedicated progress UI.

## Public API

### `success(message, option?): void`
Immediate toast. Default duration 3000 ms.

```typescript
success(message: string, option?: SdNotifyOption): void;
```

### `info(message, option?): void`
Immediate toast. Default duration 3000 ms.

```typescript
info(message: string, option?: SdNotifyOption): void;
```

### `warning(message, option?): void`
Buffered toast. Multiple calls within 500 ms are deduped (Set) and flushed as one toast titled `"Warning (N)"` when N > 1. Default duration 5000 ms.

```typescript
warning(message: string | string[], option?: SdNotifyOption): void;
```

### `error(message, option?): void`
Buffered toast. Same buffering as `warning`; title `"Error (N)"`. Default duration 5000 ms.

```typescript
error(message: string | string[], option?: SdNotifyOption): void;
```

### `remove(id: string): void`
Removes a single toast by its generated id.

```typescript
remove(id: string): void;
```

### `clearAll(): void`
Clears the toast list and pending buffer timers.

```typescript
clearAll(): void;
```

### `clearByType(type: ToastType): void`
Removes all toasts of one type.

```typescript
clearByType(type: 'success' | 'info' | 'warning' | 'error'): void;
```

### `toasts: Signal<ToastData[]>`
Read-only signal of currently visible toasts (newest first). Useful if you build a custom container.

## Configuration / DI tokens
None. The container is created automatically via `createComponent(SdToastContainerComponent, ...)` and appended to `document.body` in the constructor.

### `SdNotifyOption`
```typescript
export interface SdNotifyOption {
  duration?: number;          // ms; defaults: 3000 (success/info), 5000 (warning/error)
  title?: string;             // toast title (warning/error get auto-suffix " (N)" if buffered)
  actionLabel?: string;       // optional CTA button text
  onAction?: () => void;      // CTA click handler (app-authored — NOT untrusted input)
  html?: boolean;             // render message as sanitized HTML (default false = safe text)
}

export interface ToastData {
  id: string;                 // generated UUID
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string | string[]; // array when buffer flushed > 1 unique message
  duration: number;
  actionLabel?: string;
  onAction?: () => void;
  html?: boolean;
}
```

## Behavior notes
- **Auto-mount**: the constructor creates `SdToastContainerComponent` once and appends it to `document.body`. Importing the service into any consumer triggers this — the container is global.
- **Max visible**: 5 toasts (`#MAX_TOASTS`). Newer toasts push older ones out (slice(0, 5) after unshift).
- **Order**: newest first (prepended to the array).
- **Debounce window**: 500 ms (`#DEBOUNCE_TIME`) for `warning` / `error`. Each new call resets the timer.
- **Dedup in buffer**: messages are deduplicated via `Set` per type before flushing. Two identical errors fired within 500 ms collapse to one.
- **Multi-message body**: when the buffer flushes more than one unique message, `ToastData.message` is the `string[]` array (the container component renders them as a list).
- **Title behavior**:
  - Immediate (`success`/`info`): uses `option.title` verbatim if provided.
  - Buffered (`warning`/`error`): default title is `'Warning'` / `'Error'`; if N > 1, suffix `" (N)"` is appended.
- **Position / styling**: rendered by `SdToastContainerComponent` — not configurable through the service API. Override the component's CSS to change position/animation.
- **`actionLabel` + `onAction`**: passed through to the toast; the container calls `onAction()` on click. `onAction` is an **app-authored callback** (the consuming app writes it) — it is not untrusted/attacker input. Don't build it from untrusted data.
- **Message rendering (XSS-safe by default)**: `message` is rendered as **plain text** (auto-escaped via Angular interpolation) by default — safe for any string, including user-derived content. Pass `html: true` only for **trusted, developer-authored markup**; in that mode the message is rendered via `[innerHTML]` after an explicit `DomSanitizer.sanitize(SecurityContext.HTML, …)` pass (strips `<script>`, `on*` handlers, `javascript:` URLs — no JS execution). **Never** put user-supplied content in an `html: true` toast.
  ```typescript
  notify.success('Đã lưu <b>hồ sơ #123</b>', { html: true });   // trusted markup → bold renders
  notify.error(userInput);                                        // default text → safe, escaped
  ```

## E2E hooks (data-* attributes)

Each rendered toast (`ToastComponent`, selector `toast`) exposes attributes on its host so `<sd-autoid-inspector>` and E2E suites can read the toast kind + content without scraping inner markup:

| Attribute | Value | Source |
|---|---|---|
| `data-autoid` | `services-notify-toast-<type>` (e.g. `services-notify-toast-success`) | `type` |
| `data-type` | `success` / `info` / `warning` / `error` | `type` |
| `data-title` | the custom title, or absent when none | `title` |
| `data-message` | the message; array messages joined with `" | "` | `message` |

The inspector surfaces these as `state.type` / `state.title` / `state.message` in its JSON export. Select a toast by kind:

```ts
// Playwright — assert a success toast appeared
await expect(page.locator('[data-autoid="services-notify-toast-success"]')).toBeVisible();
```

> Multiple toasts of the same type share the same `data-autoid` (flagged `duplicate` by the inspector) — scope by `data-message` / order if you need a specific one.

## Examples

### 1. Success after save
```typescript
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { inject } from '@angular/core';

class EditorPage {
  private notify = inject(SdNotifyService);
  async save() {
    await this.api.post('/api/save', this.form.value);
    this.notify.success('Saved successfully');
  }
}
```

### 2. Buffered errors during bulk validation
```typescript
for (const row of invalidRows) {
  this.notify.error(`Row ${row.id}: ${row.reason}`);
}
// 500 ms later: a single toast titled "Error (N)" with all unique messages.
```

### 3. Toast with action button
```typescript
this.notify.info('File uploaded', {
  duration: 8000,
  actionLabel: 'Open',
  onAction: () => this.router.navigate(['/files', id]),
});
```

### 4. Programmatic dismissal
```typescript
this.notify.clearByType('warning');   // clear all warning toasts
// or
this.notify.clearAll();               // wipe all + cancel pending buffers
```

## Testing

### In unit / integration tests

`SdNotifyService` calls `createComponent(SdToastContainerComponent, ...)` in its constructor and appends the resulting DOM node to `document.body`. This side effect must be neutralised before `TestBed.inject()` so that:
- No real Angular view is registered with `ApplicationRef`, and
- No extra DOM node is attached to the test document's `<body>`.

The recommended pattern is to spy on `document.body.appendChild` and on `ApplicationRef.attachView` **before** the service is constructed:

```typescript
import { ApplicationRef } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SdNotifyService } from './notify.service';

describe('SdNotifyService', () => {
  let service: SdNotifyService;

  beforeEach(() => {
    spyOn(document.body, 'appendChild').and.stub();

    TestBed.configureTestingModule({
      providers: [SdNotifyService],
    });

    spyOn(TestBed.inject(ApplicationRef), 'attachView').and.stub();
    service = TestBed.inject(SdNotifyService);
  });

  afterEach(() => service.clearAll()); // cancel pending debounce timers
});
```

Key points:
- **Do NOT provide a fake `DOCUMENT`** — Angular's renderer reads `DOCUMENT` for `createElement`. Replacing it entirely breaks the DI hierarchy.
- **`fakeAsync` + `tick(500)`** is required to test buffered (`warning` / `error`) behavior.
- `service.clearAll()` in `afterEach` cancels any pending `setTimeout` so debounce timers do not bleed into subsequent tests.

### Spec file
`projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts`

Covers (25 specs total):
- Instantiation: created, `body.appendChild` called, initial empty signal
- `success()`: immediate add, default 3000 ms duration, custom duration, title passthrough
- `info()`: immediate add, default 3000 ms duration
- `error()` (buffered): single flush after 500 ms, default 5000 ms duration, grouping with count title, dedup of identical messages, debounce timer reset
- `warning()` (buffered): single flush after 500 ms, array input with all messages
- `remove()`: by id, unknown id no-op
- `clearAll()`: empties array, cancels pending timers
- `clearByType()`: removes only target type
- MAX_TOASTS cap: capped at 5, newest first
- `actionLabel` + `onAction` passthrough
- Signal reactivity

## Anti-patterns
- Do NOT call `error()` in tight render loops — even with debouncing, the buffer grows until flush. Filter at the source.
- Do NOT pass an array to `success()` / `info()` — only `warning` and `error` accept `string | string[]`.
- Do NOT mount `SdToastContainerComponent` yourself — the service already does. A second container will produce duplicate toasts.
- Do NOT depend on toast id format (`Utilities.generateUuid()`) — treat it as opaque and only use `remove(id)`.
- Do NOT use this for blocking confirmations (`Are you sure?`) — toasts dismiss themselves; use `SdConfirmService`.

## Related
- `SdConfirmService` (`@sdcorejs/angular/services/confirm`) — modal alternative for blocking interactions.
- `SdToastContainerComponent` (`@sdcorejs/angular/services/notify/components`) — the rendered host. Customize via global CSS.
- `Utilities.generateUuid` (`@sdcorejs/utils/fns`) — used internally for toast ids.
