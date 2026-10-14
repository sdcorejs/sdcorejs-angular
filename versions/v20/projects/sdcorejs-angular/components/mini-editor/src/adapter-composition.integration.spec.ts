import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdEditorImportError, SdEditorSurface } from '@sdcorejs/angular/components/editor-engine';
import { SdNotifyService } from '@sdcorejs/angular/services';
import { SdEditor } from '../../editor/src/editor.component';
import { SdMiniEditor } from './mini-editor.component';

describe('Adapter composition with actual Angular surface and engine (R4)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdEditor, SdMiniEditor, NoopAnimationsModule],
      providers: [{ provide: SdNotifyService, useValue: { warning: () => {} } }],
    }).compileComponents();
  });
  it('pauses a real Editor debounce across native composition and emits only the final document', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdEditor);
    const values: string[] = [];
    fixture.componentInstance.sdChange.subscribe(value => values.push(value));
    fixture.detectChanges();
    flushMicrotasks();
    tick(16);
    fixture.detectChanges();
    const surface: SdEditorSurface = fixture.debugElement.query(By.directive(SdEditorSurface)).componentInstance;
    const engine = surface.engine()!;
    expect(engine).not.toBeNull();
    try {
      engine.editor.commands.insertContent('A');
      tick(20);
      engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart'));
      tick(200);
      expect(values).toEqual([]);
      engine.editor.commands.insertContent('B');
      expect(values).toEqual([]);
      engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend'));
      const final = engine.getContent();
      tick(0);
      expect(values).toEqual([final]);
      tick(1000);
      expect(values).toEqual([final]);
    } finally {
      fixture.destroy();
    }
  }));
  it('pauses a real Mini trailing throttle across native composition and emits only the final document', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdMiniEditor);
    fixture.componentRef.setInput('option', {});
    const values: string[] = [];
    fixture.componentInstance.valueChange.subscribe(value => values.push(value));
    fixture.detectChanges();
    flushMicrotasks();
    tick(16);
    fixture.detectChanges();
    const surface: SdEditorSurface = fixture.debugElement.query(By.directive(SdEditorSurface)).componentInstance;
    const engine = surface.engine()!;
    expect(engine).not.toBeNull();
    try {
      engine.editor.commands.insertContent('A');
      const leading = engine.getContent();
      engine.editor.commands.insertContent('B');
      engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart'));
      tick(600);
      expect(values).toEqual([leading]);
      engine.editor.commands.insertContent('C');
      expect(values).toEqual([leading]);
      engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend'));
      const final = engine.getContent();
      tick(0);
      expect(values).toEqual([leading, final]);
      tick(1000);
      expect(values).toEqual([leading, final]);
    } finally {
      fixture.destroy();
    }
  }));
});

describe('Mini option updates with actual Angular surface and engine (B1)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdMiniEditor, NoopAnimationsModule] }).compileComponents();
  });
  it('delivers the live trailing edit through CVA, both outputs and the updated callback after ordinary option changes (B1 RED)', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdMiniEditor);
    const adapter = fixture.componentInstance;
    const order: string[] = [];
    adapter.registerOnChange(value => order.push('cva:' + value));
    adapter.valueChange.subscribe(value => order.push('value:' + value));
    adapter.contentChange.subscribe(value => order.push('content:' + value));
    fixture.componentRef.setInput('option', { onChange: (value: string) => order.push('original:' + value) });
    fixture.detectChanges();
    flushMicrotasks();
    tick(16);
    fixture.detectChanges();
    const surface: SdEditorSurface = fixture.debugElement.query(By.directive(SdEditorSurface)).componentInstance;
    const engine = surface.engine()!;
    try {
      engine.editor.commands.insertContent('A');
      const leading = engine.getContent();
      tick(100);
      engine.editor.commands.insertContent('B');
      const final = engine.getContent();
      expect(final).not.toBe(leading);
      fixture.componentRef.setInput('option', {
        placeholder: 'Updated',
        maxHeight: '240px',
        onChange: (value: string) => order.push('replacement:' + value),
      });
      fixture.detectChanges();
      expect(engine.getContent()).toBe(final);
      tick(399);
      expect(order).toEqual(['cva:' + leading, 'value:' + leading, 'content:' + leading, 'original:' + leading]);
      tick(1);
      expect(order).toEqual([
        'cva:' + leading,
        'value:' + leading,
        'content:' + leading,
        'original:' + leading,
        'cva:' + final,
        'value:' + final,
        'content:' + final,
        'replacement:' + final,
      ]);
      expect(adapter.value).toBe(final);
      tick(1000);
      expect(order.length).toBe(8);
    } finally {
      fixture.destroy();
    }
  }));
  it('delivers the live latest document in the converted format to the CVA and outputs (B2)', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdMiniEditor);
    const adapter = fixture.componentInstance;
    const changed = jasmine.createSpy('changed');
    adapter.registerOnChange(changed);
    adapter.valueChange.subscribe(changed);
    adapter.contentChange.subscribe(changed);
    fixture.componentRef.setInput('option', { onChange: changed });
    fixture.detectChanges();
    flushMicrotasks();
    tick(16);
    fixture.detectChanges();
    const surface: SdEditorSurface = fixture.debugElement.query(By.directive(SdEditorSurface)).componentInstance;
    const engine = surface.engine()!;
    try {
      engine.editor.commands.insertContent('A');
      const leading = engine.getContent();
      tick(100);
      engine.editor.commands.insertContent('B');
      const liveHtml = engine.getHtml();
      fixture.componentRef.setInput('option', { outputFormat: 'markdown', onChange: changed });
      fixture.detectChanges();
      tick(399);
      expect(engine.getHtml()).toBe(liveHtml);
      expect(engine.getContent()).toBe('AB');
      expect(changed.calls.allArgs()).toEqual(Array.from({ length: 4 }, () => [leading]));
      tick(1);
      expect(adapter.value).toBe('AB');
      expect(changed.calls.allArgs()).toEqual([...Array.from({ length: 4 }, () => [leading]), ...Array.from({ length: 4 }, () => ['AB'])]);
      engine.editor.commands.insertContent('C');
      const fresh = engine.getContent();
      expect(fresh).toBe('ABC');
      tick(500);
      expect(changed.calls.allArgs()).toEqual([
        ...Array.from({ length: 4 }, () => [leading]),
        ...Array.from({ length: 4 }, () => ['AB']),
        ...Array.from({ length: 4 }, () => [fresh]),
      ]);
      tick(1000);
      expect(changed.calls.count()).toBe(12);
    } finally {
      fixture.destroy();
    }
  }));
  it('delivers one changed representation when an idle document switches format', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdMiniEditor);
    const adapter = fixture.componentInstance;
    const changed = jasmine.createSpy('changed');
    adapter.registerOnChange(changed);
    fixture.componentRef.setInput('option', {});
    fixture.detectChanges();
    flushMicrotasks();
    tick(16);
    fixture.detectChanges();
    const engine = (fixture.debugElement.query(By.directive(SdEditorSurface)).componentInstance as SdEditorSurface).engine()!;
    try {
      engine.editor.commands.insertContent('A');
      tick(1000);
      changed.calls.reset();
      const html = engine.getHtml();
      fixture.componentRef.setInput('option', { outputFormat: 'markdown' });
      fixture.detectChanges();
      expect(engine.getHtml()).toBe(html);
      expect(adapter.value).toBe('A');
      expect(changed.calls.allArgs()).toEqual([['A']]);
      tick(1000);
      expect(changed.calls.count()).toBe(1);
    } finally {
      fixture.destroy();
    }
  }));
  it('retains a pending rich edit through rejected Markdown conversion and delivers it when HTML is restored', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdMiniEditor);
    const adapter = fixture.componentInstance;
    const changed = jasmine.createSpy('changed');
    adapter.registerOnChange(changed);
    fixture.componentRef.setInput('option', {});
    fixture.componentRef.setInput('value', '<p style="text-align:center">text</p>');
    fixture.detectChanges();
    flushMicrotasks();
    tick(16);
    fixture.detectChanges();
    const engine = (fixture.debugElement.query(By.directive(SdEditorSurface)).componentInstance as SdEditorSurface).engine()!;
    try {
      engine.editor.commands.insertContent('A');
      const leading = engine.getContent();
      tick(100);
      engine.editor.commands.insertContent('B');
      const latest = engine.getHtml();
      fixture.componentRef.setInput('option', { outputFormat: 'markdown' });
      fixture.detectChanges();
      tick(1000);
      expect(engine.diagnostics.some(item => item.code === 'markdown-loss')).toBeTrue();
      expect(() => adapter.getContent()).toThrowError(SdEditorImportError);
      expect(engine.getHtml()).toBe(latest);
      expect(changed.calls.allArgs()).toEqual([[leading]]);
      fixture.componentRef.setInput('option', { outputFormat: 'html' });
      fixture.detectChanges();
      tick(0);
      expect(adapter.value).toBe(latest);
      expect(changed.calls.allArgs()).toEqual([[leading], [latest]]);
      tick(1000);
      expect(changed.calls.count()).toBe(2);
    } finally {
      fixture.destroy();
    }
  }));
  it('delivers the converted final composition once after a queued format transition', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdMiniEditor);
    const adapter = fixture.componentInstance;
    const changed = jasmine.createSpy('changed');
    adapter.registerOnChange(changed);
    fixture.componentRef.setInput('option', {});
    fixture.detectChanges();
    flushMicrotasks();
    tick(16);
    fixture.detectChanges();
    const engine = (fixture.debugElement.query(By.directive(SdEditorSurface)).componentInstance as SdEditorSurface).engine()!;
    try {
      engine.editor.commands.insertContent('A');
      const leading = engine.getContent();
      engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionstart'));
      engine.editor.commands.insertContent('B');
      fixture.componentRef.setInput('option', { outputFormat: 'markdown' });
      fixture.detectChanges();
      tick(600);
      engine.editor.commands.insertContent('C');
      expect(changed.calls.allArgs()).toEqual([[leading]]);
      engine.editor.view.dom.dispatchEvent(new CompositionEvent('compositionend'));
      tick(0);
      expect(engine.getContent()).toBe('ABC');
      expect(adapter.value).toBe('ABC');
      expect(changed.calls.allArgs()).toEqual([[leading], ['ABC']]);
      tick(1000);
      expect(changed.calls.count()).toBe(2);
    } finally {
      fixture.destroy();
    }
  }));
  it('keeps simultaneous authoritative content and format inputs silent and cancels the superseded trailing edit', fakeAsync(() => {
    const fixture = TestBed.createComponent(SdMiniEditor);
    const adapter = fixture.componentInstance;
    const changed = jasmine.createSpy('changed');
    adapter.registerOnChange(changed);
    fixture.componentRef.setInput('option', {});
    fixture.detectChanges();
    flushMicrotasks();
    tick(16);
    fixture.detectChanges();
    const engine = (fixture.debugElement.query(By.directive(SdEditorSurface)).componentInstance as SdEditorSurface).engine()!;
    try {
      engine.editor.commands.insertContent('A');
      const leading = engine.getContent();
      tick(100);
      engine.editor.commands.insertContent('B');
      fixture.componentRef.setInput('option', { outputFormat: 'markdown' });
      fixture.componentRef.setInput('value', '**server**');
      fixture.detectChanges();
      tick(1000);
      expect(engine.getContent()).toBe('**server**');
      // Markdown parsing appends a newline after a block; the complete markup remains exact.
      expect(engine.getHtml().trim()).toBe('<p><strong>server</strong></p>');
      expect(adapter.value).toBe('**server**');
      expect(changed.calls.allArgs()).toEqual([[leading]]);
    } finally {
      fixture.destroy();
    }
  }));
});
