# SdStorageService

**Type**: Service (Angular `@Injectable`)
**Class**: `SdStorageService`
**Provided in**: `'root'`
**Import path**: `@sdcorejs/angular/services/storage`

## One-line purpose
Reactive `localStorage` / `sessionStorage` wrapper that gives you a typed `SdStorage<T>` handle with `get / set / has / remove` plus a `BehaviorSubject` and `Observable` mirror, layered with an in-memory cache and pluggable key namespacing.

## When to use
- Persist a typed value (user preference, last route, draft form) and react to its changes via `subject` / `observer`.
- Share state across components without a full state library â€” multiple consumers calling `create(sameKey)` get the same `BehaviorSubject`.
- Need session-scoped persistence â€” pass `{ type: 'session' }` to use `sessionStorage`.
- Need namespacing â€” provide `SD_STORAGE_CONFIG` with a `key` rewriter (e.g. prefix with app version) to invalidate state on releases.

## When NOT to use
- For sensitive data (tokens, PII) â€” `localStorage` is plain text and accessible to any script on the origin.
- For very large blobs â€” Web Storage caps at ~5 MB and quota errors are logged but swallowed.
- When you need TTL/expiry â€” there is no built-in expiry. Combine with `SdCacheService` if you need it.
- For non-JSON-serializable values (functions, `Map`, `Set`, cyclic refs) â€” values are deep-cloned via `JSON.parse(JSON.stringify(...))`.

## Public API

### `create<T>(key, option?): SdStorage<T>`
Returns a typed handle bound to one storage key. Subsequent `create()` calls with the same effective key return the same underlying `BehaviorSubject` (handles share state).

```typescript
create<T = any>(key: string | object, option?: SdStorageOption<T>): SdStorage<T>;
```

**Parameters**:
- `key` (`string | object`): if string, used directly; if object, hashed via `Utilities.hash(key)`. Then optionally rewritten by `SD_STORAGE_CONFIG.key`.
- `option` (`SdStorageOption<T>`, optional):
  - `type?: 'session'` â€” use `sessionStorage` (default `localStorage`).
  - `default?: T` â€” value returned by `get()` and seeded on the subject when nothing is stored.

**Throws**: `'Key is required'` if `key` is falsy. `'Invalid key type'` for non-string/non-object.

**Returns** (`SdStorage<T>`):
```typescript
{
  get(): T;                           // reads value (or default)
  set(data: T): void;                 // writes to storage + memory + subject
  has(): boolean;                     // true if a value exists in storage
  remove(): void;                     // deletes storage entry; emits undefined
  destroy?(): void;                   // completes the subject and frees memory cache
  subject: BehaviorSubject<T>;
  observer: Observable<T>;            // pipe(map(() => get()))
}
```

## Configuration / DI tokens

### `SD_STORAGE_CONFIG` â€” `InjectionToken<ISdStorageConfiguration>`
Optional. Provide a global key rewriter for namespacing/versioning.

```typescript
export interface ISdStorageConfiguration {
  key?: (key: string) => string;   // e.g. k => `myapp-v3:${k}`
}

export const SD_STORAGE_CONFIG: InjectionToken<ISdStorageConfiguration>;
```

### `SdStorageOption<T>`
```typescript
export interface SdStorageOption<T = any> {
  type?: 'session';     // default: localStorage
  default?: T;
  args?: Record<string, any>;   // reserved
}
```

## Behavior notes
- **Read path**: memory `Map` first, then `Storage.getItem`. On `JSON.parse` failure the key is removed and `undefined` is returned.
- **Write path**: memory + `Storage.setItem`. Quota errors are caught and `console.error`-logged (no throw, but the in-memory copy is still updated).
- **Stored shape**: each value is wrapped as `{ data, createdOn: Date }` and JSON-stringified. `createdOn` is rehydrated to a `Date` on read, but is not exposed on `get()` â€” only `data` is returned.
- **Deep clone**: both `get()` and `set()` deep-clone via `JSON.parse(JSON.stringify(...))`. Mutating a returned object does NOT affect the stored value.
- **Subject identity**: handles share `BehaviorSubject` per effective key â€” calling `create('user')` from two components yields handles whose `subject` is the same instance, so `.set()` in one updates the `observer` in the other.
- **Default value**: returned by `get()` when nothing is in storage. The subject is seeded with `existingData ?? option.default` on first `create()`.
- **`observer`**: emits via `subject.next(...)` but maps through `get()`, so subscribers always see a fresh deep-cloned read.
- **`destroy()`**: present at runtime (with `@ts-ignore`) but not in the `SdStorage<T>` type â€” call it as `(handle as any).destroy()` if you need to free a handle on component teardown.
- **`createdOn` field**: written but not exposed â€” useful for future TTL features but not currently surfaced.

## Examples

### 1. Persist a user preference
```typescript
import { SdStorageService } from '@sdcorejs/angular/services/storage';
import { inject } from '@angular/core';

class ThemeService {
  private storage = inject(SdStorageService);
  private theme = this.storage.create<'light' | 'dark'>('theme', { default: 'light' });

  current() { return this.theme.get(); }
  toggle()  { this.theme.set(this.theme.get() === 'light' ? 'dark' : 'light'); }
  changes$  = this.theme.observer;
}
```

### 2. Session-scoped draft
```typescript
const draft = this.storage.create<FormDraft>('post-draft', {
  type: 'session',
  default: { title: '', body: '' },
});
draft.set(this.form.value);
```

### 3. Hashed object keys
```typescript
const key = { userId: 42, page: 'reports' };
const filters = this.storage.create<Filter[]>(key, { default: [] });
// effective key = Utilities.hash({...})
```

### 4. App-wide versioning via SD_STORAGE_CONFIG
```typescript
providers: [
  { provide: SD_STORAGE_CONFIG, useValue: <ISdStorageConfiguration>{
    key: k => `myapp-v3:${k}`,    // bumping 'v3' invalidates all old entries
  }},
]
```

## Anti-patterns
- Do NOT store secrets â€” use a server session or in-memory state instead.
- Do NOT mutate the object returned by `get()` and expect the next `get()` to reflect it â€” values are deep-cloned. Always go through `set()`.
- Do NOT call `create()` repeatedly inside a hot loop â€” pull the handle once and reuse it. Each call hashes the key and may sync from storage.
- Do NOT combine `SD_STORAGE_CONFIG.key` with hard-coded namespacing in your own keys â€” pick one. Mixing yields keys like `app:app:foo`.
- Do NOT store non-JSON-serializable values (`Map`, `Set`, `Date` other than the wrapper, `Function`, cyclic objects) â€” they will silently lose data.
- Do NOT forget to call `(handle as any).destroy()` on long-lived dynamic keys if you create many â€” the subject map will grow.

## Related
- `SdCacheService` (`@sdcorejs/angular/services/cache`) â€” adds TTL semantics on top of similar storage primitives.
- `Utilities.hash` (`@sdcorejs/utils/fns`) â€” hashes object keys.

