import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-radio>`,
})
class HostComponent {
  label = 'Pick one';
  items: { code: string; name: string }[] = [...ITEMS];
  display: 'row' | 'column' = 'row';
  disabled: boolean | '' | null | undefined = false;
  required: boolean | '' | null | undefined = false;
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

describe('SdRadio', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let radio: SdRadio;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    radio = fixture.debugElement.query(el => el.componentInstance instanceof SdRadio)
      ?.componentInstance as SdRadio;
    if (!radio) throw new Error('SdRadio not found in fixture');
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
      expect(radio.items).toEqual([]);
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
    it('emits modelChange + sdChange + sdSelection when formControl value changes', () => {
      const sdSpy = spyOn(radio.sdChange, 'emit').and.callThrough();
      const modelSpy = spyOn(radio.modelChange, 'emit').and.callThrough();
      const selSpy = spyOn(radio.sdSelection, 'emit').and.callThrough();

      radio.formControl.setValue('b');
      fixture.detectChanges();

      expect(sdSpy).toHaveBeenCalledWith('b');
      expect(modelSpy).toHaveBeenCalledWith('b');
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
      aRadio = aFixture.debugElement.query(el => el.componentInstance instanceof SdRadio)
        ?.componentInstance as SdRadio;
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
