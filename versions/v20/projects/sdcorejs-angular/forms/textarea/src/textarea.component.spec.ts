import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';
import { SdTextarea } from './textarea.component';
import { queryByCss } from '../../../testing/test-utils';

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdTextarea, FormsModule, ReactiveFormsModule],
  template: `<sd-textarea
    [label]="label"
    [placeholder]="placeholder"
    [helperText]="helperText"
    [rows]="rows"
    [required]="required"
    [disabled]="disabled"
    [maxlength]="maxlength"
    [hideInlineError]="hideInlineError"
    [inlineError]="inlineError"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-textarea>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  helperText?: string;
  rows = 5;
  required = false;
  disabled = false;
  maxlength?: number;
  hideInlineError = false;
  inlineError?: string;
  model?: any;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
}

@Component({
  standalone: true,
  imports: [SdTextarea],
  template: `<sd-textarea name="comment" [form]="fg"></sd-textarea>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [SdTextarea, FormsModule],
  template: `<form #f="ngForm"><sd-textarea name="comment" [form]="f"></sd-textarea></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

// ---------------------------------------------------------------------------
// Main describe block
// ---------------------------------------------------------------------------

describe('SdTextarea', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let textarea: SdTextarea;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    textarea = fixture.debugElement.query(el => el.componentInstance instanceof SdTextarea)
      ?.componentInstance as SdTextarea;
    if (!textarea) throw new Error('SdTextarea not found in fixture');
  });

  // -------------------------------------------------------------------------
  // creation & rendering
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    it('creates the textarea component', () => {
      expect(textarea).toBeTruthy();
    });

    it('renders a textarea element in the DOM', () => {
      expect(fixture.nativeElement.querySelector('textarea')).not.toBeNull();
    });

    it('renders placeholder on textarea element', () => {
      host.placeholder = 'Nhập mô tả...';
      fixture.detectChanges();
      const el = queryByCss<HTMLTextAreaElement>(fixture, 'textarea');
      expect(el.getAttribute('placeholder')).toBe('Nhập mô tả...');
    });

    it('uses label as fallback placeholder when placeholder is empty', () => {
      host.label = 'Ghi chú';
      fixture.detectChanges();
      const el = queryByCss<HTMLTextAreaElement>(fixture, 'textarea');
      expect(el.getAttribute('placeholder')).toBe('Ghi chú');
    });
  });

  // -------------------------------------------------------------------------
  // rows input
  // -------------------------------------------------------------------------

  describe('rows input', () => {
    it('defaults to 5 rows', () => {
      const el = queryByCss<HTMLTextAreaElement>(fixture, 'textarea');
      expect(el.getAttribute('rows')).toBe('5');
    });

    it('reflects custom rows value', () => {
      host.rows = 10;
      fixture.detectChanges();
      const el = queryByCss<HTMLTextAreaElement>(fixture, 'textarea');
      expect(el.getAttribute('rows')).toBe('10');
    });
  });

  // -------------------------------------------------------------------------
  // disabled
  // -------------------------------------------------------------------------

  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(textarea.formControl.disabled).toBe(true);
    });

    it('enables formControl when disabled toggled off', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(textarea.formControl.disabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // required validator
  // -------------------------------------------------------------------------

  describe('required validator', () => {
    it('applies required validator when required = true', () => {
      host.model = 'seed';
      host.required = true;
      fixture.detectChanges();
      textarea.formControl.setValue('', { emitEvent: false });
      textarea.formControl.updateValueAndValidity({ emitEvent: false });
      expect(textarea.formControl.hasError('required')).toBe(true);
    });

    it('passes validation when value is provided', () => {
      host.model = '';
      host.required = true;
      fixture.detectChanges();
      textarea.formControl.setValue('some text', { emitEvent: false });
      textarea.formControl.updateValueAndValidity({ emitEvent: false });
      expect(textarea.formControl.hasError('required')).toBe(false);
    });

    it('removes required validator when required toggled off', () => {
      host.model = '';
      host.required = true;
      fixture.detectChanges();
      host.required = false;
      fixture.detectChanges();
      textarea.formControl.setValue('', { emitEvent: false });
      textarea.formControl.updateValueAndValidity({ emitEvent: false });
      expect(textarea.formControl.hasError('required')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // maxlength validator
  // -------------------------------------------------------------------------

  describe('maxlength validator', () => {
    it('applies maxLength validator when value exceeds limit', () => {
      host.maxlength = 5;
      fixture.detectChanges();
      textarea.formControl.setValue('abcdef', { emitEvent: false });
      textarea.formControl.updateValueAndValidity({ emitEvent: false });
      expect(textarea.formControl.hasError('maxlength')).toBe(true);
    });

    it('passes when value is within max length', () => {
      host.maxlength = 10;
      fixture.detectChanges();
      textarea.formControl.setValue('hello', { emitEvent: false });
      textarea.formControl.updateValueAndValidity({ emitEvent: false });
      expect(textarea.formControl.hasError('maxlength')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // inlineError validator
  // -------------------------------------------------------------------------

  describe('inlineError validator', () => {
    it('sets inlineError on formControl when inlineError is provided', () => {
      host.inlineError = 'Lỗi tùy chỉnh';
      fixture.detectChanges();
      textarea.formControl.updateValueAndValidity();
      expect(textarea.formControl.hasError('inlineError')).toBe(true);
    });

    it('clears inlineError validator when inlineError is removed', () => {
      host.inlineError = 'Lỗi tùy chỉnh';
      fixture.detectChanges();
      host.inlineError = undefined;
      fixture.detectChanges();
      textarea.formControl.updateValueAndValidity();
      expect(textarea.formControl.hasError('inlineError')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // model two-way binding
  // -------------------------------------------------------------------------

  describe('model two-way binding', () => {
    it('updates formControl when model changes (downward, effect)', () => {
      host.model = 'hello world';
      fixture.detectChanges();
      expect(textarea.formControl.value).toBe('hello world');
    });

    it('updates model when formControl emits valueChanges (upward)', () => {
      textarea.formControl.setValue('updated text');
      fixture.detectChanges();
      expect(host.model).toBe('updated text');
    });

    it('emits sdChange when formControl value changes', () => {
      textarea.formControl.setValue('new value');
      fixture.detectChanges();
      expect(host.changes).toContain('new value');
    });

    it('does NOT emit valueChanges when model effect re-syncs control', () => {
      const received: any[] = [];
      const sub = textarea.formControl.valueChanges.subscribe(v => received.push(v));
      host.model = 'silent update';
      fixture.detectChanges();
      expect(textarea.formControl.value).toBe('silent update');
      expect(received.length).toBe(0);
      sub.unsubscribe();
    });
  });

  // -------------------------------------------------------------------------
  // onBlur (trim on blur)
  // -------------------------------------------------------------------------

  describe('onBlur', () => {
    it('trims leading/trailing whitespace on blur', () => {
      textarea.formControl.setValue('  trimmed  ');
      textarea.onBlur();
      expect(textarea.formControl.value).toBe('trimmed');
    });

    it('does not modify value if already trimmed', () => {
      textarea.formControl.setValue('clean');
      textarea.onBlur();
      expect(textarea.formControl.value).toBe('clean');
    });
  });

  // -------------------------------------------------------------------------
  // focus tracking
  // -------------------------------------------------------------------------

  describe('focus tracking', () => {
    it('sets isFocused = true on focus', () => {
      textarea.onFocus();
      expect(textarea.isFocused).toBe(true);
    });

    it('sets isFocused = false on blur', () => {
      textarea.onFocus();
      textarea.onBlur();
      expect(textarea.isFocused).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // errorMessage getter
  // -------------------------------------------------------------------------

  describe('errorMessage getter', () => {
    it('returns "Vui lòng nhập thông tin" for required error', () => {
      host.model = 'seed';
      host.required = true;
      fixture.detectChanges();
      textarea.formControl.setValue('');
      textarea.formControl.updateValueAndValidity();
      fixture.detectChanges();
      expect(textarea.errorMessage()).toBe('Vui lòng nhập thông tin');
    });

    it('returns maxlength message with the configured limit', () => {
      host.maxlength = 5;
      fixture.detectChanges();
      textarea.formControl.setValue('abcdef');
      textarea.formControl.updateValueAndValidity();
      fixture.detectChanges();
      expect(textarea.errorMessage()).toBe('Số ký tự tối đa: 5');
    });

    it('returns undefined when no errors present', () => {
      textarea.formControl.setValue('valid');
      expect(textarea.errorMessage()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // appearance
  // -------------------------------------------------------------------------

  describe('appearance', () => {
    it('defaults to "outline" without SD_FORM_CONFIGURATION token', () => {
      expect(textarea.appearance()).toBe('outline');
    });
  });

  // -------------------------------------------------------------------------
  // helper utilities
  // -------------------------------------------------------------------------

  describe('helper utilities', () => {
    it('getCurrentLength returns 0 for null/undefined value', () => {
      textarea.formControl.setValue(null);
      expect(textarea.getCurrentLength()).toBe(0);
    });

    it('getCurrentLength returns correct string length', () => {
      textarea.formControl.setValue('hello');
      expect(textarea.getCurrentLength()).toBe(5);
    });

    it('isMaxlengthExceeded returns true when over maxlength', () => {
      host.maxlength = 3;
      fixture.detectChanges();
      textarea.formControl.setValue('abcd');
      expect(textarea.isMaxlengthExceeded()).toBe(true);
    });

    it('isMaxlengthExceeded returns false when within maxlength', () => {
      host.maxlength = 10;
      fixture.detectChanges();
      textarea.formControl.setValue('abc');
      expect(textarea.isMaxlengthExceeded()).toBe(false);
    });

    it('isMaxlengthExceeded returns false when no maxlength is set', () => {
      textarea.formControl.setValue('any text here');
      expect(textarea.isMaxlengthExceeded()).toBe(false);
    });
  });

  describe('E2E attributes', () => {
    it('renders data-disabled reflecting FormControl state', () => {
      fixture.detectChanges();
      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
      expect(el.getAttribute('data-disabled')).toBe('false');
      textarea.formControl.disable();
      fixture.detectChanges();
      expect(el.getAttribute('data-disabled')).toBe('true');
    });

    it('renders data-empty=true when value is null/empty', () => {
      fixture.detectChanges();
      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
      expect(el.getAttribute('data-empty')).toBe('true');
      textarea.formControl.setValue('hello');
      fixture.detectChanges();
      expect(el.getAttribute('data-empty')).toBe('false');
    });

    it('renders data-value reflecting FormControl value', () => {
      textarea.formControl.setValue('hello');
      fixture.detectChanges();
      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
      expect(el.getAttribute('data-value')).toBe('hello');
    });

    it('renders data-invalid=true only after touched + invalid', () => {
      textarea.formControl.setValidators([Validators.required]);
      textarea.formControl.updateValueAndValidity();
      fixture.detectChanges();
      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
      expect(el.getAttribute('data-invalid')).toBe('false');
      textarea.formControl.markAsTouched();
      fixture.detectChanges();
      expect(el.getAttribute('data-invalid')).toBe('true');
    });
  });
});

// ---------------------------------------------------------------------------
// FormGroup lifecycle
// ---------------------------------------------------------------------------

describe('SdTextarea (FormGroup lifecycle)', () => {
  let fg: FormGroup;
  let fixture: ComponentFixture<FgHost>;

  beforeEach(async () => {
    fg = new FormGroup({});
    await TestBed.configureTestingModule({
      imports: [FgHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(FgHost);
    fixture.componentInstance.fg = fg;
    fixture.detectChanges();
  });

  it('adds control to FormGroup on init', () => {
    expect(fg.contains('comment')).toBe(true);
  });

  it('removes control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('comment')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdTextarea (NgForm extraction)', () => {
  let fixture: ComponentFixture<NgFormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgFormHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(NgFormHost);
    fixture.detectChanges();
  });

  it('extracts FormGroup from NgForm and registers the control', fakeAsync(() => {
    tick();
    const ngForm = fixture.componentInstance.ngForm;
    expect(ngForm).toBeTruthy();
    expect(ngForm.form.contains('comment')).toBe(true);
  }));
});

// ---------------------------------------------------------------------------
// SD_FORM_CONFIGURATION token
// ---------------------------------------------------------------------------

describe('SdTextarea (with SD_FORM_CONFIGURATION fill)', () => {
  @Component({
    standalone: true,
    imports: [SdTextarea],
    template: `<sd-textarea></sd-textarea>`,
  })
  class StubHost {}

  let fixture: ComponentFixture<StubHost>;
  let textarea: SdTextarea;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StubHost, NoopAnimationsModule],
      providers: [{ provide: SD_FORM_CONFIGURATION, useValue: { appearance: 'fill' } }],
    }).compileComponents();
    fixture = TestBed.createComponent(StubHost);
    fixture.detectChanges();
    textarea = fixture.debugElement.query(el => el.componentInstance instanceof SdTextarea)
      ?.componentInstance as SdTextarea;
  });

  it('uses appearance from SD_FORM_CONFIGURATION token', () => {
    expect(textarea.appearance()).toBe('fill');
  });
});

// ---------------------------------------------------------------------------
// host classes
// ---------------------------------------------------------------------------

describe('SdTextarea (host classes)', () => {
  let fixture: ComponentFixture<SdTextarea>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdTextarea, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdTextarea);
  });

  it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(false);
    fixture.componentRef.setInput('label', 'Mô tả');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(true);
  });

  it('viewed defaults false; viewed=true adds .sd-viewed host class', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-viewed')).toBe(false);
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-viewed')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state `viewed`) — borderless textarea variant
// ---------------------------------------------------------------------------

describe('SdTextarea (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdTextarea>;
  let comp: SdTextarea;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdTextarea, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdTextarea);
    comp = fixture.componentInstance;
  });

  it('viewed="inline" → isInline true; renders the borderless textarea (no static swap)', () => {
    // asserts: textarea has no panel — inline IS the editable textarea flattened to look like text
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    expect(comp.isInline()).toBe(true);
    expect(comp.isViewed()).toBe(false);
    expect(fixture.nativeElement.querySelector('.sd-inline-textarea')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('textarea[matInput]')).not.toBeNull();
  });

  it('viewed=true stays static (no textarea)', () => {
    // asserts: viewed=true unchanged DETAIL — static value text, no editable textarea
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('textarea[matInput]')).toBeNull();
  });

  it('disabled inline behaves like viewed=true (static, no textarea)', () => {
    // asserts: disabled 'inline' → isViewed true, isInline false (cannot edit a disabled control)
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(comp.isInline()).toBe(false);
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('textarea[matInput]')).toBeNull();
  });
});
