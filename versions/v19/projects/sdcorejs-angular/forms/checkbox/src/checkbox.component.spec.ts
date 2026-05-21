import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdCheckbox } from './checkbox.component';

@Component({
  standalone: true,
  imports: [SdCheckbox, FormsModule, ReactiveFormsModule],
  template: `<sd-checkbox
    [label]="label"
    [color]="color"
    [disabled]="disabled"
    [inlineError]="inlineError"
    [autoId]="autoId"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-checkbox>`,
})
class HostComponent {
  label?: string;
  color: 'primary' | 'warn' = 'primary';
  disabled: boolean | '' | null | undefined = false;
  inlineError = '';
  autoId: string | null | undefined = undefined;
  model: any = false;
  changes: any[] = [];
  onSdChange(v: any) {
    this.changes.push(v);
  }
}

@Component({
  standalone: true,
  imports: [SdCheckbox],
  template: `<sd-checkbox name="agree" [form]="fg"></sd-checkbox>`,
})
class FgHost {
  fg!: FormGroup;
}

describe('SdCheckbox', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let checkbox: SdCheckbox;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    checkbox = fixture.debugElement.query(el => el.componentInstance instanceof SdCheckbox)
      ?.componentInstance as SdCheckbox;
    if (!checkbox) throw new Error('SdCheckbox not found in fixture');
  });

  describe('disabled', () => {
    it('disables formControl when disabled = true', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(checkbox.formControl.disabled).toBe(true);
    });

    it('coerces empty string to true', () => {
      host.disabled = '';
      fixture.detectChanges();
      expect(checkbox.formControl.disabled).toBe(true);
    });

    it('enables formControl when disabled = false', () => {
      host.disabled = true;
      fixture.detectChanges();
      host.disabled = false;
      fixture.detectChanges();
      expect(checkbox.formControl.disabled).toBe(false);
    });
  });

  describe('model setter', () => {
    it('syncs formControl without emitting valueChanges', () => {
      const received: any[] = [];
      const sub = checkbox.formControl.valueChanges.subscribe(v => received.push(v));
      host.model = true;
      fixture.detectChanges();
      expect(checkbox.formControl.value).toBe(true);
      expect(received.length).toBe(0);
      sub.unsubscribe();
    });

    it('does not re-set when value unchanged', () => {
      host.model = true;
      fixture.detectChanges();
      const spy = spyOn(checkbox.formControl, 'setValue').and.callThrough();
      host.model = true;
      fixture.detectChanges();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('output events', () => {
    it('emits modelChange + sdChange when user toggles', () => {
      checkbox.formControl.setValue(true);
      fixture.detectChanges();
      expect(host.model).toBe(true);
      expect(host.changes).toEqual([true]);
    });
  });

  describe('inlineError validator', () => {
    it('sets inlineError on formControl when inlineError is set', () => {
      host.inlineError = 'Sai rồi';
      fixture.detectChanges();
      checkbox.formControl.updateValueAndValidity();
      expect(checkbox.formControl.hasError('inlineError')).toBe(true);
    });

    it('clears validator when inlineError = empty', () => {
      host.inlineError = 'Sai';
      fixture.detectChanges();
      host.inlineError = '';
      fixture.detectChanges();
      checkbox.formControl.updateValueAndValidity();
      expect(checkbox.formControl.hasError('inlineError')).toBe(false);
    });
  });

  describe('color', () => {
    it('defaults to primary', () => {
      expect(checkbox.color).toBe('primary');
    });

    it('accepts "warn"', () => {
      host.color = 'warn';
      fixture.detectChanges();
      expect(checkbox.color).toBe('warn');
    });
  });

  describe('autoId', () => {
    it('prefixes with forms-checkbox-', () => {
      host.autoId = 'agree';
      fixture.detectChanges();
      expect(checkbox.autoId()).toBe('forms-checkbox-agree');
    });

    it('keeps autoId undefined when value is null', () => {
      host.autoId = null;
      fixture.detectChanges();
      expect(checkbox.autoId()).toBeUndefined();
    });
  });
});

describe('SdCheckbox (FormGroup lifecycle)', () => {
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
