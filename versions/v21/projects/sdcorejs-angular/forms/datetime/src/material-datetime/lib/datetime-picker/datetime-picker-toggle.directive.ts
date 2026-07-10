import { Directive, HostListener, input } from '@angular/core';
import { SdDatetimePicker } from './datetime-picker.component';

@Directive({
  selector: 'button[sdDatetimePickerToggle]',
  standalone: true,
  host: {
    'type': 'button',
    '[disabled]': 'target().disabledEffective() || null',
    '[attr.aria-disabled]': 'target().disabledEffective()',
  },
})
export class SdDatetimePickerToggle<D> {
  public readonly target = input.required<SdDatetimePicker<D>>({ alias: 'sdDatetimePickerToggle' });

  @HostListener('click') public onClick(): void {
    const p = this.target();
    if (p.disabledEffective()) return;
    if (p.opened()) {
      p.close();
    } else {
      p.open();
    }
  }
}
