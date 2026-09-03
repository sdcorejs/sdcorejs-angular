import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdDate } from './date.component';

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdDate, FormsModule, ReactiveFormsModule],
  template: `<sd-date
    [label]="label"
    [placeholder]="placeholder"
    [required]="required"
    [disabled]="disabled"
    [viewed]="viewed"
    [clearable]="clearable"
    [min]="min"
    [max]="max"
    [model]="model"
    (modelChange)="model = $event"
    (sdChange)="onSdChange($event)"
    (sdFocus)="onSdFocus()"></sd-date>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  required = false;
  disabled = false;
  viewed = false;
  clearable = false;
  min: any = undefined;
  max: any = undefined;
  model: any = undefined;
  changes: any[] = [];
  focused = false;
  onSdChange(v: any) {
    this.changes.push(v);
  }
  onSdFocus() {
    this.focused = true;
  }
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdDate],
  template: `<sd-date name="dob" [form]="fg" [model]="model" (modelChange)="model = $event" (sdChange)="changes.push($event)"></sd-date>`,
})
class FgHost {
  fg!: FormGroup;
  model: string | number | Date | null | undefined;
  changes: (string | number | Date | null | undefined)[] = [];
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdDate],
  template: `<sd-date
    name="dob"
    [form]="fg"
    [transform]="transform"
    [model]="model"
    (modelChange)="model = $event"
    (sdChange)="changes.push($event)"></sd-date>`,
})
class TransformHost {
  @ViewChild(SdDate) date!: SdDate;
  fg!: FormGroup;
  transform: 'ISOString' | 'UTCString' | undefined = 'ISOString';
  model: string | number | Date | null | undefined;
  changes: (string | number | Date | null | undefined)[] = [];
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdDate, FormsModule],
  template: `<form #f="ngForm"><sd-date name="dob" [form]="f"></sd-date></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

// ---------------------------------------------------------------------------
// Main describe
// ---------------------------------------------------------------------------

describe('SdDate', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdDate;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDate)?.componentInstance as SdDate;
    if (!comp) throw new Error('SdDate not found in fixture');
  });

  // -------------------------------------------------------------------------
  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(comp).toBeTruthy();
    });

    it('renders mat-form-field with a datepicker input', () => {
      const input = fixture.nativeElement.querySelector('input[matdatepicker], input[matInput]');
      expect(input).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('model two-way binding', () => {
    it('downward: sets formControl when model changes', () => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      // formControl holds a Date object; check it is not null/undefined
      expect(comp.formControl.value).not.toBeNull();
    });

    it('clears formControl when model is set to null', () => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      host.model = null;
      fixture.detectChanges();
      expect(comp.formControl.value).toBeNull();
    });

    it('maps an external native Date model to the canonical Date control without feedback', () => {
      host.model = new Date(2026, 4, 15, 18, 45);
      fixture.detectChanges();

      const value = comp.formControl.value as Date;
      expect(value instanceof Date).toBeTrue();
      expect([value.getFullYear(), value.getMonth(), value.getDate()]).toEqual([2026, 4, 15]);
      expect(host.changes).toEqual([]);
    });

    it('upward: sdChange emits yyyy/MM/dd string on programmatic onChange', () => {
      // event.value giờ là native Date trực tiếp (date-fns adapter), không có .toDate().
      const dateVal = { value: new Date(2026, 4, 20) } as any;
      comp.onChange(dateVal);
      expect(host.changes).toContain('2026/05/20');
    });
  });

  // -------------------------------------------------------------------------
  describe('format — internal date-fns adapter', () => {
    it('stores model as yyyy/MM/dd string after date selection', () => {
      const dateVal = { value: new Date(2026, 0, 1) } as any;
      comp.onChange(dateVal);
      expect(host.changes[host.changes.length - 1]).toBe('2026/01/01');
    });

    it('emits null via clear() when value is cleared', () => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      const event = {
        stopPropagation: () => {
          /* noop */
        },
      };
      comp.clear(event);
      expect(host.changes[host.changes.length - 1]).toBeNull();
    });
  });

  describe('invalid display conversion', () => {
    it('keeps the existing model/output when typed display text is invalid', fakeAsync(() => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      host.changes = [];

      comp.onKeyup({ target: { value: 'not-a-date' } });
      tick();

      expect(host.model).toBe('2026/05/15');
      expect(host.changes).toEqual([]);
      expect(comp.formControl.hasError('date')).toBeTrue();
    }));

    // why: RED trước fix — lỗi format được nhét bằng `setErrors()`, tức NGOÀI pipeline validator,
    // nên lần `updateValueAndValidity` kế tiếp (connector, hoặc consumer) xoá sạch nó trong im lặng.
    it('keeps the invalid-format error after a later updateValueAndValidity', fakeAsync(() => {
      comp.onKeyup({ target: { value: 'not-a-date' } });
      tick();
      expect(comp.formControl.hasError('date')).toBeTrue();

      comp.formControl.updateValueAndValidity();
      tick();

      expect(comp.formControl.hasError('date')).toBeTrue();
    }));

    it('keeps the invalid-format error across a setValue on the exposed formControl', fakeAsync(() => {
      comp.onKeyup({ target: { value: 'not-a-date' } });
      tick();
      expect(comp.formControl.hasError('date')).toBeTrue();

      comp.formControl.setValue(null);
      tick();

      expect(comp.formControl.hasError('date')).toBeTrue();
    }));

    it('drops the invalid-format error once the typed text parses again', fakeAsync(() => {
      comp.onKeyup({ target: { value: 'not-a-date' } });
      tick();
      expect(comp.formControl.hasError('date')).toBeTrue();

      comp.onKeyup({ target: { value: '22/08/1991' } });
      tick();

      expect(comp.formControl.hasError('date')).toBeFalse();
    }));
  });

  describe('parse error message', () => {
    // why: RED trước fix — code bắt `errors['matDatetimePickerParse']`, key KHÔNG tồn tại trong
    // @angular/material. Key thật là `matDatepickerParse`, nên nhánh parse-error là code chết.
    it('maps the real Material parse-error key to a message', () => {
      comp.formControl.setErrors({ matDatepickerParse: { text: '99/99/9999' } });
      fixture.detectChanges();

      expect(comp.errorMessage()).toBe('Lỗi phân tích: 99/99/9999');
    });
  });

  describe('display input formatting', () => {
    const setInputValue = (input: HTMLInputElement, value: string, inputType = 'insertText') => {
      input.value = value;
      input.setSelectionRange(value.length, value.length);
      comp.onInput({ target: input, inputType } as unknown as Event);
    };

    it('adds separators after the day and month while typing', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

      setInputValue(input, '22');
      expect(input.value).toBe('22/');

      setInputValue(input, '22/08');
      expect(input.value).toBe('22/08/');

      setInputValue(input, '22/08/1991');
      expect(input.value).toBe('22/08/1991');
    });

    it('does not re-add a separator that was just deleted', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, '22/');
      setInputValue(input, '22', 'deleteContentBackward');

      expect(input.value).toBe('22');
    });

    it('commits a valid typed date on blur', () => {
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, '22/08/1991');

      comp.onBlur();

      expect(host.model).toBe('1991/08/22');
      expect(comp.formControl.value instanceof Date).toBeTrue();
      expect(input.value).toBe('22/08/1991');
    });

    it('clears an incomplete or invalid date on blur', () => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, '22/');

      comp.onBlur();

      expect(host.model).toBeNull();
      expect(comp.formControl.value).toBeNull();
      expect(input.value).toBe('');
    });

    it('clears a date with invalid characters on blur', () => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, '22a08/1991');

      comp.onBlur();

      expect(host.model).toBeNull();
      expect(comp.formControl.value).toBeNull();
      expect(input.value).toBe('');
    });

    it('clears an impossible calendar date on blur', () => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      setInputValue(input, '31/02/1991');

      comp.onBlur();

      expect(host.model).toBeNull();
      expect(comp.formControl.value).toBeNull();
      expect(input.value).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  describe('min/max validation', () => {
    it('resolvedMin returns a Date when min is an ISO string', () => {
      host.min = '2026-01-01';
      fixture.detectChanges();
      const resolved = comp.resolvedMin();
      expect(resolved).not.toBeNull();
      expect(resolved instanceof Date).toBe(true);
    });

    it('resolvedMax returns a Date when max is "TODAY"', () => {
      host.max = 'TODAY';
      fixture.detectChanges();
      const resolved = comp.resolvedMax();
      expect(resolved).not.toBeNull();
      expect(resolved instanceof Date).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('required validator', () => {
    it('applies required error when control is empty', () => {
      host.model = '2026/05/15'; // pre-seed to avoid NG0100
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(true);
    });

    it('passes required validation when a Date value is present', () => {
      host.required = true;
      fixture.detectChanges();
      // Set a Date-compatible truthy value
      host.model = '2026/05/15';
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(true);
    });

    it('re-enables formControl when disabled toggled off', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('output events', () => {
    it('emits sdFocus when onFocus is called', () => {
      comp.onFocus();
      expect(host.focused).toBe(true);
    });

    it('sets isFocused = false on onBlur', () => {
      comp.onFocus();
      comp.onBlur();
      expect(comp.isFocused).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  it('defaults clearable to false and hides the edit-mode clear button', () => {
    host.model = '2026/05/15';
    fixture.detectChanges();

    expect(comp.clearable()).toBeFalse();
    expect(fixture.nativeElement.querySelector('.sd-clear-btn')).toBeNull();
  });

  describe('clear behavior', () => {
    it('clears formControl and emits null via clear()', () => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      const event = {
        stopPropagation: () => {
          /* noop */
        },
      };
      comp.clear(event);
      expect(comp.formControl.value).toBeNull();
      expect(host.changes).toContain(null);
    });
  });

  // -------------------------------------------------------------------------
  describe('viewed mode', () => {
    // Parity với sd-datetime: date-fns migration phải lưu Date object vào
    // formControl (không phải chuỗi display) để DatePipe trong viewed mode parse được.

    it('formControl stores a native Date (not a string) after model is set', () => {
      // Regression: nếu một migration tương lai vô tình lưu displayStr
      // (như từng xảy ra với sd-datetime) thì test này sẽ fail.
      host.model = '2026/05/15';
      fixture.detectChanges();
      expect(comp.formControl.value).not.toBeNull();
      expect(comp.formControl.value instanceof Date).toBe(true);
    });

    it('formControl stores Date for date-only ISO string (yyyy-MM-dd)', () => {
      // Reproducer style: <sd-date [model]="'2025-10-23'" viewed></sd-date>
      host.model = '2025-10-23';
      fixture.detectChanges();
      expect(comp.formControl.value instanceof Date).toBe(true);
      const d: Date = comp.formControl.value;
      expect(d.getFullYear()).toBe(2025);
      expect(d.getMonth()).toBe(9); // October
      expect(d.getDate()).toBe(23);
    });

    it('renders sd-view (not the matInput) when viewed = true', () => {
      host.viewed = true;
      host.model = '2026/05/15';
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      const datepickerInput = fixture.nativeElement.querySelector('input[matdatepicker]');
      expect(sdView).not.toBeNull();
      expect(datepickerInput).toBeNull();
    });

    it('viewed mode does NOT throw DatePipe parse error', () => {
      const spy = spyOn(console, 'error').and.callThrough();
      host.viewed = true;
      host.model = '2026/05/15';
      expect(() => fixture.detectChanges()).not.toThrow();
      const datePipeErrors = spy.calls.allArgs().filter(args => args.some(a => typeof a === 'string' && a.includes('DatePipe')));
      expect(datePipeErrors.length).toBe(0);
    });

    it('viewed + date-only ISO string does NOT throw DatePipe error', () => {
      // Production reproducer style
      const spy = spyOn(console, 'error').and.callThrough();
      host.viewed = true;
      host.model = '2025-10-23';
      expect(() => fixture.detectChanges()).not.toThrow();
      const datePipeErrors = spy.calls.allArgs().filter(args => args.some(a => typeof a === 'string' && a.includes('DatePipe')));
      expect(datePipeErrors.length).toBe(0);
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView.textContent).toContain('23/10/2025');
    });

    it('viewed mode renders dd/MM/yyyy display string in sd-view', () => {
      host.viewed = true;
      host.model = '2026/05/15';
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView).not.toBeNull();
      expect(sdView.textContent).toContain('15/05/2026');
    });

    it('viewed mode with null model renders sd-view without crashing', () => {
      host.viewed = true;
      host.model = null;
      expect(() => fixture.detectChanges()).not.toThrow();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView).not.toBeNull();
    });

    it('viewed mode accepts native Date model', () => {
      host.viewed = true;
      host.model = new Date(2026, 4, 15);
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView.textContent).toContain('15/05/2026');
    });
  });

  // -------------------------------------------------------------------------
  describe('errorMessage', () => {
    it('returns "Vui lòng nhập thông tin" for required error', () => {
      host.model = '2026/05/15';
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null);
      comp.formControl.updateValueAndValidity();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBe('Vui lòng nhập thông tin');
    });

    it('returns undefined when no errors', () => {
      host.model = '2026/05/15';
      fixture.detectChanges();
      expect(comp.errorMessage()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('E2E attributes', () => {
    it('renders data-disabled reflecting FormControl state', () => {
      fixture.detectChanges();
      const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(el.getAttribute('data-disabled')).toBe('false');
      comp.formControl.disable();
      fixture.detectChanges();
      expect(el.getAttribute('data-disabled')).toBe('true');
    });

    it('renders data-empty toggling with value', () => {
      fixture.detectChanges();
      const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(el.getAttribute('data-empty')).toBe('true');
      comp.formControl.setValue(new Date('2026-05-24T00:00:00.000Z'));
      fixture.detectChanges();
      expect(el.getAttribute('data-empty')).toBe('false');
    });

    it('renders data-value as ISO string for Date', () => {
      const d = new Date('2026-05-24T00:00:00.000Z');
      comp.formControl.setValue(d);
      fixture.detectChanges();
      const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(el.getAttribute('data-value')).toBe('2026-05-24T00:00:00.000Z');
    });

    it('renders data-invalid=true only after touched + invalid', () => {
      comp.formControl.setValidators([Validators.required]);
      comp.formControl.updateValueAndValidity();
      fixture.detectChanges();
      const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(el.getAttribute('data-invalid')).toBe('false');
      comp.formControl.markAsTouched();
      fixture.detectChanges();
      expect(el.getAttribute('data-invalid')).toBe('true');
    });
  });
});

// ---------------------------------------------------------------------------
// FormGroup lifecycle
// ---------------------------------------------------------------------------

describe('SdDate (FormGroup lifecycle)', () => {
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
    expect(fg.contains('dob')).toBe(true);
  });

  it('maps a registered native Date control value to model and sdChange exactly once', () => {
    fg.get('dob')!.setValue(new Date(2026, 4, 20));

    expect(fixture.componentInstance.model).toBe('2026/05/20');
    expect(fixture.componentInstance.changes).toEqual(['2026/05/20']);
  });

  it('maps an external model update to the control without feeding it back', () => {
    const control = fg.get('dob')!;
    const controlWrites: unknown[] = [];
    const subscription = control.valueChanges.subscribe(value => controlWrites.push(value));

    fixture.componentInstance.model = '2026/05/15';
    fixture.detectChanges();

    expect(control.value instanceof Date).toBeTrue();
    expect(controlWrites).toEqual([]);
    expect(fixture.componentInstance.changes).toEqual([]);
    subscription.unsubscribe();
  });

  it('stops model and output synchronization after destroy', () => {
    const host = fixture.componentInstance;
    const control = fg.get('dob')!;

    fixture.destroy();
    control.setValue(new Date(2026, 4, 20));

    expect(host.model).toBeUndefined();
    expect(host.changes).toEqual([]);
  });

  it('removes control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('dob')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdDate (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('dob')).toBe(true);
  }));
});

// ---------------------------------------------------------------------------
// bare + open()
// ---------------------------------------------------------------------------

describe('SdDate (bare + open)', () => {
  let fixture: ComponentFixture<SdDate>;
  let component: SdDate;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [SdDate, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdDate);
    component = fixture.componentInstance;
  });

  it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(false);
    fixture.componentRef.setInput('label', 'Ngày sinh');
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

  it('open() opens the datepicker', () => {
    fixture.detectChanges();
    component.open();
    expect(component.datePicker()?.opened).toBe(true);
  });

  it('non-bare: still renders .sd-clear-btn when a value is set', () => {
    fixture.componentRef.setInput('clearable', true);
    fixture.detectChanges();
    component.formControl.setValue(new Date(2024, 0, 15));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-clear-btn')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state `viewed`)
// ---------------------------------------------------------------------------

describe('SdDate (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdDate>;
  let component: SdDate;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SdDate, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdDate);
    component = fixture.componentInstance;
  });

  it('viewed="inline" → isInline true, isViewed false; text face + (hidden) editor both rendered', () => {
    // asserts: inline mounts BOTH the sd-view face AND the bare-hidden datepicker editor (no swap)
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    component.formControl.setValue(new Date(2024, 0, 15));
    fixture.detectChanges();
    expect(component.isInline()).toBe(true);
    expect(component.isViewed()).toBe(false);
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-inline-editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[matInput]')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
  });

  it('clicking the text face opens the calendar WITHOUT hiding the view text', () => {
    // asserts: text retained while editing; click → open() (calendar) via enterInlineEdit
    const openSpy = spyOn(component, 'open').and.callThrough();
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    component.formControl.setValue(new Date(2024, 0, 15));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sd-inline-view') as HTMLElement).click();
    fixture.detectChanges();
    expect(openSpy).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
  });

  it('inline + value renders a hover clear-× (gated by clearable)', () => {
    // asserts: clearable inline date exposes the clear affordance; [clearable]=false suppresses it
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('clearable', true);
    fixture.detectChanges();
    component.formControl.setValue(new Date(2024, 0, 15));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-view .sd-inline-clear')).not.toBeNull();

    fixture.componentRef.setInput('clearable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-clear')).toBeNull();
  });

  it('viewed=true stays static (no editor, no inline face)', () => {
    // asserts: viewed=true unchanged DETAIL — sd-view only, no datepicker input mounted
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    component.formControl.setValue(new Date(2024, 0, 15));
    fixture.detectChanges();
    expect(component.isInline()).toBe(false);
    expect(component.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.sd-inline-view')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[matInput]')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  });
});

// Angular Material re-parses the field after every keystroke and writes the
// result straight into the form control, so a half-typed date must never be
// accepted ("11/12/2" used to become year 0002, a bare "11" year 1100). These
// dispatch REAL input events; the older specs call onInput() directly and so
// never exercise Material's own listener.
describe('SdDate (partial input is not a date)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let comp: SdDate;
  let input: HTMLInputElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] });
    fixture = TestBed.createComponent(HostComponent);
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDate).componentInstance;
    fixture.detectChanges();
    input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  });

  const type = (rawValue: string, inputType = 'insertText') => {
    input.value = rawValue;
    input.setSelectionRange(rawValue.length, rawValue.length);
    input.dispatchEvent(new InputEvent('input', { inputType, bubbles: true }));
    fixture.detectChanges();
  };

  for (const partial of ['1', '11/1', '11/12', '11/12/2', '11/12/20', '11/12/202']) {
    it(`keeps the control empty while "${partial}" is still being typed`, () => {
      type(partial);

      expect(comp.formControl.value).toBeNull();
    });
  }

  it('does not treat a bare day as an ISO century (11 -> year 1100)', () => {
    type('11/12/2026');
    type('11', 'deleteContentBackward');

    expect(comp.formControl.value).toBeNull();
    expect(input.value).toBe('11');
  });

  it('never rewrites the text the user is still typing', () => {
    type('11/12/2');
    expect(input.value).toBe('11/12/2');
  });

  it('accepts the date once the full year has been typed', () => {
    type('11/12/2026');

    expect(comp.formControl.value instanceof Date).toBeTrue();
    expect((comp.formControl.value as Date).getFullYear()).toBe(2026);
    expect((comp.formControl.value as Date).getMonth()).toBe(11);
    expect((comp.formControl.value as Date).getDate()).toBe(11);
  });

  it('rejects an impossible calendar date typed in full', () => {
    type('31/02/2026');

    expect(comp.formControl.value).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Timer lifetime — the deferred focus/open must not outlive the view
// ---------------------------------------------------------------------------

describe('SdDate deferred focus lifetime', () => {
  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  const setup = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDate)!.componentInstance as SdDate;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, comp, input, picker: comp.datePicker()! };
  };

  it('does not focus or open the calendar after the view is destroyed inside the 100ms window', fakeAsync(() => {
    const { fixture, comp, input, picker } = setup();
    const focusSpy = spyOn(input, 'focus');
    const openSpy = spyOn(picker, 'open');

    comp.focus();
    fixture.destroy();

    expect(() => tick(300)).not.toThrow();
    expect(focusSpy).not.toHaveBeenCalled();
    expect(openSpy).not.toHaveBeenCalled();
  }));

  it('still focuses on the same 100ms delay while the view is alive', fakeAsync(() => {
    const { fixture, comp, input, picker } = setup();
    const focusSpy = spyOn(input, 'focus');
    spyOn(picker, 'open');

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
// why: `aria-hidden="true"` trên phần tử focus được (hoặc trên phần tử BỌC nội dung focus được)
// tệ hơn là không làm gì: control vẫn nhận focus bằng Tab nhưng screen reader không đọc gì.
// Trước đây nó bị rắc khắp forms/** chỉ để dập 4 rule a11y đang bị tắt trong eslint.
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
  imports: [SdDate],
  template: `<sd-date [required]="required"></sd-date>`,
})
class A11yHost {
  required = false;
}

describe('SdDate (accessibility)', () => {
  let fixture: ComponentFixture<A11yHost>;
  let cmp: SdDate;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [A11yHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(A11yHost);
    fixture.detectChanges();
    cmp = fixture.debugElement.query(el => el.componentInstance instanceof SdDate).componentInstance as SdDate;
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

  it('exposes the calendar trigger as a keyboard-reachable, named <button>', () => {
    const btn = fixture.nativeElement.querySelector('button.sd-suffix-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.type).toBe('button');
    // why: <button> nằm sẵn trong tab order và UA tự sinh `click` khi nhấn Enter/Space — đó
    // chính là "bàn phím làm được như chuột" mà không phải tự chế role/tabindex/keydown.
    expect(btn.tabIndex).toBeGreaterThanOrEqual(0);
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  it('activating the calendar trigger opens the datepicker', () => {
    const btn = fixture.nativeElement.querySelector('button.sd-suffix-btn') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(cmp.datePicker()?.opened).toBe(true);
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

// ---------------------------------------------------------------------------
// Value transform (`transform`)
//
// why: mọi expected value đều dựng từ chính native `Date` local rồi gọi `toISOString()` /
// `toUTCString()`. Hard-code `+07:00` sẽ đỏ trên CI ở múi giờ khác, mà cái cần khẳng định là
// "serialize đúng instant local start-of-day", không phải "máy này ở múi giờ nào".
// ---------------------------------------------------------------------------

describe('SdDate (transform)', () => {
  let fg: FormGroup;
  let fixture: ComponentFixture<TransformHost>;
  let host: TransformHost;

  beforeEach(async () => {
    fg = new FormGroup({});
    await TestBed.configureTestingModule({ imports: [TransformHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TransformHost);
    host = fixture.componentInstance;
    host.fg = fg;
    fixture.detectChanges();
  });

  /** Commits a date the way the calendar does. */
  function pick(value: Date): void {
    host.date.formControl.setValue(value);
    fixture.detectChanges();
  }

  it('registers the model-facing control so the form field matches the model', () => {
    const picked = new Date(2026, 7, 15);
    const expected = new Date(2026, 7, 15, 0, 0, 0, 0).toISOString();

    pick(picked);

    expect(host.model).toBe(expected);
    expect(fg.get('dob')!.value).toBe(expected);
    expect(host.changes).toEqual([expected]);
  });

  it('serializes with toUTCString when asked', () => {
    host.transform = 'UTCString';
    fixture.detectChanges();
    const expected = new Date(2026, 7, 15, 0, 0, 0, 0).toUTCString();

    pick(new Date(2026, 7, 15));

    expect(host.model).toBe(expected);
    expect(fg.get('dob')!.value).toBe(expected);
  });

  // why: người dùng chọn NGÀY, không chọn thời điểm — editor mang giờ nào cũng phải quy về nửa đêm
  // local trước khi serialize, nếu không cùng một ngày lại ra hai chuỗi khác nhau.
  it('always serializes local start-of-day regardless of the time the editor carries', () => {
    const expected = new Date(2026, 7, 15, 0, 0, 0, 0).toISOString();

    pick(new Date(2026, 7, 15, 23, 45, 12, 999));

    expect(host.model).toBe(expected);
  });

  it('keeps the display in dd/MM/yyyy', () => {
    pick(new Date(2026, 7, 15));

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('15/08/2026');
  });

  it('renders an incoming ISO string on its local calendar day', () => {
    host.model = new Date(2026, 7, 15, 9, 30).toISOString();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('15/08/2026');
  });

  // why: `DateUtilities.isDate` từ chối chuỗi RFC-1123, nên nếu không có nhánh parse riêng thì
  // component không đọc lại được chính output `UTCString` của mình.
  it('renders an incoming UTC string on its local calendar day', () => {
    host.transform = 'UTCString';
    host.model = new Date(2026, 7, 15, 9, 30).toUTCString();
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('15/08/2026');
  });

  it('does not feed an external model update back as a change', () => {
    host.model = new Date(2026, 7, 15).toISOString();
    fixture.detectChanges();

    expect(host.changes).toEqual([]);
  });

  it('emits exactly once per commit', () => {
    pick(new Date(2026, 7, 15));
    pick(new Date(2026, 7, 16));

    expect(host.changes.length).toBe(2);
  });

  it('keeps null semantics on clear', () => {
    pick(new Date(2026, 7, 15));
    host.changes.length = 0;

    host.date.clear(undefined);
    fixture.detectChanges();

    expect(host.model).toBeNull();
    expect(fg.get('dob')!.value).toBeNull();
    expect(host.changes).toEqual([null]);
  });

  it('leaves an untouched model undefined instead of emitting null', () => {
    expect(host.model).toBeUndefined();
    expect(host.changes).toEqual([]);
  });

  it('ignores an unparseable external value without throwing', () => {
    expect(() => {
      host.model = 'khong-phai-ngay';
      fixture.detectChanges();
    }).not.toThrow();
    expect(host.changes).toEqual([]);
  });

  // why: đổi config KHÔNG được tự viết lại model đang bind — chỉ lần commit kế tiếp mới đổi shape.
  it('does not rewrite the bound model when the transform changes at runtime', () => {
    pick(new Date(2026, 7, 15));
    const iso = host.model;
    host.changes.length = 0;

    host.transform = 'UTCString';
    fixture.detectChanges();

    expect(host.model).toBe(iso);
    expect(host.changes).toEqual([]);
  });

  it('uses the new strategy on the next commit after a runtime change', () => {
    pick(new Date(2026, 7, 15));
    host.transform = 'UTCString';
    fixture.detectChanges();

    pick(new Date(2026, 7, 16));

    expect(host.model).toBe(new Date(2026, 7, 16, 0, 0, 0, 0).toUTCString());
  });

  it('renders a value written through the registered control', () => {
    fg.get('dob')!.setValue(new Date(2026, 7, 15).toISOString());
    fixture.detectChanges();

    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('15/08/2026');
    expect(host.model).toBe(new Date(2026, 7, 15).toISOString());
  });

  it('mirrors the editor validity onto the registered control', () => {
    host.date.formControl.setErrors({ required: true });
    fixture.detectChanges();

    expect(fg.get('dob')!.hasError('required')).toBeTrue();
    expect(fg.valid).toBeFalse();
  });
});

describe('SdDate (transform absent)', () => {
  let fg: FormGroup;
  let fixture: ComponentFixture<TransformHost>;
  let host: TransformHost;

  beforeEach(async () => {
    fg = new FormGroup({});
    await TestBed.configureTestingModule({ imports: [TransformHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TransformHost);
    host = fixture.componentInstance;
    host.fg = fg;
    host.transform = undefined;
    fixture.detectChanges();
  });

  // why: khoá lại hợp đồng cũ — không có transform thì form cha vẫn nhận `Date` của editor và model
  // vẫn là canonical `yyyy/MM/dd`. Đây chính là thứ dễ vỡ nhất khi thêm control thứ hai.
  it('keeps registering the editor control and emitting the canonical string', () => {
    host.date.formControl.setValue(new Date(2026, 7, 15));
    fixture.detectChanges();

    expect(fg.get('dob')!.value instanceof Date).toBeTrue();
    expect(host.model).toBe('2026/08/15');
    expect(host.changes).toEqual(['2026/08/15']);
  });
});
