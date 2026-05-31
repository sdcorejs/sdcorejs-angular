/* eslint-disable @typescript-eslint/no-explicit-any */
import { detectIncognito } from './detect-incognito';

// why: detect-incognito branches on `navigator.vendor` + `eval.toString().length`
// (a per-engine constant: Chrome=33, Safari=37, IE=39). Inside Karma's ChromeHeadless
// the only branch reachable end-to-end is the Chrome branch. We assert:
//   - the function returns a promise of `{ isPrivate, browserName }`
//   - in this environment it identifies as a Chromium-family browser
//   - rejects when the userAgent is forced to a non-matching value
// We don't fight the platform — fully mocking eval.toString().length isn't safe.
describe('detectIncognito', () => {
  it('returns a Promise that resolves with { isPrivate, browserName }', async () => {
    const result = await detectIncognito();
    expect(result).toBeTruthy();
    expect(typeof result.isPrivate).toBe('boolean');
    expect(typeof result.browserName).toBe('string');
  });

  it('identifies a Chromium-family browser in headless Chrome', async () => {
    const result = await detectIncognito();
    expect(['Chrome', 'Chromium', 'Edge', 'Opera', 'Brave']).toContain(result.browserName);
  });

  it('resolves consistently across multiple calls (idempotent)', async () => {
    const [a, b] = await Promise.all([detectIncognito(), detectIncognito()]);
    expect(a.browserName).toBe(b.browserName);
  });

  it('identifies Edge when userAgent contains "Edg" token', async () => {
    // why: identifyChromium() reads navigator.userAgent at call time; userAgent
    // is a getter on Navigator.prototype, so we override it for this one call.
    const uaDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent')!;
    Object.defineProperty(Navigator.prototype, 'userAgent', {
      configurable: true,
      get: () => 'Mozilla/5.0 Chrome/120 Edg/120 Safari',
    });
    try {
      const result = await detectIncognito();
      expect(result.browserName).toBe('Edge');
    } finally {
      Object.defineProperty(Navigator.prototype, 'userAgent', uaDesc);
    }
  });

  it('identifies Opera when userAgent contains "OPR" token', async () => {
    const uaDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent')!;
    Object.defineProperty(Navigator.prototype, 'userAgent', {
      configurable: true,
      get: () => 'Mozilla/5.0 Chrome/120 OPR/100',
    });
    try {
      const result = await detectIncognito();
      expect(result.browserName).toBe('Opera');
    } finally {
      Object.defineProperty(Navigator.prototype, 'userAgent', uaDesc);
    }
  });

  it('identifies Brave when navigator.brave is defined', async () => {
    (navigator as any).brave = {};
    try {
      const result = await detectIncognito();
      expect(result.browserName).toBe('Brave');
    } finally {
      delete (navigator as any).brave;
    }
  });

  it('returns "Chromium" when userAgent has no Chrome token', async () => {
    const uaDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent')!;
    Object.defineProperty(Navigator.prototype, 'userAgent', {
      configurable: true,
      get: () => 'CustomBrowser/1.0',
    });
    try {
      const result = await detectIncognito();
      expect(result.browserName).toBe('Chromium');
    } finally {
      Object.defineProperty(Navigator.prototype, 'userAgent', uaDesc);
    }
  });

  it('rejects when vendor does not match Chrome/Safari (no fallback branch matches)', async () => {
    const vendorDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'vendor')!;
    Object.defineProperty(Navigator.prototype, 'vendor', {
      configurable: true,
      get: () => 'No-Vendor',
    });
    // ensure isMSIE() is false (no msSaveBlob), isFirefox() false (no MozAppearance)
    delete (navigator as any).msSaveBlob;
    try {
      await expectAsync(detectIncognito()).toBeRejectedWithError(
        /detectIncognito cannot determine the browser/
      );
    } finally {
      Object.defineProperty(Navigator.prototype, 'vendor', vendorDesc);
    }
  });
});
