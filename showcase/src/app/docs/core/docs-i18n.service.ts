import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { hasVietnameseText, LocalizedDocsContent, localizeDocsContent } from '../i18n/docs-content';
import { DocsLanguage, DocsUiStrings, DocsUiTextKey, formatUiString } from '../i18n/docs-ui-strings';
import { EN_UI_STRINGS } from '../i18n/en';
import { VI_UI_STRINGS } from '../i18n/vi';
import { DOCS_STORAGE } from './docs.tokens';
import { DocNavigationGroup, DocPageDefinition } from './documentation.models';
import { DOC_NAV_GROUPS, DOC_PAGES } from './documentation.registry';

export const DOCS_LANGUAGE_STORAGE_KEY = 'sdcorejs.docs.lang';

const CATALOGS: Readonly<Record<DocsLanguage, DocsUiStrings>> = { en: EN_UI_STRINGS, vi: VI_UI_STRINGS };

let englishContent: LocalizedDocsContent | null = null;

/** VI mode shows the registry as written; EN mode swaps in content.en.ts. */
function docsContent(language: DocsLanguage): LocalizedDocsContent | null {
  if (language === 'vi') return null;
  englishContent ??= localizeDocsContent(DOC_PAGES, DOC_NAV_GROUPS);
  return englishContent;
}

export function isDocsLanguage(value: string | null | undefined): value is DocsLanguage {
  return value === 'en' || value === 'vi';
}

/** EN/VI switch of the docs chrome and registry text. The choice is stored per browser and mirrored on <html lang>. */
@Injectable({ providedIn: 'root' })
export class DocsI18nService {
  readonly #document = inject(DOCUMENT);
  readonly #storage = inject(DOCS_STORAGE);
  readonly #language = signal<DocsLanguage>('en');

  readonly language = this.#language.asReadonly();
  readonly t = computed(() => CATALOGS[this.#language()]);
  /** Registry pages with titles, descriptions and examples in the current language. */
  readonly pages = computed<readonly DocPageDefinition[]>(() => docsContent(this.#language())?.pages ?? DOC_PAGES);
  /** Navigation groups whose pages carry the current language. */
  readonly navGroups = computed<readonly DocNavigationGroup[]>(() => docsContent(this.#language())?.groups ?? DOC_NAV_GROUPS);

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

  /** A registry page in the current language. Reads the language signal, so callers in templates and computeds update. */
  page(page: DocPageDefinition): DocPageDefinition {
    return docsContent(this.#language())?.pagesById.get(page.id) ?? page;
  }

  /** `lang` of registry text: VI mode keeps "vi"; EN mode marks only text that is still Vietnamese. */
  contentLang(text: string): DocsLanguage {
    return this.#language() === 'vi' || hasVietnameseText(text) ? 'vi' : 'en';
  }

  #apply(language: DocsLanguage): void {
    this.#language.set(language);
    this.#document.documentElement.setAttribute('lang', language);
  }
}
