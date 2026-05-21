import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { I18N_MESSAGES } from './i18n.messages';
import { I18N_STORAGE_KEY } from './i18n.token';
import { SUPPORTED_LANGUAGES, I18nParams, Language } from './i18n.types';

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly #config = inject<ISdCoreConfiguration | null>(SD_CORE_CONFIGURATION, { optional: true });
  // Custom catalog (signal) â€” non-null khi user cáº¥u hÃ¬nh `language: () => I18nCatalog`.
  // Khi non-null, `messages` computed sáº½ Æ°u tiÃªn tráº£ vá» catalog nÃ y thay vÃ¬ I18N_MESSAGES[lang].
  // PHáº¢I khai bÃ¡o TRÆ¯á»šC `#language` vÃ¬ `#resolveInitial()` cháº¡y trong initializer cá»§a `#language`
  // vÃ  cÃ³ thá»ƒ gá»i `this.#customMessages.set(...)` (sync custom catalog path).
  readonly #customMessages: WritableSignal<Readonly<Record<string, string>> | null> = signal(null);
  readonly #language: WritableSignal<Language> = signal(this.#resolveInitial());
  readonly #warned = new Set<string>();

  readonly language: Signal<Language> = this.#language.asReadonly();
  readonly messages: Signal<Readonly<Record<string, string>>> = computed(() => {
    const custom = this.#customMessages();
    if (custom) return custom;
    return I18N_MESSAGES[this.#language()];
  });

  // Äá»•i ngÃ´n ngá»¯ require reload trang (model "reload trÃªn Ä‘á»•i"). Pipe `translate` lÃ  pure
  // nÃªn khÃ´ng tá»± cáº­p nháº­t runtime â€” pháº£i reload Ä‘á»ƒ cache pipe Ä‘Æ°á»£c rebuild vá»›i messages má»›i.
  // Test cÃ³ thá»ƒ pass `{ reload: false }` Ä‘á»ƒ trÃ¡nh reload page trong Karma.
  setLanguage(lang: Language, opts: { reload?: boolean } = { reload: true }): void {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    if (this.#language() === lang && !this.#customMessages()) return;  // no-op if same and not in custom mode
    // User chá»n 'vi'/'en' rÃµ rÃ ng -> clear custom mode (override custom provider)
    this.#customMessages.set(null);
    try { localStorage.setItem(I18N_STORAGE_KEY, lang); } catch { /* ignore */ }
    this.#language.set(lang);
    if (opts.reload && typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  t(key: string, params?: I18nParams): string {
    // Äá»c tá»« computed `messages()` Ä‘á»ƒ há»— trá»£ cáº£ custom catalog láº«n built-in lang.
    const raw = this.messages()[key] ?? this.#fallback(key);
    return this.#interpolate(raw, params);
  }

  #fallback(key: string): string {
    const vi = I18N_MESSAGES.vi[key];
    if (vi !== undefined) {
      this.#warnOnce(`[I18n] Missing key in ${this.#language()}: ${key} (fallback to vi)`);
      return vi;
    }
    this.#warnOnce(`[I18n] Missing key: ${key}`);
    return key;
  }

  #interpolate(raw: string, params?: I18nParams): string {
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
  }

  #warnOnce(msg: string): void {
    if (this.#warned.has(msg)) return;
    this.#warned.add(msg);
    console.warn(msg);
  }

  #resolveInitial(): Language {
    // 1) localStorage (only 'vi'/'en' supported there) â€” luÃ´n Æ°u tiÃªn cao nháº¥t
    try {
      const stored = localStorage.getItem(I18N_STORAGE_KEY) as Language | null;
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
    } catch { /* ignore */ }

    const configured = this.#config?.language;

    // 2) function â€” custom language provider (sync only)
    if (typeof configured === 'function') {
      this.#loadCustom(configured);
      return 'vi'; // language() váº«n bÃ¡o 'vi' trong custom mode; messages() Æ°u tiÃªn #customMessages
    }

    // 3) string â€” built-in lang
    if (configured && SUPPORTED_LANGUAGES.includes(configured as Language)) return configured as Language;

    // 4) default
    return 'vi';
  }

  #loadCustom(fn: () => Record<string, string>): void {
    try {
      const catalog = fn();
      this.#customMessages.set(catalog);
    } catch (err) {
      console.warn('[I18n] Custom language fn threw:', err);
    }
  }
}

