import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Route, RouterStateSnapshot } from '@angular/router';
import { SD_PERMISSION_CONFIGURATION, SD_PERMISSION_PUBLIC, SdPermissionGuard } from '@sdcorejs/angular/modules/permission';
import { Routes } from './layout.routing';

// why: `SdPermissionGuard.canActivateChild` từ chối mọi route không khai báo `data.permission`, và
// `onForbiden` của consumer thường điều hướng sang `/layout/forbidden`. Nếu chính route `forbidden`
// của thư viện không khai báo gì thì nó cũng bị chặn → vòng lặp redirect vô tận. Spec này khoá lại
// việc các route built-in phải tự nói mình công khai, và phải THẬT SỰ đi qua được guard.

const gatedRoutes = (): Route[] => Routes.filter(route => route.redirectTo === undefined);

function makeRouteSnap(route: Route): ActivatedRouteSnapshot {
  return { data: route.data ?? {} } as unknown as ActivatedRouteSnapshot;
}

describe('SdLayoutModule built-in routes vs SdPermissionGuard', () => {
  let onForbiden: jasmine.Spy;
  let guard: SdPermissionGuard;

  beforeEach(() => {
    onForbiden = jasmine.createSpy('onForbiden');
    TestBed.configureTestingModule({
      providers: [{ provide: SD_PERMISSION_CONFIGURATION, useValue: { loadPermissions: () => [], onForbiden } }],
    });
    guard = TestBed.inject(SdPermissionGuard);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('covers home, not-found and forbidden', () => {
    expect(gatedRoutes().map(route => route.path)).toEqual(['home', 'not-found', 'forbidden']);
  });

  it('declares data.permission = SD_PERMISSION_PUBLIC on every non-redirect route', () => {
    for (const route of gatedRoutes()) {
      expect(route.data?.['permission'] as unknown)
        .withContext(`route "${route.path}" must opt out explicitly`)
        .toBe(SD_PERMISSION_PUBLIC);
    }
  });

  it('lets the guard activate every built-in route without an empty permission set loaded', async () => {
    for (const route of gatedRoutes()) {
      const state = { url: `/layout/${route.path}` } as RouterStateSnapshot;
      await expectAsync(guard.canActivateChild(makeRouteSnap(route), state)).toBeResolvedTo(true);
    }
    expect(onForbiden).not.toHaveBeenCalled();
  });

  it('does not redirect the forbidden page to itself', async () => {
    const forbidden = gatedRoutes().find(route => route.path === 'forbidden')!;
    const state = { url: '/layout/forbidden' } as RouterStateSnapshot;

    const allowed = await guard.canActivateChild(makeRouteSnap(forbidden), state);

    expect(allowed).toBeTrue();
    expect(onForbiden).not.toHaveBeenCalled();
  });
});
