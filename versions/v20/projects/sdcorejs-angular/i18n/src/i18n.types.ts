import type { EN_MESSAGES } from './en';

export type I18nKey = keyof typeof EN_MESSAGES;
export type I18nParams = Record<string, string | number>;

/**
 * I18nCatalog — full catalog of messages keyed by I18nKey.
 *
 * Tip: hover over EN_MESSAGES['key'] to see the EN reference value when typing a custom catalog.
 *
 * Example:
 *   import type { I18nCatalog } from '@sdcorejs/angular/i18n';
 *   const myCustom: I18nCatalog = {
 *     'core.common.cancel': 'Annuler',
 *     // ... must provide all keys
 *   };
 */
export type I18nCatalog = Record<I18nKey, string>;

/**
 * Custom language provider. Returns a complete I18nCatalog synchronously.
 *
 * The legacy configuration factory supplies its own messages immediately. Use
 * provideSdI18n for asynchronous custom loaders and provideSdCore to await startup.
 *
 * Example:
 *   const config: ISdCoreConfiguration = { language: () => ({ ...myCatalog }) };
 */
export type CustomLanguageProvider = () => I18nCatalog;
