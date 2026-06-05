import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';
import { SdAutocomplete } from './autocomplete.component';
import { queryByCss, queryAllByCss } from '../../../testing/test-utils';

// ---------------------------------------------------------------------------
// Host wrappers
// ---------------------------------------------------------------------------

@Component({
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
  onSdChange(v: any) { this.changes.push(v); }
  onSdSelection(v: any) { this.selections.push(v); }
}

@Component({
  standalone: true,
  imports: [SdAutocomplete],
  template: `<sd-autocomplete name="city" [form]="fg"></sd-autocomplete>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
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
  const comp = fixture.debugElement.query(el => el.componentInstance instanceof SdAutocomplete)
    ?.componentInstance as SdAutocomplete;
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
    it('calls updateValueAndValidity on inputControl', () => {
      const spy = spyOn(comp.inputControl, 'updateValueAndValidity').and.callThrough();
      comp.reValidate();
      expect(spy).toHaveBeenCalled();
    });
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fixture: ComponentFixture<SdAutocomplete<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let comp: SdAutocomplete<any>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdAutocomplete, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdAutocomplete);
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('items', [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }]);
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
