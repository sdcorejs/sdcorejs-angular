import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

/** Meta tag the release build bakes into index.html; see scripts/build-published-page.mjs. */
const DOCS_BASE_META = 'sd-docs-base';

export const DOCS_BASE_URL = new InjectionToken<string>('DOCS_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const doc = inject(DOCUMENT);

    // why: the published site keeps ONE copy of published-docs at the site root
    // (/sdcorejs-angular/docs/) while each release SPA is served from its own folder
    // (/sdcorejs-angular/1.6/). Resolving docs against the app's base href asked for
    // /sdcorejs-angular/1.6/docs/... -> 404 -> "Published documentation could not be
    // loaded". The release build bakes the real docs root in; dev keeps docs/ next to
    // the app, so nothing changes when serving locally.
    const baked = doc.querySelector<HTMLMetaElement>(`meta[name="${DOCS_BASE_META}"]`)?.content?.trim();

    return new URL(baked || 'docs/', doc.baseURI).toString();
  },
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
