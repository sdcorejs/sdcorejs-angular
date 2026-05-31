import { TestBed } from '@angular/core/testing';
import { SdPermissionService } from './permission.service';
import { ISdPermissionConfiguration, SD_PERMISSION_CONFIGURATION } from '../configurations';
import { SdCacheService } from '@sdcorejs/angular/services/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal SdCacheService stub — uses in-memory Map instead of sessionStorage */
function makeCacheServiceStub(): SdCacheService {
  const store = new Map<string, unknown>();

  const stub: Partial<SdCacheService> = {
    create<T>(key: string): any {
      let value: T | undefined = undefined;
      return {
        get: () => (value !== undefined ? value : undefined) as T,
        set: (v: T) => { value = v; },
        has: () => value !== undefined,
        remove: () => { value = undefined; },
        destroy: () => { value = undefined; },
        load: async (cb: () => Promise<T>) => {
          if (value !== undefined) return value;
          const result = await cb();
          if (result !== undefined && result !== null) value = result;
          return result;
        },
        observer: { subscribe: () => ({ unsubscribe: () => {} }) },
      };
    },
  };

  return stub as SdCacheService;
}

function makeService(
  configs: ISdPermissionConfiguration | ISdPermissionConfiguration[]
): SdPermissionService {
  TestBed.configureTestingModule({
    providers: [
      SdPermissionService,
      { provide: SD_PERMISSION_CONFIGURATION, useValue: configs },
      { provide: SdCacheService, useFactory: makeCacheServiceStub },
    ],
  });
  return TestBed.inject(SdPermissionService);
}

// ---------------------------------------------------------------------------
describe('SdPermissionService', () => {
  afterEach(() => TestBed.resetTestingModule());

  // -------------------------------------------------------------------------
  // GROUP 1: Constructor / configuration validation
  // -------------------------------------------------------------------------
  describe('constructor', () => {
    it('instantiates with a single configuration', () => {
      expect(() =>
        makeService({ loadPermissions: () => Promise.resolve(['PERM_A']) })
      ).not.toThrow();
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
      const loadSpy = jasmine.createSpy('loadPermissions').and.returnValue(
        Promise.resolve(['PERM_A', 'PERM_B'])
      );
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
      const loadSpy = jasmine.createSpy('loadPermissions').and.returnValue(
        Promise.resolve(['PERM_A'])
      );
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
    it('returns true for empty / falsy permission (no restriction)', () => {
      const service = makeService({ loadPermissions: () => [] });
      expect(service.hasPermission('')).toBeTrue();
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
  // GROUP 6: decodeToken()
  // -------------------------------------------------------------------------
  describe('decodeToken()', () => {
    /**
     * Build a minimal valid JWT string:
     * header.payload.signature  (signature can be any placeholder)
     */
    function buildJwt(payload: Record<string, unknown>): string {
      const encode = (obj: object) =>
        btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
      return `${encode({ alg: 'none' })}.${encode(payload)}.sig`;
    }

    it('decodes a valid JWT payload', async () => {
      const payload = { sub: 'user-1', role: 'admin' };
      const jwt = buildJwt(payload);
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => jwt,
      });

      const result = await service.decodeToken<{ sub: string; role: string }>();
      expect(result).not.toBeNull();
      expect(result!.sub).toBe('user-1');
      expect(result!.role).toBe('admin');
    });

    it('returns null when getToken returns undefined (no token)', async () => {
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => undefined,
      });
      const result = await service.decodeToken();
      expect(result).toBeNull();
    });

    it('returns null when JWT payload is malformed / cannot be decoded', async () => {
      const service = makeService({
        loadPermissions: () => [],
        getToken: () => 'not.valid-base64!.sig',
      });
      const result = await service.decodeToken();
      expect(result).toBeNull();
    });
  });
});
