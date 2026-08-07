import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { DOCS_BASE_URL } from './docs.tokens';

/**
 * The published site keeps ONE copy of published-docs at the site root
 * (`/sdcorejs-angular/docs/`) while each release SPA is served from its own
 * sub-directory (`/sdcorejs-angular/1.6/`). Resolving the docs relative to the
 * app's base href therefore asked for `/sdcorejs-angular/1.6/docs/…` and got a
 * 404, which surfaced as "Published documentation could not be loaded".
 * The release build bakes the real docs root into a meta tag.
 */
describe('DOCS_BASE_URL', () => {
  function configure(html: string, baseURI: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    Object.defineProperty(doc, 'baseURI', { value: baseURI });
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: doc }] });
    return TestBed.inject(DOCS_BASE_URL);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('uses the baked docs root when the release build provides one', () => {
    const base = configure(
      '<head><meta name="sd-docs-base" content="/sdcorejs-angular/docs/"></head>',
      'https://sdcorejs.github.io/sdcorejs-angular/1.6/',
    );

    expect(base).toBe('https://sdcorejs.github.io/sdcorejs-angular/docs/');
  });

  it('falls back to docs/ next to the app when nothing is baked in (dev server)', () => {
    const base = configure('<head></head>', 'http://localhost:4200/');

    expect(base).toBe('http://localhost:4200/docs/');
  });

  it('ignores an empty meta tag rather than resolving to the app root', () => {
    const base = configure('<head><meta name="sd-docs-base" content="  "></head>', 'http://localhost:4200/');

    expect(base).toBe('http://localhost:4200/docs/');
  });

  it('accepts a relative baked value', () => {
    const base = configure(
      '<head><meta name="sd-docs-base" content="../docs/"></head>',
      'https://sdcorejs.github.io/sdcorejs-angular/1.6/',
    );

    expect(base).toBe('https://sdcorejs.github.io/sdcorejs-angular/docs/');
  });
});
