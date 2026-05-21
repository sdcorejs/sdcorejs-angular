# SdCacheService

**Type**: Service (Angular `@Injectable`)
**Class**: `SdCacheService`
**Provided in**: `'root'`
**Import path**: `@sdcorejs/angular/services/cache`

## One-line purpose
Key-based cache factory that returns per-key handles (`get`/`set`/`has`/`remove`/`destroy`/`load`/`observer`) backed by an in-memory `Map` plus optional `localStorage` / `sessionStorage` persistence with hour-based TTL.

## When to use
- Caching API responses across components/pages with a TTL (`hours`).
- Get-or-set ("memoize") pattern for async data via `load(callback)`.
- Reactive consumption of cached values via the `observer` (`Observable<T | undefined>`).
- Sharing data between components without coupling them through a state library.

## When NOT to use
- For very large/binary blobs in `localStorage` â€” quota errors are caught but the entry won't persist.
- For secrets â€” `localStorage`/`sessionStorage` are accessible to any script in the origin.
- When you need cross-tab eviction signals â€” there is no `storage` event handler; reads happen on access.

## Public API

### `create<T>(key, option?): SdCache<T>`
Returns a stable handle for the given (key, option) pair. Handles for the same hashed key share the same `BehaviorSubject`, so `observer` emits to all consumers.

```typescript
create<T = any>(key: string | object, option?: SdCacheOption<T>): SdCache<T>;

interface SdCacheOption<T = any> {
  type?: 'memory' | 'session' | 'local';   // default: 'memory'
  hours?: number;                            // TTL; if expired, entry is evicted on next read
  default?: T;                               // returned by get() when no entry
  args?: Record<string, any>;               // reserved â€” not read by current implementation
}

interface SdCache<T = any> {
  get: () => T;
  set: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  destroy: () => void;
  observer: Observable<T | undefined>;
  load: (callback: () => Promise<T>) => Promise<T>;
}
```

**Parameters**:
- `key` (`string | object`): identifier; hashed via `Utilities.hash({ key })`. Object keys are serialized with sorted keys before hashing â€” two objects with the same shape/values map to the same cache slot.
- `option` (`SdCacheOption<T>`, optional): storage type, TTL, default value.

**Returns**: `SdCache<T>` handle.

**Throws**: `'Key is required'` if `key` is falsy.

### Handle methods (returned by `create`)
- `get()`: returns the cached value (or `option.default`). Reads memory first, falls back to storage and lifts the entry into memory. TTL-expired entries are evicted and `undefined` is returned.
- `set(data)`: deep-clones via `JSON.parse(JSON.stringify(data))`, stamps `createdOn = new Date()`, writes memory + storage, emits to subscribers.
- `has()`: `true` if a non-expired entry exists.
- `remove()`: clears memory + storage entry; emits `undefined`.
- `destroy()`: completes the subject and removes both the subject and the memory entry (does NOT clear storage by itself â€” call `remove()` first if needed).
- `load(callback)`: get-or-set â€” returns cache hit if present; otherwise awaits `callback()`, sets it (only if result is non-null/non-undefined), returns it.
- `observer`: `Observable<T | undefined>` â€” current value piped through `get()` on every emission, so subscribers always see the live, TTL-checked value.

## Configuration / DI tokens

### `SD_CACHE_CONFIG` â€” `InjectionToken<ISdCacheConfiguration>` (declared but not consumed by current service)
Reserved for plugging custom storage adapters. The current implementation does NOT inject this token; treat as an extension point only.

```typescript
interface ISdCacheConfiguration {
  convertKey?: (key: string) => string;
  set?: (key: string, value: { data: any; createdOn: Date }, option?: SdCacheOption) => Promise<void>;
  get?: (key: string, option?: SdCacheOption) => Promise<{ data: any; createdOn: Date }>;
  remove?: (key: string, option?: SdCacheOption) => Promise<void>;
}
```

## Behavior notes
- **Storage layering**: memory (`Map`) is authoritative for the current session. `localStorage`/`sessionStorage` is read once on first access and lifted into memory.
- **Deep clone**: both `get` and `set` deep-clone the payload (`JSON.parse(JSON.stringify(...))`). Functions, Dates, Maps/Sets, undefined values, and circular refs are NOT preserved.
- **TTL**: `hours` is checked against `entry.createdOn` using `DateUtilities.addHours`. Expiry triggers eviction on the next read.
- **Quota**: storage write failures are caught and `console.error('Storage quota exceeded', e)` is emitted; in-memory entry still works.
- **Subject sharing**: if you call `create(key, option)` twice in the same session, both handles share the same `BehaviorSubject`, so `observer` is broadcast.

## Examples

### 1. Get-or-set across navigation
```typescript
const cache = inject(SdCacheService).create<User[]>('users', {
  type: 'session',
  hours: 1,
});

const users = await cache.load(() => firstValueFrom(http.get<User[]>('/api/users')));
```

### 2. Reactive consumption with default
```typescript
const cache = this.cacheSvc.create<Settings>('settings', { default: { theme: 'light' } });
cache.observer.subscribe(s => this.theme = s!.theme);
cache.set({ theme: 'dark' });
```

### 3. Manual invalidation (e.g., after mutation)
```typescript
async deleteUser(id: string) {
  await this.api.delete(`/api/users/${id}`);
  this.cacheSvc.create<User[]>('users').remove();
}
```

### 4. Long-lived persistent cache (browser-restart-safe)
```typescript
const cache = this.cacheSvc.create('app:bootstrap', { type: 'local', hours: 24 });
```

### 5. Session-scoped persistence (tab-only, cleared on close)
```typescript
const cache = this.cacheSvc.create<string[]>('recent-searches', { type: 'session' });
cache.set(['Angular', 'TypeScript']);
```

### 6. Full teardown (clear storage + destroy subject)
```typescript
// Call remove() before destroy() to also wipe the storage entry.
cache.remove();
cache.destroy();
```

## Anti-patterns
- Do NOT mutate objects returned by `get()` and expect the cache to update â€” they are deep clones; you must `set()` again.
- Do NOT store class instances expecting methods to survive â€” `JSON.stringify` strips them.
- Do NOT cache `Promise`s or `Observable`s â€” only the resolved value should go in.
- Do NOT call `destroy()` while other components still hold the handle â€” they will keep their stale subject reference but new `create(...)` calls will get a fresh subject.

## Testing

Unit spec: `projects/sdcorejs-angular/services/cache/src/cache.service.spec.ts` (22 specs).

Coverage areas:
- Instantiation and API shape
- `create()` throws on falsy key
- `set()` / `get()` round-trip and deep-clone isolation
- `has()` before and after `set()`
- `remove()` clears value and emits `undefined`
- `destroy()` completes the observable stream
- TTL expiry via `jasmine.clock().mockDate()`
- `observer` emissions and shared-subject across handles
- `load()` â€” cache miss, cache hit, null/undefined skip, error propagation
- `localStorage` persistence and removal
- Object key namespace independence

## Related
- `SdApiService` (`@sdcorejs/angular/services/api`) â€” uses `SdCacheService` for its persistent cache layer (`option.cacheOption`).
- `Utilities.hash`, `DateUtilities.addHours` (`@sdcorejs/angular/utilities/extensions`) â€” used internally for key hashing and TTL math.

