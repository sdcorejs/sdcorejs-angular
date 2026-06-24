import { Inject, Injectable, Optional } from '@angular/core';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';

@Injectable({
  providedIn: 'root',
})
export class SdLicenseService {
  readonly #SALT = 'angular-core-976e2fa6f8b44dadbc63f87b057a331f';
  #isValid = false;

  constructor(
    @Inject(SD_CORE_CONFIGURATION)
    @Optional()
    private readonly coreConfiguration: ISdCoreConfiguration | undefined
  ) {
    this.#verify();
  }

  enforceLicense = () => {
    if (!this.#isValid) {
      this.#throwSecurityError();
    }
  };

  #verify = () => {
    const hostname = window.location.hostname; // Ví dụ: store.uat.nexa.mobi

    // 1. Bypass Localhost
    if (this.#isLocalhost(hostname)) {
      console.log('%c [SdAngularCore] Dev Mode ', 'background: #222; color: #bada55');
      this.#isValid = true;
      return;
    }

    const configKeys = this.#getConfiguredKeys();
    if (configKeys.length === 0) {
      this.#isValid = false;
      this.#throwSecurityError();
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
    return domain === 'localhost' || domain === '127.0.0.1' || domain.includes('localhost');
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
    throw new Error(`[Security] Unauthorized usage of UI Lib on domain: ${window.location.hostname}`);
  };
}
