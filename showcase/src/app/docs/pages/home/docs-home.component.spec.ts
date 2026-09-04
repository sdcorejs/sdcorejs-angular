import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DocsVersionService } from '../../core/docs-version.service';
import { DocsHomeComponent } from './docs-home.component';

describe('DocsHomeComponent', () => {
  let fixture: ComponentFixture<DocsHomeComponent>;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  let clipboardWrite: jasmine.Spy;

  beforeEach(async () => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    clipboardWrite = jasmine.createSpy().and.resolveTo(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });

    const paramMap = convertToParamMap({ version: '22.2.5' });
    const versions = {
      selectedVersion: signal<string | null>('22.2.5'),
      latestVersion: signal('22.2.5'),
      invalidVersion: signal<string | null>(null),
      error: signal<string | null>(null),
      versionGroups: signal([{ major: 22, versions: ['22.2.5'] }]),
      load: jasmine.createSpy().and.resolveTo(undefined),
      resolve: jasmine.createSpy().and.resolveTo('22.2.5'),
    };

    await TestBed.configureTestingModule({
      imports: [DocsHomeComponent],
      providers: [
        provideRouter([]),
        { provide: DocsVersionService, useValue: versions },
        { provide: ActivatedRoute, useValue: { paramMap: of(paramMap), snapshot: { paramMap } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocsHomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    if (clipboardDescriptor) Object.defineProperty(window.navigator, 'clipboard', clipboardDescriptor);
    else delete (window.navigator as { clipboard?: Clipboard }).clipboard;
  });

  it('uses task-first entry points instead of arbitrary component pages', () => {
    const actions = [...fixture.nativeElement.querySelectorAll('.hero__actions a')] as HTMLAnchorElement[];

    expect(actions[0]?.getAttribute('href')).toBe('/v/22.2.5/getting-started');
    expect(actions[1]?.getAttribute('href')).toBe('/v/22.2.5/components');
    const categoryLinks = [...fixture.nativeElement.querySelectorAll('.category-grid article > a')] as HTMLAnchorElement[];
    expect(categoryLinks.every(link => /^\/v\/22\.2\.5\/[a-z-]+$/.test(link.getAttribute('href') ?? ''))).toBeTrue();
  });

  it('renders category icons through the Core UI icon facade', () => {
    const iconContainers = [...fixture.nativeElement.querySelectorAll('.category-grid__icon')] as HTMLElement[];

    expect(iconContainers.length).toBeGreaterThan(0);
    expect(iconContainers.every(container => container.querySelector('sd-icon'))).toBeTrue();
    expect(
      iconContainers.every(container =>
        [...container.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).every(node => !(node.textContent ?? '').trim())
      )
    ).toBeTrue();
  });

  it('keeps consumer-facing copy free of migration and implementation language', () => {
    const copy = fixture.nativeElement.textContent.toLocaleLowerCase();

    expect(copy).not.toContain('preserved');
    expect(copy).not.toContain('hard-coded');
    expect(copy).not.toContain('typed configuration');
    expect(copy).toContain('interactive examples');
    expect(copy).toContain('angular 19–22');
  });

  it('presents the configured maintainer profile and public contact links', () => {
    const profile = fixture.nativeElement.querySelector('.maintainer-card') as HTMLElement | null;
    const links = [...(profile?.querySelectorAll('a') ?? [])] as HTMLAnchorElement[];

    expect(profile?.textContent).toContain('Trần Thuận Nghĩa');
    expect(profile?.textContent).toContain('Full Stack Developer');
    expect(profile?.textContent).toContain('strongly typed web applications');
    const avatar = profile?.querySelector<HTMLImageElement>('.maintainer-card__avatar');
    expect(avatar?.getAttribute('src')).toBe('assets/brand/sdcorejs-logo.png');
    expect(avatar?.alt).toBe('');
    expect(links.some(link => link.href === 'https://www.linkedin.com/in/tran-thuan-nghia/')).toBeTrue();
    expect(links.some(link => link.href === 'mailto:tran.thuan.nghia@gmail.com')).toBeTrue();
  });

  it('pins the install command to the selected Angular major', () => {
    expect(fixture.nativeElement.querySelector('.install code')?.textContent?.trim()).toBe('npm install @sdcorejs/angular@^22');
  });

  it('announces installation copy success only after the version-pinned command is written, then resets', fakeAsync(() => {
    let resolveWrite!: () => void;
    clipboardWrite.and.returnValue(new Promise<void>(resolve => (resolveWrite = resolve)));
    const copyButton = fixture.nativeElement.querySelector('[aria-label="Copy installation command"]') as HTMLButtonElement;
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;

    copyButton.click();
    fixture.detectChanges();

    expect(clipboardWrite).toHaveBeenCalledOnceWith('npm install @sdcorejs/angular@^22');
    expect(liveRegion.textContent?.trim()).toBe('');

    resolveWrite();
    flushMicrotasks();
    fixture.detectChanges();

    expect(liveRegion.textContent).toContain('Installation command copied to clipboard.');

    tick(1600);
    fixture.detectChanges();
    expect(liveRegion.textContent?.trim()).toBe('');
  }));

  it('announces a rejected installation copy without claiming success', fakeAsync(() => {
    clipboardWrite.and.rejectWith(new Error('denied'));
    const copyButton = fixture.nativeElement.querySelector('[aria-label="Copy installation command"]') as HTMLButtonElement;

    copyButton.click();
    flushMicrotasks();
    fixture.detectChanges();

    const announcement = fixture.nativeElement.querySelector('[aria-live="polite"]')?.textContent ?? '';
    expect(announcement).toContain('Installation command could not be copied.');
    expect(announcement).not.toContain('copied to clipboard');
  }));

  it('announces an unavailable clipboard and keeps the copy target at least 44px', () => {
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: undefined });
    const copyButton = fixture.nativeElement.querySelector('[aria-label="Copy installation command"]') as HTMLButtonElement;

    copyButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Clipboard is unavailable. Copy the installation command manually.'
    );
    expect(getComputedStyle(copyButton).minWidth).toBe('44px');
    expect(getComputedStyle(copyButton).minHeight).toBe('44px');
  });
});
