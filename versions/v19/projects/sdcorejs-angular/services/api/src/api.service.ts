import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SdCacheService } from '@sdcorejs/angular/services/cache';
import { BrowserUtilities, Utilities } from '@sdcorejs/utils/fns';
import { lastValueFrom, Observable } from 'rxjs';
import { catchError, map, shareReplay, timeout } from 'rxjs/operators';
import { ISdApiConfiguration, SD_API_CONFIG, SdApiHandler, SdDeleteOption, SdGetOption, SdPostOption, SdPutOption } from './api.model';

// Gom nhóm các Option lại cho gọn
type SdHttpOptions = SdGetOption & SdPostOption & SdPutOption & SdDeleteOption;
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

@Injectable({
  providedIn: 'root',
})
export class SdApiService {
  readonly #defaultTimeout = 60000; // 60s
  readonly #dedupCacheDuration = 1000; // 1s (Deduplication cache duration)
  #httpClient = inject(HttpClient);
  #configurations = inject<ISdApiConfiguration[]>(SD_API_CONFIG, { optional: true }) || [];
  #cacheService = inject(SdCacheService);

  // Thay đổi cấu trúc Cache: Lưu Observable thay vì Subject phức tạp
  // Key: hash string -> Value: { stream$: Observable, expiry: number }
  #inFlightRequests = new Map<string, { stream$: Observable<any>; expiry: number }>();

  constructor() {
    // Optional: Cơ chế dọn dẹp cache định kỳ (mỗi 1 phút dọn dẹp các key hết hạn)
    setInterval(() => this.#cleanupCache(), 60000);
  }

  get http() {
    return this.#httpClient;
  }

  // --- PUBLIC METHODS ---

  get = <T = any>(url: string, option?: SdGetOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'GET', undefined, option);
  };

  post = <T = any>(url: string, body?: any, option?: SdPostOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'POST', body, option);
  };

  put = <T = any>(url: string, body?: any, option?: SdPutOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'PUT', body, option);
  };

  delete = <T = any>(url: string, option?: SdDeleteOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'DELETE', undefined, option);
  };

  // Upload file logic giữ nguyên nhưng refactor nhẹ
  upload = async (url: string, option?: { extensions?: string[]; maxSizeInMb?: number }): Promise<any> => {
    const file = await BrowserUtilities.upload(option);
    if (!Array.isArray(file) && file) {
      return this.uploadFile(url, file);
    }
  };

  uploadFile = async (url: string, file: File): Promise<any> => {
    if (!file) return null;
    if (file.name.lastIndexOf('.') === -1) throw new Error('Invalid file extension');

    const formData = new FormData();
    formData.append('file', file, file.name);
    // Upload thường không cần deduplication cache, set autoCache: false
    return await this.post(url, formData, { autoCache: false });
  };

  // --- PRIVATE CORE LOGIC ---

  /**
   * Hàm trung gian xử lý Layer Cache (SdCacheService) trước khi gọi API thực tế
   */
  #executeWithLayeredCache = async <T>(url: string, method: HttpMethod, body?: any, option?: SdHttpOptions): Promise<T> => {
    // Layer 1: Persistent Cache (SdCacheService)
    if (option?.cacheOption) {
      const key = this.#generateKey(url, method, body, option);
      const { get, set, has } = this.#cacheService.create(key, option.cacheOption);

      if (has()) {
        return get();
      }

      const result = await this.#request<T>(url, method, body, option);
      set(result);
      return result;
    }

    // Không có cache dài hạn thì gọi trực tiếp logic deduplication
    return this.#request<T>(url, method, body, option);
  };

  /**
   * Core Request: Xử lý Deduplication, Timeout, Mapping Response
   */
  #request = <T>(url: string, method: HttpMethod, body: any, option?: SdHttpOptions): Promise<T> => {
    const key = this.#generateKey(url, method, body, option);

    // Layer 2: Deduplication Cache (In-Flight Request / Short-term cache)
    const now = Date.now();
    const cachedItem = this.#inFlightRequests.get(key);

    // Nếu đã có request đang chạy hoặc mới chạy xong trong vòng 1s -> Trả về stream đó luôn
    if (cachedItem && cachedItem.expiry > now) {
      return lastValueFrom(cachedItem.stream$);
    }

    // Setup request mới
    const handler = this.#getHandler(url);
    const apiTimeout = option?.timeout ?? handler?.timeout ?? this.#defaultTimeout;

    // Tạo Observable call API
    const request$ = this.#httpClient
      .request(method, url, {
        body,
        headers: option?.headers,
        params: option?.params,
        observe: 'response', // Lấy full response để check status
        responseType: option?.responseType,
      })
      .pipe(
        timeout(apiTimeout),
        map(res => {
          // Normalize Response Logic
          const bodyRes = res.body as any;
          // Logic check response cũ của bạn
          if (bodyRes && typeof bodyRes === 'object' && 'ok' in bodyRes && !bodyRes.ok) {
            throw bodyRes; // Giả sử structure trả về { ok: false, ... } là lỗi
          }

          if (handler?.mapResponse) {
            return handler.mapResponse(bodyRes);
          }

          return bodyRes;
        }),
        catchError(err => {
          // Xóa cache ngay lập tức nếu lỗi để user có thể retry
          this.#inFlightRequests.delete(key);
          throw err;
        }),
        // QUAN TRỌNG: shareReplay(1) giúp share kết quả cho các subscriber đến sau (trong 1s)
        shareReplay(1)
      );

    // Lưu vào Map
    this.#inFlightRequests.set(key, {
      stream$: request$,
      expiry: now + this.#dedupCacheDuration,
    });

    // Chuyển đổi sang Promise cho đúng return type của bạn
    return lastValueFrom(request$);
  };

  // --- HELPERS ---

  #getHandler = (url: string): SdApiHandler | undefined => {
    const handlers = this.#configurations.flatMap(b => b?.handlers || []);
    return handlers.find(e => e.hosts.some(host => url.startsWith(host)));
  };

  #generateKey = (url: string, method: HttpMethod, body: any, option?: SdHttpOptions): string => {
    // FormData không hash được nội dung file, luôn generate key mới
    if (body instanceof FormData || option?.autoCache === false) {
      return Utilities.generateUuid();
    }
    return Utilities.hash({
      url,
      method,
      params: option?.params,
      headers: option?.headers,
      body,
    });
  };

  // Dọn dẹp memory leak
  #cleanupCache() {
    const now = Date.now();
    this.#inFlightRequests.forEach((value, key) => {
      if (value.expiry < now) {
        this.#inFlightRequests.delete(key);
      }
    });
  }
}
