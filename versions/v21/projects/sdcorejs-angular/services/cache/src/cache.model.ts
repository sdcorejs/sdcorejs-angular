import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export interface SdCacheOption<T = any> {
  type?: 'memory' | 'session' | 'local';
  hours?: number;
  default?: T;
  args?: Record<string, any>;
}

export interface SdCache<T = any> {
  get: () => T;
  set: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  destroy: () => void;
  observer: Observable<T | undefined>;
  // Bổ sung hàm load
  load: (callback: () => Promise<T>) => Promise<T>;
}

export interface ISdCacheConfiguration {
  convertKey?: (key: string) => string;
  set?: (key: string, value: { data: any; createdOn: Date }, option?: SdCacheOption) => Promise<void>;
  get?: (key: string, option?: SdCacheOption) => Promise<{ data: any; createdOn: Date }>;
  remove?: (key: string, option?: SdCacheOption) => Promise<void>;
}

export const SD_CACHE_CONFIG = new InjectionToken<ISdCacheConfiguration>('sd-cache.configuration');
