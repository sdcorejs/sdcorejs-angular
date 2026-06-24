import { Injectable } from '@angular/core';
import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import { Utilities } from '@sdcorejs/utils/fns';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { SdCache, SdCacheOption } from './cache.model';

interface CacheEntry<T> {
  data: T;
  createdOn: Date;
}

@Injectable({
  providedIn: 'root',
})
export class SdCacheService {
  #memoryCache = new Map<string, CacheEntry<any>>();
  #subjects = new Map<string, BehaviorSubject<any>>();

  constructor() {}

  create<T = any>(key: string | object, option?: SdCacheOption<T>): SdCache<T> {
    if (!key) throw new Error('Key is required');

    const hashKey = Utilities.hash({ key });

    // 1. Init Subject: Load data có sẵn nếu có
    if (!this.#subjects.has(hashKey)) {
      const existingData = this.#internalGet<T>(hashKey, option);
      this.#subjects.set(hashKey, new BehaviorSubject<T | undefined>(existingData ?? option?.default));
    }

    const subject = this.#subjects.get(hashKey)!;

    // 2. Define helpers
    const get = () => {
      const val = this.#internalGet<T>(hashKey, option);
      // Fix strict type: Ép kiểu về T (chấp nhận rủi ro undefined nếu user không check)
      return (val ?? option?.default) as T;
    };

    const set = (data: T) => {
      this.#internalSet(hashKey, data, option);
      subject.next(data);
    };

    const has = () => {
      return this.#internalGet<T>(hashKey, option) !== undefined;
    };

    const remove = () => {
      this.#internalRemove(hashKey, option);
      subject.next(undefined);
    };

    const destroy = () => {
      subject.complete();
      this.#subjects.delete(hashKey);
      this.#memoryCache.delete(hashKey);
    };

    // 3. IMPLEMENT LOAD (Get-Or-Set Pattern)
    const load = async (callback: () => Promise<T>): Promise<T> => {
      // Check cache trước
      if (has()) {
        return get();
      }

      // Cache miss -> Gọi API
      const result = await callback();
      // Chỉ lưu nếu kết quả hợp lệ (khác undefined/null)
      if (result !== undefined && result !== null) {
        set(result);
      }
      return result;
    };

    return {
      get,
      set,
      has,
      remove,
      destroy,
      load,
      observer: subject.asObservable().pipe(map(() => get())),
    };
  }

  // --- PRIVATE HELPERS ---

  #getStorage(option?: SdCacheOption): Storage | null {
    if (option?.type === 'local') return localStorage;
    if (option?.type === 'session') return sessionStorage;
    return null;
  }

  #internalGet<T>(key: string, option?: SdCacheOption): T | undefined {
    let entry = this.#memoryCache.get(key);

    if (!entry) {
      const storage = this.#getStorage(option);
      if (storage) {
        const raw = storage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            entry = {
              data: parsed.data,
              createdOn: new Date(parsed.createdOn),
            };
            this.#memoryCache.set(key, entry);
          } catch (e) {
            this.#internalRemove(key, option);
          }
        }
      }
    }

    if (!entry) return undefined;

    if (option?.hours && entry.createdOn) {
      const expiredOn = DateUtilities.addHours(entry.createdOn, option.hours);
      if (expiredOn && expiredOn < new Date()) {
        this.#internalRemove(key, option);
        return undefined;
      }
    }

    return this.#deepClone(entry.data);
  }

  #internalSet<T>(key: string, data: T, option?: SdCacheOption): void {
    // FIX LỖI TẠI ĐÂY: Bỏ "?? null" để giữ nguyên kiểu T
    const clonedData = this.#deepClone(data);

    const entry: CacheEntry<T> = {
      data: clonedData,
      createdOn: new Date(),
    };

    this.#memoryCache.set(key, entry);

    const storage = this.#getStorage(option);
    if (storage) {
      try {
        storage.setItem(key, JSON.stringify(entry));
      } catch (e) {
        console.error('Storage quota exceeded', e);
      }
    }
  }

  #internalRemove(key: string, option?: SdCacheOption): void {
    this.#memoryCache.delete(key);
    const storage = this.#getStorage(option);
    if (storage) {
      storage.removeItem(key);
    }
  }

  #deepClone<T>(val: T): T {
    if (val === undefined || val === null) return val;
    return JSON.parse(JSON.stringify(val));
  }
}
