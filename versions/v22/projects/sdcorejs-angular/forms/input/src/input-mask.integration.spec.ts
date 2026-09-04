import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SdInput } from './input.component';
import { SdInputMask, SdInputMaskAdapter, SdInputMaskResult } from './input-mask';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdInput],
  template: `<sd-input label="Phone" [mask]="mask" [disabled]="disabled" [(model)]="value"></sd-input>`,
})
class MaskHostComponent {
  mask: SdInputMask | null = 'VN_PHONE';
  disabled = false;
  value: string | null | undefined = undefined;
}

describe('SdInput mask integration', () => {
  let fixture: ComponentFixture<MaskHostComponent>;
  let host: MaskHostComponent;
  let component: SdInput;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MaskHostComponent, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(MaskHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    component = fixture.debugElement.query(By.directive(SdInput)).componentInstance as SdInput;
  });

  function nativeInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[matInput]') as HTMLInputElement;
  }

  function typeDisplay(value: string, caret = value.length): void {
    const input = nativeInput();
    input.value = value;
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  it('formats an external raw model into a separate display control', () => {
    host.value = '0901234567';
    fixture.detectChanges();

    expect(component.formControl.value).toBe('0901234567');
    expect(component.displayControl.value).toBe('0901 234 567');
    expect(nativeInput().value).toBe('0901 234 567');
  });

  it('writes only the parsed raw value back to the model', () => {
    typeDisplay('0901 234 567');

    expect(host.value).toBe('0901234567');
    expect(component.formControl.value).toBe('0901234567');
    expect(component.displayControl.value).toBe('0901 234 567');
  });

  it('distinguishes incomplete and invalid mask validation', () => {
    typeDisplay('0901');
    expect(component.formControl.hasError('maskIncomplete')).toBeTrue();

    typeDisplay('0901x');
    expect(component.formControl.hasError('maskInvalid')).toBeTrue();
  });

  it('retains invalid status when an invalid edit also changes the raw value', () => {
    typeDisplay('09x');

    expect(host.value).toBe('09');
    expect(component.formControl.hasError('maskInvalid')).toBeTrue();
  });

  it('restores the mapped caret after an edit in the middle', fakeAsync(() => {
    host.value = '0901234567';
    fixture.detectChanges();

    typeDisplay('09801 234 567', 3);
    flushMicrotasks();

    expect(host.value).toBe('0980123456');
    expect(nativeInput().value).toBe('0980 123 456');
    expect(nativeInput().selectionStart).toBe(3);
  }));

  it('defers parsing while an IME composition is active', () => {
    const input = nativeInput();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '0901';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, data: '1', isComposing: true }));
    fixture.detectChanges();

    expect(host.value).toBeUndefined();

    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '0901' }));
    fixture.detectChanges();
    expect(host.value).toBe('0901');
  });

  it('uses a custom adapter without changing the raw-model contract', () => {
    const result = (raw: string): SdInputMaskResult => ({
      raw,
      display: raw ? `[${raw}]` : '',
      status: raw ? 'valid' : 'empty',
      selectionStart: raw.length + (raw ? 2 : 0),
      selectionEnd: raw.length + (raw ? 2 : 0),
    });
    const custom: SdInputMaskAdapter = {
      inputMode: 'text',
      format: raw => result(raw ?? ''),
      parse: display => result(display.replaceAll('[', '').replaceAll(']', '')),
    };

    host.mask = custom;
    host.value = 'AB';
    fixture.detectChanges();

    expect(nativeInput().value).toBe('[AB]');
    expect(component.formControl.value).toBe('AB');
  });

  it('uses text plus a mobile-friendly inputmode while masking', () => {
    expect(nativeInput().type).toBe('text');
    expect(nativeInput().inputMode).toBe('tel');
  });

  it('disables the display control together with the registered raw control', () => {
    host.disabled = true;
    fixture.detectChanges();

    expect(component.formControl.disabled).toBeTrue();
    expect(component.displayControl.disabled).toBeTrue();
    expect(nativeInput().disabled).toBeTrue();
  });

  it('preserves the original input behavior when no mask is configured', () => {
    host.mask = null;
    fixture.detectChanges();

    typeDisplay('raw value');

    expect(host.value).toBe('raw value');
    expect(component.formControl.value).toBe('raw value');
  });
});
