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

Per-handle options override global namespace/version/serializer/canonicalizer values.

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
- Unsupported values now fail explicitly instead of losing types during JSON stringify/parse.
- Verify custom `SD_STORAGE_CONFIG.key` functions because they now wrap versioned base keys.

Focused coverage lives in `storage.service.spec.ts`, `storage.types.spec.ts` and the shared persistence specs.
