import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { DocsI18nService } from '../docs/core/docs-i18n.service';
import { DocsVersionService } from '../docs/core/docs-version.service';
import { DOC_PAGES } from '../docs/core/documentation.registry';
import { PublishedDocsService } from '../docs/core/published-docs.service';
import { ShellComponent } from './shell.component';

@Component({ standalone: true, template: '<h1>Routed documentation</h1><section id="example-anchor">Example</section>' })
class RoutedDocumentationStubComponent {}

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let versionState: {
    manifest: ReturnType<typeof signal<object | null>>;
    isLatestRelease: ReturnType<typeof signal<boolean>>;
    selectedRelease: ReturnType<typeof signal<string>>;
    selectRelease: jasmine.Spy;
  };

  beforeEach(async () => {
    versionState = {
      manifest: signal<object | null>(null),
      isLatestRelease: signal(true),
      selectedRelease: signal('1.2'),
      selectRelease: jasmine.createSpy().and.resolveTo(undefined),
    };
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([
          { path: 'v/:version/components/button/:tab', component: RoutedDocumentationStubComponent },
          { path: 'v/:version/changelog', component: RoutedDocumentationStubComponent },
          { path: 'about', component: RoutedDocumentationStubComponent },
          { path: 'pattern/order', component: RoutedDocumentationStubComponent },
        ]),
        {
          provide: DocsVersionService,
          useValue: {
            load: jasmine.createSpy().and.resolveTo(undefined),
            select: jasmine.createSpy().and.resolveTo(undefined),
            selectedVersion: signal('21.1.2'),
            latestVersion: signal('21.1.2'),
            loading: signal(false),
            error: signal<string | null>(null),
            versionGroups: signal([]),
            manifest: versionState.manifest,
            isLatestRelease: versionState.isLatestRelease,
            selectedRelease: versionState.selectedRelease,
            latestRelease: signal('1.2'),
            selectedAngularMajor: signal(21),
            resolvedPackageVersion: signal('21.1.2'),
            currentRelease: signal(null),
            menuReleaseGroups: signal([]),
            selectRelease: versionState.selectRelease,
          },
        },
        {
          provide: PublishedDocsService,
          useValue: {
            loadIndex: jasmine.createSpy().and.resolveTo({
              docs: DOC_PAGES.filter(page => page.publishedDocId).map(page => ({ id: page.publishedDocId, title: page.title })),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(DocsI18nService).set('en');
    fixture.nativeElement.remove();
    fixture.destroy();
  });

  it('switches the chrome language and mirrors it on <html lang>', () => {
    const vi = fixture.nativeElement.querySelector('.language-switch button[lang="vi"]') as HTMLButtonElement;

    vi.click();
    fixture.detectChanges();

    expect(document.documentElement.getAttribute('lang')).toBe('vi');
    expect(vi.getAttribute('aria-pressed')).toBe('true');
    expect([...fixture.nativeElement.querySelectorAll('.topnav a')].map((link: Element) => link.textContent?.trim())).toEqual([
      'Tài liệu',
      'Thay đổi',
      'Giới thiệu',
    ]);
  });

  it('shows the old-release banner and goes to the latest release from it', () => {
    expect(fixture.nativeElement.querySelector('.release-banner')).toBeNull();

    versionState.manifest.set({});
    versionState.isLatestRelease.set(false);
    versionState.selectedRelease.set('1.1');
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.release-banner') as HTMLElement;
    expect(banner.textContent).toContain('You are viewing docs for release 1.1.');
    (banner.querySelector('button') as HTMLButtonElement).click();
    expect(versionState.selectRelease).toHaveBeenCalledWith('1.2');
  });

  it('offers a theme toggle that names the theme it switches to', () => {
    const toggle = fixture.nativeElement.querySelector('.theme-toggle') as HTMLButtonElement;
    const before = document.documentElement.getAttribute('data-sd-theme');

    toggle.click();
    fixture.detectChanges();

    const after = document.documentElement.getAttribute('data-sd-theme');
    expect(after).not.toBe(before);
    expect(toggle.getAttribute('aria-label')).toBe(after === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.click();
  });

  it('captures focus on open, traps Tab, and restores the trigger on Escape', async () => {
    const trigger = fixture.nativeElement.querySelector('.mobile-menu') as HTMLButtonElement;

    trigger.focus();
    fixture.componentInstance.toggleMobileNav();
    await Promise.resolve();
    expect(document.activeElement).toBe(trigger);
    fixture.detectChanges();
    await fixture.whenStable();
    const focusable = [...fixture.nativeElement.querySelectorAll('.sidebar a[href], .sidebar button:not([disabled])')] as HTMLElement[];
    const sidebar = fixture.nativeElement.querySelector('.sidebar') as HTMLElement;
    expect(sidebar.hasAttribute('inert')).toBeFalse();
    expect(document.activeElement).toBe(focusable[0]);

    focusable.at(-1)?.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    fixture.componentInstance.onDocumentKeydown(tab);
    expect(tab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(focusable[0]);

    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    fixture.componentInstance.onDocumentKeydown(escape);
    await Promise.resolve();
    expect(fixture.componentInstance.mobileNavOpen()).toBeFalse();
    expect(document.activeElement).toBe(trigger);
  });

  it('uses the GitHub mark and protects the external repository link', () => {
    const link = fixture.nativeElement.querySelector('.github-link') as HTMLAnchorElement;
    const rel = link.rel.split(/\s+/);

    expect(link.getAttribute('target')).toBe('_blank');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
    expect(link.querySelector('svg[aria-hidden="true"] path')).not.toBeNull();
    expect(link.querySelector('mat-icon')).toBeNull();
    expect(link.textContent?.trim()).toBe('');
  });

  it('uses the SDCoreJS logo as the documentation brand mark', () => {
    const logo = fixture.nativeElement.querySelector('.brand__logo') as HTMLImageElement | null;

    expect(logo?.getAttribute('src')).toBe('assets/brand/sdcorejs-logo.png');
    expect(logo?.getAttribute('alt')).toBe('');
  });

  it('renders the shared primary navigation in both the header and mobile drawer', () => {
    const headerLabels = [...fixture.nativeElement.querySelectorAll('.topnav a')].map((link: Element) => link.textContent?.trim());
    const drawerLabels = [...fixture.nativeElement.querySelectorAll('.sidebar__primary a')].map((link: Element) =>
      link.textContent?.trim()
    );

    expect(headerLabels).toEqual(['Docs', 'Changelog', 'About']);
    expect(drawerLabels).toEqual(headerLabels);
  });

  it('labels example counts instead of presenting an unexplained number', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const buttonLink = ([...fixture.nativeElement.querySelectorAll('.nav-group li a')] as HTMLAnchorElement[]).find(link =>
      link.textContent?.includes('Button')
    );
    const count = buttonLink?.querySelector('small');

    expect(count?.textContent?.trim()).toMatch(/^\d+ ex\.$/);
    expect(count?.getAttribute('aria-label')).toMatch(/^\d+ examples$/);
  });

  it('lists Form Generic under Components with its canonical route', () => {
    const groups = [...fixture.nativeElement.querySelectorAll('.nav-group')] as HTMLElement[];
    const components = groups.find(group => group.querySelector('.nav-group__header span')?.textContent?.trim() === 'Components');
    const modules = groups.find(group => group.querySelector('.nav-group__header span')?.textContent?.trim() === 'Modules & Integrations');
    const formGeneric = ([...(components?.querySelectorAll('li a') ?? [])] as HTMLAnchorElement[]).find(link =>
      link.textContent?.includes('Form Generic')
    );

    expect(formGeneric?.getAttribute('href')).toContain('/v/21.1.2/components/generic/');
    expect(modules?.textContent).not.toContain('Form Generic');
  });

  it('routes a live-demo-only catalog entry to Examples and labels its availability', () => {
    fixture.componentInstance.publishedDocIds.set(new Set());
    fixture.detectChanges();

    const buttonLink = ([...fixture.nativeElement.querySelectorAll('.nav-group li a')] as HTMLAnchorElement[]).find(link =>
      link.textContent?.includes('Button')
    );
    expect(buttonLink?.getAttribute('href')).toContain('/v/21.1.2/components/button/examples');
    expect(buttonLink?.querySelector('.availability-label')?.textContent?.trim()).toBe('Current live demo');
  });

  it('connects each catalog disclosure button to the list it controls', () => {
    const button = fixture.nativeElement.querySelector('.nav-group__header') as HTMLButtonElement;
    const controlledId = button.getAttribute('aria-controls');

    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(controlledId).toBeTruthy();
    const region = fixture.nativeElement.querySelector(`#${controlledId}`) as HTMLElement;
    expect(region).not.toBeNull();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector(`#${controlledId}`)).toBe(region);
    expect(region.hidden).toBeTrue();
  });

  it('uses a 44px mobile menu action target at the drawer breakpoint', () => {
    const trigger = fixture.nativeElement.querySelector('.mobile-menu') as HTMLButtonElement;
    const bounds = trigger.getBoundingClientRect();
    expect(bounds.width).toBeGreaterThanOrEqual(44);
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  });

  it('marks Docs active on a versioned detail page', async () => {
    await TestBed.inject(Router).navigateByUrl('/v/21.1.2/components/button/examples');
    fixture.detectChanges();

    const docsLink = fixture.nativeElement.querySelector('.topnav a') as HTMLAnchorElement;
    expect(docsLink.classList).toContain('active');
    expect(docsLink.getAttribute('aria-current')).toBe('page');
  });

  it('makes the page behind search inert and exposes it again when search closes', async () => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const body = fixture.nativeElement.querySelector('.shell__body') as HTMLElement;
    expect(body.hasAttribute('inert')).toBeTrue();
    expect(body.getAttribute('aria-hidden')).toBe('true');

    (fixture.nativeElement.querySelector('.search-dialog__field button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(body.hasAttribute('inert')).toBeFalse();
    expect(body.hasAttribute('aria-hidden')).toBeFalse();
  });

  it('closes the mobile drawer before exposing the search dialog', () => {
    fixture.componentInstance.mobileNavOpen.set(true);

    fixture.componentInstance.onSearchOpenChange(true);

    expect(fixture.componentInstance.mobileNavOpen()).toBeFalse();
    expect(fixture.componentInstance.searchOpen()).toBeTrue();
  });

  it('moves focus to a fragment target after cross-route search navigation', async () => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    trigger.focus();

    await TestBed.inject(Router).navigateByUrl('/v/21.1.2/components/button/examples#example-anchor');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).not.toBe(fixture.nativeElement.querySelector('h1'));
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#example-anchor'));
  });

  it('leaves focus where the /pattern sample app put it', async () => {
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    trigger.focus();

    await TestBed.inject(Router).navigateByUrl('/pattern/order?cfg=%7B%7D');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve));

    expect(document.activeElement).toBe(trigger);
  });

  it('leaves focus on the TOC control for a same-route fragment change', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/v/21.1.2/components/button/examples');
    fixture.detectChanges();
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('.search-trigger') as HTMLButtonElement;
    trigger.focus();

    await router.navigateByUrl('/v/21.1.2/components/button/examples#example-anchor');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(trigger);
  });
});
