import { InjectionToken } from '@angular/core';

export interface ISdFirebaseConfiguration {
  functionUrl: string;
  project: string;
  env: string;
  folder?: string | (() => string);
}

export const SD_FIREBASE_CONFIG = new InjectionToken<ISdFirebaseConfiguration>('sd.firebase.configuration');
