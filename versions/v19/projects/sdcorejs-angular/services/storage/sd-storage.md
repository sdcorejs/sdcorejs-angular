# `SdStorageService`

**Type:** root injectable typed storage
**Import path:** `@sdcorejs/angular/services/storage`

`SdStorageService` creates reactive local/session storage handles with versioned graph serialization, deterministic identities, legacy migration and SSR-safe failure containment.

## Create a handle

```ts
const preferences = storage.create<Preferences>('preferences', {
  type: 'local',
  default: { theme: 'light' },
  namespace: 'portal',
  version: 2,
});

preferences.set({ theme: 'dark' });
const current = preferences.get();
```

Object keys are canonicalized deterministically. Options affecting persistence identity include area, namespace, version, args/default presence, serializer and identity canonicalizer.

## Namespaces and the same-origin collision hazard

⚠️ **`localStorage` / `sessionStorage` are scoped to the ORIGIN, not to the app.** Two applications
deployed on the same origin (`https://portal.example.com/app-a/` and `.../app-b/`) share one storage
area. Handles created with the same logical key and the same options therefore resolve to the same
storage key, and each app silently overwrites the other's value.

`namespace` is what partitions them, and **it has no default on purpose**:

| Source | Precedence | Value |
| --- | --- | --- |
| `option.namespace` (per handle) | 1 (highest) | as supplied |
| `SD_STORAGE_CONFIG.namespace` (per app) | 2 | as supplied |
| — | — | absent (handles share one partition per origin) |

⚠️ **Every application that shares an origin with anything else MUST declare its own `namespace`.**
The library deliberately does not ship a fallback value: a library-wide constant would be identical in
both apps, so it would not separate them at all — it would only change the storage key of every
existing handle and orphan already-persisted data. Only an app-chosen value actually partitions.

The cheapest correct setup is one global `SD_STORAGE_CONFIG.namespace` per application:

```ts
providers: [{ provide: SD_STORAGE_CONFIG, useValue: { namespace: 'app-a' } satisfies ISdStorageConfiguration }];
```

Since `namespace` is part of the persistence identity, adopting or changing it starts a new storage
partition — values written under the previous namespace are no longer read (see *Migration* below).

## Handle contract

```ts
interface SdStorage<T> {
  get(): T | undefined;
  set(value: T): void;
  setSilent(value: T): void;
  has(): boolean;
  remove(): void;
  destroy(): void;
  subject: BehaviorSubject<T | undefined>;
  observer: Observable<T | undefined>;
}
```

`setSilent()` persists without notifying observers. `destroy()` is typed, idempotent, completes the facade subject and detaches the handle without removing its stored value. A handle created with `default` returns `SdStorageWithDefault<T>` with non-optional `get()`/subject/observer types.

## Serialization and legacy data

The default `SdGraphSerializer` preserves `Date`, `Map`, `Set`, `BigInt`, `undefined`, special numbers, shared references and cycles. Reads/writes clone values so mutating a returned object cannot mutate the stored snapshot. Unsupported functions, symbols, DOM nodes and custom class instances are rejected instead of being silently corrupted.

Current values are wrapped in a bounded, versioned envelope. Pre-1.4 JSON entries using `{ data, createdOn }` are read from the legacy key, validated, migrated and removed. Corrupt or mismatched envelopes are treated as absent; a tombstone prevents removed legacy data from being revived.

## Configuration

`SD_STORAGE_CONFIG` supports a global key rewriter, namespace/version, serializer and deterministic identity canonicalizer.

```ts
providers: [
  {
    provide: SD_STORAGE_CONFIG,
    useValue: {
      namespace: 'portal',
      version: 2,
      key: key => `tenant-42:${key}`,
    } satisfies ISdStorageConfiguration,
  },
];
```

Per-handle options override global namespace/version/serializer/canonicalizer values. When neither
supplies a namespace, the handle is created without one — see the collision hazard above.

## Errors, SSR and cleanup

- Browser storage security/quota exceptions are contained; the active in-memory value is preserved.
- On SSR, the adapter reports storage unavailable and the handle continues as an in-memory reactive facade.
- Invalid documents never partially mutate a hydrated state.
- Injector teardown completes all subjects and clears internal maps.
- Destroy dynamic handles when their owner is removed; call `remove()` separately when persisted data must be deleted.

## Migration from pre-1.4 behavior

- `destroy()` is now public and typed; remove casts/workarounds.
- Existing JSON values migrate on first successful read.
- `namespace`/`version` are part of identity, so changing either intentionally starts a new storage partition.
- **`namespace` still has no default.** Handles created without one keep the storage key they already had, so no persisted value is orphaned by upgrading. Adding a `namespace` is an explicit, opt-in partition change: the previously stored values stop being read from that moment on.
- Unsupported values now fail explicitly instead of losing types during JSON stringify/parse.
- Verify custom `SD_STORAGE_CONFIG.key` functions because they now wrap versioned base keys.

Focused coverage lives in `storage.service.spec.ts`, `storage.types.spec.ts` and the shared persistence specs.
