import { ElementRef, inject, ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { SD_BUTTON_ENTRY } from './action-popover';

@Component({
  selector: 'sd-button-item-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: { style: 'display: none' },
  providers: [{ provide: SD_BUTTON_ENTRY, useExisting: forwardRef(() => SdButtonItemDivider) }],
})
export class SdButtonItemDivider {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly kind = 'divider';
  /** Optional group heading for flattened action groups. */
  readonly title = input<string | undefined | null>();
}
