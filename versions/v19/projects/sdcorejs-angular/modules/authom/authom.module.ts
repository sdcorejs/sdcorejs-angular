import {
  ModuleWithProviders,
  NgModule,
  Provider,
  Type,
  EnvironmentProviders,
  makeEnvironmentProviders,
  provideAppInitializer,
  inject,
  APP_INITIALIZER,
} from '@angular/core';
import { ISdAuthOmConfiguration, SD_AUTHOM_CONFIGURATION } from './authom.configuration';
import { SdAuthOmService } from './authom.service';

interface ProvideOptions {
  useClass?: Type<ISdAuthOmConfiguration>;

  useFactory?: (...args: any[]) => ISdAuthOmConfiguration;

  deps?: any[];
}

export function provideSdAuthOm(options: ProvideOptions): EnvironmentProviders {
  const providers: (Provider | EnvironmentProviders)[] = [SdAuthOmService];

  if (options.useFactory) {
    providers.push({ provide: SD_AUTHOM_CONFIGURATION, useFactory: options.useFactory, deps: options.deps || [] });
  } else if (options.useClass) {
    providers.push({ provide: SD_AUTHOM_CONFIGURATION, useClass: options.useClass });
  }

  providers.push(
    provideAppInitializer(() => {
      const configLoader = inject(SD_AUTHOM_CONFIGURATION);
      const authom = inject(SdAuthOmService);
      return configLoader.loadTenantConfig().then(config => authom.init(config));
    })
  );

  return makeEnvironmentProviders(providers);
}

@NgModule({})
export class SdAuthOmModule {
  static forRoot(options: ProvideOptions): ModuleWithProviders<SdAuthOmModule> {
    return {
      ngModule: SdAuthOmModule,
      providers: [
        SdAuthOmService,
        ...(options.useFactory
          ? [{ provide: SD_AUTHOM_CONFIGURATION, useFactory: options.useFactory, deps: options.deps || [] }]
          : [{ provide: SD_AUTHOM_CONFIGURATION, useClass: options.useClass! }]),
        {
          provide: APP_INITIALIZER,
          multi: true,
          useFactory: () => {
            const configLoader = inject(SD_AUTHOM_CONFIGURATION);
            const authom = inject(SdAuthOmService);
            return () => configLoader.loadTenantConfig().then(config => authom.init(config));
          },
        },
      ],
    };
  }
}
