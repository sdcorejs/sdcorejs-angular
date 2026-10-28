import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { DocsI18nService } from '../core/docs-i18n.service';
import { DOCS_STORAGE } from '../core/docs.tokens';
import { DocExample } from '../core/documentation.models';
import { DOC_NAV_GROUPS, DOC_PAGES } from '../core/documentation.registry';
import { EN_EXAMPLE_CONTENT, EN_PAGE_CONTENT } from './content.en';
import { generatedExampleDescription, hasVietnameseText, localizeDocExample, localizeDocPage, localizeDocsContent } from './docs-content';

const ALL_EXAMPLES = DOC_PAGES.flatMap(page => page.examples);
const MISSING_HINT = 'Add an English entry to showcase/src/app/docs/i18n/content.en.ts';

describe('docs content in English', () => {
  it('has English for every Vietnamese page title and description', () => {
    const missing = localizeDocsContent(DOC_PAGES, DOC_NAV_GROUPS)
      .pages.filter(page => hasVietnameseText(page.title) || hasVietnameseText(page.description))
      .map(page => page.id);

    expect(missing).withContext(MISSING_HINT).toEqual([]);
  });

  it('has English for every Vietnamese example title and note', () => {
    const missing = DOC_PAGES.flatMap(page => localizeDocPage(page).examples)
      .filter(example => hasVietnameseText(example.title) || hasVietnameseText(example.description))
      .map(example => example.sourceKey);

    expect(missing).withContext(MISSING_HINT).toEqual([]);
  });

  it('keeps only entries that translate Vietnamese source text', () => {
    const pages = new Map(DOC_PAGES.map(page => [page.id, page]));
    const examples = new Map(ALL_EXAMPLES.map(example => [example.sourceKey as string, example]));
    const stale: string[] = [];
    for (const [id, english] of Object.entries(EN_PAGE_CONTENT)) {
      const page = pages.get(id);
      if (!page) stale.push(`${id}: no such page`);
      else if (english.title && !hasVietnameseText(page.title)) stale.push(`${id}: title is not Vietnamese`);
      else if (english.description && !hasVietnameseText(page.description)) stale.push(`${id}: description is not Vietnamese`);
    }
    for (const [key, english] of Object.entries(EN_EXAMPLE_CONTENT)) {
      const example = examples.get(key);
      if (!example) stale.push(`${key}: no such example`);
      else if (english?.title && !hasVietnameseText(example.title)) stale.push(`${key}: title is not Vietnamese`);
      else if (english?.description && !hasVietnameseText(example.description)) stale.push(`${key}: note is not Vietnamese`);
      else if (english?.description && example.description === generatedExampleDescription(example.title)) {
        stale.push(`${key}: the example has no note`);
      }
    }

    expect(stale).withContext('Remove or update these entries in content.en.ts').toEqual([]);
  });

  it('writes the English entries without Vietnamese', () => {
    const entries = [...Object.entries(EN_PAGE_CONTENT), ...Object.entries(EN_EXAMPLE_CONTENT)];
    const vietnamese = entries
      .filter(([, english]) => hasVietnameseText(english?.title ?? '') || hasVietnameseText(english?.description ?? ''))
      .map(([key]) => key);

    expect(vietnamese).toEqual([]);
  });
});

describe('localizeDocExample', () => {
  const source: DocExample = {
    id: 'components-demo-example-mac-dinh',
    sourceKey: 'components/button/example-bien-the',
    sectionId: 'example-mac-dinh',
    title: 'Mặc định',
    description: generatedExampleDescription('Mặc định'),
    activation: 'viewport',
    loadComponent: () => Promise.resolve(class {}),
  };

  it('swaps in the English title and rebuilds the generated note around it', () => {
    const english = localizeDocExample(source, { 'components/button/example-bien-the': { title: 'Default' } });

    expect(english.title).toBe('Default');
    expect(english.description).toBe(generatedExampleDescription('Default'));
    expect(english.loadComponent).toBe(source.loadComponent);
  });

  it('keeps a written note when only the title is translated, and the source object without a translation', () => {
    const noted = { ...source, description: 'Ghi chú riêng.' };

    expect(localizeDocExample(noted, { 'components/button/example-bien-the': { title: 'Default' } }).description).toBe('Ghi chú riêng.');
    expect(localizeDocExample(source, {})).toBe(source);
  });
});

describe('DocsI18nService content', () => {
  function create(stored: string | null): DocsI18nService {
    const store = new Map(stored ? [['sdcorejs.docs.lang', stored]] : []);
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: document.implementation.createHTMLDocument('content') },
        {
          provide: DOCS_STORAGE,
          useValue: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) },
        },
      ],
    });
    return TestBed.inject(DocsI18nService);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('shows the Vietnamese registry unchanged in VI mode', () => {
    const service = create('vi');
    const button = DOC_PAGES.find(page => page.id === 'components-button')!;

    expect(service.pages()).toBe(DOC_PAGES);
    expect(service.navGroups()).toBe(DOC_NAV_GROUPS);
    expect(service.page(button)).toBe(button);
    expect(service.contentLang('Action button')).toBe('vi');
  });

  it('shows English pages and examples in EN mode and keeps their identity across switches', () => {
    const service = create(null);
    const button = DOC_PAGES.find(page => page.id === 'components-button')!;
    const english = service.page(button);

    expect(english.description).toBe(EN_PAGE_CONTENT['components-button'].description!);
    expect(english.examples.map(example => example.id)).toEqual(button.examples.map(example => example.id));
    expect(english.examples.some(example => hasVietnameseText(example.title))).toBeFalse();
    expect(service.navGroups().find(group => group.category === 'components')?.pages).toContain(english);
    expect(service.contentLang(english.description)).toBe('en');
    expect(service.contentLang(button.description)).toBe('vi');

    service.set('vi');
    expect(service.page(button)).toBe(button);
    service.set('en');
    expect(service.page(button)).toBe(english);
  });
});
