import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';
import { SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdSelect } from './select.component';
import { SdSelectFooterActionDirective } from './select-footer-action.directive';

// ---------------------------------------------------------------------------
// Host wrappers
// ---------------------------------------------------------------------------

/** Default single-select host */
@Component({
  standalone: true,
  imports: [SdSelect, FormsModule, ReactiveFormsModule],
  template: `<sd-select
    [label]="label"
    [placeholder]="placeholder"
    [items]="items"
    valueField="id"
    displayField="name"
    [required]="required"
    [disabled]="disabled"
    [hideInlineError]="hideInlineError"
    [inlineError]="inlineError"
    [(model)]="model"
    (sdChange)="onSdChange($event)"
    (sdSelection)="onSdSelection($event)"></sd-select>`,
})
class HostComponent {
  label?: string;
  placeholder?: string;
  items?: any;
  required = false;
  disabled = false;
  hideInlineError = false;
  inlineError?: string;
  model?: any;
  changes: any[] = [];
  selections: any[] = [];
  onSdChange(v: any) { this.changes.push(v); }
  onSdSelection(v: any) { this.selections.push(v); }
}

/** Multi-select host — multiple is static so MatSelect doesn't throw */
@Component({
  standalone: true,
  imports: [SdSelect, FormsModule, ReactiveFormsModule],
  template: `<sd-select
    [items]="items"
    valueField="id"
    displayField="name"
    [multiple]="true"
    [(model)]="model"
    (sdChange)="onSdChange($event)"
    (sdSelection)="onSdSelection($event)"></sd-select>`,
})
class MultiHostComponent {
  items?: any;
  model?: any;
  changes: any[] = [];
  selections: any[] = [];
  onSdChange(v: any) { this.changes.push(v); }
  onSdSelection(v: any) { this.selections.push(v); }
}

@Component({
  standalone: true,
  imports: [SdSelect],
  template: `<sd-select name="status" [form]="fg" valueField="id" displayField="name"></sd-select>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [SdSelect, FormsModule],
  template: `<form #f="ngForm"><sd-select name="status" [form]="f" valueField="id" displayField="name"></sd-select></form>`,
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

/** 15 items so filtered() returns true (length > 10) */
const LARGE_ITEMS = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

function getComp(fixture: ComponentFixture<any>): SdSelect {
  const comp = fixture.debugElement.query(el => el.componentInstance instanceof SdSelect)
    ?.componentInstance as SdSelect;
  if (!comp) throw new Error('SdSelect not found in fixture');
  return comp;
}

// ---------------------------------------------------------------------------
// Main suite — single-select
// ---------------------------------------------------------------------------

describe('SdSelect', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdSelect;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.items = FRUIT_ITEMS;
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

    it('renders a mat-select element', () => {
      const el = fixture.nativeElement.querySelector('mat-select');
      expect(el).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Single-select mode
  // -------------------------------------------------------------------------
  describe('single-select mode', () => {
    it('multiple() is false by default', () => {
      expect(comp.multiple()).toBe(false);
    });

    it('onSelectionChange sets formControl value to the selected value', fakeAsync(() => {
      comp.onSelectionChange({ value: 2, source: null! });
      tick();
      fixture.detectChanges();
      expect(comp.formControl.value).toBe(2);
    }));

    it('onSelectionChange updates valueModel to the selected value', fakeAsync(() => {
      comp.onSelectionChange({ value: 1, source: null! });
      tick();
      fixture.detectChanges();
      expect(comp.valueModel()).toBe(1);
    }));

    it('clear() sets formControl to null in single mode', fakeAsync(() => {
      host.model = 1;
      fixture.detectChanges();
      tick();
      comp.clear();
      tick();
      fixture.detectChanges();
      expect(comp.formControl.value).toBeNull();
    }));

    it('clear() emits sdChange with null in single mode', fakeAsync(() => {
      host.model = 1;
      fixture.detectChanges();
      tick();
      comp.clear();
      tick();
      fixture.detectChanges();
      expect(host.changes).toContain(null);
    }));
  });

  // -------------------------------------------------------------------------
  // Items / options
  // -------------------------------------------------------------------------
  describe('items input', () => {
    it('populates filteredItems from static array after pipeline emits', fakeAsync(() => {
      // Force inputControl to emit so combineLatest fires
      comp.inputControl.setValue('', { emitEvent: true });
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBe(3);
    }));

    it('renders empty filteredItems when items is null', fakeAsync(() => {
      host.items = null;
      fixture.detectChanges();
      comp.inputControl.setValue('', { emitEvent: true });
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBe(0);
    }));

    it('limits rendered items to the default limit (50)', fakeAsync(() => {
      const many = Array.from({ length: 60 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      host.items = many;
      fixture.detectChanges();
      comp.inputControl.setValue('', { emitEvent: true });
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBeLessThanOrEqual(50);
    }));
  });

  // -------------------------------------------------------------------------
  // Search / filter (filtered mode when items.length > 10)
  // -------------------------------------------------------------------------
  describe('search / filter behaviour', () => {
    beforeEach(fakeAsync(() => {
      host.items = LARGE_ITEMS;
      fixture.detectChanges();
      comp.inputControl.setValue('', { emitEvent: true });
      tick(600);
      fixture.detectChanges();
    }));

    it('filtered() is true when items.length > 10', () => {
      expect(comp.filtered()).toBe(true);
    });

    it('filters filteredItems when inputControl search text changes', fakeAsync(() => {
      comp.inputControl.setValue('Item 1');
      tick(600);
      fixture.detectChanges();
      const names = comp.filteredItems().map((i: any) => i.name);
      expect(names.some((n: string) => n.startsWith('Item 1'))).toBe(true);
    }));

    it('returns all items when search text is cleared', fakeAsync(() => {
      comp.inputControl.setValue('Item 1');
      tick(600);
      fixture.detectChanges();
      comp.inputControl.setValue('');
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBeGreaterThan(1);
    }));

    it('returns empty array when no items match search text', fakeAsync(() => {
      comp.inputControl.setValue('zzz_no_match');
      tick(600);
      fixture.detectChanges();
      expect(comp.filteredItems().length).toBe(0);
    }));
  });

  // -------------------------------------------------------------------------
  // model two-way binding
  // -------------------------------------------------------------------------
  describe('model two-way binding', () => {
    it('syncs formControl when model input changes', fakeAsync(() => {
      host.model = 2;
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
      expect(comp.formControl.value).toBe(2);
    }));

    it('syncs valueModel back to host when formControl.setValue is called', fakeAsync(() => {
      comp.formControl.setValue(3);
      tick();
      fixture.detectChanges();
      expect(host.model).toBe(3);
    }));

    it('clear() resets valueModel to null in single mode', fakeAsync(() => {
      host.model = 1;
      fixture.detectChanges();
      tick();
      comp.clear();
      tick();
      fixture.detectChanges();
      expect(comp.valueModel()).toBeNull();
    }));
  });

  // -------------------------------------------------------------------------
  // disabled
  // -------------------------------------------------------------------------
  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(true);
    });

    it('enables formControl when disabled is toggled off', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(comp.formControl.disabled).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // required validator
  // -------------------------------------------------------------------------
  describe('required validator', () => {
    it('applies required validator when required = true', fakeAsync(() => {
      host.required = true;
      fixture.detectChanges();
      tick();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(true);
    }));

    it('passes validation when a value is provided with required = true', fakeAsync(() => {
      host.required = true;
      fixture.detectChanges();
      tick();
      comp.formControl.setValue(1, { emitEvent: false });
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.formControl.hasError('required')).toBe(false);
    }));
  });

  // -------------------------------------------------------------------------
  // inlineError validator
  // -------------------------------------------------------------------------
  describe('inlineError validator', () => {
    it('sets inlineError on formControl when inlineError is provided', () => {
      host.inlineError = 'Field error';
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.formControl.hasError('inlineError')).toBe(true);
    });

    it('clears inlineError when inlineError input is cleared', () => {
      host.inlineError = 'Field error';
      fixture.detectChanges();
      host.inlineError = undefined;
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.formControl.hasError('inlineError')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // errorMessage getter
  // -------------------------------------------------------------------------
  describe('errorMessage getter', () => {
    it('returns "Vui lòng nhập thông tin" for required error', fakeAsync(() => {
      host.required = true;
      fixture.detectChanges();
      tick();
      comp.formControl.setValue(null, { emitEvent: false });
      comp.formControl.markAsTouched();
      comp.formControl.updateValueAndValidity({ emitEvent: false });
      expect(comp.errorMessage()).toBe('Vui lòng nhập thông tin');
    }));

    it('returns the inlineError message when inlineError validator fires', () => {
      host.inlineError = 'Custom select error';
      fixture.detectChanges();
      comp.formControl.updateValueAndValidity();
      expect(comp.errorMessage()).toBe('Custom select error');
    });

    it('returns undefined when no errors', () => {
      expect(comp.errorMessage()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // output events — single mode
  // -------------------------------------------------------------------------
  describe('output events', () => {
    it('emits sdChange when panel closes with a changed value', fakeAsync(() => {
      // open: hash of current (null) value is stored
      comp.onOpenedChange(true);
      tick(200);
      // change the form value to make hash differ
      comp.formControl.setValue(2, { emitEvent: false });
      // close: new hash != old hash → sdChange emitted
      comp.onOpenedChange(false);
      tick();
      fixture.detectChanges();
      expect(host.changes.length).toBeGreaterThan(0);
    }));

    it('emits sdChange with null when clear() is called (single mode)', fakeAsync(() => {
      host.model = 1;
      fixture.detectChanges();
      tick();
      comp.clear();
      tick();
      fixture.detectChanges();
      expect(host.changes).toContain(null);
    }));

    it('emits sdSelection when clear() is called with a value (single mode)', fakeAsync(() => {
      host.model = 1;
      fixture.detectChanges();
      tick();
      comp.clear();
      tick();
      fixture.detectChanges();
      const sel = host.selections[host.selections.length - 1];
      expect(sel).toBeTruthy();
      expect(sel.multiple).toBe(false);
    }));
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
    it('defaults to "outline" without SD_FORM_CONFIGURATION token', () => {
      expect(comp.appearance()).toBe('outline');
    });
  });

  // -------------------------------------------------------------------------
  // item accessor helpers
  // -------------------------------------------------------------------------
  describe('item accessor helpers', () => {
    it('itemValue returns the value at valueField path', () => {
      expect(comp.itemValue({ id: 42, name: 'Test' } as any)).toBe(42);
    });

    it('itemDisplay returns the display string at displayField path', () => {
      expect(comp.itemDisplay({ id: 1, name: 'Hello' } as any)).toBe('Hello');
    });

    it('itemDisabled returns false when disabledField is empty (default)', () => {
      expect(comp.itemDisabled({ id: 1, name: 'X', disabled: true } as any)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Multi-select suite — uses dedicated MultiHostComponent
// ---------------------------------------------------------------------------

describe('SdSelect (multi-select mode)', () => {
  let fixture: ComponentFixture<MultiHostComponent>;
  let host: MultiHostComponent;
  let comp: SdSelect;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiHostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(MultiHostComponent);
    host = fixture.componentInstance;
    host.items = FRUIT_ITEMS;
    fixture.detectChanges();
    comp = getComp(fixture);
  });

  it('multiple() returns true', () => {
    expect(comp.multiple()).toBe(true);
  });

  it('onSelectionChange sets formControl to array of selected values', fakeAsync(() => {
    comp.onSelectionChange({ value: [1, 2], source: null! });
    tick();
    fixture.detectChanges();
    expect(comp.formControl.value).toEqual([1, 2]);
  }));

  it('onSelectionChange updates valueModel to the array', fakeAsync(() => {
    comp.onSelectionChange({ value: [3], source: null! });
    tick();
    fixture.detectChanges();
    expect(comp.valueModel()).toEqual([3]);
  }));

  it('normalizedValue wraps scalar model into array', fakeAsync(() => {
    host.model = 1;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    expect(Array.isArray(comp.normalizedValue())).toBe(true);
  }));

  it('clear() sets valueModel to [] in multi mode', fakeAsync(() => {
    host.model = [1, 2];
    fixture.detectChanges();
    tick();
    comp.clear();
    tick();
    fixture.detectChanges();
    expect(comp.valueModel()).toEqual([]);
  }));

  it('clear() emits sdSelection with multiple: true and empty values', fakeAsync(() => {
    host.model = [1];
    fixture.detectChanges();
    tick();
    comp.clear();
    tick();
    fixture.detectChanges();
    const sel = host.selections[host.selections.length - 1];
    expect(sel.multiple).toBe(true);
    expect(sel.values).toEqual([]);
  }));
});

// ---------------------------------------------------------------------------
// FormGroup lifecycle
// ---------------------------------------------------------------------------

describe('SdSelect (FormGroup lifecycle)', () => {
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
    expect(fg.contains('status')).toBe(true);
  });

  it('removes control from FormGroup on destroy', () => {
    fixture.destroy();
    expect(fg.contains('status')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NgForm extraction
// ---------------------------------------------------------------------------

describe('SdSelect (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('status')).toBe(true);
  }));
});

// ---------------------------------------------------------------------------
// bare + open() — Task 3
// ---------------------------------------------------------------------------

describe('SdSelect (bare + open)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fixture: ComponentFixture<SdSelect<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let component: SdSelect<any>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdSelect, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(SdSelect);
    component = fixture.componentInstance;
  });

  it('no label → no .sd-has-label; label set → .sd-has-label added', () => {
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(false);
    fixture.componentRef.setInput('label', 'Trạng thái');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-has-label')).toBe(true);
  });

  it('viewed defaults false; viewed=true adds .sd-viewed host class', () => {
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-viewed')).toBe(false);
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-viewed')).toBe(true);
  });

  it('open() opens the select panel', () => {
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
    fixture.componentRef.setInput('items', [{ id: 'a', name: 'A' }]);
    fixture.detectChanges();
    component.open();
    expect(component.selectRef()?.panelOpen).toBe(true);
  });

  it('non-bare single: still renders .sd-clear-btn when a value is set', fakeAsync(() => {
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
    fixture.componentRef.setInput('items', [{ id: 'a', name: 'A' }]);
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-clear-btn')).not.toBeNull();
  }));
});

// ---------------------------------------------------------------------------
// SD_FORM_CONFIGURATION token
// ---------------------------------------------------------------------------

describe('SdSelect (SD_FORM_CONFIGURATION)', () => {
  @Component({
    standalone: true,
    imports: [SdSelect],
    template: `<sd-select valueField="id" displayField="name"></sd-select>`,
  })
  class StubHost {}

  let fixture: ComponentFixture<StubHost>;
  let comp: SdSelect;

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

describe('SdSelect (E2E attributes)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let comp: SdSelect;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.items = FRUIT_ITEMS;
    fixture.detectChanges();
    comp = getComp(fixture);
  });

  it('renders data-disabled reflecting FormControl state', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('mat-select');
    expect(el.getAttribute('data-disabled')).toBe('false');
    comp.formControl.disable();
    fixture.detectChanges();
    expect(el.getAttribute('data-disabled')).toBe('true');
  });

  it('renders data-empty toggling with value', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('mat-select');
    expect(el.getAttribute('data-empty')).toBe('true');
    comp.formControl.setValue(1);
    fixture.detectChanges();
    expect(el.getAttribute('data-empty')).toBe('false');
  });

  it('renders data-value reflecting selected key', () => {
    comp.formControl.setValue(2);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('mat-select');
    expect(el.getAttribute('data-value')).toBe('2');
  });

  it('renders data-invalid=true only after touched + invalid', () => {
    comp.formControl.setValidators([Validators.required]);
    comp.formControl.updateValueAndValidity();
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('mat-select');
    expect(el.getAttribute('data-invalid')).toBe('false');
    comp.formControl.markAsTouched();
    fixture.detectChanges();
    expect(el.getAttribute('data-invalid')).toBe('true');
  });

  it('renders data-loading reflecting the loading signal', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('mat-select');
    expect(el.getAttribute('data-loading')).toBe('false');
    comp.loading.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('data-loading')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state `viewed`)
// ---------------------------------------------------------------------------

describe('SdSelect (viewed inline mode)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let fixture: ComponentFixture<SdSelect<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let comp: SdSelect<any>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdSelect, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdSelect);
    comp = fixture.componentInstance;
    fixture.componentRef.setInput('valueField', 'id');
    fixture.componentRef.setInput('displayField', 'name');
    fixture.componentRef.setInput('items', [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]);
  });

  it('viewed="inline" → isInline true, isViewed false; text face + (hidden) editor both rendered', fakeAsync(() => {
    // asserts: inline mounts BOTH the sd-view text face AND the (bare, hidden) editor — never a swap
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(comp.isInline()).toBe(true);
    expect(comp.isViewed()).toBe(false);
    // text face (sd-view) is the visible trigger
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
    // editor is always rendered (chrome hidden) so its panel can open — host is bare
    expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.sd-inline-editor')).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
  }));

  it('clicking the text face opens the panel WITHOUT hiding the view text', fakeAsync(() => {
    // asserts: the core UX requirement — text is retained while the panel is open (only a commit changes it)
    const openSpy = spyOn(comp, 'open').and.callThrough();
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.sd-inline-view') as HTMLElement).click();
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();

    expect(openSpy).toHaveBeenCalled();
    // text face stays — only a committed value changes it
    expect(fixture.nativeElement.querySelector('.sd-inline-view sd-view')).not.toBeNull();
    expect(comp.isViewed()).toBe(false);
  }));

  it('inline editor is bare (no inline clear-×) without passing [bare]', fakeAsync(() => {
    // asserts: inline implies bare → no accidental clear-× next to the trigger (the original chip bug)
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).classList.contains('sd-bare')).toBe(true);
    expect(fixture.nativeElement.querySelector('.sd-clear-btn')).toBeNull();
  }));

  it('inline + value renders a hover clear-× that clears WITHOUT opening the panel', fakeAsync(() => {
    // asserts: inline clear affordance empties the value and stops propagation (no panel open)
    const openSpy = spyOn(comp, 'open');
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.sd-inline-view .sd-inline-clear') as HTMLElement | null;
    expect(clearBtn).not.toBeNull();
    clearBtn!.click();
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();

    expect(comp.valueModel()).toBeNull();
    expect(openSpy).not.toHaveBeenCalled();
  }));

  it('inline clear-× is hidden when required (cannot empty a required value)', fakeAsync(() => {
    // asserts: required inline field exposes no clear affordance
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-clear')).toBeNull();
  }));

  it('inline clear-× is hidden when there is no value', fakeAsync(() => {
    // asserts: empty inline field has nothing to clear
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-clear')).toBeNull();
  }));

  it('[clearable]="false" hides the inline clear-× (host owns removal, e.g. chip)', fakeAsync(() => {
    // asserts: a host that owns its own removal (query-bar chip) opts out → no second ×
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.componentRef.setInput('clearable', false);
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sd-inline-clear')).toBeNull();
  }));

  it('inline panel width floors at 200px when the trigger is narrow', () => {
    // asserts: narrow text trigger doesn't produce a cramped panel — inline floors width at 200px
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    comp.updatePanelWidth();
    // narrow text face (< 200px) → panel forced to 200px
    expect(comp.calculatedPanelWidth()).toBe('200px');
  });

  it('viewed=true stays static (no editor, no inline face)', fakeAsync(() => {
    // asserts: viewed=true is unchanged DETAIL behaviour — no editor mounts, no inline click target
    fixture.componentRef.setInput('viewed', true);
    fixture.componentRef.setInput('model', 'a');
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    expect(comp.isInline()).toBe(false);
    expect(comp.isViewed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.sd-inline-view')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
    expect(fixture.nativeElement.querySelector('sd-view')).not.toBeNull();
  }));
});

// ---------------------------------------------------------------------------
// sdViewDef = unified view-template override (fed into <sd-view> valueTemplate)
// ---------------------------------------------------------------------------

describe('SdSelect (sdViewDef view-template override)', () => {
  @Component({
    standalone: true,
    imports: [SdSelect, SdViewDefDirective],
    template: `
      <sd-select [viewed]="mode" valueField="id" displayField="name" [items]="items" [model]="model">
        <ng-template sdViewDef let-value="value" let-items="selectedItems" let-item="selectedItem">
          <span class="vd">VD:{{ value }}|{{ items?.length }}|{{ item?.name }}</span>
        </ng-template>
      </sd-select>
    `,
  })
  class VdHost {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mode: any = true;
    items = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any = 'a';
  }

  let fixture: ComponentFixture<VdHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VdHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(VdHost);
  });

  it('viewed=true: renders the sdViewDef template (not the default sd-view text) with full context', fakeAsync(() => {
    // asserts: sdViewDef overrides the view rendering AND receives value + selectedItems + selectedItem
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    const vd = fixture.nativeElement.querySelector('.vd') as HTMLElement | null;
    expect(vd).not.toBeNull();
    expect(vd!.textContent).toContain('VD:a'); // value
    expect(vd!.textContent).toContain('|1|'); // selectedItems.length
    expect(vd!.textContent).toContain('Alpha'); // selectedItem.name
  }));

  it('inline: the inline text face also renders via the sdViewDef template', fakeAsync(() => {
    // asserts: sdViewDef drives BOTH static view and the inline text face — one rendering path
    fixture.componentInstance.mode = 'inline';
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    const vd = fixture.nativeElement.querySelector('.sd-inline-view .vd') as HTMLElement | null;
    expect(vd).not.toBeNull();
    expect(vd!.textContent).toContain('VD:a');
  }));
});

describe('SdSelect (#sdSelected editable-trigger template)', () => {
  @Component({
    standalone: true,
    imports: [SdSelect],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items" [model]="model" [multiple]="multiple">
        <ng-template #sdSelected let-item let-items="items" let-multiple="multiple" let-display="display">
          <span class="sel">SEL:{{ multiple ? items?.length : item?.name }}|{{ display }}</span>
        </ng-template>
      </sd-select>
    `,
  })
  class SelHost {
    items = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any = 'a';
    multiple = false;
  }

  // A second host WITHOUT the template — proves the default display fallback.
  @Component({
    standalone: true,
    imports: [SdSelect],
    template: `<sd-select valueField="id" displayField="name" [items]="items" [model]="model"></sd-select>`,
  })
  class PlainHost {
    items = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: any = 'a';
  }

  // Material renders a custom <mat-select-trigger> only once the select is non-empty,
  // which needs its options registered → open the panel to force selection resolution.
  function openSelect(fixture: ComponentFixture<unknown>): void {
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    const sd = fixture.debugElement.query(By.directive(SdSelect)).componentInstance as SdSelect<any>;
    sd.open();
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
  }

  it('single mode: renders #sdSelected in the trigger with item + display context', fakeAsync(() => {
    const fixture = TestBed.createComponent(SelHost);
    openSelect(fixture);
    const sel = fixture.nativeElement.querySelector('.sel') as HTMLElement | null;
    expect(sel).not.toBeNull();
    expect(sel!.textContent).toContain('SEL:Alpha'); // item.name (single)
    expect(sel!.textContent).toContain('Alpha'); // display
  }));

  it('multiple mode: context.multiple is true and items is the selected array', fakeAsync(() => {
    const fixture = TestBed.createComponent(SelHost);
    fixture.componentInstance.multiple = true;
    fixture.componentInstance.model = ['a', 'b'];
    openSelect(fixture);
    const sel = fixture.nativeElement.querySelector('.sel') as HTMLElement | null;
    expect(sel).not.toBeNull();
    expect(sel!.textContent).toContain('SEL:2'); // items.length in multiple branch
  }));

  it('falls back to plain display text when #sdSelected is not projected', fakeAsync(() => {
    const fixture = TestBed.createComponent(PlainHost);
    openSelect(fixture);
    expect(fixture.nativeElement.querySelector('.sel')).toBeNull();
    expect((fixture.nativeElement.textContent || '')).toContain('Alpha');
  }));
});

describe('SdSelect (sdSelectFooterAction)', () => {
  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction>
          <button type="button" class="footer-action always" (click)="add('always', '')">Always</button>
        </ng-template>

        <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
          <button type="button" class="footer-action empty" (click)="add('empty', searchText)">Add {{ searchText }}</button>
        </ng-template>

        <ng-template sdSelectFooterAction when="has-result" let-searchText="searchText">
          <button type="button" class="footer-action has-result" (click)="add('has-result', searchText)">Use {{ searchText }}</button>
        </ng-template>
      </sd-select>
    `,
  })
  class FooterHost {
    items = LARGE_ITEMS;
    calls: Array<{ type: string; searchText: string }> = [];

    add(type: string, searchText: string): void {
      this.calls.push({ type, searchText });
    }
  }

  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction>
          <button type="button" class="footer-action first">First</button>
        </ng-template>
        <ng-template sdSelectFooterAction>
          <button type="button" class="footer-action second">Second</button>
        </ng-template>
        <ng-template sdSelectFooterAction>
          <button type="button" class="footer-action third">Third</button>
        </ng-template>
      </sd-select>
    `,
  })
  class MultiFooterHost {
    items = FRUIT_ITEMS;
  }

  @Component({
    standalone: true,
    imports: [SdSelect, SdSelectFooterActionDirective],
    template: `
      <sd-select valueField="id" displayField="name" [items]="items">
        <ng-template sdSelectFooterAction when="empty" let-searchText="searchText">
          <button type="button" class="footer-action empty">Add {{ searchText }}</button>
        </ng-template>
      </sd-select>
    `,
  })
  class EmptyOnlyFooterHost {
    items = FRUIT_ITEMS;
  }

  function openFooterSelect<T>(fixture: ComponentFixture<T>): SdSelect<any> {
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    const sd = fixture.debugElement.query(By.directive(SdSelect)).componentInstance as SdSelect<any>;
    sd.open();
    fixture.detectChanges();
    tick(600);
    fixture.detectChanges();
    return sd;
  }

  function footerActions(): HTMLElement[] {
    return Array.from(document.body.querySelectorAll<HTMLElement>('.sd-select-panel .footer-action'));
  }

  function footerContainer(): HTMLElement | null {
    return document.body.querySelector<HTMLElement>('.sd-select-panel .sd-select-footer-actions');
  }

  afterEach(() => {
    document.body.querySelectorAll('.cdk-overlay-container').forEach(el => {
      el.innerHTML = '';
    });
  });

  it('renders when="always" regardless of search results', fakeAsync(() => {
    const fixture = TestBed.createComponent(FooterHost);
    openFooterSelect(fixture);
    const actions = footerActions();
    expect(actions.some(el => el.classList.contains('always'))).toBe(true);
  }));

  it('does not render the footer container when no footer action is visible', fakeAsync(() => {
    const fixture = TestBed.createComponent(EmptyOnlyFooterHost);
    openFooterSelect(fixture);
    expect(footerContainer()).toBeNull();
  }));

  it('renders when="empty" only when search text is present and filtered option count is 0', fakeAsync(() => {
    const fixture = TestBed.createComponent(FooterHost);
    const sd = openFooterSelect(fixture);

    sd.inputControl.setValue('missing-item');
    tick(600);
    fixture.detectChanges();

    const actions = footerActions();
    expect(sd.filteredItems().length).toBe(0);
    expect(actions.some(el => el.classList.contains('empty'))).toBe(true);
    expect(actions.some(el => el.classList.contains('has-result'))).toBe(false);
  }));

  it('renders when="has-result" when filtered option count is greater than 0', fakeAsync(() => {
    const fixture = TestBed.createComponent(FooterHost);
    const sd = openFooterSelect(fixture);

    sd.inputControl.setValue('Item 1');
    tick(600);
    fixture.detectChanges();

    const actions = footerActions();
    expect(sd.filteredItems().length).toBeGreaterThan(0);
    expect(actions.some(el => el.classList.contains('has-result'))).toBe(true);
    expect(actions.some(el => el.classList.contains('empty'))).toBe(false);
  }));

  it('preserves declaration order for multiple footer actions', fakeAsync(() => {
    const fixture = TestBed.createComponent(MultiFooterHost);
    openFooterSelect(fixture);
    expect(footerActions().map(el => el.textContent?.trim())).toEqual(['First', 'Second', 'Third']);
  }));

  it('passes searchText context and keeps consumer click bindings working', fakeAsync(() => {
    const fixture = TestBed.createComponent(FooterHost);
    const host = fixture.componentInstance;
    const sd = openFooterSelect(fixture);

    sd.inputControl.setValue('Dragonfruit');
    tick(600);
    fixture.detectChanges();

    const emptyAction = footerActions().find(el => el.classList.contains('empty'))!;
    expect(emptyAction.textContent).toContain('Dragonfruit');
    emptyAction.click();
    fixture.detectChanges();

    expect(host.calls).toEqual([{ type: 'empty', searchText: 'Dragonfruit' }]);
  }));
});
