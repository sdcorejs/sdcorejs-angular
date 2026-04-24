import { InjectionToken } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SdStorageOption<T = any> {
  type?: 'session';
  default?: T;
  args?: Record<string, any>;
}

export interface SdStorage<T = any> {
  get: () => T;
  set: (data: T) => void;
  has: () => boolean;
  remove: () => void;
  subject: BehaviorSubject<T>;
  observer: Observable<T>;
}

export interface ISdStorageConfiguration {
  key?: (key: string) => string;
}

export const SD_STORAGE_CONFIG = new InjectionToken<ISdStorageConfiguration>('storage.configuration');
