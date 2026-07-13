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

  it('selects generated source tabs and copies the displayed source', async () => {
    await fixture.componentInstance.toggleSource();
    fixture.detectChanges();
    const labels = [...fixture.nativeElement.querySelectorAll('button')].map((button: HTMLButtonElement) => button.getAttribute('aria-label'));

    expect(labels).toContain('Collapse source');
    expect(labels).toContain('Copy source code');
    expect(labels).toContain('Reset live example');
    expect(fixture.nativeElement.querySelector('[role="group"]')).not.toBeNull();

    const typeScriptButton = [...fixture.nativeElement.querySelectorAll('[aria-label="Source language"] button')]
      .find((button: HTMLButtonElement) => button.textContent?.trim() === 'TypeScript') as HTMLButtonElement;
    typeScriptButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('code')?.textContent).toContain('ButtonVariantsExampleComponent');

    fixture.componentInstance.copySource();
    expect(clipboardWrite).toHaveBeenCalledWith(fixture.componentInstance.currentSource());
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
