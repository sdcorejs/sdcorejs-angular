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
    [viewed]="viewed"
    [inlineError]="inlineError"
    [autoId]="autoId"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-checkbox>`,
})
class HostComponent {
  label?: string;
  color: any = 'primary';
  disabled: boolean | '' | null | undefined = false;
  viewed = false;
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
      expect(checkbox.color()).toBe('primary');
    });

    it('accepts full Color enum (success)', () => {
      host.color = 'success';
      fixture.detectChanges();
      expect(checkbox.color()).toBe('success');
    });

    it('falls back to primary when null/undefined', () => {
      host.color = null;
      fixture.detectChanges();
      expect(checkbox.color()).toBe('primary');
    });

    it('drives host class .sd-c-<color>', () => {
      host.color = 'warning';
      fixture.detectChanges();
      const hostEl = fixture.debugElement.query(el => el.componentInstance instanceof SdCheckbox).nativeElement as HTMLElement;
      expect(hostEl.classList.contains('sd-c-warning')).toBe(true);
      expect(hostEl.classList.contains('sd-c-primary')).toBe(false);
    });

    // why: bug "luôn ăn màu accent" do theme set `--mat-checkbox-selected-icon-color`
    // qua `.mat-mdc-checkbox.mat-accent` ở specificity (0,2,1). Override CẢ `--mat-*` LẪN
    // `--mdc-*` với `!important`. Spec gán --sd-warning giả lập + verify chain propagate.
    it('overrides --mat-checkbox-* and --mdc-checkbox-* tokens via --sd-c chain', () => {
      const root = document.documentElement;
      const prev = root.style.getPropertyValue('--sd-warning');
      root.style.setProperty('--sd-warning', 'rgb(245, 158, 11)');
      try {
        host.color = 'warning';
        fixture.detectChanges();
        const inner = fixture.nativeElement.querySelector('.mat-mdc-checkbox') as HTMLElement;
        expect(inner).not.toBeNull();
        const cs = getComputedStyle(inner);
        expect(cs.getPropertyValue('--mat-checkbox-selected-icon-color').trim()).toBe('rgb(245, 158, 11)');
        expect(cs.getPropertyValue('--mdc-checkbox-selected-icon-color').trim()).toBe('rgb(245, 158, 11)');
      } finally {
        if (prev) root.style.setProperty('--sd-warning', prev);
        else root.style.removeProperty('--sd-warning');
      }
    });
  });

  describe('viewed mode', () => {
    it('viewed=false renders mat-checkbox (editable)', () => {
      expect(fixture.nativeElement.querySelector('mat-checkbox')).toBeTruthy();
    });

    it('viewed=true hides mat-checkbox and shows checked/unchecked text', () => {
      host.viewed = true;
      host.model = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-checkbox')).toBeNull();
      const txt = (fixture.nativeElement.textContent as string);
      expect(/Có|Yes|はい|是|예|core\.form\.checkbox\.checked/.test(txt)).toBe(true);
    });

    it('viewed=true with model=false shows unchecked text', () => {
      host.viewed = true;
      host.model = false;
      fixture.detectChanges();
      const txt = (fixture.nativeElement.textContent as string);
      expect(/Không|No|いいえ|否|아니오|core\.form\.checkbox\.unchecked/.test(txt)).toBe(true);
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

  describe('E2E attributes', () => {
    it('renders data-disabled reflecting FormControl state', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('mat-checkbox');
      expect(el.getAttribute('data-disabled')).toBe('false');
      checkbox.formControl.disable();
      fixture.detectChanges();
      expect(el.getAttribute('data-disabled')).toBe('true');
    });

    it('renders data-value as "true"/"false"', () => {
      checkbox.formControl.setValue(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('mat-checkbox');
      expect(el.getAttribute('data-value')).toBe('true');
      checkbox.formControl.setValue(false);
      fixture.detectChanges();
      expect(el.getAttribute('data-value')).toBe('false');
    });

    it('renders data-empty true for null, false for any boolean value', () => {
      checkbox.formControl.setValue(null);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('mat-checkbox');
      expect(el.getAttribute('data-empty')).toBe('true');
      checkbox.formControl.setValue(false);
      fixture.detectChanges();
      expect(el.getAttribute('data-empty')).toBe('false');
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
