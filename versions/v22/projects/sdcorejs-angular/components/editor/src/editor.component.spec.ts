import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  SdEditorEngine,
  SdEditorImageAttributes,
  SdEditorImportDiagnostic,
  SdEditorSurface,
} from '@sdcorejs/angular/components/editor-engine';
import { SdNotifyService } from '@sdcorejs/angular/services';
import { SdEditor } from './editor.component';
import { SD_EDITOR_CONFIGURATION } from './configurations';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-editor-surface',
  standalone: true,
  template: '',
})
class SurfaceStub {
  readonly content = input('');
  readonly variant = input('full');
  readonly editable = input(true);
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly placeholder = input<string>();
  readonly height = input<string>();
  readonly maxHeight = input<string>();
  readonly uploadEnabled = input(false);
  readonly label = input<string>();
  readonly describedBy = input<string>();
  readonly invalid = input(false);
  readonly engineReady = output<SdEditorEngine>();
  readonly change = output<string>();
  readonly sourceChange = output<void>();
  readonly focus = output<FocusEvent>();
  readonly blur = output<FocusEvent>();
  readonly diagnostics = output<readonly SdEditorImportDiagnostic[]>();
  readonly filesSelected = output<File[]>();
  readonly compositionChange = output<boolean>();
}
function engineMock(initial = '') {
  const sources = new Set<string>();
  const engine = {
    value: initial,
    getContent: jasmine.createSpy('getContent').and.callFake(() => engine.value),
    getHtml: jasmine.createSpy('getHtml').and.callFake(() => engine.value),
    setContent: jasmine.createSpy('setContent').and.callFake((value: string) => {
      engine.value = value;
    }),
    focus: jasmine.createSpy('focus'),
    destroy: jasmine.createSpy('destroy'),
    activeImageSources: () => sources,
    insertImage: jasmine.createSpy('insertImage').and.callFake((attributes: SdEditorImageAttributes) => sources.add(attributes.src)),
    replaceImage: jasmine.createSpy('replaceImage').and.callFake((source: string, attributes: SdEditorImageAttributes) => {
      sources.delete(source);
      sources.add(attributes.src);
      return true;
    }),
  };
  return engine;
}

describe('SdEditor shared engine adapter contracts', () => {
  let fixture: ComponentFixture<SdEditor>;
  let component: SdEditor;
  let surface: SurfaceStub;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdEditor, NoopAnimationsModule],
      providers: [{ provide: SdNotifyService, useValue: { warning: jasmine.createSpy('warning') } }],
    })
      .overrideComponent(SdEditor, { remove: { imports: [SdEditorSurface] }, add: { imports: [SurfaceStub] } })
      .compileComponents();
    fixture = TestBed.createComponent(SdEditor);
    fixture.detectChanges();
    component = fixture.componentInstance;
    surface = fixture.debugElement.query(By.directive(SurfaceStub)).componentInstance;
  });
  it('preserves input defaults, selector flags, generated name and model alias', () => {
    expect(component.option()).toEqual({});
    expect(component.height()).toBe('250px');
    expect(component.maxHeight()).toBe('250px');
    expect(component.valueModel()).toBe('');
    expect(component.required()).toBeFalse();
    expect(component.disabled()).toBeFalse();
    expect(component.readonly()).toBeFalse();
    expect(component.hideInlineError()).toBeFalse();
    expect(component.name()).toBeTruthy();
    expect(component.maxlength()).toBeUndefined();
    expect(surface.variant()).toBe('full');
    expect(surface.content()).toBe('');
    expect(surface.uploadEnabled()).toBeFalse();
    expect('Editor' in component).toBeFalse();
    expect('editorConfig' in component).toBeFalse();
    expect('onReady' in component).toBeFalse();
  });
  it('coerces boolean inputs and renders data-disabled and raw-string data-empty', () => {
    fixture.componentRef.setInput('disabled', '');
    fixture.componentRef.setInput('model', '  ');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement.querySelector('.sd-editor');
    expect(element.getAttribute('data-disabled')).toBe('true');
    expect(element.getAttribute('data-empty')).toBe('false');
    fixture.componentRef.setInput('disabled', 'false');
    fixture.componentRef.setInput('model', '');
    fixture.detectChanges();
    expect(element.getAttribute('data-disabled')).toBe('false');
    expect(element.getAttribute('data-empty')).toBe('true');
  });
  it('preserves autoId alias and height/placeholder bindings', () => {
    fixture.componentRef.setInput('autoId', 'message');
    fixture.componentRef.setInput('height', '300px');
    fixture.componentRef.setInput('maxHeight', '600px');
    fixture.componentRef.setInput('placeholder', 'Enter');
    fixture.detectChanges();
    expect(component.autoId()).toBe('components-editor-message');
    expect(surface.height()).toBe('300px');
    expect(surface.maxHeight()).toBe('600px');
    expect(surface.placeholder()).toBe('Enter');
    expect(fixture.nativeElement.querySelector('.sd-editor').getAttribute('data-autoId')).toBe('components-editor-message');
  });
  it('initial and external model writes synchronize control and source silently', () => {
    const changed = jasmine.createSpy('sdChange');
    component.sdChange.subscribe(changed);
    const source = '<p class="source"> Original </p>';
    fixture.componentRef.setInput('model', source);
    fixture.detectChanges();
    expect(component.formControl.value).toBe(source);
    expect(surface.content()).toBe(source);
    expect(component.formControl.pristine).toBeTrue();
    expect(changed).not.toHaveBeenCalled();
    const engine = engineMock(source);
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    fixture.componentRef.setInput('model', '<p>Replacement</p>');
    fixture.detectChanges();
    expect(engine.setContent).toHaveBeenCalledOnceWith('<p>Replacement</p>');
    expect(changed).not.toHaveBeenCalled();
  });
  it('normalizes nullish external control and model values to the editor/control empty string', () => {
    fixture.componentRef.setInput('model', null);
    fixture.detectChanges();
    expect(component.formControl.value).toBe('');
    component.formControl.setValue(null);
    fixture.detectChanges();
    expect(component.valueModel()).toBe('');
    expect(surface.content()).toBe('');
  });
  it('registers form/name, rebinds the name and restores a displaced control on destroy', () => {
    const displaced = new FormControl('previous');
    const group = new FormGroup<Record<string, FormControl>>({ first: displaced });
    fixture.componentRef.setInput('form', { form: group });
    fixture.componentRef.setInput('name', 'first');
    fixture.detectChanges();
    expect(group.controls['first']).toBe(component.formControl);
    fixture.componentRef.setInput('name', 'second');
    fixture.detectChanges();
    expect(group.controls['first']).toBe(displaced);
    expect(group.controls['second']).toBe(component.formControl);
    fixture.destroy();
    expect(group.controls['second']).toBeUndefined();
    expect(group.controls['first']).toBe(displaced);
  });
  it('updates model/source from external form changes without sdChange', () => {
    const changed = jasmine.createSpy('sdChange');
    component.sdChange.subscribe(changed);
    component.formControl.setValue('<p>Form update</p>');
    fixture.detectChanges();
    expect(component.valueModel()).toBe('<p>Form update</p>');
    expect(surface.content()).toBe('<p>Form update</p>');
    expect(changed).not.toHaveBeenCalled();
  });
  it('keeps readonly form-enabled and disabled excluded from form value', () => {
    const group = new FormGroup({ other: new FormControl('included') });
    fixture.componentRef.setInput('form', group);
    fixture.componentRef.setInput('name', 'content');
    fixture.detectChanges();
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(component.formControl.enabled).toBeTrue();
    expect(surface.editable()).toBeFalse();
    expect(surface.readonly()).toBeTrue();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.formControl.disabled).toBeTrue();
    expect(surface.disabled()).toBeTrue();
    expect(group.value).toEqual({ other: 'included' });
  });
  it('honors external FormControl.disable and does not enable it when readonly changes', () => {
    component.formControl.disable();
    fixture.detectChanges();
    expect(surface.editable()).toBeFalse();
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(component.formControl.disabled).toBeTrue();
  });
  it('required uses text count and removes figures/images including figure captions', () => {
    fixture.componentRef.setInput('required', true);
    fixture.componentRef.setInput('model', '<figure><figcaption>not counted</figcaption></figure><img src="/x">');
    fixture.detectChanges();
    expect(component._textLength()).toBe(0);
    expect(component.formControl.hasError('required')).toBeTrue();
    fixture.componentRef.setInput('model', '<p>A😀B</p><figure><table><tr><td>not counted</td></tr></table></figure>');
    fixture.detectChanges();
    expect(component._textLength()).toBe(4);
    expect(component.formControl.hasError('required')).toBeFalse();
  });
  it('maxlength validates UTF-16 length without truncating the model', () => {
    fixture.componentRef.setInput('maxlength', 3);
    fixture.componentRef.setInput('model', '<p>A😀B</p>');
    fixture.detectChanges();
    expect(component.formControl.errors?.['maxlength']).toEqual({ requiredLength: 3, actualLength: 4 });
    expect(component.isOverLimit()).toBeTrue();
    expect(component.valueModel()).toBe('<p>A😀B</p>');
    expect(fixture.nativeElement.querySelector('.sd-editor-counter').textContent).toContain('4/3');
  });
  it('uses inline error validation and hideInlineError keeps hidden text/tooltip', () => {
    fixture.componentRef.setInput('inlineError', 'Invalid message');
    fixture.componentRef.setInput('hideInlineError', true);
    component.formControl.markAsTouched();
    fixture.detectChanges();
    expect(component.errorMessage).toBe('Invalid message');
    expect(component.formControl.hasError('inlineError')).toBeTrue();
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Invalid message');
  });
  it('forwards actual editable label, description and invalid state', () => {
    fixture.componentRef.setInput('label', 'Message');
    fixture.componentRef.setInput('helperText', 'Please explain');
    fixture.componentRef.setInput('required', true);
    component.formControl.markAsTouched();
    fixture.detectChanges();
    expect(surface.label()).toBe('Message');
    expect(surface.describedBy()).toBe(component.descriptionId());
    expect(surface.invalid()).toBeTrue();
    expect(fixture.nativeElement.querySelector('#' + component.descriptionId()).textContent).toContain('Please explain');
  });
  it('debounces at 100ms and emits the latest change through model and form', fakeAsync(() => {
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    surface.change.emit('<p>first</p>');
    tick(50);
    surface.change.emit('<p>latest</p>');
    tick(99);
    expect(values).toEqual([]);
    tick(1);
    expect(values).toEqual(['<p>latest</p>']);
    expect(component.valueModel()).toBe('<p>latest</p>');
    expect(component.formControl.value).toBe('<p>latest</p>');
    expect(component._textLength()).toBe(6);
  }));
  it('defensively sanitizes emitted HTML and marks dirty only if sanitation changed it', fakeAsync(() => {
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    surface.change.emit('<p>Clean</p>');
    tick(100);
    expect(component.formControl.pristine).toBeTrue();
    surface.change.emit('<p onclick="x()">Unsafe <a href="javascript:x()">link</a></p>');
    tick(100);
    expect(values[1]).toBe('<p>Unsafe <a>link</a></p>');
    expect(component.formControl.dirty).toBeTrue();
  }));
  it('external writes cancel pending user emissions and remain silent', fakeAsync(() => {
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    surface.change.emit('stale');
    fixture.componentRef.setInput('model', '<p>Server</p>');
    fixture.detectChanges();
    tick(100);
    expect(values).toEqual([]);
    expect(component.valueModel()).toBe('<p>Server</p>');
  }));
  it('engine source generation invalidates pending debounce callbacks', fakeAsync(() => {
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    surface.change.emit('stale');
    surface.sourceChange.emit();
    tick(100);
    expect(values).toEqual([]);
  }));
  it('does not replay equal consumer echoes into engine', fakeAsync(() => {
    const engine = engineMock();
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    engine.value = '<p>User</p>';
    surface.change.emit('<p>User</p>');
    tick(100);
    fixture.componentRef.setInput('model', '<p>User</p>');
    fixture.detectChanges();
    expect(engine.setContent).not.toHaveBeenCalled();
  }));
  it('honors an authoritative reset to an emitted value while a different live edit is pending (R1 RED)', fakeAsync(() => {
    const engine = engineMock();
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    engine.value = '<p>A</p>';
    surface.change.emit(engine.value);
    tick(100);
    fixture.detectChanges();
    engine.value = '<p>B</p>';
    surface.change.emit(engine.value);
    tick(50);
    component.formControl.setValue('<p>A</p>');
    fixture.detectChanges();
    tick(100);
    expect(engine.setContent).toHaveBeenCalledWith('<p>A</p>');
    expect(engine.value).toBe('<p>A</p>');
    expect(values).toEqual(['<p>A</p>']);
    expect(component.valueModel()).toBe('<p>A</p>');
  }));
  it('resets an actually edited engine document to its emitted form value before debounce (R1 real engine RED)', fakeAsync(() => {
    const host = document.createElement('div');
    fixture.nativeElement.appendChild(host);
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    const engine = new SdEditorEngine(host, {
      onChange: value => surface.change.emit(value),
      onSourceChange: () => surface.sourceChange.emit(),
    });
    try {
      surface.engineReady.emit(engine);
      engine.editor.commands.insertContent('A');
      tick(100);
      fixture.detectChanges();
      const valueA = component.valueModel();
      engine.editor.commands.insertContent('B');
      expect(engine.getContent()).not.toBe(valueA);
      tick(50);
      component.formControl.setValue(valueA);
      fixture.detectChanges();
      tick(100);
      expect(engine.getContent()).toBe(valueA);
      expect(component.valueModel()).toBe(valueA);
      expect(values).toEqual([valueA]);
    } finally {
      engine.destroy();
      host.remove();
    }
  }));
  it('pauses a pending debounce during composition and flushes final content at its retained deadline (R4 RED)', fakeAsync(() => {
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    surface.change.emit('<p>Before</p>');
    tick(50);
    surface.compositionChange.emit(true);
    tick(500);
    expect(values).toEqual([]);
    surface.change.emit('<p>Final IME</p>');
    expect(values).toEqual([]);
    surface.compositionChange.emit(false);
    tick(0);
    expect(values).toEqual(['<p>Final IME</p>']);
    tick(1000);
    expect(values).toEqual(['<p>Final IME</p>']);
  }));
  it('keeps a future debounce deadline when composition ends before it expires (R4 RED)', fakeAsync(() => {
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    surface.change.emit('before');
    tick(20);
    surface.compositionChange.emit(true);
    tick(20);
    surface.change.emit('final');
    surface.compositionChange.emit(false);
    tick(59);
    expect(values).toEqual([]);
    tick(1);
    expect(values).toEqual(['final']);
  }));
  it('discards old composition cadence after a silent external source replacement (R4 RED)', fakeAsync(() => {
    const values: string[] = [];
    component.sdChange.subscribe(value => values.push(value));
    surface.change.emit('old');
    surface.compositionChange.emit(true);
    tick(250);
    fixture.componentRef.setInput('model', '<p>Server</p>');
    fixture.detectChanges();
    surface.sourceChange.emit();
    surface.compositionChange.emit(false);
    tick(1000);
    expect(values).toEqual([]);
    expect(component.valueModel()).toBe('<p>Server</p>');
  }));
  it('uses unique stable editable description IDs independently of arbitrary form names (R5 RED)', () => {
    const second = TestBed.createComponent(SdEditor);
    fixture.componentRef.setInput('name', 'same form name');
    fixture.componentRef.setInput('helperText', 'First helper');
    fixture.detectChanges();
    second.componentRef.setInput('name', 'same form name');
    second.componentRef.setInput('helperText', 'Second helper');
    second.detectChanges();
    const firstId = component.descriptionId();
    const secondId = second.componentInstance.descriptionId();
    expect(firstId).not.toMatch(/\s/);
    expect(secondId).not.toMatch(/\s/);
    expect(firstId).not.toBe(secondId);
    fixture.componentRef.setInput('name', 'renamed form');
    fixture.detectChanges();
    expect(component.descriptionId()).toBe(firstId);
    expect(surface.describedBy()).toBe(firstId);
    second.destroy();
  });
  it('disable and readonly cancel pending emissions and suppress edit callbacks', fakeAsync(() => {
    const changed = jasmine.createSpy('changed');
    component.sdChange.subscribe(changed);
    surface.change.emit('stale');
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    tick(100);
    surface.change.emit('readonly');
    tick(100);
    expect(changed).not.toHaveBeenCalled();
    fixture.componentRef.setInput('readonly', false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    surface.change.emit('disabled');
    tick(100);
    expect(changed).not.toHaveBeenCalled();
  }));
  it('preserves exact focus/blur FocusEvent payloads and marks form touched', () => {
    const focus = jasmine.createSpy('focus');
    const blur = jasmine.createSpy('blur');
    component.sdFocus.subscribe(focus);
    component.sdBlur.subscribe(blur);
    const focusEvent = new FocusEvent('focus');
    const blurEvent = new FocusEvent('blur');
    surface.focus.emit(focusEvent);
    surface.blur.emit(blurEvent);
    expect(focus).toHaveBeenCalledOnceWith(focusEvent);
    expect(blur).toHaveBeenCalledOnceWith(blurEvent);
    expect(component.formControl.touched).toBeTrue();
  });
  it('retains source and exposes warnings without automatically changing model/form', () => {
    const source = '<dl><dt>Original</dt></dl>';
    fixture.componentRef.setInput('model', source);
    fixture.detectChanges();
    const warning = jasmine.createSpy('warning');
    const changed = jasmine.createSpy('changed');
    component.sdImportWarning.subscribe(warning);
    component.sdChange.subscribe(changed);
    const diagnostics: SdEditorImportDiagnostic[] = [{ code: 'unsupported-html', path: '/dl', detail: 'Unsupported structure' }];
    surface.diagnostics.emit(diagnostics);
    expect(component.importDiagnostics()).toBe(diagnostics);
    expect(warning).toHaveBeenCalledOnceWith(diagnostics);
    expect(changed).not.toHaveBeenCalled();
    expect(component.valueModel()).toBe(source);
    expect(component.formControl.value).toBe(source);
  });
  it('rejects deferred upload without a callback, including no pending files', async () => {
    await expectAsync(component.upload()).toBeRejectedWithError('No upload function configured for image upload');
  });
  it('returns current safe HTML in immediate mode and before-ready empty string', async () => {
    fixture.componentRef.setInput('option', { imageConfig: { uploadMode: 'immediate' } });
    fixture.detectChanges();
    await expectAsync(component.upload()).toBeResolvedTo('');
    const engine = engineMock('<p>Safe</p>');
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    await expectAsync(component.upload()).toBeResolvedTo('<p>Safe</p>');
    engine.getHtml.and.throwError('unsafe export');
    await expectAsync(component.upload()).toBeRejectedWithError('unsafe export');
  });
  it('focus allows readonly, ignores disabled, and adapter never destroys the surface engine', () => {
    const engine = engineMock();
    surface.engineReady.emit(engine as unknown as SdEditorEngine);
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    component.focusEditor();
    expect(engine.focus).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    component.focusEditor();
    expect(engine.focus).toHaveBeenCalledTimes(1);
    fixture.destroy();
    expect(engine.destroy).not.toHaveBeenCalled();
  });
  it('retains pending deferred image files across readonly/disabled toggles and uploads after enabling', async () => {
    const file = new File(
      [
        Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jbp4AAAAASUVORK5CYII='), char =>
          char.charCodeAt(0)
        ),
      ],
      'pending.png',
      { type: 'image/png' }
    );
    const upload = jasmine.createSpy('upload').and.resolveTo([{ cdn: '/uploaded.png', idOrKey: 'uploaded' }]);
    fixture.componentRef.setInput('option', { imageConfig: { uploadFn: upload } });
    fixture.detectChanges();
    for (const flag of ['readonly', 'disabled']) {
      const engine = engineMock();
      surface.engineReady.emit(engine as unknown as SdEditorEngine);
      await component.onFilesSelected([file]);
      expect(engine.insertImage).toHaveBeenCalledTimes(1);
      fixture.componentRef.setInput(flag, true);
      fixture.detectChanges();
      surface.sourceChange.emit();
      fixture.componentRef.setInput(flag, false);
      fixture.detectChanges();
      await component.upload();
      expect(engine.replaceImage).toHaveBeenCalledTimes(1);
    }
    expect(upload).toHaveBeenCalledTimes(2);
    expect(upload.calls.argsFor(0)[0]).toEqual([file]);
    expect(upload.calls.argsFor(1)[0]).toEqual([file]);
  });
  it('retains a real readonly engine image URL/File when upload cannot replace it and retries after enabling (R2 real engine RED)', async () => {
    const host = document.createElement('div');
    fixture.nativeElement.appendChild(host);
    const engine = new SdEditorEngine(host, {
      onChange: value => surface.change.emit(value),
      onSourceChange: () => surface.sourceChange.emit(),
    });
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    const file = new File(
      [
        Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jbp4AAAAASUVORK5CYII='), char =>
          char.charCodeAt(0)
        ),
      ],
      'readonly.png',
      { type: 'image/png' }
    );
    const upload = jasmine.createSpy('upload').and.resolveTo([{ cdn: '/real-upload.png', idOrKey: 'real' }]);
    try {
      fixture.componentRef.setInput('option', { imageConfig: { uploadFn: upload } });
      fixture.detectChanges();
      surface.engineReady.emit(engine);
      await component.onFilesSelected([file]);
      const source = [...engine.activeImageSources()][0];
      expect(source.startsWith('blob:')).toBeTrue();
      fixture.componentRef.setInput('readonly', true);
      fixture.detectChanges();
      engine.setEditable(false);
      await expectAsync(component.upload()).toBeRejectedWithError('Upload failed for 1 image(s)');
      expect(engine.activeImageSources().has(source)).toBeTrue();
      expect(revoke).not.toHaveBeenCalledWith(source);
      fixture.componentRef.setInput('readonly', false);
      fixture.detectChanges();
      engine.setEditable(true);
      await component.upload();
      expect(upload).toHaveBeenCalledTimes(2);
      expect(upload.calls.argsFor(1)[0]).toEqual([file]);
      expect(engine.activeImageSources().has('/real-upload.png')).toBeTrue();
      expect(revoke).toHaveBeenCalledWith(source);
    } finally {
      engine.destroy();
      host.remove();
    }
  });
  it('cancels pending work on destroy', fakeAsync(() => {
    const changed = jasmine.createSpy('changed');
    component.sdChange.subscribe(changed);
    surface.change.emit('stale');
    fixture.destroy();
    tick(1000);
    expect(changed).not.toHaveBeenCalled();
  }));
});

describe('SdEditor upload configuration selection', () => {
  async function configure(configurations: unknown) {
    await TestBed.configureTestingModule({
      imports: [SdEditor, NoopAnimationsModule],
      providers: [
        { provide: SD_EDITOR_CONFIGURATION, useValue: configurations },
        { provide: SdNotifyService, useValue: { warning: () => {} } },
      ],
    })
      .overrideComponent(SdEditor, { set: { template: '', imports: [] } })
      .compileComponents();
  }
  it('rejects duplicate named and undefined provider keys', async () => {
    await configure([
      { key: 'same', upload: async () => [] },
      { key: 'same', upload: async () => [] },
    ]);
    expect(() => TestBed.createComponent(SdEditor)).toThrowError(/Duplicate upload configuration key detected: same/);
    TestBed.resetTestingModule();
    await configure([{ upload: async () => [] }, { upload: async () => [] }]);
    expect(() => TestBed.createComponent(SdEditor)).toThrowError(/Duplicate upload configuration key detected: undefined/);
  });
  it('selects exact key and option callback takes precedence over provider', async () => {
    const upload = jasmine.createSpy('upload').and.resolveTo([]);
    await configure([{ key: 'a', upload }]);
    const fixture = TestBed.createComponent(SdEditor);
    fixture.componentRef.setInput('key', 'a');
    fixture.detectChanges();
    expect(fixture.componentInstance.uploadEnabled()).toBeTrue();
    fixture.componentRef.setInput('key', 'missing');
    fixture.detectChanges();
    expect(fixture.componentInstance.uploadEnabled()).toBeFalse();
    fixture.componentRef.setInput('option', { imageConfig: { uploadFn: upload } });
    fixture.detectChanges();
    expect(fixture.componentInstance.uploadEnabled()).toBeTrue();
    await expectAsync(fixture.componentInstance.upload()).toBeResolvedTo('');
    expect(upload).not.toHaveBeenCalled();
  });
});
