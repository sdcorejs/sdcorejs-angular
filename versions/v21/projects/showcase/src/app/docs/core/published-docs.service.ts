import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DOCS_BASE_URL } from './docs.tokens';
import { parseMarkdownDocument } from './markdown-parser';
import {
  MarkdownSection,
  PublishedDocsIndex,
  PublishedDocTabsViewModel,
} from './published-docs.models';

const OVERVIEW_HEADINGS = [
  'one-line purpose',
  'when to use',
  'when not to use',
  'accessibility',
  'anti-patterns',
  'related',
  'behavior notes',
  'permission gating',
  'known limitations',
];

const STYLING_HEADINGS = [
  'visual cues',
  'styling',
  'host classes',
  'theme',
  'dense dashboard',
  'standalone imports and table-cell usage',
  'sizing',
  'visual / behavior',
];

const API_HEADINGS = [
  'inputs',
  'outputs',
  'public api',
  'public methods',
  'content projection',
  'type shapes',
  'configuration',
  'configuration / di tokens',
  'form integration',
  'e2e test attributes',
];

function normalizedHeading(section: MarkdownSection): string {
  return section.heading.toLowerCase().replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

function includesHeading(section: MarkdownSection, aliases: readonly string[]): boolean {
  const heading = normalizedHeading(section);
  return aliases.some((alias) => heading === alias || heading.startsWith(`${alias} `));
}

type PublishedDocsTab = 'overview' | 'styling' | 'api' | 'examples';

function classifyHeading(section: MarkdownSection): PublishedDocsTab | null {
  if (includesHeading(section, OVERVIEW_HEADINGS)) return 'overview';
  if (includesHeading(section, STYLING_HEADINGS)) return 'styling';
  if (includesHeading(section, ['example', 'examples', 'testing', 'tests', 'test coverage'])) return 'examples';
  if (includesHeading(section, API_HEADINGS)) return 'api';
  return null;
}

/** Keeps nested published-doc headings in the tab selected by their nearest parent heading. */
function groupSections(sections: readonly MarkdownSection[]): Record<PublishedDocsTab, MarkdownSection[]> {
  const grouped: Record<PublishedDocsTab, MarkdownSection[]> = {
    overview: [],
    styling: [],
    api: [],
    examples: [],
  };
  const ancestorTabs = new Map<number, PublishedDocsTab>();

  for (const section of sections) {
    for (const level of [...ancestorTabs.keys()]) {
      if (level >= section.level) ancestorTabs.delete(level);
    }

    const parentTab = [...ancestorTabs.entries()]
      .filter(([level]) => level < section.level)
      .sort(([left], [right]) => right - left)[0]?.[1];
    const tab = classifyHeading(section) ?? parentTab ?? 'api';
    grouped[tab].push(section);
    ancestorTabs.set(section.level, tab);
  }

  return grouped;
}

@Injectable({ providedIn: 'root' })
export class PublishedDocsService {
  readonly #http = inject(HttpClient);
  readonly #baseUrl = inject(DOCS_BASE_URL);
  readonly #indexCache = new Map<string, Promise<PublishedDocsIndex>>();
  readonly #documentCache = new Map<string, Promise<PublishedDocTabsViewModel | null>>();

  loadIndex(version: string): Promise<PublishedDocsIndex> {
    const cached = this.#indexCache.get(version);
    if (cached) return cached;

    const request = firstValueFrom(
      this.#http.get<PublishedDocsIndex>(new URL(`${encodeURIComponent(version)}/index.json`, this.#baseUrl).toString()),
    ).catch((error: unknown) => {
      this.#indexCache.delete(version);
      throw error;
    });
    this.#indexCache.set(version, request);
    return request;
  }

  loadDocument(version: string, publishedDocId: string): Promise<PublishedDocTabsViewModel | null> {
    const cacheKey = `${version}:${publishedDocId}`;
    const cached = this.#documentCache.get(cacheKey);
    if (cached) return cached;

    const request = this.#loadDocument(version, publishedDocId).catch((error: unknown) => {
      this.#documentCache.delete(cacheKey);
      throw error;
    });
    this.#documentCache.set(cacheKey, request);
    return request;
  }

  async loadStyleGuide(version: string): Promise<PublishedDocTabsViewModel | null> {
    return this.loadDocument(version, 'assets/STYLE-GUIDE');
  }

  resolveDocumentUrl(version: string, path: string): string {
    return new URL(`${encodeURIComponent(version)}/${path.replace(/^\/+/, '')}`, this.#baseUrl).toString();
  }

  clearCache(): void {
    this.#indexCache.clear();
    this.#documentCache.clear();
  }

  async #loadDocument(version: string, publishedDocId: string): Promise<PublishedDocTabsViewModel | null> {
    const index = await this.loadIndex(version);
    const document = index.docs.find((item) => item.id === publishedDocId);
    if (!document) return null;

    const url = this.resolveDocumentUrl(version, document.path);
    const markdown = await firstValueFrom(this.#http.get(url, { responseType: 'text' }));
    const parsed = parseMarkdownDocument(markdown);
    const { overview, styling, api, examples } = groupSections(parsed.sections);

    return { document, parsed, overview, styling, api, examples };
  }
}
