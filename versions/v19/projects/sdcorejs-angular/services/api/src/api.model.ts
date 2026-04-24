/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient, HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { SdCacheOption } from '@sdcorejs/angular/services/cache';
import { SdUtilities } from '@sdcorejs/angular/utilities';
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
  /** Danh sÃ¡ch host URL mÃ  handler nÃ y sáº½ xá»­ lÃ½ */
  hosts: string[];
  /** Can thiá»‡p request: gáº¯n header, token, transform body... */
  intercept?: (request: HttpRequest<any>) => HttpRequest<any>;
  /** Hook cháº¡y TRÆ¯á»šC khi gá»­i request (dÃ¹ng Ä‘á»ƒ log, tracking...) */
  beforeRemote?: (request: HttpRequest<any>) => void | Promise<void>;
  /** Hook cháº¡y SAU khi nháº­n response (xá»­ lÃ½ lá»—i, notify...) */
  afterRemote?: (
    response: HttpResponse<any> | HttpErrorResponse | Error
  ) => void | Promise<void>;
  /** Transform response body thÃ nh kiá»ƒu dá»¯ liá»‡u mong muá»‘n */
  mapResponse?: <Tres = any, Tdata = any>(response: Tres) => Tdata;
  /** Timeout tÃ­nh báº±ng milliseconds. Máº·c Ä‘á»‹nh: 30000 (30 giÃ¢y) */
  timeout?: number;
}

export interface ISdApiConfiguration {
  handlers: SdApiHandler[];
}

export const SD_API_CONFIG = new InjectionToken<ISdApiConfiguration>('sd-api.configuration');

