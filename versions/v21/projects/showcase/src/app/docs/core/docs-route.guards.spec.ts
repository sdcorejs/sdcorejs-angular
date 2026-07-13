import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router } from '@angular/router';
import { DocsVersionService } from './docs-version.service';
import { legacyDocsRedirectGuard } from './docs-route.guards';

describe('documentation route guards', () => {
  let router: { createUrlTree: jasmine.Spy };
  let versions: { load: jasmine.Spy; selectedVersion: jasmine.Spy };

  beforeEach(() => {
    router = { createUrlTree: jasmine.createSpy().and.callFake((commands, extras) => ({ commands, extras })) };
    versions = {
      load: jasmine.createSpy().and.resolveTo({ latest: '21.1.2' }),
      selectedVersion: jasmine.createSpy().and.returnValue(null),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: DocsVersionService, useValue: versions },
      ],
    });
  });

  it('redirects a valid legacy page to the versioned overview route', async () => {
    const route = { paramMap: convertToParamMap({ category: 'components', slug: 'button' }) } as ActivatedRouteSnapshot;
    const result = await TestBed.runInInjectionContext(() => legacyDocsRedirectGuard(route, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/v', '21.1.2', 'components', 'button', 'overview']);
    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
  });

  it('sends an invalid legacy slug to the documentation not-found page', async () => {
    const route = { paramMap: convertToParamMap({ category: 'components', slug: 'missing' }) } as ActivatedRouteSnapshot;
    const result = await TestBed.runInInjectionContext(() => legacyDocsRedirectGuard(route, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/not-found'],
      { queryParams: { path: 'components/missing' } },
    );
    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
    expect(versions.load).not.toHaveBeenCalled();
  });

  it('redirects to a recoverable latest route when the version manifest is offline', async () => {
    versions.load.and.rejectWith(new Error('offline'));
    const route = { paramMap: convertToParamMap({ category: 'components', slug: 'button' }) } as ActivatedRouteSnapshot;
    const result = await TestBed.runInInjectionContext(() => legacyDocsRedirectGuard(route, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/v', 'latest', 'components', 'button', 'overview']);
    expect(result).toBe(router.createUrlTree.calls.mostRecent().returnValue);
  });
});
