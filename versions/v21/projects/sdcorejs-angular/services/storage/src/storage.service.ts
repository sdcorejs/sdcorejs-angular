import { inject, Injectable } from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
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
  // Dùng Map để quản lý bộ nhớ tốt hơn Record
  #memoryCache = new Map<string, StorageCacheEntry<any>>();
  #subjects = new Map<string, BehaviorSubject<any>>();
  private readonly configuration: ISdStorageConfiguration | null = inject(SD_STORAGE_CONFIG, { optional: true });

  create<T = any>(key: string | object, option?: SdStorageOption<T>): SdStorage<T> {
    if (!key) throw new Error('Key is required');

    // 1. Xử lý Key
    let hashKey: string;
    if (typeof key === 'string') {
      hashKey = key;
    } else if (typeof key === 'object') {
      hashKey = Utilities.hash(key);
    } else {
      throw new Error('Invalid key type');
    }

    if (this.configuration?.key) {
      hashKey = this.configuration.key(hashKey);
    }

    // 2. Init Subject: Đọc dữ liệu từ Storage ngay lập tức để Subject có giá trị đúng
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
      // Cố tình KHÔNG gọi subject.next — consumer dùng kênh riêng để thông báo
    };

    const has = () => {
      return this.#internalGet<T>(hashKey, option) !== undefined;
    };

    const remove = () => {
      this.#internalRemove(hashKey, option);
      subject.next(undefined);
    };

    // Hàm dọn dẹp bộ nhớ (quan trọng)
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
      // @ts-expect-error: Bổ sung vào interface nếu cần
      destroy,
      subject: subject,
      observer: subject.asObservable().pipe(map(() => get())),
    };
  }

  // --- PRIVATE CORE LOGIC ---

  /**
   * Helper xác định loại Storage đang dùng
   */
  #getStorage(option?: SdStorageOption<any>): Storage {
    return option?.type === 'session' ? sessionStorage : localStorage;
  }

  /**
   * Đọc dữ liệu: Memory -> Storage -> Parse
   */
  #internalGet<T>(key: string, option?: SdStorageOption<T>): T | undefined {
    // 1. Check Memory (Nhanh nhất)
    let entry = this.#memoryCache.get(key);

    // 2. Check Storage (Nếu memory chưa có hoặc mới F5)
    if (!entry) {
      const storage = this.#getStorage(option);
      const raw = storage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          // Convert string date back to Date object nếu cần
          entry = {
            data: parsed.data,
            createdOn: new Date(parsed.createdOn),
          };
          // Sync ngược vào RAM
          this.#memoryCache.set(key, entry);
        } catch (e) {
          console.warn('Storage parse error', e);
          this.#internalRemove(key, option); // Dữ liệu lỗi -> Xóa
        }
      }
    }

    if (!entry) return undefined;

    return this.#deepClone(entry.data);
  }

  /**
   * Ghi dữ liệu: Memory -> Storage
   */
  #internalSet<T>(key: string, data: T, option?: SdStorageOption<T>): void {
    const clonedData = this.#deepClone(data);

    const entry: StorageCacheEntry<T> = {
      data: clonedData,
      createdOn: new Date(),
    };

    // 1. Lưu Memory
    this.#memoryCache.set(key, entry);

    // 2. Lưu Storage
    const storage = this.#getStorage(option);
    try {
      storage.setItem(key, JSON.stringify(entry));
    } catch (e) {
      console.error('Storage quota exceeded', e);
    }
  }

  /**
   * Xóa dữ liệu
   */
  #internalRemove(key: string, option?: SdStorageOption<any>): void {
    this.#memoryCache.delete(key);
    const storage = this.#getStorage(option);
    storage.removeItem(key);
  }

  /**
   * Deep Clone an toàn
   */
  #deepClone<T>(val: T): T {
    if (val === undefined || val === null) return val;
    return JSON.parse(JSON.stringify(val));
  }
}
