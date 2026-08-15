/**
 * URL safety helpers.
 *
 * why: this library used to decide "is this an external link?" and "should this request carry the
 * bearer token?" with plain substring tests — `path.includes('http')` and `url.includes(route)`.
 * Both are unsound:
 *
 *   - `'javascript:fetch(...)//http'.includes('http')` is `true`, so a menu entry could be opened
 *     with `window.open()` and execute script in the app origin.
 *   - With `secureRoutes: ['/api/v1']`, `'https://evil.example.com/api/v1/collect'.includes('/api/v1')`
 *     is `true`, so a third-party host received the `Authorization: Bearer <token>` header.
 *
 * Everything here parses the URL instead of pattern-matching the string, and fails closed.
 */

/** Schemes we are willing to navigate to or open in a new tab. */
const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Stand-in origin used when there is no `window.location` (SSR, prerender, unit tests).
 *
 * why: without a base, a relative route entry like `'/api/v1'` cannot be parsed, so every
 * origin-aware check would silently answer `false` on the server — e.g. the keycloak interceptor
 * would stop attaching the bearer token to every server-rendered request. Resolving BOTH the route
 * entry and the request URL against one fixed synthetic origin keeps relative-vs-relative matching
 * consistent across environments, while an ABSOLUTE route entry still has to match a real origin,
 * so nothing is loosened.
 */
export const SD_NON_BROWSER_ORIGIN = 'http://sdcorejs.invalid';

/** Resolve the origin that relative URLs should be interpreted against. */
export function sdResolveBaseOrigin(explicit?: string): string {
  if (explicit) return explicit;
  return typeof window === 'undefined' || !window.location?.origin ? SD_NON_BROWSER_ORIGIN : window.location.origin;
}

/**
 * Parse `value` into a URL. Relative values are resolved against `base` when one is supplied.
 * Returns `undefined` instead of throwing so callers can fail closed with a simple null check.
 */
export function sdParseUrl(value: string | null | undefined, base?: string): URL | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    return base ? new URL(trimmed, base) : new URL(trimmed);
  } catch {
    return undefined;
  }
}

/**
 * True only when `value` is an ABSOLUTE `http:`/`https:` URL.
 *
 * Replaces `url.startsWith('http')` / `path.includes('http')`. Note that `startsWith('http')` also
 * accepts nonsense like `'httpfoo'`, and `includes('http')` accepts any string that merely mentions
 * it — including `javascript:` payloads.
 */
export function sdIsExternalHttpUrl(value: string | null | undefined): boolean {
  const parsed = sdParseUrl(value);
  if (parsed == null || !SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol)) return false;
  // why: từ chối URL có credential nhúng. `new URL('https://portal.mycompany.com@evil.tld/x')` có
  // protocol `https:` và host thật là `evil.tld` — phần trước `@` chỉ là username. Đây đúng là kiểu
  // giả mạo ở tầng parse mà helper này sinh ra để chặn, nên phải loại tường minh.
  if (parsed.username || parsed.password) return false;
  return true;
}

/**
 * Open an external link in a new browsing context.
 *
 * Refuses anything that is not absolute `http:`/`https:` (returns `null` without opening), and
 * always passes `noopener,noreferrer` so the opened page cannot reach back through `window.opener`
 * (reverse tabnabbing).
 */
export function sdOpenExternal(value: string | null | undefined, target = '_blank'): Window | null {
  if (!sdIsExternalHttpUrl(value)) return null;
  // why: `noopener` is what severs `window.opener`; `noreferrer` additionally withholds the
  // Referer header. Passing them as the third argument works in every browser we support.
  return typeof window === 'undefined' ? null : window.open(value as string, target, 'noopener,noreferrer');
}

/**
 * True when `url` is same-origin, or its origin is in `allowedOrigins`.
 *
 * Relative URLs (`/api/v1/users`) always count as same-origin. Outside a browser they resolve
 * against {@link SD_NON_BROWSER_ORIGIN} unless `baseOrigin` is supplied.
 */
export function sdIsAllowedOrigin(url: string | null | undefined, allowedOrigins: readonly string[], baseOrigin?: string): boolean {
  const base = sdResolveBaseOrigin(baseOrigin);
  const parsed = sdParseUrl(url, base);
  if (!parsed) return false;
  if (parsed.origin === base) return true;
  return allowedOrigins.some(allowed => {
    const allowedUrl = sdParseUrl(allowed, base);
    return allowedUrl != null && allowedUrl.origin === parsed.origin;
  });
}

/**
 * Decide whether an outgoing request matches one of the configured secure routes, i.e. whether it
 * is allowed to carry credentials.
 *
 * A route entry is either:
 *   - a path prefix (`'/api/v1'`) — matches ONLY same-origin requests under that path, or
 *   - an absolute URL (`'https://api.example.com/v1'`) — matches that exact origin, under that path.
 *
 * Path matching is segment-aware: `'/api/v1'` matches `/api/v1` and `/api/v1/users`, but NOT
 * `/api/v1beta`. Anything that fails to parse returns `false`.
 */
export function sdMatchesSecureRoute(url: string | null | undefined, routes: readonly string[] | undefined, baseOrigin?: string): boolean {
  if (!routes?.length) return false;
  const base = sdResolveBaseOrigin(baseOrigin);
  const parsed = sdParseUrl(url, base);
  if (!parsed) return false;

  return routes.some(route => {
    if (typeof route !== 'string' || !route.trim()) return false;
    const routeUrl = sdParseUrl(route, base);
    if (!routeUrl) return false;
    if (routeUrl.origin !== parsed.origin) return false;
    return sdIsPathPrefix(routeUrl.pathname, parsed.pathname);
  });
}

/**
 * Segment-aware path prefix test: `/api/v1` covers `/api/v1` and `/api/v1/users`, but not
 * `/api/v1beta`. A bare `/` prefix covers everything on that origin.
 */
export function sdIsPathPrefix(prefix: string, pathname: string): boolean {
  // why: prefix rỗng fail CLOSED (trả false), KHÔNG phải khớp-tất-cả. Đây là helper bảo mật và
  // chuỗi rỗng gần như luôn là biến chưa gán / config sót, chứ không phải chủ ý "cho qua hết".
  // Chỉ `'/'` mới là universal prefix, đúng như docblock công bố.
  if (typeof prefix !== 'string' || prefix === '') return false;
  const normalizedPrefix = prefix.endsWith('/') && prefix.length > 1 ? prefix.slice(0, -1) : prefix;
  if (normalizedPrefix === '/') return true;
  if (pathname === normalizedPrefix) return true;
  return pathname.startsWith(`${normalizedPrefix}/`);
}
