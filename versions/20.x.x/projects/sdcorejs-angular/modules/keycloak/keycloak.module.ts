import { 
  ModuleWithProviders, 
  NgModule, 
  Provider, 
  Type, 
  EnvironmentProviders, 
  makeEnvironmentProviders, 
  provideAppInitializer, 
  inject,
  APP_INITIALIZER
} from '@angular/core';
import { ISdKeycloakConfiguration, SD_KEYCLOAK_CONFIGURATION } from './keycloak.configuration';
import { SdKeycloakService } from './keycloak.service';

// =======================================================================
// CÁCH 1: Dùng cho Angular 19 Standalone (Gọi trong app.config.ts)
// =======================================================================
export function provideSdKeycloak(options: {
  useClass?: Type<ISdKeycloakConfiguration>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFactory?: (...args: any[]) => ISdKeycloakConfiguration;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps?: any[];
}): EnvironmentProviders {
  
  // FIX 1: Khai báo mảng nhận cả Provider (cho Service/Token) lẫn EnvironmentProviders (cho AppInitializer)
  const providers: Array<Provider | EnvironmentProviders> = [SdKeycloakService];

  if (options.useFactory) {
    providers.push({ provide: SD_KEYCLOAK_CONFIGURATION, useFactory: options.useFactory, deps: options.deps || [] });
  } else if (options.useClass) {
    providers.push({ provide: SD_KEYCLOAK_CONFIGURATION, useClass: options.useClass });
  }

  // Standalone dùng được provideAppInitializer ngon lành
  providers.push(
    provideAppInitializer(() => {
      const configLoader = inject(SD_KEYCLOAK_CONFIGURATION);
      const keycloakService = inject(SdKeycloakService);
      return configLoader.loadTenantConfig().then((config) => keycloakService.init(config));
    })
  );

  return makeEnvironmentProviders(providers);
}

// =======================================================================
// CÁCH 2: Dùng cho kiến trúc NgModule cũ (Backward Compatibility)
// =======================================================================
@NgModule({})
export class SdKeycloakModule {
  static forRoot(options: {
    useClass?: Type<ISdKeycloakConfiguration>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useFactory?: (...args: any[]) => ISdKeycloakConfiguration;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deps?: any[];
  }): ModuleWithProviders<SdKeycloakModule> {
    
    return {
      ngModule: SdKeycloakModule,
      providers: [
        SdKeycloakService,
        ...(options.useFactory 
          ? [{ provide: SD_KEYCLOAK_CONFIGURATION, useFactory: options.useFactory, deps: options.deps || [] }]
          : [{ provide: SD_KEYCLOAK_CONFIGURATION, useClass: options.useClass! }]
        ),
        
        // FIX 2: NgModule bắt buộc phải dùng APP_INITIALIZER (nhưng viết kiểu xịn của Angular 14+, dùng inject)
        {
          provide: APP_INITIALIZER,
          multi: true,
          useFactory: () => {
            const configLoader = inject(SD_KEYCLOAK_CONFIGURATION);
            const keycloakService = inject(SdKeycloakService);
            return () => configLoader.loadTenantConfig().then((config) => keycloakService.init(config));
          }
        }
      ]
    };
  }
}