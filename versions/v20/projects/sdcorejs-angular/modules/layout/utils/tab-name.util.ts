import { I18N_MESSAGES, I18N_STORAGE_KEY } from '@sdcorejs/angular/i18n';
import { Language } from '@sdcorejs/angular/models';

/**
 * Resolve a translated tab name for `@SdTabComponent`.
 *
 * WHY not I18nService: the decorator runs at module-evaluation time, before
 * Angular's DI exists, so the service cannot be injected. We read the language
 * the app persisted and look the key up in the static catalog instead.
 */
export function resolveTabName(key: string): string {
  const lang = ((): Language => {
    try {
      const stored = localStorage.getItem(I18N_STORAGE_KEY) as Language | null;
      if (stored) return stored;
    } catch {
      // localStorage can throw (private mode, SSR shim) — fall back below.
    }
    return 'vi';
  })();

  return I18N_MESSAGES[lang]?.[key] ?? I18N_MESSAGES.vi[key] ?? key;
}
