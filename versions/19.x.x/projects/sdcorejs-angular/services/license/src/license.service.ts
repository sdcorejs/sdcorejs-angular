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
    const hostname = window.location.hostname; // VÃ­ dá»¥: store.uat.nexa.mobi

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

    // 2. CHECK EXACT MATCH (Æ¯u tiÃªn khá»›p chÃ­nh xÃ¡c 100%)
    // Hash chuá»—i: "store.uat.nexa.mobi" + SALT
    if (this.#checkMatch(hostname, configKeys)) {
      this.#isValid = true;
      return;
    }

    // 3. CHECK WILDCARD MATCH (Thá»­ cÃ¡c trÆ°á»ng há»£p cÃ³ dáº¥u *)
    const parts = hostname.split('.'); // ["store", "uat", "nexa", "mobi"]

    // Láº·p Ä‘á»ƒ cáº¯t dáº§n subdomain bÃªn trÃ¡i vÃ  thÃªm "*." vÃ o
    // Äiá»u kiá»‡n > 2 Ä‘á»ƒ Ä‘áº£m báº£o khÃ´ng check cÃ¡c case vÃ´ nghÄ©a nhÆ° *.mobi hay *.com
    while (parts.length > 2) {
      parts.shift(); // Bá» pháº§n Ä‘áº§u: ["uat", "nexa", "mobi"]
      
      // Táº¡o domain wildcard: "*.uat.nexa.mobi"
      const wildcardDomain = '*.' + parts.join('.'); 
      
      // Hash chuá»—i: "*.uat.nexa.mobi" + SALT
      if (this.#checkMatch(wildcardDomain, configKeys)) {
        this.#isValid = true;
        return;
      }
    }

    // Náº¿u cháº¡y háº¿t vÃ²ng láº·p mÃ  khÃ´ng khá»›p cÃ¡i nÃ o
    this.#isValid = false;
    this.#throwSecurityError();
  };

  // Helper Ä‘á»ƒ check xem hash cá»§a input cÃ³ náº±m trong list key khÃ´ng
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
