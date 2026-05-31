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
    [min]="min"
    [max]="max"
    [precision]="precision"
    [format]="format"
    [hideInlineError]="hideInlineError"
    [inlineError]="inlineError"
    [blurOnEnter]="blurOnEnter"
    [(model)]="model"
    (sdChange)="onSdChange($event)"
    (sdBlur)="onSdBlur($event)"
    (keyupEnter)="onKeyupEnter($event)"></sd-input-number>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  required = false;
  disabled = false;
  min?: number;
  max?: number;
  precision = 3;
  format: '1,234,567.89' | '1.234.567,89' | undefined = undefined;
  hideInlineError = false;
  inlineError?: string;
  blurOnEnter = false;
  model?: any;
  changes: any[] = [];
  blurValues: any[] = [];
  enterValues: any[] = [];
  onSdChange(v: any) { this.changes.push(v); }
  onSdBlur(v: any) { this.blurValues.push(v); }
  onKeyupEnter(v: any) { this.enterValues.push(v); }
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
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdInputNumber)
      ?.componentInstance as SdInputNumber;
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
  });

  // -------------------------------------------------------------------------
  // required
  // -------------------------------------------------------------------------

  describe('required validator', () => {
    it('applies required validator and marks control invalid when empty', () => {
      host.model = 42;  // seed to avoid NG0100 in ngAfterViewInit
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
      const sub = comp.sdFocus.subscribe(() => { focused = true; });
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
      const sub = comp.keyupEnter.subscribe(v => emitted.push(v));
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
      host.model = 1;  // seed to avoid NG0100
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

  describe('clear button (slim, hover-gated)', () => {
    const clearBtn = () =>
      fixture.nativeElement.querySelector('button.sd-clear-btn') as HTMLButtonElement | null;

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
      comp.cleared.subscribe(spy);

      comp.clear();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('cleared NOT emitted when clear() runs while value already empty (early-return path)', () => {
      const spy = jasmine.createSpy('cleared');
      comp.cleared.subscribe(spy);

      comp.clear();
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();
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
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdInputNumber)
      ?.componentInstance as SdInputNumber;
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
