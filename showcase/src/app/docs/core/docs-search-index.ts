import { apiRowsOfMarkdown, parseApiMethod } from './api-table.parser';
import { foldSearchText } from './docs-search.utils';
import { DocCategory, DocPageDefinition } from './documentation.models';
import { PublishedDocTabsViewModel } from './published-docs.models';

export type DocsSearchGroupId = DocCategory | 'api';

/** One searchable thing: a page, an API member or a guide section. */
export interface DocsSearchEntry {
  readonly id: string;
  readonly group: DocsSearchGroupId;
  readonly title: string;
  /** Where it lives, e.g. "Forms" or "Button · Inputs". */
  readonly path: string;
  readonly snippet: string;
  readonly icon: string;
  readonly commands: string[];
  readonly fragment: string | null;
}

export interface DocsSearchHit extends DocsSearchEntry {
  readonly score: number;
}

export interface DocsSearchHitGroup {
  readonly id: DocsSearchGroupId;
  readonly count: number;
  readonly hits: readonly DocsSearchHit[];
}

export interface DocsHighlightParts {
  readonly before: string;
  readonly match: string;
  readonly after: string;
}

/** Result groups in display order (as in the design): forms, components and services before API members. */
export const SEARCH_GROUP_ORDER: readonly DocsSearchGroupId[] = [
  'forms',
  'components',
  'services',
  'api',
  'guides',
  'directives',
  'modules-integrations',
  'pipes-utilities',
];

const CATEGORY_ICONS: Readonly<Record<DocCategory, string>> = {
  guides: 'menu_book',
  components: 'widgets',
  forms: 'edit_note',
  directives: 'alternate_email',
  services: 'dns',
  'modules-integrations': 'extension',
  'pipes-utilities': 'tune',
};

function plain(markdown: string): string {
  return markdown
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function pageSearchEntries(
  pages: readonly DocPageDefinition[],
  version: string,
  categoryLabels: Readonly<Record<DocCategory, string>>
): DocsSearchEntry[] {
  return pages.map(page => ({
    id: `page:${page.id}`,
    group: page.category,
    title: page.title,
    path: categoryLabels[page.category],
    snippet: page.description,
    icon: CATEGORY_ICONS[page.category],
    commands: ['/v', version, page.category, page.slug, 'overview'],
    fragment: null,
  }));
}

/** API members (table rows and service methods) of a page, plus the h2 sections of a guide. */
export function documentSearchEntries(page: DocPageDefinition, view: PublishedDocTabsViewModel, version: string): DocsSearchEntry[] {
  const entries: DocsSearchEntry[] = [];
  const api = ['/v', version, page.category, page.slug, 'api'];
  for (const section of view.api) {
    const method = parseApiMethod(section.heading, section.markdown);
    if (method) {
      entries.push({
        id: `api:${page.id}:${method.id}`,
        group: 'api',
        title: `${method.name}()`,
        path: `${page.title} · Methods`,
        snippet: plain(method.description),
        icon: 'data_object',
        commands: api,
        fragment: method.id,
      });
      continue;
    }
    for (const row of apiRowsOfMarkdown(section.markdown, section.id)) {
      entries.push({
        id: `api:${page.id}:${row.id}`,
        group: 'api',
        title: row.name,
        path: `${page.title} · ${section.heading.replace(/`/g, '')}`,
        snippet: plain(row.description),
        icon: 'data_object',
        commands: api,
        fragment: row.id,
      });
    }
  }
  if (page.category === 'guides') {
    // why: a guide's h2 sections are split across tabs, so each hit opens the tab that holds its section.
    const tabs = [
      ['overview', view.overview],
      ['api', view.api],
      ['styling', view.styling],
    ] as const;
    for (const [tab, sections] of tabs) {
      for (const section of sections.filter(item => item.level === 2)) {
        entries.push({
          id: `section:${page.id}:${section.id}`,
          group: 'guides',
          title: section.heading.replace(/`/g, ''),
          path: page.title,
          snippet: '',
          icon: 'menu_book',
          commands: ['/v', version, page.category, page.slug, tab],
          fragment: section.id,
        });
      }
    }
  }
  return entries;
}

/** Ranking of the design: the title starts with the query (3), contains it (2), or the snippet contains it (1). */
export function rankSearchEntries(entries: readonly DocsSearchEntry[], query: string): DocsSearchHit[] {
  const term = foldSearchText(query.trim());
  if (!term) return [];
  return entries
    .map(entry => {
      const title = foldSearchText(entry.title);
      const score = title.startsWith(term) ? 3 : title.includes(term) ? 2 : foldSearchText(entry.snippet).includes(term) ? 1 : 0;
      return { ...entry, score };
    })
    .filter(hit => hit.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));
}

/** Groups hits in SEARCH_GROUP_ORDER, keeping at most `limit` per group (the count still reports all). */
export function groupSearchHits(hits: readonly DocsSearchHit[], limit = 8): DocsSearchHitGroup[] {
  return SEARCH_GROUP_ORDER.map(id => {
    const inGroup = hits.filter(hit => hit.group === id);
    return { id, count: inGroup.length, hits: inGroup.slice(0, limit) };
  }).filter(group => group.count > 0);
}

/** Splits text around the first accent-insensitive match of the query. */
export function highlightParts(text: string, query: string): DocsHighlightParts {
  const term = foldSearchText(query.trim());
  if (!term) return { before: text, match: '', after: '' };
  let folded = '';
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const character of text) {
    const end = offset + character.length;
    const foldedCharacter = foldSearchText(character);
    for (let index = 0; index < foldedCharacter.length; index += 1) {
      starts.push(offset);
      ends.push(end);
    }
    folded += foldedCharacter;
    offset = end;
  }
  const index = folded.indexOf(term);
  if (index < 0) return { before: text, match: '', after: '' };
  const start = starts[index] ?? 0;
  const end = ends[index + term.length - 1] ?? start;
  return { before: text.slice(0, start), match: text.slice(start, end), after: text.slice(end) };
}

/** Long snippets start shortly before the match, as in the design. */
export function snippetAround(text: string, query: string): string {
  const index = foldSearchText(text).indexOf(foldSearchText(query.trim()));
  return text.length > 150 && index > 70 ? `…${text.slice(index - 50)}` : text;
}

/** Closest matches for a missing slug: pages whose slug contains a slug token of 4+ characters. */
export function closestPages(slug: string, pages: readonly DocPageDefinition[]): DocPageDefinition[] {
  const tokens = slug
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 4);
  if (!tokens.length) return [];
  return pages.filter(page => tokens.some(token => page.slug.includes(token)));
}
