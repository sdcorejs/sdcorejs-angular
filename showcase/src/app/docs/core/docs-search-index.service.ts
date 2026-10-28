import { Injectable, computed, inject, signal, untracked } from '@angular/core';
import { DocsI18nService } from './docs-i18n.service';
import { DocsSearchEntry, documentSearchEntries, pageSearchEntries } from './docs-search-index';
import { DOC_PAGES } from './documentation.registry';
import { PublishedDocsService } from './published-docs.service';

/** Parallel document requests while the index fills in. */
const INDEX_CONCURRENCY = 6;

/**
 * Search index of one package version: pages from the registry right away, then API members and guide sections
 * from the published Markdown of that version as the documents arrive (they are cached by PublishedDocsService).
 */
@Injectable({ providedIn: 'root' })
export class DocsSearchIndexService {
  readonly #publishedDocs = inject(PublishedDocsService);
  readonly #i18n = inject(DocsI18nService);
  readonly #version = signal<string | null>(null);
  readonly #documentEntries = signal<readonly DocsSearchEntry[]>([]);
  readonly #pending = signal(0);
  #sequence = 0;
  /** The published index of the current version failed to load; the next ensure() tries again. */
  #failed = false;

  readonly indexing = computed(() => this.#pending() > 0);
  readonly entries = computed<readonly DocsSearchEntry[]>(() => {
    const version = this.#version();
    if (!version) return [];
    return [...pageSearchEntries(this.#i18n.pages(), version, this.#i18n.t().categories), ...this.#documentEntries()];
  });

  ensure(version: string): void {
    // why: callers run inside effects; reading #version must not make them depend on it.
    untracked(() => {
      if (this.#version() === version && !this.#failed) return;
      const sequence = ++this.#sequence;
      this.#failed = false;
      this.#version.set(version);
      this.#documentEntries.set([]);
      // why: workers of a replaced version stop counting down, so the count restarts here.
      this.#pending.set(0);
      void this.#indexDocuments(version, sequence);
    });
  }

  async #indexDocuments(version: string, sequence: number): Promise<void> {
    let published: ReadonlySet<string>;
    try {
      published = new Set((await this.#publishedDocs.loadIndex(version)).docs.map(document => document.id));
    } catch {
      if (sequence === this.#sequence) this.#failed = true;
      return;
    }
    if (sequence !== this.#sequence) return;
    const queue = DOC_PAGES.filter(page => page.publishedDocId && published.has(page.publishedDocId));
    this.#pending.set(queue.length);
    const worker = async () => {
      for (let page = queue.shift(); page; page = queue.shift()) {
        try {
          const view = await this.#publishedDocs.loadDocument(version, page.publishedDocId!);
          if (sequence !== this.#sequence) return;
          if (view) {
            const entries = documentSearchEntries(page, view, version);
            if (entries.length) this.#documentEntries.update(current => [...current, ...entries]);
          }
        } catch {
          // A document that fails to load stays out of the index; pages remain searchable.
        } finally {
          if (sequence === this.#sequence) this.#pending.update(count => Math.max(0, count - 1));
        }
      }
    };
    await Promise.all(Array.from({ length: INDEX_CONCURRENCY }, worker));
  }
}
