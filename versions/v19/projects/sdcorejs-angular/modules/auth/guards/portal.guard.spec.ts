import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { SdPortalGuard } from './portal.guard';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const routeSnap = {} as ActivatedRouteSnapshot;
const stateSnap = {} as RouterStateSnapshot;

function makeGuard(config?: ISdAuthConfiguration): SdPortalGuard {
  TestBed.configureTestingModule({
    providers: [
      SdPortalGuard,
      {
        provide: Router,
        useValue: jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']),
      },
      ...(config ? [{ provide: SD_AUTH_CONFIGURATION, useValue: config }] : []),
    ],
  });
  return TestBed.inject(SdPortalGuard);
}

// ---------------------------------------------------------------------------
describe('SdPortalGuard', () => {
  // -------------------------------------------------------------------------
  // GROUP 1: No SD_AUTH_CONFIGURATION provided — FAIL CLOSED
  // -------------------------------------------------------------------------
  describe('when SD_AUTH_CONFIGURATION is not provided', () => {
    it('instantiates without throwing', () => {
      expect(() => makeGuard()).not.toThrow();
    });

    // why: hàng rào portal bị vô hiệu âm thầm là ca tệ nhất — nó là cửa ngõ của cả app shell.
    it('canActivate() returns false (fail closed — deny by default)', () => {
      spyOn(console, 'error');
      const guard = makeGuard();
      const result = guard.canActivate(routeSnap, stateSnap);
      expect(result).toBeFalse();
    });

    it('logs loudly in dev mode so the missing provider is obvious', () => {
      const errorSpy = spyOn(console, 'error');
      const guard = makeGuard();

      guard.canActivate(routeSnap, stateSnap);

      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.calls.mostRecent().args[0]).toContain('SD_AUTH_CONFIGURATION.guard.portal');
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 2: SD_AUTH_CONFIGURATION provided but guard.portal is absent
  // -------------------------------------------------------------------------
  describe('when configuration has no guard.portal callback', () => {
    it('canActivate() returns false (partial config is still a misconfiguration)', () => {
      spyOn(console, 'error');
      const config: ISdAuthConfiguration = {
        action: { signout: () => Promise.resolve() },
        // guard.portal intentionally omitted
      };
      const guard = makeGuard(config);
      const result = guard.canActivate(routeSnap, stateSnap);
      expect(result).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 3: SD_AUTH_CONFIGURATION provided WITH guard.portal callback
  // -------------------------------------------------------------------------
  describe('when configuration supplies a guard.portal callback', () => {
    it('delegates to guard.portal and returns true when callback returns true', () => {
      const portalSpy = jasmine.createSpy('portalCallback').and.returnValue(true);
      const config: ISdAuthConfiguration = {
        guard: { portal: portalSpy, authInfo: () => ({ id: 'user-1' }) },
      };
      const guard = makeGuard(config);

      const result = guard.canActivate(routeSnap, stateSnap);

      expect(portalSpy).toHaveBeenCalledOnceWith(routeSnap, stateSnap);
      expect(result).toBeTrue();
    });

    it('delegates to guard.portal and returns false when callback returns false', () => {
      const portalSpy = jasmine.createSpy('portalCallback').and.returnValue(false);
      const config: ISdAuthConfiguration = {
        guard: { portal: portalSpy, authInfo: () => ({}) },
      };
      const guard = makeGuard(config);

      const result = guard.canActivate(routeSnap, stateSnap);

      expect(portalSpy).toHaveBeenCalledOnceWith(routeSnap, stateSnap);
      expect(result).toBeFalse();
    });

    it('forwards a UrlTree returned by guard.portal unchanged', () => {
      const fakeUrlTree = { root: null } as any;
      const portalSpy = jasmine.createSpy('portalCallback').and.returnValue(fakeUrlTree);
      const config: ISdAuthConfiguration = {
        guard: { portal: portalSpy, authInfo: () => ({}) },
      };
      const guard = makeGuard(config);

      const result = guard.canActivate(routeSnap, stateSnap);

      expect(result).toBe(fakeUrlTree);
    });
  });
});
