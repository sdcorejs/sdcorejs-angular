import { DOC_CATEGORIES } from './documentation.models';
import { DOC_NAV_GROUPS, DOC_PAGES, findDocPage, getDocPagesByCategory } from './documentation.registry';
import { SHOWCASE_EXAMPLE_SOURCES } from '../generated/example-sources.generated';

const EXPECTED_CATEGORY_COUNTS = {
  guides: 3,
  components: 35,
  forms: 22,
  directives: 6,
  services: 11,
  'modules-integrations': 10,
  'pipes-utilities': 9,
} as const;

describe('documentation registry', () => {
  it('exposes every latest published document exactly once', () => {
    const publishedIds = DOC_PAGES.map(page => page.publishedDocId).filter(id => id !== null);
    const localOnlyPages = DOC_PAGES.filter(page => page.publishedDocId === null);

    expect(DOC_PAGES).toHaveSize(96);
    expect(new Set(publishedIds).size).toBe(96);
    expect(localOnlyPages).toHaveSize(0);
    expect(DOC_CATEGORIES).toHaveSize(7);
    for (const category of DOC_CATEGORIES) {
      expect(getDocPagesByCategory(category)).withContext(category).toHaveSize(EXPECTED_CATEGORY_COUNTS[category]);
    }
    expect(DOC_PAGES.reduce((total, page) => total + page.demoSectionCount, 0)).toBe(339);
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

  it('retains every existing demo section as optional live metadata on its published page', () => {
    const exampleIds = DOC_PAGES.flatMap(page => page.examples.map(example => example.id));

    expect(new Set(exampleIds).size).toBe(exampleIds.length);
    expect(exampleIds).toHaveSize(335);
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

  it('derives navigation groups and canonical/legacy lookup helpers from the registry', () => {
    expect(DOC_NAV_GROUPS.map(group => group.pages.length)).toEqual([3, 35, 22, 6, 11, 10, 9]);
    expect(findDocPage('components', 'button')?.title).toBe('Button');
    expect(findDocPage('directives', 'tooltip')?.publishedDocId).toBe('directives/src/sd-tooltip');
    expect(findDocPage('components', 'generic')?.title).toBe('Form Generic');
    expect(findDocPage('components', 'generic')?.id).toBe('modules-integrations-generic');
    expect(findDocPage('components', 'generic')?.examples[0]?.id).toBe('modules-integrations-generic-example-builder-render');
    expect(findDocPage('modules-integrations', 'generic')?.category).toBe('components');
    expect(findDocPage('modules-integrations', 'icon')?.demoSectionCount).toBe(7);
    expect(findDocPage('components', 'form-generic')?.slug).toBe('generic');
    expect(findDocPage('components', 'icon-configuration')?.slug).toBe('icon');
    expect(findDocPage('forms', 'time')?.demoSectionCount).toBe(4);
    expect(findDocPage('forms', 'time-range')?.publishedDocId).toBe('forms/time-range/sd-time-range');
    expect(findDocPage('services', 'viewport')?.importPath).toBe('@sdcorejs/angular/services/viewport');
    expect(findDocPage('services', 'unsaved-changes')?.demoSectionCount).toBe(4);
    expect(findDocPage('services', 'task')?.demoSectionCount).toBe(4);
    expect(findDocPage('services', 'persistence')?.importPath).toBe('@sdcorejs/angular/services/persistence');
    expect(findDocPage('components', 'job-progress')?.selector).toBe('sd-job-progress');
    expect(findDocPage('components', 'audit-diff')?.demoSectionCount).toBe(4);
    expect(findDocPage('components', 'breadcrumb')?.demoSectionCount).toBe(3);
    expect(findDocPage('components', 'data-state')?.demoSectionCount).toBe(5);
    expect(findDocPage('services', 'missing')).toBeUndefined();
  });

  it('preserves authored example order and interaction-gates resource-intensive previews', () => {
    expect(
      findDocPage('components', 'button')
        ?.examples.slice(0, 4)
        .map(example => example.title)
    ).toEqual(['Biến thể', 'Bảng màu', 'Secondary vs black', 'Kích thước']);
    for (const slug of ['editor', 'upload-file']) {
      expect(findDocPage('components', slug)?.examples.every(example => example.activation === 'interaction')).toBeTrue();
    }
    expect(findDocPage('components', 'generic')?.examples.every(example => example.activation === 'interaction')).toBeTrue();
    expect(findDocPage('components', 'button')?.examples.every(example => example.activation === 'viewport')).toBeTrue();
  });

  it('exposes the Layout live-demo loader from the modules registry entry', async () => {
    const layoutPage = findDocPage('modules-integrations', 'layout');

    expect(layoutPage?.sourcePath).toContain('/pages/modules/layout/layout-demo.component.ts');
    expect(layoutPage?.demoSectionCount).toBe(3);
    expect((await layoutPage?.examples[0]?.loadComponent())?.name).toBe('LayoutDemoComponent');
  });
});
