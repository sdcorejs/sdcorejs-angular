import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SdEditorSurface } from './editor-surface.component';

@Component({
  standalone: true,
  imports: [SdEditorSurface],
  template:
    '<sd-editor-surface [content]="content" [uploadEnabled]="true" (change)="accept($event)" (filesSelected)="files.push($event)" />',
})
class BoundChangeHost {
  readonly content = '<p>Hello</p>';
  model = this.content;
  changes: unknown[] = [];
  files: File[][] = [];
  accept(value: string): void {
    this.model = value;
    this.changes.push(value);
  }
}

describe('SdEditorSurface lifecycle and native content', () => {
  let fixture: ComponentFixture<SdEditorSurface>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdEditorSurface, BoundChangeHost, NoopAnimationsModule] }).compileComponents();
  });
  afterEach(() => fixture?.destroy());

  async function mount(content = '<p>Hello</p>'): Promise<void> {
    fixture = TestBed.createComponent(SdEditorSurface);
    fixture.componentRef.setInput('content', content);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('initializes one real engine silently and keeps it across variant and placeholder changes', async () => {
    fixture = TestBed.createComponent(SdEditorSurface);
    const ready = jasmine.createSpy('ready');
    const change = jasmine.createSpy('change');
    fixture.componentInstance.engineReady.subscribe(ready);
    fixture.componentInstance.change.subscribe(change);
    fixture.componentRef.setInput('content', '<p>Hello</p>');
    fixture.detectChanges();
    await fixture.whenStable();
    const engine = fixture.componentInstance.engine();
    expect(engine).not.toBeNull();
    expect(ready).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('variant', 'compact');
    fixture.componentRef.setInput('placeholder', 'Type');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.engine()).toBe(engine);
    expect(ready).toHaveBeenCalledTimes(1);
    expect(change).not.toHaveBeenCalled();
    expect(engine!.editor.view.dom.getAttribute('data-placeholder')).toBe('Type');
  });

  it('applies label, description, invalid state and geometry to the actual editable DOM', async () => {
    await mount();
    fixture.componentRef.setInput('label', 'Product description');
    fixture.componentRef.setInput('describedBy', 'help error');
    fixture.componentRef.setInput('invalid', true);
    fixture.componentRef.setInput('id', 'product-body');
    fixture.componentRef.setInput('height', '240px');
    fixture.componentRef.setInput('maxHeight', '360px');
    fixture.detectChanges();
    await fixture.whenStable();
    const native = fixture.componentInstance.engine()!.editor.view.dom;
    expect(native.getAttribute('role')).toBe('textbox');
    expect(native.getAttribute('aria-label')).toBe('Product description');
    expect(native.getAttribute('aria-describedby')).toBe('help error');
    expect(native.getAttribute('aria-invalid')).toBe('true');
    expect(native.id).toBe('product-body');
    expect(native.style.minHeight).toBe('240px');
    expect(native.style.maxHeight).toBe('360px');
  });

  it('relays real editable FocusEvents rather than composite toolbar focus', async () => {
    await mount();
    const focus = jasmine.createSpy('focus');
    const blur = jasmine.createSpy('blur');
    fixture.componentInstance.focus.subscribe(focus);
    fixture.componentInstance.blur.subscribe(blur);
    const native = fixture.componentInstance.engine()!.editor.view.dom;
    const focusEvent = new FocusEvent('focus');
    const blurEvent = new FocusEvent('blur');
    native.dispatchEvent(focusEvent);
    native.dispatchEvent(blurEvent);
    expect(focus).toHaveBeenCalledWith(focusEvent);
    expect(blur).toHaveBeenCalledWith(blurEvent);
  });

  it('replaces authoritative content silently and keeps an equal echo selection', async () => {
    await mount();
    const engine = fixture.componentInstance.engine()!;
    const changed = jasmine.createSpy('change');
    const replaced = jasmine.createSpy('source');
    fixture.componentInstance.change.subscribe(changed);
    fixture.componentInstance.sourceChange.subscribe(replaced);
    engine.editor.commands.setTextSelection(3);
    fixture.componentRef.setInput('content', '<p>Hello</p>');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(engine.editor.state.selection.from).toBe(3);
    expect(replaced).not.toHaveBeenCalled();
    fixture.componentRef.setInput('content', '<p>Replacement</p>');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(engine.getContent()).toBe('<p>Replacement</p>');
    expect(replaced).toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it('shows import diagnostics and disables authoring without changing the supplied source', async () => {
    const source = '<dl><dt>Term</dt><dd>Definition</dd></dl>';
    await mount(source);
    const engine = fixture.componentInstance.engine()!;
    expect(engine.getContent()).toBe(source);
    expect(engine.editor.isEditable).toBeFalse();
    expect(fixture.nativeElement.querySelector('.sd-editor-import-warning')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[data-editor-control="bold"]').disabled).toBeTrue();
  });

  it('delegates composition and differing external writes to the same engine without remounting', async () => {
    await mount();
    const engine = fixture.componentInstance.engine()!;
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart'));
    fixture.componentRef.setInput('content', '<p>Authoritative</p>');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.engine()).toBe(engine);
    expect(engine.editor.isEditable).toBeFalse();
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend'));
    await fixture.whenStable();
    expect(engine.getContent()).toBe('<p>Authoritative</p>');
  });

  it('relays composition start and final change before composition completion for adapter cadence', async () => {
    await mount();
    const engine = fixture.componentInstance.engine()!;
    const events: string[] = [];
    fixture.componentInstance.compositionChange.subscribe(composing => events.push(String(composing)));
    fixture.componentInstance.change.subscribe(() => events.push('change'));
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart'));
    engine.editor.commands.setTextSelection(6);
    engine.editor.commands.insertContent('é');
    expect(events).toEqual(['true']);
    engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend'));
    expect(events).toEqual(['true', 'change', 'false']);
  });

  it('destroys its engine exactly once and detaches editable listeners', async () => {
    await mount();
    const engine = fixture.componentInstance.engine()!;
    const native = engine.editor.view.dom;
    const destroy = spyOn(engine, 'destroy').and.callThrough();
    const blur = jasmine.createSpy('blur');
    fixture.componentInstance.blur.subscribe(blur);
    fixture.destroy();
    native.dispatchEvent(new FocusEvent('blur'));
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(blur).not.toHaveBeenCalled();
  });

  it('keeps bound change payloads as document strings when popup and file inputs emit native changes', async () => {
    const host = TestBed.createComponent(BoundChangeHost);
    try {
      host.detectChanges();
      await host.whenStable();
      host.detectChanges();
      await host.whenStable();
      const surface = host.debugElement.query(By.directive(SdEditorSurface)).componentInstance as SdEditorSurface;
      const engine = surface.engine()!;
      (host.nativeElement.querySelector('button[data-editor-control="link"]') as HTMLButtonElement).click();
      host.detectChanges();
      await host.whenStable();
      const field = host.nativeElement.querySelector('.sd-editor-popup input') as HTMLInputElement;
      expect(field).not.toBeNull();
      field.value = 'https://example.com/edited';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      field.blur();
      const picker = host.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
      const selected = new File(['image'], 'photo.png', { type: 'image/png' });
      const transfer = new DataTransfer();
      transfer.items.add(selected);
      picker.files = transfer.files;
      picker.dispatchEvent(new Event('change', { bubbles: true }));
      expect(host.componentInstance.changes).toEqual([]);
      expect(host.componentInstance.model).toBe('<p>Hello</p>');
      expect(host.componentInstance.files).toEqual([[selected]]);
      engine.editor.commands.setTextSelection(6);
      engine.editor.commands.insertContent('!');
      expect(host.componentInstance.changes.length).toBe(1);
      expect(typeof host.componentInstance.changes[0]).toBe('string');
      expect(host.componentInstance.model).toBe(engine.getContent());
    } finally {
      host.destroy();
    }
  });
});

describe('SdEditorSurface server preview', () => {
  it('renders escaped source without constructing a browser editor or active HTML', async () => {
    await TestBed.configureTestingModule({
      imports: [SdEditorSurface, NoopAnimationsModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    }).compileComponents();
    const fixture = TestBed.createComponent(SdEditorSurface);
    const ready = jasmine.createSpy('ready');
    fixture.componentInstance.engineReady.subscribe(ready);
    const source = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    fixture.componentRef.setInput('content', source);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.engine()).toBeNull();
    expect(ready).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('pre').textContent).toContain(source);
    expect(fixture.nativeElement.querySelector('img,script')).toBeNull();
    fixture.destroy();
  });
});
