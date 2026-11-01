import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdRadio } from '@sdcorejs/angular/forms/radio';
import { SdSegmentedComponent, type SdSegmentedItem } from '@sdcorejs/angular/forms/segmented';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { SdTable } from '../../table.component';
import { SdTableSheetHistory, sdTableSheetSwipe } from '../mobile-sheet/mobile-sheet';

/**
 * Sort sheet of the phone (handoff table-mobile 6): direction (Ascending | Descending) and one sortable column, hidden
 * columns included. Picking a column sorts at once and closes; changing the direction re-sorts while a column is
 * picked, otherwise it is kept for the next pick; "Clear sort" goes back to no sort.
 */
@Component({
  selector: 'sd-table-mobile-sort-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdModal, SdButton, SdRadio, SdSegmentedComponent, SdTranslatePipe],
  templateUrl: './mobile-sort-sheet.component.html',
  styleUrl: './mobile-sort-sheet.component.scss',
})
export class SdTableMobileSortSheetComponent<T = unknown> {
  readonly table = input.required<SdTable<T>>();
  readonly sheet = viewChild.required<SdModal>('sheet');
  protected readonly head = viewChild<ElementRef<HTMLElement>>('head');
  readonly #i18n = inject(I18nService);
  readonly #history = new SdTableSheetHistory(inject(DOCUMENT).defaultView);
  /** Direction for the next column pick while no column is sorted. */
  readonly #direction = signal<'asc' | 'desc'>('asc');

  readonly state = computed(() => this.table().sortState());
  readonly active = computed(() => (this.state().direction ? this.state().active : ''));
  readonly direction = computed<'asc' | 'desc'>(() => (this.active() ? (this.state().direction as 'asc' | 'desc') : this.#direction()));
  readonly columns = computed(() =>
    this.table()
      .mobileSortColumns()
      .map(column => ({ value: column.field, label: column.title }))
  );
  readonly directions = computed<SdSegmentedItem<'asc' | 'desc'>[]>(() => {
    const direction = this.direction();
    return (['asc', 'desc'] as const).map(value => ({
      value,
      label: this.#i18n.t(`core.component.table.mobile.sort-${value}`),
      prefixIcon: direction === value ? 'check' : undefined,
    }));
  });

  constructor() {
    effect(onCleanup => {
      const head = this.head()?.nativeElement;
      if (head) onCleanup(sdTableSheetSwipe(head, () => this.sheet().close()));
    });
    inject(DestroyRef).onDestroy(() => this.#history.dispose());
  }

  open(): void {
    this.sheet().open();
    this.#history.push(() => this.sheet().forceClose());
  }

  pickColumn(field: unknown): void {
    if (typeof field !== 'string' || !field) return;
    this.#sort(field, this.direction());
    this.sheet().close();
  }

  pickDirection(direction: unknown): void {
    if (direction !== 'asc' && direction !== 'desc') return;
    this.#direction.set(direction);
    const active = this.active();
    if (active) this.#sort(active, direction);
  }

  clear(): void {
    this.#sort('', '');
    this.sheet().close();
  }

  onClosed(): void {
    this.#history.release();
  }

  #sort(active: string, direction: SortDirection): void {
    const sort = this.table().sort();
    if (!sort) return;
    sort.active = active;
    sort.direction = direction;
    sort.sortChange.emit({ active, direction });
  }
}
