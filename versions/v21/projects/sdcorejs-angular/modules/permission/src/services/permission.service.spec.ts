import { TestBed } from '@angular/core/testing';
import { SD_PERMISSION_PUBLIC, SdPermissionService } from './permission.service';
import { ISdPermissionConfiguration, SD_PERMISSION_CONFIGURATION } from '../configurations';
import { SdCacheService } from '@sdcorejs/angular/services/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal SdCacheService stub — an in-memory Map that mimics a persistent store.
 * `store` is shared across `create()` calls (like the real sessionStorage-backed cache) so a spec can
 * assert exactly which keys were written, and that `remove()` really wipes them.
 */
function makeCacheServiceStub(store = new Map<string, unknown>(), createdKeys: string[] = []): SdCacheService {
  const stub: Partial<SdCacheService> = {
    create<T>(key: string): any {
      createdKeys.push(key);
      return {
        get: () => store.get(key) as T | undefined,
        set: (v: T) => {
          store.set(key, v);
        },
        has: () => store.has(key),
        remove: () => {
          store.delete(key);
        },
        destroy: () => {
          store.delete(key);
        },
        load: async (cb: () => Promise<T>) => {
          if (store.has(key)) return store.get(key) as T;
          const result = await cb();
          if (result !== undefined && result !== null) store.set(key, result);
          return result;
        },
        observer: { subscribe: () => ({ unsubscribe: () => {} }) },
      };
    },
  };

  return stub as SdCacheService;
}

/** Shared handles so specs can inspect what the service persisted. */
interface CacheProbe {
  store: Map<string, unknown>;
  createdKeys: string[];
}

function makeService(configs: ISdPermissionConfiguration | ISdPermissionConfiguration[], probe?: CacheProbe): SdPermissionService {
  const store = probe?.store ?? new Map<string, unknown>();
  const createdKeys = probe?.createdKeys ?? [];
  TestBed.configureTestingModule({
    providers: [
      SdPermissionService,
      { provide: SD_PERMISSION_CONFIGURATION, useValue: configs },
      { provide: SdCacheService, useFactory: () => makeCacheServiceStub(store, createdKeys) },
    ],
  });
  return TestBed.inject(SdPermissionService);
}

function makeProbe(): CacheProbe {
  return { store: new Map<string, unknown>(), createdKeys: [] };
}

// ---------------------------------------------------------------------------
describe('SdPermissionService', () => {
  afterEach(() => TestBed.resetTestingModule());

  // -------------------------------------------------------------------------
  // GROUP 1: Constructor / configuration validation
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('instantiates with a single configuration', () => {
      expect(() => makeService({ loadPermissions: () => Promise.resolve(['PERM_A']) })).not.toThrow();
    });

    it('instantiates with multiple configurations with distinct keys', () => {
      expect(() =>
        makeService([
          { key: 'pcm', loadPermissions: () => [] },
          { key: 'oms', loadPermissions: () => [] },
        ])
      ).not.toThrow();
    });

    it('throws when two configurations share the same key (duplicate undefined)', () => {
      expect(() =>
        makeService([
          { loadPermissions: () => [] }, // key = undefined
          { loadPermissions: () => [] }, // key = undefined — duplicate
        ])
      ).toThrowError(/Duplicate permission configuration key/);
    });

    it('throws when two configurations share the same named key', () => {
      expect(() =>
        makeService([
          { key: 'pcm', loadPermissions: () => [] },
          { key: 'pcm', loadPermissions: () => [] },
        ])
      ).toThrowError(/Duplicate permission configuration key/);
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 2: loadPermissions()
  // -------------------------------------------------------------------------
  describe('loadPermissions()', () => {
    it('calls configuration.loadPermissions and returns the resolved array', async () => {
      const loadSpy = jasmine.createSpy('loadPermissions').and.returnValue(Promise.resolve(['PERM_A', 'PERM_B']));
      const service = makeService({ loadPermissions: loadSpy });

      const result = await service.loadPermissions();

      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual(['PERM_A', 'PERM_B']);
    });

    it('de-duplicates permissions returned by loadPermissions', async () => {
      const service = makeService({
        loadPermissions: () => Promise.resolve(['PERM_A', 'PERM_A', 'PERM_B']),
      });

      const result = await service.loadPermissions();
      expect(result.filter(p => p === 'PERM_A').length).toBe(1);
    });

    it('is idempotent — loadPermissions loader called only once on repeated calls', async () => {
      const loadSpy = jasmine.createSpy('loadPermissions').and.returnValue(Promise.resolve(['PERM_A']));
      const service = makeService({ loadPermissions: loadSpy });

      await service.loadPermissions();
      await service.loadPermissions(); // second call — cache hit

      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it('returns [] when no configuration matches the key', async () => {
      const service = makeService({ key: 'pcm', loadPermissions: () => Promise.resolve(['PERM_A']) });

      const result = await service.loadPermissions('oms');
      expect(result).toEqual([]);
    });

    it('returns [] and marks loaded when loadPermissions throws', async () => {
      const service = makeService({
        loadPermissions: () => Promise.reject(new Error('network error')),
      });

      const result = await service.loadPermissions();
      expect(result).toEqual([]);
    });

    it('loads by key — keyed config is isolated from default config', async () => {
      const service = makeService([
        { key: 'pcm', loadPermissions: () => Promise.resolve(['PCM_PERM']) },
        { loadPermissions: () => Promise.resolve(['PORTAL_PERM']) },
      ]);

      const pcm = await service.loadPermissions('pcm');
      const portal = await service.loadPermissions();

      expect(pcm).toContain('PCM_PERM');
      expect(portal).toContain('PORTAL_PERM');
    });

    it('falls back to portal config (key=undefined) when requested key has no matching config', async () => {
      // key='oms' not registered, but portal-level (undefined key) exists
      const service = makeService({
        loadPermissions: () => Promise.resolve(['PORTAL_PERM']),
      });

      // 'oms' has no config → resolves with effective key = undefined → uses portal config
      const result = await service.loadPermissions('oms');
      // The fallback sends it to the undefined-key config
      expect(result).toEqual(['PORTAL_PERM']);
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 3: loadAllPermissions()
  // -------------------------------------------------------------------------
  describe('loadAllPermissions()', () => {
    it('loads all configured keys', async () => {
      const pcmSpy = jasmine.createSpy('pcm').and.returnValue(Promise.resolve(['PCM_PERM']));
      const omsSpy = jasmine.createSpy('oms').and.returnValue(Promise.resolve(['OMS_PERM']));
      const service = makeService([
        { key: 'pcm', loadPermissions: pcmSpy },
        { key: 'oms', loadPermissions: omsSpy },
      ]);

      await service.loadAllPermissions();

      expect(pcmSpy).toHaveBeenCalledTimes(1);
      expect(omsSpy).toHaveBeenCalledTimes(1);
    });

    it('falls back to loadPermissions(undefined) when no configurations are provided', async () => {
      // Single config with key=undefined
      const loadSpy = jasmine.createSpy('load').and.returnValue(Promise.resolve(['PERM_A']));
      const service = makeService({ loadPermissions: loadSpy });

      await service.loadAllPermissions();

      expect(loadSpy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 4: hasPermission()
  // -------------------------------------------------------------------------
  describe('hasPermission()', () => {
    // why: nhánh "rỗng ⇒ true" cũ là fail-open — route gõ sai key `data`, binding trỏ vào biến
    // undefined, hay mã quyền rỗng do API trả về đều được cấp quyền mà không có dấu hiệu nào.
    it('returns FALSE for an empty string permission (fail closed)', () => {
      spyOn(console, 'error');
      const service = makeService({ loadPermissions: () => [] });
      expect(service.hasPermission('')).toBeFalse();
    });

    it('returns FALSE for undefined permission (fail closed)', () => {
      spyOn(console, 'error');
      const service = makeService({ loadPermissions: () => [] });
      expect(service.hasPermission(undefined)).toBeFalse();
    });

    it('returns FALSE for null permission (fail closed)', () => {
      spyOn(console, 'error');
      const service = makeService({ loadPermissions: () => [] });
      expect(service.hasPermission(null)).toBeFalse();
    });

    it('returns FALSE for an empty array and for an array of blank strings', () => {
      spyOn(console, 'error');
      const service = makeService({ loadPermissions: () => [] });
      expect(service.hasPermission([])).toBeFalse();
      expect(service.hasPermission(['', '   '])).toBeFalse();
    });

    it('logs loudly in dev mode when an empty permission is checked', () => {
      const errorSpy = spyOn(console, 'error');
      const service = makeService({ loadPermissions: () => [] });

      service.hasPermission('');

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.calls.mostRecent().args[0]).toContain('SD_PERMISSION_PUBLIC');
    });

    it('returns true only for the explicit SD_PERMISSION_PUBLIC opt-out', () => {
      const service = makeService({ loadPermissions: () => [] });
      expect(service.hasPermission(SD_PERMISSION_PUBLIC)).toBeTrue();
      expect(service.hasPermission([SD_PERMISSION_PUBLIC])).toBeTrue();
    });

    it('does not log when the explicit opt-out is used', () => {
      const errorSpy = spyOn(console, 'error');
      const service = makeService({ loadPermissions: () => [] });

      service.hasPermission(SD_PERMISSION_PUBLIC);

      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('returns false when no permissions have been loaded yet', () => {
      const service = makeService({ loadPermissions: () => [] });
      expect(service.hasPermission('PERM_A')).toBeFalse();
    });

    it('returns true after loadPermissions() and permission is in list (single string)', async () => {
      const service = makeService({ loadPermissions: () => Promise.resolve(['PERM_A', 'PERM_B']) });
      await service.loadPermissions();
      expect(service.hasPermission('PERM_A')).toBeTrue();
    });

    it('returns false for a code not in the loaded list', async () => {
      const service = makeService({ loadPermissions: () => Promise.resolve(['PERM_A']) });
      await service.loadPermissions();
      expect(service.hasPermission('PERM_Z')).toBeFalse();
    });

    it('returns true when ANY element of an array permission matches (OR semantics)', async () => {
      const service = makeService({ loadPermissions: () => Promise.resolve(['PERM_B']) });
      await service.loadPermissions();
      expect(service.hasPermission(['PERM_A', 'PERM_B'])).toBeTrue();
    });

    it('returns false when NO element of an array permission matches', async () => {
      const service = makeService({ loadPermissions: () => Promise.resolve(['PERM_C']) });
      await service.loadPermissions();
      expect(service.hasPermission(['PERM_A', 'PERM_B'])).toBeFalse();
    });

    it('returns true when configuration.disabled is true (bypass)', async () => {
      const service = makeService({ disabled: true, loadPermissions: () => Promise.resolve([]) });
      await service.loadPermissions();
      expect(service.hasPermission('ANY_PERM')).toBeTrue();
    });

    it('respects permissionKey — checks against the correct keyed map', async () => {
      const service = makeService([
        { key: 'pcm', loadPermissions: () => Promise.resolve(['PCM_ONLY']) },
        { loadPermissions: () => Promise.resolve(['PORTAL_ONLY']) },
      ]);
      await service.loadAllPermissions();

      expect(service.hasPermission('PCM_ONLY', 'pcm')).toBeTrue();
      expect(service.hasPermission('PCM_ONLY')).toBeFalse(); // not in portal list
    });

    it('does not bleed permissions across keys', async () => {
      const service = makeService([
        { key: 'pcm', loadPermissions: () => Promise.resolve(['PCM_PERM']) },
        { key: 'oms', loadPermissions: () => Promise.resolve(['OMS_PERM']) },
      ]);
      await service.loadAllPermissions();

      expect(service.hasPermission('OMS_PERM', 'pcm')).toBeFalse();
      expect(service.hasPermission('PCM_PERM', 'oms')).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 5: getToken()
  // -------------------------------------------------------------------------
  describe('getToken()', () => {
    it('throws when no getToken callback is configured', async () => {
      const service = makeService({ loadPermissions: () => [] });
      await expectAsync(service.getToken()).toBeRejectedWithError(/Method getToken/);
    });

    it('resolves the token returned by configuration.getToken (sync)', async () => {
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => 'my-token',
      });
      const token = await service.getToken();
      expect(token).toBe('my-token');
    });

    it('resolves the token returned by configuration.getToken (Promise)', async () => {
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => Promise.resolve('async-token'),
      });
      const token = await service.getToken();
      expect(token).toBe('async-token');
    });

    it('returns undefined when getToken returns empty string', async () => {
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => '',
      });
      const token = await service.getToken();
      expect(token).toBeUndefined();
    });

    it('returns null when getToken returns null (only empty string maps to undefined)', async () => {
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => null,
      });
      const token = await service.getToken();
      expect(token).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 6: readUnverifiedTokenClaims() (ex decodeToken)
  // -------------------------------------------------------------------------
  describe('readUnverifiedTokenClaims()', () => {
    /**
     * Build a minimal valid JWT string:
     * header.payload.signature  (signature can be any placeholder)
     */
    function buildJwt(payload: Record<string, unknown>): string {
      const encode = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      return `${encode({ alg: 'none' })}.${encode(payload)}.sig`;
    }

    it('decodes a valid JWT payload', async () => {
      const payload = { sub: 'user-1', role: 'admin' };
      const jwt = buildJwt(payload);
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => jwt,
      });

      const result = await service.readUnverifiedTokenClaims<{ sub: string; role: string }>();
      expect(result).not.toBeNull();
      expect(result!.sub).toBe('user-1');
      expect(result!.role).toBe('admin');
    });

    it('returns null when getToken returns undefined (no token)', async () => {
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => undefined,
      });
      const result = await service.readUnverifiedTokenClaims();
      expect(result).toBeNull();
    });

    it('returns null when JWT payload is malformed / cannot be decoded', async () => {
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => 'not.valid-base64!.sig',
      });
      const result = await service.readUnverifiedTokenClaims();
      expect(result).toBeNull();
    });

    // why: tên `decodeToken` che giấu sự thật là payload KHÔNG được xác thực chữ ký/exp. Ràng tên mới
    // vào spec để nó là API chính thức, alias cũ chỉ còn là lớp tương thích.
    it('is the API name — it accepts a forged unsigned token as-is (no signature check)', async () => {
      const forged = buildJwt({ sub: 'attacker', role: 'SUPER_ADMIN' });
      const service = makeService({ loadPermissions: () => [], getToken: () => forged });

      const result = await service.readUnverifiedTokenClaims<{ role: string }>();

      // Không có bước verify nào — chính vì thế kết quả không được dùng để ra quyết định phân quyền.
      expect(result!.role).toBe('SUPER_ADMIN');
    });

    it('deprecated decodeToken() still delegates to readUnverifiedTokenClaims()', async () => {
      const jwt = buildJwt({ sub: 'user-1' });
      const service = makeService({ loadPermissions: () => [], getToken: () => jwt });

      const result = await service.decodeToken<{ sub: string }>();
      expect(result!.sub).toBe('user-1');
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 7: permission codes never touch storage by default
  // -------------------------------------------------------------------------
  describe('resolved permission codes are memory-only by default', () => {
    // why: bản cũ mirror danh sách mã quyền xuống sessionStorage dưới một UUID cố định — mọi script
    // trên cùng origin ĐỌC và GHI được, tức chỉ cần chạy một dòng JS là tự cấp quyền trên UI.
    it('does NOT create any cache handle when persistCache is not enabled', async () => {
      const probe = makeProbe();
      const service = makeService({ loadPermissions: () => Promise.resolve(['PERM_A']) }, probe);

      await service.loadPermissions();

      expect(probe.createdKeys).toEqual([]);
      expect(probe.store.size).toBe(0);
    });

    it('still answers hasPermission() from memory without any persisted entry', async () => {
      const probe = makeProbe();
      const service = makeService({ loadPermissions: () => Promise.resolve(['PERM_A']) }, probe);

      await service.loadPermissions();

      expect(service.hasPermission('PERM_A')).toBeTrue();
      expect(probe.store.size).toBe(0);
    });

    it('writes a namespaced per-key entry ONLY when persistCache is opted in', async () => {
      const probe = makeProbe();
      const service = makeService({ key: 'pcm', persistCache: true, loadPermissions: () => Promise.resolve(['PCM_PERM']) }, probe);

      await service.loadPermissions('pcm');

      expect(probe.createdKeys).toEqual(['sd-permission.codes.pcm']);
      expect(probe.store.get('sd-permission.codes.pcm')).toEqual(['PCM_PERM']);
    });

    it('hydrates from the opted-in cache instead of re-calling the loader', async () => {
      const probe = makeProbe();
      probe.store.set('sd-permission.codes.__undefined__', ['CACHED_PERM']);
      const loadSpy = jasmine.createSpy('loadPermissions').and.returnValue(Promise.resolve(['FRESH_PERM']));
      const service = makeService({ persistCache: true, loadPermissions: loadSpy }, probe);

      const result = await service.loadPermissions();

      expect(loadSpy).not.toHaveBeenCalled();
      expect(result).toEqual(['CACHED_PERM']);
    });

    it('does NOT hydrate from a stale entry when persistCache is off', async () => {
      const probe = makeProbe();
      probe.store.set('sd-permission.codes.__undefined__', ['ATTACKER_PERM']);
      const service = makeService({ loadPermissions: () => Promise.resolve(['REAL_PERM']) }, probe);

      const result = await service.loadPermissions();

      expect(result).toEqual(['REAL_PERM']);
      expect(service.hasPermission('ATTACKER_PERM')).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 8: reset() / invalidate()
  // -------------------------------------------------------------------------
  describe('reset() / invalidate()', () => {
    // why: service là singleton `providedIn: 'root'`. Không có API xoá thì signout → signin trong
    // cùng phiên SPA giữ nguyên bộ quyền của user cũ (`loadPermissions` short-circuit theo key).
    it('reset() drops cached permissions so the next signin re-runs the loader', async () => {
      let currentUser = ['USER_A_PERM'];
      const loadSpy = jasmine.createSpy('loadPermissions').and.callFake(() => Promise.resolve(currentUser));
      const service = makeService({ loadPermissions: loadSpy });

      await service.loadPermissions();
      expect(service.hasPermission('USER_A_PERM')).toBeTrue();

      // signout → signin bằng một user khác
      service.reset();
      currentUser = ['USER_B_PERM'];
      await service.loadPermissions();

      expect(loadSpy).toHaveBeenCalledTimes(2);
      expect(service.hasPermission('USER_A_PERM')).toBeFalse();
      expect(service.hasPermission('USER_B_PERM')).toBeTrue();
    });

    it('reset() denies immediately — before the new permissions are loaded', async () => {
      const service = makeService({ loadPermissions: () => Promise.resolve(['USER_A_PERM']) });
      await service.loadPermissions();

      service.reset();

      expect(service.hasPermission('USER_A_PERM')).toBeFalse();
    });

    it('reset() clears every configured key at once', async () => {
      const service = makeService([
        { key: 'pcm', loadPermissions: () => Promise.resolve(['PCM_PERM']) },
        { key: 'oms', loadPermissions: () => Promise.resolve(['OMS_PERM']) },
      ]);
      await service.loadAllPermissions();

      service.reset();

      expect(service.hasPermission('PCM_PERM', 'pcm')).toBeFalse();
      expect(service.hasPermission('OMS_PERM', 'oms')).toBeFalse();
    });

    it('reset() also wipes the opted-in sessionStorage mirror', async () => {
      const probe = makeProbe();
      const service = makeService({ persistCache: true, loadPermissions: () => Promise.resolve(['PERM_A']) }, probe);
      await service.loadPermissions();
      expect(probe.store.size).toBe(1);

      service.reset();

      expect(probe.store.size).toBe(0);
    });

    it('reset() wipes a persisted entry left over from a previous page load', () => {
      const probe = makeProbe();
      probe.store.set('sd-permission.codes.__undefined__', ['STALE_PERM']);
      const service = makeService({ persistCache: true, loadPermissions: () => [] }, probe);

      // Chưa gọi loadPermissions lần nào trong phiên này — reset vẫn phải dọn được entry cũ.
      service.reset();

      expect(probe.store.size).toBe(0);
    });

    it('invalidate(key) clears only that key and leaves the others loaded', async () => {
      const pcmSpy = jasmine.createSpy('pcm').and.returnValue(Promise.resolve(['PCM_PERM']));
      const omsSpy = jasmine.createSpy('oms').and.returnValue(Promise.resolve(['OMS_PERM']));
      const service = makeService([
        { key: 'pcm', loadPermissions: pcmSpy },
        { key: 'oms', loadPermissions: omsSpy },
      ]);
      await service.loadAllPermissions();

      service.invalidate('pcm');

      expect(service.hasPermission('PCM_PERM', 'pcm')).toBeFalse();
      expect(service.hasPermission('OMS_PERM', 'oms')).toBeTrue();

      await service.loadPermissions('pcm');
      expect(pcmSpy).toHaveBeenCalledTimes(2);
      expect(omsSpy).toHaveBeenCalledTimes(1);
    });

    it('invalidate() with no argument clears the portal-level (undefined) key', async () => {
      const loadSpy = jasmine.createSpy('load').and.returnValue(Promise.resolve(['PORTAL_PERM']));
      const service = makeService({ loadPermissions: loadSpy });
      await service.loadPermissions();

      service.invalidate();

      expect(service.hasPermission('PORTAL_PERM')).toBeFalse();
      await service.loadPermissions();
      expect(loadSpy).toHaveBeenCalledTimes(2);
    });

    it('invalidate(key) removes the opted-in persisted entry of that key only', async () => {
      const probe = makeProbe();
      const service = makeService(
        [
          { key: 'pcm', persistCache: true, loadPermissions: () => Promise.resolve(['PCM_PERM']) },
          { key: 'oms', persistCache: true, loadPermissions: () => Promise.resolve(['OMS_PERM']) },
        ],
        probe
      );
      await service.loadAllPermissions();

      service.invalidate('pcm');

      expect(probe.store.has('sd-permission.codes.pcm')).toBeFalse();
      expect(probe.store.get('sd-permission.codes.oms')).toEqual(['OMS_PERM']);
    });
  });
});
