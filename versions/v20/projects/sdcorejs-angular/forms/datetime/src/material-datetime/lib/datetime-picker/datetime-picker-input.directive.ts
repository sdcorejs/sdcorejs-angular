import {
  Directive, ElementRef, HostListener, OnDestroy, OnInit, forwardRef,
  inject, input,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SdDateAdapter } from '../core/date-adapter';
import { SD_DATE_FORMATS, SdDateFormats } from '../core/date-formats';
import { SdDatetimePicker } from './datetime-picker.component';

@Directive({
  selector: 'input[sdDatetimePicker]',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SdDatetimePickerInput), multi: true },
  ],
  host: {
    '[attr.aria-haspopup]': '"dialog"',
    '[disabled]': 'isDisabled || null',
  },
})
export class SdDatetimePickerInput<D = Date> implements ControlValueAccessor, OnInit, OnDestroy {
  private readonly adapter = inject<SdDateAdapter<D>>(SdDateAdapter as never);
  private readonly formats = inject<SdDateFormats>(SD_DATE_FORMATS);
  private readonly elementRef = inject<ElementRef<HTMLInputElement>>(ElementRef);

  public readonly picker = input.required<SdDatetimePicker<D>>({ alias: 'sdDatetimePicker' });

  public isDisabled = false;

  private onChange: (v: D | null) => void = () => {};
  private onTouched: () => void = () => {};
  private subs = new Subscription();

  public ngOnInit(): void {
    const p = this.picker();
    p.setAnchor(this.elementRef.nativeElement);
    p.setInputDisabledState(this.isDisabled);
    this.subs.add(p.applied.subscribe((value: D) => {
      this.onChange(value);
      this.writeValue(value);
    }));
    this.subs.add(p.cleared.subscribe(() => {
      this.onChange(null);
      this.writeValue(null);
    }));
  }

  public ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ControlValueAccessor
  public writeValue(value: D | null): void {
    const el = this.elementRef.nativeElement;
    el.value = value == null
      ? ''
      : this.adapter.format(value, this.formats.display.datetimeInput);
    // Sync picker's internal selected state — guard for early calls before ngOnInit
    try {
      if (value != null) {
        this.picker().select(value);
      }
    } catch {
      // picker signal not yet available (before view init); ignore
    }
  }

  public registerOnChange(fn: (v: D | null) => void): void { this.onChange = fn; }
  public registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  public setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    try {
      this.picker().setInputDisabledState(isDisabled);
    } catch {
      // picker signal not yet available (before view init); ngOnInit will sync it.
    }
  }

  @HostListener('blur') public onBlur(): void { this.onTouched(); }
  @HostListener('input', ['$event.target.value']) public onInput(raw: string): void {
    const parsed = this.adapter.parse(raw, this.formats.parse.datetimeInput) as D | null;
    this.onChange(parsed);
  }
}
