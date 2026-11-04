import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SdBadge, type SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdFormatDatePipe } from '@sdcorejs/angular/pipes';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdTableCellDefDirective } from '../../directives/sd-table-cell-def.directive';
import type { SdTableColumnAnyRow } from '../../models/table-column.model';
import type { SdTableItem } from '../../models/table-item.model';
import { resolveFieldValue } from '../../services/field-value.util';
import type { SdTableMobileTextSlot, SdTableMobileView } from '../../services/mobile/mobile-view.util';
import { DesktopCellComponent } from '../desktop-cell/desktop-cell.component';

interface DataCell {
  column: SdTableColumnAnyRow;
  label: string;
  highlight: boolean;
  /** The value goes through `desktop-cell` (cell template, or the formatted value); otherwise `text`. */
  cell: boolean;
  text: string;
}

/**
 * Body of a phone card built from `mobile.template.data` or `autoTemplate` (handoff table-mobile 9.4): title and
 * badge, a one-line subtitle, then a two-column grid of fields with the column title as label. Grid values take the
 * desktop cell path; the title and subtitle are plain text.
 */
@Component({
  selector: 'sd-table-mobile-card-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, SdBadge, SdIcon, SdTranslatePipe, DesktopCellComponent],
  templateUrl: './mobile-card-data.component.html',
  styleUrl: './mobile-card-data.component.scss',
})
export class SdTableMobileCardDataComponent {
  readonly view = input.required<SdTableMobileView>();
  readonly row = input.required<SdTableItem>();
  /** Title when the view has none: the row label. */
  readonly label = input('');
  readonly cellDef = input<Record<string, SdTableCellDefDirective>>({});
  readonly autoId = input<string>();
  readonly expanded = signal(false);
  readonly #document = inject(DOCUMENT);
  readonly #formatDate = inject(SdFormatDatePipe);

  readonly title = computed(() => this.#text(this.view().title) || this.label());
  readonly subtitle = computed(() => this.#text(this.view().subtitle));
  readonly badge = computed<{ kind: 'badge'; data: SdBadgeData; title: string } | { kind: 'text'; text: string } | undefined>(() => {
    const slot = this.view().badge;
    if (!slot) return undefined;
    if ('data' in slot) return { kind: 'badge', data: slot.data, title: String(slot.data.title ?? '') };
    const display = this.row().meta.display[slot.column.field];
    if (slot.badge && display) {
      // As on the desktop cell: no badge for an empty value, and the column tooltip before the useBadge one.
      if (!display.badge || !display.data) return undefined;
      const data = { ...display.badge, tooltip: display.tooltip || display.badge.tooltip } as SdBadgeData;
      return { kind: 'badge', data, title: this.#plain(display.data, !!display.isHtml) };
    }
    const text = this.#text({ column: slot.column });
    return text ? { kind: 'text', text } : undefined;
  });
  readonly cells = computed<DataCell[]>(() => {
    const view = this.view();
    const row = this.row();
    const defs = this.cellDef();
    return view.fields.map((column, index) => ({
      column,
      label: typeof column.title === 'string' ? column.title : column.title.title,
      highlight: view.highlight && index === 0,
      cell: !!row.meta.display[column.field] || !!defs[column.field] || !!column.cell?.templateRef,
      text: this.#text({ column }),
    }));
  });
  readonly hiddenCount = computed(() => Math.max(0, this.cells().length - this.view().maxFields));
  readonly shownCells = computed(() => (this.expanded() ? this.cells() : this.cells().slice(0, this.view().maxFields)));

  #text(slot: SdTableMobileTextSlot | undefined): string {
    if (!slot) return '';
    if ('text' in slot) return slot.text;
    const display = this.row().meta.display[slot.column.field];
    // why: `hidden` columns are not formatted by the table; show the raw value instead of nothing.
    if (!display) return this.#raw(resolveFieldValue(this.row().data, slot.column.field));
    return this.#plain(display.data, !!display.isHtml);
  }

  #plain(data: unknown, html: boolean): string {
    if (!html) return this.#raw(data);
    const template = this.#document.createElement('template');
    template.innerHTML = String(data ?? '');
    return (template.content.textContent ?? '').trim();
  }

  #raw(value: unknown): string {
    return (Array.isArray(value) ? value : [value])
      .map(entry => (entry instanceof Date ? this.#formatDate.transform(entry) : entry))
      .filter(entry => entry !== null && entry !== undefined && entry !== '' && typeof entry !== 'object')
      .map(entry => String(entry))
      .join(', ');
  }
}
