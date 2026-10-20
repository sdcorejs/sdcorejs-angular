import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import type { SdFormGenericButton } from '../../models/form-generic-element.model';
import { sdButtonAppearance } from '../../rules/form-generic-button';

/**
 * Button của schema hiển thị bằng `sd-button`, dùng chung cho `sd-form-render` và canvas của builder. Chỉ trình
 * bày: phát `pressed`, việc chạy action thuộc về `sd-form-render`.
 */
@Component({
  selector: 'lib-button-element',
  template: `
    @let _look = appearance();
    <div
      class="sd-fg-button"
      [class.sd-fg-button--center]="_look.align === 'center'"
      [class.sd-fg-button--end]="_look.align === 'end'"
      [class.sd-fg-button--stretch]="_look.block">
      <sd-button
        htmlType="button"
        [type]="_look.type"
        [color]="_look.color"
        [prefixIcon]="_look.prefixIcon"
        [title]="button().label"
        [block]="_look.block"
        [disabled]="disabled()"
        [loading]="busy()"
        (click)="pressed.emit()"></sd-button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .sd-fg-button {
      display: flex;
    }
    .sd-fg-button--center {
      justify-content: center;
    }
    .sd-fg-button--end {
      justify-content: flex-end;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdButton],
})
export class LibButtonElementComponent {
  readonly button = input.required<SdFormGenericButton>();
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Đang chạy action của chính button này (submit chờ validate). */
  readonly busy = input(false, { transform: booleanAttribute });
  readonly pressed = output<void>();

  readonly appearance = computed(() => sdButtonAppearance(this.button()));
}
