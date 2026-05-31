/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { SdCacheService } from './cache.service';

describe('SdCacheService', () => {
  let service: SdCacheService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(SdCacheService);
  });

  // ─── instantiation ────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── create() ─────────────────────────────────────────────────────────────

  it('create() throws when key is falsy', () => {
    expect(() => service.create('')).toThrowError('Key is required');
    expect(() => (service as any).create(null)).toThrowError('Key is required');
  });

  it('create() returns a handle with all required methods', () => {
    const cache = service.create<number>('key-api-shape');
    expect(typeof cache.get).toBe('function');
    expect(typeof cache.set).toBe('function');
    expect(typeof cache.has).toBe('function');
    expect(typeof cache.remove).toBe('function');
    expect(typeof cache.destroy).toBe('function');
    expect(typeof cache.load).toBe('function');
    expect(cache.observer).toBeDefined();
  });

  // ─── set / get ────────────────────────────────────────────────────────────

  it('set() stores value and get() retrieves it', () => {
    const cache = service.create<{ name: string }>('key-set-get');
    cache.set({ name: 'Alice' });
    expect(cache.get()).toEqual({ name: 'Alice' });
  });

  it('get() returns option.default when no value has been set', () => {
    const cache = service.create<string>('key-default', { default: 'fallback' });
    expect(cache.get()).toBe('fallback');
  });

  it('get() returns a deep clone — mutations do not affect cached value', () => {
    const cache = service.create<{ x: number }>('key-deep-clone');
    cache.set({ x: 1 });
    const result = cache.get();
    result.x = 99;
    expect(cache.get().x).toBe(1); // original untouched
  });

  // ─── has() ────────────────────────────────────────────────────────────────

  it('has() returns false before set', () => {
    const cache = service.create<number>('key-has-false');
    expect(cache.has()).toBeFalse();
  });

  it('has() returns true after set', () => {
    const cache = service.create<number>('key-has-true');
    cache.set(42);
    expect(cache.has()).toBeTrue();
  });

  // ─── remove() ─────────────────────────────────────────────────────────────

  it('remove() clears the cached value and has() returns false', () => {
    const cache = service.create<string>('key-remove');
    cache.set('hello');
    cache.remove();
    expect(cache.has()).toBeFalse();
    expect(cache.get()).toBeUndefined();
  });

  it('remove() emits undefined to observers', () => {
    const cache = service.create<string>('key-remove-obs');
    const emissions: any[] = [];
    cache.observer.subscribe(v => emissions.push(v));

    cache.set('world');
    cache.remove();

    // initial (undefined from BehaviorSubject), after set, after remove
    expect(emissions[emissions.length - 1]).toBeUndefined();
  });

  // ─── destroy() ────────────────────────────────────────────────────────────

  it('destroy() completes the observer stream', (done) => {
    const cache = service.create<number>('key-destroy');
    cache.observer.subscribe({
      complete: () => {
        expect(true).toBeTrue();
        done();
      },
    });
    cache.destroy();
  });

  // ─── TTL expiry ────────────────────────────────────────────────────────────

  it('get() returns undefined after TTL (hours) has elapsed', () => {
    jasmine.clock().install();
    try {
      const baseTime = new Date('2024-01-01T10:00:00.000Z');
      jasmine.clock().mockDate(baseTime);

      const cache = service.create<string>('key-ttl', { hours: 1 });
      cache.set('ttl-value');
      expect(cache.has()).toBeTrue();

      // Advance clock by 1 hour + 1 ms — entry should be expired
      jasmine.clock().mockDate(new Date(baseTime.getTime() + 60 * 60 * 1000 + 1));

      expect(cache.has()).toBeFalse();
      expect(cache.get()).toBeUndefined();
    } finally {
      jasmine.clock().uninstall();
    }
  });

  it('get() still returns value before TTL elapses', () => {
    jasmine.clock().install();
    try {
      const baseTime = new Date('2024-01-01T10:00:00.000Z');
      jasmine.clock().mockDate(baseTime);

      const cache = service.create<string>('key-ttl-valid', { hours: 2 });
      cache.set('still-valid');

      // Advance only 30 minutes — not yet expired
      jasmine.clock().mockDate(new Date(baseTime.getTime() + 30 * 60 * 1000));

      expect(cache.has()).toBeTrue();
      expect(cache.get()).toBe('still-valid');
    } finally {
      jasmine.clock().uninstall();
    }
  });

  // ─── observer (reactive) ──────────────────────────────────────────────────

  it('observer emits the latest value on set()', () => {
    const cache = service.create<number>('key-observer');
    const emissions: any[] = [];
    cache.observer.subscribe(v => emissions.push(v));

    cache.set(10);
    cache.set(20);

    // Last emission should correspond to get() === 20
    const last = emissions[emissions.length - 1];
    expect(last).toBe(20);
  });

  it('two create() calls with the same key share the same BehaviorSubject', () => {
    const cache1 = service.create<number>('key-shared');
    const cache2 = service.create<number>('key-shared');

    const obs1Emissions: any[] = [];
    const obs2Emissions: any[] = [];
    cache1.observer.subscribe(v => obs1Emissions.push(v));
    cache2.observer.subscribe(v => obs2Emissions.push(v));

    cache1.set(99);

    // Both observers must have received the value
    expect(obs1Emissions[obs1Emissions.length - 1]).toBe(99);
    expect(obs2Emissions[obs2Emissions.length - 1]).toBe(99);
  });

  // ─── load() ───────────────────────────────────────────────────────────────

  it('load() calls callback on cache miss and stores result', async () => {
    const cache = service.create<string>('key-load-miss');
    const result = await cache.load(() => Promise.resolve('from-api'));
    expect(result).toBe('from-api');
    expect(cache.get()).toBe('from-api');
  });

  it('load() returns cached value without calling callback on cache hit', async () => {
    const cache = service.create<string>('key-load-hit');
    cache.set('cached');
    let callbackCalled = false;
    const result = await cache.load(async () => {
      callbackCalled = true;
      return 'new-value';
    });
    expect(result).toBe('cached');
    expect(callbackCalled).toBeFalse();
  });

  it('load() does NOT cache null or undefined returned by callback', async () => {
    const cache1 = service.create<any>('key-load-null');
    const result1 = await cache1.load(() => Promise.resolve(null));
    expect(result1).toBeNull();
    expect(cache1.has()).toBeFalse();

    const cache2 = service.create<any>('key-load-undefined');
    const result2 = await cache2.load(() => Promise.resolve(undefined));
    expect(result2).toBeUndefined();
    expect(cache2.has()).toBeFalse();
  });

  it('load() propagates errors from the callback', async () => {
    const cache = service.create<string>('key-load-error');
    await expectAsync(cache.load(() => Promise.reject(new Error('api-error')))).toBeRejectedWithError('api-error');
  });

  // ─── localStorage persistence ─────────────────────────────────────────────

  it('set() with type:local persists to localStorage', () => {
    const cache = service.create<number>('key-local', { type: 'local' });
    cache.set(7);
    const raw = localStorage.getItem(jasmine.anything() as any);
    // Check that some localStorage key was written with the correct value
    let found = false;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      const parsed = JSON.parse(localStorage.getItem(k)!);
      if (parsed?.data === 7) {
        found = true;
        break;
      }
    }
    expect(found).toBeTrue();
  });

  it('remove() with type:local also removes from localStorage', () => {
    const cache = service.create<number>('key-local-remove', { type: 'local' });
    cache.set(55);
    const sizeBefore = localStorage.length;
    cache.remove();
    expect(localStorage.length).toBeLessThan(sizeBefore);
  });

  // ─── key namespace (object key) ───────────────────────────────────────────

  it('object keys with different shapes produce independent caches', () => {
    const cache1 = service.create<string>({ entity: 'user', id: 1 });
    const cache2 = service.create<string>({ entity: 'user', id: 2 });

    cache1.set('user-1');
    cache2.set('user-2');

    expect(cache1.get()).toBe('user-1');
    expect(cache2.get()).toBe('user-2');
  });
});
