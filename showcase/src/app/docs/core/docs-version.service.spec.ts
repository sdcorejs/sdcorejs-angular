import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DOCS_BASE_URL, DOCS_STORAGE } from './docs.tokens';
import { DocsVersionService } from './docs-version.service';
import { DocsVersionsManifest } from './published-docs.models';

const manifest: DocsVersionsManifest = {
  package: '@sdcorejs/angular',
  latest: '21.1.2',
  baseUrl: 'ignored',
  versions: [
    { version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
    { version: '21.1.1', index: 'ignored', released: '2026-07-10', count: 85 },
    { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
    { version: '20.1.1', index: 'ignored', released: '2026-07-10', count: 85 },
    { version: '19.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
    { version: '19.1.1', index: 'ignored', released: '2026-07-10', count: 85 },
  ],
};

describe('DocsVersionService', () => {
  let service: DocsVersionService;
  let http: HttpTestingController;
  let storage: jasmine.SpyObj<Storage>;
  let router: { url: string; navigateByUrl: jasmine.Spy };

  beforeEach(() => {
    storage = jasmine.createSpyObj<Storage>('Storage', ['getItem', 'setItem', 'removeItem']);
    router = { url: '/v/21.1.2/components/button/api', navigateByUrl: jasmine.createSpy().and.resolveTo(true) };
    TestBed.configureTestingModule({
      providers: [
        DocsVersionService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DOCS_BASE_URL, useValue: 'https://example.test/app/docs/' },
        { provide: DOCS_STORAGE, useValue: storage },
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(DocsVersionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads versions from the configured base URL and exposes semantic groups', async () => {
    const expandedManifest: DocsVersionsManifest = {
      ...manifest,
      latest: '21.1.4',
      versions: [
        { version: '21.1.4', index: 'ignored', released: '2026-07-20', count: 97 },
        { version: '20.1.4', index: 'ignored', released: '2026-07-20', count: 97 },
        { version: '19.1.4', index: 'ignored', released: '2026-07-20', count: 97 },
        ...manifest.versions,
      ],
    };
    const pending = service.load();
    http.expectOne('https://example.test/app/docs/versions.json').flush(expandedManifest);

    await pending;

    expect(service.latestVersion()).toBe('21.1.4');
    expect(service.versionGroups().map(group => group.label)).toEqual(['21.x', '20.x', '19.x']);
    expect(service.versionGroups().flatMap(group => group.versions.map(entry => entry.version))).toEqual([
      '21.1.4',
      '21.1.2',
      '20.1.4',
      '20.1.2',
      '19.1.4',
      '19.1.2',
    ]);
  });

  it('upgrades a stored pre-showcase version to the first showcase release of the same Angular major', async () => {
    storage.getItem.and.returnValue('20.1.1');
    const pending = service.load();
    http.expectOne('https://example.test/app/docs/versions.json').flush(manifest);

    await pending;

    expect(service.selectedVersion()).toBe('20.1.2');
  });

  it('falls back to latest for an invalid route version and exposes a notice', async () => {
    const pending = service.resolve('99.0.0');
    http.expectOne('https://example.test/app/docs/versions.json').flush(manifest);

    expect(await pending).toBe('21.1.2');
    expect(service.invalidVersion()).toBe('99.0.0');
  });

  it('keeps the invalid-version notice through the canonical redirect resolution', async () => {
    const pending = service.resolve('99.0.0');
    http.expectOne('https://example.test/app/docs/versions.json').flush(manifest);
    await pending;

    await service.resolve('21.1.2');

    expect(service.invalidVersion()).toBe('99.0.0');

    await service.resolve('21.1.2');
    expect(service.invalidVersion()).toBeNull();
  });

  it('persists selection and preserves the current documentation route', async () => {
    const pending = service.select('20.1.2');
    http.expectOne('https://example.test/app/docs/versions.json').flush(manifest);
    await pending;

    expect(storage.setItem).toHaveBeenCalledWith('sdcorejs.docs.version', '20.1.2');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/v/20.1.2/components/button/api');
  });

  it('continues version navigation when browser storage throws', async () => {
    storage.setItem.and.throwError('Storage blocked');
    const pending = service.select('20.1.2');
    http.expectOne('https://example.test/app/docs/versions.json').flush(manifest);
    await pending;

    expect(router.navigateByUrl).toHaveBeenCalledWith('/v/20.1.2/components/button/api');
  });
});
