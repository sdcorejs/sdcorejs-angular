import { sdMatchesSecureRoute } from '@sdcorejs/angular/utilities/extensions';

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
