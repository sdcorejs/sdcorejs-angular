import { InjectionToken } from '@angular/core';

export interface SdKeycloakTenantConfig {
  url: string;
  realm: string;
  clientId: string;
  secureRoutes?: string[]; // Các API cần đính token (vd: ['/api/v1'])
}

export interface ISdKeycloakConfiguration {
  loadTenantConfig: () => Promise<SdKeycloakTenantConfig>;
}

export const SD_KEYCLOAK_CONFIGURATION = new InjectionToken<ISdKeycloakConfiguration>('sd-keycloak.configuration');