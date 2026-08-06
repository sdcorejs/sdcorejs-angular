import { DOC_CATEGORIES, DOC_CATEGORY_LABELS, DocCategory, DocPageDefinition } from './documentation.models';

export interface DocsSearchResult {
  readonly page: DocPageDefinition;
  readonly score: number;
  readonly matchedFields: readonly string[];
}

export interface DocsSearchGroup {
  readonly category: DocCategory;
  readonly title: string;
  readonly results: readonly DocsSearchResult[];
}

export function foldSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function searchDocumentation(
  query: string,
  pages: readonly DocPageDefinition[],
  publishedTitles: ReadonlyMap<string, string> = new Map()
): DocsSearchResult[] {
  const term = foldSearchText(query.trim());
  if (!term) return [];

  return pages
    .map((page): DocsSearchResult | null => {
      const fields: readonly [string, string, number][] = [
        ['title', page.title, 12],
        ['slug', page.slug, 10],
        ['selector', page.selector ?? '', 9],
        ['importPath', page.importPath, 8],
        ['category', page.category, 5],
        ['description', page.description, 4],
        ['keywords', page.keywords.join(' '), 6],
        ['examples', page.examples.map(example => example.title).join(' '), 5],
        ['publishedTitle', page.publishedDocId ? (publishedTitles.get(page.publishedDocId) ?? '') : '', 5],
      ];
      const matches = fields.filter(([, value]) => foldSearchText(value).includes(term));
      if (!matches.length) return null;
      const score = matches.reduce((total, [, value, weight]) => {
        const field = foldSearchText(value);
        return total + weight + (field === term ? weight : 0) + (field.startsWith(term) ? 2 : 0);
      }, 0);
      return { page, score, matchedFields: matches.map(([name]) => name) };
    })
    .filter((result): result is DocsSearchResult => result !== null)
    .sort((left, right) => right.score - left.score || left.page.title.localeCompare(right.page.title));
}

export function groupSearchResults(results: readonly DocsSearchResult[]): DocsSearchGroup[] {
  return DOC_CATEGORIES.map(category => ({
    category,
    title: DOC_CATEGORY_LABELS[category],
    results: results.filter(result => result.page.category === category),
  })).filter(group => group.results.length > 0);
}
