import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdDateRange } from './date-range.component';

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdDateRange, FormsModule, ReactiveFormsModule],
  template: `<sd-date-range
    [label]="label"
    [required]="required"
    [disabled]="disabled"
    [min]="min"
    [max]="max"
    [model]="model"
    (modelChange)="model = $event"
    (sdChange)="onSdChange($event)"></sd-date-range>`,
})
class HostComponent {
  label?: string;
  required = false;
  disabled = false;
  min: any = undefined;
  max: any = undefined;
  model: any = undefined;
  changes: any[] = [];
  onSdChange(v: any) { this.changes.push(v); }
}

@Component({
  standalone: true,
  imports: [SdDateRange],
  template: `<sd-date-range name="period" [form]="fg"></sd-date-range>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [SdDateRange, FormsModule],
  template: `<form #f="ngForm"><sd-date-range name="period" [form]="f"></sd-date-range></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

// ---------------------------------------------------------------------------
// Main describe
// ---------------------------------------------------------------------------

describe('SdDateRange', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdDateRange;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDateRange)
      ?.componentInstance as SdDateRange;
    if (!comp) throw new Error('SdDateRange not found in fixture');
  });

  // -------------------------------------------------------------------------
  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(comp).toBeTruthy();
    });

    it('renders mat-date-range-input with two date inputs', () => {
      const startInput = fixture.nativeElement.querySelector('input[matStartDate]');
      const endInput = fixture.nativeElement.querySelector('input[matEndDate]');
      expect(startInput).not.toBeNull();
      expect(endInput).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('model two-way binding', () => {
    it('downward: sets control1 (from) when model changes', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      // control1 holds a Date for the "from" date
      expect(comp.control1.value).not.toBeNull();
    });

    it('downward: sets control2 (to) when model changes', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      expect(comp.control2.value).not.toBeNull();
    });

    it('clears both controls when model is set to null', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      host.model = null;
      fixture.detectChanges();
      expect(comp.control1.value).toBeNull();
      expect(comp.control2.value).toBeNull();
    });

    it('upward: clear() emits { from: null, to: null } via sdChange', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      comp.clear();
      expect(host.changes).toContain(jasmine.objectContaining({ from: null, to: null }));
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
    it('applies required error to formControl when control is empty', () => {
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(true);
    });

    it('applies required error to control1 (from) when empty', () => {
      host.required = true;
      fixture.detectChanges();
      comp.control1.setValue(null, { emitEvent: false });
      comp.control1.updateValueAndValidity({ emitEvent: false });
      expect(comp.control1.hasError('required')).toBe(true);
    });

    it('passes required validation when both from/to have values', () => {
      host.required = true;
      fixture.detectChanges();
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('disabled', () => {
    it('disables formControl, control1, control2 when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(true);
      expect(comp.control1.disabled).toBe(true);
      expect(comp.control2.disabled).toBe(true);
    });

    it('re-enables all controls when disabled toggled off', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(false);
      expect(comp.control1.disabled).toBe(false);
      expect(comp.control2.disabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('output events', () => {
    it('onClosePicker emits current valueModel via sdChange', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      comp.onClosePicker();
      // sdChange emitted with the current model value
      expect(host.changes.length).toBeGreaterThan(0);
    });

    it('onEnter emits current valueModel via sdChange', () => {
      host.model = { from: '2026/03/01', to: '2026/03/31' };
      fixture.detectChanges();
      comp.onEnter();
      expect(host.changes.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('errorTooltipMessage', () => {
    it('returns "Vui lòng nhập thông tin" for required error on formControl', () => {
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.errorTooltipMessage).toBe('Vui lòng nhập thông tin');
    });

    it('returns undefined when there are no errors', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      expect(comp.errorTooltipMessage).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('date-fns migration parity', () => {
    // Migration moment → date-fns: matStartDate/matEndDate yêu cầu native Date
    // làm internal type. Nếu một migration tương lai vô tình lưu chuỗi (như từng
    // xảy ra với sd-datetime) thì các test này sẽ fail.

    it('control1 stores a native Date (not a string/Moment) after model is set', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      expect(comp.control1.value instanceof Date).toBe(true);
    });

    it('control2 stores a native Date (not a string/Moment) after model is set', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      expect(comp.control2.value instanceof Date).toBe(true);
    });

    it('control1/control2 store Date for date-only ISO strings (yyyy-MM-dd)', () => {
      host.model = { from: '2025-10-23', to: '2025-12-31' };
      fixture.detectChanges();
      expect(comp.control1.value instanceof Date).toBe(true);
      expect(comp.control2.value instanceof Date).toBe(true);
      const from: Date = comp.control1.value;
      const to: Date = comp.control2.value;
      expect(from.getFullYear()).toBe(2025);
      expect(from.getMonth()).toBe(9); // October
      expect(from.getDate()).toBe(23);
      expect(to.getFullYear()).toBe(2025);
      expect(to.getMonth()).toBe(11); // December
      expect(to.getDate()).toBe(31);
    });

    it('control1/control2 accept native Date objects in model', () => {
      host.model = {
        from: new Date(2026, 0, 1),
        to: new Date(2026, 0, 31),
      };
      fixture.detectChanges();
      expect(comp.control1.value instanceof Date).toBe(true);
      expect(comp.control2.value instanceof Date).toBe(true);
      expect((comp.control1.value as Date).getFullYear()).toBe(2026);
    });

    it('sdChange emits yyyy/MM/dd string format (not Date object) for downstream consumers', () => {
      // Migration phải giữ contract OUT là yyyy/MM/dd string (như Moment cũ).
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      host.changes.length = 0;
      comp.onEnter();
      const last = host.changes[host.changes.length - 1];
      expect(last).toBeTruthy();
      expect(typeof last.from).toBe('string');
      expect(typeof last.to).toBe('string');
      expect(last.from).toBe('2026/01/01');
      expect(last.to).toBe('2026/01/31');
    });

    it('no console errors thrown during set + clear lifecycle', () => {
      const spy = spyOn(console, 'error').and.callThrough();
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      comp.clear();
      fixture.detectChanges();
      const dateErrors = spy.calls.allArgs().filter(args =>
        args.some(a => typeof a === 'string' && (a.includes('DatePipe') || a.includes('Invalid Date')))
      );
      expect(dateErrors.length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('clear behavior', () => {
    it('clears control1 and control2 on clear()', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      comp.clear();
      expect(comp.control1.value).toBeNull();
      expect(comp.control2.value).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// FormGroup lifecycle
// ---------------------------------------------------------------------------

describe('SdDateRange (FormGroup lifecycle)', () => {
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

  it('adds named control to FormGroup on init', () => {
    expect(fg.contains('period')).toBe(true);
  });

  it('removes named control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('period')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdDateRange (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('period')).toBe(true);
  }));
});
