import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';

export type SdPersistenceStorageArea = 'local' | 'session';

export type SdPersistenceStorageRead = { status: 'found'; value: string } | { status: 'absent' } | { status: 'unavailable' };

export interface SdPersistenceStorageAdapter {
  /** Optional tri-state read. Legacy adapters may continue to implement only `getItem`. */
  readItem?(area: SdPersistenceStorageArea, key: string): SdPersistenceStorageRead;
  getItem(area: SdPersistenceStorageArea, key: string): string | null;
  setItem(area: SdPersistenceStorageArea, key: string, value: string): boolean;
  removeItem(area: SdPersistenceStorageArea, key: string): boolean;
}

@Injectable({ providedIn: 'root' })
export class SdBrowserStorageAdapter implements SdPersistenceStorageAdapter {
  readonly #document = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);

  readItem(area: SdPersistenceStorageArea, key: string): SdPersistenceStorageRead {
    try {
      const storage = this.#getStorage(area);
      if (!storage) return { status: 'unavailable' };
      const value = storage.getItem(key);
      return value === null ? { status: 'absent' } : { status: 'found', value };
    } catch {
      return { status: 'unavailable' };
    }
  }

  getItem(area: SdPersistenceStorageArea, key: string): string | null {
    const result = this.readItem(area, key);
    return result.status === 'found' ? result.value : null;
  }

  setItem(area: SdPersistenceStorageArea, key: string, value: string): boolean {
    try {
      const storage = this.#getStorage(area);
      if (!storage) return false;
      storage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  removeItem(area: SdPersistenceStorageArea, key: string): boolean {
    try {
      const storage = this.#getStorage(area);
      if (!storage) return false;
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }

  #getStorage(area: SdPersistenceStorageArea): Storage | null {
    if (!isPlatformBrowser(this.#platformId)) return null;
    const browserWindow = this.#document.defaultView;
    if (!browserWindow) return null;
    return area === 'local' ? browserWindow.localStorage : browserWindow.sessionStorage;
  }
}

export function readSdPersistenceStorageItem(
  adapter: SdPersistenceStorageAdapter,
  area: SdPersistenceStorageArea,
  key: string
): SdPersistenceStorageRead {
  try {
    if (adapter.readItem) return adapter.readItem(area, key);
    const value = adapter.getItem(area, key);
    return value === null ? { status: 'absent' } : { status: 'found', value };
  } catch {
    return { status: 'unavailable' };
  }
}

export const SD_PERSISTENCE_STORAGE_ADAPTER = new InjectionToken<SdPersistenceStorageAdapter>('sd-persistence.storage-adapter', {
  factory: () => inject(SdBrowserStorageAdapter),
});
