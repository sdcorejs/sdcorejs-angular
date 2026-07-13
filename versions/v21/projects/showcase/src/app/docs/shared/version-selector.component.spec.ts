import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DOCS_BASE_URL, DOCS_STORAGE } from '../core/docs.tokens';
import { DocsVersionService } from '../core/docs-version.service';
import { VersionSelectorComponent } from './version-selector.component';

describe('VersionSelectorComponent', () => {
  let fixture: ComponentFixture<VersionSelectorComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersionSelectorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DOCS_BASE_URL, useValue: 'https://example.test/app/docs/' },
        { provide: DOCS_STORAGE, useValue: null },
        { provide: Router, useValue: { url: '/', navigateByUrl: jasmine.createSpy().and.resolveTo(true) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(VersionSelectorComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('groups runtime versions by Angular major', async () => {
    const pending = TestBed.inject(DocsVersionService).load();
    http.expectOne('https://example.test/app/docs/versions.json').flush({
      package: '@sdcorejs/angular',
      latest: '21.1.2',
      baseUrl: 'ignored',
      versions: [
        { version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
      ],
    });
    await pending;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('optgroup').length).toBe(2);
  });

  it('handles a missing versions manifest and offers an inline retry', async () => {
    const pending = TestBed.inject(DocsVersionService).load().catch(() => undefined);
    http.expectOne('https://example.test/app/docs/versions.json').flush('Not found', {
      status: 404,
      statusText: 'Not Found',
    });
    await pending;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Retry versions');

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    const retry = TestBed.inject(DocsVersionService).load();
    http.expectOne('https://example.test/app/docs/versions.json').flush({
      package: '@sdcorejs/angular',
      latest: '21.1.2',
      baseUrl: 'ignored',
      versions: [{ version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 }],
    });
    await retry;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select')).not.toBeNull();
  });
});
