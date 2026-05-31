import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SdPermissionGuard } from './permission.guard';
import { ISdPermissionConfiguration, SD_PERMISSION_CONFIGURATION } from '../configurations';
import { SdPermissionService } from '../services';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stateSnap = {} as RouterStateSnapshot;

function makeRouteSnap(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
  return { data } as unknown as ActivatedRouteSnapshot;
}

function makePermissionService(
  hasPermissionResult: boolean,
  loadAllResult: Promise<void> = Promise.resolve()
): jasmine.SpyObj<SdPermissionService> {
  const svc = jasmine.createSpyObj<SdPermissionService>('SdPermissionService', [
    'hasPermission',
    'loadAllPermissions',
    'loadPermissions',
    'getToken',
    'decodeToken',
  ]);
  svc.hasPermission.and.returnValue(hasPermissionResult);
  svc.loadAllPermissions.and.returnValue(loadAllResult);
  svc.loadPermissions.and.returnValue(Promise.resolve([]));
  svc.getToken.and.returnValue(Promise.resolve(undefined));
  svc.decodeToken.and.returnValue(Promise.resolve(null));
  return svc;
}

function makeGuard(
  configs: ISdPermissionConfiguration | ISdPermissionConfiguration[],
  permSvc: jasmine.SpyObj<SdPermissionService>
): SdPermissionGuard {
  TestBed.configureTestingModule({
    providers: [
      SdPermissionGuard,
      { provide: SD_PERMISSION_CONFIGURATION, useValue: configs },
      { provide: SdPermissionService, useValue: permSvc },
    ],
  });
  return TestBed.inject(SdPermissionGuard);
}

// ---------------------------------------------------------------------------
describe('SdPermissionGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  // -------------------------------------------------------------------------
  // GROUP 1: canActivate — portal-level preload
  // -------------------------------------------------------------------------
  describe('canActivate()', () => {
    it('calls loadAllPermissions() and always returns true', async () => {
      const permSvc = makePermissionService(false);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivate(makeRouteSnap(), stateSnap);

      expect(permSvc.loadAllPermissions).toHaveBeenCalledTimes(1);
      expect(result).toBeTrue();
    });

    it('returns true even when loadAllPermissions() rejects (guard swallows the error)', async () => {
      const permSvc = makePermissionService(false);
      // Return a rejection that has an attached catch so zone.js does not flag it as unhandled
      const rejectedPromise = Promise.reject(new Error('load failed'));
      rejectedPromise.catch(() => { /* swallowed — the guard's own .catch handles it */ });
      permSvc.loadAllPermissions.and.returnValue(rejectedPromise);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivate(makeRouteSnap(), stateSnap);

      expect(result).toBeTrue();
    });

    it('returns true regardless of hasPermission() result', async () => {
      const permSvc = makePermissionService(false);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivate(makeRouteSnap(), stateSnap);
      expect(result).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 2: canActivateChild — permission check
  // -------------------------------------------------------------------------
  describe('canActivateChild()', () => {
    it('returns true when route.data.permission is undefined (no restriction)', async () => {
      // When permission is undefined, guard calls hasPermission(undefined, ...).
      // The real service short-circuits to true for empty/falsy input.
      // Spy mimics this by returning true when called with a falsy permission.
      const permSvc = makePermissionService(false);
      permSvc.hasPermission.and.callFake((perm: any) => !perm?.toString());
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(makeRouteSnap({}), stateSnap);
      expect(result).toBeTrue();
    });

    it('returns true when hasPermission() returns true', async () => {
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(
        makeRouteSnap({ permission: 'PERM_A' }),
        stateSnap
      );
      expect(result).toBeTrue();
    });

    it('calls hasPermission() with the route data permission and permissionKey', async () => {
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      await guard.canActivateChild(
        makeRouteSnap({ permission: 'PERM_A', permissionKey: 'pcm' }),
        stateSnap
      );
      expect(permSvc.hasPermission).toHaveBeenCalledWith('PERM_A', 'pcm');
    });

    it('returns false when hasPermission() returns false', async () => {
      const permSvc = makePermissionService(false);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(
        makeRouteSnap({ permission: 'PERM_DENIED' }),
        stateSnap
      );
      expect(result).toBeFalse();
    });

    it('calls onForbiden() when permission is denied and matching config provides it', async () => {
      const onForbidenSpy = jasmine.createSpy('onForbiden');
      const permSvc = makePermissionService(false);
      const config: ISdPermissionConfiguration = {
        loadPermissions: () => [],
        onForbiden: onForbidenSpy,
      };
      const guard = makeGuard(config, permSvc);

      await guard.canActivateChild(
        makeRouteSnap({ permission: 'PERM_DENIED' }),
        stateSnap
      );
      expect(onForbidenSpy).toHaveBeenCalledTimes(1);
    });

    it('does NOT call onForbiden() when permission is granted', async () => {
      const onForbidenSpy = jasmine.createSpy('onForbiden');
      const permSvc = makePermissionService(true);
      const config: ISdPermissionConfiguration = {
        loadPermissions: () => [],
        onForbiden: onForbidenSpy,
      };
      const guard = makeGuard(config, permSvc);

      await guard.canActivateChild(
        makeRouteSnap({ permission: 'PERM_OK' }),
        stateSnap
      );
      expect(onForbidenSpy).not.toHaveBeenCalled();
    });

    it('calls onForbiden() of keyed config when permissionKey matches', async () => {
      const portalForbiden = jasmine.createSpy('portalForbiden');
      const pcmForbiden = jasmine.createSpy('pcmForbiden');
      const permSvc = makePermissionService(false);
      const configs: ISdPermissionConfiguration[] = [
        { key: 'pcm', loadPermissions: () => [], onForbiden: pcmForbiden },
        { loadPermissions: () => [], onForbiden: portalForbiden },
      ];
      const guard = makeGuard(configs, permSvc);

      await guard.canActivateChild(
        makeRouteSnap({ permission: 'PERM_DENIED', permissionKey: 'pcm' }),
        stateSnap
      );
      expect(pcmForbiden).toHaveBeenCalledTimes(1);
      expect(portalForbiden).not.toHaveBeenCalled();
    });

    it('does NOT call onForbiden() when config has none', async () => {
      const permSvc = makePermissionService(false);
      const config: ISdPermissionConfiguration = {
        loadPermissions: () => [],
        // onForbiden intentionally absent
      };
      const guard = makeGuard(config, permSvc);

      // Should not throw
      const result = await guard.canActivateChild(
        makeRouteSnap({ permission: 'PERM_DENIED' }),
        stateSnap
      );
      expect(result).toBeFalse();
    });

    it('accepts array of permissions in route.data.permission', async () => {
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(
        makeRouteSnap({ permission: ['PERM_A', 'PERM_B'] }),
        stateSnap
      );
      expect(result).toBeTrue();
      expect(permSvc.hasPermission).toHaveBeenCalledWith(['PERM_A', 'PERM_B'], undefined);
    });
  });
});
