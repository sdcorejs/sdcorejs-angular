import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { DOCS_STORAGE } from './docs.tokens';

export type DocsTheme = 'light' | 'dark';

/** Same key as the pre-paint script in index.html, which applies the theme before Angular boots. */
export const DOCS_THEME_STORAGE_KEY = 'sdcorejs.docs.theme';

const THEME_ATTRIBUTE = 'data-sd-theme';

export function resolveInitialTheme(stored: string | null, prefersDark: boolean): DocsTheme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

/**
 * Light/dark theme of the docs site. The theme is written to data-sd-theme on <html>, which switches both the
 * --docs-* tokens and the library tokens (sd-core.scss), so live examples follow the page.
 */
@Injectable({ providedIn: 'root' })
export class DocsThemeService {
  readonly #document = inject(DOCUMENT);
  readonly #storage = inject(DOCS_STORAGE);
  readonly #theme = signal<DocsTheme>('light');

  readonly theme = this.#theme.asReadonly();

  constructor() {
    const root = this.#document.documentElement;
    this.#theme.set(resolveInitialTheme(this.#readStored(), this.#prefersDark()));
    root.setAttribute(THEME_ATTRIBUTE, this.#theme());

    // why: the Theme & tokens guide flips data-sd-theme for its own preview; the toggle keeps showing the real state.
    const MutationObserverType =
      this.#document.defaultView?.MutationObserver ?? (typeof MutationObserver === 'undefined' ? undefined : MutationObserver);
    if (MutationObserverType) {
      const observer = new MutationObserverType(() => {
        const value = root.getAttribute(THEME_ATTRIBUTE);
        if (value === 'light' || value === 'dark') this.#theme.set(value);
      });
      observer.observe(root, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
      inject(DestroyRef).onDestroy(() => observer.disconnect());
    }
  }

  toggle(): void {
    this.set(this.#theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: DocsTheme): void {
    this.#theme.set(theme);
    this.#document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
    try {
      this.#storage?.setItem(DOCS_THEME_STORAGE_KEY, theme);
    } catch {
      // The choice still applies for this visit when storage is blocked.
    }
  }

  #readStored(): string | null {
    try {
      return this.#storage?.getItem(DOCS_THEME_STORAGE_KEY) ?? null;
    } catch {
      return null;
    }
  }

  #prefersDark(): boolean {
    return this.#document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
