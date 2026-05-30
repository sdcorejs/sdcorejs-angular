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
 */

// ---------------------------------------------------------------------------
// Pre-computed hashes for test domains
// ---------------------------------------------------------------------------
const HASH_APP_EXAMPLE_COM = 'LTE1NDQ2NjExNTNzaWduZWQ=';        // app.example.com
const HASH_WILDCARD_EXAMPLE_COM = 'LTIwNzgyNTI2ODJzaWduZWQ=';  // *.example.com
const HASH_STORE_UAT_NEXA_MOBI = 'MjEwMjMxNjA3NXNpZ25lZA==';  // store.uat.nexa.mobi
const HASH_WILDCARD_UAT_NEXA_MOBI = 'LTE0NzAyMDkyMTRzaWduZWQ='; // *.uat.nexa.mobi

// ---------------------------------------------------------------------------
// Helper: override window.location for the duration of a describe block.
// We replace with a plain object (avoids the spy restriction in Karma).
// ---------------------------------------------------------------------------
function withHostname(fakeHostname: string, fn: () => void) {
  let originalDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    try {
      originalDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { ...window.location, hostname: fakeHostname },
      });
    } catch {
      // Some browsers disallow redefining window.location
    }
  });

  afterEach(() => {
    try {
      if (originalDescriptor) {
        Object.defineProperty(window, 'location', originalDescriptor);
      }
    } catch { /* ignore */ }
  });

  fn();
}

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
  // GROUP 2: non-localhost paths â€” uses Object.defineProperty to fake hostname
  // -------------------------------------------------------------------------
  describe('non-localhost paths', () => {

    // -----------------------------------------------------------------------
    // 2a. No configuration â†’ throw on non-localhost
    // -----------------------------------------------------------------------
    describe('no SD_CORE_CONFIGURATION on non-localhost host', () => {
      withHostname('app.example.com', () => {
        it('throws SecurityError when no SD_CORE_CONFIGURATION is provided', () => {
          if (window.location.hostname !== 'app.example.com') {
            pending('window.location override not supported in this environment');
            return;
          }
          TestBed.configureTestingModule({
            providers: [SdLicenseService],
          });
          expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
        });
      });
    });

    // -----------------------------------------------------------------------
    // 2b. Exact hostname match â†’ valid
    // -----------------------------------------------------------------------
    describe('exact hostname match', () => {
      withHostname('app.example.com', () => {
        it('passes when hostname exactly matches the configured licenseKey hash', () => {
          if (window.location.hostname !== 'app.example.com') {
            pending('window.location override not supported in this environment');
            return;
          }
          const config: ISdCoreConfiguration = { licenseKey: HASH_APP_EXAMPLE_COM };
          TestBed.configureTestingModule({
            providers: [
              SdLicenseService,
              { provide: SD_CORE_CONFIGURATION, useValue: config },
            ],
          });
          const service = TestBed.inject(SdLicenseService);
          expect(() => service.enforceLicense()).not.toThrow();
        });
      });
    });

    // -----------------------------------------------------------------------
    // 2c. Array of keys â€” one matches exactly
    // -----------------------------------------------------------------------
    describe('array of license keys â€” one matches exactly', () => {
      withHostname('store.uat.nexa.mobi', () => {
        it('passes when licenseKey is an array and one entry matches exactly', () => {
          if (window.location.hostname !== 'store.uat.nexa.mobi') {
            pending('window.location override not supported in this environment');
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
      });
    });

    // -----------------------------------------------------------------------
    // 2d. Wildcard match via progressive subdomain stripping
    // -----------------------------------------------------------------------
    describe('wildcard match *.uat.nexa.mobi for store.uat.nexa.mobi', () => {
      withHostname('store.uat.nexa.mobi', () => {
        it('passes via wildcard match', () => {
          if (window.location.hostname !== 'store.uat.nexa.mobi') {
            pending('window.location override not supported in this environment');
            return;
          }
          const config: ISdCoreConfiguration = { licenseKey: HASH_WILDCARD_UAT_NEXA_MOBI };
          TestBed.configureTestingModule({
            providers: [
              SdLicenseService,
              { provide: SD_CORE_CONFIGURATION, useValue: config },
            ],
          });
          const service = TestBed.inject(SdLicenseService);
          expect(() => service.enforceLicense()).not.toThrow();
        });
      });
    });

    // -----------------------------------------------------------------------
    // 2e. Wildcard *.example.com for app.example.com
    // -----------------------------------------------------------------------
    describe('wildcard *.example.com for app.example.com', () => {
      withHostname('app.example.com', () => {
        it('passes via wildcard *.example.com', () => {
          if (window.location.hostname !== 'app.example.com') {
            pending('window.location override not supported in this environment');
            return;
          }
          const config: ISdCoreConfiguration = { licenseKey: HASH_WILDCARD_EXAMPLE_COM };
          TestBed.configureTestingModule({
            providers: [
              SdLicenseService,
              { provide: SD_CORE_CONFIGURATION, useValue: config },
            ],
          });
          const service = TestBed.inject(SdLicenseService);
          expect(() => service.enforceLicense()).not.toThrow();
        });
      });
    });

    // -----------------------------------------------------------------------
    // 2f. Non-matching hostname â†’ throws
    // -----------------------------------------------------------------------
    describe('non-matching hostname', () => {
      withHostname('evil.attacker.com', () => {
        it('throws when hostname does not match any configured key', () => {
          if (window.location.hostname !== 'evil.attacker.com') {
            pending('window.location override not supported in this environment');
            return;
          }
          const config: ISdCoreConfiguration = { licenseKey: HASH_APP_EXAMPLE_COM };
          TestBed.configureTestingModule({
            providers: [
              SdLicenseService,
              { provide: SD_CORE_CONFIGURATION, useValue: config },
            ],
          });
          expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
        });
      });
    });

    // -----------------------------------------------------------------------
    // 2g. enforceLicense() re-throws when constructed on invalid host
    // -----------------------------------------------------------------------
    describe('enforceLicense() throws with hostname in message', () => {
      withHostname('pirated.domain.io', () => {
        it('throws [Security] error containing the hostname', () => {
          if (window.location.hostname !== 'pirated.domain.io') {
            pending('window.location override not supported in this environment');
            return;
          }
          const config: ISdCoreConfiguration = { licenseKey: HASH_APP_EXAMPLE_COM };

          TestBed.configureTestingModule({
            providers: [
              SdLicenseService,
              { provide: SD_CORE_CONFIGURATION, useValue: config },
            ],
          });

          let thrownError: Error | undefined;
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

    // -----------------------------------------------------------------------
    // 2h. licenseKey is an empty array (length 0) â†’ throw
    // -----------------------------------------------------------------------
    describe('licenseKey is an empty array', () => {
      withHostname('some.domain.com', () => {
        it('throws when licenseKey array is empty', () => {
          if (window.location.hostname !== 'some.domain.com') {
            pending('window.location override not supported in this environment');
            return;
          }
          const config: ISdCoreConfiguration = { licenseKey: [] as any };
          TestBed.configureTestingModule({
            providers: [
              SdLicenseService,
              { provide: SD_CORE_CONFIGURATION, useValue: config },
            ],
          });
          expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
        });
      });
    });

    // -----------------------------------------------------------------------
    // 2i. hostname with only 2 parts (e.g. example.com) â€” while loop never runs
    // -----------------------------------------------------------------------
    describe('hostname with only 2 parts (wildcard loop skipped)', () => {
      withHostname('example.com', () => {
        it('throws when hostname has only 2 parts and no exact match', () => {
          if (window.location.hostname !== 'example.com') {
            pending('window.location override not supported in this environment');
            return;
          }
          const config: ISdCoreConfiguration = { licenseKey: HASH_APP_EXAMPLE_COM };
          TestBed.configureTestingModule({
            providers: [
              SdLicenseService,
              { provide: SD_CORE_CONFIGURATION, useValue: config },
            ],
          });
          expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
        });
      });
    });
  });
});

