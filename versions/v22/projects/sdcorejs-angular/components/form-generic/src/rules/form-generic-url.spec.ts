import { sdFormGenericImageSrc, sdFormGenericLinkHref } from './form-generic-url';

const BASE = 'https://portal.example.com';

describe('form generic URL policy', () => {
  describe('sdFormGenericLinkHref', () => {
    it('keeps an absolute http(s) URL, trimmed and as written', () => {
      expect(sdFormGenericLinkHref('https://example.com/a?b=1', BASE)).toBe('https://example.com/a?b=1');
      expect(sdFormGenericLinkHref('  http://example.com/a  ', BASE)).toBe('http://example.com/a');
      expect(sdFormGenericLinkHref('HTTPS://EXAMPLE.com/Path', BASE)).toBe('HTTPS://EXAMPLE.com/Path');
    });

    it('keeps mailto: and tel: in any case', () => {
      expect(sdFormGenericLinkHref('mailto:help@example.com', BASE)).toBe('mailto:help@example.com');
      expect(sdFormGenericLinkHref('MAILTO:help@example.com', BASE)).toBe('MAILTO:help@example.com');
      expect(sdFormGenericLinkHref('tel:+84123456789', BASE)).toBe('tel:+84123456789');
    });

    it('keeps a relative path that stays on the page origin', () => {
      for (const href of ['/policy', 'policy#terms', '?step=2', '#top', './help', '../faq']) {
        expect(sdFormGenericLinkHref(href, BASE)).withContext(href).toBe(href);
      }
      // why: without an explicit base the page origin is used (Karma's origin here).
      expect(sdFormGenericLinkHref('/policy')).toBe('/policy');
    });

    it('refuses a relative-looking URL that leaves the origin', () => {
      for (const href of ['//evil.tld/x', '/\\evil.tld/x', '\\\\evil.tld/x', '\\/evil.tld']) {
        expect(sdFormGenericLinkHref(href, BASE)).withContext(href).toBeNull();
      }
    });

    it('refuses script and data URLs, including case, whitespace and control-character tricks', () => {
      for (const href of [
        'javascript:alert(1)',
        ' JavaScript:alert(1)',
        'java\tscript:alert(1)',
        'java\nscript:alert(1)',
        'JAVASCRIPT:alert(1)',
        'vbscript:msgbox(1)',
        'data:text/html,<b>x</b>',
        'data:image/png;base64,AAAA',
        'blob:https://portal.example.com/0b8f',
        'file:///c:/secret.txt',
        'ftp://example.com/a',
      ]) {
        expect(sdFormGenericLinkHref(href, BASE)).withContext(JSON.stringify(href)).toBeNull();
      }
    });

    it('refuses an http(s) URL with embedded credentials', () => {
      expect(sdFormGenericLinkHref('https://user:pass@example.com/x', BASE)).toBeNull();
      expect(sdFormGenericLinkHref('https://portal.example.com@evil.tld/x', BASE)).toBeNull();
    });

    it('treats an empty, blank, non-string or unparseable value as not set', () => {
      for (const value of ['', '   ', null, undefined, 42, {}, 'http://[::1']) {
        expect(sdFormGenericLinkHref(value, BASE)).withContext(JSON.stringify(value)).toBeNull();
      }
    });
  });

  describe('sdFormGenericImageSrc', () => {
    it('keeps an http(s) URL, a relative path and a data:image URL', () => {
      for (const src of [
        'https://cdn.example.com/logo.png',
        '/assets/logo.svg',
        'images/logo.png',
        '//cdn.example.com/logo.png',
        'data:image/png;base64,AAAA',
        'DATA:image/svg+xml,%3Csvg%3E%3C/svg%3E',
      ]) {
        expect(sdFormGenericImageSrc(src, BASE)).withContext(src).toBe(src);
      }
      expect(sdFormGenericImageSrc('  https://cdn.example.com/a.png ', BASE)).toBe('https://cdn.example.com/a.png');
    });

    it('refuses data URLs that are not images, blob:, script URLs and embedded credentials', () => {
      for (const src of [
        'data:application/pdf;base64,AAAA',
        'data:text/html,<script>x</script>',
        'blob:https://portal.example.com/0b8f',
        'javascript:alert(1)',
        'java\tscript:alert(1)',
        'https://user:pass@cdn.example.com/a.png',
        'file:///c:/a.png',
      ]) {
        expect(sdFormGenericImageSrc(src, BASE)).withContext(JSON.stringify(src)).toBeNull();
      }
    });

    it('treats an empty, blank or non-string value as not set', () => {
      for (const value of ['', '  ', null, undefined, 7])
        expect(sdFormGenericImageSrc(value, BASE)).withContext(JSON.stringify(value)).toBeNull();
    });
  });
});
