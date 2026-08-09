import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SdAuthService } from './auth.service';
import { ISdAuthConfiguration, SD_AUTH_CONFIGURATION } from '../configurations';
import { SdAuthInfo } from './auth.model';

// ---------------------------------------------------------------------------
// Helper: build TestBed with optional auth configuration
// ---------------------------------------------------------------------------
function makeService(config?: ISdAuthConfiguration): SdAuthService {
  TestBed.configureTestingModule({
    providers: [SdAuthService, ...(config ? [{ provide: SD_AUTH_CONFIGURATION, useValue: config }] : [])],
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

    // why: identity giả (`guest` / `guest@gmail.com`) làm template tin là đã có người đăng nhập và
    // render UI của user đã xác thực trong khi thực tế chưa ai đăng nhập. `undefined` là trạng thái
    // trung thực duy nhất — template buộc phải xử lý nhánh chưa xác thực.
    it('getAuthInfo() returns undefined — no synthetic authenticated identity', () => {
      const service = makeService();
      expect(service.getAuthInfo!()).toBeUndefined();
    });

    it('getAuthInfo() never fabricates a guest username / email', () => {
      const service = makeService();
      const info = service.getAuthInfo!() as SdAuthInfo | undefined;
      expect(info?.username).toBeUndefined();
      expect(info?.email).toBeUndefined();
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
      // authInfo trả về object thuần nên normalizeAsync bọc trong of() và toSignal resolve đồng bộ.
      expect(service.getAuthInfo!()).toEqual(customUser);
    });

    // why: `initialValue` cũ là user guest, nên trong lúc lookup thật còn pending UI đã render như
    // một phiên đã đăng nhập. Giá trị khởi tạo phải là `undefined` cho tới khi nguồn thật phát ra.
    it('getAuthInfo() is undefined while an async authInfo() is still pending', () => {
      const pending = new Subject<SdAuthInfo>();
      const config: ISdAuthConfiguration = {
        guard: { authInfo: () => pending },
      };
      const service = makeService(config);

      expect(service.getAuthInfo!()).toBeUndefined();
    });

    it('getAuthInfo() picks up the real user once the async authInfo() emits', () => {
      const pending = new Subject<SdAuthInfo>();
      const config: ISdAuthConfiguration = {
        guard: { authInfo: () => pending },
      };
      const service = makeService(config);

      pending.next({ id: 'u-7', username: 'bob' });

      expect(service.getAuthInfo!()).toEqual({ id: 'u-7', username: 'bob' });
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
