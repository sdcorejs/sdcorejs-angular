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
    [viewed]="viewed"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-switch>`,
})
class HostComponent {
  label?: string;
  color: any = 'primary';
  disabled: boolean | '' | null | undefined = false;
  required: boolean | '' | null | undefined = false;
  viewed = false;
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
      expect(switchInstance.color()).toBe('primary');
    });

    it('uses provided color from Color enum', () => {
      host.color = 'success';
      fixture.detectChanges();
      expect(switchInstance.color()).toBe('success');
    });

    it('drives host class .sd-c-<color>', () => {
      host.color = 'error';
      fixture.detectChanges();
      const hostEl = fixture.debugElement.query(el => el.componentInstance instanceof SdSwitch).nativeElement as HTMLElement;
      expect(hostEl.classList.contains('sd-c-error')).toBe(true);
      expect(hostEl.classList.contains('sd-c-primary')).toBe(false);
    });

    // why: bug "luôn ăn màu success" do theme set `.mat-mdc-slide-toggle.mat-accent {
    // --mat-slide-toggle-selected-handle-color: green }` ở specificity (0,2,1) > host
    // attr cũ. Fix bằng cách override CẢ `--mat-slide-toggle-*` LẪN `--mdc-switch-*`
    // với `!important`. Spec gán --sd-primary giả lập trên html root, sau đó kiểm tra
    // token đã propagate qua chain `--sd-c → --sd-primary → red` xuống mat-mdc-slide-toggle.
    it('overrides --mat-slide-toggle-* and --mdc-switch-* tokens via --sd-c chain', () => {
      const root = document.documentElement;
      const prev = root.style.getPropertyValue('--sd-primary');
      root.style.setProperty('--sd-primary', 'rgb(0, 92, 187)');
      try {
        host.color = 'primary';
        fixture.detectChanges();
        const inner = fixture.nativeElement.querySelector('.mat-mdc-slide-toggle') as HTMLElement;
        expect(inner).not.toBeNull();
        const cs = getComputedStyle(inner);
        expect(cs.getPropertyValue('--mat-slide-toggle-selected-handle-color').trim()).toBe('rgb(0, 92, 187)');
        expect(cs.getPropertyValue('--mdc-switch-selected-handle-color').trim()).toBe('rgb(0, 92, 187)');
      } finally {
        if (prev) root.style.setProperty('--sd-primary', prev);
        else root.style.removeProperty('--sd-primary');
      }
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
    it('emits sdChange + propagates to host via [(model)] two-way binding on user toggle', () => {
      const sdSpy = spyOn(switchInstance.sdChange, 'emit').and.callThrough();

      switchInstance.formControl.setValue(true);
      fixture.detectChanges();

      expect(sdSpy).toHaveBeenCalled();
      // host's `model` is updated through the auto-generated `modelChange` of the `model()` signal
      expect(host.model).toBe(true);
    });
  });

  describe('viewed mode', () => {
    it('viewed=false renders mat-slide-toggle (editable)', () => {
      expect(fixture.nativeElement.querySelector('mat-slide-toggle')).toBeTruthy();
    });

    it('viewed=true hides mat-slide-toggle and renders on/off text', () => {
      host.viewed = true;
      host.model = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-slide-toggle')).toBeNull();
      const txt = (fixture.nativeElement.textContent as string);
      // i18n keys core.form.switch.on/off; default locale fallback could be the raw key — accept either.
      expect(/Bật|On|オン|开|켜짐|core\.form\.switch\.on/.test(txt)).toBe(true);
    });

    it('viewed=true with model=false shows off text', () => {
      host.viewed = true;
      host.model = false;
      fixture.detectChanges();
      const txt = (fixture.nativeElement.textContent as string);
      expect(/Tắt|Off|オフ|关|꺼짐|core\.form\.switch\.off/.test(txt)).toBe(true);
    });
  });

  describe('E2E attributes', () => {
    it('renders data-disabled reflecting FormControl state', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('mat-slide-toggle');
      expect(el.getAttribute('data-disabled')).toBe('false');
      switchInstance.formControl.disable();
      fixture.detectChanges();
      expect(el.getAttribute('data-disabled')).toBe('true');
    });

    it('renders data-value as "true"/"false"', () => {
      switchInstance.formControl.setValue(true);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('mat-slide-toggle');
      expect(el.getAttribute('data-value')).toBe('true');
      switchInstance.formControl.setValue(false);
      fixture.detectChanges();
      expect(el.getAttribute('data-value')).toBe('false');
    });

    it('renders data-empty true for null, false for any boolean value', () => {
      switchInstance.formControl.setValue(null);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement.querySelector('mat-slide-toggle');
      expect(el.getAttribute('data-empty')).toBe('true');
      switchInstance.formControl.setValue(false);
      fixture.detectChanges();
      expect(el.getAttribute('data-empty')).toBe('false');
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

// ---------------------------------------------------------------------------
// viewed inline mode (tri-state) — disabled coerces to static
// ---------------------------------------------------------------------------
describe('SdSwitch (viewed inline mode)', () => {
  let fixture: ComponentFixture<SdSwitch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SdSwitch, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(SdSwitch);
  });

  it("viewed='inline' stays interactive: renders the mat-slide-toggle", () => {
    // asserts: inline keeps the toggle editable — the read-only text view is NOT used
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-slide-toggle')).not.toBeNull();
  });

  it('viewed=true renders the static text view (no mat-slide-toggle)', () => {
    // asserts: classic viewed=true path unchanged — read-only text only
    fixture.componentRef.setInput('viewed', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-slide-toggle')).toBeNull();
  });

  it("disabled + viewed='inline' falls back to static (no mat-slide-toggle)", () => {
    // asserts: a disabled control can't be edited, so inline degrades to the static view
    fixture.componentRef.setInput('viewed', 'inline');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-slide-toggle')).toBeNull();
  });
});
