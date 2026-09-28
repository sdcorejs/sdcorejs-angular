import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, input, output } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdEditor } from './editor.component';
import { queryByCss, setInput } from '../../../testing/test-utils';

describe('SdEditor', () => {
  let fixture: ComponentFixture<SdEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdEditor, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SdEditor);
  });

  describe('E2E attributes', () => {
    it('renders data-disabled reflecting disabled input', () => {
      fixture.detectChanges();
      const el = queryByCss(fixture, 'div.sd-editor');

      // initial: data-disabled === 'false'
      expect(el.getAttribute('data-disabled')).toBe('false');

      // set disabled to true
      setInput(fixture, 'disabled', true);
      expect(el.getAttribute('data-disabled')).toBe('true');

      // set disabled back to false
      setInput(fixture, 'disabled', false);
      expect(el.getAttribute('data-disabled')).toBe('false');
    });

    it('renders data-empty toggling with valueModel', () => {
      fixture.detectChanges();
      const el = queryByCss(fixture, 'div.sd-editor');

      // initial empty: data-empty === 'true'
      expect(el.getAttribute('data-empty')).toBe('true');

      // set model to non-empty string
      setInput(fixture, 'model', 'hello');
      expect(el.getAttribute('data-empty')).toBe('false');

      // set model back to empty string
      setInput(fixture, 'model', '');
      expect(el.getAttribute('data-empty')).toBe('true');

      // set model to whitespace-only (still not empty by sdIsEmpty logic)
      setInput(fixture, 'model', '  ');
      expect(el.getAttribute('data-empty')).toBe('false');
    });

    it('renders both data-disabled and data-empty together', () => {
      fixture.detectChanges();
      const el = queryByCss(fixture, 'div.sd-editor');

      setInput(fixture, 'disabled', true);
      setInput(fixture, 'model', 'content');

      expect(el.getAttribute('data-disabled')).toBe('true');
      expect(el.getAttribute('data-empty')).toBe('false');
    });
  });
});

// ---------------------------------------------------------------------------
// Output sanitization (D-032) — CKEditor thật được thay bằng stub, editor giả điều khiển getData().
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'ckeditor',
  standalone: true,
  template: '',
})
class FakeCKEditorComponent {
  readonly editor = input<unknown>();
  readonly config = input<unknown>();
  readonly disabled = input(false);
  readonly ready = output<unknown>();
}

function makeFakeClassicEditor(initialData = '') {
  const dataListeners: (() => void)[] = [];
  const editor = {
    data: initialData,
    getData: () => editor.data,
    setData: jasmine.createSpy('setData').and.callFake((value: string) => (editor.data = value)),
    destroy: jasmine.createSpy('destroy'),
    enableReadOnlyMode: jasmine.createSpy('enableReadOnlyMode'),
    disableReadOnlyMode: jasmine.createSpy('disableReadOnlyMode'),
    model: {
      document: {
        registerPostFixer: () => undefined,
        differ: { getChanges: () => [] },
        on: (event: string, callback: () => void) => {
          if (event === 'change:data') dataListeners.push(callback);
        },
      },
    },
    editing: { view: { document: { on: () => undefined }, focus: () => undefined } },
    fireDataChange: () => dataListeners.forEach(callback => callback()),
  };
  return editor;
}

describe('SdEditor — output sanitization (D-032)', () => {
  const UNSAFE = '<p>Hi <a href="javascript:alert(1)">x</a><img src="/a.png" onerror="alert(1)"></p>';
  const CLEANED = '<p>Hi <a>x</a><img src="/a.png"></p>';
  let fixture: ComponentFixture<SdEditor>;
  let comp: SdEditor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdEditor, NoopAnimationsModule] })
      .overrideComponent(SdEditor, { remove: { imports: [CKEditorModule] }, add: { imports: [FakeCKEditorComponent] } })
      .compileComponents();
    fixture = TestBed.createComponent(SdEditor);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits filtered HTML through sdChange, the model and the form value', fakeAsync(() => {
    const changes: string[] = [];
    comp.sdChange.subscribe(value => changes.push(value));
    const editor = makeFakeClassicEditor();
    comp.onReady(editor as never);

    editor.data = UNSAFE;
    editor.fireDataChange();
    tick(100);

    expect(changes).toEqual([CLEANED]);
    expect(comp.valueModel()).toBe(CLEANED);
    expect(comp.formControl.value).toBe(CLEANED);
  }));

  it('writes filtered content back once and marks the control dirty', fakeAsync(() => {
    const editor = makeFakeClassicEditor();
    comp.onReady(editor as never);
    expect(comp.formControl.dirty).toBeFalse();

    editor.data = UNSAFE;
    editor.fireDataChange();
    tick(100);
    editor.fireDataChange();
    tick(100);

    expect(comp.formControl.dirty).toBeTrue();
    expect(comp.formControl.value).toBe(CLEANED);
  }));

  it('keeps clean content untouched and the control pristine', fakeAsync(() => {
    const editor = makeFakeClassicEditor();
    comp.onReady(editor as never);

    editor.data = '<p style="text-align:center;"><span style="color:#ff0000;">Clean</span> <strong>text</strong></p>';
    editor.fireDataChange();
    tick(100);

    expect(comp.formControl.value).toBe(
      '<p style="text-align:center;"><span style="color:#ff0000;">Clean</span> <strong>text</strong></p>'
    );
    expect(comp.formControl.dirty).toBeFalse();
  }));

  it('returns filtered HTML from upload()', async () => {
    fixture.componentRef.setInput('option', { imageConfig: { uploadMode: 'immediate' } });
    fixture.detectChanges();
    comp.onReady(makeFakeClassicEditor(UNSAFE) as never);

    expect(await comp.upload()).toBe(CLEANED);
  });
});
