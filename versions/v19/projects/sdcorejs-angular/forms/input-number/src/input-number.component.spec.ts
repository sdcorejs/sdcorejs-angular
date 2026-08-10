import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';
import { SdInputNumber } from './input-number.component';
import { queryByCss } from '../../../testing/test-utils';

// ---------------------------------------------------------------------------
// Host wrappers
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdInputNumber, FormsModule, ReactiveFormsModule],
  template: `<sd-input-number
    [label]="label"
    [placeholder]="placeholder"
    [required]="required"
    [disabled]="disabled"
    [clearable]="clearable"
    [min]="min"
    [max]="max"
    [precision]="precision"
    [format]="format"
    [hideInlineError]="hideInlineError"
    [inlineError]="inlineError"
    [validator]="validator"
    [blurOnEnter]="blurOnEnter"
    [(model)]="model"
    (sdChange)="onSdChange($event)"
    (sdBlur)="onSdBlur($event)"
    (sdKeyupEnter)="onKeyupEnter($event)"></sd-input-number>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  required = false;
  disabled = false;
  clearable = false;
  min?: number;
  max?: number;
  precision = 3;
  format: '1,234,567.89' | '1.234.567,89' | undefined = undefined;
  hideInlineError = false;
  inlineError?: string;
  validator?: (value: any) => string | Promise<string>;
  blurOnEnter = false;
  model?: any;
  changes: any[] = [];
  blurValues: any[] = [];
  enterValues: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
  onSdBlur(v: any) {
    this.blurValues.push(v);
  }
  onKeyupEnter(v: any) {
    this.enterValues.push(v);
  }
}

@Component({
  standalone: true,
  imports: [SdInputNumber],
  template: `<sd-input-number name="amount" [form]="fg"></sd-input-number>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [SdInputNumber, FormsModule],
  template: `<form #f="ngForm"><sd-input-number name="amount" [form]="f"></sd-input-number></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInput(fixture: ComponentFixture<any>): HTMLInputElement {
  return queryByCss<HTMLInputElement>(fixture, 'input');
}

// ---------------------------------------------------------------------------
// Main suite
// ---------------------------------------------------------------------------

describe('SdInputNumber', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdInputNumber;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdInputNumber)?.componentInstance as SdInputNumber;
    if (!comp) throw new Error('SdInputNumber not found in fixture');
  });

  // -------------------------------------------------------------------------
  // creation & rendering
  // -------------------------------------------------------------------------

  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(comp).toBeTruthy();
      expect(getInput(fixture)).not.toBeNull();
    });

    it('renders label as placeholder when placeholder is not set', () => {
      host.label = 'Số tiền';
      fixture.detectChanges();
      expect(getInput(fixture).getAttribute('placeholder')).toBe('Số tiền');
    });

    it('renders explicit placeholder when provided', () => {
      host.placeholder = 'Nhập số';
      fixture.detectChanges();
      expect(getInput(fixture).getAttribute('placeholder')).toBe('Nhập số');
    });
  });

  // -------------------------------------------------------------------------
  // model two-way binding
  // -------------------------------------------------------------------------

  describe('model two-way binding', () => {
    it('syncs formControl when model is set from outside (effect)', () => {
      host.model = 1234;
      fixture.detectChanges();
      expect(comp.formControl.value).toBe(1234);
    });

    it('updates model when inputControl emits a valid number', fakeAsync(() => {
      // simulate user typing by setting inputControl directly
      comp.inputControl.setValue('500');
      tick();
      fixture.detectChanges();
      expect(host.model).toBe(500);
    }));

    it('emits sdChange with the parsed number value', fakeAsync(() => {
      comp.inputControl.setValue('250');
      tick();
      fixture.detectChanges();
      expect(host.changes).toContain(250);
    }));

    it('sets model to null when inputControl is cleared', fakeAsync(() => {
      host.model = 100;
      fixture.detectChanges();
      comp.inputControl.setValue('');
      tick();
      fixture.detectChanges();
      expect(host.model).toBeNull();
    }));
  });

  // -------------------------------------------------------------------------
  // min/max validation
  // -------------------------------------------------------------------------

  describe('min/max validation', () => {
    it('applies min validator — rejects value below min', () => {
      host.min = 10;
      fixture.detectChanges();
      comp.formControl.setValue(5, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('min')).toBe(true);
    });

    it('passes min validator when value equals min', () => {
      host.min = 10;
      fixture.detectChanges();
      comp.formControl.setValue(10, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('min')).toBe(false);
    });

    it('applies max validator — rejects value above max', () => {
      host.max = 100;
      fixture.detectChanges();
      comp.formControl.setValue(200, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('max')).toBe(true);
    });

    it('passes max validator when value equals max', () => {
      host.max = 100;
      fixture.detectChanges();
      comp.formControl.setValue(100, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('max')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // precision / decimal places
  // -------------------------------------------------------------------------

  describe('precision / decimal places', () => {
    it('regex allows decimal separator when precision > 0', () => {
      host.precision = 2;
      fixture.detectChanges();
      const pattern = comp.regexPattern();
      expect(pattern).toContain('.');
    });

    it('regex blocks decimal part when precision = 0', () => {
      host.precision = 0;
      fixture.detectChanges();
      const pattern = comp.regexPattern();
      // no optional decimal group expected
      expect(pattern).not.toContain('[0-9]{0,0}');
      // integer-only: decimal group is empty string
      expect(pattern).not.toContain('escDecimal');
    });

    it('decimalSeparator defaults to "." for ISO format', () => {
      expect(comp.decimalSeparator()).toBe('.');
    });

    it('decimalSeparator returns "," for VN format', () => {
      host.format = '1.234.567,89';
      fixture.detectChanges();
      expect(comp.decimalSeparator()).toBe(',');
    });
  });

  // -------------------------------------------------------------------------
  // thousands separator formatting
  // -------------------------------------------------------------------------

  describe('thousands separator', () => {
    it('thousandsSeparator defaults to "," for ISO format', () => {
      expect(comp.thousandsSeparator()).toBe(',');
    });

    it('thousandsSeparator returns "." for VN format', () => {
      host.format = '1.234.567,89';
      fixture.detectChanges();
      expect(comp.thousandsSeparator()).toBe('.');
    });

    it('formats typed value with ISO thousands separator', fakeAsync(() => {
      host.format = '1,234,567.89';
      fixture.detectChanges();
      comp.inputControl.setValue('1234567');
      tick();
      fixture.detectChanges();
      expect(comp.inputControl.value).toBe('1,234,567');
    }));

    it('formats typed value with VN thousands separator', fakeAsync(() => {
      host.format = '1.234.567,89';
      fixture.detectChanges();
      comp.inputControl.setValue('1234567');
      tick();
      fixture.detectChanges();
      expect(comp.inputControl.value).toBe('1.234.567');
    }));
  });

  // -------------------------------------------------------------------------
  // parse user input → number
  // -------------------------------------------------------------------------

  describe('parse user input to number', () => {
    it('parses ISO-formatted "1,234.56" to 1234.56', fakeAsync(() => {
      host.format = '1,234,567.89';
      fixture.detectChanges();
      comp.inputControl.setValue('1,234.56');
      tick();
      fixture.detectChanges();
      expect(comp.formControl.value).toBeCloseTo(1234.56, 2);
    }));

    it('parses VN-formatted "1.234,56" to 1234.56', fakeAsync(() => {
      host.format = '1.234.567,89';
      fixture.detectChanges();
      comp.inputControl.setValue('1.234,56');
      tick();
      fixture.detectChanges();
      expect(comp.formControl.value).toBeCloseTo(1234.56, 2);
    }));
  });

  // -------------------------------------------------------------------------
  // blur re-format
  // -------------------------------------------------------------------------

  describe('blur re-format', () => {
    it('clears inputControl and sets model to null on blur with empty value', () => {
      comp.inputControl.setValue('', { emitEvent: false });
      comp.onBlur();
      expect(comp.inputControl.value).toBe('');
      expect(comp.formControl.value).toBeNull();
    });

    it('emits sdBlur with the numeric formControl value on blur', fakeAsync(() => {
      comp.inputControl.setValue('99');
      tick();
      fixture.detectChanges();
      comp.onBlur();
      expect(host.blurValues.length).toBeGreaterThan(0);
      expect(host.blurValues[host.blurValues.length - 1]).toBe(99);
    }));

    // why: nhánh "gõ dở phần thập phân" (vd `12.` / `12,`) reformat rồi return SỚM. Trước đây
    // nó là nhánh blur DUY NHẤT không emit sdBlur → consumer nghe (sdBlur) để commit/validate
    // im lặng bỏ sót đúng trường hợp này.
    it('emits sdBlur when the value ends with the decimal separator (ISO "12.")', fakeAsync(() => {
      comp.inputControl.setValue('12.', { emitEvent: false });
      host.blurValues.length = 0;

      comp.onBlur();
      tick();
      fixture.detectChanges();

      expect(host.blurValues.length).toBe(1);
      expect(host.blurValues[0]).toBe(12);
      expect(comp.inputControl.value).toBe('12');
    }));

    it('emits sdBlur when the value ends with the decimal separator (VN "12,")', fakeAsync(() => {
      host.format = '1.234.567,89';
      fixture.detectChanges();
      comp.inputControl.setValue('12,', { emitEvent: false });
      host.blurValues.length = 0;

      comp.onBlur();
      tick();
      fixture.detectChanges();

      expect(host.blurValues.length).toBe(1);
      expect(host.blurValues[0]).toBe(12);
    }));

    it('emits sdBlur exactly once on the trailing-separator path (no double emit)', fakeAsync(() => {
      comp.inputControl.setValue('7.', { emitEvent: false });
      host.blurValues.length = 0;

      comp.onBlur();
      tick();
      fixture.detectChanges();

      expect(host.blurValues.length).toBe(1);
    }));
  });

  // -------------------------------------------------------------------------
  // required
  // -------------------------------------------------------------------------

  describe('required validator', () => {
    it('applies required validator and marks control invalid when empty', () => {
      host.model = 42; // seed to avoid NG0100 in ngAfterViewInit
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(true);
    });

    it('passes required validator when value is provided', () => {
      host.model = 1;
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(5, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // disabled
  // -------------------------------------------------------------------------

  describe('disabled', () => {
    it('disables formControl and inputControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(true);
      expect(comp.inputControl.disabled).toBe(true);
    });

    it('enables controls when disabled toggled back to false', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(false);
      expect(comp.inputControl.disabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // output events
  // -------------------------------------------------------------------------

  describe('output events', () => {
    it('emits sdFocus when onFocus is called', () => {
      let focused = false;
      const sub = comp.sdFocus.subscribe(() => {
        focused = true;
      });
      comp.onFocus();
      expect(focused).toBe(true);
      sub.unsubscribe();
    });

    it('sets isFocused = true on focus and false on blur', () => {
      comp.onFocus();
      expect(comp.isFocused).toBe(true);
      comp.onBlur();
      expect(comp.isFocused).toBe(false);
    });

    it('emits keyupEnter on onKeyupEnter', () => {
      const emitted: any[] = [];
      const sub = comp.sdKeyupEnter.subscribe(v => emitted.push(v));
      comp.inputControl.setValue('123', { emitEvent: false });
      comp.onKeyupEnter();
      expect(emitted.length).toBe(1);
      sub.unsubscribe();
    });

    it('calls blur() when blurOnEnter = true and Enter is pressed', () => {
      host.blurOnEnter = true;
      fixture.detectChanges();
      const spy = spyOn(comp, 'blur').and.callThrough();
      comp.onKeyupEnter();
      expect(spy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // errorMessage
  // -------------------------------------------------------------------------

  describe('errorMessage', () => {
    it('returns "Vui lòng nhập thông tin" for required error', () => {
      host.model = 1; // seed to avoid NG0100
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null);
      comp.formControl.updateValueAndValidity();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBe('Vui lòng nhập thông tin');
    });

    it('returns min error message with the configured min value', () => {
      host.min = 50;
      fixture.detectChanges();
      comp.formControl.setValue(10);
      comp.formControl.updateValueAndValidity();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBe('Giá trị không được nhỏ hơn 50');
    });

    it('returns max error message with the configured max value', () => {
      host.max = 100;
      fixture.detectChanges();
      comp.formControl.setValue(200);
      comp.formControl.updateValueAndValidity();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBe('Giá trị không được lớn hơn 100');
    });

    it('returns inlineError text when inlineError validator fires', () => {
      host.inlineError = 'Giá trị không hợp lệ';
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.errorMessage()).toBe('Giá trị không hợp lệ');
    });

    it('returns undefined when control has no errors', () => {
      expect(comp.errorMessage()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // inlineError validator
  // -------------------------------------------------------------------------

  describe('inlineError validator', () => {
    it('adds inlineError error when inlineError is set', () => {
      host.inlineError = 'Lỗi nhập liệu';
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.formControl.hasError('inlineError')).toBe(true);
    });

    it('removes inlineError when inlineError is cleared', () => {
      host.inlineError = 'Lỗi nhập liệu';
      fixture.detectChanges();
      host.inlineError = undefined;
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.formControl.hasError('inlineError')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // reValidate
  // -------------------------------------------------------------------------

  describe('reValidate', () => {
    it('calls updateValueAndValidity on formControl', () => {
      const spy = spyOn(comp.formControl, 'updateValueAndValidity').and.callThrough();
      comp.reValidate();
      expect(spy).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // appearance
  // -------------------------------------------------------------------------

  describe('appearance', () => {
    it('defaults to "outline" when no SD_FORM_CONFIGURATION token is provided', () => {
      expect(comp.appearance()).toBe('outline');
    });
  });

  // -------------------------------------------------------------------------
  // E2E attributes
  // -------------------------------------------------------------------------

  describe('E2E attributes', () => {
    it('renders data-disabled reflecting FormControl state', () => {
      fixture.detectChanges();
      const el: HTMLInputElement = getInput(fixture);
      expect(el.getAttribute('data-disabled')).toBe('false');
      comp.formControl.disable();
      fixture.detectChanges();
      expect(el.getAttribute('data-disabled')).toBe('true');
    });

    it('renders data-empty=true when value is null/empty', () => {
      fixture.detectChanges();
      const el: HTMLInputElement = getInput(fixture);
      expect(el.getAttribute('data-empty')).toBe('true');
      comp.formControl.setValue(7);
      fixture.detectChanges();
      expect(el.getAttribute('data-empty')).toBe('false');
    });

    it('renders data-value as stringified number', () => {
      comp.formControl.setValue(42);
      fixture.detectChanges();
      const el: HTMLInputElement = getInput(fixture);
      expect(el.getAttribute('data-value')).toBe('42');
    });

    it('renders data-invalid=true only after touched + invalid', () => {
      comp.formControl.setValidators([Validators.required]);
      comp.formControl.updateValueAndValidity();
      fixture.detectChanges();
      const el: HTMLInputElement = getInput(fixture);
      expect(el.getAttribute('data-invalid')).toBe('false');
      comp.formControl.markAsTouched();
      fixture.detectChanges();
      expect(el.getAttribute('data-invalid')).toBe('true');
    });
  });

  it('defaults clearable to false and hides the clear button', () => {
    host.model = 123;
    fixture.detectChanges();

    expect(comp.clearable()).toBeFalse();
    expect(fixture.nativeElement.querySelector('button.sd-clear-btn')).toBeNull();
  });

  describe('clear button (slim, hover-gated)', () => {
    const clearBtn = () => fixture.nativeElement.querySelector('button.sd-clear-btn') as HTMLButtonElement | null;

    beforeEach(() => {
      host.clearable = true;
      fixture.detectChanges();
    });

    it('renders the slim clear button when a value is set', () => {
      host.model = 123;
      fixture.detectChanges();
      expect(clearBtn()).not.toBeNull();
    });

    it('uses the thin close icon (not the filled cancel icon)', () => {
      host.model = 123;
      fixture.detectChanges();
      expect(clearBtn()!.querySelector('mat-icon')?.textContent?.trim()).toBe('close');
    });

    it('carries the sd-hover class so it only shows on hover/focus', () => {
      host.model = 123;
      fixture.detectChanges();
      expect(clearBtn()!.classList.contains('sd-hover')).toBe(true);
    });

    it('hides the clear button when there is no value', () => {
      fixture.detectChanges();
      expect(clearBtn()).toBeNull();
    });

    it('hides the clear button when required', () => {
      host.required = true;
      host.model = 123;
      fixture.detectChanges();
      expect(clearBtn()).toBeNull();
    });

    it('hides the clear button when disabled', () => {
      host.disabled = true;
      host.model = 123;
      fixture.detectChanges();
      expect(clearBtn()).toBeNull();
    });

    it('clicking the clear button resets value and emits null', () => {
      host.model = 123;
      fixture.detectChanges();
      clearBtn()!.click();
      fixture.detectChanges();
      expect(comp.formControl.value).toBeNull();
      expect(host.changes).toContain(null);
    });

    it('clear() emits cleared output (dedicated intent — column-filter dùng để fire reload mà KHÔNG over-trigger như sdChange per-keystroke)', () => {
      host.model = 123;
      fixture.detectChanges();
      const spy = jasmine.createSpy('cleared');
      comp.sdCleared.subscribe(spy);

      comp.clear();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('cleared NOT emitted when clear() runs while value already empty (early-return path)', () => {
      const spy = jasmine.createSpy('cleared');
      comp.sdCleared.subscribe(spy);

      comp.clear();
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('clear() phải để formControl phát event (bug class "invalid nhưng không có message")', () => {
    // why: clear() cũ dùng setValue(null, { emitEvent: false }) — mâu thuẫn thẳng với comment
    // `why:` ở #onChange ngay trong file này. formControl mang required/min/max + async
    // validator; chặn event thì #state (sdFormControlState) không tick → errorMessage không
    // recompute → xoá xong field rỗng mà lỗi required KHÔNG hiện. Dùng autoDetectChanges
    // (tôn trọng OnPush), KHÔNG dùng detectChanges vì ép check sẽ che lỗi.
    const matError = () => fixture.nativeElement.querySelector('mat-error') as HTMLElement | null;

    it('renders the required message after clear() (no forced CD)', async () => {
      host.required = true;
      host.model = 123;
      fixture.autoDetectChanges();
      await fixture.whenStable();

      comp.formControl.markAsTouched();
      await fixture.whenStable();
      expect(matError()).toBeNull(); // còn giá trị → chưa có lỗi

      comp.clear();
      await fixture.whenStable();

      expect(comp.formControl.hasError('required')).toBeTrue();
      expect(matError()?.textContent?.trim()).toBe('Vui lòng nhập thông tin');
    });

    it('refreshes errorMessage() after clear()', async () => {
      host.required = true;
      host.model = 123;
      fixture.autoDetectChanges();
      await fixture.whenStable();
      comp.formControl.markAsTouched();
      await fixture.whenStable();

      comp.clear();
      await fixture.whenStable();

      expect(comp.errorMessage()).toBe('Vui lòng nhập thông tin');
    });

    it('refreshes the data-empty e2e attribute after clear()', async () => {
      fixture.autoDetectChanges();
      await fixture.whenStable();
      const el = getInput(fixture);

      comp.inputControl.setValue('123');
      await fixture.whenStable();
      expect(el.getAttribute('data-empty')).toBe('false');
      expect(el.getAttribute('data-value')).toBe('123');

      comp.clear();
      await fixture.whenStable();

      expect(el.getAttribute('data-empty')).toBe('true');
      expect(el.getAttribute('data-value')).toBe('');
    });

    it('emits sdChange exactly once with null (formControl.valueChanges không có subscriber)', async () => {
      host.model = 123;
      fixture.autoDetectChanges();
      await fixture.whenStable();
      host.changes.length = 0;

      comp.clear();
      await fixture.whenStable();

      expect(host.changes).toEqual([null]);
      expect(comp.formControl.value).toBeNull();
      expect(comp.inputControl.value).toBe('');
    });

    it('surfaces the async [validator] message evaluated on the cleared value', fakeAsync(() => {
      host.validator = (v: any) => (v == null ? 'Không được để trống' : '');
      host.model = 7;
      fixture.detectChanges();
      comp.formControl.markAsTouched();
      tick();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBeUndefined();

      comp.clear();
      tick(); // async validator resolve trên giá trị mới (null)
      fixture.detectChanges();

      expect(comp.formControl.invalid).toBeTrue();
      expect(comp.errorMessage()).toBe('Không được để trống');
    }));
  });

  describe('custom [validator] async error message', () => {
    // why: regression — [validator] cài async validator lên formControl, nhưng giá trị được
    // mirror sang formControl bằng setValue({emitEvent:false}) → khi async resolve, setErrors
    // cũng emitEvent:false → #state KHÔNG tick → errorMessage (computed theo #state) không
    // recompute → message không hiển thị (dù form invalid + viền đỏ). Phải sửa để event lan ra.
    const matError = () => fixture.nativeElement.querySelector('mat-error') as HTMLElement | null;
    const errorIcon = () => fixture.nativeElement.querySelector('sd-icon.sd-error-icon') as HTMLElement | null;

    it('surfaces the validator message through errorMessage() after async resolves', fakeAsync(() => {
      host.validator = (v: any) => (v === 5 ? 'Không được nhập 5' : '');
      fixture.detectChanges();

      // drive a value through the real input pipeline (inputControl → #onChange → formControl)
      comp.inputControl.setValue('5');
      comp.formControl.markAsTouched();
      tick(); // flush the async validator promise
      fixture.detectChanges();

      expect(comp.formControl.invalid).toBe(true); // form thực sự invalid
      expect(comp.errorMessage()).toBe('Không được nhập 5');
    }));

    it('renders the validator message in <mat-error> (inline mode)', fakeAsync(() => {
      host.validator = (v: any) => (v === 5 ? 'Không được nhập 5' : '');
      fixture.detectChanges();

      comp.inputControl.setValue('5');
      comp.formControl.markAsTouched();
      tick();
      fixture.detectChanges();

      expect(matError()?.textContent?.trim()).toBe('Không được nhập 5');
    }));

    it('surfaces the validator message via the error icon tooltip when hideInlineError', fakeAsync(() => {
      host.hideInlineError = true;
      host.validator = (v: any) => (v === 5 ? 'Không được nhập 5' : '');
      fixture.detectChanges();

      comp.inputControl.setValue('5');
      comp.formControl.markAsTouched();
      tick();
      fixture.detectChanges();

      expect(errorIcon()).not.toBeNull();
      expect(comp.errorMessage()).toBe('Không được nhập 5');
      // inline mode → KHÔNG có <mat-error> dưới field, chỉ có icon + tooltip
      expect(matError()).toBeNull();
    }));

    it('surfaces the validator message via preset [(model)] + markAsTouched (demo path)', fakeAsync(() => {
      host.validator = (v: any) => (v === 13 ? 'Số 13 không được phép' : '');
      host.model = 13;
      fixture.detectChanges();
      tick(); // async validator resolves
      comp.formControl.markAsTouched();
      fixture.detectChanges();

      expect(comp.formControl.invalid).toBe(true);
      expect(comp.errorMessage()).toBe('Số 13 không được phép');
    }));

    it('clears the validator message once the value becomes valid again', fakeAsync(() => {
      host.validator = (v: any) => (v === 5 ? 'Không được nhập 5' : '');
      fixture.detectChanges();

      comp.inputControl.setValue('5');
      comp.formControl.markAsTouched();
      tick();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBe('Không được nhập 5');

      comp.inputControl.setValue('6');
      tick();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBeUndefined();
      expect(comp.formControl.valid).toBe(true);
    }));
  });

  describe('suffix ordering — error icon stays flush at the right edge', () => {
    // why: nút clear (matSuffix, hover-gated `visibility:hidden`) vẫn chiếm chỗ trong layout
    // (cố ý — tránh nhảy layout khi hover). Nếu render SAU error icon nó giành slot ngoài cùng
    // bên phải → error icon (luôn hiển thị) bị đẩy "tụt vào trong". Clear phải render TRƯỚC error
    // icon để error icon nằm sát mép phải, clear giữ slot vô hình bên trái nó.
    const errorIconEl = () => fixture.nativeElement.querySelector('sd-icon.sd-error-icon') as HTMLElement | null;
    const clearBtnEl = () => fixture.nativeElement.querySelector('button.sd-clear-btn') as HTMLElement | null;

    const setupErrorWithValue = () => {
      host.clearable = true;
      host.hideInlineError = true;
      host.max = 10;
      host.model = 20; // vượt max → lỗi
      host.required = false; // không required → nút clear hiển thị
      fixture.detectChanges();
      comp.formControl.markAsTouched();
      comp.formControl.updateValueAndValidity();
      fixture.detectChanges();
    };

    it('renders BOTH the error icon and the clear button when invalid + has value + not required', () => {
      setupErrorWithValue();
      expect(errorIconEl()).not.toBeNull();
      expect(clearBtnEl()).not.toBeNull();
    });

    it('orders the clear button BEFORE the error icon in the DOM (error icon flush at edge)', () => {
      setupErrorWithValue();
      const clearBtn = clearBtnEl()!;
      const errorIcon = errorIconEl()!;
      const errorFollowsClear = !!(clearBtn.compareDocumentPosition(errorIcon) & Node.DOCUMENT_POSITION_FOLLOWING);
      expect(errorFollowsClear).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// FormGroup lifecycle
// ---------------------------------------------------------------------------

describe('SdInputNumber (FormGroup lifecycle)', () => {
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

  it('adds the named control to FormGroup after view init', () => {
    expect(fg.contains('amount')).toBe(true);
  });

  it('removes the named control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('amount')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdInputNumber (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('amount')).toBe(true);
  }));
});

// ---------------------------------------------------------------------------
// SD_FORM_CONFIGURATION token
// ---------------------------------------------------------------------------

describe('SdInputNumber (SD_FORM_CONFIGURATION appearance)', () => {
  @Component({
    standalone: true,
    imports: [SdInputNumber],
    template: `<sd-input-number></sd-input-number>`,
  })
  class StubHost {}

  let fixture: ComponentFixture<StubHost>;
  let comp: SdInputNumber;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StubHost, NoopAnimationsModule],
      providers: [{ provide: SD_FORM_CONFIGURATION, useValue: { appearance: 'fill' } }],
    }).compileComponents();
    fixture = TestBed.createComponent(StubHost);
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdInputNumber)?.componentInstance as SdInputNumber;
  });

  it('uses appearance from SD_FORM_CONFIGURATION token', () => {
    expect(comp.appearance()).toBe('fill');
  });
});

// ---------------------------------------------------------------------------
// host classes
// ---------------------------------------------------------------------------

describe('SdInputNumber (host classes)', () => {
  let fixture: ComponentFixture<SdInputNumber>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdInputNumber, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdInputNumber);
  });

  it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(false);
    fixture.componentRef.setInput('label', 'Số tiền');
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
// viewed inline mode (tri-state `viewed`) — borderless input variant
// ---------------------------------------------------------------------------

describe('SdInputNumber (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdInputNumber>;
  let comp: SdInputNumber;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdInputNumber, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdInputNumber);
    comp = fixture.componentInstance;
  });

  it('viewed="inline" → isInline true; renders the seamless <sd-inline-text> (NO sd-view swap, NO mat-form-field)', () => {
    // asserts: inline renders the borderless primitive — a raw input, not a mat-form-field
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    expect(comp.isInline()).toBe(true);
    expect(comp.isViewed()).toBe(false);
    expect(fixture.nativeElement.querySelector('sd-inline-text')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('sd-inline-text input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[matInput]')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).toBeNull();
  });

  it('forwards clearable=false by default and clearable=true on opt-in', () => {
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 123);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-text__clear')).toBeNull();

    fixture.componentRef.setInput('clearable', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-text__clear')).not.toBeNull();
  });

  it('viewed=true stays static (sd-view, no input)', () => {
    // asserts: viewed=true unchanged DETAIL — sd-view only
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('input[matInput]')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  });

  it('disabled inline behaves like viewed=true (static, no input)', () => {
    // asserts: disabled 'inline' → isViewed true, isInline false
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(comp.isInline()).toBe(false);
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('input[matInput]')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Timer lifetime — the deferred focus must not outlive the view
// ---------------------------------------------------------------------------

describe('SdInputNumber deferred focus lifetime', () => {
  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  const setup = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const comp = fixture.debugElement.query(el => el.componentInstance instanceof SdInputNumber)!.componentInstance as SdInputNumber;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, comp, input };
  };

  it('does not focus the input after the view is destroyed inside the 100ms window', fakeAsync(() => {
    const { fixture, comp, input } = setup();
    const focusSpy = spyOn(input, 'focus');

    comp.focus();
    fixture.destroy();

    expect(() => tick(300)).not.toThrow();
    expect(focusSpy).not.toHaveBeenCalled();
  }));

  it('still focuses on the same 100ms delay while the view is alive', fakeAsync(() => {
    const { fixture, comp, input } = setup();
    const focusSpy = spyOn(input, 'focus');

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
  standalone: true,
  imports: [SdInputNumber],
  template: `<sd-input-number [required]="required" [model]="model"></sd-input-number>`,
})
class A11yHost {
  required = false;
  model: number | null = null;
}

describe('SdInputNumber (accessibility)', () => {
  let fixture: ComponentFixture<A11yHost>;
  let cmp: SdInputNumber;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [A11yHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(A11yHost);
    fixture.detectChanges();
    cmp = fixture.debugElement.query(el => el.componentInstance instanceof SdInputNumber)!.componentInstance;
  });

  it('leaves no aria-hidden on any focusable element (or wrapper of one)', () => {
    expect(ariaHiddenFocusables(fixture.nativeElement)).toEqual([]);
  });

  it('marks the layout wrapper role=presentation instead of aria-hidden', () => {
    const wrapper = fixture.nativeElement.querySelector('div[role="presentation"]') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
    expect(wrapper.querySelector('input')).not.toBeNull();
  });

  it('wires aria-invalid + aria-describedby to the rendered inline error', () => {
    fixture.componentInstance.required = true;
    fixture.detectChanges();
    cmp.formControl.markAsTouched();
    cmp.formControl.updateValueAndValidity({ emitEvent: false });
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('mat-error') as HTMLElement;
    const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(error).not.toBeNull();
    expect(error.id).toBe(cmp.errorId);
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toContain(cmp.errorId);
  });
});
