import { DOC_PAGES } from './documentation.registry';
import {
  DocsSearchEntry,
  closestPages,
  documentSearchEntries,
  groupSearchHits,
  highlightParts,
  rankSearchEntries,
  snippetAround,
} from './docs-search-index';
import { PublishedDocTabsViewModel } from './published-docs.models';

function entry(title: string, group: DocsSearchEntry['group'], snippet = ''): DocsSearchEntry {
  return { id: `${group}:${title}`, group, title, path: '', snippet, icon: '', commands: [], fragment: null };
}

describe('docs search index', () => {
  it('ranks a title prefix over a title match over a snippet match', () => {
    const hits = rankSearchEntries(
      [entry('Format Date', 'pipes-utilities'), entry('Confirm', 'services', 'date picker'), entry('Date', 'forms'), entry('Table', 'components')],
      'date'
    );

    expect(hits.map(hit => [hit.title, hit.score])).toEqual([
      ['Date', 3],
      ['Format Date', 2],
      ['Confirm', 1],
    ]);
  });

  it('folds Vietnamese accents when matching', () => {
    expect(rankSearchEntries([entry('Ngày giờ', 'forms')], 'ngay').length).toBe(1);
  });

  it('groups hits in the design order and caps each group at 8', () => {
    const hits = rankSearchEntries(
      [entry('Date', 'forms'), entry('withDate()', 'api'), ...Array.from({ length: 10 }, (_, index) => entry(`Date ${index}`, 'components'))],
      'date'
    );
    const groups = groupSearchHits(hits);

    expect(groups.map(group => group.id)).toEqual(['forms', 'components', 'api']);
    expect(groups[1].count).toBe(10);
    expect(groups[1].hits.length).toBe(8);
  });

  it('highlights the matched part, accents included', () => {
    expect(highlightParts('Chọn ngày giờ', 'ngay')).toEqual({ before: 'Chọn ', match: 'ngày', after: ' giờ' });
    expect(highlightParts('Table', 'zzz')).toEqual({ before: 'Table', match: '', after: '' });
  });

  it('starts long snippets shortly before the match', () => {
    const text = `${'x'.repeat(100)} the date picker ${'y'.repeat(60)}`;
    expect(snippetAround(text, 'date').startsWith('…')).toBeTrue();
    expect(snippetAround('short date', 'date')).toBe('short date');
  });

  it('indexes API rows and service methods of a document with deep links', () => {
    const page = DOC_PAGES.find(candidate => candidate.slug === 'button')!;
    const view = {
      overview: [],
      styling: [],
      examples: [],
      api: [
        { heading: 'Inputs', id: 'inputs', level: 2, markdown: '| Name | Type | Notes |\n| --- | --- | --- |\n| `size` | `string` | Height. |' },
        {
          heading: '`confirm(message, option?): Promise<unknown>`',
          id: 'confirm',
          level: 3,
          markdown: 'Plain confirm dialog.\n\n```ts\nconfirm(\n  option?: {\n    title?: string;\n  }\n)\n```',
        },
      ],
    } as unknown as PublishedDocTabsViewModel;

    const entries = documentSearchEntries(page, view, '22.3.2');

    expect(entries.map(item => [item.title, item.path, item.fragment])).toEqual([
      ['size', 'Button · Inputs', 'api-inputs-size'],
      ['confirm()', 'Button · Methods', 'api-methods-confirm'],
    ]);
    expect(entries[0].commands).toEqual(['/v', '22.3.2', 'components', 'button', 'api']);
  });

  it('suggests pages that share a slug token of four or more characters', () => {
    expect(closestPages('data-table', DOC_PAGES).map(page => page.slug)).toEqual(
      jasmine.arrayContaining(['data-state', 'table'])
    );
    expect(closestPages('ab-cd', DOC_PAGES)).toEqual([]);
  });
});
