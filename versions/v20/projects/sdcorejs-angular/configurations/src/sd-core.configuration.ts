import { InjectionToken } from "@angular/core";

export interface ISdCoreConfiguration {
  // License Key được cấp theo domain/sub domain, ví dụ: domain.com, sub.domain.com
  // Domain localhost, 127.0.0.1 không cần key
  // Các domain DEV/QC/UAT/PROD ... cần key tương ứng cho từng domain
  licenseKey?: string | string[]; 
  format?: {
    number?: '1,234,567.89' | '1.234.567,89'; // Default: '1,234,567.89'
  };
}

export const SD_CORE_CONFIGURATION = new InjectionToken<ISdCoreConfiguration>('sd-core.configuration');
