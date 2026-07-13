import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router } from '@angular/router';
import { DocsVersionService } from './docs-version.service';
import { docsVersionGuard, legacyDocsRedirectGuard } from './docs-route.guards';

const CANONICAL_PAGE_CASES = [
  { category: 'guides', slug: 'introduction' },
  { category: 'components', slug: 'button' },
  { category: 'forms', slug: 'input' },
  { category: 'directives', slug: 'tooltip' },
  { category: 'services', slug: 'notify' },
  { category: 'modules-integrations', slug: 'keycloak' },
  { category: 'pipes-utilities', slug: 'empty' },
] as const;

const LEGACY_ALIAS_CASES = [
  {
    category: 'components',
    slug: 'form-generic',
    canonicalCategory: 'components',
    canonicalSlug: 'generic',
  },
  {
    category: 'modules-integrations',
    slug: 'generic',
    canonicalCategory: 'components',
    canonicalSlug: 'generic',
  },
  {
    category: 'components',
    slug: 'icon',
    canonicalCategory: 'modules-integrations',
    canonicalSlug: 'icon',
  },
  {
    category: 'components',
    slug: 'icon-configuration',
    canonicalCategory: 'modules-integrations',
    canonicalSlug: 'icon',
  },
] as const;

describe('documentation route guards', () => {
  let router: { createUrlTree: jasmine.Spy; parseUrl: jasmine.Spy };
  let versions: { load: jasmine.Spy; resolve: jasmine.Spy; selectedVersion: jasmine.Spy };

  async function runGuard(category: string, slug: string): Promise<unknown> {
    const route = { paramMap: convertToParamMap({ category, slug }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => legacyDocsRedirectGuard(route, {} as never));
  }

  async function runVersionGuard(version: string, url = `/v/${version}/components/button/examples`): Promise<unknown> {
    const route = { paramMap: convertToParamMap({ version }) } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() => docsVersionGuard(route, { url } as never));
  }

  beforeEach(() => {
    router = {
      createUrlTree: jasmine.createSpy().and.callFake((commands, extras) => ({ commands, extras })),
      parseUrl: jasmine.createSpy().and.callFake(url => ({ url })),
    };
    versions = {
      load: jasmine.createSpy().and.resolveTo({ latest: '21.1.2' }),
      resolve: jasmine.createSpy().and.callFake(async (version: string) => (version === 'latest' ? '21.1.2' : version)),
      selectedVersion: jasmine.createSpy().and.returnValue(null),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: DocsVersionService, useValue: versions },
      ],
    });
  });

  for (const page of CANONICAL_PAGE_CASES) {
    it(`redirects a ${page.category} legacy page to its versioned overview route`, async () => {
      const result = await runGuard(page.category, page.slug);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/v', '21.1.2', page.category, page.slug, 'overview']);
      expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
    });
  }

  for (const page of LEGACY_ALIAS_CASES) {
    it(`canonicalizes the legacy alias ${page.category}/${page.slug}`, async () => {
      const result = await runGuard(page.category, page.slug);

      expect(router.createUrlTree).toHaveBeenCalledWith(['/v', '21.1.2', page.canonicalCategory, page.canonicalSlug, 'overview']);
      expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
    });
  }

  it('sends an invalid legacy slug to the documentation not-found page', async () => {
    const result = await runGuard('components', 'missing');

    expect(router.createUrlTree).toHaveBeenCalledWith(['/not-found'], { queryParams: { path: 'components/missing' } });
    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
    expect(versions.load).not.toHaveBeenCalled();
  });

  it('redirects to a recoverable latest route when the version manifest is offline', async () => {
    versions.load.and.rejectWith(new Error('offline'));
    const result = await runGuard('components', 'button');

    expect(router.createUrlTree).toHaveBeenCalledWith(['/v', 'latest', 'components', 'button', 'overview']);
    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
  });

  it('allows an existing concrete documentation version', async () => {
    expect(await runVersionGuard('21.1.2')).toBeTrue();
    expect(versions.resolve).toHaveBeenCalledWith('21.1.2');
    expect(router.parseUrl).not.toHaveBeenCalled();
  });

  it('canonicalizes latest and invalid versions while preserving the deep route', async () => {
    const result = await runVersionGuard('latest', '/v/latest/forms/input/api?mode=full#inputs');

    expect(router.parseUrl).toHaveBeenCalledWith('/v/21.1.2/forms/input/api?mode=full#inputs');
    expect(result).toBe(router.parseUrl.calls.mostRecent().returnValue);
  });

  it('keeps the requested route usable while version metadata is offline', async () => {
    versions.resolve.and.rejectWith(new Error('offline'));

    expect(await runVersionGuard('latest')).toBeTrue();
    expect(router.parseUrl).not.toHaveBeenCalled();
  });
});
