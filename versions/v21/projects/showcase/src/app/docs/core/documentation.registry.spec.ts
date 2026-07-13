import { DOC_NAV_GROUPS, DOC_PAGES, findDocPage, getDocPagesByCategory } from './documentation.registry';
import { SHOWCASE_EXAMPLE_SOURCES } from '../generated/example-sources.generated';

const EXPECTED_PAGE_KEYS = [
  'components/anchor',
  'components/avatar',
  'components/badge',
  'components/button',
  'components/chart',
  'components/code-editor',
  'components/document-builder',
  'components/editor',
  'components/form-generic',
  'components/history',
  'components/icon',
  'components/icon-configuration',
  'components/import-excel',
  'components/inform',
  'components/mini-editor',
  'components/modal',
  'components/operator',
  'components/org-chart',
  'components/preview',
  'components/query-bar',
  'components/query-builder',
  'components/quick-action',
  'components/section',
  'components/side-drawer',
  'components/splitter',
  'components/stepper',
  'components/tab',
  'components/tab-router',
  'components/table',
  'components/tree',
  'components/upload-file',
  'components/view',
  'forms/autocomplete',
  'forms/checkbox',
  'forms/chip',
  'forms/chip-calendar',
  'forms/date',
  'forms/date-range',
  'forms/datetime',
  'forms/inline-text',
  'forms/input',
  'forms/input-color',
  'forms/input-number',
  'forms/radio',
  'forms/select',
  'forms/switch',
  'forms/textarea',
  'services/confirm',
  'services/docx',
  'services/excel',
  'services/loading',
  'services/notify',
  'services/storage',
] as const;

describe('documentation registry', () => {
  it('contains every existing showcase page exactly once', () => {
    expect(DOC_PAGES.map(page => `${page.category}/${page.slug}`)).toEqual(EXPECTED_PAGE_KEYS);
    expect(DOC_PAGES).toHaveSize(53);
    expect(getDocPagesByCategory('components')).toHaveSize(32);
    expect(getDocPagesByCategory('forms')).toHaveSize(15);
    expect(getDocPagesByCategory('services')).toHaveSize(6);
    expect(DOC_PAGES.reduce((total, page) => total + page.demoSectionCount, 0)).toBe(253);
  });

  it('uses unique stable page ids and category/slug pairs', () => {
    const ids = DOC_PAGES.map(page => page.id);
    const categorySlugs = DOC_PAGES.map(page => `${page.category}/${page.slug}`);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(categorySlugs).size).toBe(categorySlugs.length);
  });

  it('keeps the visible tab order consistent', () => {
    for (const page of DOC_PAGES) {
      expect(page.tabs.map(tab => tab.label)).toEqual(['Overview', 'Styling', 'API', 'Examples']);
      expect(page.tabs.map(tab => tab.id)).toEqual(['overview', 'styling', 'api', 'examples']);
    }
  });

  it('registers every existing demo section as a stable lazy example with generated source', () => {
    const exampleIds = DOC_PAGES.flatMap(page => page.examples.map(example => example.id));

    expect(new Set(exampleIds).size).toBe(exampleIds.length);
    expect(exampleIds).toHaveSize(253);
    for (const page of DOC_PAGES) {
      expect(page.examples).toHaveSize(page.demoSectionCount);
      for (const example of page.examples) {
        expect(example.id.startsWith(`${page.id}-example-`)).toBeTrue();
        expect(example.sectionId?.startsWith('example-')).toBeTrue();
        expect(SHOWCASE_EXAMPLE_SOURCES[example.sourceKey]).toBeDefined();
        expect(typeof example.loadComponent).toBe('function');
      }
    }
  });

  it('derives navigation groups and lookup helpers from the registry', () => {
    expect(DOC_NAV_GROUPS.map(group => group.pages.length)).toEqual([32, 15, 6]);
    expect(findDocPage('components', 'button')?.title).toBe('Button');
    expect(findDocPage('services', 'missing')).toBeUndefined();
  });

  it('preserves authored example order and interaction-gates resource-intensive previews', () => {
    expect(findDocPage('components', 'button')?.examples.slice(0, 4).map((example) => example.title)).toEqual([
      'Biến thể',
      'Bảng màu',
      'Secondary vs black',
      'Kích thước',
    ]);
    for (const slug of ['editor', 'form-generic', 'upload-file']) {
      expect(findDocPage('components', slug)?.examples.every((example) => example.activation === 'interaction')).toBeTrue();
    }
    expect(findDocPage('components', 'button')?.examples.every((example) => example.activation === 'viewport')).toBeTrue();
  });
});
