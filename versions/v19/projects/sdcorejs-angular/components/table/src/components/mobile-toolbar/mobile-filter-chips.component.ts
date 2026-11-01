import { ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ɵSdQueryChipLabels } from '@sdcorejs/angular/components/query-bar';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdTable } from '../../table.component';
import { sdTableMobileFilterActive, type SdTableMobileFilterItem } from '../../services/table-filter/table-mobile-filter.util';
import { SdTableMobileFieldSheetComponent } from '../filter/mobile-filter/mobile-field-sheet.component';
import { sdTableMobileFilterSummary } from '../filter/mobile-filter/mobile-filter-summary';

interface FieldChip {
  item: SdTableMobileFilterItem;
  field: string;
  /** `Name` when not filtering, `Name: summary` when filtering. */
  text: string;
  active: boolean;
}

/**
 * Filter chips under the table search on phones (handoff table-mobile 3): Filters (with the number of active filters),
 * Sort, a divider, then one chip per filter the table can summarise, in a fixed order. A field chip opens its own sheet;
 * the sort chip asks the table to open the sort sheet (`sortOpen`).
 */
@Component({
  selector: 'sd-table-mobile-filter-chips',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, SdIcon, SdTranslatePipe, SdTableMobileFieldSheetComponent],
  templateUrl: './mobile-filter-chips.component.html',
  styleUrl: './mobile-filter-chips.component.scss',
})
export class SdTableMobileFilterChipsComponent<T = unknown> {
  readonly table = input.required<SdTable<T>>();
  readonly fieldSheet = viewChild.required(SdTableMobileFieldSheetComponent);
  readonly sortOpen = output<void>();
  readonly labels = new ɵSdQueryChipLabels();
  readonly #i18n = inject(I18nService);
  readonly #summary = sdTableMobileFilterSummary();

  readonly #model = computed(() => this.table().mobileFilterModel());
  readonly #value = computed(() => this.table().mobileFilterValue() ?? {});
  readonly count = computed(() => {
    const value = this.#value();
    return (this.#model()?.items ?? []).filter(item => sdTableMobileFilterActive(item, value)).length;
  });
  readonly filterLabel = computed(() => this.#i18n.t('core.component.table.mobile.filter-open', { count: this.count() }));
  readonly chips = computed<FieldChip[]>(() => {
    const value = this.#value();
    return (this.#model()?.items ?? [])
      .filter(item => !!item.source)
      .map(item => {
        const summary = this.#summary(item, value, this.labels);
        return { item, field: item.source!.field, text: summary ? `${item.label}: ${summary}` : item.label, active: !!summary };
      });
  });

  /** Sort chip (3.2): only an icon while the table is not sorted, else the arrow and the column. */
  readonly sort = computed(() => {
    const table = this.table();
    if (!table.mobileSortAvailable()) return undefined;
    const state = table.sortState();
    const column = state.direction ? table.mobileSortColumns().find(entry => entry.field === state.active) : undefined;
    if (!column) return { active: false, title: '', icon: 'swap_vert', label: this.#i18n.t('core.component.table.mobile.sort') };
    const direction = this.#i18n.t(`core.component.table.mobile.sort-${state.direction}`);
    return {
      active: true,
      title: column.title,
      icon: state.direction === 'asc' ? 'arrow_upward' : 'arrow_downward',
      label: this.#i18n.t('core.component.table.mobile.sort-active', { column: column.title, direction }),
    };
  });

  openAll(): void {
    this.table().mobileFilter()?.open();
  }

  openField(chip: FieldChip): void {
    this.fieldSheet().open(chip.item);
  }
}
