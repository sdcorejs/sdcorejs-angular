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
  subject: BehaviorSubject<T | undefined>;
  observer: Observable<T | undefined>;
}

export interface SdStorageWithDefault<T> extends Omit<SdStorage<T>, 'get' | 'subject' | 'observer'> {
  get: () => T;
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

export const SD_STORAGE_CONFIG = new InjectionToken<ISdStorageConfiguration>('storage.configuration');
