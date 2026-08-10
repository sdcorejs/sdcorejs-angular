import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdTimeRange } from './time-range.component';
import { SdTimeRangeValue } from './time-range-value';

@Component({
  standalone: true,
  imports: [SdTimeRange],
  template: `<sd-time-range
    [form]="form"
    name="period"
    label="Working period"
    [required]="required"
    [allowOpenEnded]="allowOpenEnded"
    [clearable]="clearable"
    [viewed]="viewed"
    min="08:00"
    max="18:00"
    [step]="15"
    [(model)]="value"></sd-time-range>`,
})
class TimeRangeHostComponent {
  readonly form = new FormGroup({});
  required = false;
  allowOpenEnded = false;
  clearable = true;
  viewed: boolean | 'inline' = false;
  value: SdTimeRangeValue | null | undefined = undefined;
}

describe('SdTimeRange', () => {
  let fixture: ComponentFixture<TimeRangeHostComponent>;
  let host: TimeRangeHostComponent;
  let component: SdTimeRange;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TimeRangeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeRangeHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(SdTimeRange)).componentInstance as SdTimeRange;
  });

  function typeEndpoint(index: 0 | 1, value: string): void {
    const inputs = fixture.nativeElement.querySelectorAll('sd-time input[matInput]') as NodeListOf<HTMLInputElement>;
    inputs[index].value = value;
    inputs[index].dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  it('registers the aggregate range control with the parent form', () => {
    expect(host.form.get('period')).toBe(component.formControl);
  });

  // why: RED trước fix — 2 endpoint `<sd-time>` nhận `[form]` nên tự đăng ký dưới tên
  // `from-<uuid>` / `to-<uuid>`; `form.value` có 3 key và 2 trong số đó đổi theo từng instance.
  it('registers ONLY the aggregate control — no generated endpoint keys in form.value', () => {
    expect(Object.keys(host.form.value)).toEqual(['period']);
    expect(Object.keys(host.form.controls)).toEqual(['period']);
  });

  it('still fails the parent form on invalid endpoint text after endpoints left the group', () => {
    typeEndpoint(0, '25:10');

    expect(host.form.invalid).toBeTrue();
    expect(component.formControl.hasError('endpoint')).toBeTrue();
  });

  it('writes canonical endpoint changes to one range model', () => {
    typeEndpoint(0, '8:15');
    typeEndpoint(1, '17:45');

    expect(host.value).toEqual({ from: '08:15', to: '17:45' });
  });

  it('keeps invalid endpoint text visible and makes the parent form invalid', () => {
    host.value = { from: '08:30', to: '17:30' };
    fixture.detectChanges();

    typeEndpoint(0, '25:10');

    const firstInput = fixture.nativeElement.querySelector('sd-time input[matInput]') as HTMLInputElement;
    expect(firstInput.value).toBe('25:10');
    expect(host.value).toEqual({ from: '08:30', to: '17:30' });
    expect(host.form.invalid).toBeTrue();
  });

  it('surfaces endpoint validation through the aggregate group state and message', () => {
    typeEndpoint(0, '25:10');

    const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
    const error = fixture.nativeElement.querySelector('.sd-time-range-error') as HTMLElement | null;
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('data-invalid')).toBe('true');
    expect(group.getAttribute('data-error-message')).toBeTruthy();
    expect(error?.textContent?.trim()).toBeTruthy();
  });

  it('clears invalid endpoint text even when no valid range model exists', () => {
    typeEndpoint(0, '25:10');

    component.clear();
    fixture.detectChanges();

    const firstInput = fixture.nativeElement.querySelector('sd-time input[matInput]') as HTMLInputElement;
    expect(firstInput.value).toBe('');
    expect(host.form.valid).toBeTrue();
  });

  it('rejects a start time after the end time', () => {
    typeEndpoint(0, '17:00');
    typeEndpoint(1, '09:00');

    expect(component.formControl.hasError('range')).toBeTrue();
  });

  it('allows one missing endpoint only when open-ended mode is enabled', () => {
    typeEndpoint(0, '09:00');
    expect(component.formControl.hasError('incomplete')).toBeTrue();

    host.allowOpenEnded = true;
    fixture.detectChanges();
    expect(component.formControl.valid).toBeTrue();
  });

  it('requires both endpoints when required is enabled', () => {
    host.required = true;
    host.allowOpenEnded = true;
    fixture.detectChanges();
    typeEndpoint(0, '09:00');

    expect(component.formControl.hasError('required')).toBeTrue();
  });

  it('clears both endpoints to explicit null values', () => {
    host.value = { from: '09:00', to: '17:00' };
    fixture.detectChanges();

    component.clear();
    fixture.detectChanges();

    expect(host.value).toEqual({ from: null, to: null });
  });

  it('allows programmatic clear even when the clear affordance is hidden', () => {
    host.clearable = false;
    host.value = { from: '09:00', to: '17:00' };
    fixture.detectChanges();

    component.clear();
    fixture.detectChanges();

    expect(host.value).toEqual({ from: null, to: null });
  });

  it('renders a labelled accessible group with two endpoint inputs', () => {
    const group = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
    const inputs = group.querySelectorAll('input[matInput]');

    expect(group.getAttribute('aria-label')).toBe('Working period');
    expect(inputs.length).toBe(2);
    expect(inputs[0].getAttribute('aria-label')).toBeTruthy();
    expect(inputs[1].getAttribute('aria-label')).toBeTruthy();
    expect(inputs[0].getAttribute('aria-label')).not.toBe(inputs[1].getAttribute('aria-label'));
  });

  it('passes inline viewed policy to both endpoint controls', () => {
    host.viewed = 'inline';
    fixture.detectChanges();

    const endpoints = fixture.nativeElement.querySelectorAll('sd-time') as NodeListOf<HTMLElement>;
    expect(endpoints.length).toBe(2);
    expect(endpoints[0].classList).toContain('sd-bare');
    expect(endpoints[1].classList).toContain('sd-bare');
  });
});

// ---------------------------------------------------------------------------
// Interaction-gated validation message.
// autoDetectChanges (KHÔNG detectChanges cưỡng bức) để tôn trọng OnPush.
// ---------------------------------------------------------------------------

describe('SdTimeRange (validation message is interaction-gated)', () => {
  let fixture: ComponentFixture<TimeRangeHostComponent>;
  let component: SdTimeRange;

  // `required` phải được set TRƯỚC lần CD đầu để đo đúng "first paint".
  async function mount(): Promise<void> {
    await TestBed.configureTestingModule({ imports: [TimeRangeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeRangeHostComponent);
    fixture.componentInstance.required = true;
    fixture.autoDetectChanges();
    await fixture.whenStable();
    component = fixture.debugElement.query(By.directive(SdTimeRange)).componentInstance as SdTimeRange;
  }

  const errorBlock = () => fixture.nativeElement.querySelector('.sd-time-range-error') as HTMLElement | null;

  // why: RED trước fix — template gate bằng `errorMessage()` thô, nên range `[required]` bung
  // khối lỗi ngay lần paint đầu, trước khi người dùng chạm vào bất cứ ô nào.
  it('hides the required error before the user has touched anything', async () => {
    await mount();

    expect(component.formControl.hasError('required')).toBeTrue();
    expect(component.visibleError()).toBeUndefined();
    expect(errorBlock()).toBeNull();
  });

  it('shows the required error once an endpoint is blurred', async () => {
    await mount();

    (fixture.nativeElement.querySelector('sd-time input[matInput]') as HTMLInputElement).dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(component.visibleError()).toBe('Vui lòng nhập cả giờ bắt đầu và kết thúc');
    expect(errorBlock()?.textContent?.trim()).toBeTruthy();
  });

  it('still shows endpoint errors typed into an endpoint (aggregate never goes dirty there)', async () => {
    await mount();

    const input = fixture.nativeElement.querySelector('sd-time input[matInput]') as HTMLInputElement;
    input.value = '25:10';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    expect(component.visibleError()).toBeTruthy();
    expect(errorBlock()?.textContent?.trim()).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Endpoint validity đi lên control tổng.
// Endpoint đã bị gỡ khỏi FormGroup của consumer, nên validator của control tổng là ĐƯỜNG DUY NHẤT
// để lỗi endpoint tới được form cha: nó phải CỘNG DỒN (không thay thế) và KHÔNG gate theo tương tác.
// autoDetectChanges (KHÔNG detectChanges cưỡng bức) để tôn trọng OnPush.
// ---------------------------------------------------------------------------

describe('SdTimeRange (endpoint validity is merged into the aggregate errors)', () => {
  let fixture: ComponentFixture<TimeRangeHostComponent>;
  let host: TimeRangeHostComponent;
  let component: SdTimeRange;

  async function mount(required = false): Promise<void> {
    await TestBed.configureTestingModule({ imports: [TimeRangeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeRangeHostComponent);
    host = fixture.componentInstance;
    host.required = required;
    fixture.autoDetectChanges();
    await fixture.whenStable();
    component = fixture.debugElement.query(By.directive(SdTimeRange)).componentInstance as SdTimeRange;
  }

  async function typeInto(index: 0 | 1, value: string): Promise<void> {
    const inputs = fixture.nativeElement.querySelectorAll('sd-time input[matInput]') as NodeListOf<HTMLInputElement>;
    inputs[index].value = value;
    inputs[index].dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
  }

  // why: RED trước fix — validator trả `{ endpoint: true }` THAY CHO kết quả của range validator,
  // nên `required` biến mất khỏi control tổng ngay khi một endpoint invalid. Consumer nào bắt theo
  // key `required` (hoặc `errorMessage` của chính component) hỏng trong im lặng.
  it('adds `endpoint` on top of `required` instead of replacing it', async () => {
    await mount(true);

    await typeInto(0, '25:10');

    expect(component.formControl.hasError('endpoint')).toBeTrue();
    expect(component.formControl.hasError('required')).toBeTrue();
  });

  // why: cùng một bug — lỗi `range` (từ > tới) bị nuốt mất khi một endpoint cũng invalid.
  it('adds `endpoint` on top of `range` instead of replacing it', async () => {
    await mount();

    await typeInto(0, '17:00');
    await typeInto(1, '09:00');
    expect(component.formControl.hasError('range')).toBeTrue();

    // Text sai ở endpoint không tới được model tổng, nên range 17:00 → 09:00 vẫn còn nguyên.
    await typeInto(1, '25:10');

    expect(component.formControl.hasError('endpoint')).toBeTrue();
    expect(component.formControl.hasError('range')).toBeTrue();
  });

  // why: RED trước fix — validator đọc `endpointInvalid()`, bản đã gate theo `touched || dirty`.
  // Endpoint bị làm invalid bằng write programmatic (chưa ai chạm vào) nên form cha vẫn VALID,
  // đúng thứ mà `sd-time-range.md` khẳng định là không thể xảy ra.
  it('fails the parent form for an endpoint invalidated without any user interaction', async () => {
    await mount();

    component.fromTime()!.formControl.setValue('25:10');
    await fixture.whenStable();

    expect(component.fromTime()!.formControl.invalid).toBeTrue();
    expect(component.fromTime()!.formControl.touched).toBeFalse();
    expect(component.fromTime()!.formControl.dirty).toBeFalse();
    expect(component.formControl.hasError('endpoint')).toBeTrue();
    expect(host.form.invalid).toBeTrue();
  });

  it('adds `endpoint` on top of `incomplete`, then drops only `endpoint` once the text parses', async () => {
    await mount();

    await typeInto(0, '17:00');
    expect(component.formControl.hasError('incomplete')).toBeTrue();

    await typeInto(1, '25:10');
    expect(component.formControl.hasError('endpoint')).toBeTrue();
    expect(component.formControl.hasError('incomplete')).toBeTrue();

    await typeInto(1, '09:00');

    expect(component.formControl.hasError('endpoint')).toBeFalse();
    expect(component.formControl.hasError('range')).toBeTrue();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// why: `aria-hidden="true"` trên phần tử focus được (hoặc trên phần tử BỌC nội dung focus được)
// tệ hơn là không làm gì: control vẫn nhận focus bằng Tab nhưng screen reader không đọc gì.
// Trước đây nó bị rắc khắp forms/** chỉ để dập 4 rule a11y đang bị tắt trong eslint.
// ---------------------------------------------------------------------------
const FOCUSABLE_SELECTOR =
  'input:not([tabindex="-1"]), textarea:not([tabindex="-1"]), select:not([tabindex="-1"]), ' +
  'button:not([tabindex="-1"]), a[href]:not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

/** Trả về tag của mọi phần tử aria-hidden mà bản thân nó hoặc con nó focus được. */
function ariaHiddenFocusables(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('[aria-hidden="true"]'))
    .filter(el => el.matches(FOCUSABLE_SELECTOR) || el.querySelector(FOCUSABLE_SELECTOR) !== null)
    .map(el => el.tagName.toLowerCase());
}

describe('SdTimeRange (accessibility)', () => {
  let fixture: ComponentFixture<TimeRangeHostComponent>;

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    await TestBed.configureTestingModule({ imports: [TimeRangeHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(TimeRangeHostComponent);
    fixture.detectChanges();
  });

  it('leaves no aria-hidden on any focusable element (the "→" separator is decorative only)', () => {
    expect(ariaHiddenFocusables(fixture.nativeElement)).toEqual([]);
    const separator = fixture.nativeElement.querySelector('.sd-time-range-separator') as HTMLElement;
    expect(separator.getAttribute('aria-hidden')).toBe('true');
    expect(separator.querySelector('input, button')).toBeNull();
  });
});
