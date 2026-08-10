import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SdLicenseService } from './license.service';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';

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
const HASH_APP_EXAMPLE_COM = 'LTE1NDQ2NjExNTNzaWduZWQ='; // app.example.com
const HASH_WILDCARD_EXAMPLE_COM = 'LTIwNzgyNTI2ODJzaWduZWQ='; // *.example.com
const HASH_STORE_UAT_NEXA_MOBI = 'MjEwMjMxNjA3NXNpZ25lZA=='; // store.uat.nexa.mobi
const HASH_WILDCARD_UAT_NEXA_MOBI = 'LTE0NzAyMDkyMTRzaWduZWQ='; // *.uat.nexa.mobi

// ---------------------------------------------------------------------------
// Helper: the service reads the hostname through DOCUMENT (not the `window` global), so a fake
// document is all we need to exercise every non-localhost path. The old spec tried to redefine
// `window.location`, which Chrome forbids — 9 specs silently `pending()`-ed and never asserted.
// ---------------------------------------------------------------------------
function documentWithHostname(hostname: string): Provider {
  return {
    provide: DOCUMENT,
    useValue: { defaultView: { location: { hostname } } } as unknown as Document,
  };
}

function configure(hostname: string, config?: ISdCoreConfiguration, platformId?: object | string): void {
  TestBed.configureTestingModule({
    providers: [
      SdLicenseService,
      documentWithHostname(hostname),
      ...(config ? [{ provide: SD_CORE_CONFIGURATION, useValue: config }] : []),
      ...(platformId ? [{ provide: PLATFORM_ID, useValue: platformId }] : []),
    ],
  });
}

// ---------------------------------------------------------------------------
describe('SdLicenseService', () => {
  // -------------------------------------------------------------------------
  // GROUP 1: localhost environment (always runs — Karma is on localhost)
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

    it('enforceLicense() is a no-op when valid (localhost → isValid=true)', () => {
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
  // GROUP 1b: localhost detection must be exact, not a substring test
  // -------------------------------------------------------------------------
  describe('localhost detection (exact match)', () => {
    it('bypasses for the exact host "localhost"', () => {
      configure('localhost');
      expect(() => TestBed.inject(SdLicenseService)).not.toThrow();
    });

    it('bypasses for 127.0.0.1', () => {
      configure('127.0.0.1');
      expect(() => TestBed.inject(SdLicenseService)).not.toThrow();
    });

    it('bypasses for the IPv6 loopback [::1]', () => {
      configure('[::1]');
      expect(() => TestBed.inject(SdLicenseService)).not.toThrow();
    });

    it('bypasses for a real .localhost subdomain (RFC 6761)', () => {
      configure('api.localhost');
      expect(() => TestBed.inject(SdLicenseService)).not.toThrow();
    });

    it('does NOT bypass for localhost.attacker.tld (substring bypass regression)', () => {
      configure('localhost.attacker.tld', { licenseKey: HASH_APP_EXAMPLE_COM });
      expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
    });

    it('does NOT bypass for a host merely containing "localhost"', () => {
      configure('notlocalhost.example.com', { licenseKey: HASH_APP_EXAMPLE_COM });
      expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 1c: non-browser platform (SSR) must never touch `window`
  // -------------------------------------------------------------------------
  describe('non-browser platform (SSR)', () => {
    it('treats a server platform as valid without reading a hostname', () => {
      TestBed.configureTestingModule({
        providers: [SdLicenseService, { provide: DOCUMENT, useValue: {} as Document }, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const service = TestBed.inject(SdLicenseService);
      expect(() => service.enforceLicense()).not.toThrow();
    });

    it('stays valid on a server platform even when a mismatching licenseKey is configured', () => {
      configure('evil.attacker.com', { licenseKey: HASH_APP_EXAMPLE_COM }, 'server');
      const service = TestBed.inject(SdLicenseService);
      expect(() => service.enforceLicense()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // GROUP 2: non-localhost paths — hostname supplied through the injected DOCUMENT
  // -------------------------------------------------------------------------
  describe('non-localhost paths', () => {
    // -----------------------------------------------------------------------
    // 2a. No configuration → dormant no-op (was: hard throw)
    // -----------------------------------------------------------------------
    describe('no SD_CORE_CONFIGURATION on non-localhost host', () => {
      it('does NOT throw when no SD_CORE_CONFIGURATION is provided (dormant license gate)', () => {
        configure('app.example.com');
        expect(() => TestBed.inject(SdLicenseService)).not.toThrow();
      });

      it('enforceLicense() is a no-op when no licenseKey is configured', () => {
        configure('app.example.com');
        const service = TestBed.inject(SdLicenseService);
        expect(() => service.enforceLicense()).not.toThrow();
      });

      it('warns in dev mode that enforcement is disabled', () => {
        const warnSpy = spyOn(console, 'warn');
        configure('app.example.com');
        TestBed.inject(SdLicenseService);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy.calls.mostRecent().args[0]).toContain('license enforcement is disabled');
      });

      it('does not warn when a licenseKey IS configured', () => {
        const warnSpy = spyOn(console, 'warn');
        configure('app.example.com', { licenseKey: HASH_APP_EXAMPLE_COM });
        TestBed.inject(SdLicenseService);
        expect(warnSpy).not.toHaveBeenCalled();
      });
    });

    // -----------------------------------------------------------------------
    // 2b. Exact hostname match → valid
    // -----------------------------------------------------------------------
    describe('exact hostname match', () => {
      it('passes when hostname exactly matches the configured licenseKey hash', () => {
        configure('app.example.com', { licenseKey: HASH_APP_EXAMPLE_COM });
        const service = TestBed.inject(SdLicenseService);
        expect(() => service.enforceLicense()).not.toThrow();
      });
    });

    // -----------------------------------------------------------------------
    // 2c. Array of keys — one matches exactly
    // -----------------------------------------------------------------------
    describe('array of license keys — one matches exactly', () => {
      it('passes when licenseKey is an array and one entry matches exactly', () => {
        configure('store.uat.nexa.mobi', { licenseKey: ['INVALID_HASH', HASH_STORE_UAT_NEXA_MOBI] });
        const service = TestBed.inject(SdLicenseService);
        expect(() => service.enforceLicense()).not.toThrow();
      });

      it('throws when no entry of the array matches', () => {
        configure('store.uat.nexa.mobi', { licenseKey: ['INVALID_HASH', HASH_APP_EXAMPLE_COM] });
        expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
      });
    });

    // -----------------------------------------------------------------------
    // 2d. Wildcard match via progressive subdomain stripping
    // -----------------------------------------------------------------------
    describe('wildcard match *.uat.nexa.mobi for store.uat.nexa.mobi', () => {
      it('passes via wildcard match', () => {
        configure('store.uat.nexa.mobi', { licenseKey: HASH_WILDCARD_UAT_NEXA_MOBI });
        const service = TestBed.inject(SdLicenseService);
        expect(() => service.enforceLicense()).not.toThrow();
      });
    });

    // -----------------------------------------------------------------------
    // 2e. Wildcard *.example.com for app.example.com
    // -----------------------------------------------------------------------
    describe('wildcard *.example.com for app.example.com', () => {
      it('passes via wildcard *.example.com', () => {
        configure('app.example.com', { licenseKey: HASH_WILDCARD_EXAMPLE_COM });
        const service = TestBed.inject(SdLicenseService);
        expect(() => service.enforceLicense()).not.toThrow();
      });
    });

    // -----------------------------------------------------------------------
    // 2f. Non-matching hostname → throws
    // -----------------------------------------------------------------------
    describe('non-matching hostname', () => {
      it('throws when hostname does not match any configured key', () => {
        configure('evil.attacker.com', { licenseKey: HASH_APP_EXAMPLE_COM });
        expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
      });
    });

    // -----------------------------------------------------------------------
    // 2g. enforceLicense() re-throws when constructed on invalid host
    // -----------------------------------------------------------------------
    describe('enforceLicense() throws with hostname in message', () => {
      it('throws [Security] error containing the hostname', () => {
        configure('pirated.domain.io', { licenseKey: HASH_APP_EXAMPLE_COM });

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

    // -----------------------------------------------------------------------
    // 2h. licenseKey is an empty array (length 0) → dormant no-op
    // -----------------------------------------------------------------------
    describe('licenseKey is an empty array', () => {
      it('does not throw when licenseKey array is empty (treated as unconfigured)', () => {
        configure('some.domain.com', { licenseKey: [] as unknown as string[] });
        expect(() => TestBed.inject(SdLicenseService)).not.toThrow();
      });
    });

    // -----------------------------------------------------------------------
    // 2i. hostname with only 2 parts (e.g. example.com) — while loop never runs
    // -----------------------------------------------------------------------
    describe('hostname with only 2 parts (wildcard loop skipped)', () => {
      it('throws when hostname has only 2 parts and no exact match', () => {
        configure('example.com', { licenseKey: HASH_APP_EXAMPLE_COM });
        expect(() => TestBed.inject(SdLicenseService)).toThrowError(/\[Security\]/);
      });
    });
  });
});
