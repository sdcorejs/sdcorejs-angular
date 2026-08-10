import { DestroyRef, inject, Injectable } from '@angular/core';
import {
  SD_PERSISTENCE_STORAGE_ADAPTER,
  SdGraphSerializer,
  SdGraphIdentityCanonicalizer,
  SdPersistenceIdentityCanonicalizer,
  SdPersistenceSerializer,
  SdPersistenceStorageArea,
  buildSdPersistenceKey,
  canonicalizeSdPersistenceValue,
  digestSdPersistenceKey,
  parseSdPersistenceEnvelope,
  readSdPersistenceStorageItem,
  stringifySdPersistenceTombstoneEnvelope,
  stringifySdPersistenceValueEnvelope,
} from '@sdcorejs/angular/services/persistence';
import { Utilities } from '@sdcorejs/utils/fns';
import { BehaviorSubject } from 'rxjs';
import {
  SD_CACHE_CONFIG,
  SD_CACHE_DEFAULT_MAX_MEMORY_ENTRIES,
  SdCache,
  SdCacheOption,
  SdCacheSnapshot,
  SdCacheStoredValue,
  SdCacheWithDefault,
} from './cache.model';

interface CacheHandleFacade {
  emit: (present: boolean, value: unknown) => void;
  complete: () => void;
}

interface CacheState {
  entry?: SdCacheStoredValue<unknown>;
  hydrated: boolean;
  handles: Set<CacheHandleFacade>;
  generation: number;
  inFlight?: { generation: number; promise: Promise<unknown> };
  disposed: boolean;
}

type CacheEntryRead = { status: 'found'; entry: SdCacheStoredValue<unknown> } | { status: 'absent' } | { status: 'unavailable' };

interface NormalizedCacheOption {
  publicOption: SdCacheOption<unknown>;
  area: SdPersistenceStorageArea | 'memory';
  storageKey: string;
  legacyStorageKey?: string;
  ownerDigest: string;
  identityDigest: string;
  ttlMs?: number;
  serializer: SdPersistenceSerializer;
}

interface CacheHandleOperations<T> {
  get: () => T | undefined;
  snapshot: () => SdCacheSnapshot<T>;
  set: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  release: () => void;
  destroy: () => void;
  load: (callback: () => Promise<T>) => Promise<T>;
}

@Injectable({ providedIn: 'root' })
export class SdCacheService {
  readonly #configuration = inject(SD_CACHE_CONFIG, { optional: true });
  readonly #adapter = inject(SD_PERSISTENCE_STORAGE_ADAPTER);
  readonly #destroyRef = inject(DestroyRef);
  readonly #defaultSerializer = new SdGraphSerializer();
  readonly #defaultIdentityCanonicalizer = new SdGraphIdentityCanonicalizer();
  readonly #states = new Map<string, CacheState>();
  readonly #remoteQueues = new Map<string, Promise<void>>();
  readonly #memoryEntries = new Map<string, SdCacheStoredValue<unknown>>();
  readonly #failedOwners = new Map<string, true>();
  readonly #maxFailedOwners = 256;
  // why: #memoryEntries trước đây không có trần và TTL thì opt-in, trong khi SdApiService luôn gọi
  // release() (không phải destroy()) sau mỗi request — release chỉ bỏ state của handle, KHÔNG bỏ
  // entry memory. Hệ quả: mỗi URL được cache để lại một entry sống hết đời app → bộ nhớ tăng đơn
  // điệu. Chặn bằng LRU có trần, cấu hình qua SD_CACHE_CONFIG.maxMemoryEntries.
  readonly #maxMemoryEntries = this.#normalizeMaxMemoryEntries(this.#configuration?.maxMemoryEntries);
  #destroyed = false;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      this.#destroyed = true;
      for (const state of this.#states.values()) {
        state.disposed = true;
        state.generation += 1;
        state.entry = undefined;
        state.inFlight = undefined;
        for (const handle of state.handles) handle.complete();
        state.handles.clear();
      }
      this.#states.clear();
      this.#remoteQueues.clear();
      this.#memoryEntries.clear();
      this.#failedOwners.clear();
    });
  }

  create<T>(key: string | object, option: SdCacheOption<T> & { default: T }): SdCacheWithDefault<T>;
  create<T = unknown>(key: string | object, option?: SdCacheOption<unknown>): SdCache<T>;
  create<T = unknown>(key: string | object, option: SdCacheOption<T> = {}): SdCache<T> | SdCacheWithDefault<T> {
    if (this.#destroyed) throw new Error('Cache service has been destroyed');
    if (!key) throw new Error('Key is required');
    const normalized = this.#normalize(key, option);
    const state = this.#getOrCreateState(normalized);
    if (Object.prototype.hasOwnProperty.call(option, 'default')) {
      return this.#createDefaultHandle(state, normalized, this.#cloneAs<T>(normalized.serializer, option.default));
    }
    return this.#createOptionalHandle<T>(state, normalized);
  }

  #getOrCreateState(normalized: NormalizedCacheOption): CacheState {
    const existing = this.#states.get(normalized.ownerDigest);
    if (existing) return existing;
    const state: CacheState = {
      hydrated: false,
      handles: new Set<CacheHandleFacade>(),
      generation: 0,
      disposed: false,
    };
    this.#states.set(normalized.ownerDigest, state);
    this.#hydrateState(state, normalized);
    return state;
  }

  #createOptionalHandle<T>(state: CacheState, normalized: NormalizedCacheOption): SdCache<T> {
    const initial = this.#readOptional<T>(state, normalized);
    const subject = new BehaviorSubject<T | undefined>(initial);
    const facade: CacheHandleFacade = {
      emit: (present, value) => subject.next(present ? this.#cloneAs<T>(normalized.serializer, value) : undefined),
      complete: () => subject.complete(),
    };
    const operations = this.#attachHandle(state, normalized, facade, () => this.#readOptional<T>(state, normalized));
    return { ...operations, observer: subject.asObservable() };
  }

  #createDefaultHandle<T>(state: CacheState, normalized: NormalizedCacheOption, defaultSnapshot: T): SdCacheWithDefault<T> {
    const read = (): T => this.#readWithDefault(state, normalized, defaultSnapshot);
    const subject = new BehaviorSubject<T>(read());
    const facade: CacheHandleFacade = {
      emit: (present, value) =>
        subject.next(present ? this.#cloneAs<T>(normalized.serializer, value) : this.#cloneAs<T>(normalized.serializer, defaultSnapshot)),
      complete: () => subject.complete(),
    };
    const operations = this.#attachHandle(state, normalized, facade, read);
    return { ...operations, get: read, observer: subject.asObservable() };
  }

  #attachHandle<T>(
    state: CacheState,
    normalized: NormalizedCacheOption,
    facade: CacheHandleFacade,
    read: () => T | undefined
  ): CacheHandleOperations<T> {
    state.handles.add(facade);
    let active = true;
    const assertActive = (): void => {
      if (!active || state.disposed || this.#destroyed) throw new Error('Cache handle has been destroyed');
    };
    const get = (): T | undefined => {
      assertActive();
      return read();
    };
    const snapshot = (): SdCacheSnapshot<T> => {
      assertActive();
      const entry = this.#getValidEntry(state, normalized);
      return entry === undefined ? { present: false } : { present: true, value: this.#cloneAs<T>(normalized.serializer, entry.data) };
    };
    const set = (data: T): void => {
      assertActive();
      this.#setEntry(state, normalized, data, true);
      this.#broadcast(state);
    };
    const has = (): boolean => {
      assertActive();
      return this.#getValidEntry(state, normalized) !== undefined;
    };
    const remove = (): void => {
      assertActive();
      this.#removeEntry(state, normalized, true);
      this.#broadcast(state);
    };
    const releaseFacade = (): void => {
      if (!active) return;
      active = false;
      state.handles.delete(facade);
      facade.complete();
      if (state.handles.size > 0) return;
      state.disposed = true;
      state.generation += 1;
      state.entry = undefined;
      state.inFlight = undefined;
      this.#states.delete(normalized.ownerDigest);
    };
    const release = (): void => releaseFacade();
    const destroy = (): void => {
      if (!active) return;
      releaseFacade();
      if (normalized.area !== 'memory') return;
      this.#memoryEntries.delete(normalized.ownerDigest);
      if (state.disposed) return;
      state.entry = undefined;
      state.hydrated = true;
      this.#broadcast(state);
    };
    const load = (callback: () => Promise<T>): Promise<T> => {
      try {
        assertActive();
      } catch (error: unknown) {
        return Promise.reject(error);
      }
      const entry = this.#getValidEntry(state, normalized);
      if (entry) return Promise.resolve(this.#cloneAs<T>(normalized.serializer, entry.data));
      const generation = state.generation;
      if (state.inFlight?.generation === generation) {
        return state.inFlight.promise.then(value => this.#cloneAs<T>(normalized.serializer, value));
      }
      const promise = this.#loadMiss(state, normalized, callback, generation);
      state.inFlight = { generation, promise };
      void promise
        .finally(() => {
          if (state.inFlight?.promise === promise) state.inFlight = undefined;
        })
        .catch(() => undefined);
      return promise;
    };
    return { get, snapshot, set, has, remove, release, destroy, load };
  }

  async #loadMiss<T>(state: CacheState, normalized: NormalizedCacheOption, callback: () => Promise<T>, generation: number): Promise<T> {
    const remote = await this.#readRemote(normalized);
    if (remote) {
      if (!state.disposed && state.generation === generation) {
        state.entry = this.#cloneEntry(remote, normalized.serializer);
        state.hydrated = true;
        state.generation += 1;
        this.#writePersistent(normalized, state.entry);
        this.#broadcast(state);
      }
      return this.#cloneAs<T>(normalized.serializer, remote.data);
    }

    const result = await callback();
    if (result !== null && result !== undefined && !state.disposed && state.generation === generation) {
      this.#setEntry(state, normalized, result, true);
      this.#broadcast(state);
    }
    if (result === null || result === undefined) return result;
    return this.#cloneAs<T>(normalized.serializer, result);
  }

  #normalize<T>(key: string | object, option: SdCacheOption<T>): NormalizedCacheOption {
    const serializer = option.serializer ?? this.#configuration?.serializer ?? this.#defaultSerializer;
    const identityCanonicalizer =
      option.identityCanonicalizer ?? this.#configuration?.identityCanonicalizer ?? this.#defaultIdentityCanonicalizer;
    const canonicalKey = canonicalizeSdPersistenceValue(identityCanonicalizer, key, 'cache key');
    const legacyStorageKey = this.#legacyStorageKey(key);
    const namespace = option.namespace ?? this.#configuration?.namespace;
    const version = option.version ?? this.#configuration?.version;
    const area = option.type ?? 'memory';
    const ttlMs = this.#normalizeTtl(option);
    const serializerFormat = this.#serializerFormat(serializer);
    const hasArgs = Object.prototype.hasOwnProperty.call(option, 'args');
    const hasDefault = Object.prototype.hasOwnProperty.call(option, 'default');
    const fields = [
      { tag: 'area', value: canonicalizeSdPersistenceValue(identityCanonicalizer, area, 'cache area') },
      { tag: 'namespace', value: this.#optionalIdentity(identityCanonicalizer, namespace !== undefined, namespace, 'cache namespace') },
      { tag: 'version', value: this.#optionalIdentity(identityCanonicalizer, version !== undefined, version, 'cache version') },
      { tag: 'ttlMs', value: this.#optionalIdentity(identityCanonicalizer, ttlMs !== undefined, ttlMs, 'cache TTL') },
      { tag: 'args', value: this.#optionalIdentity(identityCanonicalizer, hasArgs, option.args, 'cache args') },
      { tag: 'default', value: this.#optionalIdentity(identityCanonicalizer, hasDefault, option.default, 'cache default') },
      { tag: 'serializer', value: serializerFormat },
      { tag: 'identityCanonicalizer', value: this.#identityCanonicalizerFormat(identityCanonicalizer) },
    ];
    const identity = buildSdPersistenceKey(canonicalKey, fields);
    const identityDigest = digestSdPersistenceKey(identity);
    const storageKey = this.#convertKey(`sdcorejs.cache@1:${identityDigest}`);
    const ownerDigest = digestSdPersistenceKey(buildSdPersistenceKey(storageKey, [{ tag: 'area', value: area }]));
    return {
      publicOption: option,
      area,
      storageKey,
      legacyStorageKey,
      ownerDigest,
      identityDigest,
      ttlMs,
      serializer,
    };
  }

  #convertKey(baseKey: string): string {
    try {
      return this.#configuration?.convertKey?.(baseKey) ?? baseKey;
    } catch {
      return baseKey;
    }
  }

  #legacyStorageKey(key: string | object): string | undefined {
    try {
      return this.#convertKey(Utilities.hash({ key }));
    } catch {
      return undefined;
    }
  }

  #normalizeTtl<T>(option: SdCacheOption<T>): number | undefined {
    const candidate = option.ttlMs ?? (option.hours === undefined ? undefined : option.hours * 3_600_000);
    if (candidate === undefined || !Number.isFinite(candidate) || candidate <= 0) return undefined;
    return Math.min(candidate, Number.MAX_SAFE_INTEGER);
  }

  #optionalIdentity(canonicalizer: SdPersistenceIdentityCanonicalizer, present: boolean, value: unknown, label: string): string {
    return present ? `1${canonicalizeSdPersistenceValue(canonicalizer, value, label)}` : '0';
  }

  #identityCanonicalizerFormat(canonicalizer: SdPersistenceIdentityCanonicalizer): string {
    if (typeof canonicalizer.format !== 'string' || canonicalizer.format.length === 0) {
      throw new Error('Persistence identity canonicalizer format must be a non-empty string');
    }
    return canonicalizer.format;
  }

  #serializerFormat(serializer: SdPersistenceSerializer): string {
    if (typeof serializer.format !== 'string' || serializer.format.length === 0) {
      throw new Error('Persistence serializer format must be a non-empty string');
    }
    return serializer.format;
  }

  #readOptional<T>(state: CacheState, normalized: NormalizedCacheOption): T | undefined {
    const entry = this.#getValidEntry(state, normalized);
    return entry ? this.#cloneAs<T>(normalized.serializer, entry.data) : undefined;
  }

  #readWithDefault<T>(state: CacheState, normalized: NormalizedCacheOption, defaultSnapshot: T): T {
    const entry = this.#getValidEntry(state, normalized);
    return entry ? this.#cloneAs<T>(normalized.serializer, entry.data) : this.#cloneAs<T>(normalized.serializer, defaultSnapshot);
  }

  #getValidEntry(state: CacheState, normalized: NormalizedCacheOption): SdCacheStoredValue<unknown> | undefined {
    if (!state.hydrated) {
      this.#hydrateState(state, normalized);
    }
    if (!state.entry) return undefined;
    if (this.#isExpired(state.entry, normalized.ttlMs)) {
      this.#removeEntry(state, normalized, true);
      this.#broadcast(state);
      return undefined;
    }
    return state.entry;
  }

  #isExpired(entry: SdCacheStoredValue<unknown>, ttlMs: number | undefined): boolean {
    return ttlMs !== undefined && entry.createdOn.getTime() + ttlMs <= Date.now();
  }

  #hydrateState(state: CacheState, normalized: NormalizedCacheOption): void {
    const read = this.#readEntry(normalized);
    state.entry = read.status === 'found' ? read.entry : undefined;
    state.hydrated = read.status !== 'unavailable';
  }

  #setEntry(state: CacheState, normalized: NormalizedCacheOption, data: unknown, notifyRemote: boolean): void {
    const entry: SdCacheStoredValue<unknown> = {
      data: normalized.serializer.clone(data),
      createdOn: new Date(),
    };
    state.entry = entry;
    state.hydrated = true;
    state.generation += 1;
    this.#writePersistent(normalized, entry);
    if (notifyRemote) this.#safeRemoteSet(normalized, entry);
  }

  #removeEntry(state: CacheState, normalized: NormalizedCacheOption, notifyRemote: boolean): void {
    state.entry = undefined;
    state.hydrated = true;
    state.generation += 1;
    if (normalized.area !== 'memory') this.#writeTombstone(normalized);
    if (notifyRemote) void this.#safeRemoteRemove(normalized);
  }

  #broadcast(state: CacheState): void {
    const present = state.entry !== undefined;
    const value = state.entry?.data;
    for (const handle of state.handles) handle.emit(present, value);
  }

  #readEntry(normalized: NormalizedCacheOption): CacheEntryRead {
    if (normalized.area === 'memory') {
      const entry = this.#memoryEntries.get(normalized.ownerDigest);
      if (!entry) return { status: 'absent' };
      this.#touchMemoryEntry(normalized.ownerDigest, entry);
      return { status: 'found', entry: this.#cloneEntry(entry, normalized.serializer) };
    }
    if (this.#failedOwners.has(normalized.ownerDigest)) return { status: 'unavailable' };
    const primary = readSdPersistenceStorageItem(this.#adapter, normalized.area, normalized.storageKey);
    if (primary.status === 'found') {
      let envelope: ReturnType<typeof parseSdPersistenceEnvelope>;
      try {
        envelope = parseSdPersistenceEnvelope(primary.value, normalized.identityDigest, normalized.serializer.format);
      } catch {
        this.#writeTombstone(normalized);
        return { status: 'absent' };
      }
      if (envelope?.kind === 'tombstone') return { status: 'absent' };
      const entry = envelope?.kind === 'value' ? this.#parseCurrentEntry(envelope.payload, normalized.serializer) : undefined;
      if (entry) return { status: 'found', entry };
      this.#writeTombstone(normalized);
      return { status: 'absent' };
    }
    if (primary.status === 'unavailable') return { status: 'unavailable' };
    if (normalized.legacyStorageKey === undefined) return { status: 'absent' };
    const legacyRead = readSdPersistenceStorageItem(this.#adapter, normalized.area, normalized.legacyStorageKey);
    if (legacyRead.status === 'unavailable') return { status: 'unavailable' };
    if (legacyRead.status === 'absent') return { status: 'absent' };
    const legacy = this.#parseLegacy(legacyRead.value);
    if (!legacy) {
      this.#writeTombstone(normalized);
      return { status: 'absent' };
    }
    this.#writePersistent(normalized, legacy);
    return { status: 'found', entry: legacy };
  }

  #parseCurrentEntry(payload: string, serializer: SdPersistenceSerializer): SdCacheStoredValue<unknown> | undefined {
    try {
      return this.#validateEntry(serializer.parse<unknown>(payload));
    } catch {
      return undefined;
    }
  }

  #parseLegacy(raw: string): SdCacheStoredValue<unknown> | undefined {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!this.#hasExactEntryKeys(parsed)) return undefined;
      const createdOn = this.#toValidDate(parsed['createdOn']);
      return createdOn ? { data: parsed['data'], createdOn } : undefined;
    } catch {
      return undefined;
    }
  }

  #validateEntry(value: unknown): SdCacheStoredValue<unknown> | undefined {
    if (!this.#hasExactEntryKeys(value)) return undefined;
    const createdOn = this.#toValidDate(value['createdOn']);
    return createdOn ? { data: value['data'], createdOn } : undefined;
  }

  #toValidDate(value: unknown): Date | undefined {
    const date = value instanceof Date ? value : typeof value === 'string' || typeof value === 'number' ? new Date(value) : undefined;
    return date && Number.isFinite(date.getTime()) ? date : undefined;
  }

  #writePersistent(normalized: NormalizedCacheOption, entry: SdCacheStoredValue<unknown>): boolean {
    if (normalized.area === 'memory') {
      this.#touchMemoryEntry(normalized.ownerDigest, this.#cloneEntry(entry, normalized.serializer));
      this.#evictMemoryOverflow();
      return true;
    }
    try {
      const payload = normalized.serializer.stringify(entry);
      if (
        this.#adapter.setItem(
          normalized.area,
          normalized.storageKey,
          stringifySdPersistenceValueEnvelope(normalized.identityDigest, normalized.serializer.format, payload)
        )
      ) {
        this.#clearFailedOwner(normalized.ownerDigest);
        return true;
      }
    } catch {
      // Fall through to canonical quarantine.
    }
    this.#safeAdapterRemove(normalized.area, normalized.storageKey);
    if (this.#tryPersistTombstone(normalized)) {
      this.#clearFailedOwner(normalized.ownerDigest);
      return false;
    }
    this.#recordFailedOwner(normalized.ownerDigest);
    return false;
  }

  #readRemote(normalized: NormalizedCacheOption): Promise<SdCacheStoredValue<unknown> | undefined> {
    return this.#enqueueRemote(normalized, async () => {
      const get = this.#configuration?.get;
      if (!get) return undefined;
      const entry = this.#validateEntry(await get(normalized.storageKey, normalized.publicOption));
      if (!entry || !this.#isExpired(entry, normalized.ttlMs)) return entry;
      const remove = this.#configuration?.remove;
      if (remove) await remove(normalized.storageKey, normalized.publicOption);
      return undefined;
    });
  }

  #safeRemoteSet(normalized: NormalizedCacheOption, entry: SdCacheStoredValue<unknown>): void {
    const set = this.#configuration?.set;
    if (!set) return;
    void this.#enqueueRemote(normalized, () =>
      set(normalized.storageKey, this.#cloneEntry(entry, normalized.serializer), normalized.publicOption)
    );
  }

  #safeRemoteRemove(normalized: NormalizedCacheOption): Promise<void | undefined> {
    const remove = this.#configuration?.remove;
    if (!remove) return Promise.resolve();
    return this.#enqueueRemote(normalized, () => remove(normalized.storageKey, normalized.publicOption));
  }

  #enqueueRemote<T>(normalized: NormalizedCacheOption, operation: () => Promise<T> | T): Promise<T | undefined> {
    const previous = this.#remoteQueues.get(normalized.ownerDigest) ?? Promise.resolve();
    const result = previous.then(async () => {
      try {
        return await operation();
      } catch {
        // A failed remote operation cannot poison later work for this identity.
        return undefined;
      }
    });
    const tail = result.then(() => undefined);
    this.#remoteQueues.set(normalized.ownerDigest, tail);
    void tail.then(() => {
      if (this.#remoteQueues.get(normalized.ownerDigest) === tail) this.#remoteQueues.delete(normalized.ownerDigest);
    });
    return result;
  }

  #safeAdapterRemove(area: SdPersistenceStorageArea, key: string): boolean {
    try {
      return this.#adapter.removeItem(area, key);
    } catch {
      return false;
    }
  }

  #writeTombstone(normalized: NormalizedCacheOption): boolean {
    if (normalized.area === 'memory') {
      this.#memoryEntries.delete(normalized.ownerDigest);
      return true;
    }
    if (this.#tryPersistTombstone(normalized)) {
      this.#clearFailedOwner(normalized.ownerDigest);
      return true;
    }
    this.#safeAdapterRemove(normalized.area, normalized.storageKey);
    this.#recordFailedOwner(normalized.ownerDigest);
    return false;
  }

  #tryPersistTombstone(normalized: NormalizedCacheOption): boolean {
    if (normalized.area === 'memory') return false;
    try {
      return this.#adapter.setItem(
        normalized.area,
        normalized.storageKey,
        stringifySdPersistenceTombstoneEnvelope(normalized.identityDigest, normalized.serializer.format)
      );
    } catch {
      return false;
    }
  }

  #clearFailedOwner(ownerDigest: string): void {
    this.#failedOwners.delete(ownerDigest);
  }

  #recordFailedOwner(ownerDigest: string): void {
    this.#failedOwners.delete(ownerDigest);
    this.#failedOwners.set(ownerDigest, true);
    if (this.#failedOwners.size <= this.#maxFailedOwners) return;
    const oldest = this.#failedOwners.keys().next().value;
    if (oldest !== undefined) this.#failedOwners.delete(oldest);
  }

  #normalizeMaxMemoryEntries(value: number | undefined): number {
    if (value === undefined || !Number.isFinite(value) || value < 1) return SD_CACHE_DEFAULT_MAX_MEMORY_ENTRIES;
    return Math.floor(value);
  }

  // why: Map giữ thứ tự chèn, nên delete-rồi-set đẩy key về cuối = "vừa dùng gần nhất".
  // Đây là toàn bộ cơ chế recency của LRU, không cần cấu trúc dữ liệu phụ.
  #touchMemoryEntry(ownerDigest: string, entry: SdCacheStoredValue<unknown>): void {
    this.#memoryEntries.delete(ownerDigest);
    this.#memoryEntries.set(ownerDigest, entry);
  }

  #evictMemoryOverflow(): void {
    while (this.#memoryEntries.size > this.#maxMemoryEntries) {
      const oldest = this.#memoryEntries.keys().next().value;
      if (oldest === undefined) return;
      this.#memoryEntries.delete(oldest);
    }
  }

  #cloneEntry(entry: SdCacheStoredValue<unknown>, serializer: SdPersistenceSerializer): SdCacheStoredValue<unknown> {
    return { data: serializer.clone(entry.data), createdOn: new Date(entry.createdOn) };
  }

  #cloneAs<T>(serializer: SdPersistenceSerializer, value: unknown): T {
    const entry = serializer.parse<SdCacheStoredValue<T>>(serializer.stringify({ data: value, createdOn: new Date(0) }));
    return entry.data;
  }

  #isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  #hasExactEntryKeys(value: unknown): value is Record<string, unknown> {
    return (
      this.#isRecord(value) &&
      Reflect.ownKeys(value).length === 2 &&
      Object.prototype.hasOwnProperty.call(value, 'data') &&
      Object.prototype.hasOwnProperty.call(value, 'createdOn')
    );
  }
}
