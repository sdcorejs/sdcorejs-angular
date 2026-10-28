import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { DOCS_STORAGE } from './docs.tokens';
import { DOCS_THEME_STORAGE_KEY, DocsThemeService, resolveInitialTheme } from './docs-theme.service';

describe('resolveInitialTheme', () => {
  it('prefers a stored choice over the system preference', () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  it('follows prefers-color-scheme when nothing valid is stored', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
    expect(resolveInitialTheme(null, false)).toBe('light');
    expect(resolveInitialTheme('sepia', true)).toBe('dark');
  });
});

describe('DocsThemeService', () => {
  let doc: Document;
  let store: Map<string, string>;

  function create(stored: string | null = null): DocsThemeService {
    doc = document.implementation.createHTMLDocument('theme');
    store = new Map(stored ? [[DOCS_THEME_STORAGE_KEY, stored]] : []);
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    } as unknown as Storage;
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: doc },
        { provide: DOCS_STORAGE, useValue: storage },
      ],
    });
    return TestBed.inject(DocsThemeService);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('applies the stored theme to <html> on start', () => {
    const service = create('dark');

    expect(service.theme()).toBe('dark');
    expect(doc.documentElement.getAttribute('data-sd-theme')).toBe('dark');
  });

  it('toggles, writes data-sd-theme and persists the choice', () => {
    const service = create('light');

    service.toggle();

    expect(service.theme()).toBe('dark');
    expect(doc.documentElement.getAttribute('data-sd-theme')).toBe('dark');
    expect(store.get(DOCS_THEME_STORAGE_KEY)).toBe('dark');

    service.toggle();

    expect(service.theme()).toBe('light');
    expect(doc.documentElement.getAttribute('data-sd-theme')).toBe('light');
    expect(store.get(DOCS_THEME_STORAGE_KEY)).toBe('light');
  });

  it('follows a page that writes data-sd-theme itself without persisting it', async () => {
    const service = create('light');

    doc.documentElement.setAttribute('data-sd-theme', 'dark');
    await new Promise(resolve => setTimeout(resolve));

    expect(service.theme()).toBe('dark');
    expect(store.get(DOCS_THEME_STORAGE_KEY)).toBe('light');
  });
});
