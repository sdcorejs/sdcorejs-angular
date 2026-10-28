import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DocsClipboardService } from '../core/docs-clipboard.service';
import { DocsI18nService } from '../core/docs-i18n.service';
import { DOC_PAGES } from '../core/documentation.registry';
import { DocsPageHeaderComponent, inlineCodeSegments, metadataCode } from './docs-page-header.component';

describe('DocsPageHeaderComponent', () => {
  let fixture: ComponentFixture<DocsPageHeaderComponent>;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  let clipboardWrite: jasmine.Spy;

  beforeEach(async () => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    clipboardWrite = jasmine.createSpy().and.resolveTo(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });

    await TestBed.configureTestingModule({
      imports: [DocsPageHeaderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const page = DOC_PAGES.find(entry => entry.slug === 'button');
    expect(page).toBeDefined();
    if (!page) return;

    fixture = TestBed.createComponent(DocsPageHeaderComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('version', '21.3.1');
    fixture.componentRef.setInput('release', '3.1');
    fixture.componentRef.setInput('metadata', { Class: '`SdButton` (implements `OnInit`, `OnDestroy`)' });
    fixture.componentRef.setInput('lead', 'Standard action button with `sd-button`.');
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.inject(DocsI18nService).set('en');
    fixture?.destroy();
    if (clipboardDescriptor) Object.defineProperty(window.navigator, 'clipboard', clipboardDescriptor);
    else delete (window.navigator as { clipboard?: Clipboard }).clipboard;
  });

  function cells(): HTMLElement[] {
    return [...fixture.nativeElement.querySelectorAll('.identity-cell')];
  }

  it('shows the breadcrumb, type pill and identity strip of a component', () => {
    expect(fixture.nativeElement.querySelector('.breadcrumbs')?.textContent).toContain('Components');
    expect(fixture.nativeElement.querySelector('.pill')?.textContent?.trim()).toBe('Component');
    expect(cells().map(cell => cell.querySelector('.identity-cell__label')?.textContent?.trim())).toEqual(['Selector', 'Import', 'Class']);
    expect(cells().map(cell => cell.querySelector('code')?.textContent?.trim())).toEqual([
      'sd-button',
      '@sdcorejs/angular/components/button',
      'SdButton',
    ]);
  });

  it('marks the page Updated in the current release', () => {
    fixture.componentRef.setInput('badge', 'updated');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.pill--accent')?.textContent?.trim()).toBe('Updated in 3.1');
  });

  it('uses the English purpose as lead and the Vietnamese registry text in VI', () => {
    const lead = () => fixture.nativeElement.querySelector('.page-header__lead') as HTMLElement;
    expect(lead().getAttribute('lang')).toBe('en');
    expect(lead().querySelector('code')?.textContent).toBe('sd-button');

    TestBed.inject(DocsI18nService).set('vi');
    fixture.detectChanges();
    expect(lead().getAttribute('lang')).toBe('vi');
    expect(lead().textContent?.trim()).toBe(fixture.componentInstance.page().description);
  });

  it('copies one cell, shows a check for 1.4s and announces the result', fakeAsync(() => {
    const clipboard = TestBed.inject(DocsClipboardService);
    const button = cells()[0].querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Copy Selector');
    button.click();
    flushMicrotasks();
    fixture.detectChanges();

    expect(clipboardWrite).toHaveBeenCalledOnceWith('sd-button');
    expect(button.querySelector('mat-icon')?.textContent?.trim()).toBe('check');
    expect(clipboard.announcement()).toBe('Copied to clipboard.');

    tick(1400);
    fixture.detectChanges();
    expect(button.querySelector('mat-icon')?.textContent?.trim()).toBe('content_copy');
    expect(clipboard.announcement()).toBe('');
  }));

  it('announces a failed copy without showing the check', fakeAsync(() => {
    clipboardWrite.and.rejectWith(new Error('denied'));
    const button = cells()[1].querySelector('button') as HTMLButtonElement;

    button.click();
    flushMicrotasks();
    fixture.detectChanges();

    expect(button.querySelector('mat-icon')?.textContent?.trim()).toBe('content_copy');
    expect(TestBed.inject(DocsClipboardService).announcement()).toContain('Could not copy');
    tick(1400);
  }));

  it('keeps a 44px hit area around the 30px copy buttons', () => {
    const button = cells()[0].querySelector('button') as HTMLButtonElement;
    const hitArea = getComputedStyle(button, '::after');

    expect(button.getBoundingClientRect().height - parseFloat(hitArea.top) - parseFloat(hitArea.bottom)).toBeGreaterThanOrEqual(44);
  });
});

describe('page header helpers', () => {
  it('reads the first code span of a metadata value', () => {
    expect(metadataCode('`SdButton` (implements `OnInit`)')).toBe('SdButton');
    expect(metadataCode("`'root'`")).toBe("'root'");
    expect(metadataCode(undefined)).toBeNull();
  });

  it('splits inline code segments', () => {
    expect(inlineCodeSegments('Use `sd-button` here')).toEqual([
      { text: 'Use ', code: false },
      { text: 'sd-button', code: true },
      { text: ' here', code: false },
    ]);
  });
});
