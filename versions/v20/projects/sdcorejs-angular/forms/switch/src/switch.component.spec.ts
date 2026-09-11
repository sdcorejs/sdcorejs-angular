import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS } from '@angular/material/slide-toggle';
import { SdSwitch } from './switch.component';

@Component({
  standalone: true,
  imports: [SdSwitch, FormsModule, ReactiveFormsModule],
  template: `<sd-switch
    [label]="label"
    [color]="color"
    [disabled]="disabled"
    [required]="required"
    [hideInlineError]="hideInlineError"
    [viewed]="viewed"
    [(model)]="model"
    (sdChange)="onSdChange($event)"></sd-switch>`,
})
class HostComponent {
  label?: string;
  color: any = 'primary';
  disabled: boolean | '' | null | undefined = false;
  required: boolean | '' | null | undefined = false;
  hideInlineError: boolean | '' | null | undefined = false;
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
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    switchInstance = fixture.debugElement.query(el => el.componentInstance instanceof SdSwitch)?.componentInstance as SdSwitch;
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

    // why: Angular Material exposes both mat and mdc switch token tiers. Keep selected
    // track/icon tied to the accent color while the handle stays on surface for M3 contrast.
    it('maps selected switch tokens to accent track/icon and surface handle', () => {
      const root = document.documentElement;
      const prevPrimary = root.style.getPropertyValue('--sd-primary');
      const prevSurface = root.style.getPropertyValue('--sd-surface');
      root.style.setProperty('--sd-primary', 'rgb(0, 92, 187)');
      root.style.setProperty('--sd-surface', 'rgb(255, 255, 255)');
      try {
        host.color = 'primary';
        fixture.detectChanges();
        const inner = fixture.nativeElement.querySelector('.mat-mdc-slide-toggle') as HTMLElement;
        expect(inner).not.toBeNull();
        const cs = getComputedStyle(inner);
        expect(cs.getPropertyValue('--mat-slide-toggle-selected-track-color').trim()).toBe('rgb(0, 92, 187)');
        expect(cs.getPropertyValue('--mdc-switch-selected-track-color').trim()).toBe('rgb(0, 92, 187)');
        expect(cs.getPropertyValue('--mat-slide-toggle-selected-icon-color').trim()).toBe('rgb(0, 92, 187)');
        expect(cs.getPropertyValue('--mdc-switch-selected-icon-color').trim()).toBe('rgb(0, 92, 187)');
        expect(cs.getPropertyValue('--mat-slide-toggle-selected-handle-color').trim()).toBe('rgb(255, 255, 255)');
        expect(cs.getPropertyValue('--mdc-switch-selected-handle-color').trim()).toBe('rgb(255, 255, 255)');
      } finally {
        if (prevPrimary) root.style.setProperty('--sd-primary', prevPrimary);
        else root.style.removeProperty('--sd-primary');
        if (prevSurface) root.style.setProperty('--sd-surface', prevSurface);
        else root.style.removeProperty('--sd-surface');
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

  // why: RED trước fix — `hideInlineError` là input CHẾT và `sd-switch.md` mô tả một message
  // required hiển thị dưới hàng, nhưng switch.component.html không có bất kỳ markup lỗi nào.
  // Hệ quả: switch `required` để OFF chặn submit mà người dùng không thấy lý do.
  describe('required error message (inline)', () => {
    it('renders nothing before the user interacts, even though the control is already invalid', async () => {
      host.required = true;
      host.model = null;
      fixture.autoDetectChanges();
      await fixture.whenStable();

      expect(switchInstance.formControl.hasError('required')).toBe(true);
      expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    });

    it('renders the required message after the control is touched (no forced CD)', async () => {
      host.required = true;
      host.model = null;
      fixture.autoDetectChanges();
      await fixture.whenStable();

      switchInstance.formControl.markAsTouched();
      await fixture.whenStable();

      const error = fixture.nativeElement.querySelector('mat-error') as HTMLElement | null;
      expect(error).not.toBeNull();
      expect(error!.textContent?.trim()).toBe('Vui lòng nhập thông tin');
    });

    it('clears the message once the switch becomes valid', async () => {
      host.required = true;
      host.model = null;
      fixture.autoDetectChanges();
      await fixture.whenStable();
      switchInstance.formControl.markAsTouched();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('mat-error')).not.toBeNull();

      switchInstance.formControl.setValue(true);
      await fixture.whenStable();

      expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    });

    it('hideInlineError suppresses the message (the input is no longer dead)', async () => {
      host.required = true;
      host.model = null;
      host.hideInlineError = true;
      fixture.autoDetectChanges();
      await fixture.whenStable();
      switchInstance.formControl.markAsTouched();
      await fixture.whenStable();

      expect(switchInstance.formControl.hasError('required')).toBe(true);
      expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
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
      const txt = fixture.nativeElement.textContent as string;
      // i18n keys core.form.switch.on/off; default locale fallback could be the raw key — accept either.
      expect(/Bật|On|オン|开|켜짐|core\.form\.switch\.on/.test(txt)).toBe(true);
    });

    it('viewed=true with model=false shows off text', () => {
      host.viewed = true;
      host.model = false;
      fixture.detectChanges();
      const txt = fixture.nativeElement.textContent as string;
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

describe('SdSwitch sizes', () => {
  let fixture: ComponentFixture<SdSwitch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SdSwitch, NoopAnimationsModule],
      providers: [{ provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS, useValue: {} }],
    }).compileComponents();
    fixture = TestBed.createComponent(SdSwitch);
    fixture.componentRef.setInput('label', 'Notifications');
  });

  it('keeps the default medium track at 52 × 32px', () => {
    fixture.detectChanges();
    const track = fixture.nativeElement.querySelector('.mdc-switch__track') as HTMLElement;
    expect(track.getBoundingClientRect().width).toBe(52);
    expect(track.getBoundingClientRect().height).toBe(32);
    expect(fixture.nativeElement.getAttribute('data-size')).toBe('md');
  });

  for (const [size, width, height, handleSize] of [
    ['sm', 36, 20, 16],
    ['md', 52, 32, 24],
    ['lg', 60, 36, 28],
  ] as const) {
    it(`renders ${size} with centered handles in both states and preserves toggling/disabled behavior`, () => {
      fixture.componentRef.setInput('size', size);
      fixture.detectChanges();
      const change = spyOn(fixture.componentInstance.sdChange, 'emit').and.callThrough();
      const button = fixture.nativeElement.querySelector('button[role="switch"]') as HTMLButtonElement;
      const track = fixture.nativeElement.querySelector('.mdc-switch__track') as HTMLElement;
      const handle = fixture.nativeElement.querySelector('.mdc-switch__handle') as HTMLElement;
      for (const checked of [false, true]) {
        fixture.componentRef.setInput('model', checked);
        fixture.detectChanges();
        const t = track.getBoundingClientRect();
        const h = handle.getBoundingClientRect();
        expect(t.width).toBe(width);
        expect(t.height).toBe(height);
        expect(h.width).toBe(handleSize);
        expect(h.height).toBe(handleSize);
        expect(h.top + h.height / 2).toBeCloseTo(t.top + t.height / 2, 0);
        expect(h.left).toBeGreaterThanOrEqual(t.left);
        expect(h.right).toBeLessThanOrEqual(t.right);
        expect(button.getAttribute('aria-checked')).toBe(String(checked));
      }
      change.calls.reset();
      button.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.model()).toBeFalse();
      expect(change).toHaveBeenCalledOnceWith(false);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      button.click();
      expect(change).toHaveBeenCalledTimes(1);
      expect(track.getBoundingClientRect().width).toBe(width);
    });
  }

  it('updates size dynamically without emitting a value change', () => {
    fixture.detectChanges();
    const change = spyOn(fixture.componentInstance.sdChange, 'emit');
    for (const [size, width] of [
      ['sm', 36],
      ['lg', 60],
      ['md', 52],
    ] as const) {
      fixture.componentRef.setInput('size', size);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.mdc-switch__track').getBoundingClientRect().width).toBe(width);
    }
    expect(change).not.toHaveBeenCalled();
  });

  it('keeps the small handle inside its track with hidden icons and RTL direction', async () => {
    TestBed.inject(MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS).hideIcon = true;
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();
    fixture.nativeElement.setAttribute('dir', 'rtl');
    for (const checked of [false, true]) {
      fixture.componentRef.setInput('model', checked);
      fixture.detectChanges();
      const track = fixture.nativeElement.querySelector('.mdc-switch__track').getBoundingClientRect();
      const handleElement = fixture.nativeElement.querySelector('.mdc-switch__handle') as HTMLElement;
      // why: Material vẫn transition kích thước núm gạt khi tắt icon dù dùng NoopAnimationsModule.
      await Promise.all(handleElement.getAnimations().map(animation => animation.finished));
      const handle = handleElement.getBoundingClientRect();
      expect(handle.width).toBe(checked ? 16 : 12);
      expect(handle.left).toBeGreaterThanOrEqual(track.left);
      expect(handle.right).toBeLessThanOrEqual(track.right);
    }
  });
});
