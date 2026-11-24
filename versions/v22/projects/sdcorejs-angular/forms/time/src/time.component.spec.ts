import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdTime } from './time.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTime],
  template: `<sd-time
    [form]="form"
    [name]="name"
    [label]="label"
    [ariaLabel]="ariaLabel"
    [disabled]="disabled"
    [readonly]="readonly"
    [min]="min"
    [max]="max"
    [step]="step"
    [required]="required"
    [clearable]="clearable"
    [hideInlineError]="hideInlineError"
    [(model)]="value"></sd-time>`,
})
class TimeHostComponent {
  readonly form = new FormGroup({});
  label: string | undefined = 'Start time';
  ariaLabel: string | undefined;
  disabled = false;
  readonly = false;
  name = 'startTime';
  min: string | null = null;
  max: string | null = null;
  step = 1;
  required = false;
  clearable = false;
  hideInlineError = false;
  value: string | null | undefined = undefined;
}

describe('SdTime', () => {
  it('renders the picker icon using the outlined font by default', () => {
    const suffix = fixture.nativeElement.querySelector('.sd-suffix-icon');
    const icon = suffix?.matches('mat-icon') ? suffix : suffix?.querySelector('mat-icon');
    expect(icon).not.toBeNull();
    expect(icon?.classList.contains('material-icons-outlined')).toBeTrue();
  });

  let fixture: ComponentFixture<TimeHostComponent>;
  let host: TimeHostComponent;
  let component: SdTime;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(SdTime)).componentInstance as SdTime;
  });

  function typeValue(value: string): void {
    const input = fixture.nativeElement.querySelector('input[matInput]') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  // why: RED trước fix — `showClear` là computed đọc `formControl.value` (property thường, không
  // phát tín hiệu). Nó chốt `false` ở lần render đầu lúc ô còn rỗng và không bao giờ tính lại, nên
  // bật `[clearable]` xong nút × vẫn không xuất hiện dù ô đã có giá trị. Bug ngủ đông vì
  // `clearable` mặc định false; `<sd-time-range>` bật nó lên mới lộ ra.
  describe('clear button', () => {
    function clearButton(): HTMLButtonElement | null {
      return fixture.nativeElement.querySelector('.sd-clear-btn');
    }

    it('stays hidden while clearable is off', () => {
      typeValue('09:30');

      expect(component.formControl.value).toBe('09:30');
      expect(clearButton()).toBeNull();
    });

    it('appears once a value is typed into a clearable field', () => {
      host.clearable = true;
      fixture.detectChanges();
      expect(clearButton()).toBeNull();

      typeValue('09:30');

      expect(component.showClear()).toBeTrue();
      expect(clearButton()).not.toBeNull();
    });

    it('disappears again after the value is cleared', () => {
      host.clearable = true;
      fixture.detectChanges();
      typeValue('09:30');

      clearButton()!.click();
      fixture.detectChanges();

      expect(host.value).toBeNull();
      expect(component.showClear()).toBeFalse();
      expect(clearButton()).toBeNull();
    });

    it('appears for a value written programmatically through the model', () => {
      host.clearable = true;
      host.value = '09:30';
      fixture.detectChanges();
      fixture.detectChanges();

      expect(component.formControl.value).toBe('09:30');
      expect(component.showClear()).toBeTrue();
      expect(clearButton()).not.toBeNull();
    });

    it('stays hidden on a required field even when it has a value', () => {
      host.clearable = true;
      host.required = true;
      fixture.detectChanges();
      typeValue('09:30');

      expect(clearButton()).toBeNull();
    });
  });

  // why: bản cũ dùng `mat-icon-button` cho nút mở picker — hộp 40px + touch target 48px, trong khi
  // mọi suffix khác của pack là 20px. Đồng hồ bị đẩy vào trong, vùng bấm phình to hơn hẳn sd-date.
  it('sizes the picker trigger like every other suffix affordance', () => {
    const trigger = fixture.nativeElement.querySelector('[data-time-picker-trigger]') as HTMLButtonElement;

    expect(trigger.classList).toContain('sd-suffix-icon');
    expect(trigger.classList).toContain('sd-suffix-btn');
    expect(trigger.classList).not.toContain('mat-mdc-icon-button');
    expect(trigger.querySelector('.mat-mdc-button-touch-target')).toBeNull();
  });

  it('registers with the parent form and removes only its owned control on destroy', () => {
    expect(host.form.get('startTime')).toBe(component.formControl);

    fixture.destroy();

    expect(host.form.contains('startTime')).toBeFalse();
  });

  it('rebinds registration when the name changes', () => {
    host.name = 'endTime';
    fixture.detectChanges();

    expect(host.form.contains('startTime')).toBeFalse();
    expect(host.form.get('endTime')).toBe(component.formControl);
  });

  it('normalizes a valid typed value and writes a canonical time-only model', () => {
    typeValue('9:05');

    expect(host.value).toBe('09:05');
    expect(component.formControl.value).toBe('09:05');
  });

  it('preserves invalid typed text without overwriting the last valid model', () => {
    host.value = '08:30';
    fixture.detectChanges();

    typeValue('25:10');

    expect(component.formControl.value).toBe('25:10');
    expect(host.value).toBe('08:30');
    expect(component.formControl.hasError('time')).toBeTrue();
  });

  it('validates inclusive min/max and minute step boundaries', () => {
    host.min = '08:30';
    host.max = '17:30';
    host.step = 15;
    fixture.detectChanges();

    typeValue('08:40');
    expect(component.formControl.hasError('step')).toBeTrue();

    typeValue('08:15');
    expect(component.formControl.hasError('min')).toBeTrue();

    typeValue('17:45');
    expect(component.formControl.hasError('max')).toBeTrue();

    typeValue('17:30');
    expect(component.formControl.valid).toBeTrue();
  });

  it('applies a Date-based picker draft without leaking Date into the model', () => {
    component.onPickerValue(new Date(2030, 5, 10, 14, 45, 30));
    component.applyPicker();
    fixture.detectChanges();

    expect(host.value).toBe('14:45');
    expect(typeof host.value).toBe('string');
  });

  it('clears to null and emits the explicit clear model', () => {
    host.value = '08:30';
    fixture.detectChanges();

    component.clear();
    fixture.detectChanges();

    expect(host.value).toBeNull();
    expect(component.formControl.value).toBeNull();
  });

  it('exposes accessible numeric input and picker controls', () => {
    const input = fixture.nativeElement.querySelector('input[matInput]') as HTMLInputElement;
    const pickerButton = fixture.nativeElement.querySelector('button[data-time-picker-trigger]') as HTMLButtonElement;

    expect(input.inputMode).toBe('numeric');
    expect(input.getAttribute('aria-label')).toBe('Start time');
    expect(pickerButton.getAttribute('aria-label')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Interaction-gated validation message.
// autoDetectChanges (KHÔNG detectChanges cưỡng bức) để tôn trọng OnPush.
// ---------------------------------------------------------------------------

describe('SdTime (validation message is interaction-gated)', () => {
  let fixture: ComponentFixture<TimeHostComponent>;
  let component: SdTime;

  // `required` + `hideInlineError` phải được set TRƯỚC lần CD đầu để đo đúng "first paint".
  async function mount(): Promise<void> {
    await TestBed.configureTestingModule({ imports: [TimeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeHostComponent);
    fixture.componentInstance.required = true;
    fixture.componentInstance.hideInlineError = true;
    fixture.autoDetectChanges();
    await fixture.whenStable();
    component = fixture.debugElement.query(By.directive(SdTime)).componentInstance as SdTime;
  }

  const errorIcon = () => fixture.nativeElement.querySelector('.sd-error-icon');

  // why: RED trước fix — template gate bằng `errorMessage()` thô, nên field `[required]` bung
  // icon lỗi ngay lần paint đầu, trước khi người dùng chạm vào bất cứ thứ gì.
  it('hides the required error before the user has touched the field', async () => {
    await mount();

    expect(component.formControl.hasError('required')).toBeTrue();
    expect(component.connectorState().validationError).toBeUndefined();
    expect(errorIcon()).toBeNull();
  });

  it('shows the required error once the field is blurred', async () => {
    await mount();

    (fixture.nativeElement.querySelector('input[matInput]') as HTMLInputElement).dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(component.connectorState().validationError).toBe('Vui lòng nhập giờ');
    expect(errorIcon()).not.toBeNull();
  });
});

describe('DP-07 SdTime picker', () => {
  let fixture: ComponentFixture<TimeHostComponent>;
  let trigger: HTMLButtonElement;
  let field: HTMLInputElement;

  const panel = () => document.querySelector<HTMLElement>('.sd-time-panel[role="dialog"]');
  const hour = () => panel()!.querySelector<HTMLInputElement>('[role="spinbutton"]')!;
  const key = (target: Element, value: string, altKey = false) => {
    const event = new KeyboardEvent('keydown', { key: value, altKey, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  async function open(): Promise<void> {
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(panel()).not.toBeNull();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeHostComponent);
    fixture.componentInstance.value = '09:30';
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('button[data-time-picker-trigger]');
    field = fixture.nativeElement.querySelector('input[matInput]');
  });

  it('opens a dialog from Alt+Down with the field label and focuses the hour without stepping', async () => {
    field.focus();
    expect(key(field, 'ArrowDown', true).defaultPrevented).toBeTrue();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(panel()!.id);
    const labelId = panel()!.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelId)?.textContent?.trim()).toBe('Start time');
    expect(document.activeElement).toBe(hour());
    expect(hour().closest('[aria-hidden="true"]')).toBeNull();
    expect(fixture.componentInstance.value).toBe('09:30');
  });

  it('names a dialog from the explicit accessible field name when the visible label is omitted', async () => {
    fixture.componentInstance.label = undefined;
    fixture.componentInstance.ariaLabel = 'Collection time';
    fixture.detectChanges();
    await open();

    const labelId = panel()!.getAttribute('aria-labelledby')!;
    expect(document.getElementById(labelId)?.textContent?.trim()).toBe('Collection time');
  });

  for (const edge of ['top', 'bottom'] as const) {
    it(`opens 6px ${edge === 'top' ? 'below' : 'above'} the clock near the ${edge} of the viewport`, async () => {
      Object.assign(trigger.style, { position: 'fixed', left: '50%', [edge]: '8px' });
      await open();
      const origin = trigger.getBoundingClientRect();
      const popup = panel()!.closest('.cdk-overlay-pane')!.getBoundingClientRect();

      expect(Math.round(edge === 'top' ? popup.top - origin.bottom : origin.top - popup.bottom)).toBe(6);
    });
  }

  for (const action of ['Escape', 'outside', 'Cancel', 'Confirm']) {
    it(`closes on ${action}, returns focus to the clock and ${action === 'Confirm' ? 'commits' : 'discards'} the draft`, async () => {
      await open();
      key(hour(), 'ArrowUp');
      expect(hour().value).toBe('10');
      expect(fixture.componentInstance.value).toBe('09:30');

      if (action === 'Escape') {
        key(hour(), 'Escape');
      } else if (action === 'outside') {
        document.body.click();
      } else {
        const selector = action === 'Confirm' ? 'sd-button[type="fill"] button' : 'sd-button[type="text"] button';
        panel()!.querySelector<HTMLButtonElement>(selector)!.click();
      }
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.hasAttribute('aria-controls')).toBeFalse();
      expect(fixture.componentInstance.value).toBe(action === 'Confirm' ? '10:30' : '09:30');
      await open();
      expect(hour().value).toBe(action === 'Confirm' ? '10' : '09');
    });
  }

  for (const mode of ['disabled', 'readonly'] as const) {
    it(`discards an open draft when the field becomes ${mode} and ignores attempts to reopen it`, async () => {
      await open();
      key(hour(), 'ArrowUp');
      fixture.componentInstance[mode] = true;
      fixture.detectChanges();
      expect(panel()).toBeNull();
      expect(trigger.disabled).toBeTrue();
      trigger.click();
      key(field, 'ArrowDown', true);
      expect(panel()).toBeNull();
      expect(fixture.componentInstance.value).toBe('09:30');
      fixture.componentInstance[mode] = false;
      fixture.detectChanges();
      await open();
      expect(hour().value).toBe('09');
    });
  }

  it('detaches its dialog when the field is destroyed', async () => {
    await open();
    fixture.destroy();
    expect(panel()).toBeNull();
  });

  it('keeps unmodified arrows available for stepping the field', () => {
    fixture.componentInstance.step = 15;
    fixture.detectChanges();
    key(field, 'ArrowDown');
    expect(fixture.componentInstance.value).toBe('09:15');
    key(field, 'ArrowUp');
    expect(fixture.componentInstance.value).toBe('09:30');
    expect(panel()).toBeNull();
  });
});
