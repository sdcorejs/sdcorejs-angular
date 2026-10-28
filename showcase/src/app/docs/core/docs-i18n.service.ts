import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { DocsLanguage, DocsUiStrings, DocsUiTextKey, formatUiString } from '../i18n/docs-ui-strings';
import { EN_UI_STRINGS } from '../i18n/en';
import { VI_UI_STRINGS } from '../i18n/vi';
import { DOCS_STORAGE } from './docs.tokens';

export const DOCS_LANGUAGE_STORAGE_KEY = 'sdcorejs.docs.lang';

const CATALOGS: Readonly<Record<DocsLanguage, DocsUiStrings>> = { en: EN_UI_STRINGS, vi: VI_UI_STRINGS };

export function isDocsLanguage(value: string | null | undefined): value is DocsLanguage {
  return value === 'en' || value === 'vi';
}

/** EN/VI switch of the docs chrome. The choice is stored per browser and mirrored on <html lang>. */
@Injectable({ providedIn: 'root' })
export class DocsI18nService {
  readonly #document = inject(DOCUMENT);
  readonly #storage = inject(DOCS_STORAGE);
  readonly #language = signal<DocsLanguage>('en');

  readonly language = this.#language.asReadonly();
  readonly t = computed(() => CATALOGS[this.#language()]);

  constructor() {
    let stored: string | null = null;
    try {
      stored = this.#storage?.getItem(DOCS_LANGUAGE_STORAGE_KEY) ?? null;
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
    this.#apply(isDocsLanguage(stored) ? stored : 'en');
  }

  set(language: DocsLanguage): void {
    this.#apply(language);
    try {
      this.#storage?.setItem(DOCS_LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The choice still applies for this visit when storage is blocked.
    }
  }

  toggle(): void {
    this.set(this.#language() === 'en' ? 'vi' : 'en');
  }

  /** Formats a catalog string with {name} holes, e.g. format('goLatest', { v: '3.2' }). */
  format(key: DocsUiTextKey, values: Readonly<Record<string, string | number>>): string {
    return formatUiString(this.t()[key], values);
  }

  #apply(language: DocsLanguage): void {
    this.#language.set(language);
    this.#document.documentElement.setAttribute('lang', language);
  }
}
