import {
  sdIsAllowedOrigin,
  sdIsExternalHttpUrl,
  sdIsSafeResourceUrl,
  sdParseUrl,
  sdResolveBaseOrigin,
} from '@sdcorejs/angular/utilities/extensions';

// why: the ONE place where a URL typed by a form designer becomes an `href` or a `src`. The schema is stored by
// the portal and can be edited outside the builder, so every value is untrusted. The renderer, the builder
// canvas and the inspector warnings all call these two functions. Every decision reads the PARSED URL — the
// parser lower-cases the scheme and drops tab/newline characters, so `JavaScript:` or `java\tscript:` cannot
// slip through a string test. The value returned is the trimmed original (never `parsed.href`, which would
// write the stand-in origin into server-rendered HTML).

const LINK_SCHEMES: ReadonlySet<string> = new Set(['mailto:', 'tel:']);

const trimmed = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text ? text : null;
};

/**
 * `href` an toàn của link, hoặc `null` (không tạo thẻ `a`): chấp nhận http(s) tuyệt đối không kèm credential,
 * `mailto:`, `tel:` và đường dẫn tương đối ở lại origin của trang (`//evil.tld`, `/\evil.tld` bị từ chối).
 */
export function sdFormGenericLinkHref(value: unknown, baseOrigin?: string): string | null {
  const href = trimmed(value);
  if (!href) return null;
  // why: parsed WITHOUT a base, a value only succeeds when it carries its own scheme.
  const absolute = sdParseUrl(href);
  if (absolute) {
    if (LINK_SCHEMES.has(absolute.protocol)) return href;
    return sdIsExternalHttpUrl(href) ? href : null;
  }
  return sdIsAllowedOrigin(href, [], baseOrigin) ? href : null;
}

/**
 * `src` an toàn của image, hoặc `null` (không tạo thẻ `img`): chấp nhận http(s) không kèm credential, đường dẫn
 * tương đối và `data:image/*`; từ chối `blob:` và mọi `data:` khác.
 */
export function sdFormGenericImageSrc(value: unknown, baseOrigin?: string): string | null {
  const src = trimmed(value);
  if (!src || !sdIsSafeResourceUrl(src, baseOrigin)) return null;
  const parsed = sdParseUrl(src, sdResolveBaseOrigin(baseOrigin));
  if (!parsed || parsed.protocol === 'blob:') return null;
  if (parsed.protocol === 'data:' && !parsed.pathname.toLowerCase().startsWith('image/')) return null;
  return src;
}
