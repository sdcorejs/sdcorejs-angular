import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { I18nService } from '@sdcorejs/angular/i18n';

/** Register once at bootstrap to make the first render wait for the selected Core catalog. */
export function provideSdCore(configuration?: ISdCoreConfiguration): EnvironmentProviders {
  return makeEnvironmentProviders([
    ...(configuration ? [{ provide: SD_CORE_CONFIGURATION, useValue: configuration }] : []),
    provideAppInitializer(() => inject(I18nService).initialize()),
  ]);
}
