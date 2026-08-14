import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdTime } from './time.component';

@Component({
  standalone: true,
  imports: [SdTime],
  template: `<sd-time
    [form]="form"
    [name]="name"
    [label]="'Start time'"
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

// ---------------------------------------------------------------------------
// Accessibility — panel chọn giờ
// why: div bọc bên trong mat-menu chỉ tồn tại để chặn click nổi bọt (không cho menu đóng).
// Trước đây nó bị lint kêu vì có (click) mà không focus được; cách sửa SAI là gắn aria-hidden
// (sẽ ẩn luôn spinner giờ/phút và 2 nút). role="presentation" mới là tín hiệu đúng: chỉ vô
// hiệu hoá chính div, KHÔNG lan xuống con.
// ---------------------------------------------------------------------------
describe('SdTime (picker panel accessibility)', () => {
  let fixture: ComponentFixture<TimeHostComponent>;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [TimeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeHostComponent);
    fixture.detectChanges();
  });

  it('marks the menu content presentational without hiding the controls inside it', () => {
    const trigger = fixture.nativeElement.querySelector('button[data-time-picker-trigger]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const panel = document.querySelector('.sd-time-picker-menu') as HTMLElement;
    expect(panel).not.toBeNull();
    const wrapper = panel.querySelector('div[role="presentation"]') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
    // Spinner + nút Hủy/Xác nhận vẫn nằm trong accessibility tree.
    expect(wrapper.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(wrapper.closest('[aria-hidden="true"]')).toBeNull();

    trigger.click();
    fixture.detectChanges();
  });
});
