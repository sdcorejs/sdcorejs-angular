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
  let navigateByUrl: jasmine.Spy;
  let storage: jasmine.SpyObj<Storage>;

  beforeEach(async () => {
    navigateByUrl = jasmine.createSpy().and.resolveTo(true);
    storage = jasmine.createSpyObj<Storage>('Storage', ['getItem', 'setItem', 'removeItem']);
    storage.getItem.and.returnValue('21.1.2');
    await TestBed.configureTestingModule({
      imports: [VersionSelectorComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DOCS_BASE_URL, useValue: 'https://example.test/app/docs/' },
        { provide: DOCS_STORAGE, useValue: storage },
        { provide: Router, useValue: { url: '/about?source=header#team', navigateByUrl } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(VersionSelectorComponent);
    http = TestBed.inject(HttpTestingController);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    http.verify();
  });

  it('groups runtime versions by Angular major', async () => {
    const pending = TestBed.inject(DocsVersionService).load();
    http.expectOne('https://example.test/app/docs/versions.json').flush({
      package: '@sdcorejs/angular',
      latest: '22.2.5',
      baseUrl: 'ignored',
      versions: [
        { version: '22.2.5', index: 'ignored', released: '2026-09-02', count: 97 },
        { version: '22.2.4', index: 'ignored', released: '2026-08-31', count: 97 },
        { version: '22.1.9', index: 'ignored', released: '2026-08-30', count: 97 },
        { version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '21.1.1', index: 'ignored', released: '2026-07-10', count: 85 },
        { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '20.1.1', index: 'ignored', released: '2026-07-10', count: 85 },
        { version: '19.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '19.1.1', index: 'ignored', released: '2026-07-10', count: 85 },
      ],
    });
    await pending;
    fixture.detectChanges();

    const groups = [...fixture.nativeElement.querySelectorAll('optgroup')] as HTMLOptGroupElement[];
    expect(groups.map(group => group.label)).toEqual(['Angular 22.x', 'Angular 21.x', 'Angular 20.x', 'Angular 19.x']);
    expect([...fixture.nativeElement.querySelectorAll('option')].map((option: HTMLOptionElement) => option.value)).toEqual([
      '22.2.5',
      '21.1.2',
      '20.1.2',
      '19.1.2',
    ]);
  });

  it('keeps the selector aligned and renders a non-interactive dropdown chevron', async () => {
    const pending = TestBed.inject(DocsVersionService).load();
    http.expectOne('https://example.test/app/docs/versions.json').flush({
      package: '@sdcorejs/angular',
      latest: '22.2.5',
      baseUrl: 'ignored',
      versions: [
        { version: '22.2.5', index: 'ignored', released: '2026-09-02', count: 97 },
        { version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '19.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
      ],
    });
    await pending;
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.version-selector') as HTMLLabelElement;
    const chevron = label.querySelector('.version-selector__chevron') as HTMLElement;

    expect(getComputedStyle(label).marginBottom).toBe('0px');
    expect(chevron.textContent?.trim()).toBe('expand_more');
    expect(chevron.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(chevron).pointerEvents).toBe('none');
    expect((label.querySelector('select') as HTMLSelectElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  });

  it('selects the Angular 22 release without leaving About', async () => {
    const pending = TestBed.inject(DocsVersionService).load();
    http.expectOne('https://example.test/app/docs/versions.json').flush({
      package: '@sdcorejs/angular',
      latest: '22.2.5',
      baseUrl: 'ignored',
      versions: [
        { version: '22.2.5', index: 'ignored', released: '2026-09-02', count: 97 },
        { version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '19.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
      ],
    });
    await pending;
    fixture.detectChanges();

    expect(TestBed.inject(DocsVersionService).selectedVersion()).toBe('21.1.2');
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '22.2.5';
    select.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(TestBed.inject(DocsVersionService).selectedVersion()).toBe('22.2.5');
    expect(navigateByUrl).toHaveBeenCalledOnceWith('/about?source=header#team');
  });

  it('handles a missing versions manifest and offers an inline retry', async () => {
    const pending = TestBed.inject(DocsVersionService)
      .load()
      .catch(() => undefined);
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
      latest: '22.2.5',
      baseUrl: 'ignored',
      versions: [
        { version: '22.2.5', index: 'ignored', released: '2026-09-02', count: 97 },
        { version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
        { version: '19.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
      ],
    });
    await retry;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('select')).not.toBeNull();
  });
});
