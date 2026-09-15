import {
  ElementRef,
  inject,
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  forwardRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { SdIconSet } from '@sdcorejs/angular/modules/icon';
import type { SdButtonColor } from './button.component';
import { SD_BUTTON_ENTRY } from './action-popover';

/** Declarative action definition. Its label is instantiated only inside the owning button's overlay. */
@Component({
  selector: 'sd-button-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-template><ng-content /></ng-template>',
  host: { style: 'display: none' },
  providers: [{ provide: SD_BUTTON_ENTRY, useExisting: forwardRef(() => SdButtonItem) }],
})
export class SdButtonItem {
  readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly kind = 'item';
  readonly color = input<SdButtonColor | undefined | null>();
  readonly prefixIcon = input<string | undefined | null>();
  readonly suffixIcon = input<string | undefined | null>();
  readonly fontSet = input<SdIconSet | undefined, SdIconSet | undefined | null>(undefined, { transform: value => value ?? undefined });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly tooltip = input<string | undefined | null>();
  readonly autoId = input<string | undefined | null>();
  readonly click = output<Event>();
  readonly template = viewChild.required(TemplateRef<unknown>);
}
