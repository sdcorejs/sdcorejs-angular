import { InjectionToken } from '@angular/core';

export interface SdAuthOmTenantConfig {
  domain: string;
  clientId: string;

  redirectUri?: string;
  audience?: string;
  organization?: string;
  scope?: string;

  secureRoutes?: string[];

  silentRefreshRedirectUri?: string;
  refreshThresholdSeconds?: number;
  authorizeTimeoutInSeconds?: number;
}

export interface ISdAuthOmConfiguration {
  loadTenantConfig: () => Promise<SdAuthOmTenantConfig>;
}

export const SD_AUTHOM_CONFIGURATION = new InjectionToken<ISdAuthOmConfiguration>('sd-authom.configuration');
