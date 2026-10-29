import { InjectionToken } from '@angular/core';
import { SdPersistenceIdentityCanonicalizer, SdPersistenceSerializer } from '@sdcorejs/angular/services/persistence';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SdStorageOption<T = unknown> {
  type?: 'local' | 'session';
  default?: T;
  args?: Readonly<Record<string, unknown>>;
  namespace?: string;
  version?: string | number;
  serializer?: SdPersistenceSerializer;
  identityCanonicalizer?: SdPersistenceIdentityCanonicalizer;
}

export interface SdStorage<T = unknown> {
  get: () => T | undefined;
  set: (data: T) => void;
  setSilent: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  destroy: () => void;
  /**
   * Re-reads the persisted value, bypassing the in-memory entry shared by every live handle of the key.
   * Notifies subscribers only when the value changed and returns the value from that same read.
   */
  refresh: () => T | undefined;
  subject: BehaviorSubject<T | undefined>;
  observer: Observable<T | undefined>;
}

export interface SdStorageWithDefault<T> extends Omit<SdStorage<T>, 'get' | 'refresh' | 'subject' | 'observer'> {
  get: () => T;
  /** Same as `SdStorage.refresh()`, returning the default when nothing is stored. */
  refresh: () => T;
  subject: BehaviorSubject<T>;
  observer: Observable<T>;
}

export interface ISdStorageConfiguration {
  key?: (key: string) => string;
  namespace?: string;
  version?: string | number;
  serializer?: SdPersistenceSerializer;
  identityCanonicalizer?: SdPersistenceIdentityCanonicalizer;
}

export const SD_STORAGE_CONFIGURATION = new InjectionToken<ISdStorageConfiguration>('storage.configuration');

/** @deprecated Use `SD_STORAGE_CONFIGURATION`. This is the same injection token. */
export const SD_STORAGE_CONFIG = SD_STORAGE_CONFIGURATION;
