import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdChip } from './chip.component';
import { queryAllByCss, queryByCss } from '../../../testing/test-utils';

// ---------------------------------------------------------------------------
// Host components
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdChip, FormsModule, ReactiveFormsModule],
  template: `<sd-chip
    [label]="label"
    [placeholder]="placeholder"
    [disabled]="disabled"
    [required]="required"
    [addable]="addable"
    [removable]="removable"
    [viewed]="viewed"
    [min]="min"
    [max]="max"
    [model]="model"
    (modelChange)="onModelChange($event)"
    (sdChange)="onSdChange($event)"></sd-chip>`,
})
class HostComponent {
  label = 'Tags';
  placeholder: string | undefined = 'Add tag and press Enter';
  disabled = false;
  required = false;
  addable = true;
  removable: boolean | ((item: any) => boolean) = true;
  viewed = false;
  min = 0;
  max = 0;
  model: (string | number)[] = [];
  changes: any[][] = [];
  modelEmissions: ((string | number)[] | undefined)[] = [];
  onModelChange(v: (string | number)[] | undefined) {
    this.modelEmissions.push(v);
    this.model = v ?? [];
  }
  onSdChange(v: any[]) {
    this.changes.push(v);
  }
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdChip],
  template: `<sd-chip name="tags" [form]="fg"></sd-chip>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdChip, FormsModule],
  template: `<form #f="ngForm"><sd-chip name="tags" [form]="f"></sd-chip></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

// ---------------------------------------------------------------------------
// Helper: call onAdd via the component's public method (simulates MatChipInputEvent)
// ---------------------------------------------------------------------------
function addChip(chip: SdChip, value: string): void {
  const fakeEvent = {
    value,
    input: { value: '' } as HTMLInputElement,
    chipInput: {} as any,
  };
  chip.onAdd(fakeEvent as any);
}

// ---------------------------------------------------------------------------
// Main describe
// ---------------------------------------------------------------------------

describe('SdChip', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let chip: SdChip;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    chip = fixture.debugElement.query(el => el.componentInstance instanceof SdChip)?.componentInstance as SdChip;
    if (!chip) throw new Error('SdChip not found in fixture');
  });

  // -------------------------------------------------------------------------
  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(chip).toBeTruthy();
    });

    it('renders the chip input element', () => {
      const input = fixture.nativeElement.querySelector('.sd-chip-input');
      expect(input).not.toBeNull();
    });

    it('renders label via sd-label when appearance is not set (falsy)', () => {
      // default appearance is 'outline' — the @if(!_app && _lbl) branch won't fire,
      // but the mat-label inside mat-form-field should render
      host.label = 'Tags';
      fixture.detectChanges();
      // mat-label is rendered inside mat-form-field since appearance='outline'
      const matLabel = fixture.nativeElement.querySelector('mat-label');
      expect(matLabel?.textContent?.trim()).toBe('Tags');
    });
  });

  // -------------------------------------------------------------------------
  describe('placeholder', () => {
    it('uses placeholder input on the text input', () => {
      host.placeholder = 'Type something';
      fixture.detectChanges();
      const input = queryByCss<HTMLInputElement>(fixture, '.sd-chip-input');
      // placeholder falls back to label if placeholder is falsy
      expect(input.getAttribute('placeholder')).toBe('Type something');
    });

    it('falls back to label when placeholder is undefined', () => {
      host.placeholder = undefined;
      host.label = 'My Label';
      fixture.detectChanges();
      const input = queryByCss<HTMLInputElement>(fixture, '.sd-chip-input');
      expect(input.getAttribute('placeholder')).toBe('My Label');
    });
  });

  // -------------------------------------------------------------------------
  describe('disabled', () => {
    it('disables formControl and inputControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(chip.formControl.disabled).toBe(true);
      expect(chip.inputControl.disabled).toBe(true);
    });

    it('enables formControl and inputControl when disabled toggled off', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(chip.formControl.disabled).toBe(false);
      expect(chip.inputControl.disabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('model two-way binding', () => {
    it('syncs formControl value when model input changes', () => {
      host.model = ['alpha', 'beta'];
      fixture.detectChanges();
      expect(chip.formControl.value).toEqual(['alpha', 'beta']);
    });

    it('renders chip rows for each model item', () => {
      host.model = ['one', 'two', 'three'];
      fixture.detectChanges();
      const rows = queryAllByCss(fixture, 'mat-chip-row');
      expect(rows.length).toBe(3);
    });

    it('emits modelChange and sdChange when chip is added', () => {
      addChip(chip, 'newchip');
      fixture.detectChanges();
      expect(chip.formControl.value).toContain('newchip');
      expect(host.changes.length).toBeGreaterThan(0);
      expect(host.changes[host.changes.length - 1]).toContain('newchip');
    });

    it('emits modelChange and sdChange when chip is removed', () => {
      host.model = ['alpha', 'beta'];
      fixture.detectChanges();
      chip.onRemove('alpha');
      fixture.detectChanges();
      expect(chip.formControl.value).not.toContain('alpha');
      expect(host.changes.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('add chip behavior', () => {
    it('adds chip via onAdd with Enter-like event', () => {
      addChip(chip, 'tag1');
      expect(chip.formControl.value).toContain('tag1');
    });

    it('trims whitespace before adding chip', () => {
      addChip(chip, '  trimmed  ');
      expect(chip.formControl.value).toContain('trimmed');
      expect(chip.formControl.value).not.toContain('  trimmed  ');
    });

    it('does NOT add duplicate chips', () => {
      addChip(chip, 'dup');
      addChip(chip, 'dup');
      const values: string[] = chip.formControl.value ?? [];
      const count = values.filter((v: string) => v === 'dup').length;
      expect(count).toBe(1);
    });

    it('does NOT add empty string chip', () => {
      addChip(chip, '');
      expect((chip.formControl.value ?? []).length).toBe(0);
    });

    it('does NOT add chip when addable = false', () => {
      host.addable = false;
      fixture.detectChanges();
      addChip(chip, 'blocked');
      expect((chip.formControl.value ?? []).length).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  describe('remove chip behavior', () => {
    beforeEach(() => {
      host.model = ['alpha', 'beta', 'gamma'];
      fixture.detectChanges();
    });

    it('removes chip by calling onRemove with the item value', () => {
      chip.onRemove('beta');
      expect(chip.formControl.value).not.toContain('beta');
      expect(chip.formControl.value).toContain('alpha');
      expect(chip.formControl.value).toContain('gamma');
    });

    it('emits sdChange after removal', () => {
      const before = host.changes.length;
      chip.onRemove('alpha');
      expect(host.changes.length).toBeGreaterThan(before);
    });

    it('clears inputControl value after removal', () => {
      chip.inputControl.setValue('something');
      chip.onRemove('gamma');
      expect(chip.inputControl.value).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  describe('clear behavior', () => {
    it('removes all chips via onClear', () => {
      host.model = ['x', 'y'];
      fixture.detectChanges();
      chip.onClear();
      fixture.detectChanges();
      expect(chip.formControl.value).toEqual([]);
    });

    it('emits sdChange after clear', () => {
      host.model = ['x'];
      fixture.detectChanges();
      const before = host.changes.length;
      chip.onClear();
      expect(host.changes.length).toBeGreaterThan(before);
    });
  });

  // -------------------------------------------------------------------------
  // why: RED trước fix — `#add`/`#select` gọi `values.push(...)` trên chính mảng của consumer
  // rồi `model.set(<cùng reference>)`. Signal so sánh bằng Object.is nên `modelChange` KHÔNG
  // phát (host desync âm thầm), đồng thời mảng gốc của consumer bị sửa sau lưng.
  describe('array-valued model is replaced, never mutated in place', () => {
    it('emits modelChange and leaves the caller array untouched when a chip is added', () => {
      const original: (string | number)[] = ['alpha'];
      host.model = original;
      fixture.detectChanges();
      host.modelEmissions.length = 0;

      addChip(chip, 'beta');
      fixture.detectChanges();

      expect(original).toEqual(['alpha']);
      expect(host.modelEmissions.length).toBe(1);
      expect(host.modelEmissions[0]).toEqual(['alpha', 'beta']);
      expect(host.model).not.toBe(original);
      expect(chip.formControl.value).not.toBe(original);
    });

    it('emits modelChange and leaves the caller array untouched when an autocomplete option is selected', () => {
      const original: (string | number)[] = ['alpha'];
      host.model = original;
      fixture.detectChanges();
      host.modelEmissions.length = 0;

      chip.onSelect({ option: { value: 'beta' } } as any);
      fixture.detectChanges();

      expect(original).toEqual(['alpha']);
      expect(host.modelEmissions.length).toBe(1);
      expect(host.modelEmissions[0]).toEqual(['alpha', 'beta']);
      expect(host.model).not.toBe(original);
    });

    it('emits modelChange and leaves the caller array untouched when a chip is removed', () => {
      const original: (string | number)[] = ['alpha', 'beta'];
      host.model = original;
      fixture.detectChanges();
      host.modelEmissions.length = 0;

      chip.onRemove('alpha');
      fixture.detectChanges();

      expect(original).toEqual(['alpha', 'beta']);
      expect(host.modelEmissions.length).toBe(1);
      expect(host.modelEmissions[0]).toEqual(['beta']);
    });
  });

  // -------------------------------------------------------------------------
  // why: RED trước fix — `#updateValidator` gọi clearValidators()+setValidators() nên MỌI
  // validator consumer tự gắn lên `formControl` (public API) bị xoá mỗi lần required/min/max đổi.
  describe('additive validator management', () => {
    it('keeps a consumer-attached validator when required flips', () => {
      const consumerValidator: ValidatorFn = () => ({ consumer: true });
      chip.formControl.addValidators(consumerValidator);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.formControl.hasError('consumer')).toBe(true);

      host.required = true;
      fixture.detectChanges();

      expect(chip.formControl.hasValidator(consumerValidator)).toBe(true);
      expect(chip.formControl.hasError('consumer')).toBe(true);
      expect(chip.formControl.hasValidator(Validators.required)).toBe(true);
    });

    it('keeps a consumer-attached validator when min/max change', () => {
      const consumerValidator: ValidatorFn = () => ({ consumer: true });
      chip.formControl.addValidators(consumerValidator);
      chip.formControl.updateValueAndValidity({ emitEvent: false });

      host.min = 2;
      host.max = 5;
      fixture.detectChanges();

      expect(chip.formControl.hasValidator(consumerValidator)).toBe(true);
      chip.formControl.setValue(['a']);
      expect(chip.formControl.hasError('minlength')).toBe(true);
    });

    it('removes only the component-owned required validator when required goes back to false', () => {
      host.required = true;
      fixture.detectChanges();
      expect(chip.formControl.hasValidator(Validators.required)).toBe(true);

      host.required = false;
      fixture.detectChanges();
      expect(chip.formControl.hasValidator(Validators.required)).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('required validator', () => {
    it('applies required validator — invalid when empty array', () => {
      host.required = true;
      host.model = [];
      fixture.detectChanges();
      chip.formControl.setValue([]);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.formControl.hasError('required')).toBe(true);
    });

    it('passes required validation when chips are present', () => {
      host.required = true;
      fixture.detectChanges();
      chip.formControl.setValue(['val1']);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.formControl.hasError('required')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('min/max validators', () => {
    it('minLength error when fewer chips than min', () => {
      host.min = 3;
      fixture.detectChanges();
      chip.formControl.setValue(['a', 'b']);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.formControl.hasError('minlength')).toBe(true);
    });

    it('maxLength error when more chips than max', () => {
      host.max = 2;
      fixture.detectChanges();
      chip.formControl.setValue(['a', 'b', 'c']);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.formControl.hasError('maxlength')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('errorMessage', () => {
    it('returns "Vui lòng nhập thông tin" for required error', () => {
      host.required = true;
      fixture.detectChanges();
      chip.formControl.setValue([]);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.errorMessage()).toBe('Vui lòng nhập thông tin');
    });

    it('returns minlength message with count', () => {
      host.min = 2;
      fixture.detectChanges();
      chip.formControl.setValue(['a']);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.errorMessage()).toBe('Vui lòng nhập ít nhất 2 giá trị');
    });

    it('returns maxlength message with count', () => {
      host.max = 1;
      fixture.detectChanges();
      chip.formControl.setValue(['a', 'b']);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.errorMessage()).toBe('Vui lòng nhập tối đa 1 giá trị');
    });

    it('returns undefined when no errors', () => {
      chip.formControl.setValue(['x']);
      chip.formControl.updateValueAndValidity({ emitEvent: false });
      expect(chip.errorMessage()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('removable pipe behavior', () => {
    it('shows remove icon when removable = true (boolean)', () => {
      host.model = ['chip1'];
      host.removable = true;
      fixture.detectChanges();
      const cancelIcon = fixture.nativeElement.querySelector('sd-icon[matChipRemove]');
      expect(cancelIcon).not.toBeNull();
    });

    it('hides remove icon when removable = false (boolean)', () => {
      host.model = ['chip1'];
      host.removable = false;
      fixture.detectChanges();
      const cancelIcon = fixture.nativeElement.querySelector('sd-icon[matChipRemove]');
      expect(cancelIcon).toBeNull();
    });

    it('shows remove icon when removable is a function returning true', () => {
      host.model = ['chip1'];
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
      host.model = ['tag1'];
      fixture.detectChanges();
      const sdView = fixture.nativeElement.querySelector('sd-view');
      expect(sdView).not.toBeNull();
      const formField = fixture.nativeElement.querySelector('mat-form-field');
      expect(formField).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  describe('focus tracking', () => {
    it('sets isFocused = true on onFocus', () => {
      chip.onFocus();
      expect(chip.isFocused).toBe(true);
    });

    it('clears inputControl value on onFocus', () => {
      chip.inputControl.setValue('typing...');
      chip.onFocus();
      expect(chip.inputControl.value).toBe('');
    });
  });

  // -------------------------------------------------------------------------
  describe('host classes', () => {
    it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
      host.label = '';
      fixture.detectChanges();
      const hostEl = fixture.debugElement.query(el => el.componentInstance instanceof SdChip).nativeElement as HTMLElement;
      expect(hostEl.classList.contains('sd-has-label')).toBe(false);
      host.label = 'Tags';
      fixture.detectChanges();
      expect(hostEl.classList.contains('sd-has-label')).toBe(true);
    });

    it('viewed defaults false; viewed=true adds .sd-viewed host class', () => {
      const hostEl = fixture.debugElement.query(el => el.componentInstance instanceof SdChip).nativeElement as HTMLElement;
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

describe('SdChip (FormGroup lifecycle)', () => {
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
    expect(fg.contains('tags')).toBe(true);
  });

  it('removes control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('tags')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdChip (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('tags')).toBe(true);
  }));
});

// ---------------------------------------------------------------------------
// autoId — merged in from local branch (namespaced prefix + data-autoid attribute)
// ---------------------------------------------------------------------------

describe('SdChip — autoId', () => {
  @Component({
    changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
    standalone: true,
    imports: [SdChip],
    template: `<sd-chip [autoId]="autoId" [label]="'Tags'"></sd-chip>`,
  })
  class AutoIdHost {
    autoId: string | null | undefined = undefined;
  }

  let fixture: ComponentFixture<AutoIdHost>;
  let chip: SdChip;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoIdHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(AutoIdHost);
    fixture.detectChanges();
    chip = fixture.debugElement.query(el => el.componentInstance instanceof SdChip)?.componentInstance as SdChip;
    if (!chip) throw new Error('SdChip not found');
  });

  it('autoId() returns undefined when not provided', () => {
    expect(chip.autoId()).toBeUndefined();
  });

  it('prefixes autoId with "forms-chip-"', () => {
    fixture.componentInstance.autoId = 'tags';
    fixture.detectChanges();
    expect(chip.autoId()).toBe('forms-chip-tags');
  });

  it('renders data-autoId on the chip input', () => {
    fixture.componentInstance.autoId = 'tags';
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(input?.getAttribute('data-autoid')).toBe('forms-chip-tags');
  });
});

// ---------------------------------------------------------------------------
// E2E attributes
// ---------------------------------------------------------------------------

describe('SdChip — E2E attributes', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let chip: SdChip;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    chip = fixture.debugElement.query(el => el.componentInstance instanceof SdChip)?.componentInstance as SdChip;
    if (!chip) throw new Error('SdChip not found in fixture');
  });

  it('renders data-disabled reflecting FormControl state', () => {
    fixture.detectChanges();
    const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(el.getAttribute('data-disabled')).toBe('false');
    chip.formControl.disable();
    fixture.detectChanges();
    expect(el.getAttribute('data-disabled')).toBe('true');
  });

  it('renders data-value as JSON-stringified array', () => {
    chip.formControl.setValue(['ng', 'rxjs']);
    fixture.detectChanges();
    const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(el.getAttribute('data-value')).toBe('["ng","rxjs"]');
  });

  it('renders data-empty true for [] / false for non-empty', () => {
    chip.formControl.setValue([]);
    fixture.detectChanges();
    const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(el.getAttribute('data-empty')).toBe('true');
    chip.formControl.setValue(['x']);
    fixture.detectChanges();
    expect(el.getAttribute('data-empty')).toBe('false');
  });

  it('renders data-count reflecting array length', () => {
    chip.formControl.setValue(['a', 'b', 'c']);
    fixture.detectChanges();
    const el: HTMLInputElement = fixture.nativeElement.querySelector('input.sd-chip-input');
    expect(el.getAttribute('data-count')).toBe('3');
  });
});

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state) — disabled coerces to static
// ---------------------------------------------------------------------------
describe('SdChip (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdChip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdChip, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdChip);
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

// ---------------------------------------------------------------------------
// Runtime [required] / [min] toggle must refresh the rendered error message
// ---------------------------------------------------------------------------
describe('SdChip (runtime validator inputs refresh the error message)', () => {
  // why: RED trước fix — `errorMessage` chỉ phụ thuộc `#state()`. Connector cài Validators.required
  // bằng `updateValueAndValidity({ emitEvent: false })` nên `formControl.errors` đổi mà KHÔNG phát
  // event → `#state` không tick → computed giữ giá trị cũ → dưới OnPush control invalid, viền đỏ,
  // nhưng <mat-error> KHÔNG bao giờ xuất hiện. Dùng autoDetectChanges (tôn trọng OnPush) — ép
  // detectChanges() cũng không cứu được vì computed đã memo hoá, nhưng autoDetect mới là chuẩn.
  let fixture: ComponentFixture<SdChip>;

  const matError = (): HTMLElement | null => fixture.nativeElement.querySelector('mat-error');

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [SdChip, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdChip);
    fixture.componentRef.setInput('label', 'Tags');
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('renders the required message when [required] flips on at RUNTIME', async () => {
    fixture.componentInstance.formControl.markAsTouched();
    await fixture.whenStable();
    expect(matError()).toBeNull();

    fixture.componentRef.setInput('required', true);
    await fixture.whenStable();

    expect(fixture.componentInstance.formControl.hasError('required')).toBeTrue();
    expect(fixture.componentInstance.errorMessage()).toBe('Vui lòng nhập thông tin');
    expect(matError()?.textContent?.trim()).toBe('Vui lòng nhập thông tin');
  });

  it('removes the message again when [required] flips back off at RUNTIME', async () => {
    fixture.componentInstance.formControl.markAsTouched();
    fixture.componentRef.setInput('required', true);
    await fixture.whenStable();
    expect(matError()?.textContent?.trim()).toBe('Vui lòng nhập thông tin');

    fixture.componentRef.setInput('required', false);
    await fixture.whenStable();

    expect(fixture.componentInstance.formControl.hasError('required')).toBeFalse();
    expect(fixture.componentInstance.errorMessage()).toBeUndefined();
    expect(matError()).toBeNull();
  });

  it('renders the minlength message when [min] is raised at RUNTIME', async () => {
    fixture.componentInstance.formControl.setValue(['a']);
    fixture.componentInstance.formControl.markAsTouched();
    await fixture.whenStable();
    expect(matError()).toBeNull();

    fixture.componentRef.setInput('min', 2);
    await fixture.whenStable();

    expect(fixture.componentInstance.formControl.hasError('minlength')).toBeTrue();
    expect(matError()?.textContent?.trim()).toBe('Vui lòng nhập ít nhất 2 giá trị');
  });
});

// ---------------------------------------------------------------------------
// Timer lifetime — the deferred blur/focus must not outlive the view
// ---------------------------------------------------------------------------

describe('SdChip deferred timer lifetime', () => {
  const chipOf = (fixture: ComponentFixture<HostComponent>) =>
    fixture.debugElement.query(el => el.componentInstance instanceof SdChip)!.componentInstance as SdChip;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  it('does not detect changes after the view is destroyed inside the 150ms blur window', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const chip = chipOf(fixture);
    const chipDe = fixture.debugElement.query(el => el.componentInstance instanceof SdChip)!;

    chip.onFocus();
    chip.onBlur();

    // why: `#ref` của component là một ViewRef; spy trên prototype nên bắt được đúng lời gọi
    // detectChanges() phát ra từ trong timer, không cần chọc vào private field.
    const viewRefPrototype = Object.getPrototypeOf(chipDe.injector.get(ChangeDetectorRef));
    const detectChanges = spyOn(viewRefPrototype, 'detectChanges');

    fixture.destroy();

    expect(() => tick(300)).not.toThrow();
    expect(detectChanges).not.toHaveBeenCalled();
    // why: cả thân timer bị huỷ, không chỉ riêng detectChanges.
    expect(chip.isFocused).toBeTrue();
  }));

  it('does not focus the chip input after the view is destroyed inside the 100ms focus window', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const chip = chipOf(fixture);
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const focusSpy = spyOn(input, 'focus');

    chip.focus();
    fixture.destroy();

    expect(() => tick(300)).not.toThrow();
    expect(focusSpy).not.toHaveBeenCalled();
  }));

  it('still runs the deferred blur while the view is alive', fakeAsync(() => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const chip = chipOf(fixture);

    chip.onFocus();
    expect(chip.isFocused).toBeTrue();

    chip.onBlur();
    tick(149);
    expect(chip.isFocused).toBeTrue();

    tick(1);
    expect(chip.isFocused).toBeFalse();

    fixture.destroy();
  }));
});
