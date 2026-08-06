import type { DocPageDefinition } from '../core/documentation.models';
import { resolveDocsPageAvailability } from './docs-page-availability';

function page(overrides: Partial<DocPageDefinition>): DocPageDefinition {
  return {
    id: 'components/example',
    category: 'components',
    slug: 'example',
    title: 'Example',
    description: 'Example page',
    selector: null,
    importPath: '@sdcorejs/angular',
    publishedDocId: 'components/example/sd-example',
    keywords: [],
    tabs: [],
    status: 'stable',
    sourcePath: '',
    legacyPath: '/components/example',
    legacyPaths: ['/components/example'],
    demoSectionCount: 0,
    examples: [],
    ...overrides,
  };
}

describe('documentation page availability', () => {
  it('waits for the version index before classifying published pages', () => {
    expect(resolveDocsPageAvailability(page({}), null)).toBe('unknown');
  });

  it('marks a published page unavailable when its id is absent and it has no live demo', () => {
    expect(resolveDocsPageAvailability(page({}), new Set())).toBe('unavailable');
    expect(resolveDocsPageAvailability(page({}), new Set(['components/example/sd-example']))).toBe('published');
  });

  it('keeps current live demos discoverable when their document is absent from a historical index', () => {
    expect(
      resolveDocsPageAvailability(
        page({
          demoSectionCount: 1,
          examples: [{ id: 'example', title: 'Example' }] as unknown as DocPageDefinition['examples'],
        }),
        new Set()
      )
    ).toBe('live-demo');
  });

  it('keeps pages with a live example and no published document discoverable', () => {
    expect(
      resolveDocsPageAvailability(
        page({
          publishedDocId: null,
          demoSectionCount: 1,
          examples: [{ id: 'example', title: 'Example' }] as unknown as DocPageDefinition['examples'],
        }),
        new Set()
      )
    ).toBe('live-demo');
  });
});
