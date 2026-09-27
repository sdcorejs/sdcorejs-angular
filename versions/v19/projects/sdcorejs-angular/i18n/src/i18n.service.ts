import { computed, inject, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { I18N_MESSAGES } from './i18n.messages';
import { I18N_STORAGE_KEY } from './i18n.token';
import { I18nParams } from './i18n.types';
import { SUPPORTED_LANGUAGES } from '@sdcorejs/utils/constants';
import { Language } from '@sdcorejs/utils/models';

/**
 * Thẻ BCP-47 dùng cho `Intl` / `toLocale*` theo từng ngôn ngữ — bảng map DUY NHẤT của thư viện.
 *
 * why: trước đây 11 chỗ hardcode `'vi-VN'` (ngày trong message min/max, trang lỗi, chip số...) và hai
 * bảng map trùng nhau (home page, file-explorer), nên app chạy tiếng Anh vẫn thấy ngày dạng 15/1/2026.
 */
const SD_LANGUAGE_LOCALES: Readonly<Record<Language, string>> = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly #config = inject<ISdCoreConfiguration | null>(SD_CORE_CONFIGURATION, { optional: true });
  // Custom catalog (signal) — non-null khi user cấu hình `language: () => I18nCatalog`.
  // Khi non-null, `messages` computed sẽ ưu tiên trả về catalog này thay vì I18N_MESSAGES[lang].
  // PHẢI khai báo TRƯỚC `#language` vì `#resolveInitial()` chạy trong initializer của `#language`
  // và có thể gọi `this.#customMessages.set(...)` (sync custom catalog path).
  readonly #customMessages: WritableSignal<Readonly<Record<string, string>> | null> = signal(null);
  readonly #language: WritableSignal<Language> = signal(this.#resolveInitial());
  readonly #warned = new Set<string>();

  readonly language: Signal<Language> = this.#language.asReadonly();
  /**
   * Thẻ BCP-47 của ngôn ngữ hiện tại (vd `'vi-VN'`, `'en-US'`) — truyền thẳng cho `Intl` / `toLocale*`.
   * Ở chế độ custom catalog `language()` vẫn là `'vi'`, nên `locale()` là `'vi-VN'`.
   */
  readonly locale: Signal<string> = computed(() => SD_LANGUAGE_LOCALES[this.#language()] ?? SD_LANGUAGE_LOCALES.vi);
  readonly messages: Signal<Readonly<Record<string, string>>> = computed(() => {
    const custom = this.#customMessages();
    if (custom) return custom;
    return I18N_MESSAGES[this.#language()];
  });

  // Đổi ngôn ngữ require reload trang (model "reload trên đổi"). Pipe `translate` là pure
  // nên không tự cập nhật runtime — phải reload để cache pipe được rebuild với messages mới.
  // Test có thể pass `{ reload: false }` để tránh reload page trong Karma.
  setLanguage(lang: Language, opts: { reload?: boolean } = { reload: true }): void {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    if (this.#language() === lang && !this.#customMessages()) return; // no-op if same and not in custom mode
    // User chọn 'vi'/'en' rõ ràng -> clear custom mode (override custom provider)
    this.#customMessages.set(null);
    try {
      localStorage.setItem(I18N_STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    this.#language.set(lang);
    if (opts.reload && typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  t(key: string, params?: I18nParams): string {
    // Đọc từ computed `messages()` để hỗ trợ cả custom catalog lẫn built-in lang.
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
    // 1) localStorage (only 'vi'/'en' supported there) — luôn ưu tiên cao nhất
    try {
      const stored = localStorage.getItem(I18N_STORAGE_KEY) as Language | null;
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
    } catch {
      /* ignore */
    }

    const configured = this.#config?.language;

    // 2) function — custom language provider (sync only)
    if (typeof configured === 'function') {
      this.#loadCustom(configured);
      return 'vi'; // language() vẫn báo 'vi' trong custom mode; messages() ưu tiên #customMessages
    }

    // 3) string — built-in lang
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
