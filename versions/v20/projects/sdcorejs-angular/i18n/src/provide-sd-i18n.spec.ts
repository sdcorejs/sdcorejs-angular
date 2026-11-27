import { PLATFORM_ID, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSdCore } from '@sdcorejs/angular/core';
import { SD_I18N_PRELOADED } from './i18n.options';
import { SdTranslatePipe } from './i18n.pipe';
import type { I18nCatalog } from './i18n.types';
import { I18nService } from './i18n.service';
import { I18N_STORAGE_KEY } from './i18n.token';
import { provideSdI18n } from './provide-sd-i18n';

const catalog = (cancel: string) => ({ 'core.common.cancel': cancel }) as I18nCatalog;
describe('provideSdI18n', () => {
  beforeEach(() => localStorage.removeItem(I18N_STORAGE_KEY));
  afterEach(() => localStorage.removeItem(I18N_STORAGE_KEY));

  it('uses only the selected loader and caches concurrent requests', async () => {
    const en = jasmine.createSpy().and.resolveTo(catalog('Cancel'));
    const vi = jasmine.createSpy().and.resolveTo(catalog('Hủy'));
    localStorage.setItem(I18N_STORAGE_KEY, 'en');
    TestBed.configureTestingModule({ providers: [provideSdI18n({ defaultLanguage: 'vi', loaders: { vi, en } })] });
    const service = TestBed.inject(I18nService);
    await Promise.all([service.initialize(), service.initialize()]);
    expect(en).toHaveBeenCalledTimes(1);
    expect(vi).not.toHaveBeenCalled();
    expect(service.t('core.common.cancel')).toBe('Cancel');
    await service.setLanguage('ja', { reload: false });
    expect(service.locale()).toBe('en-US');
  });

  it('falls back on failure and retries the rejected loader on a later selection', async () => {
    let attempts = 0;
    localStorage.setItem(I18N_STORAGE_KEY, 'en');
    TestBed.configureTestingModule({
      providers: [
        provideSdI18n({
          defaultLanguage: 'vi',
          loaders: {
            vi: async () => catalog('Hủy'),
            en: async () => {
              if (++attempts === 1) throw new Error('offline');
              return catalog('Cancel');
            },
          },
        }),
      ],
    });
    const service = TestBed.inject(I18nService);
    await service.initialize();
    expect(service.locale()).toBe('vi-VN');
    await service.setLanguage('en', { reload: false });
    expect(service.t('core.common.cancel')).toBe('Cancel');
    expect(attempts).toBe(2);
  });

  it('keeps the latest selection if a previous request finishes later', async () => {
    let finish!: (value: I18nCatalog) => void;
    const pending = new Promise<I18nCatalog>(resolve => (finish = resolve));
    TestBed.configureTestingModule({
      providers: [
        provideSdI18n({
          defaultLanguage: 'vi',
          loaders: {
            en: () => pending,
            vi: async () => catalog('Hủy'),
          },
        }),
      ],
    });
    const service = TestBed.inject(I18nService);
    await service.initialize();
    const first = service.setLanguage('en', { reload: false });
    await service.setLanguage('vi', { reload: false });
    finish(catalog('Cancel'));
    await first;
    expect(service.language()).toBe('vi');
    expect(localStorage.getItem(I18N_STORAGE_KEY)).not.toBe('en');
  });

  it('keeps the latest choice made while the first catalog is still loading', async () => {
    let finish!: (value: I18nCatalog) => void;
    const pending = new Promise<I18nCatalog>(resolve => (finish = resolve));
    TestBed.configureTestingModule({
      providers: [
        provideSdI18n({
          defaultLanguage: 'vi',
          loaders: {
            vi: () => pending,
            en: async () => catalog('Cancel'),
          },
        }),
      ],
    });
    const service = TestBed.inject(I18nService);
    const first = service.setLanguage('en', { reload: false });
    const last = service.setLanguage('vi', { reload: false });
    finish(catalog('Hủy'));
    await Promise.all([first, last]);
    expect(service.t('core.common.cancel')).toBe('Hủy');
    expect(localStorage.getItem(I18N_STORAGE_KEY)).not.toBe('en');
  });

  it('uses the configured default and can switch when browser storage is unavailable', async () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('denied');
    spyOn(Storage.prototype, 'setItem').and.throwError('denied');
    TestBed.configureTestingModule({
      providers: [provideSdI18n({ defaultLanguage: 'en', loaders: { en: async () => catalog('Cancel'), vi: async () => catalog('Hủy') } })],
    });
    const service = TestBed.inject(I18nService);
    await service.initialize();
    expect(service.language()).toBe('en');
    await service.setLanguage('vi');
    expect(service.t('core.common.cancel')).toBe('Hủy');
  });

  it('hands the server language to hydration even when browser storage differs', async () => {
    const loaders = { en: async () => catalog('Cancel'), vi: async () => catalog('Hủy') };
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, provideSdI18n({ defaultLanguage: 'en', loaders })],
    });
    await TestBed.inject(I18nService).initialize();
    const state = TestBed.inject(TransferState);
    expect(state.toJson()).toContain('"en"');
    TestBed.resetTestingModule();
    localStorage.setItem(I18N_STORAGE_KEY, 'vi');
    TestBed.configureTestingModule({
      providers: [{ provide: TransferState, useValue: state }, provideSdI18n({ defaultLanguage: 'vi', loaders })],
    });
    const service = TestBed.inject(I18nService);
    await service.initialize();
    expect(service.language()).toBe('en');
  });
});

describe('default lazy catalogs without an i18n provider', () => {
  beforeEach(() => {
    localStorage.removeItem(I18N_STORAGE_KEY);
    TestBed.configureTestingModule({ providers: [{ provide: SD_I18N_PRELOADED, useValue: null }] });
  });
  afterEach(() => localStorage.removeItem(I18N_STORAGE_KEY));

  it('loads a stored locale and updates the same cached pipe binding after startup and an in-place switch', async () => {
    localStorage.setItem(I18N_STORAGE_KEY, 'ja');
    TestBed.configureTestingModule({ providers: [SdTranslatePipe] });
    const service = TestBed.inject(I18nService);
    const pipe = TestBed.inject(SdTranslatePipe);
    expect(pipe.transform('core.common.cancel')).toBe('');
    const initial = service.initialize();
    expect(service.initialize()).toBe(initial);
    await initial;
    expect(pipe.transform('core.common.cancel')).toBe('キャンセル');
    await service.setLanguage('vi', { reload: false });
    expect(pipe.transform('core.common.cancel')).toBe('Hủy');
    expect(service.locale()).toBe('vi-VN');
  });

  it('combines a partial synchronous custom factory with Vietnamese defaults before bootstrap completes', async () => {
    const factory = jasmine.createSpy().and.returnValue({ 'core.common.cancel': 'Annuler' });
    TestBed.configureTestingModule({ providers: [provideSdCore({ language: factory })] });
    const service = TestBed.inject(I18nService);
    expect(service.t('core.common.cancel')).toBe('Annuler');
    await service.initialize();
    expect(factory).toHaveBeenCalledTimes(1);
    expect(service.t('core.common.cancel')).toBe('Annuler');
    expect(service.t('core.common.close')).toBe('Đóng');
  });

  it('keeps an initial failure observable and allows a later retry in the same injector', async () => {
    let offline = true;
    TestBed.configureTestingModule({
      providers: [
        provideSdI18n({
          defaultLanguage: 'vi',
          loaders: {
            vi: async () => {
              if (offline) throw new Error('offline');
              return catalog('Hủy');
            },
          },
        }),
      ],
    });
    const service = TestBed.inject(I18nService);
    await expectAsync(service.initialize()).toBeRejectedWithError('offline');
    expect(service.loadError()).toEqual(jasmine.any(Error));
    offline = false;
    await service.initialize();
    expect(service.loadError()).toBeNull();
    expect(service.t('core.common.cancel')).toBe('Hủy');
  });
});
