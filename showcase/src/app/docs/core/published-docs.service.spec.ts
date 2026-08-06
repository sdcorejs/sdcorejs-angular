import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DOCS_BASE_URL } from './docs.tokens';
import { PublishedDocsService } from './published-docs.service';

const index = {
  package: '@sdcorejs/angular',
  version: '21.1.2',
  released: '2026-07-11',
  baseUrl: 'https://wrong-host.test/docs/21.1.2',
  count: 1,
  docs: [
    {
      id: 'components/button/sd-button',
      title: '<sd-button>',
      category: 'components',
      path: 'components/button/sd-button.md',
      url: 'https://wrong-host.test/docs/21.1.2/components/button/sd-button.md',
    },
  ],
};

describe('PublishedDocsService', () => {
  let service: PublishedDocsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PublishedDocsService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DOCS_BASE_URL, useValue: 'https://example.test/app/docs/' },
      ],
    });
    service = TestBed.inject(PublishedDocsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses base-href-safe paths instead of absolute URLs from the published index', async () => {
    const pending = service.loadDocument('21.1.2', 'components/button/sd-button');
    http.expectOne('https://example.test/app/docs/21.1.2/index.json').flush(index);
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne('https://example.test/app/docs/21.1.2/components/button/sd-button.md').flush(
      '# `<sd-button>`\n\n## One-line purpose\nPrimary action.\n\n## Inputs\n| Name | Type |\n| --- | --- |\n| loading | boolean |',
    );

    const result = await pending;
    expect(result?.parsed.title).toBe('`<sd-button>`');
    expect(result?.overview[0]?.heading).toBe('One-line purpose');
    expect(result?.api[0]?.heading).toBe('Inputs');
  });

  it('deduplicates index and Markdown requests through the in-memory cache', async () => {
    const first = service.loadDocument('21.1.2', 'components/button/sd-button');
    const second = service.loadDocument('21.1.2', 'components/button/sd-button');
    http.expectOne('https://example.test/app/docs/21.1.2/index.json').flush(index);
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne('https://example.test/app/docs/21.1.2/components/button/sd-button.md').flush('# Button\n\n## Examples\nExample');

    expect(await first).toEqual(await second);
  });

  it('returns null when a registry mapping is unavailable in the selected version', async () => {
    const pending = service.loadDocument('21.1.2', 'components/missing/sd-missing');
    http.expectOne('https://example.test/app/docs/21.1.2/index.json').flush(index);

    expect(await pending).toBeNull();
  });

  it('keeps renamed API sections and singular example sections instead of dropping partial matches', async () => {
    const pending = service.loadDocument('21.1.2', 'components/button/sd-button');
    http.expectOne('https://example.test/app/docs/21.1.2/index.json').flush(index);
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne('https://example.test/app/docs/21.1.2/components/button/sd-button.md').flush(
      [
        '# Splitter',
        '## One-line purpose',
        'Layout panes.',
        '## Types',
        'Public types.',
        '## `<sd-splitter>`',
        'Main component contract.',
        '## Styling',
        'Public styling.',
        '## Example',
        'A focused example.',
      ].join('\n'),
    );

    const result = await pending;
    expect(result?.api.map((section) => section.heading)).toEqual(['Types', '`<sd-splitter>`']);
    expect(result?.styling.map((section) => section.heading)).toEqual(['Styling']);
    expect(result?.examples.map((section) => section.heading)).toEqual(['Example']);
  });

  it('inherits the parent tab for nested published-document headings', async () => {
    const pending = service.loadDocument('21.1.2', 'components/button/sd-button');
    http.expectOne('https://example.test/app/docs/21.1.2/index.json').flush(index);
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne('https://example.test/app/docs/21.1.2/components/button/sd-button.md').flush(
      [
        '# Button',
        '## Examples',
        'Focused usage patterns.',
        '### Primary action',
        'Save a record.',
        '### Icon action',
        'Use an accessible label.',
        '## Inputs',
        'Public inputs.',
        '### `loading`',
        'Shows progress.',
      ].join('\n'),
    );

    const result = await pending;
    expect(result?.examples.map((section) => section.heading)).toEqual([
      'Examples',
      'Primary action',
      'Icon action',
    ]);
    expect(result?.api.map((section) => section.heading)).toEqual(['Inputs', '`loading`']);
  });
});
