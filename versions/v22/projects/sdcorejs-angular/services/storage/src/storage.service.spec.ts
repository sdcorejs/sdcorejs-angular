import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  SD_PERSISTENCE_STORAGE_ADAPTER,
  SdGraphSerializer,
  SdPersistenceIdentityCanonicalizer,
  SdPersistenceIdentityError,
  SdPersistenceSerializer,
  SdPersistenceStorageAdapter,
  SdPersistenceStorageArea,
} from '@sdcorejs/angular/services/persistence';
import { ISdStorageConfiguration, SD_STORAGE_CONFIG } from './storage.model';
import { SdStorageService } from './storage.service';

class FakeStorageAdapter implements SdPersistenceStorageAdapter {
  readonly local = new Map<string, string>();
  readonly session = new Map<string, string>();
  failGet = false;
  failSet = false;
  returnFalseSet = false;
  failRemove = false;
  maxValueLength?: number;
  readonly unavailableReads = new Map<string, number>();

  getItem(area: SdPersistenceStorageArea, key: string): string | null {
    if (this.failGet) throw new Error('get denied');
    const remaining = this.unavailableReads.get(key) ?? 0;
    if (remaining > 0) {
      this.unavailableReads.set(key, remaining - 1);
      throw new Error('temporarily denied');
    }
    return this.#area(area).get(key) ?? null;
  }

  setItem(area: SdPersistenceStorageArea, key: string, value: string): boolean {
    if (this.failSet) throw new Error('quota');
    if (this.returnFalseSet) return false;
    if (this.maxValueLength !== undefined && value.length > this.maxValueLength) return false;
    this.#area(area).set(key, value);
    return true;
  }

  removeItem(area: SdPersistenceStorageArea, key: string): boolean {
    if (this.failRemove) throw new Error('remove denied');
    this.#area(area).delete(key);
    return true;
  }

  #area(area: SdPersistenceStorageArea): Map<string, string> {
    return area === 'local' ? this.local : this.session;
  }
}

class PrefixSerializer implements SdPersistenceSerializer {
  readonly format = 'test.storage@1';
  readonly #graph = new SdGraphSerializer();

  stringify<T>(value: T): string {
    return `storage:${this.#graph.stringify(value)}`;
  }

  parse<T = unknown>(serialized: string): T {
    if (!serialized.startsWith('storage:')) throw new Error('invalid prefix');
    return this.#graph.parse<T>(serialized.slice(8));
  }

  clone<T>(value: T): T {
    return this.#graph.clone(value);
  }
}

class UrlSerializer implements SdPersistenceSerializer {
  readonly format = 'test.storage-url@1';

  stringify<T>(value: T): string {
    return JSON.stringify(this.#encode(value));
  }

  parse<T = unknown>(serialized: string): T {
    return this.#decode(JSON.parse(serialized) as unknown) as T;
  }

  clone<T>(value: T): T {
    return this.parse<T>(this.stringify(value));
  }

  #encode(value: unknown): unknown {
    if (value instanceof URL) return { $url: value.href };
    if (value instanceof Date) return { $date: value.toISOString() };
    if (Array.isArray(value)) return value.map(item => this.#encode(item));
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.#encode(item)]));
    }
    return value;
  }

  #decode(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(item => this.#decode(item));
    if (typeof value !== 'object' || value === null) return value;
    if (Object.keys(value).length === 1 && typeof Reflect.get(value, '$url') === 'string') {
      return new URL(Reflect.get(value, '$url'));
    }
    if (Object.keys(value).length === 1 && typeof Reflect.get(value, '$date') === 'string') {
      return new Date(Reflect.get(value, '$date'));
    }
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.#decode(item)]));
  }
}

class UrlIdentityCanonicalizer implements SdPersistenceIdentityCanonicalizer {
  readonly format = 'test.storage-url-identity@1';
  readonly #serializer = new UrlSerializer();

  canonicalize(value: unknown): string {
    return this.#serializer.stringify(value);
  }
}

class RandomIvSerializer implements SdPersistenceSerializer {
  readonly format = 'test.storage-random-iv@1';
  readonly #graph = new SdGraphSerializer();
  #iv = 0;

  stringify<T>(value: T): string {
    this.#iv += 1;
    return `${this.#iv}:${this.#graph.stringify(value)}`;
  }

  parse<T = unknown>(serialized: string): T {
    return this.#graph.parse<T>(serialized.slice(serialized.indexOf(':') + 1));
  }

  clone<T>(value: T): T {
    return this.#graph.clone(value);
  }
}

class SentinelSerializer implements SdPersistenceSerializer {
  readonly format = 'test.storage-sentinel@1';
  readonly #graph = new SdGraphSerializer();

  stringify<T>(_value: T): string {
    return '{"format":"sdcorejs.persistence-tombstone","version":1}';
  }

  parse<T = unknown>(_serialized: string): T {
    return this.#graph.parse<T>(this.#graph.stringify({ data: 'sentinel-value', createdOn: new Date('2026-07-22T00:00:00.000Z') }));
  }

  clone<T>(value: T): T {
    return this.#graph.clone(value);
  }
}

class InheritedEntrySerializer implements SdPersistenceSerializer {
  readonly format = 'test.storage-inherited-entry@1';
  readonly #graph = new SdGraphSerializer();

  stringify<T>(_value: T): string {
    return '{}';
  }

  parse<T = unknown>(_serialized: string): T {
    const value = Object.create({ data: 'inherited', createdOn: new Date() }) as Record<string, unknown>;
    value['first'] = true;
    value['second'] = true;
    return value as T;
  }

  clone<T>(value: T): T {
    return this.#graph.clone(value);
  }
}

class ExtraOwnKeyEntrySerializer implements SdPersistenceSerializer {
  readonly format: string;
  readonly #graph = new SdGraphSerializer();

  constructor(readonly extra: 'symbol' | 'hidden') {
    this.format = `test.storage-extra-own-entry.${extra}@1`;
  }

  stringify<T>(_value: T): string {
    return '{}';
  }

  parse<T = unknown>(_serialized: string): T {
    const value: Record<PropertyKey, unknown> = { data: 'unexpected', createdOn: new Date() };
    if (this.extra === 'symbol') value[Symbol('extra')] = true;
    else Object.defineProperty(value, 'extra', { enumerable: false, value: true });
    return value as T;
  }

  clone<T>(value: T): T {
    return this.#graph.clone(value);
  }
}

describe('SdStorageService', () => {
  let adapter: FakeStorageAdapter;

  function configure(configuration?: ISdStorageConfiguration): SdStorageService {
    adapter = new FakeStorageAdapter();
    const providers: Provider[] = [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }];
    if (configuration) providers.push({ provide: SD_STORAGE_CONFIG, useValue: configuration });
    TestBed.configureTestingModule({ providers });
    return TestBed.inject(SdStorageService);
  }

  afterEach(() => TestBed.resetTestingModule());

  function restart(configuration?: ISdStorageConfiguration): SdStorageService {
    TestBed.resetTestingModule();
    const providers: Provider[] = [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }];
    if (configuration) providers.push({ provide: SD_STORAGE_CONFIG, useValue: configuration });
    TestBed.configureTestingModule({ providers });
    return TestBed.inject(SdStorageService);
  }

  it('preserves default/get/has/remove/observer and object-key behavior', () => {
    const service = configure();
    expect(() => service.create('')).toThrowError('Key is required');
    const first = service.create<string>({ entity: 'user', id: 1 }, { default: 'default' });
    const second = service.create<string>({ entity: 'user', id: 2 });
    const emissions: (string | undefined)[] = [];
    first.observer.subscribe(value => emissions.push(value));
    expect(first.get()).toBe('default');
    expect(first.has()).toBeFalse();
    first.set('first');
    second.set('second');
    expect(first.get()).toBe('first');
    expect(second.get()).toBe('second');
    first.remove();
    expect(first.has()).toBeFalse();
    expect(first.get()).toBe('default');
    expect(emissions).toEqual(['default', 'first', 'default']);
  });

  it('persists cyclic object keys without requiring a representable legacy hash', () => {
    let service = configure();
    const key: Record<string, unknown> = { entity: 'cyclic-storage-key' };
    key['self'] = key;
    const storage = service.create<string>(key);
    storage.set('value');
    expect(storage.get()).toBe('value');
    expect(adapter.local.size).toBe(1);
    storage.destroy();

    service = restart();
    expect(service.create<string>(key).get()).toBe('value');
  });

  it('round-trips graph values with cycles/shared references and clone isolation', () => {
    const service = configure();
    const storage = service.create<Record<string, unknown>>('graph');
    const shared = { value: 1 };
    const source: Record<string, unknown> = {
      date: new Date('2026-07-21T00:00:00.000Z'),
      map: new Map([['shared', shared]]),
      set: new Set([shared]),
      shared,
    };
    source['self'] = source;
    storage.set(source);

    const cloned = storage.get();
    if (!cloned) throw new Error('Expected graph storage value');
    expect(cloned).not.toBe(source);
    expect(cloned['self']).toBe(cloned);
    expect((cloned['map'] as Map<string, unknown>).get('shared')).toBe(cloned['shared']);
    expect(Array.from(cloned['set'] as Set<unknown>)[0]).toBe(cloned['shared']);
  });

  it('keeps corresponding object keys from the known legacy hash collision independent across recreation', () => {
    let service = configure();
    const firstKey = { key: 'xlzbiev2kjhp' };
    const secondKey = { key: 'x2e3c01io76tb' };
    const first = service.create<string>(firstKey);
    const second = service.create<string>(secondKey);
    first.set('first');
    second.set('second');
    expect(first.get()).toBe('first');
    expect(second.get()).toBe('second');
    expect(adapter.local.size).toBe(2);
    first.destroy();
    second.destroy();

    service = restart();
    expect(service.create<string>(firstKey).get()).toBe('first');
    expect(service.create<string>(secondKey).get()).toBe('second');
  });

  it('uses a fixed-length private primary key and a service-owned value envelope', () => {
    const service = configure();
    const storage = service.create<string>('private-key', {
      args: { token: 'args-secret' },
      default: 'default-secret',
    });
    storage.set('payload-secret');

    const [physicalKey] = Array.from(adapter.local.keys());
    expect(physicalKey).toMatch(/^sdcorejs\.storage@1:[a-f0-9]{64}$/);
    expect(physicalKey).not.toContain('args-secret');
    expect(physicalKey).not.toContain('default-secret');
    const envelope = JSON.parse(adapter.local.get(physicalKey) ?? '{}') as Record<string, unknown>;
    expect(envelope).toEqual(
      jasmine.objectContaining({
        format: 'sdcorejs.persistence-envelope',
        version: 1,
        kind: 'value',
        serializer: 'sdcorejs.graph@1',
      })
    );
    expect(envelope['identity']).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof envelope['payload']).toBe('string');
  });

  it('keeps a custom payload equal to the old raw tombstone distinct from an outer tombstone', () => {
    let service = configure();
    const storage = service.create<string>('sentinel-payload', { serializer: new SentinelSerializer() });
    storage.set('runtime-value');
    const [physicalKey] = Array.from(adapter.local.keys());
    expect(adapter.local.get(physicalKey)).not.toBe('{"format":"sdcorejs.persistence-tombstone","version":1}');
    storage.destroy();

    service = restart();
    const reloaded = service.create<string>('sentinel-payload', { serializer: new SentinelSerializer() });
    expect(reloaded.get()).toBe('sentinel-value');
    reloaded.remove();
    const envelope = JSON.parse(adapter.local.get(physicalKey) ?? '{}') as Record<string, unknown>;
    expect(envelope['kind']).toBe('tombstone');
  });

  it('uses only pre-Task4 JSON as legacy fallback and never imports a graph value from the old base', () => {
    let service = configure();
    adapter.local.set('legacy-json-only', JSON.stringify({ data: 'legacy-json', createdOn: '2026-07-22T00:00:00.000Z' }));
    expect(service.create<string>('legacy-json-only', { args: { page: 1 } }).get()).toBe('legacy-json');

    service = restart();
    adapter.local.set(
      'current-graph-is-not-legacy',
      new SdGraphSerializer().stringify({ data: 'must-not-import', createdOn: new Date('2026-07-22T00:00:00.000Z') })
    );
    expect(service.create<string>('current-graph-is-not-legacy', { args: { page: 1 } }).has()).toBeFalse();
    expect(adapter.local.get('current-graph-is-not-legacy')).toContain('must-not-import');
  });

  it('removes only the failed variant primary while preserving its shared legacy owner', () => {
    const service = configure();
    adapter.local.set('false-tombstone', JSON.stringify({ data: 'legacy', createdOn: '2026-07-22T00:00:00.000Z' }));
    const storage = service.create<string>('false-tombstone', { args: { page: 1 } });
    expect(storage.get()).toBe('legacy');
    adapter.returnFalseSet = true;
    storage.remove();
    adapter.returnFalseSet = false;
    expect(adapter.local.has('false-tombstone')).toBeTrue();
    expect(adapter.local.size).toBe(1);

    storage.destroy();
    expect(service.create<string>('false-tombstone', { args: { page: 1 } }).has()).toBeFalse();
    expect(service.create<string>('false-tombstone').get()).toBe('legacy');
  });

  it('keeps set and setSilent emission semantics', () => {
    const service = configure();
    const storage = service.create<number>('emissions');
    const emissions: (number | undefined)[] = [];
    storage.subject.subscribe(value => emissions.push(value));
    storage.setSilent(1);
    storage.set(2);
    expect(emissions).toEqual([undefined, 2]);
    expect(storage.get()).toBe(2);
  });

  it('uses one non-optional BehaviorSubject for a default handle subject and observer', () => {
    const service = configure();
    const storage = service.create<string>('default-subject', { default: 'fallback' });
    const subjectValues: string[] = [];
    const observerValues: string[] = [];
    storage.subject.subscribe(value => subjectValues.push(value));
    storage.observer.subscribe(value => observerValues.push(value));

    storage.subject.next('direct');

    expect(subjectValues).toEqual(['fallback', 'direct']);
    expect(observerValues).toEqual(['fallback', 'direct']);
  });

  it('clones the initial subject value away from persistent state', () => {
    const service = configure();
    const seed = service.create<{ nested: { count: number } }>('initial-clone');
    seed.set({ nested: { count: 1 } });
    seed.destroy();
    const reloaded = service.create<{ nested: { count: number } }>('initial-clone');
    const subjectValue = reloaded.subject.value;
    expect(subjectValue).toBeDefined();
    if (subjectValue) subjectValue.nested.count = 99;
    expect(reloaded.get()).toEqual({ nested: { count: 1 } });
  });

  it('preserves persisted null instead of replacing it with a default', () => {
    let service = configure();
    const storage = service.create<string | null>('persisted-null', { default: 'fallback' });
    storage.set(null);
    expect(storage.has()).toBeTrue();
    expect(storage.get()).toBeNull();
    storage.destroy();

    service = restart();
    const reloaded = service.create<string | null>('persisted-null', { default: 'fallback' });
    expect(reloaded.has()).toBeTrue();
    expect(reloaded.get()).toBeNull();
  });

  it('snapshots and clones defaults, get results, subjects, and observer emissions', () => {
    const service = configure();
    const sourceDefault = { nested: { count: 1 } };
    const storage = service.create<{ nested: { count: number } }>('default-clones', { default: sourceDefault });
    sourceDefault.nested.count = 99;
    const first = storage.get();
    first.nested.count = 50;
    expect(storage.get()).toEqual({ nested: { count: 1 } });
    const subjectValue = storage.subject.value;
    if (!subjectValue) throw new Error('Expected default subject value');
    subjectValue.nested.count = 75;
    expect(storage.get()).toEqual({ nested: { count: 1 } });
    const emissions: { nested: { count: number } }[] = [];
    storage.observer.subscribe(value => emissions.push(value));
    emissions[0].nested.count = 80;
    expect(storage.get()).toEqual({ nested: { count: 1 } });
    storage.set({ nested: { count: 2 } });
    emissions[1].nested.count = 88;
    expect(storage.get()).toEqual({ nested: { count: 2 } });
    storage.remove();
    expect(emissions[2]).toEqual({ nested: { count: 1 } });
  });

  it('shares identical state while isolating local/session/options identities', () => {
    const service = configure();
    const one = service.create<string>('same');
    const two = service.create<string>('same', { type: 'local' });
    const session = service.create<string>('same', { type: 'session' });
    const namespaced = service.create<string>('same', { namespace: 'app' });
    const args = service.create<string>('same', { args: { view: 1 } });
    one.set('shared-local');
    expect(two.get()).toBe('shared-local');
    session.set('session');
    namespaced.set('namespace');
    args.set('args');
    expect(one.get()).toBe('shared-local');
    expect(session.get()).toBe('session');
    expect(namespaced.get()).toBe('namespace');
    expect(args.get()).toBe('args');
  });

  // why: `namespace` KHÔNG có default. Ba spec dưới khoá lại điều đó: một hằng số dùng chung cho cả
  // thư viện không tách được hai app chung origin (cả hai đều nhận cùng hằng số), nó chỉ đổi identity
  // của mọi handle đang chạy và bỏ rơi dữ liệu đã persist. Tách partition là việc của app.
  it('keeps a handle without namespace on its original identity — no implicit namespace is folded in', () => {
    let service = configure();
    service.create<string>('shared-key').set('written-without-namespace');
    const storedKey = Array.from(adapter.local.keys())[0];

    // Sau khi restart, handle KHÔNG namespace phải đọc lại đúng giá trị cũ dưới đúng key cũ.
    service = restart();
    expect(service.create<string>('shared-key').get()).toBe('written-without-namespace');
    expect(Array.from(adapter.local.keys())).toEqual([storedKey]);

    // Và bất kỳ namespace tường minh nào cũng phải là partition KHÁC, kể cả tên của thư viện.
    const namespaced = service.create<string>('shared-key', { namespace: 'sdcorejs' });
    expect(namespaced.get()).toBeUndefined();
    namespaced.set('written-with-namespace');
    expect(new Set(adapter.local.keys()).size).toBe(2);
    expect(service.create<string>('shared-key').get()).toBe('written-without-namespace');
  });

  it('isolates two apps on the same origin that share a logical key but declare different namespaces', () => {
    const service = configure();
    const appA = service.create<string>('user-preferences', { namespace: 'app-a' });
    const appB = service.create<string>('user-preferences', { namespace: 'app-b' });
    appA.set('theme-dark');
    appB.set('theme-light');
    expect(appA.get()).toBe('theme-dark');
    expect(appB.get()).toBe('theme-light');
    expect(new Set(adapter.local.keys()).size).toBe(2);
  });

  it('lets SD_STORAGE_CONFIG.namespace partition every handle of the app at once', () => {
    const service = configure({ namespace: 'portal' });
    service.create<string>('shared-key').set('from-portal');
    const defaulted = restart();
    expect(defaulted.create<string>('shared-key').get()).toBeUndefined();
    const portal = restart({ namespace: 'portal' });
    expect(portal.create<string>('shared-key').get()).toBe('from-portal');
  });

  it('persists canonical policy variants under collision-free keys and reloads each independently', () => {
    let service = configure();
    const variants = [
      { option: { args: { page: 1 } }, value: 'args-1' },
      { option: { args: { page: 2 } }, value: 'args-2' },
      { option: { default: 'one' }, value: 'default-1' },
      { option: { default: 'two' }, value: 'default-2' },
      { option: { namespace: 'x' }, value: 'namespace' },
      { option: { version: 'x' }, value: 'version' },
      { option: { namespace: '' }, value: 'empty-namespace' },
      { option: { version: '' }, value: 'empty-version' },
      { option: { namespace: 'a:b', version: 'c' }, value: 'colon-left' },
      { option: { namespace: 'a', version: 'b:c' }, value: 'colon-right' },
      { option: { serializer: new PrefixSerializer() }, value: 'serializer' },
    ];
    variants.forEach(variant => service.create<string>('canonical', variant.option).set(variant.value));
    expect(new Set(adapter.local.keys()).size).toBe(variants.length);

    service = restart();
    variants.forEach(variant => {
      const option = variant.value === 'serializer' ? { ...variant.option, serializer: new PrefixSerializer() } : variant.option;
      expect(service.create<string>('canonical', option).get()).toBe(variant.value);
    });
  });

  it('keeps the default base owner when a custom args variant is removed across recreation', () => {
    let service = configure();
    const defaultStorage = service.create<string>('coexisting-owners');
    const variant = service.create<string>('coexisting-owners', {
      args: { view: 1 },
      serializer: new PrefixSerializer(),
    });
    defaultStorage.set('default-A');
    const defaultPrimaryKey = Array.from(adapter.local.keys())[0];
    variant.set('variant-B');
    variant.remove();
    expect(adapter.local.has(defaultPrimaryKey)).toBeTrue();

    service = restart();
    expect(service.create<string>('coexisting-owners').get()).toBe('default-A');
    expect(
      service
        .create<string>('coexisting-owners', {
          args: { view: 1 },
          serializer: new PrefixSerializer(),
        })
        .has()
    ).toBeFalse();
    expect(adapter.local.has(defaultPrimaryKey)).toBeTrue();
  });

  it('tombstones a corrupt canonical variant without falling back to or mutating its base owner', () => {
    let service = configure();
    const defaultStorage = service.create<string>('corrupt-canonical-owner');
    const variant = service.create<string>('corrupt-canonical-owner', { args: { view: 1 } });
    defaultStorage.set('default-A');
    variant.set('variant-B');
    const [defaultPrimaryKey, variantPrimaryKey] = Array.from(adapter.local.keys());
    expect(variantPrimaryKey).toBeDefined();
    defaultStorage.destroy();
    variant.destroy();
    adapter.local.set(variantPrimaryKey, 'corrupt');

    service = restart();
    expect(service.create<string>('corrupt-canonical-owner', { args: { view: 1 } }).has()).toBeFalse();
    expect(service.create<string>('corrupt-canonical-owner').get()).toBe('default-A');
    expect(adapter.local.get(defaultPrimaryKey)).toContain('default-A');
    expect(adapter.local.get(variantPrimaryKey)).toContain('"kind":"tombstone"');

    service = restart();
    expect(service.create<string>('corrupt-canonical-owner', { args: { view: 1 } }).has()).toBeFalse();
    expect(adapter.local.get(defaultPrimaryKey)).toContain('default-A');
  });

  it('leaves an invalid base fallback owned by the default policy and tombstones the variant', () => {
    let service = configure();
    adapter.local.set('invalid-fallback-owner', 'corrupt');

    expect(service.create<string>('invalid-fallback-owner', { args: { view: 1 } }).has()).toBeFalse();
    expect(adapter.local.get('invalid-fallback-owner')).toBe('corrupt');
    expect(Array.from(adapter.local.values()).some(value => value.includes('"kind":"tombstone"'))).toBeTrue();

    service = restart();
    expect(service.create<string>('invalid-fallback-owner', { args: { view: 1 } }).has()).toBeFalse();
    expect(adapter.local.get('invalid-fallback-owner')).toBe('corrupt');
  });

  it('migrates a non-default policy from the old base key once without later resurrection', () => {
    let service = configure();
    const legacyKey = 'policy-migration';
    adapter.local.set(legacyKey, JSON.stringify({ data: 'legacy-value', createdOn: '2026-07-22T00:00:00.000Z' }));
    const migrated = service.create<string>('policy-migration', { args: { view: 1 } });
    expect(migrated.get()).toBe('legacy-value');
    const canonicalKey = Array.from(adapter.local.keys()).find(key => key !== legacyKey);
    expect(canonicalKey).toBeDefined();
    expect(canonicalKey).not.toBe(legacyKey);
    expect(adapter.local.has(legacyKey)).toBeTrue();
    migrated.remove();

    service = restart();
    expect(service.create<string>('policy-migration', { args: { view: 1 } }).has()).toBeFalse();
    expect(service.create<string>('policy-migration').get()).toBe('legacy-value');
    expect(adapter.local.has(legacyKey)).toBeTrue();
  });

  it('uses a canonical tombstone when legacy cleanup is denied', () => {
    let service = configure();
    adapter.local.set('denied-migration', JSON.stringify({ data: 'legacy-value', createdOn: '2026-07-22T00:00:00.000Z' }));
    adapter.failRemove = true;
    const migrated = service.create<string>('denied-migration', { args: { view: 1 } });
    expect(migrated.get()).toBe('legacy-value');
    migrated.remove();
    adapter.failRemove = false;

    service = restart();
    expect(service.create<string>('denied-migration', { args: { view: 1 } }).has()).toBeFalse();
    expect(service.create<string>('denied-migration').get()).toBe('legacy-value');
  });

  it('fails create deterministically when policy identity cannot be canonicalized', () => {
    const service = configure();
    expect(() => service.create('unsupported-policy', { args: { callback: () => undefined } })).toThrowError(SdPersistenceIdentityError);
  });

  it('uses configuration key plus namespace/version and migrates a legacy value in place', () => {
    const service = configure({ key: key => `configured:${key}` });
    const legacyKey = 'configured:legacy';
    adapter.local.set(legacyKey, JSON.stringify({ data: { migrated: true }, createdOn: '2026-07-21T00:00:00Z' }));

    expect(service.create<{ migrated: boolean }>('legacy', { namespace: 'app', version: '2' }).get()).toEqual({
      migrated: true,
    });
    const primaryKey = Array.from(adapter.local.keys()).find(key => key !== legacyKey);
    expect(primaryKey).toMatch(/^configured:sdcorejs\.storage@1:[a-f0-9]{64}$/);
    expect(adapter.local.get(primaryKey!)).toContain('sdcorejs.graph');
    expect(adapter.local.has(legacyKey)).toBeTrue();
  });

  it('consumes configuration namespace/version/serializer and isolates serializer identities', () => {
    const serializer = new PrefixSerializer();
    const service = configure({
      key: key => `configured:${key}`,
      namespace: 'app',
      version: 5,
      serializer,
    });
    const configured = service.create<{ date: Date }>('configured');
    const otherSerializer = service.create<string>('configured', { serializer: new SdGraphSerializer() });
    configured.set({ date: new Date('2026-07-21T00:00:00.000Z') });
    expect(Array.from(adapter.local.values()).some(value => value.includes('storage:'))).toBeTrue();
    otherSerializer.set('other');

    expect(configured.get()).toEqual({ date: new Date('2026-07-21T00:00:00.000Z') });
    expect(otherSerializer.get()).toBe('other');
    expect(adapter.local.size).toBe(2);
  });

  it('removes corrupt persistence and tolerates absent/throwing storage operations', () => {
    let service = configure();
    const seed = service.create<string>('corrupt');
    seed.set('seed');
    const storageKey = Array.from(adapter.local.keys())[0];
    seed.destroy();
    adapter.local.set(storageKey, 'corrupt');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }] });
    service = TestBed.inject(SdStorageService);
    expect(service.create<string>('corrupt').get()).toBeUndefined();
    expect(adapter.local.get(storageKey)).toContain('"kind":"tombstone"');

    adapter.failSet = true;
    const guarded = service.create<string>('guarded');
    guarded.set('memory');
    expect(guarded.get()).toBe('memory');
    adapter.failSet = false;
    adapter.failGet = true;
    expect(service.create<string>('absent', { default: 'fallback' }).get()).toBe('fallback');
    adapter.failGet = false;
    adapter.failRemove = true;
    expect(() => guarded.remove()).not.toThrow();
    expect(guarded.has()).toBeFalse();
  });

  it('falls back to the original key when configuration key conversion throws', () => {
    const service = configure({
      key: () => {
        throw new Error('key conversion');
      },
    });
    const storage = service.create<string>('fallback-key');
    storage.set('value');
    expect(Array.from(adapter.local.keys())[0]).toMatch(/^sdcorejs\.storage@1:[a-f0-9]{64}$/);
    expect(storage.get()).toBe('value');
  });

  it('quarantines a stale canonical value after a replacement write fails', () => {
    const service = configure();
    const storage = service.create<string>('failed-value-write');
    storage.set('A');
    const primaryKey = Array.from(adapter.local.keys())[0];
    expect(adapter.local.get(primaryKey)).toContain('A');

    adapter.failSet = true;
    storage.set('B');
    adapter.failSet = false;
    expect(storage.get()).toBe('B');
    expect(adapter.local.has(primaryKey)).toBeFalse();

    storage.destroy();
    expect(service.create<string>('failed-value-write').has()).toBeFalse();
  });

  it('routes the final opaque storage key through the configured converter', () => {
    const converted: string[] = [];
    const service = configure({
      key: key => {
        converted.push(key);
        return `tenant-a:${key}`;
      },
    });
    service.create<string>('private-secret-storage-key').set('value');

    const rawPrimary = converted.find(key => /^sdcorejs\.storage@1:[a-f0-9]{64}$/.test(key));
    expect(rawPrimary).toBeDefined();
    expect(rawPrimary).not.toContain('private-secret-storage-key');
    expect(Array.from(adapter.local.keys())).toContain(`tenant-a:${rawPrimary}`);
  });

  it('uses the selected custom serializer for URL-bearing policy identity across restart', () => {
    const serializer = new UrlSerializer();
    const identityCanonicalizer = new UrlIdentityCanonicalizer();
    let service = configure();
    service
      .create<string>('url-policy', {
        args: { endpoint: new URL('https://example.test/one') },
        serializer,
        identityCanonicalizer,
      })
      .set('one');
    service
      .create<string>('url-policy', {
        args: { endpoint: new URL('https://example.test/two') },
        serializer,
        identityCanonicalizer,
      })
      .set('two');
    expect(adapter.local.size).toBe(2);

    service = restart();
    expect(
      service
        .create<string>('url-policy', {
          args: { endpoint: new URL('https://example.test/one') },
          serializer,
          identityCanonicalizer,
        })
        .get()
    ).toBe('one');
    expect(
      service
        .create<string>('url-policy', {
          args: { endpoint: new URL('https://example.test/two') },
          serializer,
          identityCanonicalizer,
        })
        .get()
    ).toBe('two');
  });

  it('uses deterministic identity independently from a randomized payload serializer', () => {
    const serializer = new RandomIvSerializer();
    let service = configure();
    service.create<string>('randomized-payload', { args: { page: 1 }, serializer }).set('stable');

    service = restart();
    expect(service.create<string>('randomized-payload', { args: { page: 1 }, serializer }).get()).toBe('stable');
  });

  it('persists a tombstone after a rejected replacement value so legacy data cannot resurrect after restart', () => {
    adapter = new FakeStorageAdapter();
    adapter.local.set('rejected-replacement', JSON.stringify({ data: 'A', createdOn: '2026-07-22T00:00:00.000Z' }));
    TestBed.configureTestingModule({ providers: [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }] });
    let service = TestBed.inject(SdStorageService);
    const storage = service.create<string>('rejected-replacement', { args: { page: 1 } });
    expect(storage.get()).toBe('A');

    adapter.maxValueLength = 500;
    const replacement = 'B'.repeat(2000);
    storage.set(replacement);
    expect(storage.get()).toBe(replacement);
    const primaryKey = Array.from(adapter.local.keys()).find(key => key !== 'rejected-replacement');
    expect(adapter.local.get(primaryKey!)).toContain('"kind":"tombstone"');

    service = restart();
    expect(service.create<string>('rejected-replacement', { args: { page: 1 } }).has()).toBeFalse();
    expect(adapter.local.get('rejected-replacement')).toContain('A');
  });

  it('persists and reopens a graph payload near the escaped outer-envelope capacity', () => {
    let service = configure();
    const value = Array.from({ length: 4 }, () => '"'.repeat(450_000));
    const storage = service.create<string[]>('escaped-capacity');
    storage.set(value);
    expect(Array.from(adapter.local.values())[0]?.length).toBeGreaterThan(3_600_000);

    service = restart();
    expect(service.create<string[]>('escaped-capacity').get()).toEqual(value);
  });

  it('isolates live storage state by the final converted physical owner', () => {
    let tenant = 'tenant-a';
    const service = configure({ key: key => `${tenant}:${key}` });
    const first = service.create<string>('dynamic-tenant-owner');
    first.set('A');

    tenant = 'tenant-b';
    const second = service.create<string>('dynamic-tenant-owner');
    expect(second.has()).toBeFalse();
    second.set('B');
    expect(second.get()).toBe('B');
    expect(first.get()).toBe('A');
  });

  it('provides idempotent lease-safe destroy and completes after the final lease', () => {
    const service = configure();
    const one = service.create<number>('destroy');
    const two = service.create<number>('destroy');
    let completed = false;
    one.observer.subscribe({ complete: () => (completed = true) });
    one.destroy();
    expect(completed).toBeTrue();
    expect(() => one.get()).toThrowError('Storage handle has been destroyed');
    two.set(2);
    expect(two.get()).toBe(2);
    two.destroy();
    two.destroy();
  });

  it('guards every operation after handle destroy and completes late subject subscriptions immediately', () => {
    const service = configure();
    const storage = service.create<string>('destroyed-operations');
    storage.set('value');
    storage.destroy();
    let completed = false;
    storage.subject.subscribe({ complete: () => (completed = true) });
    expect(completed).toBeTrue();
    expect(() => storage.get()).toThrowError('Storage handle has been destroyed');
    expect(() => storage.has()).toThrowError('Storage handle has been destroyed');
    expect(() => storage.set('late')).toThrowError('Storage handle has been destroyed');
    expect(() => storage.setSilent('late')).toThrowError('Storage handle has been destroyed');
    expect(() => storage.remove()).toThrowError('Storage handle has been destroyed');
  });

  it('rejects current entries whose data and createdOn fields are inherited', () => {
    const serializer = new InheritedEntrySerializer();
    let service = configure();
    const seed = service.create<string>('inherited-entry', { serializer });
    seed.set('seed');
    const primaryKey = Array.from(adapter.local.keys())[0];
    seed.destroy();

    service = restart();
    expect(service.create<string>('inherited-entry', { serializer }).has()).toBeFalse();
    expect(adapter.local.get(primaryKey)).toContain('"kind":"tombstone"');
  });

  for (const extra of ['symbol', 'hidden'] as const) {
    it(`rejects a current entry with an extra own ${extra} key`, () => {
      const serializer = new ExtraOwnKeyEntrySerializer(extra);
      let service = configure();
      const seed = service.create<string>(`extra-own-${extra}`, { serializer });
      seed.set('seed');
      const primaryKey = Array.from(adapter.local.keys())[0];
      seed.destroy();

      service = restart();
      expect(service.create<string>(`extra-own-${extra}`, { serializer }).has()).toBeFalse();
      expect(adapter.local.get(primaryKey)).toContain('"kind":"tombstone"');
    });
  }

  it('does not fall back to legacy when a canonical read is temporarily unavailable and later recovers the canonical value', () => {
    let service = configure();
    const seed = service.create<string>('unavailable-primary', { args: { page: 1 } });
    seed.set('B');
    const primaryKey = Array.from(adapter.local.keys())[0];
    seed.destroy();
    adapter.local.set('unavailable-primary', JSON.stringify({ data: 'A', createdOn: '2026-07-22T00:00:00.000Z' }));

    service = restart();
    adapter.unavailableReads.set(primaryKey, 2);
    const recovered = service.create<string>('unavailable-primary', { args: { page: 1 } });
    expect(recovered.get()).toBe('B');
    expect(adapter.local.get(primaryKey)).toContain('B');
    expect(adapter.local.get('unavailable-primary')).toContain('A');
  });

  it('bounds failed-owner quarantine with deterministic oldest-first eviction', () => {
    const service = configure();
    adapter.returnFalseSet = true;
    for (let index = 0; index < 257; index += 1) {
      const handle = service.create<string>(`failed-owner-${index}`);
      handle.set('B');
      handle.destroy();
    }
    adapter.returnFalseSet = false;
    adapter.local.set('failed-owner-0', JSON.stringify({ data: 'oldest', createdOn: '2026-07-22T00:00:00.000Z' }));
    adapter.local.set('failed-owner-256', JSON.stringify({ data: 'newest', createdOn: '2026-07-22T00:00:00.000Z' }));

    expect(service.create<string>('failed-owner-0').get()).toBe('oldest');
    expect(service.create<string>('failed-owner-256').has()).toBeFalse();
  });

  it('completes live subjects and observers when the service injector is destroyed', () => {
    let service = configure();
    const storage = service.create<string>('injector-destroy');
    let subjectCompleted = false;
    let observerCompleted = false;
    storage.subject.subscribe({ complete: () => (subjectCompleted = true) });
    storage.observer.subscribe({ complete: () => (observerCompleted = true) });
    TestBed.resetTestingModule();
    expect(subjectCompleted).toBeTrue();
    expect(observerCompleted).toBeTrue();

    TestBed.configureTestingModule({ providers: [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }] });
    service = TestBed.inject(SdStorageService);
    expect(service.create<string>('independent').has()).toBeFalse();
  });
});
