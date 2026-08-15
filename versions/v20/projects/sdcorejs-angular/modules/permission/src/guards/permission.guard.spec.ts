import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SdPermissionGuard } from './permission.guard';
import { ISdPermissionConfiguration, SD_PERMISSION_CONFIGURATION } from '../configurations';
import { SD_PERMISSION_PUBLIC, SdPermissionService } from '../services';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const stateSnap = { url: '/orders' } as RouterStateSnapshot;

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
    'readUnverifiedTokenClaims',
    'reset',
    'invalidate',
  ]);
  svc.hasPermission.and.returnValue(hasPermissionResult);
  svc.loadAllPermissions.and.returnValue(loadAllResult);
  svc.loadPermissions.and.returnValue(Promise.resolve([]));
  svc.getToken.and.returnValue(Promise.resolve(undefined));
  svc.decodeToken.and.returnValue(Promise.resolve(null));
  svc.readUnverifiedTokenClaims.and.returnValue(Promise.resolve(null));
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
      rejectedPromise.catch(() => {
        /* swallowed — the guard's own .catch handles it */
      });
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
    // why: `canActivateChild` chạy cho MỌI route con. Route quên khai báo `data.permission` (hoặc gõ
    // sai key) trước đây rơi vào nhánh "rỗng ⇒ cho qua" và được cấp quyền âm thầm.
    it('returns FALSE when route.data has no "permission" entry (fail closed)', async () => {
      spyOn(console, 'error');
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(makeRouteSnap({}), stateSnap);

      expect(result).toBeFalse();
      // Không được hỏi service — thiếu khai báo là từ chối ngay, không có nhánh "rỗng ⇒ true".
      expect(permSvc.hasPermission).not.toHaveBeenCalled();
    });

    it('returns FALSE when the data key is misspelled (permision / permissions)', async () => {
      spyOn(console, 'error');
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const typo = await guard.canActivateChild(makeRouteSnap({ permision: 'PERM_A' }), stateSnap);
      const plural = await guard.canActivateChild(makeRouteSnap({ permissions: ['PERM_A'] }), stateSnap);

      expect(typo).toBeFalse();
      expect(plural).toBeFalse();
    });

    // why: `onForbiden` thường `navigateByUrl('/layout/forbidden')`. Nếu nhánh "không khai báo
    // permission" cũng gọi nó thì một trang forbidden quên khai báo sẽ tự chặn mình và gọi lại
    // `onForbiden` → vòng lặp redirect vô tận. Thiếu khai báo phải chặn IM LẶNG.
    it('does NOT call onForbiden() when the route declares no permission (cannot self-recurse)', async () => {
      spyOn(console, 'error');
      const onForbidenSpy = jasmine.createSpy('onForbiden');
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [], onForbiden: onForbidenSpy }, permSvc);

      const result = await guard.canActivateChild(makeRouteSnap({}), stateSnap);

      expect(result).toBeFalse();
      expect(onForbidenSpy).not.toHaveBeenCalled();
    });

    it('never loops when the forbidden target itself declares no permission', async () => {
      spyOn(console, 'error');
      const permSvc = makePermissionService(false);
      const visited: string[] = [];
      // Mô phỏng `onForbiden` điều hướng sang /forbidden, và /forbidden lại chạy qua guard.
      const guard = makeGuard(
        {
          loadPermissions: () => [],
          onForbiden: () => {
            visited.push('/forbidden');
            if (visited.length > 5) return;
            void guard.canActivateChild(makeRouteSnap({}), { url: '/forbidden' } as RouterStateSnapshot);
          },
        },
        permSvc
      );

      await guard.canActivateChild(makeRouteSnap({ permission: 'PERM_DENIED' }), stateSnap);

      // Đúng MỘT lần điều hướng: lần chạy guard trên /forbidden không được kích hoạt onForbiden nữa.
      expect(visited).toEqual(['/forbidden']);
    });

    it('logs loudly in dev mode when the route declares no permission', async () => {
      const errorSpy = spyOn(console, 'error');
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      await guard.canActivateChild(makeRouteSnap({}), stateSnap);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.calls.mostRecent().args[0]).toContain('SD_PERMISSION_PUBLIC');
    });

    it('allows a route that opts out explicitly with SD_PERMISSION_PUBLIC', async () => {
      const permSvc = makePermissionService(false);
      permSvc.hasPermission.and.callFake((perm: any) => perm === SD_PERMISSION_PUBLIC);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(makeRouteSnap({ permission: SD_PERMISSION_PUBLIC }), stateSnap);

      expect(result).toBeTrue();
    });

    it('returns true when hasPermission() returns true', async () => {
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(makeRouteSnap({ permission: 'PERM_A' }), stateSnap);
      expect(result).toBeTrue();
    });

    it('calls hasPermission() with the route data permission and permissionKey', async () => {
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      await guard.canActivateChild(makeRouteSnap({ permission: 'PERM_A', permissionKey: 'pcm' }), stateSnap);
      expect(permSvc.hasPermission).toHaveBeenCalledWith('PERM_A', 'pcm');
    });

    it('returns false when hasPermission() returns false', async () => {
      const permSvc = makePermissionService(false);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(makeRouteSnap({ permission: 'PERM_DENIED' }), stateSnap);
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

      await guard.canActivateChild(makeRouteSnap({ permission: 'PERM_DENIED' }), stateSnap);
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

      await guard.canActivateChild(makeRouteSnap({ permission: 'PERM_OK' }), stateSnap);
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

      await guard.canActivateChild(makeRouteSnap({ permission: 'PERM_DENIED', permissionKey: 'pcm' }), stateSnap);
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
      const result = await guard.canActivateChild(makeRouteSnap({ permission: 'PERM_DENIED' }), stateSnap);
      expect(result).toBeFalse();
    });

    it('accepts array of permissions in route.data.permission', async () => {
      const permSvc = makePermissionService(true);
      const guard = makeGuard({ loadPermissions: () => [] }, permSvc);

      const result = await guard.canActivateChild(makeRouteSnap({ permission: ['PERM_A', 'PERM_B'] }), stateSnap);
      expect(result).toBeTrue();
      expect(permSvc.hasPermission).toHaveBeenCalledWith(['PERM_A', 'PERM_B'], undefined);
    });
  });
});
