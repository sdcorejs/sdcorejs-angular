import { InjectionToken } from '@angular/core';
import { SdPersistenceIdentityCanonicalizer, SdPersistenceSerializer } from '@sdcorejs/angular/services/persistence';
import { Observable } from 'rxjs';

export interface SdCacheOption<T = unknown> {
  type?: 'memory' | 'session' | 'local';
  hours?: number;
  ttlMs?: number;
  default?: T;
  args?: Readonly<Record<string, unknown>>;
  namespace?: string;
  version?: string | number;
  serializer?: SdPersistenceSerializer;
  identityCanonicalizer?: SdPersistenceIdentityCanonicalizer;
}

export interface SdCache<T = unknown> {
  get: () => T | undefined;
  snapshot: () => SdCacheSnapshot<T>;
  set: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  /** Releases only this facade while preserving its backing cache entry. */
  release: () => void;
  destroy: () => void;
  observer: Observable<T | undefined>;
  load: (callback: () => Promise<T>) => Promise<T>;
}

export type SdCacheSnapshot<T> = { present: false } | { present: true; value: T };

export interface SdCacheWithDefault<T> extends Omit<SdCache<T>, 'get' | 'observer'> {
  get: () => T;
  observer: Observable<T>;
}

export interface SdCacheStoredValue<T = unknown> {
  data: T;
  createdOn: Date;
}

export type SdCacheSetCallback = (key: string, value: SdCacheStoredValue<unknown>, option?: SdCacheOption<unknown>) => Promise<void> | void;

export type SdCacheGetCallback = (key: string, option?: SdCacheOption<unknown>) => Promise<SdCacheStoredValue<unknown> | undefined>;

export type SdCacheRemoveCallback = (key: string, option?: SdCacheOption<unknown>) => Promise<void> | void;

export interface ISdCacheConfiguration {
  convertKey?: (key: string) => string;
  namespace?: string;
  version?: string | number;
  serializer?: SdPersistenceSerializer;
  identityCanonicalizer?: SdPersistenceIdentityCanonicalizer;
  set?: SdCacheSetCallback;
  get?: SdCacheGetCallback;
  remove?: SdCacheRemoveCallback;
}

export const SD_CACHE_CONFIG = new InjectionToken<ISdCacheConfiguration>('sd-cache.configuration');

export interface SdLegacyCacheCallbacks<T> {
  matches: (key: string, option?: SdCacheOption<unknown>) => boolean;
  isValue: (value: unknown) => value is T;
  set?: (key: string, value: SdCacheStoredValue<T>, option?: SdCacheOption<unknown>) => Promise<void> | void;
  get?: (key: string, option?: SdCacheOption<unknown>) => Promise<SdCacheStoredValue<T> | undefined>;
  remove?: (key: string, option?: SdCacheOption<unknown>) => Promise<void> | void;
}

/** @deprecated Prefer globally safe unknown callbacks on `ISdCacheConfiguration`. */
export function adaptLegacySdCacheCallbacks<T>(callbacks: SdLegacyCacheCallbacks<T>): ISdCacheConfiguration {
  return {
    set: callbacks.set
      ? (key, value, option) => {
          if (!callbacks.matches(key, option)) return;
          if (!callbacks.isValue(value.data)) throw new TypeError(`Legacy cache value did not match key ${key}`);
          return callbacks.set?.(key, { data: value.data, createdOn: new Date(value.createdOn) }, option);
        }
      : undefined,
    get: callbacks.get
      ? async (key, option) => {
          if (!callbacks.matches(key, option)) return undefined;
          const value = await callbacks.get?.(key, option);
          if (!value) return undefined;
          if (!callbacks.isValue(value.data)) throw new TypeError(`Legacy cache value did not match key ${key}`);
          return { data: value.data, createdOn: new Date(value.createdOn) };
        }
      : undefined,
    remove: callbacks.remove
      ? (key, option) => {
          if (!callbacks.matches(key, option)) return;
          return callbacks.remove?.(key, option);
        }
      : undefined,
  };
}
