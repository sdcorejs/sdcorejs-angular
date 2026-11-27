import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { computed, inject, Injectable, makeStateKey, PendingTasks, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SUPPORTED_LANGUAGES } from '@sdcorejs/utils/constants';
import type { Language } from '@sdcorejs/utils/models';
import { SD_I18N_OPTIONS, SD_I18N_PRELOADED } from './i18n.options';
import { I18N_STORAGE_KEY } from './i18n.token';
import type { I18nCatalog, I18nParams } from './i18n.types';

declare const SD_I18N_LAZY_ONLY: boolean;
type Messages = Readonly<Record<string, string>>;
const TRANSFER_LANGUAGE = makeStateKey<Language>('sd-core.i18n.language');
const TRANSFER_CUSTOM = makeStateKey<boolean>('sd-core.i18n.custom');
const LOCALES: Readonly<Record<Language, string>> = { vi: 'vi-VN', en: 'en-US', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN' };
// Literal public entry points let application builders emit one independently cacheable file per locale.
const BUILTIN_LOADERS =
  typeof SD_I18N_LAZY_ONLY !== 'undefined' && SD_I18N_LAZY_ONLY
    ? {}
    : {
        vi: () => import('@sdcorejs/angular/i18n/locales/vi').then(m => m.VI_MESSAGES),
        en: () => import('@sdcorejs/angular/i18n/locales/en').then(m => m.EN_MESSAGES),
        ja: () => import('@sdcorejs/angular/i18n/locales/ja').then(m => m.JA_MESSAGES),
        ko: () => import('@sdcorejs/angular/i18n/locales/ko').then(m => m.KO_MESSAGES),
        zh: () => import('@sdcorejs/angular/i18n/locales/zh').then(m => m.ZH_MESSAGES),
      };

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly #options = inject(SD_I18N_OPTIONS, { optional: true });
  readonly #eager = this.#options ? null : inject(SD_I18N_PRELOADED, { optional: true });
  readonly #config = inject(SD_CORE_CONFIGURATION, { optional: true });
  readonly #platform = inject(PLATFORM_ID);
  readonly #transfer = inject(TransferState);
  readonly #loaders: Partial<Record<Language, () => Promise<I18nCatalog>>> = this.#options?.loaders ?? BUILTIN_LOADERS;
  readonly #cache = new Map<Language, Promise<Messages>>();
  readonly #warned = new Set<string>();
  readonly #language = signal<Language>('vi');
  readonly #messages = signal<Messages>({});
  readonly #error = signal<unknown>(null);
  #custom?: Messages;
  #active = false;
  #selection = 0;
  #initializing?: Promise<void>;

  readonly language = this.#language.asReadonly();
  readonly messages = this.#messages.asReadonly();
  readonly loadError = this.#error.asReadonly();
  readonly locale = computed(() => LOCALES[this.language()]);
  readonly availableLanguages: readonly Language[] = SUPPORTED_LANGUAGES.filter(lang => !!this.#eager || !!this.#loaders[lang]);

  constructor() {
    if (!this.availableLanguages.length) throw new Error('SD_I18N_LAZY_ONLY requires provideSdI18n() with registered loaders.');
    const stored = this.#readStored();
    const configured = this.#config?.language;
    const fallback =
      this.#options?.defaultLanguage ??
      (typeof configured === 'string' && this.availableLanguages.includes(configured) ? configured : 'vi');
    const transferred = this.#transfer.hasKey(TRANSFER_LANGUAGE) ? this.#transfer.get(TRANSFER_LANGUAGE, fallback) : undefined;
    const language = transferred && this.availableLanguages.includes(transferred) ? transferred : (stored ?? fallback);
    this.#language.set(language);
    if (!this.#options && typeof configured === 'function' && (transferred ? this.#transfer.get(TRANSFER_CUSTOM, false) : !stored)) {
      try {
        const custom = configured();
        this.#custom = custom;
        this.#messages.set(custom);
      } catch (error) {
        console.warn('[I18n] Custom language fn threw:', error);
      }
    }
    if (this.#eager) {
      this.#messages.set(this.#custom ? { ...this.#eager.vi, ...this.#custom } : this.#eager[language]);
      this.#active = true;
    } else {
      // Bare consumers also load on injection. Track it so SSR and application stability include the catalog.
      const done = inject(PendingTasks).add();
      void this.initialize().then(done, done);
    }
  }

  /** A bootstrap initializer can await the same in-flight load. A failed initialization is retryable. */
  initialize(): Promise<void> {
    if (this.#active) return Promise.resolve();
    if (!this.#initializing) {
      const selection = ++this.#selection;
      this.#error.set(null);
      this.#initializing = this.#initialize(selection)
        .catch(error => {
          if (selection === this.#selection) this.#error.set(error);
          throw error;
        })
        .finally(() => {
          this.#initializing = undefined;
        });
    }
    return this.#initializing;
  }

  async #initialize(selection: number): Promise<void> {
    const language = this.language();
    const fallback = this.#options?.fallbackLanguage ?? this.#options?.defaultLanguage ?? 'vi';
    try {
      await this.#activate(language, selection, this.#custom);
    } catch (error) {
      if (selection !== this.#selection) return;
      if (language === fallback) throw error;
      await this.#activate(fallback, selection);
    }
    if (selection === this.#selection && isPlatformServer(this.#platform)) {
      this.#transfer.set(TRANSFER_LANGUAGE, this.language());
      if (this.#custom) this.#transfer.set(TRANSFER_CUSTOM, true);
    }
  }

  setLanguage(lang: Language, opts: { reload?: boolean } = { reload: true }): void | Promise<void> {
    if (!this.availableLanguages.includes(lang)) return;
    if (!this.#active && this.#initializing) {
      // Preserve the order of selections made before the first catalog is ready.
      const select = () => this.setLanguage(lang, opts);
      return this.#initializing.then(select, select);
    }
    if (lang === this.language() && !this.#custom) {
      if (!this.#active) return this.initialize();
      ++this.#selection;
      return;
    }
    const selection = ++this.#selection;
    if (this.#eager) {
      this.#custom = undefined;
      this.#messages.set(this.#eager[lang]);
      this.#language.set(lang);
      this.#persist(lang);
      if (opts.reload && isPlatformBrowser(this.#platform)) window.location.reload();
      return;
    }
    if (opts.reload && this.#persist(lang)) {
      window.location.reload();
      return;
    }
    return this.#activate(lang, selection).then(() => {
      if (selection === this.#selection) this.#persist(lang);
    });
  }

  async #activate(language: Language, selection: number, custom?: Messages): Promise<void> {
    let pending = this.#cache.get(language);
    if (!pending) {
      const load = this.#loaders[language]!;
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
    this.#custom = custom;
    this.#messages.set(custom ? { ...catalog, ...custom } : catalog);
    this.#language.set(language);
    this.#error.set(null);
    this.#active = true;
  }

  t(key: string, params?: I18nParams): string {
    let raw = this.messages()[key];
    if (raw === undefined) {
      if (!this.#active && this.loadError() === null) return '';
      const vi = this.#eager?.vi[key];
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
