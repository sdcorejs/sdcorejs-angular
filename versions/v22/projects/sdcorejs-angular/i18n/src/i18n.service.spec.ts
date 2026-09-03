import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { I18N_STORAGE_KEY } from './i18n.token';
import { I18nService } from './i18n.service';
import { Language } from '@sdcorejs/utils/models';

describe('I18nService — initial resolution', () => {
  beforeEach(() => localStorage.removeItem(I18N_STORAGE_KEY));

  it('uses localStorage when valid', () => {
    localStorage.setItem(I18N_STORAGE_KEY, 'en');
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { language: 'vi' } }],
    });
    expect(TestBed.inject(I18nService).language()).toBe('en');
  });

  it('falls back to config when localStorage empty', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { language: 'en' } }],
    });
    expect(TestBed.inject(I18nService).language()).toBe('en');
  });

  it('falls back to vi when both empty', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(I18nService).language()).toBe('vi');
  });

  it('ignores invalid localStorage value', () => {
    localStorage.setItem(I18N_STORAGE_KEY, 'fr');
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { language: 'en' } }],
    });
    expect(TestBed.inject(I18nService).language()).toBe('en');
  });
});

describe('I18nService — setLanguage', () => {
  beforeEach(() => localStorage.removeItem(I18N_STORAGE_KEY));

  it('updates signal', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(I18nService);
    svc.setLanguage('en', { reload: false });
    expect(svc.language()).toBe('en');
  });

  it('persists to localStorage', () => {
    TestBed.configureTestingModule({ providers: [] });
    TestBed.inject(I18nService).setLanguage('en', { reload: false });
    expect(localStorage.getItem(I18N_STORAGE_KEY)).toBe('en');
  });

  it('messages signal swaps when language changes', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(I18nService);
    expect(svc.messages()['core.common.cancel']).toBe('Hủy');
    svc.setLanguage('en', { reload: false });
    expect(svc.messages()['core.common.cancel']).toBe('Cancel');
  });

  it('ignores unsupported language', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(I18nService);
    svc.setLanguage('fr' as Language, { reload: false });
    expect(svc.language()).toBe('vi');
  });
});

describe('I18nService — t()', () => {
  beforeEach(() => localStorage.removeItem(I18N_STORAGE_KEY));

  it('returns value for existing key', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(I18nService).t('core.common.cancel')).toBe('Hủy');
  });

  it('interpolates {name} params', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(I18nService).t('core.test.greet', { name: 'Bob' })).toBe('Xin chào Bob');
  });

  it('keeps placeholder when param missing', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(I18nService).t('core.test.greet')).toBe('Xin chào {name}');
  });

  it('returns key as-is when missing in both vi and en', () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(TestBed.inject(I18nService).t('core.missing.xyz')).toBe('core.missing.xyz');
  });

  it('warns once per missing key', () => {
    TestBed.configureTestingModule({ providers: [] });
    const svc = TestBed.inject(I18nService);
    const spy = spyOn(console, 'warn');
    svc.t('core.missing.warn-once');
    svc.t('core.missing.warn-once');
    expect(spy.calls.count()).toBe(1);
  });
});

describe('I18nService — custom language provider', () => {
  beforeEach(() => localStorage.removeItem(I18N_STORAGE_KEY));

  it('resolves sync custom catalog', () => {
    const customCatalog = { 'core.common.cancel': 'Annuler' } as Record<string, string>;
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { language: () => customCatalog } }],
    });
    const svc = TestBed.inject(I18nService);
    expect(svc.t('core.common.cancel')).toBe('Annuler');
  });

  it("localStorage 'vi'/'en' overrides custom function", () => {
    localStorage.setItem(I18N_STORAGE_KEY, 'en');
    TestBed.configureTestingModule({
      providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { language: () => ({ 'core.common.cancel': 'Annuler' }) } }],
    });
    const svc = TestBed.inject(I18nService);
    expect(svc.t('core.common.cancel')).toBe('Cancel');
  });
});
