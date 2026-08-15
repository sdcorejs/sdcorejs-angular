import {
  SD_NON_BROWSER_ORIGIN,
  sdIsAllowedOrigin,
  sdIsExternalHttpUrl,
  sdIsPathPrefix,
  sdMatchesSecureRoute,
  sdParseUrl,
  sdResolveBaseOrigin,
} from './url-safety';

const APP_ORIGIN = 'https://app.example.com';

/**
 * why: giá trị này KHÔNG parse được kể cả khi có base — `new URL('http://', base)` ném vì input đã
 * mang scheme nên base bị bỏ qua, mà `'http://'` thì thiếu host. Ngược lại `'::::'` LẠI parse được
 * với base (`https://app.example.com/::::`), nên dùng nó để test "fail closed vì không parse nổi"
 * là sai: spec vẫn xanh chỉ vì path không khớp, và sẽ vẫn xanh kể cả khi sdParseUrl không bao giờ
 * trả `undefined`.
 */
const UNPARSEABLE_WITH_BASE = 'http://';

describe('url-safety', () => {
  describe('sdParseUrl', () => {
    it('parses an absolute url', () => {
      expect(sdParseUrl('https://a.example.com/x')?.origin).toBe('https://a.example.com');
    });

    it('resolves a relative url against the base', () => {
      expect(sdParseUrl('/api/v1', APP_ORIGIN)?.href).toBe(`${APP_ORIGIN}/api/v1`);
    });

    it('returns undefined instead of throwing for garbage', () => {
      expect(sdParseUrl('::::')).toBeUndefined();
      expect(sdParseUrl('')).toBeUndefined();
      expect(sdParseUrl('   ')).toBeUndefined();
      expect(sdParseUrl(null)).toBeUndefined();
      expect(sdParseUrl(undefined)).toBeUndefined();
    });

    it('returns undefined for a relative url with no base', () => {
      expect(sdParseUrl('/api/v1')).toBeUndefined();
    });

    it('still resolves a value that only LOOKS like garbage when a base is supplied', () => {
      // Neo cho spec fail-closed bên dưới: `'::::'` không phải ví dụ "không parse được" khi có base.
      expect(sdParseUrl('::::', APP_ORIGIN)?.pathname).toBe('/::::');
    });

    it('returns undefined for a value that genuinely fails to parse against a base', () => {
      expect(sdParseUrl(UNPARSEABLE_WITH_BASE, APP_ORIGIN)).toBeUndefined();
      expect(sdParseUrl('https://', APP_ORIGIN)).toBeUndefined();
      expect(sdParseUrl('http://[', APP_ORIGIN)).toBeUndefined();
    });
  });

  describe('sdResolveBaseOrigin', () => {
    it('returns the explicit origin when one is supplied', () => {
      expect(sdResolveBaseOrigin(APP_ORIGIN)).toBe(APP_ORIGIN);
    });

    it('falls back to window.location.origin inside a browser', () => {
      expect(sdResolveBaseOrigin()).toBe(window.location.origin);
    });

    it('exposes a synthetic origin for non-browser environments', () => {
      // why: không có base thì một route entry tương đối như `'/api/v1'` không parse nổi, nên mọi
      // check origin-aware sẽ âm thầm trả `false` trên server — keycloak interceptor sẽ ngừng đính
      // bearer token vào MỌI request server-rendered. Một origin tổng hợp cố định giữ cho phép so
      // tương-đối-với-tương-đối nhất quán, trong khi route entry TUYỆT ĐỐI vẫn phải khớp origin thật.
      expect(SD_NON_BROWSER_ORIGIN).toBe('http://sdcorejs.invalid');
      expect(sdParseUrl('/api/v1', SD_NON_BROWSER_ORIGIN)?.origin).toBe(SD_NON_BROWSER_ORIGIN);
    });

    it('matches a relative secureRoute against a relative url under the synthetic origin', () => {
      expect(sdMatchesSecureRoute('/api/v1/users', ['/api/v1'], SD_NON_BROWSER_ORIGIN)).toBeTrue();
      // Một origin thật vẫn không lọt qua nhờ base tổng hợp.
      expect(sdMatchesSecureRoute('https://evil.example.com/api/v1/x', ['/api/v1'], SD_NON_BROWSER_ORIGIN)).toBeFalse();
    });
  });

  describe('sdIsExternalHttpUrl', () => {
    it('accepts http and https', () => {
      expect(sdIsExternalHttpUrl('http://a.example.com')).toBeTrue();
      expect(sdIsExternalHttpUrl('https://a.example.com/deep/path?q=1')).toBeTrue();
    });

    it('rejects the javascript: payloads that the old includes("http") test accepted', () => {
      // why: this exact string passes `path.includes('http')`, which is what the sidebars used to
      // gate `window.open()` on — so it executed script in the app origin.
      expect(sdIsExternalHttpUrl('javascript:fetch("//evil.example.com")//http')).toBeFalse();
      expect(sdIsExternalHttpUrl('javascript:alert(1)')).toBeFalse();
    });

    it('rejects other dangerous schemes', () => {
      expect(sdIsExternalHttpUrl('data:text/html,<script>alert(1)</script>')).toBeFalse();
      expect(sdIsExternalHttpUrl('vbscript:msgbox(1)')).toBeFalse();
      expect(sdIsExternalHttpUrl('file:///etc/passwd')).toBeFalse();
    });

    it('rejects relative paths and blank values', () => {
      expect(sdIsExternalHttpUrl('/internal/page')).toBeFalse();
      expect(sdIsExternalHttpUrl('')).toBeFalse();
      expect(sdIsExternalHttpUrl(null)).toBeFalse();
      expect(sdIsExternalHttpUrl(undefined)).toBeFalse();
    });

    it('rejects the "httpfoo" family that startsWith("http") accepted', () => {
      expect(sdIsExternalHttpUrl('httpfoo')).toBeFalse();
    });

    it('rejects a URL with embedded credentials that fakes a trusted host', () => {
      // why: `new URL('https://real.com@evil.tld/x')` có protocol `https:` nhưng host THẬT là
      // `evil.tld` — phần trước `@` chỉ là username. Đây đúng là kiểu giả mạo ở tầng parse mà
      // helper này sinh ra để chặn, nên phải loại tường minh.
      expect(sdIsExternalHttpUrl('https://real.com@evil.tld/x')).toBeFalse();
      expect(sdIsExternalHttpUrl('https://user:pass@evil.tld/x')).toBeFalse();
      expect(new URL('https://real.com@evil.tld/x').host).toBe('evil.tld');
    });

    it('still accepts the same host without credentials', () => {
      expect(sdIsExternalHttpUrl('https://real.com/x')).toBeTrue();
    });
  });

  describe('sdIsPathPrefix', () => {
    it('matches the prefix itself and its descendants', () => {
      expect(sdIsPathPrefix('/api/v1', '/api/v1')).toBeTrue();
      expect(sdIsPathPrefix('/api/v1', '/api/v1/users')).toBeTrue();
    });

    it('does not match a sibling that merely shares a string prefix', () => {
      expect(sdIsPathPrefix('/api/v1', '/api/v1beta')).toBeFalse();
      expect(sdIsPathPrefix('/api/v1', '/api/v10')).toBeFalse();
    });

    it('treats a bare slash as matching everything', () => {
      expect(sdIsPathPrefix('/', '/anything/at/all')).toBeTrue();
    });

    it('ignores a trailing slash on the prefix', () => {
      expect(sdIsPathPrefix('/api/v1/', '/api/v1/users')).toBeTrue();
    });

    it('fails CLOSED for an empty prefix instead of matching everything', () => {
      // why: chuỗi rỗng gần như luôn là biến chưa gán / config sót, chứ không phải chủ ý "cho qua
      // hết". Chỉ `'/'` mới là universal prefix, đúng như docblock công bố.
      expect(sdIsPathPrefix('', '/anything')).toBeFalse();
      expect(sdIsPathPrefix('', '/')).toBeFalse();
      expect(sdIsPathPrefix('', '')).toBeFalse();
      expect(sdIsPathPrefix('/', '/anything')).toBeTrue();
    });
  });

  describe('sdMatchesSecureRoute', () => {
    it('matches a same-origin request under a path prefix', () => {
      expect(sdMatchesSecureRoute('/api/v1/users', ['/api/v1'], APP_ORIGIN)).toBeTrue();
      expect(sdMatchesSecureRoute(`${APP_ORIGIN}/api/v1/users`, ['/api/v1'], APP_ORIGIN)).toBeTrue();
    });

    it('REFUSES a third-party host whose path merely contains the route', () => {
      // why: this is the token-leak regression. `url.includes('/api/v1')` returned true here, so the
      // keycloak interceptor attached `Authorization: Bearer <token>` to a request to evil.example.com.
      expect(sdMatchesSecureRoute('https://evil.example.com/api/v1/collect', ['/api/v1'], APP_ORIGIN)).toBeFalse();
    });

    it('refuses a lookalike domain that string-prefixes the configured host', () => {
      expect(sdMatchesSecureRoute('https://api.example.com.evil.tld/v1/x', ['https://api.example.com'], APP_ORIGIN)).toBeFalse();
    });

    it('matches an explicitly configured absolute origin', () => {
      expect(sdMatchesSecureRoute('https://api.example.com/v1/users', ['https://api.example.com/v1'], APP_ORIGIN)).toBeTrue();
    });

    it('does not match a different path on a configured origin', () => {
      expect(sdMatchesSecureRoute('https://api.example.com/public/ping', ['https://api.example.com/v1'], APP_ORIGIN)).toBeFalse();
    });

    it('fails closed when routes are missing or empty', () => {
      expect(sdMatchesSecureRoute('/api/v1/users', undefined, APP_ORIGIN)).toBeFalse();
      expect(sdMatchesSecureRoute('/api/v1/users', [], APP_ORIGIN)).toBeFalse();
      expect(sdMatchesSecureRoute('/api/v1/users', [''], APP_ORIGIN)).toBeFalse();
    });

    it('fails closed for an unparseable request url', () => {
      // Chứng minh trước là giá trị này THẬT SỰ không parse nổi — nếu không, spec chỉ đang khẳng
      // định "path không khớp" và sẽ vẫn xanh dù sdParseUrl không bao giờ trả undefined.
      expect(sdParseUrl(UNPARSEABLE_WITH_BASE, APP_ORIGIN)).toBeUndefined();
      expect(sdMatchesSecureRoute(UNPARSEABLE_WITH_BASE, ['/api/v1'], APP_ORIGIN)).toBeFalse();
      expect(sdMatchesSecureRoute('http://[', ['/api/v1'], APP_ORIGIN)).toBeFalse();
    });

    it('fails closed for an unparseable ROUTE entry', () => {
      expect(sdMatchesSecureRoute('/api/v1/users', [UNPARSEABLE_WITH_BASE], APP_ORIGIN)).toBeFalse();
    });
  });

  describe('sdIsAllowedOrigin', () => {
    it('treats relative urls as same-origin', () => {
      expect(sdIsAllowedOrigin('/api/v1', [], APP_ORIGIN)).toBeTrue();
    });

    it('accepts an explicitly allowed origin', () => {
      expect(sdIsAllowedOrigin('https://cdn.example.com/x', ['https://cdn.example.com'], APP_ORIGIN)).toBeTrue();
    });

    it('rejects an unlisted origin', () => {
      expect(sdIsAllowedOrigin('https://evil.example.com/x', ['https://cdn.example.com'], APP_ORIGIN)).toBeFalse();
    });

    it('rejects a lookalike of an allowed origin', () => {
      expect(sdIsAllowedOrigin('https://cdn.example.com.evil.tld/x', ['https://cdn.example.com'], APP_ORIGIN)).toBeFalse();
    });
  });
});
