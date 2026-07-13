import { DOC_PAGES } from './documentation.registry';
import { groupSearchResults, searchDocumentation } from './docs-search.utils';

describe('documentation search', () => {
  it('searches title, slug, keywords, selector, import path and example title', () => {
    expect(searchDocumentation('sd-button', DOC_PAGES)[0]?.page.slug).toBe('button');
    expect(searchDocumentation('syntax highlighting', DOC_PAGES)[0]?.page.slug).toBe('code-editor');
    expect(searchDocumentation('@sdcorejs/angular/services/excel', DOC_PAGES)[0]?.page.slug).toBe('excel');
    expect(searchDocumentation('secondary vs black', DOC_PAGES)[0]?.page.slug).toBe('button');
  });

  it('groups matching results by documentation category', () => {
    const groups = groupSearchResults(searchDocumentation('form', DOC_PAGES));

    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((group) => group.results.every((result) => result.page.category === group.category))).toBeTrue();
  });

  it('returns an empty result for blank input', () => {
    expect(searchDocumentation('   ', DOC_PAGES)).toEqual([]);
  });

  it('matches Vietnamese text without accents, including đ', () => {
    expect(searchDocumentation('kich thuoc', DOC_PAGES).some((result) => result.page.slug === 'button')).toBeTrue();
    expect(searchDocumentation('dieu huong', DOC_PAGES).some((result) => result.page.slug === 'anchor')).toBeTrue();
  });
});
