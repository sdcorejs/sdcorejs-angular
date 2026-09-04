import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { SdSafeHtmlPipe } from './safe-html.pipe';

describe('SdSafeHtmlPipe', () => {
  let pipe: SdSafeHtmlPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule],
      providers: [SdSafeHtmlPipe],
    });
    pipe = TestBed.inject(SdSafeHtmlPipe);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  const asHtml = (value: unknown): string => String(value ?? '');

  describe('default (untrusted) mode', () => {
    // why: the pipe used to call bypassSecurityTrustHtml() on every value with no sanitize step,
    // and the table pipes server-supplied cell data through it
    // (components/table/src/components/desktop-cell/view/view.component.html). These are the
    // stored-XSS regression guards. The previous specs asserted the opposite — that the pipe always
    // returned a bypassed SafeValue — which locked the vulnerability in place.
    it('strips a script tag', () => {
      const result = asHtml(pipe.transform('<p>hello</p><script>alert(1)</script>'));

      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert(1)');
      expect(result).toContain('hello');
    });

    it('strips inline event handlers', () => {
      const result = asHtml(pipe.transform('<img src="x" onerror="alert(1)">'));

      expect(result.toLowerCase()).not.toContain('onerror');
    });

    it('neutralises javascript: urls', () => {
      // why: Angular's sanitizer does not delete a dangerous href, it rewrites the scheme to
      // `unsafe:` so the browser refuses to navigate. Assert the neutralised form, not absence.
      const result = asHtml(pipe.transform('<a href="javascript:alert(1)">x</a>'));

      expect(result).toContain('unsafe:javascript:');
      expect(result).not.toContain('href="javascript:');
    });

    it('keeps benign formatting markup so existing call sites still render', () => {
      const result = asHtml(pipe.transform('<mark>hit</mark> and <b>bold</b>'));

      expect(result).toContain('<mark>');
      expect(result).toContain('<b>');
    });

    it('returns a plain sanitized string rather than a bypassed SafeValue', () => {
      expect(typeof pipe.transform('<b>Hello</b>')).toBe('string');
      expect(typeof pipe.transform('Hello World')).toBe('string');
      expect(typeof pipe.transform('<div><p>Test</p></div>')).toBe('string');
    });

    it('returns an empty string when the value sanitizes away entirely', () => {
      expect(pipe.transform('<script>alert(1)</script>')).toBe('');
    });
  });

  describe('trusted mode (explicit opt-in)', () => {
    it('bypasses the sanitizer when the caller passes true', () => {
      const result = pipe.transform('<b>Hello</b>', true);

      // A bypassed value is a SafeValue object, not a string.
      expect(typeof result).not.toBe('string');
      expect(sanitizer.sanitize(SecurityContext.HTML, result as never)).toContain('<b>Hello</b>');
    });

    it('preserves markup that the default mode would strip', () => {
      const trusted = pipe.transform('<p onclick="go()">x</p>', true);
      const untrusted = asHtml(pipe.transform('<p onclick="go()">x</p>'));

      expect(typeof trusted).not.toBe('string');
      expect(untrusted.toLowerCase()).not.toContain('onclick');
    });
  });

  describe('non-html inputs', () => {
    it('returns a number value as-is', () => {
      expect(pipe.transform(42)).toBe(42);
      expect(pipe.transform(0)).toBe(0);
      expect(pipe.transform(-5)).toBe(-5);
    });

    it('returns undefined for null, undefined and an empty string', () => {
      expect(pipe.transform(null)).toBeUndefined();
      expect(pipe.transform(undefined)).toBeUndefined();
      expect(pipe.transform('')).toBeUndefined();
    });
  });
});
