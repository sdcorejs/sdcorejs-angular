import { sdMatchesSecureRoute, sdParseUrl, sdResolveBaseOrigin } from '@sdcorejs/angular/utilities/extensions';
import { ISdApiConfiguration, SdApiHandler } from './api.model';

/**
 * Handler nào chịu trách nhiệm cho `url`?
 *
 * why: trước đây là `url.startsWith(host)` — so chuỗi thô. Với host `https://api.example.com`,
 * url `https://api.example.com.attacker.tld/x` cũng "khớp", nên handler chạy `intercept` cho host
 * giả mạo đó và gắn luôn header auth mà nó đính kèm. `sdMatchesSecureRoute` parse URL rồi so
 * origin + path prefix theo segment, nên `.attacker.tld` khác origin → không khớp, và
 * `/api/v1beta` không bị coi là nằm dưới `/api/v1`.
 *
 * Việc chọn base origin khi không có `window.location` (SSR/prerender) do
 * `sdResolveBaseOrigin` trong `url-safety` lo — trước đây file này tự giữ một origin giả riêng,
 * nhưng `SdKeycloakInterceptor` lại không có, nên nó âm thầm ngừng đính token trên server. Logic
 * đó giờ nằm ở helper chung để mọi call site cùng hành xử.
 */
export function sdApiMatchesHandlerHosts(url: string, hosts: readonly string[] | undefined): boolean {
  return sdMatchesSecureRoute(url, hosts);
}

/**
 * Độ dài prefix (origin + path) của host khớp DÀI NHẤT với `url`; `-1` khi không host nào khớp.
 * Host trống/không parse được fail closed như `sdMatchesSecureRoute`.
 */
export function sdApiHandlerMatchLength(url: string, hosts: readonly string[] | undefined): number {
  let best = -1;
  const base = sdResolveBaseOrigin();
  for (const host of hosts ?? []) {
    if (!sdMatchesSecureRoute(url, [host])) continue;
    const route = sdParseUrl(host, base);
    if (!route) continue;
    const path = route.pathname.length > 1 && route.pathname.endsWith('/') ? route.pathname.slice(0, -1) : route.pathname;
    best = Math.max(best, route.origin.length + (path === '/' ? 0 : path.length));
  }
  return best;
}

/**
 * Handler chịu trách nhiệm cho `url`: host khớp prefix DÀI NHẤT thắng; hai host dài bằng nhau thì
 * handler đăng ký trước thắng.
 *
 * why: trước đây là `handlers.find(...)` — handler đầu tiên khớp thắng, nên khi nhiều lib nằm sau
 * cùng một gateway (phân biệt bằng context path) thì thứ tự đăng ký quyết định ai nhận request.
 * Giờ `https://gw.example/bpm` thắng `https://gw.example` bất kể thứ tự.
 */
export function sdResolveApiHandler(
  url: string,
  configurations: readonly (ISdApiConfiguration | null | undefined)[]
): SdApiHandler | undefined {
  let best: SdApiHandler | undefined;
  let bestLength = -1;
  for (const configuration of configurations) {
    for (const handler of configuration?.handlers ?? []) {
      if (!handler) continue;
      const length = sdApiHandlerMatchLength(url, handler.hosts);
      if (length > bestLength) {
        best = handler;
        bestLength = length;
      }
    }
  }
  return best;
}
