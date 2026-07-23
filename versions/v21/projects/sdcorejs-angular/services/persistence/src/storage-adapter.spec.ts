import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SD_PERSISTENCE_STORAGE_ADAPTER, SdPersistenceStorageAdapter } from './storage-adapter';

describe('SdBrowserStorageAdapter', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns null/no-op on SSR without touching defaultView', () => {
    const serverDocument = Object.create(null) as Document;
    Object.defineProperty(serverDocument, 'defaultView', {
      get: () => {
        throw new Error('defaultView must not be read on the server');
      },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: serverDocument },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    const adapter = TestBed.inject(SD_PERSISTENCE_STORAGE_ADAPTER);

    expect(adapter.readItem?.('local', 'key')).toEqual({ status: 'unavailable' });
    expect(adapter.getItem('local', 'key')).toBeNull();
    expect(adapter.setItem('local', 'key', 'value')).toBeFalse();
    expect(adapter.removeItem('session', 'key')).toBeFalse();
  });

  it('guards storage getters that throw SecurityError', () => {
    const browserWindow = Object.create(null) as Window;
    Object.defineProperty(browserWindow, 'localStorage', {
      get: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    });
    const browserDocument = { defaultView: browserWindow } as Document;
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: browserDocument },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const adapter = TestBed.inject(SD_PERSISTENCE_STORAGE_ADAPTER);

    expect(adapter.readItem?.('local', 'key')).toEqual({ status: 'unavailable' });
    expect(adapter.getItem('local', 'key')).toBeNull();
    expect(adapter.setItem('local', 'key', 'value')).toBeFalse();
    expect(adapter.removeItem('local', 'key')).toBeFalse();
  });

  it('guards get, quota, and remove failures from a present Storage implementation', () => {
    const throwingStorage: Storage = {
      get length(): number {
        return 0;
      },
      clear: () => undefined,
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      key: () => null,
      removeItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
    };
    const browserDocument = {
      defaultView: { localStorage: throwingStorage, sessionStorage: throwingStorage },
    } as Document;
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: browserDocument },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const adapter: SdPersistenceStorageAdapter = TestBed.inject(SD_PERSISTENCE_STORAGE_ADAPTER);

    expect(adapter.readItem?.('session', 'key')).toEqual({ status: 'unavailable' });
    expect(adapter.getItem('session', 'key')).toBeNull();
    expect(adapter.setItem('session', 'key', 'value')).toBeFalse();
    expect(adapter.removeItem('session', 'key')).toBeFalse();
  });

  it('distinguishes confirmed missing and found values', () => {
    const values = new Map([['present', 'value']]);
    const storage = {
      get length(): number {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: () => null,
      removeItem: (key: string) => void values.delete(key),
      setItem: (key: string, value: string) => void values.set(key, value),
    } satisfies Storage;
    const browserDocument = Object.create(null) as Document;
    Object.defineProperty(browserDocument, 'defaultView', {
      value: { localStorage: storage, sessionStorage: storage },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: browserDocument },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const adapter = TestBed.inject(SD_PERSISTENCE_STORAGE_ADAPTER);

    expect(adapter.readItem?.('local', 'missing')).toEqual({ status: 'absent' });
    expect(adapter.readItem?.('local', 'present')).toEqual({ status: 'found', value: 'value' });
  });
});
