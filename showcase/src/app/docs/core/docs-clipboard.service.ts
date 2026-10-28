import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { DocsI18nService } from './docs-i18n.service';

/** How long a copy button shows its check icon and "Copied" label. */
export const COPY_FEEDBACK_MS = 1400;

/**
 * Copies text for every copy button of the docs chrome. One key is "copied" at a time (the button shows a check and
 * "Copied"), and the result is announced through the shell's polite live region.
 */
@Injectable({ providedIn: 'root' })
export class DocsClipboardService {
  readonly #document = inject(DOCUMENT);
  readonly #i18n = inject(DocsI18nService);
  readonly #copiedKey = signal<string | null>(null);
  readonly #announcement = signal('');
  #resetTimeout: number | undefined;

  readonly copiedKey = this.#copiedKey.asReadonly();
  readonly announcement = this.#announcement.asReadonly();

  isCopied(key: string): boolean {
    return this.#copiedKey() === key;
  }

  async copy(text: string, key: string): Promise<boolean> {
    const view = this.#document.defaultView;
    const clipboard = view?.navigator.clipboard;
    this.#reset();
    let copied = false;
    if (clipboard) {
      try {
        await clipboard.writeText(text);
        copied = true;
      } catch {
        copied = false;
      }
    }
    const t = this.#i18n.t();
    // why: a second copy that started before this one finished must not leave its timer running.
    this.#reset();
    this.#copiedKey.set(copied ? key : null);
    this.#announcement.set(copied ? t.copiedAnnouncement : t.copyFailed);
    this.#resetTimeout = view?.setTimeout(() => this.#reset(), COPY_FEEDBACK_MS);
    return copied;
  }

  #reset(): void {
    if (this.#resetTimeout !== undefined) {
      this.#document.defaultView?.clearTimeout(this.#resetTimeout);
      this.#resetTimeout = undefined;
    }
    this.#copiedKey.set(null);
    this.#announcement.set('');
  }
}
