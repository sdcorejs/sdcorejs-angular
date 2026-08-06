import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

export const DOCS_BASE_URL = new InjectionToken<string>('DOCS_BASE_URL', {
  providedIn: 'root',
  factory: () => new URL('docs/', inject(DOCUMENT).baseURI).toString(),
});

export const DOCS_STORAGE = new InjectionToken<Storage | null>('DOCS_STORAGE', {
  providedIn: 'root',
  factory: () => {
    try {
      return inject(DOCUMENT).defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  },
});
