import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { computed, inject, Injectable, makeStateKey, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SUPPORTED_LANGUAGES } from '@sdcorejs/utils/constants';
import type { Language } from '@sdcorejs/utils/models';
import { I18N_MESSAGES } from './i18n.messages';
import { SD_I18N_OPTIONS } from './i18n.options';
import { I18N_STORAGE_KEY } from './i18n.token';
import type { I18nParams } from './i18n.types';

declare const SD_I18N_LAZY_ONLY: boolean;
type Messages = Readonly<Record<string, string>>;
const TRANSFER_LANGUAGE = makeStateKey<Language>('sd-core.i18n.language');
const LOCALES: Readonly<Record<Language, string>> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly #config = inject(SD_CORE_CONFIGURATION, { optional: true });
  readonly #options = inject(SD_I18N_OPTIONS, { optional: true });
  readonly #platform = inject(PLATFORM_ID);
  readonly #transfer = inject(TransferState);
  // A build-time constant lets production bundlers remove the legacy catalog imports entirely.
  readonly #legacy = typeof SD_I18N_LAZY_ONLY !== 'undefined' && SD_I18N_LAZY_ONLY ? undefined : I18N_MESSAGES;
  readonly #cache = new Map<Language, Promise<Messages>>();
  readonly #warned = new Set<string>();
  readonly #language = signal<Language>('vi');
  readonly #messages = signal<Messages>({});
  #custom = false;
  #hasActiveCatalog = false;
  #selection = 0;

  readonly language = this.#language.asReadonly();
  readonly messages = this.#messages.asReadonly();
  readonly locale = computed(() => LOCALES[this.language()]);
  readonly availableLanguages: readonly Language[] = SUPPORTED_LANGUAGES.filter(lang => !this.#options || !!this.#options.loaders[lang]);

  constructor() {
    const stored = this.#readStored();
    if (this.#options) {
      const transferred = this.#transfer.get(TRANSFER_LANGUAGE, this.#options.defaultLanguage);
      this.#language.set(
        this.#transfer.hasKey(TRANSFER_LANGUAGE) && this.availableLanguages.includes(transferred)
          ? transferred
          : (stored ?? this.#options.defaultLanguage)
      );
      return;
    }
    if (!this.#legacy) throw new Error('SD_I18N_LAZY_ONLY requires provideSdI18n() at application bootstrap.');
    const configured = this.#config?.language;
    const language = stored ?? (typeof configured === 'string' && SUPPORTED_LANGUAGES.includes(configured) ? configured : 'vi');
    this.#language.set(language);
    this.#messages.set(this.#legacy[language]);
    if (!stored && typeof configured === 'function') {
      try {
        this.#messages.set(configured());
        this.#custom = true;
      } catch (error) {
        console.warn('[I18n] Custom language fn threw:', error);
      }
    }
  }

  /** Called by the application initializer. A failed load can be retried. */
  async initialize(): Promise<void> {
    const options = this.#options;
    if (!options) return;
    const language = this.language();
    const selection = ++this.#selection;
    try {
      await this.#activate(language, selection);
    } catch (error) {
      const fallback = options.fallbackLanguage ?? options.defaultLanguage;
      if (selection !== this.#selection) return;
      if (fallback === language) throw error;
      await this.#activate(fallback, selection);
    }
    if (isPlatformServer(this.#platform)) this.#transfer.set(TRANSFER_LANGUAGE, this.language());
  }

  setLanguage(lang: Language, opts: { reload?: boolean } = { reload: true }): void | Promise<void> {
    if (!this.availableLanguages.includes(lang)) return;
    // A selection of the active language also cancels an in-flight switch to another language.
    if (lang === this.language() && !this.#custom) {
      if (!this.#options || this.#hasActiveCatalog) ++this.#selection;
      return;
    }
    const selection = ++this.#selection;
    if (this.#options) {
      if (opts.reload && isPlatformBrowser(this.#platform) && this.#persist(lang)) {
        window.location.reload();
        return;
      }
      return this.#activate(lang, selection).then(() => {
        if (selection === this.#selection) this.#persist(lang);
      });
    }
    this.#custom = false;
    this.#messages.set(this.#legacy![lang]);
    this.#language.set(lang);
    this.#persist(lang);
    if (opts.reload && isPlatformBrowser(this.#platform)) window.location.reload();
  }

  async #activate(language: Language, selection: number): Promise<void> {
    let pending = this.#cache.get(language);
    if (!pending) {
      const load = this.#options!.loaders[language]!;
      pending = Promise.resolve()
        .then(load)
        .catch(error => {
          this.#cache.delete(language);
          throw error;
        });
      this.#cache.set(language, pending);
    }
    const catalog = await pending;
    if (selection !== this.#selection) return;
    this.#messages.set(catalog);
    this.#language.set(language);
    this.#hasActiveCatalog = true;
  }

  t(key: string, params?: I18nParams): string {
    let raw = this.messages()[key];
    if (raw === undefined) {
      const vi = !this.#options ? this.#legacy?.vi[key] : undefined;
      const warning = vi === undefined ? `[I18n] Missing key: ${key}` : `[I18n] Missing key in ${this.language()}: ${key} (fallback to vi)`;
      if (!this.#warned.has(warning)) {
        this.#warned.add(warning);
        console.warn(warning);
      }
      raw = vi ?? key;
    }
    return params ? raw.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match)) : raw;
  }

  #readStored(): Language | undefined {
    if (!isPlatformBrowser(this.#platform)) return;
    try {
      const stored = localStorage.getItem(I18N_STORAGE_KEY) as Language;
      if (this.availableLanguages.includes(stored)) return stored;
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    return undefined;
  }

  #persist(language: Language): boolean {
    try {
      if (!isPlatformBrowser(this.#platform)) return false;
      localStorage.setItem(I18N_STORAGE_KEY, language);
      return true;
    } catch {
      return false;
    }
  }
}
