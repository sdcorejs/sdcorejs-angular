import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, DeferBlockState, TestBed } from '@angular/core/testing';
import { DocExample } from '../core/documentation.models';
import { ExampleViewerComponent, SHOWCASE_EXAMPLE_SOURCE_LOADER } from './example-viewer.component';

@Component({
  standalone: true,
  template: '<p data-testid="preview">Live preview</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestPreviewComponent {}

describe('ExampleViewerComponent', () => {
  let fixture: ComponentFixture<ExampleViewerComponent>;
  let clipboardDescriptor: PropertyDescriptor | undefined;
  let clipboardWrite: jasmine.Spy;
  let sourceLoader: jasmine.Spy;
  const example: DocExample = {
    id: 'components-button-showcase',
    title: 'Button showcase',
    description: 'Button states',
    activation: 'viewport',
    sourceKey: 'components/button/example-bien-the',
    sectionId: 'example-bien-the',
    loadComponent: async () => TestPreviewComponent,
  };

  beforeEach(async () => {
    clipboardDescriptor = Object.getOwnPropertyDescriptor(window.navigator, 'clipboard');
    clipboardWrite = jasmine.createSpy().and.resolveTo(undefined);
    sourceLoader = jasmine.createSpy().and.callFake(() => import('../generated/example-sources.generated'));
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboardWrite },
    });
    await TestBed.configureTestingModule({
      imports: [ExampleViewerComponent],
      providers: [{ provide: SHOWCASE_EXAMPLE_SOURCE_LOADER, useValue: sourceLoader }],
    }).compileComponents();
    fixture = TestBed.createComponent(ExampleViewerComponent);
    fixture.componentRef.setInput('example', example);
    fixture.detectChanges();
    const [previewBlock] = await fixture.getDeferBlocks();
    if (previewBlock) await previewBlock.render(DeferBlockState.Complete);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    if (clipboardDescriptor) Object.defineProperty(window.navigator, 'clipboard', clipboardDescriptor);
    else delete (window.navigator as { clipboard?: Clipboard }).clipboard;
  });

  it('renders a stable deep-link anchor and live preview', () => {
    expect(fixture.nativeElement.querySelector('#components-button-showcase')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="preview"]')?.textContent).toContain('Live preview');
  });

  it('suppresses generated migration descriptions instead of repeating the example title', () => {
    fixture.componentRef.setInput('example', {
      ...example,
      description: 'Existing “Button showcase” scenario preserved from the showcase.',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.example__description')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('preserved from the showcase');
  });

  it('shows reset only after the user interacts with the live example', () => {
    const preview = fixture.nativeElement.querySelector('.example__preview') as HTMLElement;
    expect(fixture.nativeElement.querySelector('[aria-label="Reset live example"]')).toBeNull();

    preview.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label="Reset live example"]')).not.toBeNull();
  });

  it('provides dialog semantics, focus containment and restoration in full-width mode', async () => {
    const backgroundControl = document.createElement('button');
    document.body.appendChild(backgroundControl);
    const expand = fixture.nativeElement.querySelector('[aria-label="Expand live example"]') as HTMLButtonElement;
    expand.click();
    fixture.detectChanges();
    await new Promise(resolve => window.setTimeout(resolve));

    expect(expand.getAttribute('aria-expanded')).toBe('true');
    const dialog = fixture.nativeElement.querySelector('.example') as HTMLElement;
    expect(dialog.classList).toContain('example--expanded');
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(backgroundControl.hasAttribute('inert')).toBeTrue();
    expect(fixture.nativeElement.querySelector('.example-backdrop')).not.toBeNull();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.example__preview'));

    const visibleLast = document.createElement('button');
    visibleLast.textContent = 'Last visible action';
    const hiddenLast = document.createElement('button');
    hiddenLast.textContent = 'Hidden focus decoy';
    hiddenLast.style.visibility = 'hidden';
    dialog.append(visibleLast, hiddenLast);
    const first = dialog.querySelector('.example__anchor') as HTMLAnchorElement;

    visibleLast.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(first);

    first.focus();
    const shiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true, bubbles: true });
    document.dispatchEvent(shiftTab);
    expect(shiftTab.defaultPrevented).toBeTrue();
    expect(document.activeElement).toBe(visibleLast);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true }));
    fixture.detectChanges();
    expect(dialog.classList).not.toContain('example--expanded');
    expect(dialog.getAttribute('role')).toBeNull();
    expect(backgroundControl.hasAttribute('inert')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.example-backdrop')).toBeNull();
    expect(document.activeElement).toBe(expand);
    backgroundControl.remove();
  });

  it('shrinks inside its grid column and keeps wide preview content scrollable', () => {
    const container = document.createElement('div');
    const preview = fixture.nativeElement.querySelector('.example__preview') as HTMLElement;
    const wideContent = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'minmax(0, 1fr)';
    container.style.width = '320px';
    wideContent.style.width = '1200px';
    preview.appendChild(wideContent);
    document.body.appendChild(container);
    container.appendChild(fixture.nativeElement);

    const hostStyle = getComputedStyle(fixture.nativeElement);
    const hostWidth = fixture.nativeElement.getBoundingClientRect().width;
    const cardWidth = (fixture.nativeElement.querySelector('.example') as HTMLElement).getBoundingClientRect().width;

    expect(hostStyle.display).toBe('block');
    expect(hostStyle.minWidth).toBe('0px');
    expect(hostWidth).toBeLessThanOrEqual(320.5);
    expect(cardWidth).toBeLessThanOrEqual(hostWidth + 0.5);
    expect(preview.scrollWidth).toBeGreaterThan(preview.clientWidth);
    preview.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.example__scroll-hint')?.textContent).toContain('Scroll horizontally');

    container.remove();
  });

  it('selects generated source tabs and copies the displayed source', async () => {
    const sourceToggle = fixture.nativeElement.querySelector('[aria-label="Expand source"]') as HTMLButtonElement;
    const sourceId = sourceToggle.getAttribute('aria-controls');
    const sourceRegion = fixture.nativeElement.querySelector(`#${sourceId}`) as HTMLElement;
    expect(sourceToggle.getAttribute('aria-expanded')).toBe('false');
    expect(sourceRegion).not.toBeNull();
    expect(sourceRegion.hidden).toBeTrue();

    await fixture.componentInstance.toggleSource();
    fixture.detectChanges();
    const labels = [...fixture.nativeElement.querySelectorAll('button')].map((button: HTMLButtonElement) =>
      button.getAttribute('aria-label')
    );

    expect(labels).toContain('Collapse source');
    expect(labels).toContain('Copy source code');
    expect(fixture.nativeElement.querySelector('[role="group"]')).not.toBeNull();
    expect(sourceToggle.getAttribute('aria-expanded')).toBe('true');
    expect(sourceRegion.hidden).toBeFalse();

    const typeScriptButton = [...fixture.nativeElement.querySelectorAll('[aria-label="Source language"] button')].find(
      (button: HTMLButtonElement) => button.textContent?.trim() === 'TypeScript'
    ) as HTMLButtonElement;
    typeScriptButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('code')?.textContent).toContain('ButtonVariantsExampleComponent');

    await fixture.componentInstance.copySource();
    expect(clipboardWrite).toHaveBeenCalledWith(fixture.componentInstance.currentSource());
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('copied to clipboard');
  });

  it('announces a clipboard rejection without claiming success', async () => {
    await fixture.componentInstance.toggleSource();
    clipboardWrite.and.rejectWith(new Error('denied'));

    await fixture.componentInstance.copySource();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('could not be copied');
    expect(fixture.nativeElement.textContent).not.toContain('Copied');
  });

  it('ignores an older clipboard completion after a newer copy action finishes', async () => {
    await fixture.componentInstance.toggleSource();
    let rejectFirst!: (reason?: unknown) => void;
    let resolveSecond!: () => void;
    const firstWrite = new Promise<void>((_resolve, reject) => (rejectFirst = reject));
    const secondWrite = new Promise<void>(resolve => (resolveSecond = resolve));
    clipboardWrite.and.returnValues(firstWrite, secondWrite);

    const firstCopy = fixture.componentInstance.copySource();
    const secondCopy = fixture.componentInstance.copySource();
    resolveSecond();
    await secondCopy;
    rejectFirst(new Error('stale failure'));
    await firstCopy;

    expect(fixture.componentInstance.copyStatus()).toBe('success');
  });

  it('resets a stateful preview by recreating its component instance', async () => {
    const before = fixture.nativeElement.querySelector('[data-testid="preview"]');
    fixture.componentInstance.reset();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="preview"]')).not.toBe(before);
  });

  it('turns a rejected source chunk into an accessible retry state', async () => {
    sourceLoader.and.rejectWith(new Error('offline'));

    await fixture.componentInstance.toggleSource();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('could not be loaded');
    expect(fixture.nativeElement.querySelector('[role="alert"] button')?.textContent).toContain('Retry source');
  });
});
