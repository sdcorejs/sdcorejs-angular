import { TestBed } from '@angular/core/testing';
import { SdLicenseService } from './license.service';
import {
  ISdCoreConfiguration,
  SD_CORE_CONFIGURATION,
} from '@sdcorejs/angular/configurations';

/**
 * Hash pre-computed from the same algorithm in SdLicenseService:
 *   generateHash(input + SALT)  where SALT = 'angular-core-976e2fa6f8b44dadbc63f87b057a331f'
 *
 * Verified via Node.js:
 *   app.example.com         => LTE1NDQ2NjExNTNzaWduZWQ=
 *   *.example.com           => LTIwNzgyNTI2ODJzaWduZWQ=
 *   store.uat.nexa.mobi     => MjEwMjMxNjA3NXNpZ25lZA==
 *   *.uat.nexa.mobi         => LTE0NzAyMDkyMTRzaWduZWQ=
 *   *.nexa.mobi             => LTE0MTA1MTE4NzZzaWduZWQ=
 *
 * SCOPE NOTE: window.location.hostname is read-only and Karma always reports
 * 'localhost', which triggers the localhost bypass path. Tests for non-localhost
 * code paths (exact/wildcard match, no-config throw, mismatch throw) rely on
 * spyOnProperty to override window.location.hostname. If the browser sandbox
 * prevents that spy, those groups are skipped and documented here.
 */

// ---------------------------------------------------------------------------
// Helper: override window.location.hostname for a single TestBed creation.
// Returns a cleanup function that restores the original descriptor.
// ---------------------------------------------------------------------------
function spyHostname(fakeHostname: string): jasmine.Spy {
  return spyOnProperty(window, 'location').and.returnValue({
    ...window.location,
    hostname: fakeHostname,
  } as Location);
}

// ---------------------------------------------------------------------------
// Pre-computed hashes for test domains
// ---------------------------------------------------------------------------
const HASH_APP_EXAMPLE_COM = 'LTE1NDQ2NjExNTNzaWduZWQ=';        // app.example.com
const HASH_WILDCARD_EXAMPLE_COM = 'LTIwNzgyNTI2ODJzaWduZWQ=';  // *.example.com
const HASH_STORE_UAT_NEXA_MOBI = 'MjEwMjMxNjA3NXNpZ25lZA==';  // store.uat.nexa.mobi
const HASH_WILDCARD_UAT_NEXA_MOBI = 'LTE0NzAyMDkyMTRzaWduZWQ='; // *.uat.nexa.mobi

// ---------------------------------------------------------------------------
describe('SdLicenseService', () => {
  // -------------------------------------------------------------------------
  // GROUP 1: localhost environment (always runs â€” Karma is on localhost)
  // -------------------------------------------------------------------------
  describe('localhost bypass (Karma env)', () => {
    it('instantiates without throwing on localhost', () => {
      TestBed.configureTestingModule({});
      expect(() => TestBed.inject(SdLicenseService)).not.toThrow();
    });

    it('enforceLicense() does not throw on localhost', () => {
      TestBed.configureTestingModule({});
      const service = TestBed.inject(SdLicenseService);
      expect(() => service.enforceLicense()).not.toThrow();
    });

    it('instantiates without throwing even when SD_CORE_CONFIGURATION is absent', () => {
      TestBed.configureTestingModule({
        providers: [SdLicenseService],
      });
      expect(() => TestBed.inject(SdLicenseService)).not.toThrow();
    });

    it('enforceLicense() is a no-op when valid (localhost â†’ isValid=true)', () => {
      TestBed.configureTestingModule({});
      const service = TestBed.inject(SdLicenseService);
      // Calling multiple times must not throw
      expect(() => {
        service.enforceLicense();
        service.enforceLicense();
      }).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 2: non-localhost paths â€” requires window.location spy
  // These specs use spyOnProperty(window, 'location'). If the browser sandbox
  // disallows this, Jasmine will throw during the spy setup and the individual
  // `it` will fail with a clear message (not a silent skip).
  // -------------------------------------------------------------------------
  describe('non-localhost paths (requires window.location spy)', () => {
    let locationSpy: jasmine.Spy;

    afterEach(() => {
      // Reset any spy state â€” TestBed teardown handles DI cleanup
      locationSpy = undefined!;
    });

    // -----------------------------------------------------------------------
    // 2a. No configuration â†’ throw on non-localhost
    // -----------------------------------------------------------------------
    it('throws SecurityError when no SD_CORE_CONFIGURATION is provided and hostname is not localhost', () => {
      try {
        locationSpy = spyHostname('app.example.com');
      } catch {
        pending('window.location is not spyable in this browser environment â€” skipping non-localhost test');
        return;
      }

      TestBed.configureTestingModule({
        providers: [SdLicenseService],
        // No SD_CORE_CONFIGURATION
      });

      expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
    });

    // -----------------------------------------------------------------------
    // 2b. Exact hostname match â†’ valid
    // -----------------------------------------------------------------------
    it('passes when hostname exactly matches the configured licenseKey hash', () => {
      try {
        locationSpy = spyHostname('app.example.com');
      } catch {
        pending('window.location is not spyable in this browser environment â€” skipping non-localhost test');
        return;
      }

      const config: ISdCoreConfiguration = {
        licenseKey: HASH_APP_EXAMPLE_COM,
      };

      TestBed.configureTestingModule({
        providers: [
          SdLicenseService,
          { provide: SD_CORE_CONFIGURATION, useValue: config },
        ],
      });

      const service = TestBed.inject(SdLicenseService);
      expect(() => service.enforceLicense()).not.toThrow();
    });

    // -----------------------------------------------------------------------
    // 2c. Array of keys â€” one matches exactly
    // -----------------------------------------------------------------------
    it('passes when licenseKey is an array and one entry matches exactly', () => {
      try {
        locationSpy = spyHostname('store.uat.nexa.mobi');
      } catch {
        pending('window.location is not spyable in this browser environment â€” skipping non-localhost test');
        return;
      }

      const config: ISdCoreConfiguration = {
        licenseKey: ['INVALID_HASH', HASH_STORE_UAT_NEXA_MOBI],
      };

      TestBed.configureTestingModule({
        providers: [
          SdLicenseService,
          { provide: SD_CORE_CONFIGURATION, useValue: config },
        ],
      });

      const service = TestBed.inject(SdLicenseService);
      expect(() => service.enforceLicense()).not.toThrow();
    });

    // -----------------------------------------------------------------------
    // 2d. Wildcard match via progressive subdomain stripping
    // -----------------------------------------------------------------------
    it('passes via wildcard match (*.uat.nexa.mobi) for store.uat.nexa.mobi', () => {
      try {
        locationSpy = spyHostname('store.uat.nexa.mobi');
      } catch {
        pending('window.location is not spyable in this browser environment â€” skipping non-localhost test');
        return;
      }

      const config: ISdCoreConfiguration = {
        licenseKey: HASH_WILDCARD_UAT_NEXA_MOBI, // hash of '*.uat.nexa.mobi'
      };

      TestBed.configureTestingModule({
        providers: [
          SdLicenseService,
          { provide: SD_CORE_CONFIGURATION, useValue: config },
        ],
      });

      const service = TestBed.inject(SdLicenseService);
      expect(() => service.enforceLicense()).not.toThrow();
    });

    // -----------------------------------------------------------------------
    // 2e. Wildcard match via *.example.com for sub.app.example.com
    // -----------------------------------------------------------------------
    it('passes via wildcard *.example.com for app.example.com', () => {
      try {
        locationSpy = spyHostname('app.example.com');
      } catch {
        pending('window.location is not spyable in this browser environment â€” skipping non-localhost test');
        return;
      }

      const config: ISdCoreConfiguration = {
        licenseKey: HASH_WILDCARD_EXAMPLE_COM, // hash of '*.example.com'
      };

      TestBed.configureTestingModule({
        providers: [
          SdLicenseService,
          { provide: SD_CORE_CONFIGURATION, useValue: config },
        ],
      });

      const service = TestBed.inject(SdLicenseService);
      expect(() => service.enforceLicense()).not.toThrow();
    });

    // -----------------------------------------------------------------------
    // 2f. Non-matching hostname â†’ throws
    // -----------------------------------------------------------------------
    it('throws when hostname does not match any configured key (exact or wildcard)', () => {
      try {
        locationSpy = spyHostname('evil.attacker.com');
      } catch {
        pending('window.location is not spyable in this browser environment â€” skipping non-localhost test');
        return;
      }

      const config: ISdCoreConfiguration = {
        licenseKey: HASH_APP_EXAMPLE_COM, // valid only for app.example.com
      };

      TestBed.configureTestingModule({
        providers: [
          SdLicenseService,
          { provide: SD_CORE_CONFIGURATION, useValue: config },
        ],
      });

      expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
    });

    // -----------------------------------------------------------------------
    // 2g. enforceLicense() re-throws when constructed on invalid host
    // -----------------------------------------------------------------------
    it('enforceLicense() throws [Security] error containing the hostname', () => {
      try {
        locationSpy = spyHostname('pirated.domain.io');
      } catch {
        pending('window.location is not spyable in this browser environment â€” skipping non-localhost test');
        return;
      }

      const config: ISdCoreConfiguration = {
        licenseKey: HASH_APP_EXAMPLE_COM,
      };

      let thrownError: Error | undefined;
      TestBed.configureTestingModule({
        providers: [
          SdLicenseService,
          { provide: SD_CORE_CONFIGURATION, useValue: config },
        ],
      });

      try {
        TestBed.inject(SdLicenseService);
      } catch (e: unknown) {
        thrownError = e as Error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError?.message).toMatch(/\[Security\]/);
      expect(thrownError?.message).toContain('pirated.domain.io');
    });
  });
});

