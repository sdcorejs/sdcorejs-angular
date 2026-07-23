import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdLabelDefDirective, SdSuffixDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdRadio } from './radio.component';

const ITEMS = [
  { code: 'a', name: 'Option A' },
  { code: 'b', name: 'Option B' },
];

@Component({
  standalone: true,
  imports: [SdRadio, FormsModule, ReactiveFormsModule],
  template: `<sd-radio
    [label]="label"
    [items]="items"
    valueField="code"
    displayField="name"
    [display]="display"
    [disabled]="disabled"
    [required]="required"
    [placeholder]="placeholder"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-radio>`,
})
class HostComponent {
  label: string | undefined = 'Pick one';
  items: { code: string; name: string }[] = [...ITEMS];
  display: 'row' | 'column' = 'row';
  disabled: boolean | '' | null | undefined = false;
  required: boolean | '' | null | undefined = false;
  placeholder: string | undefined;
  model: any = null;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
}

@Component({
  standalone: true,
  imports: [SdRadio],
  template: `<sd-radio name="mode" [form]="fg" [items]="items" valueField="code" displayField="name"></sd-radio>`,
})
class FgHost {
  fg!: FormGroup;
  items = [...ITEMS];
}

@Component({
  standalone: true,
  imports: [SdRadio, FormsModule],
  template: `<form #f="ngForm"><sd-radio name="mode" [form]="f" [items]="items" valueField="code" displayField="name"></sd-radio></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
  items = [...ITEMS];
}

@Component({
  standalone: true,
  imports: [SdRadio, SdLabelDefDirective],
  template: `<sd-radio [items]="items" valueField="code" displayField="name">
    <ng-template sdLabelDef><span class="projected-radio-label">Projected choice</span></ng-template>
  </sd-radio>`,
})
class ProjectedLabelHost {
  items = [...ITEMS];
}

describe('SdRadio', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let radio: SdRadio;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, ProjectedLabelHost, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    radio = fixture.debugElement.query(el => el.componentInstance instanceof SdRadio)?.componentInstance as SdRadio;
    if (!radio) throw new Error('SdRadio not found in fixture');
  });

  describe('required message (OnPush re-render on touch)', () => {
    // why: probe — template gate cho mat-error đọc formControl.errors/touched (raw). Kiểm tra
    // dùng autoDetectChanges (tôn trọng OnPush) xem message required có hiện khi markAsTouched không.
    it('renders the required message in the DOM after the control is touched (no forced CD)', async () => {
      host.required = true;
      fixture.autoDetectChanges();
      await fixture.whenStable();
      // required + chưa chọn (invalid) nhưng chưa touched → chưa hiện message
      expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();

      radio.formControl.markAsTouched();
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('mat-error')).not.toBeNull();
    });
  });

  describe('creation & rendering', () => {
    it('creates the component', () => {
      expect(radio).toBeTruthy();
    });

    it('renders mat-radio-button for each item', () => {
      const buttons = fixture.nativeElement.querySelectorAll('mat-radio-button');
      expect(buttons.length).toBe(2);
    });

    it('renders the label when label input is set', () => {
      host.label = 'Gender';
      fixture.detectChanges();
      const labelEl = fixture.nativeElement.querySelector('sd-label');
      expect(labelEl).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('associates a stable accessible group name with the label input', () => {
      const group = fixture.nativeElement.querySelector('mat-radio-group') as HTMLElement;
      const labelledBy = group.getAttribute('aria-labelledby');

      expect(labelledBy).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`#${labelledBy}`)?.textContent).toContain('Pick one');
      expect(group.getAttribute('aria-label')).toBeNull();

      fixture.detectChanges();
      expect(group.getAttribute('aria-labelledby')).toBe(labelledBy);
    });

    it('uses placeholder as the accessible name when no label is available', () => {
      host.label = undefined;
      host.placeholder = 'Choose a mode';
      fixture.detectChanges();

      const group = fixture.nativeElement.querySelector('mat-radio-group') as HTMLElement;
      expect(group.getAttribute('aria-labelledby')).toBeNull();
      expect(group.getAttribute('aria-label')).toBe('Choose a mode');
    });

    it('links the visible required error and exposes invalid and required state', () => {
      host.required = true;
      fixture.detectChanges();
      radio.formControl.markAsTouched();
      fixture.detectChanges();

      const group = fixture.nativeElement.querySelector('mat-radio-group') as HTMLElement;
      const describedBy = group.getAttribute('aria-describedby');
      const error = describedBy ? fixture.nativeElement.querySelector(`#${describedBy}`) : null;

      expect(group.getAttribute('aria-required')).toBe('true');
      expect(group.getAttribute('aria-invalid')).toBe('true');
      expect(describedBy).toBeTruthy();
      expect(error).not.toBeNull();
      expect(error?.textContent?.trim()).toBeTruthy();
    });

    it('associates projected label content with the radio group', () => {
      const projectedFixture = TestBed.createComponent(ProjectedLabelHost);
      projectedFixture.detectChanges();

      const group = projectedFixture.nativeElement.querySelector('mat-radio-group') as HTMLElement;
      const labelledBy = group.getAttribute('aria-labelledby');

      expect(labelledBy).toBeTruthy();
      expect(projectedFixture.nativeElement.querySelector(`#${labelledBy}`)?.textContent).toContain('Projected choice');
      projectedFixture.destroy();
    });
  });

  describe('items input', () => {
    it('populates radio buttons with item displayField text', () => {
      const buttons = fixture.nativeElement.querySelectorAll('mat-radio-button');
      const texts = Array.from(buttons).map((b: any) => b.textContent?.trim());
      expect(texts).toContain('Option A');
      expect(texts).toContain('Option B');
    });

    it('coerces non-array items to empty array', () => {
      (host as any).items = null;
      fixture.detectChanges();
      expect(radio.normalizedItems()).toEqual([]);
    });
  });

  describe('display input', () => {
    it('applies c-radio-group-row class when display = row', () => {
      host.display = 'row';
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('mat-radio-group');
      expect(group.classList.contains('c-radio-group-row')).toBe(true);
    });

    it('applies c-radio-group-column class when display = column', () => {
      host.display = 'column';
      fixture.detectChanges();
      const group = fixture.nativeElement.querySelector('mat-radio-group');
      expect(group.classList.contains('c-radio-group-column')).toBe(true);
    });
  });

  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(radio.formControl.disabled).toBe(true);
    });

    it('coerces bare attribute (empty string) to true', () => {
      host.disabled = '';
      fixture.detectChanges();
      expect(radio.formControl.disabled).toBe(true);
    });

    it('enables formControl when disabled = false', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(radio.formControl.disabled).toBe(false);
    });
  });

  describe('model setter', () => {
    it('syncs formControl.value WITHOUT emitting valueChanges', () => {
      const received: any[] = [];
      const sub = radio.formControl.valueChanges.subscribe(v => received.push(v));

      host.model = 'a';
      fixture.detectChanges();

      expect(radio.formControl.value).toBe('a');
      expect(received.length).toBe(0);
      sub.unsubscribe();
    });

    it('does not re-set when value unchanged (dedup guard)', () => {
      host.model = 'a';
      fixture.detectChanges();
      const spy = spyOn(radio.formControl, 'setValue').and.callThrough();
      host.model = 'a';
      fixture.detectChanges();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('required validator', () => {
    it('applies required validator when required = true (null triggers error)', () => {
      host.required = true;
      fixture.detectChanges();
      radio.formControl.setValue(null);
      expect(radio.formControl.hasError('required')).toBe(true);
    });

    it('removes required validator when required = false', () => {
      host.required = true;
      fixture.detectChanges();
      host.required = false;
      fixture.detectChanges();
      radio.formControl.setValue(null);
      expect(radio.formControl.hasError('required')).toBe(false);
    });
  });

  describe('output events', () => {
    it('emits sdChange + sdSelection + propagates [(model)] when formControl value changes', () => {
      const sdSpy = spyOn(radio.sdChange, 'emit').and.callThrough();
      const selSpy = spyOn(radio.sdSelection, 'emit').and.callThrough();

      radio.formControl.setValue('b');
      fixture.detectChanges();

      expect(sdSpy).toHaveBeenCalledWith('b');
      // host's `model` is updated through the auto-generated `modelChange` of the `model()` signal
      expect(host.model).toBe('b');
      expect(selSpy).toHaveBeenCalledWith(jasmine.objectContaining({ value: 'b' }));
    });
  });

  // NOTE: source-code drift — remote added these as a `_autoId` SETTER test,
  // but local refactor migrated to a signal input `autoIdInput` (alias `autoId`)
  // + `autoId` computed. Tests updated to drive the new API.
  describe('autoId computed', () => {
    @Component({
      standalone: true,
      imports: [SdRadio],
      template: `<sd-radio [autoId]="autoId" [items]="items" valueField="code" displayField="name"></sd-radio>`,
    })
    class AutoIdHost {
      autoId: string | null | undefined = undefined;
      items = [...ITEMS];
    }

    let aFixture: ComponentFixture<AutoIdHost>;
    let aRadio: SdRadio;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AutoIdHost, NoopAnimationsModule],
      }).compileComponents();
      aFixture = TestBed.createComponent(AutoIdHost);
      aFixture.detectChanges();
      aRadio = aFixture.debugElement.query(el => el.componentInstance instanceof SdRadio)?.componentInstance as SdRadio;
      if (!aRadio) throw new Error('SdRadio not found');
    });

    it('prefixes with forms-radio-', () => {
      aFixture.componentInstance.autoId = 'gender';
      aFixture.detectChanges();
      expect(aRadio.autoId()).toBe('forms-radio-gender');
    });

    it('leaves autoId undefined when value is null/empty', () => {
      aFixture.componentInstance.autoId = null;
      aFixture.detectChanges();
      expect(aRadio.autoId()).toBeUndefined();
    });

    describe('E2E attributes', () => {
      it('renders data-disabled reflecting FormControl state', () => {
        aFixture.componentInstance.autoId = 'gender';
        aFixture.detectChanges();
        const group = aFixture.nativeElement.querySelector('mat-radio-group');
        expect(group.getAttribute('data-disabled')).toBe('false');

        aRadio.formControl.disable();
        aFixture.detectChanges();
        expect(group.getAttribute('data-disabled')).toBe('true');

        aRadio.formControl.enable();
        aFixture.detectChanges();
        expect(group.getAttribute('data-disabled')).toBe('false');
      });

      it('renders data-value reflecting selected key', () => {
        aFixture.componentInstance.autoId = 'gender';
        aFixture.detectChanges();
        const group = aFixture.nativeElement.querySelector('mat-radio-group');

        aRadio.formControl.setValue('a');
        aFixture.detectChanges();
        expect(group.getAttribute('data-value')).toBe('a');

        aRadio.formControl.setValue('b');
        aFixture.detectChanges();
        expect(group.getAttribute('data-value')).toBe('b');
      });

      it('renders data-empty toggling with selection', () => {
        aFixture.componentInstance.autoId = 'gender';
        aFixture.detectChanges();
        const group = aFixture.nativeElement.querySelector('mat-radio-group');

        aRadio.formControl.setValue(null);
        aFixture.detectChanges();
        expect(group.getAttribute('data-empty')).toBe('true');

        aRadio.formControl.setValue('a');
        aFixture.detectChanges();
        expect(group.getAttribute('data-empty')).toBe('false');

        aRadio.formControl.setValue(null);
        aFixture.detectChanges();
        expect(group.getAttribute('data-empty')).toBe('true');
      });
    });
  });
});

describe('SdRadio (FormGroup lifecycle)', () => {
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
    expect(fg.contains('mode')).toBe(true);
  });

  it('removes control on destroy', () => {
    fixture.destroy();
    expect(fg.contains('mode')).toBe(false);
  });
});

describe('SdRadio (viewed + color)', () => {
  @Component({
    standalone: true,
    imports: [SdRadio, SdSuffixDefDirective, FormsModule],
    template: `<sd-radio
      [label]="label"
      [items]="items"
      valueField="code"
      displayField="name"
      [viewed]="viewed"
      [placeholder]="placeholder"
      [color]="color"
      [(model)]="model">
      <ng-template sdSuffixDef><span class="radio-suffix">Suffix</span></ng-template>
    </sd-radio>`,
  })
  class VHost {
    label = 'Pick one';
    items = [...ITEMS];
    viewed = false;
    placeholder = 'Choose one';
    color: any = 'primary';
    model: any = null;
  }

  let f: ComponentFixture<VHost>;
  let radio: SdRadio;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VHost, NoopAnimationsModule] }).compileComponents();
    f = TestBed.createComponent(VHost);
    f.detectChanges();
    radio = f.debugElement.query(el => el.componentInstance instanceof SdRadio).componentInstance;
  });

  it('viewedText returns displayField string (not the item object) when value matches', () => {
    radio.formControl.setValue('b');
    f.detectChanges();
    expect(radio.viewedText()).toBe('Option B');
  });

  it('viewedText falls back to empty string when value does not match any item', () => {
    radio.formControl.setValue('zzz');
    f.detectChanges();
    expect(radio.viewedText()).toBe('');
  });

  it('viewed=true renders text (no mat-radio-group)', () => {
    f.componentInstance.viewed = true;
    f.componentInstance.model = 'a';
    f.detectChanges();
    expect(f.nativeElement.querySelector('mat-radio-group')).toBeNull();
    const txt = (f.nativeElement.textContent as string).trim();
    expect(txt).toContain('Option A');
    expect(txt).not.toContain('[object');
  });

  it('viewed text is empty placeholder when no value selected', () => {
    f.componentInstance.viewed = true;
    f.componentInstance.model = null;
    f.detectChanges();
    const txt = f.nativeElement.textContent as string;
    expect(txt).toContain('Choose one');
    expect(txt).not.toContain('[object');
  });

  it('renders the projected suffix beside the editable radio group', () => {
    expect(f.nativeElement.querySelector('.radio-suffix')?.textContent).toContain('Suffix');
  });

  it('color input drives host class .sd-c-<color>', () => {
    f.componentInstance.color = 'success';
    f.detectChanges();
    const hostEl = f.debugElement.query(el => el.componentInstance instanceof SdRadio).nativeElement as HTMLElement;
    expect(hostEl.classList.contains('sd-c-success')).toBe(true);
    expect(hostEl.classList.contains('sd-c-primary')).toBe(false);
  });

  // why: Material radio can apply wrapper tokens at higher specificity than MDC
  // defaults. Assert both wrapper and MDC icon tokens follow the Core UI color.
  it('overrides --mat-radio-selected-*-icon-color via --sd-c chain', () => {
    const root = document.documentElement;
    const prev = root.style.getPropertyValue('--sd-error');
    root.style.setProperty('--sd-error', 'rgb(220, 38, 38)');
    try {
      f.componentInstance.color = 'error';
      f.detectChanges();
      const inner = f.nativeElement.querySelector('.mat-mdc-radio-button') as HTMLElement;
      expect(inner).not.toBeNull();
      const cs = getComputedStyle(inner);
      // Material wrapper tokens.
      expect(cs.getPropertyValue('--mat-radio-selected-icon-color').trim()).toBe('rgb(220, 38, 38)');
      expect(cs.getPropertyValue('--mat-radio-selected-focus-icon-color').trim()).toBe('rgb(220, 38, 38)');
      expect(cs.getPropertyValue('--mat-radio-selected-hover-icon-color').trim()).toBe('rgb(220, 38, 38)');
      expect(cs.getPropertyValue('--mat-radio-selected-pressed-icon-color').trim()).toBe('rgb(220, 38, 38)');
      expect(cs.getPropertyValue('--mat-radio-checked-ripple-color').trim()).toBe('rgb(220, 38, 38)');
      // MDC layer tokens
      expect(cs.getPropertyValue('--mdc-radio-selected-icon-color').trim()).toBe('rgb(220, 38, 38)');
    } finally {
      if (prev) root.style.setProperty('--sd-error', prev);
      else root.style.removeProperty('--sd-error');
    }
  });

  it('color defaults to primary when null/undefined passed', () => {
    f.componentInstance.color = null;
    f.detectChanges();
    expect(radio.color()).toBe('primary');
  });
});

describe('SdRadio (NgForm extraction)', () => {
  let fixture: ComponentFixture<NgFormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgFormHost, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(NgFormHost);
    fixture.detectChanges();
  });

  it('extracts FormGroup from NgForm and adds control', () => {
    const ngForm = fixture.componentInstance.ngForm;
    expect(ngForm).toBeTruthy();
    expect(ngForm.form.contains('mode')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state) — disabled coerces to static
// ---------------------------------------------------------------------------
describe('SdRadio (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdRadio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdRadio, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdRadio);
    fixture.componentRef.setInput('items', [...ITEMS]);
    fixture.componentRef.setInput('valueField', 'code');
    fixture.componentRef.setInput('displayField', 'name');
  });

  it("viewed='inline' stays interactive: renders the mat-radio-group", () => {
    // asserts: inline keeps the picker editable — the read-only text view is NOT used
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-radio-group')).not.toBeNull();
  });

  it('viewed=true renders the static text view (no mat-radio-group)', () => {
    // asserts: classic viewed=true path unchanged — read-only text only
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-radio-group')).toBeNull();
  });

  it("disabled + viewed='inline' falls back to static (no mat-radio-group)", () => {
    // asserts: a disabled control can't be edited, so inline degrades to the static view
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-radio-group')).toBeNull();
  });
});
