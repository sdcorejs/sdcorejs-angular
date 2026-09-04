import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AsyncValidatorFn, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';
import { SdAutocomplete } from './autocomplete.component';

// ---------------------------------------------------------------------------
// Host wrappers
// ---------------------------------------------------------------------------

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdAutocomplete, FormsModule, ReactiveFormsModule],
  template: `<sd-autocomplete
    [label]="label"
    [placeholder]="placeholder"
    [items]="items"
    [valueField]="valueField"
    [displayField]="displayField"
    [required]="required"
    [disabled]="disabled"
    [hideInlineError]="hideInlineError"
    [inlineError]="inlineError"
    [validator]="validator"
    [(model)]="model"
    (sdChange)="onSdChange($event)"
    (sdSelection)="onSdSelection($event)"></sd-autocomplete>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  items?: any;
  valueField?: string;
  displayField?: string;
  required = false;
  disabled = false;
  hideInlineError = false;
  inlineError?: string;
  validator?: (value: any) => string | Promise<string>;
  model?: any;
  changes: any[] = [];
  selections: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
  onSdSelection(v: any) {
    this.selections.push(v);
  }
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdAutocomplete],
  template: `<sd-autocomplete name="city" [form]="fg"></sd-autocomplete>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdAutocomplete, FormsModule],
  template: `<form #f="ngForm"><sd-autocomplete name="city" [form]="f"></sd-autocomplete></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FRUIT_ITEMS = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
];

function getComp(fixture: ComponentFixture<any>): SdAutocomplete {
  const comp = fixture.debugElement.query(el => el.componentInstance instanceof SdAutocomplete)?.componentInstance as SdAutocomplete;
  if (!comp) throw new Error('SdAutocomplete not found in fixture');
  return comp;
}

// ---------------------------------------------------------------------------
// Main suite
// ---------------------------------------------------------------------------

describe('SdAutocomplete', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdAutocomplete;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    comp = getComp(fixture);
  });

  // -------------------------------------------------------------------------
  // Creation & rendering
  // -------------------------------------------------------------------------
  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(comp).toBeTruthy();
    });

    it('renders an input element', () => {
      const el = fixture.nativeElement.querySelector('input');
      expect(el).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Options rendering
  // -------------------------------------------------------------------------
  describe('options rendering', () => {
    it('populates filteredItems with static array after focus+type triggers pipeline', fakeAsync(() => {
      host.items = FRUIT_ITEMS;
      fixture.detectChanges();
      // Trigger inputControl.valueChanges to force combineLatest emission
      comp.inputControl.setValue('', { emitEvent: true });
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBe(3);
    }));

    it('renders empty filteredItems when items is null', fakeAsync(() => {
      host.items = null;
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBe(0);
    }));

    it('limits rendered items to the limit input (default 100)', fakeAsync(() => {
      // Generate 150 items
      const many = Array.from({ length: 150 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      host.items = many;
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBeLessThanOrEqual(100);
    }));
  });

  // -------------------------------------------------------------------------
  // Filter behaviour
  // -------------------------------------------------------------------------
  describe('filter behaviour', () => {
    beforeEach(fakeAsync(() => {
      host.items = FRUIT_ITEMS;
      host.valueField = 'id';
      host.displayField = 'name';
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();
    }));

    it('filters items by displayField when user types', fakeAsync(() => {
      comp.inputControl.setValue('ban');
      tick(600);
      fixture.detectChanges();
      const names = comp.filteredItems().map((i: any) => i.name);
      expect(names).toContain('Banana');
      expect(names).not.toContain('Apple');
    }));

    it('returns all items when search text is cleared', fakeAsync(() => {
      comp.inputControl.setValue('ban');
      tick(600);
      fixture.detectChanges();
      comp.inputControl.setValue('');
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBe(3);
    }));

    it('returns empty array when no items match search text', fakeAsync(() => {
      comp.inputControl.setValue('zzz');
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBe(0);
    }));
  });

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------
  describe('selection', () => {
    beforeEach(fakeAsync(() => {
      host.items = FRUIT_ITEMS;
      host.valueField = 'id';
      host.displayField = 'name';
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();
    }));

    it('calls onSelect and sets valueModel', fakeAsync(() => {
      comp.onSelect(FRUIT_ITEMS[0]);
      fixture.detectChanges();
      tick();
      expect(comp.valueModel()).toBe(1);
    }));

    it('emits sdChange with the resolved value', fakeAsync(() => {
      comp.onSelect(FRUIT_ITEMS[1]);
      fixture.detectChanges();
      tick();
      expect(host.changes).toContain(2);
    }));

    it('emits sdSelection with full payload', fakeAsync(() => {
      comp.onSelect(FRUIT_ITEMS[2]);
      fixture.detectChanges();
      tick();
      const sel = host.selections[host.selections.length - 1];
      expect(sel).toBeTruthy();
      expect(sel.value).toBe(3);
      expect(sel.selectedItem).toEqual(FRUIT_ITEMS[2]);
    }));
  });

  // -------------------------------------------------------------------------
  // Selection — primitive string items (no valueField/displayField)
  // -------------------------------------------------------------------------
  describe('selection — primitive items', () => {
    beforeEach(fakeAsync(() => {
      host.items = ['Alpha', 'Beta', 'Gamma'];
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();
    }));

    it('sets model to the string value', fakeAsync(() => {
      comp.onSelect('Beta' as any);
      fixture.detectChanges();
      tick();
      expect(comp.valueModel()).toBe('Beta');
    }));
  });

  // -------------------------------------------------------------------------
  // model two-way binding
  // -------------------------------------------------------------------------
  describe('model two-way binding', () => {
    it('syncs formControl when model input changes', fakeAsync(() => {
      host.model = 42;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(comp.formControl.value).toBe(42);
    }));

    it('syncs model when formControl setValue emits valueChanges', fakeAsync(() => {
      comp.formControl.setValue(99);
      tick();
      fixture.detectChanges();
      expect(host.model).toBe(99);
    }));

    it('clears model to null when clear() is called', fakeAsync(() => {
      host.model = 1;
      fixture.detectChanges();
      tick();
      comp.clear();
      tick();
      fixture.detectChanges();
      expect(comp.valueModel()).toBeNull();
    }));

    it('renders a slim clear button with the thin close icon when a value is set', fakeAsync(() => {
      host.items = ['Alpha', 'Beta'];
      host.model = 'Alpha';
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button.sd-clear-btn') as HTMLButtonElement | null;
      expect(btn).not.toBeNull();
      expect(btn!.querySelector('mat-icon')?.textContent?.trim()).toBe('close');
    }));
  });

  // -------------------------------------------------------------------------
  // disabled
  // -------------------------------------------------------------------------
  describe('disabled', () => {
    it('disables inputControl and formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(comp.inputControl.disabled).toBe(true);
      expect(comp.formControl.disabled).toBe(true);
    });

    it('enables both controls when disabled toggled off', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(comp.inputControl.disabled).toBe(false);
      expect(comp.formControl.disabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // required validator
  // -------------------------------------------------------------------------
  describe('required validator', () => {
    it('applies required validator when required = true', fakeAsync(() => {
      host.model = 'seed';
      host.required = true;
      fixture.detectChanges();
      tick();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(true);
    }));

    it('passes validation when a value is provided', fakeAsync(() => {
      host.required = true;
      fixture.detectChanges();
      tick();
      comp.formControl.setValue(1, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(false);
    }));
  });

  // -------------------------------------------------------------------------
  // inlineError
  // -------------------------------------------------------------------------
  describe('inlineError validator', () => {
    it('sets inlineError on formControl when inlineError is provided', () => {
      host.inlineError = 'Field error';
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.formControl.hasError('inlineError')).toBe(true);
    });

    it('clears inlineError when inlineError is cleared', () => {
      host.inlineError = 'Field error';
      fixture.detectChanges();
      host.inlineError = undefined;
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.formControl.hasError('inlineError')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // errorMessage
  // -------------------------------------------------------------------------
  describe('errorMessage getter', () => {
    it('returns "Vui lòng nhập thông tin" for required error', fakeAsync(() => {
      host.model = 'seed';
      host.required = true;
      fixture.detectChanges();
      tick();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.markAsTouched();
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.errorMessage()).toBe('Vui lòng nhập thông tin');
    }));

    it('returns inlineError message when inlineError validator fires', () => {
      host.inlineError = 'Custom msg';
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.errorMessage()).toBe('Custom msg');
    });

    it('returns undefined when no errors', () => {
      expect(comp.errorMessage()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // custom [validator] async error message (Pattern A regression)
  // -------------------------------------------------------------------------
  describe('custom [validator] async error message', () => {
    // why: onSelect mirror sang formControl trước đây dùng { emitEvent: false } → async validator
    // resolve im → #state không tick → errorMessage không recompute → message lỗi không hiện/không clear.
    it('surfaces the validator message after selecting an invalid value (async resolves)', fakeAsync(() => {
      host.validator = (v: any) => (v === 'bad' ? 'Giá trị không hợp lệ' : '');
      fixture.detectChanges();

      comp.onSelect('bad' as any);
      comp.formControl.markAsTouched();
      tick();
      fixture.detectChanges();

      expect(comp.formControl.invalid).toBe(true);
      expect(comp.errorMessage()).toBe('Giá trị không hợp lệ');
    }));

    it('clears the validator message once a valid value is selected', fakeAsync(() => {
      host.validator = (v: any) => (v === 'bad' ? 'Giá trị không hợp lệ' : '');
      fixture.detectChanges();

      comp.onSelect('bad' as any);
      comp.formControl.markAsTouched();
      tick();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBe('Giá trị không hợp lệ');

      comp.onSelect('good' as any);
      tick();
      fixture.detectChanges();
      expect(comp.errorMessage()).toBeUndefined();
      expect(comp.formControl.valid).toBe(true);
    }));
  });

  // -------------------------------------------------------------------------
  // clear() — event propagation + falsy-value guard
  // -------------------------------------------------------------------------
  describe('clear() phải để formControl phát event (bug class "invalid nhưng không có message")', () => {
    // why: clear() cũ dùng setValue(null, { emitEvent: false }) → async [validator] resolve im →
    // AbstractControl.events không phát → #state (sdFormControlState) không tick → errorMessage
    // computed giữ giá trị cũ → message không hiện/không clear (chỉ còn viền đỏ). Dùng
    // autoDetectChanges (tôn trọng OnPush); detectChanges ép check sẽ che đúng lớp lỗi này.
    const matError = () => fixture.nativeElement.querySelector('mat-error') as HTMLElement | null;

    it('renders the validator message after clear() empties the value (no forced CD)', async () => {
      host.items = ['Alpha', 'Beta'];
      host.validator = (v: any) => (v === null || v === undefined || v === '' ? 'Vui lòng chọn giá trị' : '');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      comp.onSelect('Alpha' as any);
      comp.formControl.markAsTouched();
      await fixture.whenStable();
      expect(matError()).toBeNull(); // còn giá trị → chưa có lỗi

      comp.clear();
      await fixture.whenStable();

      expect(comp.formControl.hasError('customValidator')).toBeTrue();
      expect(matError()?.textContent?.trim()).toBe('Vui lòng chọn giá trị');
    });

    it('clears a stale validator message after clear() removes the invalid value', async () => {
      host.items = ['Alpha', 'Beta'];
      host.validator = (v: any) => (v === 'Alpha' ? 'Giá trị không hợp lệ' : '');
      fixture.autoDetectChanges();
      await fixture.whenStable();

      comp.onSelect('Alpha' as any);
      comp.formControl.markAsTouched();
      await fixture.whenStable();
      expect(matError()?.textContent?.trim()).toBe('Giá trị không hợp lệ');

      comp.clear();
      await fixture.whenStable();

      expect(comp.errorMessage()).toBeUndefined();
      expect(matError()).toBeNull();
    });

    it('clears a selected value of 0 (falsy but valid — load path treats 0 as a value)', fakeAsync(() => {
      host.items = [
        { id: 0, name: 'Zero' },
        { id: 1, name: 'One' },
      ];
      host.valueField = 'id';
      host.displayField = 'name';
      host.model = 0;
      fixture.detectChanges();
      tick(600);
      fixture.detectChanges();
      expect(comp.valueModel()).toBe(0);

      comp.clear();
      tick(600);
      fixture.detectChanges();

      expect(comp.valueModel()).toBeNull();
      expect(comp.formControl.value).toBeNull();
      expect(host.changes).toContain(null);
    }));

    it('stays a no-op when there is genuinely no value', fakeAsync(() => {
      comp.clear();
      tick();
      fixture.detectChanges();
      expect(host.changes.length).toBe(0);
    }));
  });

  // -------------------------------------------------------------------------
  // output events
  // -------------------------------------------------------------------------
  describe('output events', () => {
    it('emits sdChange with null when clear() is called with an existing value', fakeAsync(() => {
      host.model = 5;
      fixture.detectChanges();
      tick();
      comp.clear();
      tick();
      fixture.detectChanges();
      expect(host.changes).toContain(null);
    }));

    it('does NOT emit sdChange when clear() is called without a value', fakeAsync(() => {
      comp.clear();
      tick();
      fixture.detectChanges();
      expect(host.changes.length).toBe(0);
    }));
  });

  // -------------------------------------------------------------------------
  // focus / blur
  // -------------------------------------------------------------------------
  describe('focus & blur', () => {
    it('sets isFocused = true on onFocus', () => {
      comp.onFocus();
      expect(comp.isFocused).toBe(true);
    });

    it('sets isFocused = false on onBlur', () => {
      comp.onFocus();
      comp.onBlur();
      expect(comp.isFocused).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // reValidate
  // -------------------------------------------------------------------------
  describe('reValidate', () => {
    // why: required / [validator] / inlineError đều được cài trên formControl. reValidate() cũ gọi
    // trên inputControl (chỉ giữ text search, không validator nào) → API public không validate gì.
    it('calls updateValueAndValidity on formControl', () => {
      const spy = spyOn(comp.formControl, 'updateValueAndValidity').and.callThrough();
      comp.reValidate();
      expect(spy).toHaveBeenCalled();
    });

    it('does NOT target inputControl (no validators live there)', () => {
      const spy = spyOn(comp.inputControl, 'updateValueAndValidity').and.callThrough();
      comp.reValidate();
      expect(spy).not.toHaveBeenCalled();
    });

    it('re-runs the async [validator] so an externally changed verdict is picked up', fakeAsync(() => {
      let reject = false;
      host.validator = () => (reject ? 'Không hợp lệ' : '');
      fixture.detectChanges();
      tick();
      expect(comp.formControl.hasError('customValidator')).toBe(false);

      reject = true;
      comp.reValidate();
      tick();
      fixture.detectChanges();

      expect(comp.formControl.hasError('customValidator')).toBe(true);
      expect(comp.errorMessage()).toBe('Không hợp lệ');
    }));
  });

  // -------------------------------------------------------------------------
  // appearance
  // -------------------------------------------------------------------------
  describe('appearance', () => {
    it('defaults to "outline" without SD_FORM_CONFIGURATION token', () => {
      expect(comp.appearance()).toBe('outline');
    });
  });

  // -------------------------------------------------------------------------
  // getNestedValue helper
  // -------------------------------------------------------------------------
  describe('getNestedValue helper', () => {
    it('returns top-level property', () => {
      expect(comp.getNestedValue({ a: 1 }, 'a')).toBe(1);
    });

    it('returns nested property via dot-path', () => {
      expect(comp.getNestedValue({ a: { b: 'deep' } }, 'a.b')).toBe('deep');
    });

    it('returns obj itself when path is undefined', () => {
      expect(comp.getNestedValue('raw', undefined)).toBe('raw');
    });

    it('returns undefined for a missing nested key', () => {
      expect(comp.getNestedValue({ a: {} }, 'a.b.c')).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// FormGroup lifecycle
// ---------------------------------------------------------------------------

describe('SdAutocomplete (FormGroup lifecycle)', () => {
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
    expect(fg.contains('city')).toBe(true);
  });

  it('removes control on destroy', () => {
    fixture.destroy();
    expect(fg.contains('city')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdAutocomplete (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('city')).toBe(true);
  }));
});

// ---------------------------------------------------------------------------
// SD_FORM_CONFIGURATION token
// ---------------------------------------------------------------------------

describe('SdAutocomplete (SD_FORM_CONFIGURATION)', () => {
  @Component({
    changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
    standalone: true,
    imports: [SdAutocomplete],
    template: `<sd-autocomplete></sd-autocomplete>`,
  })
  class StubHost {}

  let fixture: ComponentFixture<StubHost>;
  let comp: SdAutocomplete;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StubHost, NoopAnimationsModule],
      providers: [{ provide: SD_FORM_CONFIGURATION, useValue: { appearance: 'fill' } }],
    }).compileComponents();
    fixture = TestBed.createComponent(StubHost);
    fixture.detectChanges();
    comp = getComp(fixture);
  });

  it('uses appearance from SD_FORM_CONFIGURATION token', () => {
    expect(comp.appearance()).toBe('fill');
  });
});

// ---------------------------------------------------------------------------
// E2E data-* attributes (Tasks 11–12)
// ---------------------------------------------------------------------------

describe('SdAutocomplete (E2E attributes)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdAutocomplete;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.items = FRUIT_ITEMS;
    host.valueField = 'id';
    host.displayField = 'name';
    fixture.detectChanges();
    comp = getComp(fixture);
  });

  it('renders data-disabled reflecting FormControl state', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('input');
    expect(el.getAttribute('data-disabled')).toBe('false');
    comp.formControl.disable();
    fixture.detectChanges();
    expect(el.getAttribute('data-disabled')).toBe('true');
  });

  it('renders data-empty toggling with value', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('input');
    expect(el.getAttribute('data-empty')).toBe('true');
    comp.formControl.setValue('VN');
    fixture.detectChanges();
    expect(el.getAttribute('data-empty')).toBe('false');
  });

  it('renders data-value reflecting selected key', () => {
    comp.formControl.setValue('VN');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('input');
    expect(el.getAttribute('data-value')).toBe('VN');
  });

  it('renders data-invalid=true only after touched + invalid', () => {
    comp.formControl.setValidators([Validators.required]);
    comp.formControl.updateValueAndValidity();
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('input');
    expect(el.getAttribute('data-invalid')).toBe('false');
    comp.formControl.markAsTouched();
    fixture.detectChanges();
    expect(el.getAttribute('data-invalid')).toBe('true');
  });

  it('renders data-loading reflecting the loading signal', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('input');
    expect(el.getAttribute('data-loading')).toBe('false');
    comp.loading.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('data-loading')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// host classes
// ---------------------------------------------------------------------------

describe('SdAutocomplete (host classes)', () => {
  let fixture: ComponentFixture<SdAutocomplete>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdAutocomplete, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdAutocomplete);
  });

  it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(false);
    fixture.componentRef.setInput('label', 'Tỉnh/Thành');
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
// viewed inline mode (tri-state `viewed`)
// ---------------------------------------------------------------------------

describe('SdAutocomplete (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdAutocomplete<any>>;

  let comp: SdAutocomplete<any>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdAutocomplete, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdAutocomplete);
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('items', [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Beta' },
    ]);
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
  });

  it('viewed="inline" → isInline true, isViewed false; text face + (hidden) editor both rendered', () => {
    // asserts: inline mounts BOTH the sd-view face AND the hidden autocomplete editor
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    expect(comp.isInline()).toBe(true);
    expect(comp.isViewed()).toBe(false);
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-inline-editor')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[matInput], input')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
  });

  it('clicking the text face opens the panel WITHOUT hiding the text', () => {
    // asserts: text retained while editing; click → open() via enterInlineEdit
    const openSpy = spyOn(comp, 'open').and.callThrough();
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.sd-inline-view') as HTMLElement).click();
    fixture.detectChanges();
    expect(openSpy).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
  });

  it('inline clear-× gated by clearable', () => {
    // asserts: clearable inline autocomplete shows clear-×; [clearable]=false suppresses it
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-view .sd-inline-clear')).not.toBeNull();
    fixture.componentRef.setInput('clearable', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-clear')).toBeNull();
  });

  it('disabled inline behaves like viewed=true (static, no editor / no face)', () => {
    // asserts: disabled 'inline' → isViewed true, isInline false
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(comp.isInline()).toBe(false);
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.sd-inline-view')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Validator ADDITIVE trên formControl công khai
// ---------------------------------------------------------------------------

describe('SdAutocomplete (consumer validators survive on the public formControl)', () => {
  // why: #updateValidator cũ gọi setValidators() + setAsyncValidators() → THAY THẾ cả danh sách,
  // xoá sạch validator do consumer tự gắn lên `formControl` (control này là public API). Giờ đi qua
  // connector (addValidators/removeValidators) nên chỉ phần component sở hữu mới bị thêm/gỡ.
  const consumerValidator: ValidatorFn = () => ({ consumer: true });
  const consumerAsyncValidator: AsyncValidatorFn = () => Promise.resolve({ consumerAsync: true });

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdAutocomplete;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.items = FRUIT_ITEMS;
    host.valueField = 'id';
    host.displayField = 'name';
    fixture.autoDetectChanges();
    await fixture.whenStable();
    comp = getComp(fixture);
  });

  /** Đẩy thay đổi state của host xuống input của component rồi chờ ổn định. */
  const flush = async (): Promise<void> => {
    fixture.autoDetectChanges();
    await fixture.whenStable();
  };

  it('keeps a consumer-attached sync validator when [required] flips on', async () => {
    comp.formControl.addValidators(consumerValidator);
    comp.formControl.updateValueAndValidity();
    expect(comp.formControl.hasError('consumer')).toBeTrue();

    host.required = true;
    await flush();

    expect(comp.formControl.hasValidator(consumerValidator)).toBeTrue();
    expect(comp.formControl.hasError('consumer')).toBeTrue();
    expect(comp.formControl.hasError('required')).toBeTrue();
  });

  it('keeps a consumer-attached sync validator when [inlineError] changes', async () => {
    comp.formControl.addValidators(consumerValidator);
    comp.formControl.updateValueAndValidity();

    host.inlineError = 'Sai rồi';
    await flush();

    expect(comp.formControl.hasValidator(consumerValidator)).toBeTrue();
    expect(comp.formControl.hasError('consumer')).toBeTrue();
    expect(comp.formControl.hasError('inlineError')).toBeTrue();
  });

  it('keeps a consumer-attached async validator when [validator] is supplied', async () => {
    comp.formControl.addAsyncValidators(consumerAsyncValidator);
    comp.formControl.updateValueAndValidity();
    await fixture.whenStable();
    expect(comp.formControl.hasError('consumerAsync')).toBeTrue();

    host.validator = () => 'Giá trị không hợp lệ';
    await flush();

    expect(comp.formControl.hasAsyncValidator(consumerAsyncValidator)).toBeTrue();
  });

  it('removes only the component-owned validator when [required] flips back off', async () => {
    comp.formControl.addValidators(consumerValidator);
    host.required = true;
    await flush();
    expect(comp.formControl.hasError('required')).toBeTrue();

    host.required = false;
    await flush();
    comp.formControl.updateValueAndValidity();

    expect(comp.formControl.hasValidator(consumerValidator)).toBeTrue();
    expect(comp.formControl.hasError('required')).toBeFalse();
    expect(comp.formControl.hasError('consumer')).toBeTrue();
  });
});

// ---------------------------------------------------------------------------
// Timer lifetime — the deferred focus/openPanel must not outlive the view
// ---------------------------------------------------------------------------

describe('SdAutocomplete deferred focus lifetime', () => {
  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
  });

  const setup = () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const comp = fixture.debugElement.query(el => el.componentInstance instanceof SdAutocomplete)!.componentInstance as SdAutocomplete;
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    return { fixture, comp, input };
  };

  it('does not open the panel or focus after the view is destroyed inside the 100ms window', fakeAsync(() => {
    const { fixture, comp, input } = setup();
    const focusSpy = spyOn(input, 'focus');
    const trigger = comp.autocompleteTrigger()!;
    const openSpy = spyOn(trigger, 'openPanel');

    comp.focus();
    fixture.destroy();

    expect(() => tick(300)).not.toThrow();
    expect(openSpy).not.toHaveBeenCalled();
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
  imports: [SdAutocomplete],
  template: `<sd-autocomplete [items]="items" [required]="required" [addable]="addable" (sdAdd)="added = added + 1"></sd-autocomplete>`,
})
class A11yHost {
  items: string[] = ['Hà Nội', 'Huế'];
  required = false;
  addable = false;
  added = 0;
}

describe('SdAutocomplete (accessibility)', () => {
  let fixture: ComponentFixture<A11yHost>;
  let cmp: SdAutocomplete<any>;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [A11yHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(A11yHost);
    fixture.detectChanges();
    cmp = fixture.debugElement.query(el => el.componentInstance instanceof SdAutocomplete).componentInstance as SdAutocomplete<any>;
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

  it('renders the "add new" affordance as a real <button type=button>', () => {
    fixture.componentInstance.addable = true;
    fixture.detectChanges();
    cmp.autocompleteTrigger()?.openPanel();
    fixture.detectChanges();

    const btn = document.querySelector('button.sd__option--add-btn') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.type).toBe('button');
    // why: <button> tự nằm trong tab order và UA sinh `click` khi Enter/Space — không cần
    // role/tabindex/keydown tự chế như bản <div (click)> cũ.
    expect(btn.tabIndex).toBeGreaterThanOrEqual(0);

    btn.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.added).toBe(1);
  });

  it('wires aria-invalid + aria-describedby to the rendered inline error', () => {
    fixture.componentInstance.required = true;
    fixture.detectChanges();
    cmp.formControl.markAsTouched();
    cmp.formControl.updateValueAndValidity();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('mat-error') as HTMLElement;
    const el = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    expect(error).not.toBeNull();
    expect(error.id).toBe(cmp.errorId);
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.getAttribute('aria-describedby')).toContain(cmp.errorId);
  });
});
