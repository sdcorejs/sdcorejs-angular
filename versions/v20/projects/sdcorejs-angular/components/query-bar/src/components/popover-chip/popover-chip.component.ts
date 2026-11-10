import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NgTemplateOutlet } from '@angular/common';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { Filter, Operator } from '@sdcorejs/utils/models';

import { SdQueryField, sdQueryFieldIcon } from '../../query-bar.model';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { ɵSdQueryPanelDirective, ɵSdQueryPanelTriggerDirective } from '../panel/query-panel';

/**
 * Compact popover-mode chip face. Click, Enter or Space → opens the parent-supplied [panel] (the chip popover dialog).
 * Inert div[role=button] so the nested <sd-operator> doesn't end up as a button-in-button (invalid HTML).
 * The × is a `<button>` beside that trigger, never inside it.
 */
@Component({
  selector: 'sd-query-popover-chip',
  templateUrl: './popover-chip.component.html',
  styleUrl: './popover-chip.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, MatTooltipModule, SdOperator, NgTemplateOutlet, ɵSdQueryPanelTriggerDirective],
})
export class SdQueryPopoverChip {
  /** Resolved field (from the bar's `fieldByKey()` map). `undefined` → render raw key. */
  readonly field = input<SdQueryField | undefined>(undefined);

  /** The chip's filter — used to read `field` / `operator` / `data` for display text. */
  readonly filter = input.required<Filter>();

  /** "Active" = chip has a real value or is no-data op. Drives layout + colour. */
  readonly active = input.required<boolean>();

  /** Operator visible on the chip face (else hidden, ":" separator). */
  readonly showOperator = input(false);

  /** Rendered value text for the value slot. */
  readonly valueText = input<string>('');

  /** Muted text shown after the label while the chip has no value ("All" on a pinned chip). */
  readonly emptyText = input<string>('');

  /** Pinned chip — no remove button. */
  readonly pinned = input(false);

  /** Read-only chip — does not open its popover. */
  readonly disabled = input(false);

  /** Chip of a required field — `aria-required`. */
  readonly required = input(false);

  /** Required chip without a value — error look, `aria-invalid`. */
  readonly invalid = input(false);

  /** Id set as `aria-describedby` (the host's required hint). */
  readonly describedBy = input<string | undefined>(undefined);

  /** Chip popover panel supplied by the parent. */
  readonly panel = input.required<ɵSdQueryPanelDirective>();

  /** Fired when the chip popover opens, before it renders (parent seeds its editing state). */
  readonly open = output<void>();
  /** Fired when the user clicks the × removal icon. */
  readonly remove = output<void>();

  readonly iconFor = sdQueryFieldIcon;

  readonly #i18n = inject(I18nService);
  /** `aria-label` of the × — names the field, in the current language. */
  readonly removeLabel = computed(() =>
    this.#i18n.t('core.component.query-bar.remove-filter', { label: this.field()?.label || this.filterField() })
  );

  filterField(): string {
    return (this.filter() as any).field as string;
  }
  filterOperator(): Operator {
    return (this.filter() as any).operator as Operator;
  }

  // why: parent's add flow auto-opens the chip popover after render, and removeFilter closes the open one — expose
  // open/close so the parent doesn't need a ViewChild on the internal panel trigger.
  private readonly trigger = viewChild('chipTrigger', { read: ɵSdQueryPanelTriggerDirective });

  /** The chip popover is open for this chip. */
  isOpen(): boolean {
    return !!this.trigger()?.expanded();
  }

  /**
   * Opens the chip popover. With `returnFocusTo`, that element (e.g. the host control that asked
   * for the chip) gets focus back when the popover closes, instead of the chip.
   */
  openMenu(returnFocusTo?: HTMLElement): void {
    this.trigger()?.openMenu(returnFocusTo);
  }
  closeMenu(): void {
    this.trigger()?.closeMenu();
  }
}
