import { booleanAttribute, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdSwitch } from '@sdcorejs/angular/forms/switch';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/**
 * Một dòng bật/tắt của inspector: nhãn ngắn bên trái (giải thích dài nằm trong tooltip của icon
 * info), `sd-switch` nhỏ bên phải — mọi công tắc trong panel thẳng một mép. Bố cục thuộc về
 * builder; `sd-switch` giữ nguyên hành vi mặc định của Core.
 */
@Component({
  selector: 'fb-toggle-row',
  template: `
    @let _hint = hint();
    <span class="toggle-row__text">
      <!-- why: the visible text is only a pointer target, like a <label>. Keyboard and screen-reader
           users operate the switch itself, which is focusable and carries the same text as its name. -->
      <span class="toggle-row__label" aria-hidden="true" (click)="toggle()">{{ label() }}</span>
      @if (_hint) {
        <!-- why: a real button so the explanation is reachable by keyboard (the tooltip opens on focus). -->
        <button
          type="button"
          class="toggle-row__hint"
          [attr.aria-label]="_hint"
          [matTooltip]="_hint"
          matTooltipPosition="above"
          matTooltipClass="sd-multiline-tooltip">
          <sd-icon name="info" size="16px"></sd-icon>
        </button>
      }
    </span>
    <sd-switch
      size="sm"
      class="toggle-row__switch"
      [label]="label()"
      [disabled]="disabled()"
      [model]="model()"
      (modelChange)="modelChange.emit(!!$event)"></sd-switch>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 28px;
    }

    .toggle-row__text {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      flex: 1 1 auto;
      min-width: 0;
    }

    .toggle-row__label {
      min-width: 0;
      color: var(--sd-text);
      font-size: var(--sd-font-size-14, 14px);
      font-weight: var(--sd-font-weight-medium, 500);
      line-height: var(--sd-line-height-20, 20px);
      cursor: pointer;
      user-select: none;
    }

    :host([data-disabled='true']) .toggle-row__label {
      color: var(--sd-text-secondary);
      cursor: default;
    }

    .toggle-row__hint {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 20px;
      height: 20px;
      padding: 0;
      border: 0;
      border-radius: var(--sd-radius-999, 999px);
      background: transparent;
      color: var(--sd-text-secondary);
      cursor: help;
    }

    .toggle-row__hint:hover {
      color: var(--sd-text);
    }

    .toggle-row__hint:focus-visible {
      outline: var(--sd-focus-ring-width, 2px) solid var(--sd-focus-ring-color);
      outline-offset: 1px;
    }

    .toggle-row__switch {
      flex: 0 0 auto;
    }

    /* why: the label inside sd-switch only names the switch (Material's aria-labelledby points to
       it); it is hidden visually because the row already shows the text on the left. */
    .toggle-row__switch ::ng-deep .mdc-label {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-disabled]': "disabled() ? 'true' : null" },
  imports: [MatTooltipModule, SdIcon, SdSwitch],
})
export class ToggleRowComponent {
  readonly label = input.required<string>();
  /** Giải thích thêm, hiện qua icon info + tooltip. Rỗng = không có icon. */
  readonly hint = input<string | undefined>(undefined);
  readonly model = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly modelChange = output<boolean>();

  toggle(): void {
    if (!this.disabled()) this.modelChange.emit(!this.model());
  }
}
