import { InjectionToken } from "@angular/core";
import type { Language } from "@sdcorejs/angular/models";

export interface ISdCoreConfiguration {
  // License Key Ä‘Æ°á»£c cáº¥p theo domain/sub domain, vÃ­ dá»¥: domain.com, sub.domain.com
  // Domain localhost, 127.0.0.1 khÃ´ng cáº§n key
  // CÃ¡c domain DEV/QC/UAT/PROD ... cáº§n key tÆ°Æ¡ng á»©ng cho tá»«ng domain
  licenseKey?: string | string[];
  format?: {
    number?: '1,234,567.89' | '1.234.567,89'; // Default: '1,234,567.89'
  };
  // NgÃ´n ngá»¯ máº·c Ä‘á»‹nh cho cÃ¡c message cá»§a Core UI.
  // - Language enum ('vi' | 'en' | 'ja' | 'ko' | 'zh') â€” dÃ¹ng catalog built-in.
  // - Function () => Record<string, string> â€” custom catalog do portal tá»± Ä‘á»‹nh nghÄ©a.
  // CÃ³ thá»ƒ bá»‹ override bá»Ÿi localStorage (chá»‰ Language enum). Default: 'vi'.
  language?: Language | (() => Record<string, string>);
}

export const SD_CORE_CONFIGURATION = new InjectionToken<ISdCoreConfiguration>('sd-core.configuration');

