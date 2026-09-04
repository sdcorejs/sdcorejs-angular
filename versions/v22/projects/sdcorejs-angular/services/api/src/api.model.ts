import { HttpContext, HttpErrorResponse, HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { SdCacheOption } from '@sdcorejs/angular/services/cache';

export type SdApiResponseType = 'arraybuffer' | 'blob' | 'json' | 'text';
type SdApiBivariantCallback<TArgument, TResult> = { bivarianceHack(argument: TArgument): TResult }['bivarianceHack'];

export interface SdApiHttpOption {
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  params?: HttpParams | Record<string, string | number | boolean | readonly (string | number | boolean)[]>;
  observe?: 'body';
  reportProgress?: boolean;
  responseType?: SdApiResponseType;
  withCredentials?: boolean;
  transferCache?: { includeHeaders?: string[] } | boolean;
}

export interface SdApiRetryOption {
  /** Number of retries after the initial request. Values are clamped to a finite safe limit. */
  attempts: number;
  /** Delay before the first retry. Defaults to 0. */
  delayMs?: number;
  /** Multiplier applied to each subsequent delay. Defaults to 1. */
  backoff?: number;
  /** Overrides the default transient HTTP-status predicate. `attempt` is one-based. */
  retryWhen?: (error: unknown, attempt: number) => boolean;
  /** Required to retry POST, PUT, PATCH, or DELETE. */
  mutations?: boolean;
}

export interface SdApiOption {
  cacheOption?: SdCacheOption;
  timeout?: number; // Default: 60000 (60s)
  /** Cancels only this caller; a shared HTTP request continues while another caller remains. */
  signal?: AbortSignal;
  /** Enables request deduplication. Defaults to true for GET and false for mutations. */
  dedupe?: boolean;
  /** Keeps a successful dedupe result replayable for this duration. Defaults to 1000ms. */
  dedupeWindowMs?: number;
  /** Opt-in bounded retry policy. The default is no retries. */
  retry?: SdApiRetryOption;
  /**
   * @deprecated Use `dedupe`. When both are provided, `dedupe` takes precedence.
   * Explicit `true` remains a compatibility opt-in for mutation deduplication.
   */
  autoCache?: boolean;
}

export type SdGetOption = SdApiHttpOption & SdApiOption;
export type SdPostOption = SdApiHttpOption & SdApiOption;
export type SdPutOption = SdApiHttpOption & SdApiOption;
export type SdPatchOption = SdApiHttpOption & SdApiOption;
export type SdDeleteOption = SdApiHttpOption & SdApiOption;
export type SdApiRequestUpdate = Parameters<HttpRequest<unknown>['clone']>[0];

export interface SdApiHandler {
  /** Danh sách host URL mà handler này sẽ xử lý */
  hosts: string[];
  /** Can thiệp request: gắn header, token, transform body... */
  intercept?: SdApiBivariantCallback<HttpRequest<unknown>, HttpRequest<unknown> | SdApiRequestUpdate>;
  /** Hook chạy TRƯỚC khi gửi request (dùng để log, tracking...) */
  beforeRemote?: SdApiBivariantCallback<HttpRequest<unknown>, void | Promise<void>>;
  /** Hook chạy SAU khi nhận response (xử lý lỗi, notify...) */
  afterRemote?: SdApiBivariantCallback<HttpResponse<unknown> | HttpErrorResponse | Error, void | Promise<void>>;
  /** Transform response body thành kiểu dữ liệu mong muốn */
  mapResponse?: SdApiBivariantCallback<unknown, unknown>;
  /** Timeout tính bằng milliseconds. Mặc định: 60000 (60 giây) */
  timeout?: number;
}

export interface ISdApiConfiguration {
  handlers?: SdApiHandler[];
}

export const SD_API_CONFIG = new InjectionToken<ISdApiConfiguration>('sd-api.configuration');

/** @deprecated Use `SD_API_CONFIG`. This is the same injection token. */
export const SD_API_CONFIGURATION = SD_API_CONFIG;

/**
 * Lỗi nghiệp vụ: HTTP 200 nhưng body envelope báo thất bại (`{ ok: false, ... }`).
 *
 * why: trước đây `SdApiService` `throw body` — một plain object. Hệ quả: `error instanceof Error`
 * là `false`, `error.message` là `undefined`, nên mọi `catch` của consumer và predicate
 * `retry.retryWhen` đều bỏ sót nhánh này. Bọc vào một Error thật để envelope lỗi đi chung
 * đường với lỗi HTTP; body gốc vẫn giữ nguyên ở `.body`.
 */
export class SdApiError<TBody = unknown> extends Error {
  override readonly name = 'SdApiError';

  /** Body nguyên bản của response (đúng object server trả về). */
  readonly body: TBody;

  constructor(body: TBody, message?: string) {
    super(message ?? readSdApiEnvelopeMessage(body));
    this.body = body;
  }
}

/** Lấy `message` từ envelope nếu server có gửi, để `error.message` nói được điều gì đó hữu ích. */
function readSdApiEnvelopeMessage(body: unknown): string {
  if (body !== null && typeof body === 'object' && 'message' in body && typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  return 'The API response envelope reported ok: false';
}
