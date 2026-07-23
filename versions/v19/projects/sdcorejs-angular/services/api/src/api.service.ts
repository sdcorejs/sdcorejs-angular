import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { SdCacheService } from '@sdcorejs/angular/services/cache';
import { BrowserUtilities, Utilities } from '@sdcorejs/utils/fns';
import { Observable, of, Subscription, throwError, timer, TimeoutError } from 'rxjs';
import { filter, map, retry, timeout } from 'rxjs/operators';
import {
  ISdApiConfiguration,
  SD_API_CONFIG,
  SdApiHandler,
  SdApiRetryOption,
  SdDeleteOption,
  SdGetOption,
  SdPatchOption,
  SdPostOption,
  SdPutOption,
} from './api.model';

type SdHttpOptions = SdGetOption & SdPostOption & SdPutOption & SdPatchOption & SdDeleteOption;
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type SharedRequestState = 'pending' | 'succeeded' | 'failed' | 'cancelled';

interface SharedRequest {
  readonly key?: string;
  readonly replayWindowMs: number;
  readonly promise: Promise<unknown>;
  resolve(value: unknown): void;
  reject(error: unknown): void;
  subscription: Subscription;
  owners: number;
  state: SharedRequestState;
  replayTimer?: ReturnType<typeof setTimeout>;
}

interface PreparedRequest {
  request: SharedRequest;
  source: Observable<unknown>;
}

/**
 * Response generics intentionally default to `unknown` for type safety.
 * Callers should specify `T`; migration guidance is tracked for Task 13.
 */
@Injectable({
  providedIn: 'root',
})
export class SdApiService {
  readonly #defaultTimeout = 60000;
  readonly #defaultDedupeWindowMs = 1000;
  readonly #maxTimerMs = 2_147_483_647;
  readonly #maxRetryAttempts = 10;
  readonly #httpClient = inject(HttpClient);
  readonly #configurations = inject<ISdApiConfiguration[]>(SD_API_CONFIG, { optional: true }) ?? [];
  readonly #cacheService = inject(SdCacheService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #sharedRequests = new Map<string, SharedRequest>();
  readonly #activeRequests = new Set<SharedRequest>();
  readonly #objectIds = new WeakMap<object, number>();
  #nextObjectId = 1;
  #destroyed = false;

  constructor() {
    this.#destroyRef.onDestroy(() => this.#destroy());
  }

  get http(): HttpClient {
    return this.#httpClient;
  }

  get = <T = unknown>(url: string, option?: SdGetOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'GET', undefined, option);
  };

  post = <T = unknown>(url: string, body?: unknown, option?: SdPostOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'POST', body, option);
  };

  put = <T = unknown>(url: string, body?: unknown, option?: SdPutOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'PUT', body, option);
  };

  patch = <T = unknown>(url: string, body?: unknown, option?: SdPatchOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'PATCH', body, option);
  };

  delete = <T = unknown>(url: string, option?: SdDeleteOption): Promise<T> => {
    return this.#executeWithLayeredCache<T>(url, 'DELETE', undefined, option);
  };

  upload = async <T = unknown>(url: string, option?: { extensions?: string[]; maxSizeInMb?: number }): Promise<T | null | undefined> => {
    const file = await BrowserUtilities.upload(option);
    if (!Array.isArray(file) && file) {
      return this.uploadFile<T>(url, file);
    }
    return undefined;
  };

  uploadFile = async <T = unknown>(url: string, file: File | null | undefined): Promise<T | null> => {
    if (!file) return null;
    if (file.name.lastIndexOf('.') === -1) throw new Error('Invalid file extension');

    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.post<T>(url, formData, { dedupe: false });
  };

  async #executeWithLayeredCache<T>(url: string, method: HttpMethod, body?: unknown, option?: SdHttpOptions): Promise<T> {
    if (this.#destroyed || option?.signal?.aborted) {
      throw this.#createAbortError();
    }

    if (!option?.cacheOption) {
      return this.#request<T>(url, method, body, option);
    }

    const key = this.#generateKey(url, method, body, option);
    const cache = this.#cacheService.create<T>(key, option.cacheOption);
    try {
      const cached = cache.snapshot();
      if (cached.present) return cached.value;

      const result = await this.#request<T>(url, method, body, option);
      cache.set(result);
      return result;
    } finally {
      cache.release();
    }
  }

  #request<T>(url: string, method: HttpMethod, body?: unknown, option?: SdHttpOptions): Promise<T> {
    if (this.#destroyed || option?.signal?.aborted) {
      return Promise.reject(this.#createAbortError());
    }

    const shouldDedupe = option?.dedupe ?? option?.autoCache ?? method === 'GET';
    const key = shouldDedupe ? this.#generateRequestKey(url, method, body, option) : undefined;
    let request = key ? this.#sharedRequests.get(key) : undefined;

    if (!request) {
      const prepared = this.#prepareRequest(url, method, body, option, key);
      request = prepared.request;
      if (key) this.#sharedRequests.set(key, request);
      this.#startRequest(request, prepared.source);
    }

    return this.#attachCaller<T>(request, option?.signal);
  }

  #prepareRequest(
    url: string,
    method: HttpMethod,
    body: unknown,
    option: SdHttpOptions | undefined,
    key: string | undefined
  ): PreparedRequest {
    let resolve!: (value: unknown) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<unknown>((resolvePromise, rejectPromise) => {
      resolve = resolvePromise;
      reject = rejectPromise;
    });
    const request: SharedRequest = {
      key,
      replayWindowMs: this.#normalizeDedupeWindow(option?.dedupeWindowMs),
      promise,
      resolve,
      reject,
      subscription: Subscription.EMPTY,
      owners: 0,
      state: 'pending',
    };
    this.#activeRequests.add(request);

    const handler = this.#getHandler(url);
    const httpRequest = new HttpRequest<unknown>(method, url, body ?? null, {
      headers: this.#toHttpHeaders(option?.headers),
      context: option?.context,
      params: this.#toHttpParams(option?.params),
      reportProgress: option?.reportProgress,
      responseType: option?.responseType ?? 'json',
      withCredentials: option?.withCredentials,
      transferCache: option?.transferCache,
    });
    const source = this.#withRetry(
      this.#httpClient.request(httpRequest).pipe(
        timeout(this.#resolveTimeout(url, option?.timeout)),
        filter((event): event is HttpResponse<unknown> => event instanceof HttpResponse),
        map(response => this.#mapResponse(response.body, handler))
      ),
      method,
      option?.retry
    );

    return { request, source };
  }

  #startRequest(request: SharedRequest, source: Observable<unknown>): void {
    request.subscription = source.subscribe({
      next: value => this.#completeSuccess(request, value),
      error: error => this.#completeError(request, error),
      complete: () => {
        if (request.state === 'pending') {
          this.#completeError(request, new Error('HTTP request completed without a response'));
        }
      },
    });
  }

  #attachCaller<T>(request: SharedRequest, signal?: AbortSignal): Promise<T> {
    request.owners++;

    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const cleanup = (): void => {
        if (signal) signal.removeEventListener('abort', abort);
      };
      const release = (): void => {
        request.owners = Math.max(0, request.owners - 1);
        if (request.state === 'pending' && request.owners === 0) {
          this.#cancelRequest(request);
        }
      };
      const abort = (): void => {
        if (settled) return;
        settled = true;
        cleanup();
        release();
        reject(this.#createAbortError());
      };

      if (signal) {
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) {
          abort();
          return;
        }
      }

      request.promise.then(
        value => {
          if (settled) return;
          settled = true;
          cleanup();
          release();
          resolve(value as T);
        },
        error => {
          if (settled) return;
          settled = true;
          cleanup();
          release();
          reject(error);
        }
      );
    });
  }

  #completeSuccess(request: SharedRequest, value: unknown): void {
    if (request.state !== 'pending') return;
    request.state = 'succeeded';
    request.resolve(value);

    if (!request.key) {
      this.#activeRequests.delete(request);
      return;
    }

    if (request.replayWindowMs === 0) {
      this.#evictRequest(request);
      return;
    }

    request.replayTimer = setTimeout(() => this.#evictRequest(request), request.replayWindowMs);
  }

  #completeError(request: SharedRequest, error: unknown): void {
    if (request.state !== 'pending') return;
    request.state = 'failed';
    this.#removeRequest(request);
    request.reject(error);
  }

  #cancelRequest(request: SharedRequest): void {
    if (request.state !== 'pending') return;
    request.state = 'cancelled';
    request.subscription.unsubscribe();
    this.#removeRequest(request);
    request.reject(this.#createAbortError());
  }

  #evictRequest(request: SharedRequest): void {
    if (request.replayTimer !== undefined) {
      clearTimeout(request.replayTimer);
      request.replayTimer = undefined;
    }
    this.#removeRequest(request);
  }

  #removeRequest(request: SharedRequest): void {
    if (request.key && this.#sharedRequests.get(request.key) === request) {
      this.#sharedRequests.delete(request.key);
    }
    this.#activeRequests.delete(request);
  }

  #withRetry(source: Observable<unknown>, method: HttpMethod, option?: SdApiRetryOption): Observable<unknown> {
    const attempts = this.#normalizeRetryAttempts(option?.attempts);
    const mutation = method !== 'GET';
    if (attempts === 0 || (mutation && option?.mutations !== true)) {
      return source;
    }

    return source.pipe(
      retry({
        count: attempts,
        delay: (error: unknown, attempt: number) => {
          if (this.#isAbortError(error) || !this.#shouldRetry(error, attempt, option)) {
            return throwError(() => error);
          }

          const baseDelay = this.#normalizeRetryDelay(option?.delayMs);
          const backoff = this.#normalizeRetryBackoff(option?.backoff);
          const computedDelay = baseDelay * Math.pow(backoff, attempt - 1);
          const delayMs = Number.isFinite(computedDelay) ? Math.min(this.#maxTimerMs, computedDelay) : this.#maxTimerMs;
          return delayMs > 0 ? timer(delayMs) : of(undefined);
        },
      })
    );
  }

  #shouldRetry(error: unknown, attempt: number, option: SdApiRetryOption | undefined): boolean {
    if (option?.retryWhen) {
      return option.retryWhen(error, attempt);
    }
    if (error instanceof TimeoutError) return true;
    if (!(error instanceof HttpErrorResponse)) return false;
    return error.status === 0 || [408, 425, 429, 500, 502, 503, 504].includes(error.status);
  }

  #mapResponse(body: unknown, handler: SdApiHandler | undefined): unknown {
    if (body !== null && typeof body === 'object' && 'ok' in body && body.ok === false) {
      throw body;
    }
    return handler?.mapResponse ? handler.mapResponse(body) : body;
  }

  #getHandler(url: string): SdApiHandler | undefined {
    const handlers = this.#configurations.flatMap(configuration => configuration.handlers ?? []);
    return handlers.find(handler => handler.hosts.some(host => url.startsWith(host)));
  }

  #generateKey(url: string, method: HttpMethod, body: unknown, option?: SdHttpOptions): string {
    return Utilities.hash({
      method,
      url,
      body: this.#normalizeBody(body),
      headers: this.#normalizeHeaders(option?.headers),
      params: this.#normalizeParams(option?.params),
      context: option?.context ? this.#getObjectId(option.context) : undefined,
      reportProgress: option?.reportProgress ?? false,
      responseType: option?.responseType ?? 'json',
      withCredentials: option?.withCredentials ?? false,
      transferCache: option?.transferCache,
      timeout: this.#resolveTimeout(url, option?.timeout),
      retry: option?.retry
        ? {
            attempts: this.#normalizeRetryAttempts(option.retry.attempts),
            delayMs: this.#normalizeRetryDelay(option.retry.delayMs),
            backoff: this.#normalizeRetryBackoff(option.retry.backoff),
            mutations: option.retry.mutations,
            retryWhen: option.retry.retryWhen ? this.#getObjectId(option.retry.retryWhen) : undefined,
          }
        : undefined,
    });
  }

  #generateRequestKey(url: string, method: HttpMethod, body: unknown, option?: SdHttpOptions): string {
    return Utilities.hash({
      responseKey: this.#generateKey(url, method, body, option),
      dedupeWindowMs: this.#normalizeDedupeWindow(option?.dedupeWindowMs),
    });
  }

  #normalizeDedupeWindow(dedupeWindowMs: number | undefined): number {
    return this.#normalizeFiniteNumber(dedupeWindowMs, this.#defaultDedupeWindowMs, 0, this.#maxTimerMs);
  }

  #resolveTimeout(url: string, timeoutMs: number | undefined): number {
    const configuredTimeout = timeoutMs === undefined ? this.#getHandler(url)?.timeout : timeoutMs;
    return this.#normalizeFiniteNumber(configuredTimeout, this.#defaultTimeout, 0, this.#maxTimerMs);
  }

  #normalizeRetryAttempts(attempts: number | undefined): number {
    return Math.floor(this.#normalizeFiniteNumber(attempts, 0, 0, this.#maxRetryAttempts));
  }

  #normalizeRetryDelay(delayMs: number | undefined): number {
    return this.#normalizeFiniteNumber(delayMs, 0, 0, this.#maxTimerMs);
  }

  #normalizeRetryBackoff(backoff: number | undefined): number {
    const normalized = this.#normalizeFiniteNumber(backoff, 1, 0, this.#maxTimerMs);
    return normalized > 0 ? normalized : 1;
  }

  #normalizeFiniteNumber(value: number | undefined, defaultValue: number, minimum: number, maximum: number): number {
    if (value === undefined || !Number.isFinite(value)) return defaultValue;
    return Math.min(maximum, Math.max(minimum, value));
  }

  #normalizeBody(body: unknown, ancestors = new WeakSet<object>()): unknown {
    if (body === null || typeof body !== 'object') return body;
    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
      return { urlSearchParams: body.toString() };
    }
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      return { objectType: 'FormData', objectId: this.#getObjectId(body) };
    }
    if (typeof Blob !== 'undefined' && body instanceof Blob) {
      return { objectType: 'Blob', objectId: this.#getObjectId(body) };
    }
    if (typeof ArrayBuffer !== 'undefined' && (body instanceof ArrayBuffer || ArrayBuffer.isView(body))) {
      return { objectType: 'ArrayBuffer', objectId: this.#getObjectId(body) };
    }
    if (body instanceof Date) {
      return { date: body.getTime() };
    }
    if (ancestors.has(body)) {
      return { circularObjectId: this.#getObjectId(body) };
    }
    if (Array.isArray(body)) {
      ancestors.add(body);
      const normalized = body.map(value => this.#normalizeBody(value, ancestors));
      ancestors.delete(body);
      return normalized;
    }
    const prototype = Object.getPrototypeOf(body);
    if (prototype === Object.prototype || prototype === null) {
      ancestors.add(body);
      const normalized = Object.fromEntries(Object.entries(body).map(([key, value]) => [key, this.#normalizeBody(value, ancestors)]));
      ancestors.delete(body);
      return normalized;
    }
    return { objectType: prototype?.constructor?.name ?? 'Object', objectId: this.#getObjectId(body) };
  }

  #normalizeHeaders(headers: SdHttpOptions['headers']): unknown {
    if (headers instanceof HttpHeaders) {
      return headers
        .keys()
        .sort()
        .map(key => [key.toLowerCase(), headers.getAll(key)]);
    }
    return headers;
  }

  #normalizeParams(params: SdHttpOptions['params']): unknown {
    if (params instanceof HttpParams) {
      return params
        .keys()
        .sort()
        .map(key => [key, params.getAll(key)]);
    }
    return params;
  }

  #toHttpHeaders(headers: SdHttpOptions['headers']): HttpHeaders | undefined {
    if (!headers || headers instanceof HttpHeaders) return headers;
    return new HttpHeaders(headers);
  }

  #toHttpParams(params: SdHttpOptions['params']): HttpParams | undefined {
    if (!params || params instanceof HttpParams) return params;
    return new HttpParams({ fromObject: params });
  }

  #getObjectId(value: object): number {
    const existing = this.#objectIds.get(value);
    if (existing !== undefined) return existing;
    const id = this.#nextObjectId++;
    this.#objectIds.set(value, id);
    return id;
  }

  #createAbortError(): Error {
    const error = new Error('The operation was aborted');
    error.name = 'AbortError';
    return error;
  }

  #isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }

  #destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;

    for (const request of [...this.#activeRequests]) {
      if (request.replayTimer !== undefined) {
        clearTimeout(request.replayTimer);
        request.replayTimer = undefined;
      }
      if (request.state === 'pending') {
        request.state = 'cancelled';
        request.subscription.unsubscribe();
        request.reject(this.#createAbortError());
      }
      this.#removeRequest(request);
    }
    this.#sharedRequests.clear();
    this.#activeRequests.clear();
  }
}
