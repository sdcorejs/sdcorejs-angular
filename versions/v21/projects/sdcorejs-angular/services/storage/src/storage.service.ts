/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inject, Injectable, Optional } from '@angular/core';
import { SdUtilities } from '@sdcorejs/angular/utilities';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { ISdStorageConfiguration, SD_STORAGE_CONFIG, SdStorage, SdStorageOption } from './storage.model';

interface StorageCacheEntry<T> {
  data: T;
  createdOn: Date;
}

@Injectable({
  providedIn: 'root',
})
export class SdStorageService {
  // DÃ¹ng Map Ä‘á»ƒ quáº£n lÃ½ bá»™ nhá»› tá»‘t hÆ¡n Record
  #memoryCache = new Map<string, StorageCacheEntry<any>>();
  #subjects = new Map<string, BehaviorSubject<any>>();

  constructor(
    @Inject(SD_STORAGE_CONFIG)
    @Optional()
    private configuration: ISdStorageConfiguration
  ) {}

  create<T = any>(key: string | object, option?: SdStorageOption<T>): SdStorage<T> {
    if (!key) throw new Error('Key is required');

    // 1. Xá»­ lÃ½ Key
    let hashKey: string;
    if (typeof key === 'string') {
      hashKey = key;
    } else if (typeof key === 'object') {
      hashKey = SdUtilities.hash(key);
    } else {
      throw new Error('Invalid key type');
    }

    if (this.configuration?.key) {
      hashKey = this.configuration.key(hashKey);
    }

    // 2. Init Subject: Äá»c dá»¯ liá»‡u tá»« Storage ngay láº­p tá»©c Ä‘á»ƒ Subject cÃ³ giÃ¡ trá»‹ Ä‘Ãºng
    if (!this.#subjects.has(hashKey)) {
      const existingData = this.#internalGet<T>(hashKey, option);
      // Fix Type: as T | undefined
      this.#subjects.set(hashKey, new BehaviorSubject<T | undefined>(existingData ?? option?.default));
    }

    const subject = this.#subjects.get(hashKey)!;

    // 3. Define Helpers
    const get = () => {
      const val = this.#internalGet<T>(hashKey, option);
      return (val ?? option?.default) as T;
    };

    const set = (data: T) => {
      this.#internalSet(hashKey, data, option);
      subject.next(data);
    };

    const setSilent = (data: T) => {
      this.#internalSet(hashKey, data, option);
      // Cá»‘ tÃ¬nh KHÃ”NG gá»i subject.next â€” consumer dÃ¹ng kÃªnh riÃªng Ä‘á»ƒ thÃ´ng bÃ¡o
    };

    const has = () => {
      return this.#internalGet<T>(hashKey, option) !== undefined;
    };

    const remove = () => {
      this.#internalRemove(hashKey, option);
      subject.next(undefined);
    };

    // HÃ m dá»n dáº¹p bá»™ nhá»› (quan trá»ng)
    const destroy = () => {
      subject.complete();
      this.#subjects.delete(hashKey);
      this.#memoryCache.delete(hashKey);
    };

    return {
      get,
      set,
      setSilent,
      has,
      remove,
      // @ts-ignore: Bá»• sung vÃ o interface náº¿u cáº§n
      destroy,
      subject: subject,
      observer: subject.asObservable().pipe(map(() => get())),
    };
  }

  // --- PRIVATE CORE LOGIC ---

  /**
   * Helper xÃ¡c Ä‘á»‹nh loáº¡i Storage Ä‘ang dÃ¹ng
   */
  #getStorage(option?: SdStorageOption<any>): Storage {
    return option?.type === 'session' ? sessionStorage : localStorage;
  }

  /**
   * Äá»c dá»¯ liá»‡u: Memory -> Storage -> Parse
   */
  #internalGet<T>(key: string, option?: SdStorageOption<T>): T | undefined {
    // 1. Check Memory (Nhanh nháº¥t)
    let entry = this.#memoryCache.get(key);

    // 2. Check Storage (Náº¿u memory chÆ°a cÃ³ hoáº·c má»›i F5)
    if (!entry) {
      const storage = this.#getStorage(option);
      const raw = storage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Convert string date back to Date object náº¿u cáº§n
          entry = {
            data: parsed.data,
            createdOn: new Date(parsed.createdOn)
          };
          // Sync ngÆ°á»£c vÃ o RAM
          this.#memoryCache.set(key, entry);
        } catch (e) {
          console.warn('Storage parse error', e);
          this.#internalRemove(key, option); // Dá»¯ liá»‡u lá»—i -> XÃ³a
        }
      }
    }

    if (!entry) return undefined;

    return this.#deepClone(entry.data);
  }

  /**
   * Ghi dá»¯ liá»‡u: Memory -> Storage
   */
  #internalSet<T>(key: string, data: T, option?: SdStorageOption<T>): void {
    const clonedData = this.#deepClone(data);

    const entry: StorageCacheEntry<T> = {
      data: clonedData,
      createdOn: new Date(),
    };

    // 1. LÆ°u Memory
    this.#memoryCache.set(key, entry);

    // 2. LÆ°u Storage
    const storage = this.#getStorage(option);
    try {
      storage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.error('Storage quota exceeded', e);
    }
  }

  /**
   * XÃ³a dá»¯ liá»‡u
   */
  #internalRemove(key: string, option?: SdStorageOption<any>): void {
    this.#memoryCache.delete(key);
    const storage = this.#getStorage(option);
    storage.removeItem(key);
  }

  /**
   * Deep Clone an toÃ n
   */
  #deepClone<T>(val: T): T {
    if (val === undefined || val === null) return val;
    return JSON.parse(JSON.stringify(val));
  }
}
