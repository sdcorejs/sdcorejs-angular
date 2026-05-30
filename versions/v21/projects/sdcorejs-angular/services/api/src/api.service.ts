/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { SdCacheService } from '@sdcorejs/angular/services/cache';
import { BrowserUtilities, Utilities } from '@sdcorejs/utils/fns';
import { lastValueFrom, Observable } from 'rxjs';
import { catchError, map, shareReplay, timeout } from 'rxjs/operators';
import { v4 } from 'uuid';
import { ISdApiConfiguration, SD_API_CONFIG, SdApiHandler, SdDeleteOption, SdGetOption, SdPostOption, SdPutOption } from './api.model';

// Gom nhÃ³m cÃ¡c Option láº¡i cho gá»n
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

  // Thay Ä‘á»•i cáº¥u trÃºc Cache: LÆ°u Observable thay vÃ¬ Subject phá»©c táº¡p
  // Key: hash string -> Value: { stream$: Observable, expiry: number }
  #inFlightRequests: Map<string, { stream$: Observable<any>; expiry: number }> = new Map();

  constructor() {
    // Optional: CÆ¡ cháº¿ dá»n dáº¹p cache Ä‘á»‹nh ká»³ (má»—i 1 phÃºt dá»n dáº¹p cÃ¡c key háº¿t háº¡n)
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

  // Upload file logic giá»¯ nguyÃªn nhÆ°ng refactor nháº¹
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
    // Upload thÆ°á»ng khÃ´ng cáº§n deduplication cache, set autoCache: false
    return await this.post(url, formData, { autoCache: false });
  };

  // --- PRIVATE CORE LOGIC ---

  /**
   * HÃ m trung gian xá»­ lÃ½ Layer Cache (SdCacheService) trÆ°á»›c khi gá»i API thá»±c táº¿
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

    // KhÃ´ng cÃ³ cache dÃ i háº¡n thÃ¬ gá»i trá»±c tiáº¿p logic deduplication
    return this.#request<T>(url, method, body, option);
  };

  /**
   * Core Request: Xá»­ lÃ½ Deduplication, Timeout, Mapping Response
   */
  #request = <T>(url: string, method: HttpMethod, body: any, option?: SdHttpOptions): Promise<T> => {
    const key = this.#generateKey(url, method, body, option);

    // Layer 2: Deduplication Cache (In-Flight Request / Short-term cache)
    const now = Date.now();
    const cachedItem = this.#inFlightRequests.get(key);

    // Náº¿u Ä‘Ã£ cÃ³ request Ä‘ang cháº¡y hoáº·c má»›i cháº¡y xong trong vÃ²ng 1s -> Tráº£ vá» stream Ä‘Ã³ luÃ´n
    if (cachedItem && cachedItem.expiry > now) {
      return lastValueFrom(cachedItem.stream$);
    }

    // Setup request má»›i
    const handler = this.#getHandler(url);
    const apiTimeout = option?.timeout ?? handler?.timeout ?? this.#defaultTimeout;

    // Táº¡o Observable call API
    const request$ = this.#httpClient
      .request(method, url, {
        body,
        headers: option?.headers,
        params: option?.params,
        observe: 'response', // Láº¥y full response Ä‘á»ƒ check status
        responseType: option?.responseType,
      })
      .pipe(
        timeout(apiTimeout),
        map(res => {
          // Normalize Response Logic
          const bodyRes = res.body as any;
          // Logic check response cÅ© cá»§a báº¡n
          if (bodyRes && typeof bodyRes === 'object' && 'ok' in bodyRes && !bodyRes.ok) {
            throw bodyRes; // Giáº£ sá»­ structure tráº£ vá» { ok: false, ... } lÃ  lá»—i
          }

          if (handler?.mapResponse) {
            return handler.mapResponse(bodyRes);
          }

          return bodyRes;
        }),
        catchError(err => {
          // XÃ³a cache ngay láº­p tá»©c náº¿u lá»—i Ä‘á»ƒ user cÃ³ thá»ƒ retry
          this.#inFlightRequests.delete(key);
          throw err;
        }),
        // QUAN TRá»ŒNG: shareReplay(1) giÃºp share káº¿t quáº£ cho cÃ¡c subscriber Ä‘áº¿n sau (trong 1s)
        shareReplay(1)
      );

    // LÆ°u vÃ o Map
    this.#inFlightRequests.set(key, {
      stream$: request$,
      expiry: now + this.#dedupCacheDuration,
    });

    // Chuyá»ƒn Ä‘á»•i sang Promise cho Ä‘Ãºng return type cá»§a báº¡n
    return lastValueFrom(request$);
  };

  // --- HELPERS ---

  #getHandler = (url: string): SdApiHandler | undefined => {
    const handlers = this.#configurations.flatMap(b => b?.handlers || []);
    return handlers.find(e => e.hosts.some(host => url.startsWith(host)));
  };

  #generateKey = (url: string, method: HttpMethod, body: any, option?: SdHttpOptions): string => {
    // FormData khÃ´ng hash Ä‘Æ°á»£c ná»™i dung file, luÃ´n generate key má»›i
    if (body instanceof FormData || option?.autoCache === false) {
      return v4();
    }
    return Utilities.hash({
      url,
      method,
      params: option?.params,
      headers: option?.headers,
      body,
    });
  };

  // Dá»n dáº¹p memory leak
  #cleanupCache() {
    const now = Date.now();
    this.#inFlightRequests.forEach((value, key) => {
      if (value.expiry < now) {
        this.#inFlightRequests.delete(key);
      }
    });
  }
}

