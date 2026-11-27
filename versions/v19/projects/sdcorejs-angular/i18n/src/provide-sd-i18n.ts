import { EnvironmentProviders, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { I18nService } from './i18n.service';
import { SD_I18N_OPTIONS, SdI18nOptions } from './i18n.options';

export function provideSdI18n(options: SdI18nOptions): EnvironmentProviders {
  for (const lang of [options.defaultLanguage, options.fallbackLanguage ?? options.defaultLanguage]) {
    if (typeof options.loaders[lang] !== 'function') {
      throw new Error(`Missing Core i18n loader for "${lang}".`);
    }
  }
  return makeEnvironmentProviders([
    { provide: SD_I18N_OPTIONS, useValue: options },
    provideAppInitializer(() => inject(I18nService).initialize()),
  ]);
}
