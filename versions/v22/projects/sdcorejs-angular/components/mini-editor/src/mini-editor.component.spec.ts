import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import {
  SdEditorEngine,
  SdEditorImportDiagnostic,
  SdEditorMentionFeed,
  SdEditorMentionItem,
  SdEditorSurface,
} from '@sdcorejs/angular/components/editor-engine';
import { SdMiniEditor } from './mini-editor.component';
import { SdMiniEditorOption } from './mini-editor.model';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-editor-surface',
  standalone: true,
  template: '',
})
class SurfaceStub {
  readonly content = input('');
  readonly format = input('html');
  readonly variant = input('full');
  readonly editable = input(true);
  readonly placeholder = input<string>();
  readonly disabled = input(false);
  readonly height = input<string>();
  readonly maxHeight = input<string>();
  readonly mentionFeeds = input<readonly SdEditorMentionFeed[]>();
  readonly engineReady = output<SdEditorEngine>();
  readonly change = output<string>();
  readonly sourceChange = output<'source' | 'editable' | 'format' | void>();
  readonly formatChange = output<string | undefined>();
  readonly focus = output<FocusEvent>();
  readonly blur = output<FocusEvent>();
  readonly diagnostics = output<readonly SdEditorImportDiagnostic[]>();
  readonly mentionSelected = output<SdEditorMentionItem>();
  readonly compositionChange = output<boolean>();
}
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdMiniEditor, ReactiveFormsModule],
  template: '<sd-mini-editor [option]="option" [formControl]="control" />',
})
class FormHost {
  option: SdMiniEditorOption = {};
  control = new FormControl('<p>Initial</p>');
}
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdMiniEditor, FormsModule],
  template: '<sd-mini-editor [option]="option" [(ngModel)]="value" />',
})
class ModelHost {
  option: SdMiniEditorOption = {};
  value = '<p>Model</p>';
}

function engineMock(initial = '') {
  const engine = {
    format: 'html' as const,
    value: initial,
    getContent: jasmine.createSpy('getContent').and.callFake(() => engine.value),
    getHtml: jasmine.createSpy('getHtml').and.callFake(() => engine.value),
    setContent: jasmine.createSpy('setContent').and.callFake((value: string) => {
      engine.value = value;
    }),
    focus: jasmine.createSpy('focus'),
    destroy: jasmine.createSpy('destroy'),
    insertMention: jasmine.createSpy('insertMention'),
    getMentions: jasmine.createSpy('getMentions').and.returnValue([{ id: 'identity', name: 'User', marker: '@' }]),
  };
  return engine;
}

describe('SdMiniEditor shared engine adapter contracts', () => {
  let fixture: ComponentFixture<SdMiniEditor>;
  let component: SdMiniEditor;
  let surface: SurfaceStub;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdMiniEditor, FormHost, ModelHost] })
      .overrideComponent(SdMiniEditor, { remove: { imports: [SdEditorSurface] }, add: { imports: [SurfaceStub] } })
      .compileComponents();
    fixture = TestBed.createComponent(SdMiniEditor);
    fixture.componentRef.setInput('option', {});
    fixture.detectChanges();
    component = fixture.componentInstance;
    surface = fixture.debugElement.query(By.directive(SurfaceStub)).componentInstance;
  });
  it('keeps required option, value default, disabled default and compact surface', () => {
    expect(component.value).toBe('');
    expect(component.disabled()).toBeFalse();
    expect(surface.variant()).toBe('compact');
    expect(surface.editable()).toBeTrue();
    expect(component.maxEditorHeight).toBeUndefined();
    expect('Editor' in component).toBeFalse();
    expect('editorConfig' in component).toBeFalse();
    expect('onReady' in component).toBeFalse();
  });
  it('forwards placeholder, height, maxHeight, format and enabled mention feeds', () => {
    const feeds: SdEditorMentionFeed[] = [{ marker: '@', feed: [{ id: 'real-id', name: 'Real' }] }];
    fixture.componentRef.setInput('option', {
      placeholder: 'Write',
      height: '80px',
      maxHeight: '160px',
      outputFormat: 'markdown',
      enableMention: true,
      mentionConfig: { feeds },
    });
    fixture.detectChanges();
    expect(surface.placeholder()).toBe('Write');
    expect(surface.height()).toBe('80px');
    expect(surface.maxHeight()).toBe('160px');
    expect(surface.format()).toBe('markdown');
    expect(surface.mentionFeeds()).toBe(feeds);
    expect(component.maxEditorHeight).toBe('160px');
  });
  it('stores setContent before the surface is ready (behavioral RED regression)', () => {
    component.setContent('<p>Before mount</p>');
    fixture.detectChanges();
    expect(component.value).toBe('<p>Before mount</p>');
    expect(surface.content()).toBe('<p>Before mount</p>');
    expect(component.getContent()).toBe('');
    expect(component.getHtmlContent()).toBe('');
  });
  it('synchronizes direct value input before and after ready without outputs', () => {
    const changed = jasmine.createSpy('changed');
    component.valueChange.subscribe(changed);
    fixture.componentRef.setInput('value', '<p>External</p>');
    fixture.detectChanges();
    expect(surface.content()).toBe('<p>External</p>');
    const engine = engineMock('<p>External</p>');
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    fixture.componentRef.setInput('value', '<p>Replacement</p>');
    fixture.detectChanges();
    expect(engine.setContent).toHaveBeenCalledOnceWith('<p>Replacement</p>', 'html');
    expect(changed).not.toHaveBeenCalled();
  });
  it('normalizes nullish CVA writes and retains unsafe source without changing its caller value', () => {
    const unsafe = '<p onclick="x()">Original</p>';
    component.writeValue(unsafe);
    expect(component.value).toBe(unsafe);
    expect(component.surfaceContent()).toBe(unsafe);
    component.writeValue(null as never);
    expect(component.value).toBe('');
  });
  it('calls CVA, both outputs and option callback in the established order', fakeAsync(() => {
    const order: string[] = [];
    component.registerOnChange(value => order.push('cva:' + value));
    component.valueChange.subscribe(value => order.push('value:' + value));
    component.contentChange.subscribe(value => order.push('content:' + value));
    component.option = { onChange: value => order.push('option:' + value) };
    surface.change.emit('<p>User</p>');
    expect(order).toEqual(['cva:<p>User</p>', 'value:<p>User</p>', 'content:<p>User</p>', 'option:<p>User</p>']);
    expect(component.value).toBe('<p>User</p>');
    tick(500);
  }));
  it('throttles at 500ms with leading and trailing values, and continued windows', fakeAsync(() => {
    const values: string[] = [];
    component.contentChange.subscribe(value => values.push(value));
    surface.change.emit('first');
    tick(100);
    surface.change.emit('second');
    tick(100);
    surface.change.emit('third');
    expect(values).toEqual(['first']);
    tick(299);
    expect(values).toEqual(['first']);
    tick(1);
    expect(values).toEqual(['first', 'third']);
    surface.change.emit('fourth');
    tick(500);
    expect(values).toEqual(['first', 'third', 'fourth']);
    tick(500);
  }));
  for (const update of [
    { name: 'placeholder', option: { placeholder: 'Updated' } },
    { name: 'maxHeight', option: { maxHeight: '240px' } },
    { name: 'onChange callback', option: {} },
    { name: 'equivalent default html format', option: { outputFormat: 'html' as const } },
  ]) {
    it(`preserves the pending final CVA value and outputs when ${update.name} changes (B1 RED)`, fakeAsync(() => {
      const order: string[] = [];
      const originalCallback = jasmine.createSpy('original onChange').and.callFake((value: string) => order.push('original:' + value));
      const replacementCallback = jasmine
        .createSpy('replacement onChange')
        .and.callFake((value: string) => order.push('replacement:' + value));
      component.registerOnChange(value => order.push('cva:' + value));
      component.valueChange.subscribe(value => order.push('value:' + value));
      component.contentChange.subscribe(value => order.push('content:' + value));
      fixture.componentRef.setInput('option', { onChange: originalCallback });
      fixture.detectChanges();
      surface.change.emit('<p>Leading</p>');
      tick(100);
      surface.change.emit('<p>Final</p>');
      const callbackChanged = update.name === 'onChange callback';
      fixture.componentRef.setInput('option', {
        ...update.option,
        onChange: callbackChanged ? replacementCallback : originalCallback,
      });
      fixture.detectChanges();
      tick(399);
      expect(order).toEqual(['cva:<p>Leading</p>', 'value:<p>Leading</p>', 'content:<p>Leading</p>', 'original:<p>Leading</p>']);
      tick(1);
      expect(order).toEqual([
        'cva:<p>Leading</p>',
        'value:<p>Leading</p>',
        'content:<p>Leading</p>',
        'original:<p>Leading</p>',
        'cva:<p>Final</p>',
        'value:<p>Final</p>',
        'content:<p>Final</p>',
        `${callbackChanged ? 'replacement' : 'original'}:<p>Final</p>`,
      ]);
      expect(component.value).toBe('<p>Final</p>');
      expect(originalCallback).toHaveBeenCalledTimes(callbackChanged ? 1 : 2);
      expect(replacementCallback).toHaveBeenCalledTimes(callbackChanged ? 1 : 0);
      tick(1000);
      expect(order.length).toBe(8);
    }));
  }
  it('delivers the converted latest value at the retained deadline after an output format transition (B2)', fakeAsync(() => {
    const changed = jasmine.createSpy('changed');
    component.registerOnChange(changed);
    component.valueChange.subscribe(changed);
    component.contentChange.subscribe(changed);
    fixture.componentRef.setInput('option', { onChange: changed });
    fixture.detectChanges();
    surface.change.emit('<p>Leading</p>');
    tick(100);
    surface.change.emit('<p>Final</p>');
    fixture.componentRef.setInput('option', { outputFormat: 'markdown', onChange: changed });
    fixture.detectChanges();
    surface.sourceChange.emit('format');
    surface.formatChange.emit('Final');
    tick(399);
    expect(changed.calls.allArgs()).toEqual(Array.from({ length: 4 }, () => ['<p>Leading</p>']));
    tick(1);
    expect(changed.calls.allArgs()).toEqual([
      ...Array.from({ length: 4 }, () => ['<p>Leading</p>']),
      ...Array.from({ length: 4 }, () => ['Final']),
    ]);
    expect(component.value).toBe('Final');
    tick(1000);
    expect(changed.calls.count()).toBe(8);
  }));
  it('does not duplicate the leading value when there is no trailing edit', fakeAsync(() => {
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.change.emit('single');
    tick(1000);
    expect(values).toEqual(['single']);
  }));
  it('external write cancels pending trailing content and starts a fresh throttle window', fakeAsync(() => {
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.change.emit('first');
    surface.change.emit('stale');
    component.writeValue('authoritative');
    tick(500);
    expect(values).toEqual(['first']);
    surface.change.emit('new');
    expect(values).toEqual(['first', 'new']);
    tick(500);
  }));
  it('source generation cancellation suppresses stale trailing composition callbacks', fakeAsync(() => {
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.change.emit('before');
    surface.change.emit('stale');
    surface.sourceChange.emit();
    tick(1000);
    expect(values).toEqual(['before']);
  }));
  it('consumer echoes retain the current engine selection/history and throttle window', fakeAsync(() => {
    const engine = engineMock();
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    engine.value = 'leading';
    surface.change.emit('leading');
    component.writeValue('leading');
    engine.value = 'trailing';
    surface.change.emit('trailing');
    expect(engine.setContent).not.toHaveBeenCalled();
    tick(500);
    expect(values).toEqual(['leading', 'trailing']);
    tick(500);
  }));
  it('honors resetting an emitted value while a different live trailing edit is pending (R1 RED)', fakeAsync(() => {
    const engine = engineMock();
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    engine.value = '<p>A</p>';
    surface.change.emit(engine.value);
    tick(50);
    engine.value = '<p>B</p>';
    surface.change.emit(engine.value);
    component.writeValue('<p>A</p>');
    tick(1000);
    expect(engine.setContent).toHaveBeenCalledOnceWith('<p>A</p>', 'html');
    expect(engine.value).toBe('<p>A</p>');
    expect(values).toEqual(['<p>A</p>']);
    expect(component.value).toBe('<p>A</p>');
  }));
  it('resets an actually edited engine document to its emitted CVA value before trailing emission (R1 real engine RED)', fakeAsync(() => {
    const host = document.createElement('div');
    fixture.nativeElement.appendChild(host);
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    const engine = new SdEditorEngine(host, {
      onChange: value => surface.change.emit(value),
      onSourceChange: () => surface.sourceChange.emit(),
    });
    try {
      surface.engineReady.emit(engine);
      engine.editor.commands.insertContent('A');
      const valueA = component.value;
      engine.editor.commands.insertContent('B');
      expect(engine.getContent()).not.toBe(valueA);
      component.writeValue(valueA);
      tick(1000);
      expect(engine.getContent()).toBe(valueA);
      expect(component.value).toBe(valueA);
      expect(values).toEqual([valueA]);
    } finally {
      engine.destroy();
      host.remove();
    }
  }));
  it('pauses a trailing throttle window during composition and emits the latest value at the retained deadline (R4 RED)', fakeAsync(() => {
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.change.emit('leading');
    tick(100);
    surface.change.emit('pending');
    surface.compositionChange.emit(true);
    tick(500);
    expect(values).toEqual(['leading']);
    surface.change.emit('final IME');
    expect(values).toEqual(['leading']);
    surface.compositionChange.emit(false);
    tick(0);
    expect(values).toEqual(['leading', 'final IME']);
    tick(1000);
    expect(values).toEqual(['leading', 'final IME']);
  }));
  it('preserves the remaining throttle time when composition ends before the deadline (R4 RED)', fakeAsync(() => {
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.change.emit('leading');
    tick(100);
    surface.change.emit('pending');
    surface.compositionChange.emit(true);
    tick(100);
    surface.change.emit('final IME');
    surface.compositionChange.emit(false);
    tick(299);
    expect(values).toEqual(['leading']);
    tick(1);
    expect(values).toEqual(['leading', 'final IME']);
    tick(500);
  }));
  it('defers a fresh leading change until composition ends and does not duplicate it (R4 RED)', fakeAsync(() => {
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.compositionChange.emit(true);
    surface.change.emit('final');
    tick(600);
    expect(values).toEqual([]);
    surface.compositionChange.emit(false);
    tick(0);
    expect(values).toEqual(['final']);
    tick(1000);
    expect(values).toEqual(['final']);
  }));
  it('external source replacement cancels a paused trailing value without emitting it (R4 RED)', fakeAsync(() => {
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.change.emit('leading');
    surface.change.emit('old');
    surface.compositionChange.emit(true);
    tick(600);
    component.writeValue('server');
    surface.sourceChange.emit();
    surface.compositionChange.emit(false);
    tick(1000);
    expect(values).toEqual(['leading']);
    expect(component.value).toBe('server');
  }));
  it('notifies the CVA touched callback on editable blur (behavioral RED regression)', () => {
    const touched = jasmine.createSpy('touched');
    component.registerOnTouched(touched);
    const event = new FocusEvent('blur');
    const blur = jasmine.createSpy('blur');
    component.blur.subscribe(blur);
    const callback = jasmine.createSpy('onBlur');
    component.option = { onBlur: callback };
    surface.blur.emit(event);
    expect(touched).toHaveBeenCalledTimes(1);
    expect(blur).toHaveBeenCalledOnceWith(event);
    expect(callback).toHaveBeenCalledOnceWith(event);
  });
  it('keeps exact FocusEvent identity for focus and its option callback', () => {
    const event = new FocusEvent('focus');
    const focus = jasmine.createSpy('focus');
    component.focus.subscribe(focus);
    const callback = jasmine.createSpy('onFocus');
    component.option = { onFocus: callback };
    surface.focus.emit(event);
    expect(focus).toHaveBeenCalledOnceWith(event);
    expect(callback).toHaveBeenCalledOnceWith(event);
  });
  it('combines disabled input and CVA disable with OR semantics', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(surface.editable()).toBeFalse();
    fixture.componentRef.setInput('disabled', true);
    component.setDisabledState(false);
    fixture.detectChanges();
    expect(surface.editable()).toBeFalse();
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(surface.editable()).toBeTrue();
    component.setDisabledState(true);
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(surface.editable()).toBeFalse();
  });
  it('disable cancels pending values and prevents user callbacks', fakeAsync(() => {
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.change.emit('first');
    surface.change.emit('stale');
    component.setDisabledState(true);
    surface.change.emit('disabled');
    tick(1000);
    expect(values).toEqual(['first']);
  }));
  it('exposes readonly diagnostic state and emits warning without a value mutation', () => {
    const value = '<dl><dt>Source</dt></dl>';
    component.writeValue(value);
    const warning = jasmine.createSpy('warning');
    const change = jasmine.createSpy('change');
    component.importWarning.subscribe(warning);
    component.valueChange.subscribe(change);
    const diagnostics: SdEditorImportDiagnostic[] = [{ code: 'unsupported-html', path: '/dl', tag: 'dl', detail: 'Unsupported structure' }];
    surface.diagnostics.emit(diagnostics);
    expect(component.importDiagnostics()).toBe(diagnostics);
    expect(warning).toHaveBeenCalledOnceWith(diagnostics);
    expect(change).not.toHaveBeenCalled();
    expect(component.value).toBe(value);
  });
  it('delegates safe HTML/format getters and propagates export errors', () => {
    const engine = engineMock('**Markdown**');
    engine.getHtml.and.returnValue('<p><strong>Markdown</strong></p>');
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    expect(component.getContent()).toBe('**Markdown**');
    expect(component.getHtmlContent()).toBe('<p><strong>Markdown</strong></p>');
    engine.getContent.and.throwError('blocked export');
    expect(() => component.getContent()).toThrowError('blocked export');
  });
  it('delegates mention identity/getters and default feed marker', () => {
    component.option = { enableMention: true, mentionConfig: { feeds: [{ marker: '#', feed: [] }] } };
    const engine = engineMock();
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    component.insertMention({ id: 'identity', name: 'User' });
    expect(engine.insertMention).toHaveBeenCalledOnceWith({ id: 'identity', name: 'User', marker: '#' });
    expect(component.getMentions()).toEqual([{ id: 'identity', name: 'User', marker: '@' }]);
  });
  it('calls mention selection callback with the library-owned feed item', () => {
    const callback = jasmine.createSpy('onMentionSelect');
    component.option = { onMentionSelect: callback };
    const item = { id: 'untouched-id', name: 'User', data: { role: 'customer' } };
    surface.mentionSelected.emit(item);
    expect(callback).toHaveBeenCalledOnceWith(item);
  });
  it('ignores mention insertion while disabled or mention option is off', () => {
    const engine = engineMock();
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    component.insertMention({ id: '1', name: 'User' });
    expect(engine.insertMention).not.toHaveBeenCalled();
    component.option = { enableMention: true };
    component.setDisabledState(true);
    component.insertMention({ id: '1', name: 'User' });
    expect(engine.insertMention).not.toHaveBeenCalled();
  });
  it('delegates focus without owning engine destruction and cancels destroyed timers', fakeAsync(() => {
    const engine = engineMock();
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    component.focusEditor();
    expect(engine.focus).toHaveBeenCalledTimes(1);
    const values: string[] = [];
    component.valueChange.subscribe(value => values.push(value));
    surface.change.emit('first');
    surface.change.emit('stale');
    fixture.destroy();
    tick(1000);
    expect(values).toEqual(['first']);
    expect(engine.destroy).not.toHaveBeenCalled();
  }));
  it('integrates reactive forms initial value, external writes, touched, change and disabled', fakeAsync(() => {
    const host = TestBed.createComponent(FormHost);
    host.detectChanges();
    const adapter: SdMiniEditor = host.debugElement.query(By.directive(SdMiniEditor)).componentInstance;
    expect(adapter.surfaceContent()).toBe('<p>Initial</p>');
    host.componentInstance.control.setValue('<p>Server</p>');
    host.detectChanges();
    expect(adapter.surfaceContent()).toBe('<p>Server</p>');
    adapter.onSurfaceBlur(new FocusEvent('blur'));
    expect(host.componentInstance.control.touched).toBeTrue();
    adapter.onSurfaceChange('<p>Edited</p>');
    expect(host.componentInstance.control.value).toBe('<p>Edited</p>');
    host.componentInstance.control.disable();
    host.detectChanges();
    expect(adapter.effectiveDisabled()).toBeTrue();
    host.destroy();
    tick(500);
  }));
  it('integrates ngModel initial value and user writes', fakeAsync(() => {
    const host = TestBed.createComponent(ModelHost);
    host.detectChanges();
    tick();
    host.detectChanges();
    const adapter: SdMiniEditor = host.debugElement.query(By.directive(SdMiniEditor)).componentInstance;
    expect(adapter.surfaceContent()).toBe('<p>Model</p>');
    adapter.onSurfaceChange('<p>Edited model</p>');
    tick();
    expect(host.componentInstance.value).toBe('<p>Edited model</p>');
    host.destroy();
    tick(500);
  }));
});
