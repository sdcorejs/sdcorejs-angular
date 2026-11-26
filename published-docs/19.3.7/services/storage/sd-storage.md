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
| `SD_STORAGE_CONFIGURATION.namespace` (per app) | 2 | as supplied |
| — | — | absent (handles share one partition per origin) |

⚠️ **Every application that shares an origin with anything else MUST declare its own `namespace`.**
The library deliberately does not ship a fallback value: a library-wide constant would be identical in
both apps, so it would not separate them at all — it would only change the storage key of every
existing handle and orphan already-persisted data. Only an app-chosen value actually partitions.

The cheapest correct setup is one global `SD_STORAGE_CONFIGURATION.namespace` per application:

```ts
providers: [{ provide: SD_STORAGE_CONFIGURATION, useValue: { namespace: 'app-a' } satisfies ISdStorageConfiguration }];
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
  refresh(): T | undefined;
  subject: BehaviorSubject<T | undefined>;
  observer: Observable<T | undefined>;
}
```

`setSilent()` persists without notifying observers. `destroy()` is typed, idempotent, completes the facade subject and detaches the handle without removing its stored value. A handle created with `default` returns `SdStorageWithDefault<T>` with non-optional `get()`/`refresh()`/subject/observer types.

### Re-reading storage with `refresh()`

Every live handle of the same key shares one in-memory entry, and `get()` reads that entry, not storage. `refresh()` re-reads the persisted value instead. Use it when:

- another tab or process may have written the key;
- you need to confirm that a write actually persisted — `set()` updates memory first and keeps the value even when the browser rejects the write (quota, security error).

```ts
preferences.set({ theme: 'dark' });
const persisted = preferences.refresh(); // what storage actually holds
const stored = preferences.has(); // tells a stored value from the default
```

The fresh value replaces the shared entry, so every live handle of the key sees it. Subscribers are notified only when the value changed. The comparison uses the serializer output, so it relies on a deterministic serializer: a non-deterministic custom serializer (for example one with a random IV) may notify on every `refresh()`. `refresh()` returns the value from the same read it notified subscribers with: `undefined`, or the default for a handle created with `default`, when nothing is stored. When storage cannot be read (SSR, access denied, or a key whose last write failed), the unconfirmed in-memory value is dropped and the key reads as absent. `refresh()` throws on a destroyed handle, like `set()`, `has()` and `remove()`.

`refresh()` follows the same rules as the first read of a key: it may rewrite a corrupt entry as a tombstone or migrate a legacy value to the current format. A key whose last write failed is quarantined and keeps reading as absent until its next successful write.

Custom implementations of `SdStorage`/`SdStorageWithDefault` (for example test doubles) must add `refresh()`.

## Serialization and legacy data

The default `SdGraphSerializer` preserves `Date`, `Map`, `Set`, `BigInt`, `undefined`, special numbers, shared references and cycles. Reads/writes clone values so mutating a returned object cannot mutate the stored snapshot. Unsupported functions, symbols, DOM nodes and custom class instances are rejected instead of being silently corrupted.

Current values are wrapped in a bounded, versioned envelope. Pre-1.4 JSON entries using `{ data, createdOn }` are read from the legacy key, validated, migrated and removed. Corrupt or mismatched envelopes are treated as absent; a tombstone prevents removed legacy data from being revived.

## Configuration

`SD_STORAGE_CONFIGURATION` supports a global key rewriter, namespace/version, serializer and deterministic identity canonicalizer.

```ts
providers: [
  {
    provide: SD_STORAGE_CONFIGURATION,
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

- Browser storage security/quota exceptions are contained; the active in-memory value is preserved until `refresh()`.
- On SSR, the adapter reports storage unavailable and the handle continues as an in-memory reactive facade until `refresh()`.
- Invalid documents never partially mutate a hydrated state.
- Injector teardown completes all subjects and clears internal maps.
- Destroy dynamic handles when their owner is removed; call `remove()` separately when persisted data must be deleted.

## Migration from pre-1.4 behavior

- `destroy()` is now public and typed; remove casts/workarounds.
- Existing JSON values migrate on first successful read.
- `namespace`/`version` are part of identity, so changing either intentionally starts a new storage partition.
- **`namespace` still has no default.** Handles created without one keep the storage key they already had, so no persisted value is orphaned by upgrading. Adding a `namespace` is an explicit, opt-in partition change: the previously stored values stop being read from that moment on.
- Unsupported values now fail explicitly instead of losing types during JSON stringify/parse.
- Verify custom `SD_STORAGE_CONFIGURATION.key` functions because they now wrap versioned base keys.

Focused coverage lives in `storage.service.spec.ts`, `storage.types.spec.ts` and the shared persistence specs.
