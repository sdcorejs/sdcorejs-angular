import { DestroyRef, inject, Injectable } from '@angular/core';
import {
  SD_PERSISTENCE_STORAGE_ADAPTER,
  SdGraphIdentityCanonicalizer,
  SdGraphSerializer,
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
import { SD_STORAGE_CONFIG, SdStorage, SdStorageOption, SdStorageWithDefault } from './storage.model';

interface StorageEntry {
  data: unknown;
  createdOn: Date;
}

type StorageEntryRead = { status: 'found'; entry: StorageEntry } | { status: 'absent' } | { status: 'unavailable' };

interface StorageHandleFacade {
  emit: (present: boolean, value: unknown) => void;
  complete: () => void;
}

interface StorageState {
  entry?: StorageEntry;
  hydrated: boolean;
  handles: Set<StorageHandleFacade>;
  disposed: boolean;
}

interface NormalizedStorageOption {
  area: SdPersistenceStorageArea;
  storageKey: string;
  legacyStorageKey?: string;
  ownerDigest: string;
  identityDigest: string;
  serializer: SdPersistenceSerializer;
}

interface StorageHandleOperations<T> {
  get: () => T | undefined;
  set: (data: T) => void;
  setSilent: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  destroy: () => void;
}

@Injectable({ providedIn: 'root' })
export class SdStorageService {
  readonly #configuration = inject(SD_STORAGE_CONFIG, { optional: true });
  readonly #adapter = inject(SD_PERSISTENCE_STORAGE_ADAPTER);
  readonly #destroyRef = inject(DestroyRef);
  readonly #defaultSerializer = new SdGraphSerializer();
  readonly #defaultIdentityCanonicalizer = new SdGraphIdentityCanonicalizer();
  readonly #states = new Map<string, StorageState>();
  readonly #failedOwners = new Map<string, true>();
  readonly #maxFailedOwners = 256;
  #destroyed = false;

  constructor() {
    this.#destroyRef.onDestroy(() => {
      this.#destroyed = true;
      for (const state of this.#states.values()) {
        state.disposed = true;
        state.entry = undefined;
        for (const handle of state.handles) handle.complete();
        state.handles.clear();
      }
      this.#states.clear();
      this.#failedOwners.clear();
    });
  }

  create<T>(key: string | object, option: SdStorageOption<T> & { default: T }): SdStorageWithDefault<T>;
  create<T = unknown>(key: string | object, option?: SdStorageOption<unknown>): SdStorage<T>;
  create<T = unknown>(key: string | object, option: SdStorageOption<T> = {}): SdStorage<T> | SdStorageWithDefault<T> {
    if (this.#destroyed) throw new Error('Storage service has been destroyed');
    if (!key) throw new Error('Key is required');
    const normalized = this.#normalize(key, option);
    const state = this.#getOrCreateState(normalized);
    if (Object.prototype.hasOwnProperty.call(option, 'default')) {
      return this.#createDefaultHandle(state, normalized, this.#cloneAs<T>(normalized.serializer, option.default));
    }
    return this.#createOptionalHandle<T>(state, normalized);
  }

  #getOrCreateState(normalized: NormalizedStorageOption): StorageState {
    const existing = this.#states.get(normalized.ownerDigest);
    if (existing) return existing;
    const state: StorageState = {
      hydrated: false,
      handles: new Set<StorageHandleFacade>(),
      disposed: false,
    };
    this.#states.set(normalized.ownerDigest, state);
    this.#hydrateState(state, normalized);
    return state;
  }

  #createOptionalHandle<T>(state: StorageState, normalized: NormalizedStorageOption): SdStorage<T> {
    const read = (): T | undefined => this.#readOptional<T>(state, normalized);
    const subject = new BehaviorSubject<T | undefined>(read());
    const facade: StorageHandleFacade = {
      emit: (present, value) => subject.next(present ? this.#cloneAs<T>(normalized.serializer, value) : undefined),
      complete: () => subject.complete(),
    };
    const operations = this.#attachHandle(state, normalized, facade, read);
    return { ...operations, subject, observer: subject.asObservable() };
  }

  #createDefaultHandle<T>(state: StorageState, normalized: NormalizedStorageOption, defaultSnapshot: T): SdStorageWithDefault<T> {
    const read = (): T => this.#readWithDefault(state, normalized, defaultSnapshot);
    const subject = new BehaviorSubject<T>(read());
    const facade: StorageHandleFacade = {
      emit: (present, value) => {
        const next = present ? this.#cloneAs<T>(normalized.serializer, value) : this.#cloneAs<T>(normalized.serializer, defaultSnapshot);
        subject.next(this.#cloneAs<T>(normalized.serializer, next));
      },
      complete: () => subject.complete(),
    };
    const operations = this.#attachHandle(state, normalized, facade, read);
    return { ...operations, get: read, subject, observer: subject.asObservable() };
  }

  #attachHandle<T>(
    state: StorageState,
    normalized: NormalizedStorageOption,
    facade: StorageHandleFacade,
    read: () => T | undefined
  ): StorageHandleOperations<T> {
    state.handles.add(facade);
    let active = true;
    const assertActive = (): void => {
      if (!active || state.disposed || this.#destroyed) throw new Error('Storage handle has been destroyed');
    };
    const get = (): T | undefined => {
      assertActive();
      return read();
    };
    const write = (data: T, emit: boolean): void => {
      assertActive();
      const entry: StorageEntry = { data: normalized.serializer.clone(data), createdOn: new Date() };
      state.entry = entry;
      state.hydrated = true;
      this.#writePersistent(normalized, entry);
      if (emit) this.#broadcast(state);
    };
    const set = (data: T): void => write(data, true);
    const setSilent = (data: T): void => write(data, false);
    const has = (): boolean => {
      assertActive();
      return this.#ensureEntry(state, normalized) !== undefined;
    };
    const remove = (): void => {
      assertActive();
      state.entry = undefined;
      state.hydrated = true;
      this.#writeTombstone(normalized);
      this.#broadcast(state);
    };
    const destroy = (): void => {
      if (!active) return;
      active = false;
      state.handles.delete(facade);
      facade.complete();
      if (state.handles.size > 0) return;
      state.disposed = true;
      state.entry = undefined;
      this.#states.delete(normalized.ownerDigest);
    };
    return { get, set, setSilent, has, remove, destroy };
  }

  #normalize<T>(key: string | object, option: SdStorageOption<T>): NormalizedStorageOption {
    const serializer = option.serializer ?? this.#configuration?.serializer ?? this.#defaultSerializer;
    const identityCanonicalizer =
      option.identityCanonicalizer ?? this.#configuration?.identityCanonicalizer ?? this.#defaultIdentityCanonicalizer;
    const canonicalKey = canonicalizeSdPersistenceValue(identityCanonicalizer, key, 'storage key');
    const legacyStorageKey = this.#legacyStorageKey(key);
    // why: KHÔNG có namespace mặc định. Một hằng số dùng chung cho cả thư viện (vd `'sdcorejs'`) không
    // tách được hai app chung origin — cả hai đều nhận đúng hằng số đó nên vẫn va nhau y như cũ — mà
    // lại đổi identity của MỌI handle đang chạy, khiến dữ liệu đã persist bị bỏ rơi khi nâng cấp.
    // Tách partition là việc của app: khai báo `namespace` per-handle hoặc qua `SD_STORAGE_CONFIG`.
    const namespace = option.namespace ?? this.#configuration?.namespace;
    const version = option.version ?? this.#configuration?.version;
    const area = option.type ?? 'local';
    const serializerFormat = this.#serializerFormat(serializer);
    const hasArgs = Object.prototype.hasOwnProperty.call(option, 'args');
    const hasDefault = Object.prototype.hasOwnProperty.call(option, 'default');
    const fields = [
      { tag: 'area', value: canonicalizeSdPersistenceValue(identityCanonicalizer, area, 'storage area') },
      { tag: 'namespace', value: this.#optionalIdentity(identityCanonicalizer, namespace !== undefined, namespace, 'storage namespace') },
      { tag: 'version', value: this.#optionalIdentity(identityCanonicalizer, version !== undefined, version, 'storage version') },
      { tag: 'args', value: this.#optionalIdentity(identityCanonicalizer, hasArgs, option.args, 'storage args') },
      { tag: 'default', value: this.#optionalIdentity(identityCanonicalizer, hasDefault, option.default, 'storage default') },
      { tag: 'serializer', value: serializerFormat },
      { tag: 'identityCanonicalizer', value: this.#identityCanonicalizerFormat(identityCanonicalizer) },
    ];
    const identity = buildSdPersistenceKey(canonicalKey, fields);
    const identityDigest = digestSdPersistenceKey(identity);
    const storageKey = this.#convertKey(`sdcorejs.storage@1:${identityDigest}`);
    const ownerDigest = digestSdPersistenceKey(buildSdPersistenceKey(storageKey, [{ tag: 'area', value: area }]));
    return {
      area,
      storageKey,
      legacyStorageKey,
      ownerDigest,
      identityDigest,
      serializer,
    };
  }

  #convertKey(baseKey: string): string {
    try {
      return this.#configuration?.key?.(baseKey) ?? baseKey;
    } catch {
      return baseKey;
    }
  }

  #legacyStorageKey(key: string | object): string | undefined {
    try {
      return this.#convertKey(typeof key === 'string' ? key : Utilities.hash(key));
    } catch {
      return undefined;
    }
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

  #readOptional<T>(state: StorageState, normalized: NormalizedStorageOption): T | undefined {
    const entry = this.#ensureEntry(state, normalized);
    return entry ? this.#cloneAs<T>(normalized.serializer, entry.data) : undefined;
  }

  #readWithDefault<T>(state: StorageState, normalized: NormalizedStorageOption, defaultSnapshot: T): T {
    const entry = this.#ensureEntry(state, normalized);
    return entry ? this.#cloneAs<T>(normalized.serializer, entry.data) : this.#cloneAs<T>(normalized.serializer, defaultSnapshot);
  }

  #ensureEntry(state: StorageState, normalized: NormalizedStorageOption): StorageEntry | undefined {
    if (!state.hydrated) {
      this.#hydrateState(state, normalized);
    }
    return state.entry;
  }

  #hydrateState(state: StorageState, normalized: NormalizedStorageOption): void {
    const read = this.#readEntry(normalized);
    state.entry = read.status === 'found' ? read.entry : undefined;
    state.hydrated = read.status !== 'unavailable';
  }

  #broadcast(state: StorageState): void {
    const present = state.entry !== undefined;
    const value = state.entry?.data;
    for (const handle of state.handles) handle.emit(present, value);
  }

  #readEntry(normalized: NormalizedStorageOption): StorageEntryRead {
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

  #parseCurrentEntry(payload: string, serializer: SdPersistenceSerializer): StorageEntry | undefined {
    try {
      return this.#validateEntry(serializer.parse<unknown>(payload));
    } catch {
      return undefined;
    }
  }

  #parseLegacy(raw: string): StorageEntry | undefined {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!this.#hasExactEntryKeys(parsed)) return undefined;
      const createdOn = this.#toValidDate(parsed['createdOn']);
      return createdOn ? { data: parsed['data'], createdOn } : undefined;
    } catch {
      return undefined;
    }
  }

  #validateEntry(value: unknown): StorageEntry | undefined {
    if (!this.#hasExactEntryKeys(value)) return undefined;
    const createdOn = this.#toValidDate(value['createdOn']);
    return createdOn ? { data: value['data'], createdOn } : undefined;
  }

  #toValidDate(value: unknown): Date | undefined {
    const date = value instanceof Date ? value : typeof value === 'string' || typeof value === 'number' ? new Date(value) : undefined;
    return date && Number.isFinite(date.getTime()) ? date : undefined;
  }

  #writePersistent(normalized: NormalizedStorageOption, entry: StorageEntry): boolean {
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
    this.#safeRemove(normalized.area, normalized.storageKey);
    if (this.#tryPersistTombstone(normalized)) {
      this.#clearFailedOwner(normalized.ownerDigest);
      return false;
    }
    this.#recordFailedOwner(normalized.ownerDigest);
    return false;
  }

  #safeRemove(area: SdPersistenceStorageArea, key: string): boolean {
    try {
      return this.#adapter.removeItem(area, key);
    } catch {
      return false;
    }
  }

  #writeTombstone(normalized: NormalizedStorageOption): boolean {
    if (this.#tryPersistTombstone(normalized)) {
      this.#clearFailedOwner(normalized.ownerDigest);
      return true;
    }
    this.#safeRemove(normalized.area, normalized.storageKey);
    this.#recordFailedOwner(normalized.ownerDigest);
    return false;
  }

  #tryPersistTombstone(normalized: NormalizedStorageOption): boolean {
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

  #cloneAs<T>(serializer: SdPersistenceSerializer, value: unknown): T {
    const entry = serializer.parse<{ data: T; createdOn: Date }>(serializer.stringify({ data: value, createdOn: new Date(0) }));
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
