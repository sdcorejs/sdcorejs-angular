# Persistence foundation

**Type:** serializer, identity, envelope and storage-adapter utilities
**Import path:** `@sdcorejs/angular/services/persistence`

This entrypoint is the shared persistence contract behind `SdCacheService` and `SdStorageService`. Applications may reuse it for a compatible custom backend or serializer.

## Graph serializer

```ts
interface Snapshot {
  createdAt: Date;
  flags: Set<string>;
  self?: Snapshot;
}

const serializer = new SdGraphSerializer();
const source: Snapshot = { createdAt: new Date(), flags: new Set(['read']) };
source.self = source;

const serialized = serializer.stringify(source);
const restored = serializer.parse<Snapshot>(serialized);
```

`SdGraphSerializer` preserves plain/null-prototype objects, arrays, `Date`, `Map`, `Set`, `BigInt`, `undefined`, special numbers, shared references and cycles. It rejects unsupported values and malformed/unknown documents with `SdPersistenceError` and a typed code.

Hard limits bound document size, depth, node/entry counts, key/string sizes and bigint digits. A caller may lower limits but cannot raise them above `SD_GRAPH_HARD_LIMITS`.

## Deterministic identity

`SdGraphIdentityCanonicalizer` produces stable canonical strings independent of object property insertion order. `buildSdPersistenceKey()` length-prefixes tagged fields and `digestSdPersistenceKey()` creates the storage-safe SHA-256 identity used by cache/storage.

Do not use the digest as an authentication or password primitive; it only avoids collisions in local persistence keys.

## Versioned envelopes

`stringifySdPersistenceValueEnvelope()` and `stringifySdPersistenceTombstoneEnvelope()` bind a payload/tombstone to its expected identity and serializer format. `parseSdPersistenceEnvelope()` returns `undefined` for malformed, mismatched or unknown envelopes and enforces bounded field/document sizes.

Tombstones ensure an intentionally removed value cannot be resurrected by a still-present legacy key.

## Storage adapter

`SD_PERSISTENCE_STORAGE_ADAPTER` defaults to `SdBrowserStorageAdapter`. The adapter returns `found | absent | unavailable` instead of throwing browser security/quota errors through service initialization. On SSR both local/session areas are unavailable.

Applications can provide a custom adapter:

```ts
const values = new Map<string, string>();
const customAdapter: SdPersistenceStorageAdapter = {
  getItem: (_area, key) => values.get(key) ?? null,
  setItem: (_area, key, value) => {
    values.set(key, value);
    return true;
  },
  removeItem: (_area, key) => values.delete(key),
};

providers: [
  {
    provide: SD_PERSISTENCE_STORAGE_ADAPTER,
    useValue: customAdapter,
  },
];
```

Adapter methods are synchronous because Web Storage hydration is synchronous. Remote asynchronous cache callbacks remain on `SD_CACHE_CONFIG`.

## Custom serializer rules

An `SdPersistenceSerializer` must have a stable, non-empty `format` and implement `stringify`, `parse` and `clone`. Changing the format creates a new persistence identity. The serializer must validate untrusted stored text and retain the same failure/limit properties as the built-in serializer.

## Error and security boundaries

- Treat local/session storage as untrusted input.
- Never store secrets, tokens or sensitive PII in browser persistence.
- Serializer limits are denial-of-service containment, not data encryption.
- Cache/storage keep the previous in-memory state if an adapter or parse operation fails.

Focused coverage lives beside `graph-serializer`, `persistence-key`, `persistence-envelope` and `storage-adapter`.
