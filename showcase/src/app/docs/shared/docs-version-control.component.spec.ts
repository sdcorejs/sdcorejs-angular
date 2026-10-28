import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DOCS_BASE_URL, DOCS_STORAGE } from '../core/docs.tokens';
import { DocsVersionService } from '../core/docs-version.service';
import { DocsVersionsManifest } from '../core/published-docs.models';
import { DocsVersionControlComponent } from './docs-version-control.component';

const manifest: DocsVersionsManifest = {
  package: '@sdcorejs/angular',
  latest: '22.2.5',
  baseUrl: 'ignored',
  versions: [
    { version: '22.2.5', index: 'ignored', released: '2026-09-02', count: 97 },
    { version: '22.2.4', index: 'ignored', released: '2026-08-31', count: 97 },
    { version: '21.2.5', index: 'ignored', released: '2026-09-02', count: 97 },
    { version: '21.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
    { version: '20.2.5', index: 'ignored', released: '2026-09-02', count: 97 },
    { version: '20.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
    { version: '19.2.5', index: 'ignored', released: '2026-09-02', count: 97 },
    { version: '19.1.2', index: 'ignored', released: '2026-07-11', count: 85 },
  ],
};

describe('DocsVersionControlComponent', () => {
  let fixture: ComponentFixture<DocsVersionControlComponent>;
  let http: HttpTestingController;
  let navigateByUrl: jasmine.Spy;
  let storage: jasmine.SpyObj<Storage>;

  async function setup(storedVersion: string | null): Promise<void> {
    navigateByUrl = jasmine.createSpy().and.resolveTo(true);
    storage = jasmine.createSpyObj<Storage>('Storage', ['getItem', 'setItem', 'removeItem']);
    storage.getItem.and.callFake(key => (key === 'sdcorejs.docs.version' ? storedVersion : null));
    await TestBed.configureTestingModule({
      imports: [DocsVersionControlComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DOCS_BASE_URL, useValue: 'https://example.test/app/docs/' },
        { provide: DOCS_STORAGE, useValue: storage },
        { provide: Router, useValue: { url: '/about?source=header#team', navigateByUrl } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DocsVersionControlComponent);
    http = TestBed.inject(HttpTestingController);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  }

  async function flushManifest(): Promise<void> {
    const pending = TestBed.inject(DocsVersionService).load();
    http.expectOne('https://example.test/app/docs/versions.json').flush(manifest);
    await pending;
    fixture.detectChanges();
  }

  function openMenu(selector: string): HTMLElement[] {
    (fixture.nativeElement.querySelector(selector) as HTMLButtonElement).click();
    fixture.detectChanges();
    return [...document.querySelectorAll<HTMLElement>('.version-menu__item')];
  }

  afterEach(() => {
    document.querySelectorAll('.cdk-overlay-container').forEach(container => (container.innerHTML = ''));
    fixture.nativeElement.remove();
    http.verify();
  });

  it('shows the release and the Angular major of the selected package version', async () => {
    await setup('21.1.2');
    await flushManifest();

    const triggers = [...fixture.nativeElement.querySelectorAll('.version-control__trigger')] as HTMLButtonElement[];
    expect(triggers.map(trigger => trigger.querySelector('.version-control__value')?.textContent?.trim())).toEqual(['1.2', '21']);
    expect(triggers[0].querySelector('.version-control__pill')).toBeNull();
    expect(triggers[0].getAttribute('aria-label')).toContain('1.2');
  });

  it('marks the latest release with a pill', async () => {
    await setup(null);
    await flushManifest();

    expect(fixture.nativeElement.querySelector('.version-control__trigger--release .version-control__pill')?.textContent?.trim()).toBe(
      'latest'
    );
  });

  it('switches release, falls back to the highest published major and stays on the current page', async () => {
    await setup('21.1.2');
    await flushManifest();

    const items = openMenu('.version-control__trigger--release');
    expect(items.map(item => item.querySelector('.version-menu__release')?.textContent?.trim())).toEqual(['2.5', '1.2']);
    items[0].click();
    await fixture.whenStable();

    expect(TestBed.inject(DocsVersionService).selectedVersion()).toBe('21.2.5');
    expect(navigateByUrl).toHaveBeenCalledOnceWith('/about?source=header#team');
  });

  it('lists every Angular major with its derived package version and disables unpublished ones', async () => {
    await setup('21.1.2');
    await flushManifest();

    const items = openMenu('.version-control__trigger--angular');
    expect(items.map(item => item.querySelector('.version-menu__angular')?.textContent?.trim())).toEqual([
      'Angular 22',
      'Angular 21',
      'Angular 20',
      'Angular 19',
    ]);
    expect(items.map(item => item.querySelector('.version-menu__meta')?.textContent?.trim())).toEqual([
      'not published',
      '21.1.2',
      '20.1.2',
      '19.1.2',
    ]);
    expect(items[0].getAttribute('aria-disabled')).toBe('true');
    expect(document.querySelector('.version-menu__install code')?.textContent?.trim()).toBe('npm i @sdcorejs/angular@21.1.2');

    items[2].click();
    await fixture.whenStable();
    expect(TestBed.inject(DocsVersionService).selectedVersion()).toBe('20.1.2');
    expect(storage.setItem).toHaveBeenCalledWith('sdcorejs.docs.ng', '20');
  });

  it('handles a missing versions manifest and offers an inline retry', async () => {
    await setup('21.1.2');
    const pending = TestBed.inject(DocsVersionService)
      .load()
      .catch(() => undefined);
    http.expectOne('https://example.test/app/docs/versions.json').flush('Not found', { status: 404, statusText: 'Not Found' });
    await pending;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Retry versions');

    (fixture.nativeElement.querySelector('.version-control__retry') as HTMLButtonElement).click();
    http.expectOne('https://example.test/app/docs/versions.json').flush(manifest);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.version-control__trigger--release')).not.toBeNull();
  });
});
