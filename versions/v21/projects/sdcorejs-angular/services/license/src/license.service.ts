import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, isDevMode, PLATFORM_ID } from '@angular/core';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';

/**
 * @deprecated Dormant since release `1.6` — no component in the package enforces a license any more
 * (see CHANGELOG entry #21). Kept only so existing subclasses of `SdBaseSecureComponent` keep
 * compiling; it will be **removed in release `1.8`**. Do not wire new code to it.
 */
@Injectable({
  providedIn: 'root',
})
export class SdLicenseService {
  readonly #SALT = 'angular-core-976e2fa6f8b44dadbc63f87b057a331f';
  #isValid = false;
  private readonly coreConfiguration: ISdCoreConfiguration | null = inject(SD_CORE_CONFIGURATION, { optional: true });
  // why: đọc thẳng `window.location.hostname` trong constructor làm service chết dưới SSR
  // (`ReferenceError: window is not defined`) và không test được vì Chrome cấm redefine `window.location`.
  // Lấy hostname qua DOCUMENT/PLATFORM_ID để vừa an toàn nền tảng, vừa thay thế được bằng DI trong test.
  readonly #document = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #hostname: string;

  constructor() {
    // why: `#readHostname` là arrow-field khai báo sau constructor nên chỉ gọi được trong constructor
    // body (mọi field initialiser đã chạy xong tại thời điểm này).
    this.#hostname = this.#readHostname();
    this.#verify();
  }

  /**
   * @deprecated Sẽ bị xoá ở release `1.8`. Không còn component nào trong package gọi hàm này.
   *
   * No-op when no `licenseKey` is configured (the common case for this MIT package). Only a
   * hostname that fails an explicitly configured key list still throws.
   */
  enforceLicense = () => {
    if (!this.#isValid) {
      this.#throwSecurityError();
    }
  };

  #verify = () => {
    // why: SSR/web-worker không có `window`; coi platform không phải browser là hợp lệ và để lần
    // verify thật chạy lại phía client khi app hydrate — thay vì làm nổ cả server render.
    if (!isPlatformBrowser(this.#platformId)) {
      this.#isValid = true;
      return;
    }

    const hostname = this.#hostname; // Ví dụ: store.uat.nexa.mobi

    // 1. Bypass Localhost
    if (this.#isLocalhost(hostname)) {
      this.#isValid = true;
      return;
    }

    const configKeys = this.#getConfiguredKeys();
    if (configKeys.length === 0) {
      // why: đây là package MIT public và license gate đang dormant (CHANGELOG #21) — không component
      // nào extends SdBaseSecureComponent nữa. Throw ở nhánh "chưa cấu hình" biến một entry point còn
      // sống thành crash production cho bất kỳ consumer nào lỡ extends class đó. Không cấu hình
      // `licenseKey` = không bật license gate, chỉ nhắc dev một lần ở dev build.
      this.#isValid = true;
      this.#warnLicenseDisabled();
      return;
    }

    // 2. CHECK EXACT MATCH (Ưu tiên khớp chính xác 100%)
    // Hash chuỗi: "store.uat.nexa.mobi" + SALT
    if (this.#checkMatch(hostname, configKeys)) {
      this.#isValid = true;
      return;
    }

    // 3. CHECK WILDCARD MATCH (Thử các trường hợp có dấu *)
    const parts = hostname.split('.'); // ["store", "uat", "nexa", "mobi"]

    // Lặp để cắt dần subdomain bên trái và thêm "*." vào
    // Điều kiện > 2 để đảm bảo không check các case vô nghĩa như *.mobi hay *.com
    while (parts.length > 2) {
      parts.shift(); // Bỏ phần đầu: ["uat", "nexa", "mobi"]

      // Tạo domain wildcard: "*.uat.nexa.mobi"
      const wildcardDomain = '*.' + parts.join('.');

      // Hash chuỗi: "*.uat.nexa.mobi" + SALT
      if (this.#checkMatch(wildcardDomain, configKeys)) {
        this.#isValid = true;
        return;
      }
    }

    // Nếu chạy hết vòng lặp mà không khớp cái nào
    this.#isValid = false;
    this.#throwSecurityError();
  };

  // Helper để check xem hash của input có nằm trong list key không
  #checkMatch = (inputString: string, validKeys: string[]): boolean => {
    const hash = this.#generateHash(inputString + this.#SALT);
    return validKeys.includes(hash);
  };

  #getConfiguredKeys = (): string[] => {
    const keyOrKeys = this.coreConfiguration?.licenseKey;
    if (!keyOrKeys) return [];
    return Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
  };

  #isLocalhost = (domain: string) => {
    // why: `domain.includes('localhost')` duyệt cả `localhost.attacker.tld` và `notlocalhost.com`,
    // nên chỉ cần dựng hostname chứa chuỗi 'localhost' là bypass sạch license check.
    // Chỉ chấp nhận đúng loopback host, hoặc subdomain thật của `.localhost` (RFC 6761).
    const host = domain.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1' || host.endsWith('.localhost');
  };

  #readHostname = (): string => {
    if (!isPlatformBrowser(this.#platformId)) return '';
    return this.#document?.defaultView?.location?.hostname ?? '';
  };

  #warnLicenseDisabled = () => {
    if (!isDevMode()) return;
    console.warn(
      '[SdLicenseService] No `licenseKey` configured on SD_CORE_CONFIGURATION — license enforcement is disabled. ' +
        'SdLicenseService and SdBaseSecureComponent are deprecated and will be removed in release 1.8.'
    );
  };

  #generateHash = (input: string): string => {
    let hash = 0;
    if (input.length === 0) return hash.toString();
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return btoa(hash.toString() + 'signed');
  };

  #throwSecurityError = () => {
    throw new Error(`[Security] Unauthorized usage of UI Lib on domain: ${this.#hostname}`);
  };
}
