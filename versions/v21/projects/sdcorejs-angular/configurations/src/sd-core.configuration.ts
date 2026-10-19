import { InjectionToken } from '@angular/core';
import type { Language } from '@sdcorejs/utils/models';

/**
 * Time zone the whole app reads and shows dates in: `'local'` (the browser's zone) or an IANA id.
 * The listed ids only drive autocomplete; any IANA id is accepted. Numeric offsets (`'+07:00'`) are
 * rejected because they carry no offset history.
 */
export type SdTimeZone =
  | 'local'
  | 'UTC'
  | 'Asia/Ho_Chi_Minh'
  | 'Asia/Bangkok'
  | 'Asia/Jakarta'
  | 'Asia/Singapore'
  | 'Asia/Kuala_Lumpur'
  | 'Asia/Manila'
  | 'Asia/Shanghai'
  | 'Asia/Hong_Kong'
  | 'Asia/Taipei'
  | 'Asia/Tokyo'
  | 'Asia/Seoul'
  | 'Asia/Kolkata'
  | 'Asia/Dubai'
  | 'Australia/Sydney'
  | 'Europe/London'
  | 'Europe/Paris'
  | 'Europe/Berlin'
  | 'America/New_York'
  | 'America/Chicago'
  | 'America/Los_Angeles'
  // why: keeps autocomplete for the ids above while still accepting every other IANA id.
  | (string & {});

export interface ISdCoreConfiguration {
  format?: {
    number?: '1,234,567.89' | '1.234.567,89'; // Default: '1,234,567.89'
  };
  // Ngôn ngữ mặc định cho các message của Core UI.
  // - Language enum ('vi' | 'en' | 'ja' | 'ko' | 'zh') — dùng catalog built-in.
  // - Function () => Record<string, string> — custom catalog do portal tự định nghĩa.
  // Có thể bị override bởi localStorage (chỉ Language enum). Default: 'vi'.
  language?: Language | (() => Record<string, string>);
  // Múi giờ để hiển thị, parse, lọc và serialize ngày giờ trong toàn app. Default: 'local'.
  // Chỉ đọc từ root injector (SdDateTimeService ở root đọc một lần).
  timeZone?: SdTimeZone;
}

export const SD_CORE_CONFIGURATION = new InjectionToken<ISdCoreConfiguration>('sd-core.configuration');
