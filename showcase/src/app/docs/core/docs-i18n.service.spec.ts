import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { EN_UI_STRINGS } from '../i18n/en';
import { VI_UI_STRINGS } from '../i18n/vi';
import { formatUiString } from '../i18n/docs-ui-strings';
import { DOCS_STORAGE } from './docs.tokens';
import { DOCS_LANGUAGE_STORAGE_KEY, DocsI18nService } from './docs-i18n.service';

describe('DocsI18nService', () => {
  let doc: Document;
  let store: Map<string, string>;

  function create(stored: string | null = null): DocsI18nService {
    doc = document.implementation.createHTMLDocument('i18n');
    store = new Map(stored ? [[DOCS_LANGUAGE_STORAGE_KEY, stored]] : []);
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: doc },
        {
          provide: DOCS_STORAGE,
          useValue: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) },
        },
      ],
    });
    return TestBed.inject(DocsI18nService);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('starts in English and restores a stored Vietnamese choice', () => {
    expect(create().language()).toBe('en');
    TestBed.resetTestingModule();

    const service = create('vi');
    expect(service.language()).toBe('vi');
    expect(service.t().docs).toBe('Tài liệu');
    expect(doc.documentElement.getAttribute('lang')).toBe('vi');
  });

  it('toggles, persists and formats strings with holes', () => {
    const service = create();

    service.toggle();

    expect(service.language()).toBe('vi');
    expect(store.get(DOCS_LANGUAGE_STORAGE_KEY)).toBe('vi');
    expect(service.format('goLatest', { v: '3.2' })).toBe('Chuyển sang 3.2 (mới nhất)');
  });

  it('keeps both catalogs complete', () => {
    expect(Object.keys(VI_UI_STRINGS).sort()).toEqual(Object.keys(EN_UI_STRINGS).sort());
    for (const [key, value] of Object.entries(VI_UI_STRINGS)) {
      expect(value.trim()).withContext(key).not.toBe('');
    }
  });

  it('leaves unknown holes untouched', () => {
    expect(formatUiString('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });
});
