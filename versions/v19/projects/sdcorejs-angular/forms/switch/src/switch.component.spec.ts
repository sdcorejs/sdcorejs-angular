import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdSwitch } from './switch.component';

@Component({
  standalone: true,
  imports: [SdSwitch, FormsModule, ReactiveFormsModule],
  template: `<sd-switch
    [label]="label"
    [color]="color"
    [disabled]="disabled"
    [required]="required"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-switch>`,
})
class HostComponent {
  label?: string;
  color: 'primary' | 'warn' | 'accent' | null = 'primary';
  disabled: boolean | '' | null | undefined = false;
  required: boolean | '' | null | undefined = false;
  model: boolean | null | undefined = false;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
}

@Component({
  standalone: true,
  imports: [SdSwitch],
  template: `<sd-switch name="agree" [form]="fg"></sd-switch>`,
})
class FgHost {
  fg!: FormGroup;
}

@Component({
  standalone: true,
  imports: [SdSwitch, FormsModule],
  template: `<form #f="ngForm"><sd-switch name="agree" [form]="f"></sd-switch></form>`,
})
class NgFormHost {
  @ViewChild('f') ngForm!: NgForm;
}

describe('SdSwitch', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let switchInstance: SdSwitch;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    switchInstance = fixture.debugElement.query(el => el.componentInstance instanceof SdSwitch)
      ?.componentInstance as SdSwitch;
  });

  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(switchInstance.formControl.disabled).toBe(true);
    });

    it('coerces bare attribute (empty string) to true', () => {
      host.disabled = '';
      fixture.detectChanges();
      expect(switchInstance.formControl.disabled).toBe(true);
    });

    it('enables formControl when disabled = false', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(switchInstance.formControl.disabled).toBe(false);
    });
  });

  describe('model setter', () => {
    it('syncs formControl.value WITHOUT emitting valueChanges', () => {
      const received: any[] = [];
      const sub = switchInstance.formControl.valueChanges.subscribe(v => received.push(v));

      host.model = true;
      fixture.detectChanges();

      expect(switchInstance.formControl.value).toBe(true);
      expect(received.length).toBe(0);
      sub.unsubscribe();
    });

    it('does not re-set when value unchanged', () => {
      host.model = true;
      fixture.detectChanges();
      const spy = spyOn(switchInstance.formControl, 'setValue').and.callThrough();
      host.model = true;
      fixture.detectChanges();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('color', () => {
    it('defaults to "primary" when color is null', () => {
      host.color = null;
      fixture.detectChanges();
      expect(switchInstance.color).toBe('primary');
    });

    it('uses provided color', () => {
      host.color = 'warn';
      fixture.detectChanges();
      expect(switchInstance.color as string).toBe('warn');
    });
  });

  describe('required validator', () => {
    it('applies required validator when required = true (null value triggers error)', () => {
      host.required = true;
      fixture.detectChanges();
      switchInstance.formControl.setValue(null);
      expect(switchInstance.formControl.hasError('required')).toBe(true);
    });

    it('removes required validator when required = false', () => {
      host.required = true;
      fixture.detectChanges();
      host.required = false;
      fixture.detectChanges();
      switchInstance.formControl.setValue(null);
      expect(switchInstance.formControl.hasError('required')).toBe(false);
    });
  });

  describe('output events', () => {
    it('emits sdChange + modelChange on user toggle (via formControl valueChanges)', () => {
      const sdSpy = spyOn(switchInstance.sdChange, 'emit').and.callThrough();
      const modelSpy = spyOn(switchInstance.modelChange, 'emit').and.callThrough();

      switchInstance.formControl.setValue(true);
      fixture.detectChanges();

      expect(sdSpy).toHaveBeenCalled();
      expect(modelSpy).toHaveBeenCalled();
    });
  });
});

describe('SdSwitch (FormGroup lifecycle)', () => {
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
    expect(fg.contains('agree')).toBe(true);
  });

  it('removes control on destroy', () => {
    fixture.destroy();
    expect(fg.contains('agree')).toBe(false);
  });
});

describe('SdSwitch (NgForm extraction)', () => {
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
    expect(ngForm.form.contains('agree')).toBe(true);
  });
});
