import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AsyncValidatorFn, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';
import { SdTextarea } from './textarea.component';
import { queryByCss } from '../../../testing/test-utils';

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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
    [validator]="validator"
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
  validator?: (value: any) => string | Promise<string>;
  model?: any;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTextarea],
  template: `<sd-textarea name="comment" [form]="fg"></sd-textarea>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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
    textarea = fixture.debugElement.query(el => el.componentInstance instanceof SdTextarea)?.componentInstance as SdTextarea;
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

  // -------------------------------------------------------------------------
  // OnPush change detection
  // -------------------------------------------------------------------------

  describe('OnPush change detection', () => {
    // why: sd-textarea là control DUY NHẤT trong forms/** còn để CD mặc định, nên cả cây con
    // bị dirty-check mỗi tick dù component hoàn toàn signal-driven. Bật OnPush và chứng minh
    // #state / sdChanges vẫn đủ để template refresh — kiểm bằng autoDetectChanges (tôn trọng
    // OnPush) chứ KHÔNG dùng detectChanges (ép check sẽ che đúng lớp lỗi này).
    const matError = () => fixture.nativeElement.querySelector('mat-error') as HTMLElement | null;

    it('declares ChangeDetectionStrategy.OnPush', () => {
      const def = (SdTextarea as unknown as { ɵcmp: { onPush: boolean } }).ɵcmp;
      expect(def.onPush).toBeTrue();
    });

    it('renders the required message when the control is touched (no forced CD)', async () => {
      host.required = true;
      fixture.autoDetectChanges();
      await fixture.whenStable();
      expect(matError()).toBeNull(); // invalid nhưng chưa touched

      textarea.formControl.markAsTouched();
      await fixture.whenStable();

      expect(matError()?.textContent?.trim()).toBe('Vui lòng nhập thông tin');
    });

    it('refreshes the data-* e2e attributes on a value change (no forced CD)', async () => {
      fixture.autoDetectChanges();
      await fixture.whenStable();
      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea[matInput]');
      expect(el.getAttribute('data-empty')).toBe('true');

      textarea.formControl.setValue('xin chào');
      await fixture.whenStable();

      expect(el.getAttribute('data-empty')).toBe('false');
      expect(el.getAttribute('data-value')).toBe('xin chào');
    });

    it('refreshes the maxlength counter as the user types (no forced CD)', async () => {
      host.maxlength = 10;
      fixture.autoDetectChanges();
      await fixture.whenStable();

      textarea.formControl.setValue('abcd');
      await fixture.whenStable();

      const counter = fixture.nativeElement.querySelector('.sd-maxlength-counter') as HTMLElement | null;
      expect(counter?.textContent?.replace(/\s/g, '')).toBe('4/10');
    });
  });

  // -------------------------------------------------------------------------
  // custom [validator] — shared HandleSdCustomValidator
  // -------------------------------------------------------------------------

  describe('custom [validator] (shared HandleSdCustomValidator)', () => {
    // why: bản copy nội bộ #customValidator cũ coerce `c.value || null` → số 0 hợp lệ bị
    // nuốt thành null trước khi tới validator của consumer. Helper dùng chung
    // (forms/models/src/sd-custom-validator.model.ts) giữ nguyên 0.
    it('passes a literal 0 to the consumer validator instead of null', fakeAsync(() => {
      const seen: any[] = [];
      host.validator = (v: any) => {
        seen.push(v);
        return v === 0 ? 'Không được nhập 0' : '';
      };
      fixture.detectChanges();

      textarea.formControl.setValue(0);
      textarea.formControl.markAsTouched();
      tick();
      fixture.detectChanges();

      expect(seen).toContain(0);
      expect(textarea.formControl.invalid).toBeTrue();
      expect(textarea.errorMessage()).toBe('Không được nhập 0');
    }));

    it('still normalises empty string to null for the consumer validator', fakeAsync(() => {
      const seen: any[] = [];
      host.validator = (v: any) => {
        seen.push(v);
        return '';
      };
      fixture.detectChanges();

      textarea.formControl.setValue('');
      tick();
      fixture.detectChanges();

      expect(seen).toContain(null);
    }));

    it('surfaces the validator message after the promise resolves', fakeAsync(() => {
      host.validator = (v: any) => (v === 'bad' ? 'Giá trị không hợp lệ' : '');
      fixture.detectChanges();

      textarea.formControl.setValue('bad');
      textarea.formControl.markAsTouched();
      tick();
      fixture.detectChanges();

      expect(textarea.errorMessage()).toBe('Giá trị không hợp lệ');
    }));
  });

  // -------------------------------------------------------------------------
  // additive validator management (connector)
  // -------------------------------------------------------------------------

  describe('validator management is additive (connector)', () => {
    // why: block cũ gọi clearValidators() + clearAsyncValidators() rồi setValidators() mỗi khi
    // BẤT KỲ input nào đổi → xoá sạch validator mà consumer tự gắn lên `formControl` (public).
    // Giờ đi qua ɵsdFormControlConnector: addValidators/removeValidators, chỉ đụng validator
    // của chính component.
    it('keeps a consumer-attached sync validator when a validator input changes', () => {
      const consumerValidator: ValidatorFn = c => (c.value === 'nope' ? { consumer: true } : null);
      textarea.formControl.addValidators(consumerValidator);
      textarea.formControl.updateValueAndValidity();

      host.maxlength = 10; // bất kỳ input validator nào đổi cũng kích hoạt block cũ
      fixture.detectChanges();

      expect(textarea.formControl.hasValidator(consumerValidator)).toBeTrue();
      textarea.formControl.setValue('nope');
      expect(textarea.formControl.hasError('consumer')).toBeTrue();
    });

    it('keeps a consumer-attached async validator when a validator input changes', fakeAsync(() => {
      const consumerAsync: AsyncValidatorFn = async c => (c.value === 'nope' ? { consumerAsync: true } : null);
      textarea.formControl.addAsyncValidators(consumerAsync);
      textarea.formControl.updateValueAndValidity();
      tick();

      host.required = true;
      fixture.detectChanges();

      expect(textarea.formControl.hasAsyncValidator(consumerAsync)).toBeTrue();
      textarea.formControl.setValue('nope');
      tick();
      expect(textarea.formControl.hasError('consumerAsync')).toBeTrue();
    }));

    it('still removes its OWN validators when the matching input is cleared', () => {
      host.maxlength = 3;
      fixture.detectChanges();
      textarea.formControl.setValue('abcdef');
      expect(textarea.formControl.hasError('maxlength')).toBeTrue();

      host.maxlength = undefined;
      fixture.detectChanges();
      textarea.formControl.updateValueAndValidity();

      expect(textarea.formControl.hasError('maxlength')).toBeFalse();
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
    changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
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
    textarea = fixture.debugElement.query(el => el.componentInstance instanceof SdTextarea)?.componentInstance as SdTextarea;
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

// ---------------------------------------------------------------------------
// Timer lifetime — the deferred focus must not outlive the view
// ---------------------------------------------------------------------------

describe('SdTextarea deferred focus lifetime', () => {
  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  const setup = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const comp = fixture.debugElement.query(el => el.componentInstance instanceof SdTextarea)!.componentInstance as SdTextarea;
    const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    return { fixture, comp, textarea };
  };

  it('does not focus the textarea after the view is destroyed inside the 100ms window', fakeAsync(() => {
    const { fixture, comp, textarea } = setup();
    const focusSpy = spyOn(textarea, 'focus');

    comp.focus();
    fixture.destroy();

    expect(() => tick(300)).not.toThrow();
    expect(focusSpy).not.toHaveBeenCalled();
  }));

  it('still focuses on the same 100ms delay while the view is alive', fakeAsync(() => {
    const { fixture, comp, textarea } = setup();
    const focusSpy = spyOn(textarea, 'focus');

    comp.focus();
    tick(99);
    expect(focusSpy).not.toHaveBeenCalled();

    tick(1);
    expect(focusSpy).toHaveBeenCalled();

    fixture.destroy();
  }));
});

// ---------------------------------------------------------------------------
// Accessibility
// why: `aria-hidden="true"` trên một phần tử focus được (hoặc trên phần tử BỌC nội dung focus
// được) tệ hơn là không làm gì: control vẫn nhận focus bằng Tab nhưng screen reader không đọc
// gì cả. Trước đây nó bị rắc khắp forms/** chỉ để dập 4 rule a11y đang bị tắt trong eslint.
// Guard dưới đây quét toàn bộ DOM của control và chặn mẫu đó quay lại.
// ---------------------------------------------------------------------------
const FOCUSABLE_SELECTOR =
  'input:not([tabindex="-1"]), textarea:not([tabindex="-1"]), select:not([tabindex="-1"]), ' +
  'button:not([tabindex="-1"]), a[href]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

/** Trả về tag của mọi phần tử aria-hidden mà bản thân nó hoặc con nó focus được. */
function ariaHiddenFocusables(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('[aria-hidden="true"]'))
    .filter(el => el.matches(FOCUSABLE_SELECTOR) || el.querySelector(FOCUSABLE_SELECTOR) !== null)
    .map(el => el.tagName.toLowerCase());
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTextarea],
  template: `<sd-textarea [required]="required"></sd-textarea>`,
})
class A11yHost {
  required = false;
}

describe('SdTextarea (accessibility)', () => {
  let fixture: ComponentFixture<A11yHost>;
  let cmp: SdTextarea;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [A11yHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(A11yHost);
    fixture.detectChanges();
    cmp = fixture.debugElement.query(el => el.componentInstance instanceof SdTextarea)!.componentInstance;
  });

  it('leaves no aria-hidden on any focusable element (or wrapper of one)', () => {
    expect(ariaHiddenFocusables(fixture.nativeElement)).toEqual([]);
  });

  it('marks the layout wrapper role=presentation instead of aria-hidden', () => {
    const wrapper = fixture.nativeElement.querySelector('div[role="presentation"]') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
    expect(wrapper.querySelector('textarea')).not.toBeNull();
  });

  it('wires aria-invalid + aria-describedby to the rendered inline error', () => {
    fixture.componentInstance.required = true;
    fixture.detectChanges();
    cmp.formControl.markAsTouched();
    cmp.formControl.updateValueAndValidity({ emitEvent: false });
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('mat-error') as HTMLElement;
    const el = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
    expect(error).not.toBeNull();
    expect(error.id).toBe(cmp.errorId);
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toContain(cmp.errorId);
  });
});
