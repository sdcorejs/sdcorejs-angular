import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdDateRange, SdDateRangeValue } from './date-range.component';

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
    [viewed]="viewed"
    [min]="min"
    [max]="max"
    [autoId]="autoId"
    [model]="model"
    (modelChange)="model = $event"
    (sdChange)="onSdChange($event)"></sd-date-range>`,
})
class HostComponent {
  label?: string;
  required = false;
  disabled = false;
  viewed = false;
  min: any = undefined;
  max: any = undefined;
  autoId: string | null | undefined = undefined;
  model: any = undefined;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
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
  it('exposes a named value type for consumer form contracts', () => {
    const value: SdDateRangeValue = { from: '2026/07/01', to: '2026/07/21' };
    expect(value.from).toBe('2026/07/01');
    expect(value.to).toBe('2026/07/21');
  });
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
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDateRange)?.componentInstance as SdDateRange;
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

    // why: RED trước fix — `Validators.required` dùng `isEmptyInputValue`, mà value của control
    // tổng LUÔN là object `{ from, to }`. Object không bao giờ "empty" nên `[required]` không
    // bao giờ bắt được range rỗng; test cũ chỉ pass vì nó `setValue(null)` thủ công.
    it('flags required on the aggregate control while it holds the real { from, to } object', () => {
      host.required = true;
      fixture.detectChanges();

      expect(comp.formControl.value).toEqual({ from: null, to: null });
      expect(comp.formControl.hasError('required')).toBe(true);
    });

    it('flags required when only one endpoint of the range is filled', () => {
      host.required = true;
      host.model = { from: '2026/01/01', to: null };
      fixture.detectChanges();

      expect(comp.formControl.value).toEqual(jasmine.objectContaining({ to: null }));
      expect(comp.formControl.hasError('required')).toBe(true);
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
  describe('errorMessage', () => {
    it('returns "Vui lòng nhập thông tin" for required error on formControl', () => {
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(null);
      comp.formControl.updateValueAndValidity();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBe('Vui lòng nhập thông tin');
    });

    it('returns undefined when there are no errors', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      expect(comp.errorMessage()).toBeUndefined();
    });

    // why: RED trước fix — `errorMessage` chỉ đọc `#state` (control tổng) nên khi Material bắn
    // matDatepickerMin lên control1, computed vẫn giữ nguyên giá trị memo hoá (undefined).
    it('recomputes from endpoint errors (matDatepickerMin on control1), not just the aggregate', () => {
      host.min = '2026-01-01';
      fixture.detectChanges();
      // memo hoá computed ở trạng thái sạch TRƯỚC khi lỗi xuất hiện — đây là điều kiện lộ bug
      expect(comp.errorMessage()).toBeUndefined();

      comp.control1.setValue(new Date(2020, 0, 1));
      fixture.detectChanges();

      expect(comp.control1.hasError('matDatepickerMin')).toBe(true);
      expect(comp.errorMessage()).toBe('Ngày bắt đầu không hợp lệ (nhỏ hơn giới hạn)');
    });

    // why: lỗi của 2 đầu range phải được kéo lên control tổng — nếu không form cha VALID
    // trong khi UI đang đỏ, và submit lọt một range vi phạm min/max.
    it('propagates endpoint errors onto the aggregate control so the parent form sees them', () => {
      host.min = '2026-01-01';
      fixture.detectChanges();

      comp.control1.setValue(new Date(2020, 0, 1));
      fixture.detectChanges();

      expect(comp.formControl.hasError('matDatepickerMin')).toBe(true);
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
      const dateErrors = spy.calls
        .allArgs()
        .filter(args => args.some(a => typeof a === 'string' && (a.includes('DatePipe') || a.includes('Invalid Date'))));
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

  // -------------------------------------------------------------------------
  describe('E2E attributes', () => {
    it('renders data-disabled reflecting FormControl state', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('mat-date-range-input');
      expect(el.getAttribute('data-disabled')).toBe('false');
      comp.formControl.disable();
      fixture.detectChanges();
      expect(el.getAttribute('data-disabled')).toBe('true');
    });

    it('renders data-empty=true when from or to is missing', () => {
      comp.formControl.setValue({ from: new Date('2026-05-01'), to: null });
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('mat-date-range-input');
      expect(el.getAttribute('data-empty')).toBe('true');
    });

    it('renders data-empty=false when both from and to are present', () => {
      comp.formControl.setValue({
        from: new Date('2026-05-01T00:00:00.000Z'),
        to: new Date('2026-05-31T00:00:00.000Z'),
      });
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('mat-date-range-input');
      expect(el.getAttribute('data-empty')).toBe('false');
    });

    it('renders data-value as JSON for {from, to}', () => {
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T00:00:00.000Z');
      comp.formControl.setValue({ from, to });
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('mat-date-range-input');
      expect(el.getAttribute('data-value')).toBe(JSON.stringify({ from, to }));
    });

    it('renders data-invalid=true only after dirty + invalid', () => {
      // sdFormControlState gates invalid on (touched || dirty).
      // MatDateRangeInput's form integration resets touched state on the aggregate
      // formControl, so we use markAsDirty() to satisfy the gate instead.
      host.required = true;
      fixture.detectChanges();
      const el = fixture.nativeElement.querySelector('mat-date-range-input');
      expect(el.getAttribute('data-invalid')).toBe('false');
      comp.formControl.setErrors({ required: true });
      comp.formControl.markAsDirty();
      fixture.detectChanges();
      expect(el.getAttribute('data-invalid')).toBe('true');
    });

    it('does not render undefined-from/undefined-to when autoId is not provided', () => {
      fixture.detectChanges();
      const startInput = fixture.nativeElement.querySelector('input[matStartDate]');
      const endInput = fixture.nativeElement.querySelector('input[matEndDate]');
      expect(startInput.getAttribute('data-autoid')).toBeNull();
      expect(endInput.getAttribute('data-autoid')).toBeNull();
    });

    it('renders namespaced data-autoid for range input and both date endpoints', () => {
      host.autoId = 'createdAt';
      fixture.detectChanges();
      const rangeInput = fixture.nativeElement.querySelector('mat-date-range-input');
      const startInput = fixture.nativeElement.querySelector('input[matStartDate]');
      const endInput = fixture.nativeElement.querySelector('input[matEndDate]');
      expect(rangeInput.getAttribute('data-autoid')).toBe('forms-date-range-createdAt');
      expect(startInput.getAttribute('data-autoid')).toBe('forms-date-range-createdAt-from');
      expect(endInput.getAttribute('data-autoid')).toBe('forms-date-range-createdAt-to');
    });
  });

  // -------------------------------------------------------------------------
  describe('viewed + open()', () => {
    const hasClearIcon = () =>
      Array.from(fixture.nativeElement.querySelectorAll('mat-icon') as NodeListOf<HTMLElement>).some(
        i => i.textContent?.trim() === 'cancel'
      );

    it('renders the clear (cancel) icon when a range is set (edit mode)', () => {
      host.model = { from: '2026/01/01', to: '2026/01/31' };
      fixture.detectChanges();
      expect(hasClearIcon()).toBe(true);
    });

    it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
      host.label = undefined;
      fixture.detectChanges();
      const hostEl = fixture.nativeElement.querySelector('sd-date-range') as HTMLElement;
      expect(hostEl.classList.contains('sd-has-label')).toBe(false);
      host.label = 'Khoảng thời gian';
      fixture.detectChanges();
      expect(hostEl.classList.contains('sd-has-label')).toBe(true);
    });

    it('viewed defaults false; viewed=true adds .sd-viewed host class', () => {
      const hostEl = fixture.nativeElement.querySelector('sd-date-range') as HTMLElement;
      expect(hostEl.classList.contains('sd-viewed')).toBe(false);
      host.viewed = true;
      fixture.detectChanges();
      expect(hostEl.classList.contains('sd-viewed')).toBe(true);
    });

    it('viewed renders sd-view (not the mat-form-field input)', () => {
      host.viewed = true;
      fixture.detectChanges();
      const view = fixture.nativeElement.querySelector('sd-date-range sd-view');
      expect(view).not.toBeNull();
      const dateInput = fixture.nativeElement.querySelector('sd-date-range mat-date-range-input');
      expect(dateInput).toBeNull();
    });

    it('open() opens the range picker programmatically', () => {
      // grab the inner sd-date-range component instance
      const cmp = fixture.debugElement.query(By.directive(SdDateRange)).componentInstance as SdDateRange;
      const picker = cmp.picker();
      expect(picker).toBeTruthy();
      spyOn(picker!, 'open');
      cmp.open();
      expect(picker!.open).toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// FormGroup lifecycle
// ---------------------------------------------------------------------------

describe('SdDateRange (FormGroup lifecycle)', () => {
  let fg: FormGroup;
  let fixture: ComponentFixture<FgHost>;
  let comp: SdDateRange;

  // autoDetectChanges (KHÔNG detectChanges cưỡng bức) để tôn trọng OnPush — round-trip của
  // `fg.reset` / `fg.patchValue` đi qua subscriber + effect, chỉ CD tự nhiên mới đo đúng.
  beforeEach(async () => {
    fg = new FormGroup({});
    await TestBed.configureTestingModule({
      imports: [FgHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(FgHost);
    fixture.componentInstance.fg = fg;
    fixture.autoDetectChanges();
    await fixture.whenStable();
    comp = fixture.debugElement.query(By.directive(SdDateRange)).componentInstance as SdDateRange;
  });

  it('adds named control to FormGroup on init', () => {
    expect(fg.contains('period')).toBe(true);
  });

  it('removes named control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('period')).toBe(false);
  });

  // why: RED trước fix — 2 control đầu range được đăng ký dưới 2 tên UUID ngẫu nhiên, nên
  // `form.value` có 3 key và 2 trong số đó đổi theo từng instance: vỡ shape giá trị + `reset(obj)`.
  it('registers ONLY the aggregate control — no extra generated keys in form.value', () => {
    expect(Object.keys(fg.value)).toEqual(['period']);
    expect(Object.keys(fg.controls)).toEqual(['period']);
  });

  // why: RED trước fix — bài test cũ chỉ assert `Object.keys(fg.value)` (y hệt bài ngay trên) nên
  // KHÔNG chứng minh được gì về round-trip, trong khi round-trip đang HỎNG thật: control1/control2
  // đã bị gỡ khỏi FormGroup và không còn ai đẩy giá trị của control tổng xuống 2 đầu range, nên
  // `<mat-date-range-input>` giữ nguyên ngày cũ trong khi `form.value.period` đã đổi.
  it('round-trips form.reset(obj) down into both endpoints and the model', async () => {
    fg.reset({ period: { from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) } });
    await fixture.whenStable();

    expect(Object.keys(fg.value)).toEqual(['period']);
    expect(comp.control1.value instanceof Date).toBeTrue();
    expect(comp.control2.value instanceof Date).toBeTrue();
    expect((comp.control1.value as Date).getDate()).toBe(1);
    expect((comp.control2.value as Date).getDate()).toBe(31);
    expect(comp.valueModel()).toEqual({ from: '2026/01/01', to: '2026/01/31' });
  });

  it('round-trips form.patchValue(obj) down into both endpoints and the model', async () => {
    fg.patchValue({ period: { from: new Date(2026, 5, 10), to: new Date(2026, 5, 20) } });
    await fixture.whenStable();

    expect((comp.control1.value as Date).getMonth()).toBe(5);
    expect((comp.control1.value as Date).getDate()).toBe(10);
    expect((comp.control2.value as Date).getDate()).toBe(20);
    expect(comp.valueModel()).toEqual({ from: '2026/06/10', to: '2026/06/20' });
  });

  it('clears both endpoints and the model on a bare form.reset()', async () => {
    fg.patchValue({ period: { from: new Date(2026, 5, 10), to: new Date(2026, 5, 20) } });
    await fixture.whenStable();
    expect(comp.control1.value).not.toBeNull();

    fg.reset();
    await fixture.whenStable();

    expect(comp.control1.value).toBeNull();
    expect(comp.control2.value).toBeNull();
    expect(comp.valueModel()).toEqual({ from: null, to: null });
  });

  it('renders the reset range in the mat-date-range-input, not just in the model', async () => {
    fg.reset({ period: { from: new Date(2026, 0, 1), to: new Date(2026, 0, 31) } });
    await fixture.whenStable();

    const startInput = fixture.nativeElement.querySelector('input[matStartDate]') as HTMLInputElement;
    const endInput = fixture.nativeElement.querySelector('input[matEndDate]') as HTMLInputElement;
    expect(startInput.value).toBe('01/01/2026');
    expect(endInput.value).toBe('31/01/2026');
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

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state `viewed`)
// ---------------------------------------------------------------------------

describe('SdDateRange (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdDateRange>;
  let comp: SdDateRange;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdDateRange, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdDateRange);
    comp = fixture.componentInstance;
  });

  function seedValue(): void {
    comp.control1.setValue(new Date(2026, 0, 1));
    comp.control2.setValue(new Date(2026, 0, 31));
  }

  it('viewed="inline" → isInline true, isViewed false; text face + (hidden) range editor', () => {
    // asserts: inline mounts BOTH the sd-view face AND the bare-hidden range editor
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    seedValue();
    fixture.detectChanges();
    expect(comp.isInline()).toBe(true);
    expect(comp.isViewed()).toBe(false);
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-inline-editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-date-range-input')).not.toBeNull();
  });

  it('clicking the text face opens the range picker WITHOUT hiding the text', () => {
    // asserts: text retained while editing; click → open() via enterInlineEdit
    const openSpy = spyOn(comp, 'open').and.callThrough();
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    seedValue();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sd-inline-view') as HTMLElement).click();
    fixture.detectChanges();
    expect(openSpy).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
  });

  it('inline clear-× gated by clearable', () => {
    // asserts: clearable inline range shows clear-×; [clearable]=false suppresses it
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    seedValue();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-view .sd-inline-clear')).not.toBeNull();
    fixture.componentRef.setInput('clearable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-clear')).toBeNull();
  });

  it('disabled inline behaves like viewed=true (static, no editor / no face)', () => {
    // asserts: disabled 'inline' → isViewed true, isInline false; can't click-to-edit a disabled control
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    seedValue();
    fixture.detectChanges();
    expect(comp.isInline()).toBe(false);
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.sd-inline-view')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-date-range-input')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// OnPush reactivity — mọi write vào formControl từng dùng `{ emitEvent: false }`,
// nên `sdFormControlState` không tick và view đóng băng ở lần render đầu.
// Dùng autoDetectChanges (KHÔNG detectChanges cưỡng bức) để tôn trọng OnPush —
// detectChanges cưỡng bức che đúng lớp bug này.
// ---------------------------------------------------------------------------

describe('SdDateRange (OnPush error/state reactivity)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdDateRange;

  // why: `required` phải được set TRƯỚC lần CD đầu — sau đó mọi thay đổi chỉ được lái bằng
  // signal/control event, để bài test thực sự đo khả năng tự vẽ lại của OnPush.
  async function mount(required = false): Promise<void> {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.required = required;
    fixture.autoDetectChanges();
    await fixture.whenStable();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDateRange)?.componentInstance as SdDateRange;
  }

  const rangeInput = () => fixture.nativeElement.querySelector('mat-date-range-input') as HTMLElement;

  it('refreshes data-empty / data-value after a post-init model write', async () => {
    await mount();
    expect(rangeInput().getAttribute('data-empty')).toBe('true');

    comp.valueModel.set({ from: '2026/01/01', to: '2026/01/31' });
    await fixture.whenStable();

    expect(rangeInput().getAttribute('data-empty')).toBe('false');
    expect(rangeInput().getAttribute('data-value')).toContain('2026');
  });

  // why: chạm vào đầu range (tương đương blur ô "Từ") — đây cũng là điều kiện MatFormField
  // dùng để cho phép hiện subscript lỗi, nên nó phản ánh đúng luồng thật của người dùng.
  it('renders the <mat-error> once a required range is touched', async () => {
    await mount(true);

    comp.control1.markAsTouched();
    await fixture.whenStable();

    const error = fixture.nativeElement.querySelector('mat-error') as HTMLElement | null;
    expect(error?.textContent?.trim()).toBe('Vui lòng nhập thông tin');
    expect(rangeInput().getAttribute('data-invalid')).toBe('true');
    expect(rangeInput().getAttribute('data-error-message')).toBe('Vui lòng nhập thông tin');
  });

  it('clears the rendered error again once the range is filled', async () => {
    await mount(true);
    comp.control1.markAsTouched();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('mat-error')).not.toBeNull();

    comp.valueModel.set({ from: '2026/01/01', to: '2026/01/31' });
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    expect(rangeInput().getAttribute('data-invalid')).toBe('false');
    expect(rangeInput().getAttribute('data-error-message')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Lỗi của 2 đầu range được COPY sang control tổng, nên chữ ký dùng để quyết định
// "có chạy lại validator tổng không" phải gồm cả PAYLOAD, không chỉ tên key.
// ---------------------------------------------------------------------------

describe('SdDateRange (endpoint error payload reaches the aggregate)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let comp: SdDateRange;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDateRange)?.componentInstance as SdDateRange;
  });

  // why: RED trước fix — chữ ký chỉ gồm TÊN key, nên `matDatepickerParse` đổi payload từ "11/1"
  // sang "11/12" cho ra cùng chữ ký, validator tổng không chạy lại và object lỗi đã copy sang
  // `formControl` treo lại text cũ.
  it('refreshes the copied endpoint error when only its payload changes', async () => {
    comp.control1.setErrors({ matDatepickerParse: { text: '11/1' } });
    await fixture.whenStable();
    expect(comp.formControl.errors?.['matDatepickerParse']).toEqual({ text: '11/1' });

    comp.control1.setErrors({ matDatepickerParse: { text: '11/12' } });
    await fixture.whenStable();

    expect(comp.formControl.errors?.['matDatepickerParse']).toEqual({ text: '11/12' });
  });

  it('refreshes a min-boundary payload copied from the end endpoint', async () => {
    comp.control2.setErrors({ matDatepickerMin: { min: new Date(2026, 0, 1), actual: new Date(2025, 0, 1) } });
    await fixture.whenStable();
    expect((comp.formControl.errors?.['matDatepickerMin'] as { actual: Date }).actual.getFullYear()).toBe(2025);

    comp.control2.setErrors({ matDatepickerMin: { min: new Date(2026, 0, 1), actual: new Date(2024, 0, 1) } });
    await fixture.whenStable();

    expect((comp.formControl.errors?.['matDatepickerMin'] as { actual: Date }).actual.getFullYear()).toBe(2024);
  });
});

// Angular Material re-parses each field after every keystroke and writes the
// result straight into the control. The stock date-fns adapter accepts a
// half-typed year ("11/12/2" became year 0002) and reads a bare "11" as the
// year 1100 via parseISO — neither may reach the control.
describe('SdDateRange (partial input is not a date)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let comp: SdDateRange;
  let startInput: HTMLInputElement;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDateRange)?.componentInstance as SdDateRange;
    startInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  });

  const type = (value: string) => {
    startInput.value = value;
    startInput.dispatchEvent(new InputEvent('input', { inputType: 'insertText', bubbles: true }));
    fixture.detectChanges();
  };

  for (const partial of ['1', '11', '11/12', '11/12/2', '11/12/20']) {
    it(`leaves the start date empty while "${partial}" is still being typed`, () => {
      type(partial);

      expect(comp.control1.value).toBeNull();
    });
  }

  it('accepts the start date once the full year has been typed', () => {
    type('11/12/2026');

    expect(comp.control1.value instanceof Date).toBeTrue();
    expect((comp.control1.value as Date).getFullYear()).toBe(2026);
  });
});

// ---------------------------------------------------------------------------
// Timer lifetime — the deferred blur emit must not outlive the view
// ---------------------------------------------------------------------------

describe('SdDateRange deferred blur emit lifetime', () => {
  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  const setup = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const comp = fixture.debugElement.query(el => el.componentInstance instanceof SdDateRange)!.componentInstance as SdDateRange;
    return { fixture, host: fixture.componentInstance, comp };
  };

  it('does not emit sdChange after the view is destroyed inside the blur window', fakeAsync(() => {
    const { fixture, host, comp } = setup();
    // why: spy đặt TRÊN OutputEmitterRef nên bắt được lời gọi emit() kể cả khi Angular đã
    // ngắt subscriber — nếu chỉ đếm host.changes thì guard nội bộ của output() che mất bug.
    const emit = spyOn(comp.sdChange, 'emit').and.callThrough();

    comp.onFocus();
    comp.control1.setValue(new Date(2026, 0, 1));
    comp.onBlur();
    host.changes.length = 0;

    fixture.destroy();

    expect(() => tick(50)).not.toThrow();
    expect(emit).not.toHaveBeenCalled();
    expect(host.changes.length).toBe(0);
  }));

  it('still emits sdChange on the next macrotask while the view is alive', fakeAsync(() => {
    const { fixture, host, comp } = setup();

    comp.onFocus();
    comp.control1.setValue(new Date(2026, 0, 1));
    comp.onBlur();
    host.changes.length = 0;

    expect(host.changes.length).toBe(0);
    tick();
    expect(host.changes.length).toBe(1);

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
  standalone: true,
  imports: [SdDateRange],
  template: `<sd-date-range [required]="required"></sd-date-range>`,
})
class A11yHost {
  required = false;
}

describe('SdDateRange (accessibility)', () => {
  let fixture: ComponentFixture<A11yHost>;
  let cmp: SdDateRange;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [A11yHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(A11yHost);
    fixture.detectChanges();
    cmp = fixture.debugElement.query(By.directive(SdDateRange)).componentInstance as SdDateRange;
  });

  it('leaves no aria-hidden on either range input', () => {
    expect(ariaHiddenFocusables(fixture.nativeElement)).toEqual([]);
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    expect(inputs.length).toBe(2);
    inputs.forEach(el => expect(el.hasAttribute('aria-hidden')).toBe(false));
  });

  it('exposes the calendar trigger as a keyboard-reachable, named <button>', () => {
    const btn = fixture.nativeElement.querySelector('button.sd-suffix-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.type).toBe('button');
    expect(btn.tabIndex).toBeGreaterThanOrEqual(0);
    expect(btn.getAttribute('aria-label')).toBeTruthy();
  });

  it('activating the calendar trigger opens the range picker', () => {
    const picker = cmp.picker()!;
    expect(picker).toBeTruthy();
    spyOn(picker, 'open');
    const btn = fixture.nativeElement.querySelector('button.sd-suffix-btn') as HTMLButtonElement;
    btn.click();
    expect(picker.open).toHaveBeenCalled();
  });

  it('wires aria-invalid + aria-describedby on BOTH inputs when the inline error renders', async () => {
    fixture.componentInstance.required = true;
    fixture.detectChanges();
    // why: chạm vào đầu range (tương đương blur ô "Từ") — đúng luồng thật, và là điều kiện
    // MatFormField dùng để cho phép hiện subscript lỗi.
    cmp.control1.markAsTouched();
    await fixture.whenStable();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('mat-error') as HTMLElement;
    expect(error).not.toBeNull();
    expect(error.id).toBe(cmp.errorId);
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    inputs.forEach(el => {
      expect(el.getAttribute('aria-invalid')).toBe('true');
      expect(el.getAttribute('aria-describedby')).toContain(cmp.errorId);
    });
  });
});
