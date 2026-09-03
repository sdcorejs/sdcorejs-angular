import { InjectionToken } from '@angular/core';
import type { Language } from '@sdcorejs/utils/models';

export interface ISdCoreConfiguration {
  format?: {
    number?: '1,234,567.89' | '1.234.567,89'; // Default: '1,234,567.89'
  };
  // Ngôn ngữ mặc định cho các message của Core UI.
  // - Language enum ('vi' | 'en' | 'ja' | 'ko' | 'zh') — dùng catalog built-in.
  // - Function () => Record<string, string> — custom catalog do portal tự định nghĩa.
  // Có thể bị override bởi localStorage (chỉ Language enum). Default: 'vi'.
  language?: Language | (() => Record<string, string>);
}

export const SD_CORE_CONFIGURATION = new InjectionToken<ISdCoreConfiguration>('sd-core.configuration');
