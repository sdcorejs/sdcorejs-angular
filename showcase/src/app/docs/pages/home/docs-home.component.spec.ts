import { signal } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DocsClipboardService } from '../../core/docs-clipboard.service';
import { DocsRelease } from '../../core/docs-release.utils';
import { DocsVersionService } from '../../core/docs-version.service';
import { DOC_NAV_GROUPS } from '../../core/documentation.registry';
import { DocsHomeComponent, firstSentence, installCommandFor } from './docs-home.component';

describe('DocsHomeComponent', () => {
  let fixture: ComponentFixture<DocsHomeComponent>;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  let clipboardWrite: jasmine.Spy;
  let selectAngularMajor: jasmine.Spy;
  const release: DocsRelease = { id: '2.5', group: '2.x', released: '2026-09-02', majors: [22, 21, 20, 19], latest: true };

  beforeEach(async () => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    clipboardWrite = jasmine.createSpy().and.resolveTo(undefined);
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: clipboardWrite } });
    selectAngularMajor = jasmine.createSpy().and.resolveTo(undefined);

    const paramMap = convertToParamMap({ version: '22.2.5' });
    const versions = {
      selectedVersion: signal<string | null>('22.2.5'),
      resolvedPackageVersion: signal('22.2.5'),
      selectedRelease: signal('2.5'),
      selectedAngularMajor: signal(22),
      currentRelease: signal({ ...release, majors: [22, 21, 20] }),
      releaseCatalog: signal([release]),
      resolve: jasmine.createSpy().and.resolveTo('22.2.5'),
      selectAngularMajor,
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

  it('links Get started and Browse components for the selected version', () => {
    const actions = [...fixture.nativeElement.querySelectorAll('.hero__actions a')] as HTMLAnchorElement[];

    expect(actions[0]?.getAttribute('href')).toBe('/v/22.2.5/getting-started');
    expect(actions[1]?.getAttribute('href')).toBe('/v/22.2.5/components');
    expect(fixture.nativeElement.querySelector('.hero__release')?.textContent).toContain('Release 2.5 · 2026-09-02');
  });

  it('shows one card per category with its icon and page count', () => {
    const cards = [...fixture.nativeElement.querySelectorAll('.category-card')] as HTMLAnchorElement[];

    expect(cards.length).toBe(DOC_NAV_GROUPS.length);
    expect(cards.every(card => /^\/v\/22\.2\.5\/[a-z-]+$/.test(card.getAttribute('href') ?? ''))).toBeTrue();
    expect(cards[0].querySelector('.category-card__count')?.textContent?.trim()).toBe(String(DOC_NAV_GROUPS[0].pages.length));
  });

  it('pins the install command to the selected Angular major and disables unpublished majors', () => {
    const tabs = [...fixture.nativeElement.querySelectorAll('.install__tabs button')] as HTMLButtonElement[];

    expect(fixture.nativeElement.querySelector('.install__command code')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(installCommandFor(22));
    expect(tabs.map(tab => tab.textContent?.trim())).toEqual(['22', '21', '20', '19']);
    expect(tabs[3].disabled).toBeTrue();

    tabs[1].click();
    expect(selectAngularMajor).toHaveBeenCalledWith(21);
  });

  it('copies the install command and shows Copied for 1.4s', fakeAsync(() => {
    (fixture.nativeElement.querySelector('.install__command button') as HTMLButtonElement).click();
    flushMicrotasks();
    fixture.detectChanges();

    expect(clipboardWrite).toHaveBeenCalledOnceWith(installCommandFor(22));
    expect(fixture.nativeElement.querySelector('.install__command button')?.textContent).toContain('Copied');
    expect(TestBed.inject(DocsClipboardService).announcement()).toBe('Copied to clipboard.');
    tick(1400);
  }));

  it('shortens a changelog entry to its first plain sentence', () => {
    expect(firstSentence('optional generic `Item<T>.data`, typed columns. More text here.')).toBe('Optional generic Item<T>.data, typed columns.');
    expect(firstSentence('outline: neutral border; rest')).toBe('Outline: neutral border.');
  });

  it('lists compatibility with the latest package of each Angular major', () => {
    const rows = [...fixture.nativeElement.querySelectorAll('.compat__row:not(.compat__row--head)')] as HTMLElement[];

    expect(rows.map(row => row.querySelector('.compat__latest')?.textContent)).toEqual(['22.2.5', '21.2.5', '20.2.5', '19.2.5']);
  });
});
