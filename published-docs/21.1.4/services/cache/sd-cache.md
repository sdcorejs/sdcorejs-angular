# `SdCacheService`

**Type:** root injectable typed cache
**Import path:** `@sdcorejs/angular/services/cache`

`SdCacheService` creates typed cache handles with shared state, exact absence semantics, TTL, request coalescing and optional memory/session/local persistence.

## Create a handle

```ts
const users = cache.create<User[]>('users', {
  type: 'session',
  ttlMs: 60_000,
  namespace: 'portal',
  version: 2,
});

const value = await users.load(() => api.get<User[]>('/api/users'));
users.release();
```

`hours` remains supported for compatibility; `ttlMs` takes precedence. A `default` option returns `SdCacheWithDefault<T>`, whose `get()`/`observer` do not include `undefined`.

## Handle contract

```ts
interface SdCache<T> {
  get(): T | undefined;
  snapshot(): { present: false } | { present: true; value: T };
  set(value: T): void;
  has(): boolean;
  remove(): void;
  release(): void;
  destroy(): void;
  load(loader: () => Promise<T>): Promise<T>;
  observer: Observable<T | undefined>;
}
```

- `snapshot()` distinguishes a stored `undefined` from absence.
- Concurrent `load()` calls for the same effective identity share one loader promise.
- Late loader completion cannot repopulate a removed/destroyed generation.
- `release()` detaches one facade without deleting the persistent value.
- `destroy()` is idempotent and releases the handle; for memory caches it also drops the owner entry when appropriate.

## Persistence and serialization

The default `SdGraphSerializer` preserves `Date`, `Map`, `Set`, `BigInt`, `undefined`, special numbers, shared references and cycles. Values are cloned at the handle boundary. Functions, symbols, DOM nodes and unsupported class instances are rejected rather than silently changed.

Persistent entries use a versioned envelope containing a deterministic identity and serializer format. Keys include cache area, namespace, version, args/default presence, TTL and serializer/canonicalizer identity. Legacy JSON `{ data, createdOn }` entries are read, validated and migrated to the new envelope.

Storage corruption, quota/security failures and unavailable browser storage do not crash the application or overwrite the current in-memory value. Tombstones prevent removed legacy entries from reappearing.

## Global configuration

`SD_CACHE_CONFIG` is active and supports global namespace/version, serializer, identity canonicalizer, key conversion and remote callbacks.

```ts
providers: [
  {
    provide: SD_CACHE_CONFIG,
    useValue: {
      namespace: 'portal',
      version: 2,
      convertKey: key => `tenant-42:${key}`,
    } satisfies ISdCacheConfiguration,
  },
];
```

Callbacks use `unknown` payloads so one global provider is safe for heterogeneous keys. `adaptLegacySdCacheCallbacks()` is the explicit deprecated adapter for older generic callbacks; it requires a key matcher and runtime type guard.

## SSR and cleanup

The injected persistence adapter reports storage as unavailable outside the browser. Memory caching still works. Injector teardown invalidates pending loads, completes every observer and clears maps/queues. Consumer-created long-lived handles should call `release()` on teardown.

## Migration from pre-1.4 behavior

- `SD_CACHE_CONFIG` now affects runtime behavior; verify namespace/key conversion before upgrading persisted data.
- Prefer `ttlMs`; `hours` remains compatible.
- Values no longer pass through lossy JSON cloning. Unsupported values throw a typed persistence error.
- Use `snapshot()` when `undefined` is a legitimate cached value.
- Release dynamic handles to avoid retaining observers.

Focused coverage lives in `cache.service.spec.ts`, `cache.types.spec.ts` and the shared persistence specs.
