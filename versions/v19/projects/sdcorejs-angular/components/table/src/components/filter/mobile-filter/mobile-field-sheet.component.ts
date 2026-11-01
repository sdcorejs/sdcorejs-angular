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
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { ɵSdQueryChipLabels } from '@sdcorejs/angular/components/query-bar';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { SdTable } from '../../../table.component';
import { sdTableMobileFilterClear, type SdTableMobileFilterItem } from '../../../services/table-filter/table-mobile-filter.util';
import type { TableFilterValue } from '../../../services/table-filter/table-filter.model';
import { SdTableSheetHistory, sdTableSheetSwipe } from '../../mobile-sheet/mobile-sheet';
import { SdTableMobileFilterFieldComponent } from './mobile-filter-field.component';

const clone = <V>(value: V): V => (value ? JSON.parse(JSON.stringify(value)) : value);

/**
 * Sheet of one filter, opened from its chip (handoff table-mobile 4). Works on a copy: Apply writes that filter and
 * reads once; Cancel, the scrim, a swipe down, Escape and Back drop the copy.
 */
@Component({
  selector: 'sd-table-mobile-field-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdModal, SdButton, SdTranslatePipe, SdTableMobileFilterFieldComponent],
  templateUrl: './mobile-field-sheet.component.html',
  styleUrl: './mobile-field-sheet.component.scss',
})
export class SdTableMobileFieldSheetComponent<T = unknown> {
  readonly table = input.required<SdTable<T>>();
  readonly labels = input<ɵSdQueryChipLabels>(new ɵSdQueryChipLabels());
  readonly sheet = viewChild.required<SdModal>('sheet');
  protected readonly head = viewChild<ElementRef<HTMLElement>>('head');
  readonly item = signal<SdTableMobileFilterItem | undefined>(undefined);
  readonly working = signal<TableFilterValue | undefined>(undefined);
  readonly revision = signal(0);
  readonly #history = new SdTableSheetHistory(inject(DOCUMENT).defaultView);
  readonly ctx = computed(() => this.table().mobileFilterModel()?.ctx);
  readonly autoId = computed(() => {
    const base = this.table().autoId();
    const field = this.item()?.source?.field;
    return base && field ? `${base}-mobile-filter-${field}` : undefined;
  });
  constructor() {
    effect(onCleanup => {
      const head = this.head()?.nativeElement;
      if (head) onCleanup(sdTableSheetSwipe(head, () => this.cancel()));
    });
    inject(DestroyRef).onDestroy(() => this.#history.dispose());
  }

  open(item: SdTableMobileFilterItem): void {
    const register = this.table().filterRegister;
    if (!register || !item.source) return;
    this.item.set(item);
    this.working.set(clone(register.value.get()));
    this.revision.update(value => value + 1);
    this.sheet().open();
    // why: Back closes the sheet (drops the copy) instead of leaving the page.
    this.#history.push(() => this.sheet().forceClose());
  }

  cancel(): void {
    this.sheet().close();
  }

  /** "Clear": empties this filter in the copy; Apply still writes it. */
  clear(): void {
    const item = this.item();
    const working = this.working();
    const ctx = this.ctx();
    if (!item || !working || !ctx) return;
    this.working.set(sdTableMobileFilterClear(item, working, ctx));
    this.revision.update(value => value + 1);
  }

  apply(): void {
    const register = this.table().filterRegister;
    const source = this.item()?.source;
    const working = this.working();
    if (!register || !source || !working) return;
    const current = register.value.get();
    const next: TableFilterValue = {
      columnFilter: { ...current.columnFilter },
      columnOperator: { ...current.columnOperator },
      externalFilter: { ...current.externalFilter },
    };
    if (source.source === 'external') next.externalFilter![source.field] = working.externalFilter?.[source.field];
    else {
      next.columnFilter![source.field] = working.columnFilter?.[source.field];
      const operator = working.columnOperator?.[source.field];
      if (operator) next.columnOperator![source.field] = operator;
      else delete next.columnOperator![source.field];
    }
    this.sheet().close();
    register.value.set(next);
  }

  /** Every close path ends here: drop the history entry the sheet pushed and the copy. */
  onClosed(): void {
    this.#history.release();
    this.item.set(undefined);
    this.working.set(undefined);
  }

  onChanged(): void {
    this.revision.update(value => value + 1);
  }
}
