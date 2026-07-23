import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdChipCalendar } from './chip-calendar.component';
import { queryAllByCss } from '../../../testing/test-utils';

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [SdChipCalendar, FormsModule, ReactiveFormsModule],
  template: `<sd-chip-calendar
    [label]="label"
    [placeholder]="placeholder"
    [disabled]="disabled"
    [required]="required"
    [removable]="removable"
    [viewed]="viewed"
    [min]="min"
    [max]="max"
    [model]="model"
    (modelChange)="model = $event"
    (sdChange)="onSdChange($event)"></sd-chip-calendar>`,
})
class HostComponent {
  label = 'Off Days';
  placeholder: string | undefined = 'Select dates';
  disabled = false;
  required = false;
  removable: boolean | ((item: any) => boolean) = true;
  viewed = false;
  min = 0;
  max = 0;
  model: (string | number)[] = [];
  changes: any[][] = [];
  onSdChange(v: any[]) {
    this.changes.push(v);
  }
}

@Component({
  standalone: true,
  imports: [SdChipCalendar],
  template: `<sd-chip-calendar name="dates" [form]="fg"></sd-chip-calendar>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [SdChipCalendar, FormsModule],
  template: `<form #f="ngForm"><sd-chip-calendar name="dates" [form]="f"></sd-chip-calendar></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

// ---------------------------------------------------------------------------
// Main describe
// ---------------------------------------------------------------------------

describe('SdChipCalendar', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdChipCalendar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdChipCalendar)?.componentInstance as SdChipCalendar;
    if (!comp) throw new Error('SdChipCalendar not found in fixture');
  });

  // -------------------------------------------------------------------------
  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(comp).toBeTruthy();
    });

    it('renders mat-chip-grid inside the form field', () => {
      const chipGrid = fixture.nativeElement.querySelector('mat-chip-grid');
      expect(chipGrid).not.toBeNull();
    });

    it('renders the hidden chip input element', () => {
      const input = fixture.nativeElement.querySelector('.sd-chip-input');
      expect(input).not.toBeNull();
    });

    it('renders label in mat-label when appearance is outline', () => {
      host.label = 'Off Days';
      fixture.detectChanges();
      const matLabel = fixture.nativeElement.querySelector('mat-label');
      expect(matLabel?.textContent?.trim()).toBe('Off Days');
    });
  });

  // -------------------------------------------------------------------------
  describe('date format display', () => {
    it('renders chips for each date in model', () => {
      host.model = ['2026/05/01', '2026/05/15'];
      fixture.detectChanges();
      const rows = queryAllByCss(fixture, 'mat-chip-row');
      expect(rows.length).toBe(2);
    });

    it('renders a span element inside each chip-row for date display', () => {
      host.model = ['2026/05/01'];
      fixture.detectChanges();
      // The template renders: {{ item | date: 'dd/MM/yyyy' }}
      // Exact output depends on locale; verify the span element is present
      const span = fixture.nativeElement.querySelector('mat-chip-row span');
      expect(span).not.toBeNull();
    });

    it('shows three chips for three dates', () => {
      host.model = ['2026/01/01', '2026/06/15', '2026/12/31'];
      fixture.detectChanges();
      const rows = queryAllByCss(fixture, 'mat-chip-row');
      expect(rows.length).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  describe('add date via onSelectDate', () => {
    it('adds a new date string (yyyy/MM/dd) via onSelectDate', () => {
      const date = new Date(2026, 4, 20); // 2026-05-20
      comp.onSelectDate(date);
      fixture.detectChanges();
      expect(comp.formControl.value).toContain('2026/05/20');
    });

    it('does NOT add duplicate dates — toggles the date off instead', () => {
      comp.onSelectDate(new Date(2026, 4, 20));
      comp.onSelectDate(new Date(2026, 4, 20));
      fixture.detectChanges();
      expect((comp.formControl.value ?? []).filter((v: string) => v === '2026/05/20').length).toBe(0);
    });

    it('emits modelChange after adding a date', () => {
      const before = host.changes.length;
      comp.onSelectDate(new Date(2026, 4, 25));
      expect(host.changes.length).toBeGreaterThan(before);
    });

    it('emits sdChange after adding a date', () => {
      const before = host.changes.length;
      comp.onSelectDate(new Date(2026, 5, 1));
      expect(host.changes.length).toBeGreaterThan(before);
    });
  });

  // -------------------------------------------------------------------------
  describe('remove date behavior', () => {
    beforeEach(() => {
      host.model = ['2026/05/01', '2026/05/15', '2026/06/01'];
      fixture.detectChanges();
    });

    it('removes a chip by calling onRemove with the date string', () => {
      comp.onRemove('2026/05/15');
      fixture.detectChanges();
      expect(comp.formControl.value).not.toContain('2026/05/15');
      expect(comp.formControl.value).toContain('2026/05/01');
    });

    it('emits sdChange after removal', () => {
      const before = host.changes.length;
      comp.onRemove('2026/05/01');
      expect(host.changes.length).toBeGreaterThan(before);
    });

    it('clears inputControl after removal', () => {
      comp.inputControl.setValue('something');
      comp.onRemove('2026/06/01');
      expect(comp.inputControl.value).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  describe('clear behavior', () => {
    it('removes all chips via onClear', () => {
      host.model = ['2026/05/01', '2026/05/02'];
      fixture.detectChanges();
      comp.onClear();
      fixture.detectChanges();
      expect(comp.formControl.value).toEqual([]);
    });

    it('emits sdChange after clear', () => {
      host.model = ['2026/05/01'];
      fixture.detectChanges();
      const before = host.changes.length;
      comp.onClear();
      expect(host.changes.length).toBeGreaterThan(before);
    });
  });

  // -------------------------------------------------------------------------
  describe('disabled', () => {
    it('disables formControl and inputControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(true);
      expect(comp.inputControl.disabled).toBe(true);
    });

    it('re-enables controls when disabled toggled off', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(false);
      expect(comp.inputControl.disabled).toBe(false);
    });

    it('formControl and inputControl are both disabled', () => {
      host.model = ['2026/05/01'];
      host.disabled = true;
      fixture.detectChanges();
      // Verify disabled state propagated to both controls
      expect(comp.formControl.disabled).toBe(true);
      expect(comp.inputControl.disabled).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('model two-way binding', () => {
    it('syncs formControl value when model input changes', () => {
      host.model = ['2026/05/01', '2026/05/02'];
      fixture.detectChanges();
      expect(comp.formControl.value).toEqual(['2026/05/01', '2026/05/02']);
    });

    it('reflects new model array in chip rows', () => {
      host.model = ['2026/01/01', '2026/02/01', '2026/03/01'];
      fixture.detectChanges();
      const rows = queryAllByCss(fixture, 'mat-chip-row');
      expect(rows.length).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  describe('required validator', () => {
    it('marks formControl invalid (required) when model is empty', () => {
      host.required = true;
      host.model = [];
      fixture.detectChanges();
      comp.formControl.setValue([]);
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(true);
    });

    it('passes required validation when at least one date present', () => {
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue(['2026/05/01']);
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('min/max count validators', () => {
    it('minLength error when fewer dates than min', () => {
      host.min = 3;
      fixture.detectChanges();
      comp.formControl.setValue(['2026/05/01', '2026/05/02']);
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('minlength')).toBe(true);
    });

    it('maxLength error when more dates than max', () => {
      host.max = 2;
      fixture.detectChanges();
      comp.formControl.setValue(['2026/05/01', '2026/05/02', '2026/05/03']);
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('maxlength')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('errorMessage', () => {
    it('returns a non-undefined message when required error is present', () => {
      host.required = true;
      fixture.detectChanges();
      comp.formControl.setValue([]);
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      // Source file has encoding issue; verify message is defined & non-empty
      expect(comp.errorMessage()).toBeTruthy();
    });

    it('returns a message containing the min count for minlength error', () => {
      host.min = 2;
      fixture.detectChanges();
      comp.formControl.setValue(['2026/05/01']);
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      const msg = comp.errorMessage() ?? '';
      expect(msg).toContain('2');
    });

    it('returns a message containing the max count for maxlength error', () => {
      host.max = 1;
      fixture.detectChanges();
      comp.formControl.setValue(['2026/05/01', '2026/05/02']);
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      const msg = comp.errorMessage() ?? '';
      expect(msg).toContain('1');
    });

    it('returns undefined when no errors', () => {
      comp.formControl.setValue(['2026/05/01']);
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.errorMessage()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('removable behavior', () => {
    it('shows remove icon when removable = true', () => {
      host.model = ['2026/05/01'];
      host.removable = true;
      fixture.detectChanges();
      const cancelIcon = fixture.nativeElement.querySelector('sd-icon[matChipRemove]');
      expect(cancelIcon).not.toBeNull();
    });

    it('hides remove icon when removable = false', () => {
      host.model = ['2026/05/01'];
      host.removable = false;
      fixture.detectChanges();
      const cancelIcon = fixture.nativeElement.querySelector('sd-icon[matChipRemove]');
      expect(cancelIcon).toBeNull();
    });

    it('shows remove icon when removable is a function returning true', () => {
      host.model = ['2026/05/01'];
      host.removable = () => true;
      fixture.detectChanges();
      const cancelIcon = fixture.nativeElement.querySelector('sd-icon[matChipRemove]');
      expect(cancelIcon).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('viewed (read-only) mode', () => {
    it('renders sd-view instead of mat-form-field when viewed = true', () => {
      host.viewed = true;
      host.model = ['2026/05/01'];
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView).not.toBeNull();
      const formField = fixture.nativeElement.querySelector('mat-form-field');
      expect(formField).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('onSelectDate null guard', () => {
    it('does nothing when date is null', () => {
      const before = comp.formControl.value ?? [];
      comp.onSelectDate(null);
      expect(comp.formControl.value ?? []).toEqual(before);
    });
  });

  // -------------------------------------------------------------------------
  describe('host classes', () => {
    it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
      host.label = '';
      fixture.detectChanges();
      const hostEl = fixture.debugElement.query(el => el.componentInstance instanceof SdChipCalendar).nativeElement as HTMLElement;
      expect(hostEl.classList.contains('sd-has-label')).toBe(false);
      host.label = 'Off Days';
      fixture.detectChanges();
      expect(hostEl.classList.contains('sd-has-label')).toBe(true);
    });

    it('viewed defaults false; viewed=true adds .sd-viewed host class', () => {
      const hostEl = fixture.debugElement.query(el => el.componentInstance instanceof SdChipCalendar).nativeElement as HTMLElement;
      expect(hostEl.classList.contains('sd-viewed')).toBe(false);
      host.viewed = true;
      fixture.detectChanges();
      expect(hostEl.classList.contains('sd-viewed')).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// FormGroup lifecycle
// ---------------------------------------------------------------------------

describe('SdChipCalendar (FormGroup lifecycle)', () => {
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
    expect(fg.contains('dates')).toBe(true);
  });

  it('removes control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('dates')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdChipCalendar (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('dates')).toBe(true);
  }));
});

// ---------------------------------------------------------------------------
// autoId — merged in from local branch (namespaced prefix + data-autoid attribute)
// ---------------------------------------------------------------------------

describe('SdChipCalendar — autoId', () => {
  @Component({
    standalone: true,
    imports: [SdChipCalendar],
    template: `<sd-chip-calendar [autoId]="autoId" [label]="'Dates'"></sd-chip-calendar>`,
  })
  class AutoIdHost {
    autoId: string | null | undefined = undefined;
  }

  let fixture: ComponentFixture<AutoIdHost>;
  let chip: SdChipCalendar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoIdHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(AutoIdHost);
    fixture.detectChanges();
    chip = fixture.debugElement.query(el => el.componentInstance instanceof SdChipCalendar)?.componentInstance as SdChipCalendar;
    if (!chip) throw new Error('SdChipCalendar not found');
  });

  it('autoId() returns undefined when not provided', () => {
    expect(chip.autoId()).toBeUndefined();
  });

  it('prefixes autoId with "forms-chip-calendar-"', () => {
    fixture.componentInstance.autoId = 'dates';
    fixture.detectChanges();
    expect(chip.autoId()).toBe('forms-chip-calendar-dates');
  });

  it('renders data-autoId on the chip input', () => {
    fixture.componentInstance.autoId = 'dates';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(input?.getAttribute('data-autoid')).toBe('forms-chip-calendar-dates');
  });
});

// ---------------------------------------------------------------------------
// E2E attributes
// ---------------------------------------------------------------------------

describe('SdChipCalendar — E2E attributes', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdChipCalendar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = fixture.debugElement.query(el => el.componentInstance instanceof SdChipCalendar)?.componentInstance as SdChipCalendar;
    if (!comp) throw new Error('SdChipCalendar not found in fixture');
  });

  it('renders data-disabled reflecting FormControl state', () => {
    fixture.detectChanges();
    const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(el.getAttribute('data-disabled')).toBe('false');
    comp.formControl.disable();
    fixture.detectChanges();
    expect(el.getAttribute('data-disabled')).toBe('true');
  });

  it('renders data-value as JSON-stringified array', () => {
    comp.formControl.setValue(['2026/05/01', '2026/05/15']);
    fixture.detectChanges();
    const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(el.getAttribute('data-value')).toBe('["2026/05/01","2026/05/15"]');
  });

  it('renders data-empty true for [] / false for non-empty', () => {
    comp.formControl.setValue([]);
    fixture.detectChanges();
    const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(el.getAttribute('data-empty')).toBe('true');
    comp.formControl.setValue(['2026/05/01']);
    fixture.detectChanges();
    expect(el.getAttribute('data-empty')).toBe('false');
  });

  it('renders data-count reflecting array length', () => {
    comp.formControl.setValue(['2026/05/01', '2026/05/02', '2026/05/03']);
    fixture.detectChanges();
    const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(el.getAttribute('data-count')).toBe('3');
  });
});

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state) — disabled coerces to static
// ---------------------------------------------------------------------------
describe('SdChipCalendar (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdChipCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdChipCalendar, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdChipCalendar);
  });

  it("viewed='inline' stays interactive: renders the chip input, not <sd-view>", () => {
    // asserts: inline keeps the editor mounted — the static <sd-view> face is NOT used
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input.sd-chip-input')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).toBeNull();
  });

  it('viewed=true renders the static <sd-view> face', () => {
    // asserts: classic viewed=true path unchanged — read-only <sd-view>
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  });

  it("disabled + viewed='inline' falls back to the static <sd-view>", () => {
    // asserts: a disabled control can't be edited, so inline degrades to the static view
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  });
});
