import { TestBed } from '@angular/core/testing';
import { SdAuthService } from './auth.service';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';
import { SdAuthInfo } from './auth.model';

// ---------------------------------------------------------------------------
// Default guest user expected when no configuration is supplied
// ---------------------------------------------------------------------------
const GUEST_USER: SdAuthInfo = {
  id: 'guest-id',
  username: 'guest',
  firstName: 'Guest',
  email: 'guest@gmail.com',
};

// ---------------------------------------------------------------------------
// Helper: build TestBed with optional auth configuration
// ---------------------------------------------------------------------------
function makeService(config?: ISdAuthConfiguration): SdAuthService {
  TestBed.configureTestingModule({
    providers: [
      SdAuthService,
      ...(config ? [{ provide: SD_AUTH_CONFIGURATION, useValue: config }] : []),
    ],
  });
  return TestBed.inject(SdAuthService);
}

// ---------------------------------------------------------------------------
describe('SdAuthService', () => {
  // -------------------------------------------------------------------------
  // GROUP 1: No SD_AUTH_CONFIGURATION
  // -------------------------------------------------------------------------
  describe('when SD_AUTH_CONFIGURATION is not provided', () => {
    it('instantiates without throwing', () => {
      expect(() => makeService()).not.toThrow();
    });

    it('getAuthInfo is defined', () => {
      const service = makeService();
      expect(service.getAuthInfo).toBeDefined();
    });

    it('getAuthInfo() returns the default guest user', () => {
      const service = makeService();
      expect(service.getAuthInfo!()).toEqual(GUEST_USER);
    });

    it('signout$  is an Observable (defined and has subscribe)', () => {
      const service = makeService();
      expect(service.signout$).toBeDefined();
      expect(typeof service.signout$!.subscribe).toBe('function');
    });

    it('changePassword$ is an Observable (defined and has subscribe)', () => {
      const service = makeService();
      expect(service.changePassword$).toBeDefined();
      expect(typeof service.changePassword$!.subscribe).toBe('function');
    });

    it('signout() is a no-op when action.signout is absent (does not throw)', () => {
      const service = makeService();
      expect(() => service.signout()).not.toThrow();
    });

    it('changePassword() is a no-op when action.changePassword is absent (does not throw)', () => {
      const service = makeService();
      expect(() => service.changePassword()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 2: SD_AUTH_CONFIGURATION with guard.authInfo
  // -------------------------------------------------------------------------
  describe('when guard.authInfo is configured', () => {
    it('getAuthInfo() returns the value supplied by authInfo() (sync)', () => {
      const customUser: SdAuthInfo = { id: 'u-42', username: 'alice', email: 'alice@example.com' };
      const config: ISdAuthConfiguration = {
        guard: { authInfo: () => customUser },
      };
      const service = makeService(config);
      // Signal is initialValue=defaultUser until the observable resolves;
      // because authInfo returns a plain object, SdNormalizeAsync wraps it in of()
      // which toSignal resolves synchronously — value should already be customUser.
      expect(service.getAuthInfo!()).toEqual(customUser);
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 3: signout() delegates to action.signout and emits on signout$
  // -------------------------------------------------------------------------
  describe('signout()', () => {
    it('calls action.signout() when configured', async () => {
      const signoutSpy = jasmine.createSpy('signout').and.returnValue(Promise.resolve());
      const config: ISdAuthConfiguration = {
        action: { signout: signoutSpy },
      };
      const service = makeService(config);

      service.signout();

      // Drain microtask queue so Promise.resolve().then(...) inside SdResolveMaybeAsync fires
      await Promise.resolve();

      expect(signoutSpy).toHaveBeenCalledTimes(1);
    });

    it('emits on signout$ after action.signout resolves', (done: DoneFn) => {
      const config: ISdAuthConfiguration = {
        // Use a custom Promise so we can control resolution timing
        action: {
          signout: () => {
            return new Promise<void>(resolve => resolve());
          },
        },
      };
      const service = makeService(config);
      // Subscribe BEFORE calling signout so we capture the emission
      service.signout$!.subscribe(() => {
        // Called once after the promise chain resolves
        expect(true).toBeTrue();
        done();
      });

      service.signout();
    });

    it('does NOT emit on signout$ when action.signout is absent', () => {
      const service = makeService(); // no config
      const emissions: void[] = [];
      service.signout$!.subscribe(() => emissions.push());

      service.signout();

      // synchronous check — no async action wired
      expect(emissions.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 4: changePassword() delegates to action.changePassword and emits
  // -------------------------------------------------------------------------
  describe('changePassword()', () => {
    it('calls action.changePassword() when configured', async () => {
      const changePwSpy = jasmine.createSpy('changePassword').and.returnValue(Promise.resolve());
      const config: ISdAuthConfiguration = {
        action: { signout: () => Promise.resolve(), changePassword: changePwSpy },
      };
      const service = makeService(config);

      service.changePassword();

      await Promise.resolve();

      expect(changePwSpy).toHaveBeenCalledTimes(1);
    });

    it('emits on changePassword$ after action.changePassword resolves', (done: DoneFn) => {
      const config: ISdAuthConfiguration = {
        action: {
          signout: () => Promise.resolve(),
          changePassword: () => {
            return new Promise<void>(resolve => resolve());
          },
        },
      };
      const service = makeService(config);
      service.changePassword$!.subscribe(() => {
        expect(true).toBeTrue();
        done();
      });

      service.changePassword();
    });

    it('does NOT emit on changePassword$ when action.changePassword is absent', () => {
      const config: ISdAuthConfiguration = {
        action: { signout: () => Promise.resolve() },
        // changePassword intentionally absent
      };
      const service = makeService(config);
      const emissions: void[] = [];
      service.changePassword$!.subscribe(() => emissions.push());

      service.changePassword();

      // synchronous check — no async action wired
      expect(emissions.length).toBe(0);
    });
  });
});
