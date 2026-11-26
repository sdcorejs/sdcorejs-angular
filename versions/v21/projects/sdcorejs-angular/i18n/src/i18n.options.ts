import { InjectionToken } from '@angular/core';
import type { Language } from '@sdcorejs/utils/models';
import type { I18nCatalog } from './i18n.types';

export interface SdI18nOptions {
  defaultLanguage: Language;
  fallbackLanguage?: Language;
  loaders: Partial<Record<Language, () => Promise<I18nCatalog>>>;
}

export const SD_I18N_OPTIONS = new InjectionToken<SdI18nOptions>('sd.i18n.options');
