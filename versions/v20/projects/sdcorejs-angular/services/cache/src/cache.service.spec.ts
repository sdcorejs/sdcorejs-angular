import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  SD_PERSISTENCE_STORAGE_ADAPTER,
  SD_PERSISTENCE_ENVELOPE_HARD_LIMITS,
  SdGraphSerializer,
  SdPersistenceIdentityCanonicalizer,
  SdPersistenceIdentityError,
  SdPersistenceSerializer,
  SdPersistenceStorageAdapter,
  SdPersistenceStorageArea,
} from '@sdcorejs/angular/services/persistence';
import { Utilities } from '@sdcorejs/utils/fns';
import { ISdCacheConfiguration, SD_CACHE_CONFIG, SdCache, SdCacheOption, adaptLegacySdCacheCallbacks } from './cache.model';
import { SdCacheService } from './cache.service';

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
    if (this.failGet) throw new DOMException('denied', 'SecurityError');
    const remaining = this.unavailableReads.get(key) ?? 0;
    if (remaining > 0) {
      this.unavailableReads.set(key, remaining - 1);
      throw new DOMException('temporarily denied', 'SecurityError');
    }
    return this.#area(area).get(key) ?? null;
  }

  setItem(area: SdPersistenceStorageArea, key: string, value: string): boolean {
    if (this.failSet) throw new DOMException('quota', 'QuotaExceededError');
    if (this.returnFalseSet) return false;
    if (this.maxValueLength !== undefined && value.length > this.maxValueLength) return false;
    this.#area(area).set(key, value);
    return true;
  }

  removeItem(area: SdPersistenceStorageArea, key: string): boolean {
    if (this.failRemove) throw new DOMException('denied', 'SecurityError');
    this.#area(area).delete(key);
    return true;
  }

  #area(area: SdPersistenceStorageArea): Map<string, string> {
    return area === 'local' ? this.local : this.session;
  }
}

class PrefixSerializer implements SdPersistenceSerializer {
  readonly format = 'test.prefix@1';
  readonly #graph = new SdGraphSerializer();

  stringify<T>(value: T): string {
    return `prefix:${this.#graph.stringify(value)}`;
  }

  parse<T = unknown>(serialized: string): T {
    if (!serialized.startsWith('prefix:')) throw new Error('invalid prefix');
    return this.#graph.parse<T>(serialized.slice(7));
  }

  clone<T>(value: T): T {
    return this.#graph.clone(value);
  }
}

class UrlSerializer implements SdPersistenceSerializer {
  readonly format = 'test.url@1';

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
  readonly format = 'test.url-identity@1';
  readonly #serializer = new UrlSerializer();

  canonicalize(value: unknown): string {
    return this.#serializer.stringify(value);
  }
}

class RandomIvSerializer implements SdPersistenceSerializer {
  readonly format = 'test.random-iv@1';
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
  readonly format = 'test.sentinel@1';
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
  readonly format = 'test.inherited-entry@1';
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
    this.format = `test.extra-own-entry.${extra}@1`;
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

interface LegacyUser {
  name: string;
}

const typedLegacyConfiguration: ISdCacheConfiguration = adaptLegacySdCacheCallbacks<LegacyUser>({
  matches: key => key.startsWith('legacy-user:'),
  isValue: (value): value is LegacyUser => typeof value === 'object' && value !== null && typeof Reflect.get(value, 'name') === 'string',
  set: async (_key, _value) => undefined,
  get: async () => ({ data: { name: 'typed' }, createdOn: new Date() }),
  remove: async () => undefined,
});

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
  let resolve = (_value: T): void => undefined;
  let reject = (_reason: unknown): void => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks(count = 10): Promise<void> {
  for (let index = 0; index < count; index += 1) await Promise.resolve();
}

describe('SdCacheService', () => {
  let adapter: FakeStorageAdapter;

  function configure(configuration?: ISdCacheConfiguration): SdCacheService {
    adapter = new FakeStorageAdapter();
    const providers: Provider[] = [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }];
    if (configuration) providers.push({ provide: SD_CACHE_CONFIG, useValue: configuration });
    TestBed.configureTestingModule({ providers });
    return TestBed.inject(SdCacheService);
  }

  afterEach(() => TestBed.resetTestingModule());

  function restart(configuration?: ISdCacheConfiguration): SdCacheService {
    TestBed.resetTestingModule();
    const providers: Provider[] = [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }];
    if (configuration) providers.push({ provide: SD_CACHE_CONFIG, useValue: configuration });
    TestBed.configureTestingModule({ providers });
    return TestBed.inject(SdCacheService);
  }

  it('preserves the create/get/set/has/remove/default/observer public behavior', () => {
    const service = configure();
    expect(() => service.create('')).toThrowError('Key is required');
    const cache = service.create<{ value: number }>('baseline', { default: { value: 0 } });
    const emissions: ({ value: number } | undefined)[] = [];
    cache.observer.subscribe(value => emissions.push(value));
    expect(cache.get()).toEqual({ value: 0 });
    expect(cache.has()).toBeFalse();
    cache.set({ value: 1 });
    expect(cache.has()).toBeTrue();
    expect(cache.get()).toEqual({ value: 1 });
    cache.remove();
    expect(cache.has()).toBeFalse();
    expect(cache.get()).toEqual({ value: 0 });
    expect(emissions).toEqual([{ value: 0 }, { value: 1 }, { value: 0 }]);
  });

  it('keeps object cache keys independent', () => {
    const service = configure();
    const first = service.create<string>({ entity: 'user', id: 1 });
    const second = service.create<string>({ entity: 'user', id: 2 });
    first.set('first');
    second.set('second');
    expect(first.get()).toBe('first');
    expect(second.get()).toBe('second');
  });

  it('persists cyclic object keys without requiring a representable legacy hash', () => {
    let service = configure();
    const key: Record<string, unknown> = { entity: 'cyclic-cache-key' };
    key['self'] = key;
    const cache = service.create<string>(key, { type: 'local' });
    cache.set('value');
    expect(cache.get()).toBe('value');
    expect(adapter.local.size).toBe(1);
    cache.destroy();

    service = restart();
    expect(service.create<string>(key, { type: 'local' }).get()).toBe('value');
  });

  it('keeps the known legacy hash collision pair independent across destroy and recreation', () => {
    let service = configure();
    const first = service.create<string>('xlzbiev2kjhp', { type: 'local' });
    const second = service.create<string>('x2e3c01io76tb', { type: 'local' });
    first.set('first');
    second.set('second');
    expect(first.get()).toBe('first');
    expect(second.get()).toBe('second');
    expect(adapter.local.size).toBe(2);
    first.destroy();
    second.destroy();

    service = restart();
    expect(service.create<string>('xlzbiev2kjhp', { type: 'local' }).get()).toBe('first');
    expect(service.create<string>('x2e3c01io76tb', { type: 'local' }).get()).toBe('second');
  });

  it('uses a fixed-length private primary key and a service-owned value envelope', () => {
    const service = configure();
    const cache = service.create<string>('private-key', {
      type: 'local',
      args: { token: 'args-secret' },
      default: 'default-secret',
    });
    cache.set('payload-secret');

    const [physicalKey] = Array.from(adapter.local.keys());
    expect(physicalKey).toMatch(/^sdcorejs\.cache@1:[a-f0-9]{64}$/);
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
    const serializer = new SentinelSerializer();
    const cache = service.create<string>('sentinel-payload', { type: 'local', serializer });
    cache.set('runtime-value');
    const [physicalKey] = Array.from(adapter.local.keys());
    expect(adapter.local.get(physicalKey)).not.toBe('{"format":"sdcorejs.persistence-tombstone","version":1}');
    cache.destroy();

    service = restart();
    const reloaded = service.create<string>('sentinel-payload', { type: 'local', serializer: new SentinelSerializer() });
    expect(reloaded.get()).toBe('sentinel-value');
    reloaded.remove();
    const envelope = JSON.parse(adapter.local.get(physicalKey) ?? '{}') as Record<string, unknown>;
    expect(envelope['kind']).toBe('tombstone');
  });

  it('uses only pre-Task4 JSON as legacy fallback and never imports a graph value from the old base', () => {
    let service = configure();
    const legacyJsonKey = Utilities.hash({ key: 'legacy-json-only' });
    adapter.local.set(legacyJsonKey, JSON.stringify({ data: 'legacy-json', createdOn: '2026-07-22T00:00:00.000Z' }));
    expect(service.create<string>('legacy-json-only', { type: 'local', args: { page: 1 } }).get()).toBe('legacy-json');

    service = restart();
    const graphBaseKey = Utilities.hash({ key: 'current-graph-is-not-legacy' });
    adapter.local.set(
      graphBaseKey,
      new SdGraphSerializer().stringify({ data: 'must-not-import', createdOn: new Date('2026-07-22T00:00:00.000Z') })
    );
    expect(service.create<string>('current-graph-is-not-legacy', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
    expect(adapter.local.get(graphBaseKey)).toContain('must-not-import');
  });

  it('removes only the failed variant primary while preserving its shared legacy owner', () => {
    const service = configure();
    const legacyKey = Utilities.hash({ key: 'false-tombstone' });
    adapter.local.set(legacyKey, JSON.stringify({ data: 'legacy', createdOn: '2026-07-22T00:00:00.000Z' }));
    const cache = service.create<string>('false-tombstone', { type: 'local', args: { page: 1 } });
    expect(cache.get()).toBe('legacy');
    adapter.returnFalseSet = true;
    cache.remove();
    adapter.returnFalseSet = false;
    expect(adapter.local.has(legacyKey)).toBeTrue();
    expect(adapter.local.size).toBe(1);

    cache.destroy();
    expect(service.create<string>('false-tombstone', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
    expect(service.create<string>('false-tombstone', { type: 'local' }).get()).toBe('legacy');
  });

  it('round-trips graph values and returns isolated clones', () => {
    const service = configure();
    const cache = service.create<Record<string, unknown>>('graph');
    const shared = { value: 1 };
    const source: Record<string, unknown> = {
      date: new Date('2026-07-21T00:00:00.000Z'),
      map: new Map([['shared', shared]]),
      set: new Set([shared]),
      shared,
    };
    source['self'] = source;

    cache.set(source);
    const first = cache.get();
    const second = cache.get();
    if (!first || !second) throw new Error('Expected graph cache values');
    expect(first).not.toBe(second);
    expect(first['self']).toBe(first);
    expect(first['date']).toEqual(new Date('2026-07-21T00:00:00.000Z'));
    expect((first['map'] as Map<string, unknown>).get('shared')).toBe(first['shared']);
    expect(Array.from(first['set'] as Set<unknown>)[0]).toBe(first['shared']);
  });

  it('isolates memory, session, local, TTL, args, namespace, version, and serializer identities', () => {
    const service = configure();
    const prefix = new PrefixSerializer();
    const variants = [
      service.create<string>('identity'),
      service.create<string>('identity', { type: 'session' }),
      service.create<string>('identity', { type: 'local' }),
      service.create<string>('identity', { ttlMs: 10 }),
      service.create<string>('identity', { args: { page: 1 } }),
      service.create<string>('identity', { namespace: 'one' }),
      service.create<string>('identity', { version: '2' }),
      service.create<string>('identity', { serializer: prefix }),
    ];

    variants.forEach((cache, index) => cache.set(`value-${index}`));
    variants.forEach((cache, index) => expect(cache.get()).toBe(`value-${index}`));
  });

  it('persists canonical policy variants under collision-free keys and reloads each independently', () => {
    let service = configure();
    const variants: { option: SdCacheOption<string>; value: string }[] = [
      { option: { type: 'local', ttlMs: 60_000 }, value: 'short' },
      { option: { type: 'local', ttlMs: 120_000 }, value: 'long' },
      { option: { type: 'local', args: { page: 1 } }, value: 'args-1' },
      { option: { type: 'local', args: { page: 2 } }, value: 'args-2' },
      { option: { type: 'local', default: 'one' }, value: 'default-1' },
      { option: { type: 'local', default: 'two' }, value: 'default-2' },
      { option: { type: 'local', namespace: 'x' }, value: 'namespace' },
      { option: { type: 'local', version: 'x' }, value: 'version' },
      { option: { type: 'local', namespace: '' }, value: 'empty-namespace' },
      { option: { type: 'local', version: '' }, value: 'empty-version' },
      { option: { type: 'local', namespace: 'a:b', version: 'c' }, value: 'colon-left' },
      { option: { type: 'local', namespace: 'a', version: 'b:c' }, value: 'colon-right' },
      { option: { type: 'local', serializer: new PrefixSerializer() }, value: 'serializer' },
    ];
    variants.forEach(variant => service.create<string>('canonical', variant.option).set(variant.value));
    expect(new Set(adapter.local.keys()).size).toBe(variants.length);

    service = restart();
    variants.forEach(variant => {
      const option = variant.value === 'serializer' ? { ...variant.option, serializer: new PrefixSerializer() } : variant.option;
      expect(service.create<string>('canonical', option).get()).toBe(variant.value);
    });
  });

  it('tombstones one expired canonical TTL variant without deleting its sibling', () => {
    jasmine.clock().install();
    try {
      const service = configure();
      const start = new Date('2026-01-01T00:00:00.000Z');
      jasmine.clock().mockDate(start);
      const short = service.create<string>('ttl-siblings', { type: 'local', ttlMs: 50 });
      const long = service.create<string>('ttl-siblings', { type: 'local', ttlMs: 5_000 });
      short.set('short');
      long.set('long');
      jasmine.clock().mockDate(new Date(start.getTime() + 51));
      expect(short.has()).toBeFalse();
      expect(long.get()).toBe('long');
      short.remove();
      expect(adapter.local.size).toBe(2);
      expect(Array.from(adapter.local.values()).filter(value => value.includes('"kind":"tombstone"')).length).toBe(1);
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('keeps the default base owner when non-default siblings are removed or expire across recreation', () => {
    jasmine.clock().install();
    try {
      let service = configure();
      const start = new Date('2026-01-01T00:00:00.000Z');
      jasmine.clock().mockDate(start);
      const defaultCache = service.create<string>('coexisting-owners', { type: 'local' });
      const argsVariant = service.create<string>('coexisting-owners', { type: 'local', args: { page: 1 } });
      const ttlVariant = service.create<string>('coexisting-owners', { type: 'local', ttlMs: 50 });
      defaultCache.set('default-A');
      const defaultPrimaryKey = Array.from(adapter.local.keys())[0];
      argsVariant.set('args-B');
      ttlVariant.set('ttl-C');

      argsVariant.remove();
      jasmine.clock().mockDate(new Date(start.getTime() + 51));
      expect(ttlVariant.has()).toBeFalse();
      expect(adapter.local.has(defaultPrimaryKey)).toBeTrue();

      service = restart();
      expect(service.create<string>('coexisting-owners', { type: 'local' }).get()).toBe('default-A');
      expect(service.create<string>('coexisting-owners', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
      expect(service.create<string>('coexisting-owners', { type: 'local', ttlMs: 50 }).has()).toBeFalse();
      expect(adapter.local.has(defaultPrimaryKey)).toBeTrue();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('tombstones a corrupt canonical variant without falling back to or mutating its base owner', () => {
    let service = configure();
    const defaultCache = service.create<string>('corrupt-canonical-owner', { type: 'local' });
    const variant = service.create<string>('corrupt-canonical-owner', { type: 'local', args: { page: 1 } });
    defaultCache.set('default-A');
    variant.set('variant-B');
    const [defaultPrimaryKey, variantPrimaryKey] = Array.from(adapter.local.keys());
    expect(variantPrimaryKey).toBeDefined();
    defaultCache.destroy();
    variant.destroy();
    adapter.local.set(variantPrimaryKey, 'corrupt');

    service = restart();
    expect(service.create<string>('corrupt-canonical-owner', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
    expect(service.create<string>('corrupt-canonical-owner', { type: 'local' }).get()).toBe('default-A');
    expect(adapter.local.get(defaultPrimaryKey)).toContain('default-A');
    expect(adapter.local.get(variantPrimaryKey)).toContain('"kind":"tombstone"');

    service = restart();
    expect(service.create<string>('corrupt-canonical-owner', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
    expect(adapter.local.get(defaultPrimaryKey)).toContain('default-A');
  });

  it('leaves an invalid base fallback owned by the default policy and tombstones the variant', () => {
    let service = configure();
    const baseKey = Utilities.hash({ key: 'invalid-fallback-owner' });
    adapter.local.set(baseKey, 'corrupt');

    expect(service.create<string>('invalid-fallback-owner', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
    expect(adapter.local.get(baseKey)).toBe('corrupt');
    expect(Array.from(adapter.local.values()).some(value => value.includes('"kind":"tombstone"'))).toBeTrue();

    service = restart();
    expect(service.create<string>('invalid-fallback-owner', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
    expect(adapter.local.get(baseKey)).toBe('corrupt');
  });

  it('migrates a non-default policy from the old base key once without later resurrection', () => {
    let service = configure();
    const legacyKey = Utilities.hash({ key: 'policy-migration' });
    // Keep the migration fixture inside its 60-second policy TTL regardless of
    // the calendar date on which the suite runs.
    adapter.local.set(legacyKey, JSON.stringify({ data: 'legacy-value', createdOn: new Date().toISOString() }));
    const migrated = service.create<string>('policy-migration', { type: 'local', ttlMs: 60_000 });
    expect(migrated.get()).toBe('legacy-value');
    const canonicalKey = Array.from(adapter.local.keys()).find(key => key !== legacyKey);
    expect(canonicalKey).toBeDefined();
    expect(canonicalKey).not.toBe(legacyKey);
    expect(adapter.local.has(legacyKey)).toBeTrue();
    migrated.remove();

    service = restart();
    expect(service.create<string>('policy-migration', { type: 'local', ttlMs: 60_000 }).has()).toBeFalse();
    expect(service.create<string>('policy-migration', { type: 'local' }).get()).toBe('legacy-value');
    expect(adapter.local.has(legacyKey)).toBeTrue();
  });

  it('uses a canonical tombstone when legacy cleanup is denied', () => {
    let service = configure();
    const legacyKey = Utilities.hash({ key: 'denied-migration' });
    adapter.local.set(legacyKey, JSON.stringify({ data: 'legacy-value', createdOn: '2026-07-22T00:00:00.000Z' }));
    adapter.failRemove = true;
    const migrated = service.create<string>('denied-migration', { type: 'local', args: { page: 1 } });
    expect(migrated.get()).toBe('legacy-value');
    migrated.remove();
    adapter.failRemove = false;

    service = restart();
    expect(service.create<string>('denied-migration', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
    expect(service.create<string>('denied-migration', { type: 'local' }).get()).toBe('legacy-value');
  });

  it('fails create deterministically when policy identity cannot be canonicalized', () => {
    const service = configure();
    expect(() =>
      service.create('unsupported-policy', {
        type: 'local',
        args: { callback: () => undefined },
      })
    ).toThrowError(SdPersistenceIdentityError);
  });

  it('shares state for the same normalized identity and uses lease-safe destroy', () => {
    const service = configure();
    const first = service.create<number>('shared', { type: 'local' });
    const second = service.create<number>('shared', { type: 'local' });
    let firstCompleted = false;
    first.observer.subscribe({ complete: () => (firstCompleted = true) });

    first.set(7);
    expect(second.get()).toBe(7);
    first.destroy();
    expect(firstCompleted).toBeTrue();
    expect(() => first.get()).toThrowError('Cache handle has been destroyed');
    second.set(8);
    expect(second.get()).toBe(8);
    second.destroy();
    second.destroy();
  });

  it('guards every operation after handle destroy and completes late observer subscriptions immediately', async () => {
    const service = configure();
    const cache = service.create<string>('destroyed-operations');
    cache.set('value');
    cache.destroy();
    let completed = false;
    cache.observer.subscribe({ complete: () => (completed = true) });
    expect(completed).toBeTrue();
    expect(() => cache.get()).toThrowError('Cache handle has been destroyed');
    expect(() => cache.has()).toThrowError('Cache handle has been destroyed');
    expect(() => cache.set('late')).toThrowError('Cache handle has been destroyed');
    expect(() => cache.remove()).toThrowError('Cache handle has been destroyed');
    await expectAsync(cache.load(() => Promise.resolve('late'))).toBeRejectedWithError('Cache handle has been destroyed');
  });

  it('expires finite positive TTL and treats invalid TTL as disabled', () => {
    jasmine.clock().install();
    try {
      const service = configure();
      const start = new Date('2026-01-01T00:00:00.000Z');
      jasmine.clock().mockDate(start);
      const expiring = service.create<string>('expiring', { ttlMs: 50, type: 'local' });
      const invalid = service.create<string>('invalid', { ttlMs: Number.NaN });
      expiring.set('soon-gone');
      invalid.set('kept');
      jasmine.clock().mockDate(new Date(start.getTime() + 51));
      expect(expiring.has()).toBeFalse();
      expect(adapter.local.size).toBe(1);
      expect(Array.from(adapter.local.values())[0]).toContain('"kind":"tombstone"');
      expect(invalid.get()).toBe('kept');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('keeps the legacy hours TTL option', () => {
    jasmine.clock().install();
    try {
      const service = configure();
      const start = new Date('2026-01-01T00:00:00.000Z');
      jasmine.clock().mockDate(start);
      const cache = service.create<string>('hours', { hours: 1 });
      cache.set('value');
      jasmine.clock().mockDate(new Date(start.getTime() + 3_600_001));
      expect(cache.has()).toBeFalse();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('dual-reads the legacy default key and copies it into the current primary envelope', () => {
    const service = configure();
    const legacyKey = Utilities.hash({ key: 'legacy' });
    adapter.local.set(legacyKey, JSON.stringify({ data: { migrated: true }, createdOn: '2026-07-21T00:00:00.000Z' }));

    expect(service.create<{ migrated: boolean }>('legacy', { type: 'local' }).get()).toEqual({ migrated: true });
    const primaryKey = Array.from(adapter.local.keys()).find(key => key !== legacyKey);
    expect(primaryKey).toMatch(/^sdcorejs\.cache@1:[a-f0-9]{64}$/);
    expect(adapter.local.get(primaryKey!)).toContain('sdcorejs.graph');
    expect(adapter.local.has(legacyKey)).toBeTrue();
  });

  it('removes corrupt and unknown-version persistence without crashing', () => {
    let service = configure();
    const seed = service.create<string>('corrupt', { type: 'local' });
    seed.set('seed');
    const storageKey = Array.from(adapter.local.keys())[0];
    seed.destroy();
    adapter.local.set(storageKey, '{"format":"sdcorejs.graph","version":99,"root":null,"nodes":[]}');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }] });
    service = TestBed.inject(SdCacheService);

    expect(service.create<string>('corrupt', { type: 'local' }).get()).toBeUndefined();
    expect(adapter.local.get(storageKey)).toContain('"kind":"tombstone"');
  });

  it('keeps memory behavior when storage access, quota, and remove operations throw', () => {
    const service = configure();
    const cache = service.create<string>('guarded', { type: 'local' });
    adapter.failSet = true;
    cache.set('memory');
    expect(cache.get()).toBe('memory');
    adapter.failSet = false;
    adapter.failGet = true;
    expect(service.create<string>('other', { type: 'local', default: 'fallback' }).get()).toBe('fallback');
    adapter.failGet = false;
    adapter.failRemove = true;
    expect(() => cache.remove()).not.toThrow();
    expect(cache.has()).toBeFalse();
  });

  it('keeps an in-memory tombstone when persistent removal fails', () => {
    const service = configure();
    const cache = service.create<string>('remove-failure', { type: 'local' });
    cache.set('persisted');
    adapter.failRemove = true;
    cache.remove();
    expect(cache.has()).toBeFalse();
    expect(cache.get()).toBeUndefined();
  });

  it('clones entries before passing them to configuration callbacks', async () => {
    const service = configure({
      set: async (_key, value) => {
        (value.data as { nested: { count: number } }).nested.count = 99;
        value.createdOn.setFullYear(1999);
      },
    });
    const cache = service.create<{ nested: { count: number } }>('callback-clone');
    cache.set({ nested: { count: 1 } });
    await Promise.resolve();
    expect(cache.get()).toEqual({ nested: { count: 1 } });
  });

  it('keeps the legacy typed callback contract source-compatible without unsafe top types', () => {
    expect(typedLegacyConfiguration).toBeDefined();
  });

  it('supports option inference and an explicit result type with unknown cache options', () => {
    const service = configure();
    const inferred: SdCache<string> = service.create('inferred', { default: 'value' });
    const apiStyleOption: SdCacheOption<unknown> = { type: 'memory' };
    const explicit: SdCache<string> = service.create<string>('api-style', apiStyleOption);
    expect(inferred.get()).toBe('value');
    explicit.set('typed');
    expect(explicit.get()).toBe('typed');
  });

  it('consumes convertKey, namespace/version/custom serializer, and remote callbacks safely', async () => {
    const events: string[] = [];
    const serializer = new PrefixSerializer();
    const service = configure({
      convertKey: key => `converted:${key}`,
      get: async key => {
        events.push(`get:${key}`);
        return { data: new Date('2026-07-20T00:00:00.000Z'), createdOn: new Date() };
      },
      set: async key => {
        events.push(`set:${key}`);
      },
      remove: async key => {
        events.push(`remove:${key}`);
      },
    });
    const cache = service.create<Date>('configured', {
      namespace: 'app',
      version: '3',
      serializer,
      type: 'local',
    });

    expect(await cache.load(async () => new Date('2099-01-01T00:00:00.000Z'))).toEqual(new Date('2026-07-20T00:00:00.000Z'));
    cache.set(new Date('2026-07-21T00:00:00.000Z'));
    expect(Array.from(adapter.local.values())[0] ?? '').toContain('prefix:');
    cache.remove();
    await flushMicrotasks();
    const callbackKeys = events.map(event => event.slice(event.indexOf(':') + 1));
    expect(events.some(event => event.startsWith('get:'))).toBeTrue();
    expect(events.some(event => event.startsWith('set:'))).toBeTrue();
    expect(events.some(event => event.startsWith('remove:'))).toBeTrue();
    expect(new Set(callbackKeys).size).toBe(1);
    expect(callbackKeys[0]).toMatch(/^converted:sdcorejs\.cache@1:[a-f0-9]{64}$/);
  });

  it('ignores synchronous and asynchronous configuration callback failures', async () => {
    const service = configure({
      convertKey: () => {
        throw new Error('key conversion');
      },
      get: async () => {
        throw new Error('remote get');
      },
      set: () => {
        throw new Error('remote set');
      },
      remove: async () => Promise.reject(new Error('remote remove')),
    });
    const cache = service.create<string>('config-errors');
    expect(await cache.load(() => Promise.resolve('local'))).toBe('local');
    expect(cache.get()).toBe('local');
    expect(() => cache.remove()).not.toThrow();
    await Promise.resolve();
  });

  it('coalesces concurrent load success and clears in-flight state after rejection for retry', async () => {
    const service = configure();
    const first = service.create<string>('coalesced');
    const second = service.create<string>('coalesced');
    let resolveLoader: ((value: string) => void) | undefined;
    let calls = 0;
    const pending = new Promise<string>(resolve => (resolveLoader = resolve));
    const one = first.load(() => {
      calls += 1;
      return pending;
    });
    const two = second.load(() => {
      calls += 1;
      return Promise.resolve('wrong');
    });
    resolveLoader?.('shared-result');
    expect(await one).toBe('shared-result');
    expect(await two).toBe('shared-result');
    expect(calls).toBe(1);

    const retry = service.create<string>('retry');
    await expectAsync(retry.load(() => Promise.reject(new Error('first')))).toBeRejectedWithError('first');
    expect(await retry.load(() => Promise.resolve('second'))).toBe('second');
  });

  it('does not resurrect a value when remove or destroy wins an in-flight race', async () => {
    const service = configure();
    const removed = service.create<string>('removed');
    let resolveRemoved: ((value: string) => void) | undefined;
    const removedLoad = removed.load(() => new Promise(resolve => (resolveRemoved = resolve)));
    await flushMicrotasks();
    removed.remove();
    resolveRemoved?.('late');
    expect(await removedLoad).toBe('late');
    expect(removed.has()).toBeFalse();

    const destroyed = service.create<string>('destroyed');
    let resolveDestroyed: ((value: string) => void) | undefined;
    const destroyedLoad = destroyed.load(() => new Promise(resolve => (resolveDestroyed = resolve)));
    await flushMicrotasks();
    destroyed.destroy();
    resolveDestroyed?.('late');
    expect(await destroyedLoad).toBe('late');
    expect(service.create<string>('destroyed').has()).toBeFalse();
  });

  it('starts a new loader after set/remove mutations while the stale caller still receives its own result', async () => {
    const service = configure();
    const cache = service.create<string>('generation-race');
    const stale = deferred<string>();
    const emissions: (string | undefined)[] = [];
    cache.observer.subscribe(value => emissions.push(value));
    const oldLoad = cache.load(() => stale.promise);
    await Promise.resolve();

    cache.set('manual');
    cache.remove();
    let newCalls = 0;
    const newLoad = cache.load(() => {
      newCalls += 1;
      return Promise.resolve('fresh');
    });
    expect(await newLoad).toBe('fresh');
    stale.resolve('stale');
    expect(await oldLoad).toBe('stale');
    expect(newCalls).toBe(1);
    expect(cache.get()).toBe('fresh');
    expect(emissions).toEqual([undefined, 'manual', undefined, 'fresh']);
  });

  it('serializes remote mutations, waits before get, and recovers the queue after rejection', async () => {
    const firstSet = deferred<void>();
    const firstRemove = deferred<void>();
    const events: string[] = [];
    const service = configure({
      set: async (_key, value) => {
        events.push(`set:${String(value.data)}`);
        if (value.data === 'one') await firstSet.promise;
        if (value.data === 'fresh') events.push('set:fresh:done');
      },
      remove: async () => {
        events.push('remove');
        if (events.filter(event => event === 'remove').length === 1) await firstRemove.promise;
      },
      get: async () => {
        events.push('get');
        return undefined;
      },
    });
    const cache = service.create<string>('remote-order');
    cache.set('one');
    cache.remove();
    await Promise.resolve();
    expect(events).toEqual(['set:one']);
    firstSet.reject(new Error('expected remote failure'));
    await flushMicrotasks();
    expect(events).toEqual(['set:one', 'remove']);

    const load = cache.load(() => Promise.resolve('fresh'));
    await flushMicrotasks();
    expect(events).not.toContain('get');
    firstRemove.resolve(undefined);
    expect(await load).toBe('fresh');
    await flushMicrotasks();
    expect(events).toEqual(['set:one', 'remove', 'get', 'set:fresh', 'set:fresh:done']);
  });

  it('settles an expired remote remove before invoking the loader and enqueueing its set', async () => {
    const remoteRemove = deferred<void>();
    const events: string[] = [];
    const service = configure({
      get: async () => ({ data: 'expired', createdOn: new Date('2020-01-01T00:00:00.000Z') }),
      remove: async () => {
        events.push('remove:start');
        await remoteRemove.promise;
        events.push('remove:end');
      },
      set: async () => {
        events.push('set');
      },
    });
    const cache = service.create<string>('expired-remote-order', { ttlMs: 1 });
    const load = cache.load(async () => {
      events.push('loader');
      return 'fresh';
    });
    await flushMicrotasks();
    expect(events).toEqual(['remove:start']);
    remoteRemove.resolve(undefined);
    expect(await load).toBe('fresh');
    await flushMicrotasks();
    expect(events).toEqual(['remove:start', 'remove:end', 'loader', 'set']);
  });

  it('returns nullish loader results without caching, emitting, or persisting them', async () => {
    const service = configure();
    const nullable = service.create<string | null>('nullable', { type: 'local' });
    const optional = service.create<string | undefined>('optional', { type: 'local' });
    const nullableEmissions: (string | null | undefined)[] = [];
    const optionalEmissions: (string | undefined)[] = [];
    nullable.observer.subscribe(value => nullableEmissions.push(value));
    optional.observer.subscribe(value => optionalEmissions.push(value));
    expect(await nullable.load(() => Promise.resolve(null))).toBeNull();
    expect(await optional.load(() => Promise.resolve(undefined))).toBeUndefined();
    expect(nullable.has()).toBeFalse();
    expect(optional.has()).toBeFalse();
    expect(nullable.get()).toBeUndefined();
    expect(optional.get()).toBeUndefined();
    expect(nullableEmissions).toEqual([undefined]);
    expect(optionalEmissions).toEqual([undefined]);
    expect(adapter.local.size).toBe(0);

    let retries = 0;
    expect(
      await nullable.load(() => {
        retries += 1;
        return Promise.resolve('fresh');
      })
    ).toBe('fresh');
    expect(retries).toBe(1);

    nullable.set(null);
    optional.set(undefined);
    expect(nullable.has()).toBeTrue();
    expect(optional.has()).toBeTrue();
    expect(nullable.get()).toBeNull();
    expect(optional.get()).toBeUndefined();
  });

  it('does not invalidate a sibling in-flight load when one facade is destroyed', async () => {
    const service = configure();
    const first = service.create<string>('sibling-generation');
    const sibling = service.create<string>('sibling-generation');
    const pending = deferred<string>();
    const emissions: (string | undefined)[] = [];
    sibling.observer.subscribe(value => emissions.push(value));
    const load = sibling.load(() => pending.promise);
    await flushMicrotasks();

    first.destroy();
    pending.resolve('loaded');

    expect(await load).toBe('loaded');
    expect(sibling.get()).toBe('loaded');
    expect(emissions).toEqual([undefined, undefined, 'loaded']);
  });

  it('keeps the remote FIFO alive across final-handle disposal and state recreation', async () => {
    const pendingSet = deferred<void>();
    const events: string[] = [];
    const service = configure({
      set: async () => {
        events.push('set:start');
        await pendingSet.promise;
        events.push('set:end');
      },
      remove: async () => {
        events.push('remove');
      },
    });
    const first = service.create<string>('recreated-remote-queue');
    first.set('one');
    await flushMicrotasks();
    first.destroy();
    service.create<string>('recreated-remote-queue').remove();
    await flushMicrotasks();
    expect(events).toEqual(['set:start']);

    pendingSet.resolve(undefined);
    await flushMicrotasks();
    expect(events).toEqual(['set:start', 'set:end', 'remove']);
  });

  it('runs a pending remote get and a newer set inside one FIFO', async () => {
    const pendingGet = deferred<{ data: string; createdOn: Date } | undefined>();
    const events: string[] = [];
    const service = configure({
      get: async () => {
        events.push('get:start');
        const result = await pendingGet.promise;
        events.push('get:end');
        return result;
      },
      set: async (_key, value) => {
        events.push(`set:${String(value.data)}`);
      },
    });
    const cache = service.create<string>('atomic-remote-get');
    const load = cache.load(() => Promise.resolve('loader'));
    await flushMicrotasks();
    cache.set('newer');
    await flushMicrotasks();
    expect(events).toEqual(['get:start']);

    pendingGet.resolve({ data: 'older', createdOn: new Date() });
    expect(await load).toBe('older');
    await flushMicrotasks();
    expect(events).toEqual(['get:start', 'get:end', 'set:newer']);
    expect(cache.get()).toBe('newer');
  });

  it('keeps expired remote get and removal atomic before a newer set', async () => {
    const pendingGet = deferred<{ data: string; createdOn: Date } | undefined>();
    const events: string[] = [];
    const service = configure({
      get: async () => {
        events.push('get:start');
        const result = await pendingGet.promise;
        events.push('get:end');
        return result;
      },
      remove: async () => {
        events.push('remove');
      },
      set: async (_key, value) => {
        events.push(`set:${String(value.data)}`);
      },
    });
    const cache = service.create<string>('atomic-expired-remote', { ttlMs: 1000 });
    const load = cache.load(() => Promise.resolve('loader'));
    await flushMicrotasks();
    cache.set('newer');
    pendingGet.resolve({ data: 'expired', createdOn: new Date(0) });
    expect(await load).toBe('loader');
    await flushMicrotasks();
    expect(events).toEqual(['get:start', 'get:end', 'remove', 'set:newer']);
    expect(cache.get()).toBe('newer');
  });

  it('preserves persisted and remote null instead of replacing it with a default', async () => {
    let service = configure({
      get: async () => ({ data: null, createdOn: new Date() }),
    });
    const remote = service.create<string | null>('remote-null', { default: 'fallback' });
    expect(await remote.load(() => Promise.resolve('loader'))).toBeNull();
    expect(remote.has()).toBeTrue();
    expect(remote.get()).toBeNull();

    const persisted = service.create<string | null>('persisted-null', { type: 'local', default: 'fallback' });
    persisted.set(null);
    persisted.destroy();
    service = restart();
    const reloaded = service.create<string | null>('persisted-null', { type: 'local', default: 'fallback' });
    expect(reloaded.has()).toBeTrue();
    expect(reloaded.get()).toBeNull();
  });

  it('snapshots and clones defaults, get results, and observer emissions', () => {
    const service = configure();
    const sourceDefault = { nested: { count: 1 } };
    const cache = service.create<{ nested: { count: number } }>('default-clones', { default: sourceDefault });
    sourceDefault.nested.count = 99;
    const first = cache.get();
    first.nested.count = 50;
    expect(cache.get()).toEqual({ nested: { count: 1 } });
    const emissions: { nested: { count: number } }[] = [];
    cache.observer.subscribe(value => {
      if (value) emissions.push(value);
    });
    emissions[0].nested.count = 75;
    expect(cache.get()).toEqual({ nested: { count: 1 } });
    cache.set({ nested: { count: 2 } });
    emissions[1].nested.count = 88;
    expect(cache.get()).toEqual({ nested: { count: 2 } });
    cache.remove();
    expect(emissions[2]).toEqual({ nested: { count: 1 } });
  });

  it('quarantines a stale canonical value after a replacement write fails', () => {
    const service = configure();
    const cache = service.create<string>('failed-value-write', { type: 'local' });
    cache.set('A');
    const primaryKey = Array.from(adapter.local.keys())[0];
    expect(adapter.local.get(primaryKey)).toContain('A');

    adapter.returnFalseSet = true;
    cache.set('B');
    adapter.returnFalseSet = false;
    expect(cache.get()).toBe('B');
    expect(adapter.local.has(primaryKey)).toBeFalse();

    cache.destroy();
    expect(service.create<string>('failed-value-write', { type: 'local' }).has()).toBeFalse();
  });

  it('routes the final opaque cache key through convertKey for adapters and callbacks', async () => {
    const converted: string[] = [];
    const remoteKeys: string[] = [];
    const service = configure({
      convertKey: key => {
        converted.push(key);
        return `tenant-a:${key}`;
      },
      set: async key => {
        remoteKeys.push(key);
      },
    });
    const cache = service.create<string>('private-secret-cache-key', { type: 'local' });
    cache.set('value');
    await flushMicrotasks();

    const rawPrimary = converted.find(key => /^sdcorejs\.cache@1:[a-f0-9]{64}$/.test(key));
    expect(rawPrimary).toBeDefined();
    expect(rawPrimary).not.toContain('private-secret-cache-key');
    expect(Array.from(adapter.local.keys())).toContain(`tenant-a:${rawPrimary}`);
    expect(remoteKeys).toEqual([`tenant-a:${rawPrimary}`]);
  });

  it('uses the selected custom serializer for URL-bearing policy identity across restart', () => {
    const serializer = new UrlSerializer();
    const identityCanonicalizer = new UrlIdentityCanonicalizer();
    let service = configure();
    const first = service.create<string>('url-policy', {
      type: 'local',
      args: { endpoint: new URL('https://example.test/one') },
      serializer,
      identityCanonicalizer,
    });
    const second = service.create<string>('url-policy', {
      type: 'local',
      args: { endpoint: new URL('https://example.test/two') },
      serializer,
      identityCanonicalizer,
    });
    first.set('one');
    second.set('two');
    expect(adapter.local.size).toBe(2);

    service = restart();
    expect(
      service
        .create<string>('url-policy', {
          type: 'local',
          args: { endpoint: new URL('https://example.test/one') },
          serializer,
          identityCanonicalizer,
        })
        .get()
    ).toBe('one');
    expect(
      service
        .create<string>('url-policy', {
          type: 'local',
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
    service.create<string>('randomized-payload', { type: 'local', args: { page: 1 }, serializer }).set('stable');

    service = restart();
    expect(service.create<string>('randomized-payload', { type: 'local', args: { page: 1 }, serializer }).get()).toBe('stable');
  });

  it('persists a tombstone after a rejected replacement value so legacy data cannot resurrect after restart', () => {
    const legacyKey = Utilities.hash({ key: 'rejected-replacement' });
    adapter = new FakeStorageAdapter();
    adapter.local.set(legacyKey, JSON.stringify({ data: 'A', createdOn: '2026-07-22T00:00:00.000Z' }));
    TestBed.configureTestingModule({ providers: [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }] });
    let service = TestBed.inject(SdCacheService);
    const cache = service.create<string>('rejected-replacement', { type: 'local', args: { page: 1 } });
    expect(cache.get()).toBe('A');

    adapter.maxValueLength = 500;
    const replacement = 'B'.repeat(2000);
    cache.set(replacement);
    expect(cache.get()).toBe(replacement);
    const primaryKey = Array.from(adapter.local.keys()).find(key => key !== legacyKey);
    expect(adapter.local.get(primaryKey!)).toContain('"kind":"tombstone"');

    service = restart();
    expect(service.create<string>('rejected-replacement', { type: 'local', args: { page: 1 } }).has()).toBeFalse();
    expect(adapter.local.get(legacyKey)).toContain('A');
  });

  it('rejects current entries whose data and createdOn fields are inherited', () => {
    const serializer = new InheritedEntrySerializer();
    let service = configure();
    const seed = service.create<string>('inherited-entry', { type: 'local', serializer });
    seed.set('seed');
    const primaryKey = Array.from(adapter.local.keys())[0];
    seed.destroy();

    service = restart();
    expect(service.create<string>('inherited-entry', { type: 'local', serializer }).has()).toBeFalse();
    expect(adapter.local.get(primaryKey)).toContain('"kind":"tombstone"');
  });

  for (const extra of ['symbol', 'hidden'] as const) {
    it(`rejects a current entry with an extra own ${extra} key`, () => {
      const serializer = new ExtraOwnKeyEntrySerializer(extra);
      let service = configure();
      const seed = service.create<string>(`extra-own-${extra}`, { type: 'local', serializer });
      seed.set('seed');
      const primaryKey = Array.from(adapter.local.keys())[0];
      seed.destroy();

      service = restart();
      expect(service.create<string>(`extra-own-${extra}`, { type: 'local', serializer }).has()).toBeFalse();
      expect(adapter.local.get(primaryKey)).toContain('"kind":"tombstone"');
    });
  }

  it('does not fall back to legacy when a canonical read is temporarily unavailable and later recovers the canonical value', () => {
    let service = configure();
    const seed = service.create<string>('unavailable-primary', { type: 'local', args: { page: 1 } });
    seed.set('B');
    const primaryKey = Array.from(adapter.local.keys())[0];
    seed.destroy();
    const legacyKey = Utilities.hash({ key: 'unavailable-primary' });
    adapter.local.set(legacyKey, JSON.stringify({ data: 'A', createdOn: '2026-07-22T00:00:00.000Z' }));

    service = restart();
    adapter.unavailableReads.set(primaryKey, 2);
    const recovered = service.create<string>('unavailable-primary', { type: 'local', args: { page: 1 } });
    expect(recovered.snapshot()).toEqual({ present: true, value: 'B' });
    expect(adapter.local.get(primaryKey)).toContain('B');
    expect(adapter.local.get(legacyKey)).toContain('A');
  });

  it('bounds failed-owner quarantine with deterministic oldest-first eviction', () => {
    const service = configure();
    adapter.returnFalseSet = true;
    for (let index = 0; index < 257; index += 1) {
      const handle = service.create<string>(`failed-owner-${index}`, { type: 'local' });
      handle.set('B');
      handle.destroy();
    }
    adapter.returnFalseSet = false;
    adapter.local.set(Utilities.hash({ key: 'failed-owner-0' }), JSON.stringify({ data: 'oldest', createdOn: '2026-07-22T00:00:00.000Z' }));
    adapter.local.set(
      Utilities.hash({ key: 'failed-owner-256' }),
      JSON.stringify({ data: 'newest', createdOn: '2026-07-22T00:00:00.000Z' })
    );

    expect(service.create<string>('failed-owner-0', { type: 'local' }).get()).toBe('oldest');
    expect(service.create<string>('failed-owner-256', { type: 'local' }).has()).toBeFalse();
  });

  it('degrades safely when a persisted outer envelope exceeds hard document limits', () => {
    let service = configure();
    const seed = service.create<string>('oversized-envelope', { type: 'local' });
    seed.set('seed');
    const primaryKey = Array.from(adapter.local.keys())[0];
    seed.destroy();
    adapter.local.set(primaryKey, 'x'.repeat(SD_PERSISTENCE_ENVELOPE_HARD_LIMITS.maxDocumentCharacters + 1));

    service = restart();
    expect(() => service.create<string>('oversized-envelope', { type: 'local' })).not.toThrow();
    expect(service.create<string>('oversized-envelope', { type: 'local' }).has()).toBeFalse();
  });

  it('destroys memory backing but release keeps it available for a later facade', () => {
    const service = configure();
    const destroyed = service.create<string>('destroyed-memory');
    destroyed.set('gone');
    destroyed.destroy();
    expect(service.create<string>('destroyed-memory').has()).toBeFalse();
    expect(() => destroyed.get()).toThrowError('Cache handle has been destroyed');

    const released = service.create<string>('released-memory');
    released.set('retained');
    released.release();
    expect(service.create<string>('released-memory').get()).toBe('retained');
    expect(() => released.get()).toThrowError('Cache handle has been destroyed');
  });

  it('does not invalidate a sibling deferred load when another facade is destroyed or released', async () => {
    const service = configure();
    const destroyed = service.create<string>('destroy-sibling-load');
    const destroySibling = service.create<string>('destroy-sibling-load');
    const destroyDeferred = deferred<string>();
    const destroyLoad = destroySibling.load(() => destroyDeferred.promise);
    destroyed.destroy();
    destroyDeferred.resolve('after-destroy');
    expect(await destroyLoad).toBe('after-destroy');
    expect(destroySibling.get()).toBe('after-destroy');

    const released = service.create<string>('release-sibling-load');
    const releaseSibling = service.create<string>('release-sibling-load');
    const releaseDeferred = deferred<string>();
    const releaseLoad = releaseSibling.load(() => releaseDeferred.promise);
    released.release();
    releaseDeferred.resolve('after-release');
    expect(await releaseLoad).toBe('after-release');
    expect(releaseSibling.get()).toBe('after-release');
  });

  it('isolates live cache state by the final converted physical owner', () => {
    let tenant = 'tenant-a';
    const service = configure({ convertKey: key => `${tenant}:${key}` });
    const first = service.create<string>('dynamic-tenant-owner', { type: 'local' });
    first.set('A');

    tenant = 'tenant-b';
    const second = service.create<string>('dynamic-tenant-owner', { type: 'local' });
    expect(second.has()).toBeFalse();
    second.set('B');
    expect(second.get()).toBe('B');
    expect(first.get()).toBe('A');
  });

  it('completes live observers and prevents a pending load from persisting after injector destroy', async () => {
    let service = configure();
    const cache = service.create<string>('injector-destroy', { type: 'local' });
    const emissions: (string | undefined)[] = [];
    let completed = false;
    cache.observer.subscribe({
      next: value => emissions.push(value),
      complete: () => (completed = true),
    });
    let resolveLoader: ((value: string) => void) | undefined;
    const pending = cache.load(() => new Promise(resolve => (resolveLoader = resolve)));
    await flushMicrotasks();
    TestBed.resetTestingModule();
    expect(completed).toBeTrue();
    resolveLoader?.('late');
    expect(await pending).toBe('late');
    expect(adapter.local.size).toBe(0);
    expect(emissions).toEqual([undefined]);

    TestBed.configureTestingModule({ providers: [{ provide: SD_PERSISTENCE_STORAGE_ADAPTER, useValue: adapter }] });
    service = TestBed.inject(SdCacheService);
    expect(service.create<string>('injector-destroy', { type: 'local' }).has()).toBeFalse();
  });
});
