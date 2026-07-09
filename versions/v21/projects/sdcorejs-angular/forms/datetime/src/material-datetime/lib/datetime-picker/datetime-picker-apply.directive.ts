import { Directive, HostListener, inject } from '@angular/core';
import { SdDatetimePicker } from './datetime-picker.component';

@Directive({
  selector: 'button[sdDatetimePickerApply]',
  standalone: true,
  host: { 'type': 'button' },
})
export class SdDatetimePickerApply {
  private readonly picker = inject<SdDatetimePicker<unknown>>(SdDatetimePicker);
  @HostListener('click') public onClick(): void { this.picker.apply(); }
}
