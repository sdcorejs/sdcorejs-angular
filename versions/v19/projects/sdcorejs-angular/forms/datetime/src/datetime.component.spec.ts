import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdDatetimePicker } from '@sdcorejs/angular-material-datetime';
import { SdDatetime } from './datetime.component';

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdDatetime, FormsModule, ReactiveFormsModule],
  template: `<sd-datetime
    [label]="label"
    [placeholder]="placeholder"
    [required]="required"
    [disabled]="disabled"
    [viewed]="viewed"
    [min]="min"
    [max]="max"
    [showSeconds]="showSeconds"
    [model]="model"
    (modelChange)="model = $event"
    (sdChange)="onSdChange($event)"
    (sdFocus)="onSdFocus()"></sd-datetime>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  required = false;
  disabled = false;
  viewed = false;
  showSeconds = false;
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
  standalone: true,
  imports: [SdDatetime],
  template: `<sd-datetime name="startAt" [form]="fg"></sd-datetime>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [SdDatetime, FormsModule],
  template: `<form #f="ngForm"><sd-datetime name="startAt" [form]="f"></sd-datetime></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

// ---------------------------------------------------------------------------
// Main describe
// ---------------------------------------------------------------------------

describe('SdDatetime', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdDatetime;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDatetime)?.componentInstance as SdDatetime;
    if (!comp) throw new Error('SdDatetime not found in fixture');
  });

  afterEach(() => comp.close());

  const packagePicker = (): SdDatetimePicker<Date> => {
    const pickerDebugElement = fixture.debugElement.query(By.directive(SdDatetimePicker));
    if (!pickerDebugElement) throw new Error('Package-backed SdDatetimePicker not found');
    return pickerDebugElement.componentInstance as SdDatetimePicker<Date>;
  };

  const clickPickerAction = (selector: string): void => {
    const button = document.querySelector<HTMLButtonElement>(selector);
    expect(button).withContext(`Picker action ${selector} was not rendered`).not.toBeNull();
    button!.click();
    fixture.detectChanges();
  };

  // -------------------------------------------------------------------------
  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(comp).toBeTruthy();
    });

    it('renders a matInput inside a mat-form-field', () => {
      const input = fixture.nativeElement.querySelector('input[matInput], input[matinput]');
      expect(input).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('model two-way binding', () => {
    it('downward: sets formControl display value when model is set', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      expect(comp.formControl.value).not.toBeNull();
    });

    it('clears formControl when model is set to null', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      host.model = null;
      fixture.detectChanges();
      expect(comp.formControl.value).toBeNull();
    });

    it('upward via clear(): emits null and resets valueModel', () => {
      host.model = '2026/05/15 14:30:00';
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
  describe('clear button (slim)', () => {
    const clearBtn = () => fixture.nativeElement.querySelector('button.sd-clear-btn') as HTMLButtonElement | null;

    it('renders the slim clear button when a value is set', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      expect(clearBtn()).not.toBeNull();
    });

    it('hides the clear button when there is no value', () => {
      fixture.detectChanges();
      expect(clearBtn()).toBeNull();
    });

    it('hides the clear button when required', () => {
      host.required = true;
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      expect(clearBtn()).toBeNull();
    });

    it('hides the clear button when disabled', () => {
      host.disabled = true;
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      expect(clearBtn()).toBeNull();
    });

    it('clicking the clear button resets value and emits null', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      clearBtn()!.click();
      fixture.detectChanges();
      expect(comp.formControl.value).toBeNull();
      expect(host.changes).toContain(null);
    });

    it('uses the slim close icon (not the filled cancel icon)', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      const icon = clearBtn()!.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('close');
    });
  });

  // -------------------------------------------------------------------------
  describe('min/max validation', () => {
    it('resolvedMin returns a Date when min is an ISO string', () => {
      host.min = '2026-01-01T00:00:00';
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
    it('applies required error when control is empty and required = true', () => {
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.markAsTouched();
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(true);
    });

    it('passes required validation when a value is present', () => {
      host.required = true;
      fixture.detectChanges();
      host.model = '2026/05/15 14:30:00';
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
  describe('showSeconds input', () => {
    it('showSeconds defaults to false', () => {
      expect(comp.showSeconds()).toBe(false);
    });

    it('accepts showSeconds = true', () => {
      host.showSeconds = true;
      fixture.detectChanges();
      expect(comp.showSeconds()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('output events', () => {
    it('emits sdFocus when onFocus is called', () => {
      comp.onFocus();
      expect(host.focused).toBe(true);
    });

    it('sets isFocused = false after onBlur', () => {
      comp.onFocus();
      comp.onBlur();
      expect(comp.isFocused).toBe(false);
    });

    it('sdChange emits null via clear()', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      const event = {
        stopPropagation: () => {
          /* noop */
        },
      };
      comp.clear(event);
      const last = host.changes[host.changes.length - 1];
      expect(last).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('errorMessage', () => {
    it('returns "Vui lòng nhập thông tin" for required error', () => {
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.markAsTouched();
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.errorMessage()).toBe('Vui lòng nhập thông tin');
    });

    it('returns undefined when no errors', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      expect(comp.errorMessage()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('onConfirmInput — direct text entry', () => {
    it('sets date error when format is invalid', fakeAsync(() => {
      const event = { target: { value: 'not-a-date' } };
      comp.onConfirmInput(event);
      tick(50);
      expect(comp.formControl.hasError('date')).toBe(true);
    }));

    it('clears model and emits null when input is cleared', fakeAsync(() => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      const event = { target: { value: '' } };
      comp.onConfirmInput(event);
      tick(50);
      expect(host.changes).toContain(null);
    }));

    it('emits stored value when valid dd/MM/yyyy HH:mm string is entered', fakeAsync(() => {
      const event = { target: { value: '15/05/2026 14:30' } };
      comp.onConfirmInput(event);
      tick(50);
      // Should emit a yyyy/MM/dd HH:mm:00 string
      const last = host.changes[host.changes.length - 1];
      expect(typeof last).toBe('string');
      expect(last).toContain('2026');
    }));
  });

  // -------------------------------------------------------------------------
  describe('viewed mode', () => {
    // Regression: trước fix, viewed mode bind `formControl.value | date:` mà
    // formControl.value lại là chuỗi `dd/MM/yyyy HH:mm` (display string) nên
    // DatePipe văng "Unable to convert ... into a date".
    // Fix: dùng computed `viewedDate` parse trực tiếp từ valueModel ra Date.

    it('viewedDate returns null when no model is set', () => {
      expect(comp.viewedDate()).toBeNull();
    });

    it('viewedDate returns a valid Date when model is a yyyy/MM/dd HH:mm:ss string', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      const d = comp.viewedDate();
      expect(d).not.toBeNull();
      expect(d instanceof Date).toBe(true);
      expect(d!.getFullYear()).toBe(2026);
      expect(d!.getMonth()).toBe(4); // May = index 4
      expect(d!.getDate()).toBe(15);
      expect(d!.getHours()).toBe(14);
      expect(d!.getMinutes()).toBe(30);
    });

    it('viewedDate returns a valid Date when model is a native Date', () => {
      host.model = new Date(2026, 4, 15, 14, 30, 0);
      fixture.detectChanges();
      const d = comp.viewedDate();
      expect(d).not.toBeNull();
      expect(d instanceof Date).toBe(true);
      expect(d!.getFullYear()).toBe(2026);
    });

    it('viewedDate returns null when model is an invalid string', () => {
      host.model = 'not-a-date';
      fixture.detectChanges();
      expect(comp.viewedDate()).toBeNull();
    });

    it('viewedDate handles a date-only ISO string (yyyy-MM-dd) without time', () => {
      // Reproducer from production:
      // <sd-datetime [model]="'2025-10-23'" viewed></sd-datetime>
      host.model = '2025-10-23';
      fixture.detectChanges();
      const d = comp.viewedDate();
      expect(d).not.toBeNull();
      expect(d instanceof Date).toBe(true);
      expect(d!.getFullYear()).toBe(2025);
      expect(d!.getMonth()).toBe(9); // October
      expect(d!.getDate()).toBe(23);
    });

    it('viewed + date-only ISO string does NOT throw DatePipe error (production reproducer)', () => {
      const spy = spyOn(console, 'error').and.callThrough();
      host.viewed = true;
      host.model = '2025-10-23';
      expect(() => fixture.detectChanges()).not.toThrow();
      const datePipeErrors = spy.calls.allArgs().filter(args => args.some(a => typeof a === 'string' && a.includes('DatePipe')));
      expect(datePipeErrors.length).toBe(0);
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView.textContent).toContain('23/10/2025');
    });

    it('viewedDate returns null when model is explicitly null', () => {
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      host.model = null;
      fixture.detectChanges();
      expect(comp.viewedDate()).toBeNull();
    });

    it('renders sd-view (not the matInput) when viewed = true', () => {
      host.viewed = true;
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      const matInput = fixture.nativeElement.querySelector('input[matInput], input[matinput]');
      expect(sdView).not.toBeNull();
      expect(matInput).toBeNull();
    });

    it('regression: viewed mode does NOT throw DatePipe parse error', () => {
      // Trước fix, dòng này sẽ log/throw:
      // "Unable to convert "15/05/2026 14:30" into a date for pipe 'DatePipe'"
      // vì formControl.value là chuỗi "15/05/2026 14:30".
      const spy = spyOn(console, 'error').and.callThrough();
      host.viewed = true;
      host.model = '2026/05/15 14:30:00';
      expect(() => fixture.detectChanges()).not.toThrow();
      // Bonus: không có lỗi DatePipe nào được log.
      const datePipeErrors = spy.calls.allArgs().filter(args => args.some(a => typeof a === 'string' && a.includes('DatePipe')));
      expect(datePipeErrors.length).toBe(0);
    });

    it('viewed mode renders formatted display string (dd/MM/yyyy HH:mm) in sd-view', () => {
      host.viewed = true;
      host.model = '2026/05/15 14:30:00';
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView).not.toBeNull();
      // sd-view renders [display] in its inner content
      expect(sdView.textContent).toContain('15/05/2026');
      expect(sdView.textContent).toContain('14:30');
    });

    it('viewed mode with showSeconds = true renders seconds in display', () => {
      host.viewed = true;
      host.showSeconds = true;
      host.model = '2026/05/15 14:30:45';
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView).not.toBeNull();
      expect(sdView.textContent).toContain('14:30:45');
    });

    it('viewed mode with showSeconds = false omits seconds from display', () => {
      host.viewed = true;
      host.showSeconds = false;
      host.model = '2026/05/15 14:30:45';
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView).not.toBeNull();
      expect(sdView.textContent).not.toContain('14:30:45');
      expect(sdView.textContent).toContain('14:30');
    });
  });

  // -------------------------------------------------------------------------
  describe('pickerOpened state', () => {
    it('starts with pickerOpened = false', () => {
      expect(comp.pickerOpened()).toBe(false);
    });

    it('close() keeps pickerOpened = false when already closed', () => {
      comp.close();
      expect(comp.pickerOpened()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('package-backed picker integration', () => {
    it('resolves the picker from @sdcorejs/angular-material-datetime', () => {
      expect(packagePicker()).toBeTruthy();
    });

    it('renders the package calendar, time spinner, and localized projected actions', () => {
      comp.open();
      fixture.detectChanges();

      const panel = document.querySelector<HTMLElement>('.sd-datetime-picker__panel');
      expect(panel).not.toBeNull();
      expect(panel!.querySelector('mat-calendar')).not.toBeNull();
      expect(panel!.querySelector('sd-time-spinner')).not.toBeNull();
      expect(panel!.querySelector('button[sdDatetimePickerNow]')?.textContent).toContain('Bây giờ');
      expect(panel!.querySelector('button[sdDatetimePickerCancel]')?.textContent).toContain('Hủy');
      expect(panel!.querySelector('button[sdDatetimePickerApply]')?.textContent).toContain('Xác nhận');
    });

    it('forwards showSeconds and min/max bounds to the package picker', () => {
      const min = new Date(2026, 0, 1, 8, 0, 0);
      const max = new Date(2026, 11, 31, 18, 0, 0);
      host.showSeconds = true;
      host.min = min;
      host.max = max;
      fixture.detectChanges();

      const picker = packagePicker();
      expect(picker.showSeconds()).toBe(true);
      expect(picker.minDate()).toEqual(min);
      expect(picker.maxDate()).toEqual(max);
    });

    it('opens with the current model as the package selection', () => {
      host.model = '2026/05/15 09:30:45';
      fixture.detectChanges();

      comp.open();
      fixture.detectChanges();

      expect(packagePicker().selected()).toEqual(new Date(2026, 4, 15, 9, 30, 45));
    });

    it('refreshes the package selection after an external model update', () => {
      const picker = packagePicker();
      const firstValue = new Date(2026, 4, 15, 9, 30, 0);

      comp.open();
      picker.select(firstValue);
      fixture.detectChanges();
      clickPickerAction('button[sdDatetimePickerApply]');

      host.model = '2026/06/20 16:45:00';
      fixture.detectChanges();
      comp.open();
      fixture.detectChanges();

      expect(picker.selected()).toEqual(new Date(2026, 5, 20, 16, 45, 0));
    });

    it('Cancel closes the overlay without committing the pending selection', () => {
      host.model = '2026/05/15 09:00:00';
      fixture.detectChanges();
      const picker = packagePicker();

      comp.open();
      picker.select(new Date(2026, 4, 16, 10, 30, 0));
      fixture.detectChanges();
      clickPickerAction('button[sdDatetimePickerCancel]');

      expect(comp.pickerOpened()).toBe(false);
      expect(host.model).toBe('2026/05/15 09:00:00');
      expect(host.changes).toEqual([]);
    });

    it('Now updates only the pending package selection', () => {
      const picker = packagePicker();
      comp.open();
      fixture.detectChanges();
      const beforeClick = Date.now();

      clickPickerAction('button[sdDatetimePickerNow]');

      const selected = picker.selected();
      const afterClick = Date.now();
      expect(selected instanceof Date).toBe(true);
      expect((selected as Date).getTime()).toBeGreaterThanOrEqual(beforeClick);
      expect((selected as Date).getTime()).toBeLessThanOrEqual(afterClick);
      expect(comp.pickerOpened()).toBe(true);
      expect(host.changes).toEqual([]);
    });

    it('Apply commits seconds when showSeconds is enabled', () => {
      host.showSeconds = true;
      fixture.detectChanges();
      const picker = packagePicker();

      comp.open();
      picker.select(new Date(2026, 4, 15, 14, 30, 45));
      fixture.detectChanges();
      clickPickerAction('button[sdDatetimePickerApply]');

      expect(comp.pickerOpened()).toBe(false);
      expect(host.model).toBe('2026/05/15 14:30:45');
      expect(host.changes).toEqual(['2026/05/15 14:30:45']);
    });

    it('Apply normalizes seconds to zero when showSeconds is disabled', () => {
      const picker = packagePicker();

      comp.open();
      picker.select(new Date(2026, 4, 15, 14, 30, 45));
      fixture.detectChanges();
      clickPickerAction('button[sdDatetimePickerApply]');

      expect(host.model).toBe('2026/05/15 14:30:00');
      expect(host.changes).toEqual(['2026/05/15 14:30:00']);
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
      comp.formControl.setValue('15/05/2026 14:30');
      fixture.detectChanges();
      expect(el.getAttribute('data-empty')).toBe('false');
    });

    it('renders data-value as ISO string for datetime string', () => {
      comp.formControl.setValue('15/05/2026 14:30');
      fixture.detectChanges();
      const el: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(el.getAttribute('data-value')).toBeTruthy();
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

describe('SdDatetime (FormGroup lifecycle)', () => {
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
    expect(fg.contains('startAt')).toBe(true);
  });

  it('removes control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('startAt')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdDatetime (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('startAt')).toBe(true);
  }));
});

// ---------------------------------------------------------------------------
// bare input + open()
// ---------------------------------------------------------------------------

describe('SdDatetime (bare input + open)', () => {
  let bareFixture: ComponentFixture<SdDatetime>;
  let bareComp: SdDatetime;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdDatetime, NoopAnimationsModule],
    }).compileComponents();
    bareFixture = TestBed.createComponent(SdDatetime);
    bareComp = bareFixture.componentInstance;
  });

  afterEach(() => bareComp.close());

  it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
    bareFixture.detectChanges();
    expect((bareFixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(false);
    bareFixture.componentRef.setInput('label', 'Bắt đầu');
    bareFixture.detectChanges();
    expect((bareFixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(true);
  });

  it('viewed defaults false; viewed=true adds .sd-viewed host class', () => {
    bareFixture.detectChanges();
    expect((bareFixture.nativeElement as HTMLElement).classList.contains('sd-viewed')).toBe(false);
    bareFixture.componentRef.setInput('viewed', true);
    bareFixture.detectChanges();
    expect((bareFixture.nativeElement as HTMLElement).classList.contains('sd-viewed')).toBe(true);
  });

  it('open() opens the picker overlay', () => {
    bareFixture.detectChanges();
    bareComp.open();
    expect(bareComp.pickerOpened()).toBe(true);
  });

  it('open() is a no-op when disabled', () => {
    bareFixture.componentRef.setInput('disabled', true);
    bareFixture.detectChanges();
    bareComp.open();
    expect(bareComp.pickerOpened()).toBe(false);
  });

  it('destroying the component disposes its open package overlay', () => {
    const cleanupFixture = TestBed.createComponent(SdDatetime);
    cleanupFixture.detectChanges();
    cleanupFixture.componentInstance.open();
    expect(document.querySelector('.sd-datetime-picker__overlay')).not.toBeNull();

    cleanupFixture.destroy();

    expect(document.querySelector('.sd-datetime-picker__overlay')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state `viewed`)
// ---------------------------------------------------------------------------

describe('SdDatetime (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdDatetime>;
  let comp: SdDatetime;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdDatetime, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdDatetime);
    comp = fixture.componentInstance;
  });

  it('viewed="inline" → isInline true, isViewed false; text face + (hidden) editor both rendered', () => {
    // asserts: inline mounts BOTH the sd-view face AND the bare-hidden datetime editor
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    comp.formControl.setValue('2026/05/15 14:30:00');
    fixture.detectChanges();
    expect(comp.isInline()).toBe(true);
    expect(comp.isViewed()).toBe(false);
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-inline-editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[matInput]')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
  });

  it('clicking the text face opens the overlay WITHOUT hiding the view text', () => {
    // asserts: text retained while editing; click → open() via enterInlineEdit
    const openSpy = spyOn(comp, 'open').and.callThrough();
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    comp.formControl.setValue('2026/05/15 14:30:00');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sd-inline-view') as HTMLElement).click();
    fixture.detectChanges();
    expect(openSpy).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
  });

  it('inline clear-× gated by clearable', () => {
    // asserts: clearable inline datetime shows clear-×; [clearable]=false suppresses it
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    comp.formControl.setValue('2026/05/15 14:30:00');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-view .sd-inline-clear')).not.toBeNull();
    fixture.componentRef.setInput('clearable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-clear')).toBeNull();
  });

  it('viewed=true stays static (no editor, no inline face)', () => {
    // asserts: viewed=true unchanged DETAIL — sd-view only
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    comp.formControl.setValue('2026/05/15 14:30:00');
    fixture.detectChanges();
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.sd-inline-view')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[matInput]')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  });
});
