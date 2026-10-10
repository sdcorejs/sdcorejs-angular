import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/**
 * Compact actions trigger of one row, card or tree node (internal): a `more_vert` icon button that asks the explorer to
 * open the item's command drawer, emitting itself so focus can come back to it when the drawer closes.
 *
 * While one of the item's commands is loading it shows a spinner instead of the icon and stays clickable, so the drawer
 * can still show which command is busy and run the others.
 */
@Component({
  selector: 'sd-file-explorer-menu-trigger',
  standalone: true,
  imports: [MatTooltip, SdIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer-menu-trigger',
    '[class.sd-file-explorer-menu-trigger--touch]': 'touch()',
  },
  template: `
    <!-- why: no tooltip on touch screens — MatTooltip would take over touch gestures (touch-action: none) and block
         scrolling the list from the button; the accessible name is there either way. The tooltip repeats the name, so
         Material does not add it as a description read twice. -->
    <button
      #button
      type="button"
      class="trigger"
      aria-haspopup="dialog"
      [attr.aria-expanded]="expanded()"
      [attr.aria-label]="accessibleName()"
      [attr.tabindex]="tabIndex()"
      [attr.data-autoid]="autoId() ?? null"
      [matTooltip]="accessibleName()"
      [matTooltipDisabled]="touch()"
      (click)="activate.emit(button)">
      @if (busy()) {
        <span class="spinner" aria-hidden="true"></span>
      } @else {
        <sd-icon name="more_vert" size="20px" />
      }
    </button>
  `,
  styleUrl: './menu-trigger.component.scss',
})
export class SdFileExplorerMenuTrigger {
  readonly #i18n = inject(I18nService);

  /** Accessible name and tooltip: "Actions for {name}" ("… (In progress)" while busy). */
  readonly label = input.required<string>();
  /** One of the item's commands is loading. */
  readonly busy = input(false);
  /** The item's command drawer is open. */
  readonly expanded = input(false);
  /** Touch screen: 48 px target, no tooltip. */
  readonly touch = input(false);
  /** `null` keeps the button in the tab order; the tree passes `-1` for every node but its tab stop. */
  readonly tabIndex = input<number | null>(null);
  readonly autoId = input<string | undefined>(undefined);
  /** Pressed: emits the native button, the element focus returns to. */
  readonly activate = output<HTMLButtonElement>();

  protected readonly accessibleName = computed(() =>
    this.busy() ? `${this.label()} (${this.#i18n.t('core.component.file-explorer.action-loading')})` : this.label()
  );
}
