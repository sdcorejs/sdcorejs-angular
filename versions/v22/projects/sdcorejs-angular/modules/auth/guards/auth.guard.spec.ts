import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { SdAuthGuard } from './auth.guard';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const routeSnap = {} as ActivatedRouteSnapshot;
const stateSnap = {} as RouterStateSnapshot;

function makeGuard(config?: ISdAuthConfiguration): SdAuthGuard {
  TestBed.configureTestingModule({
    providers: [
      SdAuthGuard,
      {
        provide: Router,
        useValue: jasmine.createSpyObj('Router', ['navigateByUrl', 'createUrlTree']),
      },
      ...(config ? [{ provide: SD_AUTH_CONFIGURATION, useValue: config }] : []),
    ],
  });
  return TestBed.inject(SdAuthGuard);
}

// ---------------------------------------------------------------------------
describe('SdAuthGuard', () => {
  // -------------------------------------------------------------------------
  // GROUP 1: No SD_AUTH_CONFIGURATION provided — FAIL CLOSED
  // -------------------------------------------------------------------------
  describe('when SD_AUTH_CONFIGURATION is not provided', () => {
    it('instantiates without throwing', () => {
      expect(() => makeGuard()).not.toThrow();
    });

    // why: guard nằm trong route table = route đó được tuyên bố là cần bảo vệ. Quên provider mà vẫn
    // cho qua thì mọi route "được bảo vệ" thành công khai một cách âm thầm.
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
      expect(errorSpy.calls.mostRecent().args[0]).toContain('SD_AUTH_CONFIGURATION.guard.auth');
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 2: SD_AUTH_CONFIGURATION provided but guard.auth is absent
  // -------------------------------------------------------------------------
  describe('when configuration has no guard.auth callback', () => {
    it('canActivate() returns false (partial config is still a misconfiguration)', () => {
      spyOn(console, 'error');
      const config: ISdAuthConfiguration = {
        action: { signout: () => Promise.resolve() },
        // guard.auth intentionally omitted
      };
      const guard = makeGuard(config);
      const result = guard.canActivate(routeSnap, stateSnap);
      expect(result).toBeFalse();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 3: SD_AUTH_CONFIGURATION provided WITH guard.auth callback
  // -------------------------------------------------------------------------
  describe('when configuration supplies a guard.auth callback', () => {
    it('delegates to guard.auth and returns true when callback returns true', () => {
      const authSpy = jasmine.createSpy('authCallback').and.returnValue(true);
      const config: ISdAuthConfiguration = {
        guard: { auth: authSpy, authInfo: () => ({ id: 'user-1' }) },
      };
      const guard = makeGuard(config);

      const result = guard.canActivate(routeSnap, stateSnap);

      expect(authSpy).toHaveBeenCalledOnceWith(routeSnap, stateSnap);
      expect(result).toBeTrue();
    });

    it('delegates to guard.auth and returns false when callback returns false', () => {
      const authSpy = jasmine.createSpy('authCallback').and.returnValue(false);
      const config: ISdAuthConfiguration = {
        guard: { auth: authSpy, authInfo: () => ({}) },
      };
      const guard = makeGuard(config);

      const result = guard.canActivate(routeSnap, stateSnap);

      expect(authSpy).toHaveBeenCalledOnceWith(routeSnap, stateSnap);
      expect(result).toBeFalse();
    });

    it('forwards a UrlTree returned by guard.auth unchanged', () => {
      const fakeUrlTree = { root: null } as any;
      const authSpy = jasmine.createSpy('authCallback').and.returnValue(fakeUrlTree);
      const config: ISdAuthConfiguration = {
        guard: { auth: authSpy, authInfo: () => ({}) },
      };
      const guard = makeGuard(config);

      const result = guard.canActivate(routeSnap, stateSnap);

      expect(result).toBe(fakeUrlTree);
    });
  });
});
