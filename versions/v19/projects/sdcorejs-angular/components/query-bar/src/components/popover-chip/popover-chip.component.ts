/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SdOperator } from '@sdcorejs/angular/components/operator';
import { Filter, Operator } from '@sdcorejs/utils/models';

import { SdQueryField, sdQueryFieldIcon } from '../../query-bar.model';

/**
 * Compact popover-mode chip face. Click → opens the parent-supplied [menu] (mat-menu
 * containing the chip editor). Inert div[role=button] so the nested <sd-operator>
 * doesn't end up as a button-in-button (invalid HTML).
 */
@Component({
  selector: 'sd-query-popover-chip',
  templateUrl: './popover-chip.component.html',
  styleUrl: './popover-chip.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, MatIconModule, MatTooltipModule, SdOperator],
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

  /** Chip popover mat-menu instance supplied by the parent. */
  readonly menu = input.required<MatMenu>();

  /** Fired when the chip popover opens (parent seeds its editing state). */
  readonly open = output<void>();
  /** Fired when the user clicks the × removal icon. */
  readonly remove = output<void>();

  readonly iconFor = sdQueryFieldIcon;

  filterField(): string { return (this.filter() as any).field as string; }
  filterOperator(): Operator { return (this.filter() as any).operator as Operator; }

  // why: parent's add/swap flow auto-opens the chip popover after render, and removeFilter
  // closes the open one — expose open/close so the parent doesn't need a ViewChild on the
  // internal MatMenuTrigger directive.
  private readonly trigger = viewChild('chipTrigger', { read: MatMenuTrigger });
  openMenu(): void { this.trigger()?.openMenu(); }
  closeMenu(): void { this.trigger()?.closeMenu(); }
}
