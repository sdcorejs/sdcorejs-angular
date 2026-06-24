import { HttpClient, HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { SdCacheOption } from '@sdcorejs/angular/services/cache';
// import hash from 'object-hash';

export interface SdApiOption {
  cacheOption?: SdCacheOption;
  timeout?: number; // Default: 30000 (30s)
  autoCache?: boolean; // Default: true
}
type HttpGetOption = Parameters<HttpClient['get']>[1];
export type SdGetOption = HttpGetOption & SdApiOption;

type HttpPostOption = Parameters<HttpClient['post']>[2];
export type SdPostOption = HttpPostOption & SdApiOption;

type HttpPutOption = Parameters<HttpClient['put']>[2];
export type SdPutOption = HttpPutOption & SdApiOption;

type HttpDeleteOption = Parameters<HttpClient['delete']>[1];
export type SdDeleteOption = HttpDeleteOption & SdApiOption;

export interface SdApiHandler {
  /** Danh sách host URL mà handler này sẽ xử lý */
  hosts: string[];
  /** Can thiệp request: gắn header, token, transform body... */
  intercept?: (request: HttpRequest<any>) => HttpRequest<any>;
  /** Hook chạy TRƯỚC khi gửi request (dùng để log, tracking...) */
  beforeRemote?: (request: HttpRequest<any>) => void | Promise<void>;
  /** Hook chạy SAU khi nhận response (xử lý lỗi, notify...) */
  afterRemote?: (response: HttpResponse<any> | HttpErrorResponse | Error) => void | Promise<void>;
  /** Transform response body thành kiểu dữ liệu mong muốn */
  mapResponse?: <Tres = any, Tdata = any>(response: Tres) => Tdata;
  /** Timeout tính bằng milliseconds. Mặc định: 30000 (30 giây) */
  timeout?: number;
}

export interface ISdApiConfiguration {
  handlers: SdApiHandler[];
}

export const SD_API_CONFIG = new InjectionToken<ISdApiConfiguration>('sd-api.configuration');

export const SD_API_CONFIGURATION = new InjectionToken<ISdApiConfiguration>('sd-api.configuration');
