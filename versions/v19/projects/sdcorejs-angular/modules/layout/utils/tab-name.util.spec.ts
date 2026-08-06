import { I18N_STORAGE_KEY } from '@sdcorejs/angular/i18n';

import { resolveTabName } from './tab-name.util';

describe('resolveTabName', () => {
  const KEY = 'core.module.layout.home.tab-name';

  afterEach(() => {
    try {
      localStorage.removeItem(I18N_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  });

  it('returns the name in the language stored by the app', () => {
    localStorage.setItem(I18N_STORAGE_KEY, 'en');

    expect(resolveTabName(KEY)).toBe('Home');
  });

  it('follows a language switch', () => {
    localStorage.setItem(I18N_STORAGE_KEY, 'ja');

    expect(resolveTabName(KEY)).toBe('ホーム');
  });

  it('falls back to Vietnamese when no language has been stored yet', () => {
    localStorage.removeItem(I18N_STORAGE_KEY);

    expect(resolveTabName(KEY)).toBe('Trang chủ');
  });

  it('falls back to Vietnamese when the stored language has no catalog', () => {
    localStorage.setItem(I18N_STORAGE_KEY, 'not-a-language');

    expect(resolveTabName(KEY)).toBe('Trang chủ');
  });

  it('survives a localStorage that throws (private mode / SSR shim)', () => {
    spyOn(localStorage, 'getItem').and.throwError('denied');

    expect(resolveTabName(KEY)).toBe('Trang chủ');
  });

  it('returns the key itself when it is missing from every catalog', () => {
    expect(resolveTabName('core.module.layout.does-not-exist')).toBe('core.module.layout.does-not-exist');
  });
});
