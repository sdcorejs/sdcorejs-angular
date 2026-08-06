import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DOC_PAGES } from '../core/documentation.registry';
import { DocsPageHeaderComponent } from './docs-page-header.component';

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
    fixture.componentRef.setInput('version', '21.1.2');
    fixture.componentRef.setInput('showIdentity', true);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    if (clipboardDescriptor) Object.defineProperty(window.navigator, 'clipboard', clipboardDescriptor);
    else delete (window.navigator as { clipboard?: Clipboard }).clipboard;
  });

  it('announces selector copy success only after the clipboard write resolves, then resets', fakeAsync(() => {
    let resolveWrite!: () => void;
    clipboardWrite.and.returnValue(new Promise<void>(resolve => (resolveWrite = resolve)));
    const selectorButton = fixture.nativeElement.querySelector('[aria-label^="Copy selector"]') as HTMLButtonElement;
    const selector = fixture.componentInstance.page().selector;
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]') as HTMLElement;

    selectorButton.click();
    fixture.detectChanges();

    expect(clipboardWrite).toHaveBeenCalledOnceWith(selector);
    expect(liveRegion.textContent?.trim()).toBe('');

    resolveWrite();
    flushMicrotasks();
    fixture.detectChanges();

    expect(liveRegion.textContent).toContain('Selector copied to clipboard.');

    tick(1600);
    fixture.detectChanges();
    expect(liveRegion.textContent?.trim()).toBe('');
  }));

  it('identifies an import-path copy rejection without claiming success', fakeAsync(() => {
    clipboardWrite.and.rejectWith(new Error('denied'));
    const importButton = fixture.nativeElement.querySelector('[aria-label="Copy import path"]') as HTMLButtonElement;

    importButton.click();
    flushMicrotasks();
    fixture.detectChanges();

    const announcement = fixture.nativeElement.querySelector('[aria-live="polite"]')?.textContent ?? '';
    expect(announcement).toContain('Import path could not be copied.');
    expect(announcement).not.toContain('copied to clipboard');
  }));

  it('announces an unavailable clipboard and retains 44px identity copy targets', () => {
    Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: undefined });
    const buttons = [...fixture.nativeElement.querySelectorAll('.page-header__identity button')] as HTMLButtonElement[];

    buttons[0]?.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Clipboard is unavailable. Copy the selector manually.'
    );
    expect(buttons).toHaveSize(2);
    expect(buttons.every(button => getComputedStyle(button).minWidth === '44px')).toBeTrue();
    expect(buttons.every(button => getComputedStyle(button).minHeight === '44px')).toBeTrue();
  });
});
