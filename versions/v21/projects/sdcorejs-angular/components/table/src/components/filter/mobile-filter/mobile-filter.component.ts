import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { ɵSdQueryChipLabels } from '@sdcorejs/angular/components/query-bar';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { Operator } from '@sdcorejs/utils/models';
import { SdTableFilterDefDirective } from '../../../directives/sd-table-filter-def.directive';
import { SdTableColumn } from '../../../models/table-column.model';
import {
  sdTableMobileFilterActive,
  sdTableMobileFilterClear,
  type SdTableMobileFilterItem,
} from '../../../services/table-filter/table-mobile-filter.util';
import type { SdTableQueryContext } from '../../../services/table-filter/table-query-bar.util';
import {
  SdTableExternalFilter,
  SdTableOptionFilter,
  TableFilterRegister,
  TableFilterValue,
} from '../../../services/table-filter/table-filter.model';
import { SdTableSheetHistory, sdTableSheetSwipe } from '../../mobile-sheet/mobile-sheet';
import { SdTableMobileFilterFieldComponent } from './mobile-filter-field.component';
import { sdTableMobileFilterSummary } from './mobile-filter-summary';

const clone = <V>(value: V): V => (value ? JSON.parse(JSON.stringify(value)) : value);

/**
 * Filter sheet of the phone (handoff table-mobile 5): one `sd-modal` bottom sheet with two levels — the list of
 * filters with their summary, and the page of one filter. Works on a copy of the filter register: Done keeps the page's
 * edits in the copy, Apply writes every filter and reads once, Cancel / close / a swipe down / the scrim drop the copy.
 * Order: external filters → `sdTableFilterDef` templates → columns.
 */
@Component({
  selector: 'mobile-filter',
  templateUrl: './mobile-filter.component.html',
  styleUrl: './mobile-filter.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, SdModal, SdButton, SdIcon, SdTranslatePipe, SdTableMobileFilterFieldComponent],
})
export class MobileFilterComponent {
  // ==========================================
  // 1. SIGNAL INPUTS
  // ==========================================
  autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  filter = input<SdTableOptionFilter | undefined>(undefined);
  externalFilters = input<SdTableExternalFilter[] | null | undefined>([]);
  columns = input<SdTableColumn[] | null | undefined>([]);
  filterDefs = input<readonly SdTableFilterDefDirective[] | null | undefined>([]);
  filterRegister = input<TableFilterRegister | undefined>(undefined);
  cacheValues = input<Record<string, any[]> | undefined>(undefined);
  /** Filters and the query model (`SdTable.mobileFilterModel`). */
  model = input<{ ctx: SdTableQueryContext; items: SdTableMobileFilterItem[] } | undefined>(undefined);

  // ==========================================
  // 2. VIEW QUERY
  // ==========================================
  readonly sheet = viewChild.required<SdModal>('sheet');
  protected readonly head = viewChild<ElementRef<HTMLElement>>('head');
  protected readonly body = viewChild<ElementRef<HTMLElement>>('body');

  // ==========================================
  // 3. STATE — local working copies; chỉ flush khi Apply.
  // ==========================================
  workingColumnFilter = signal<Record<string, any>>({});
  workingColumnOperator = signal<Record<string, Operator>>({});
  workingExternalFilter = signal<Record<string, any>>({});
  /** Filter whose page is open; `undefined` on the list. */
  readonly page = signal<SdTableMobileFilterItem | undefined>(undefined);
  /** Bumped when the copy changes in place, so summaries and counts follow. */
  readonly revision = signal(0);
  readonly labels = new ɵSdQueryChipLabels();
  readonly #summary = sdTableMobileFilterSummary();
  readonly #i18n = inject(I18nService);
  readonly #injector = inject(Injector);
  readonly #history = new SdTableSheetHistory(inject(DOCUMENT).defaultView);

  // ==========================================
  // 4. COMPUTED
  // ==========================================
  autoId = computed(() => {
    const base = this.autoIdInput();
    return base ? `${base}-mobile-filter-` : '';
  });

  externalFilterItems = computed(() => this.externalFilters() || []);
  columnItems = computed(() => this.columns() || []);
  filterDefItems = computed(() => this.filterDefs() || []);

  /** The copy as one record; its parts are the working signals' objects, edited in place by the field pages. */
  readonly working = computed<TableFilterValue>(() => ({
    columnFilter: this.workingColumnFilter(),
    columnOperator: this.workingColumnOperator(),
    externalFilter: this.workingExternalFilter(),
  }));
  readonly rows = computed(() => {
    this.revision();
    const value = this.working();
    const all = this.#i18n.t('core.component.query-bar.all');
    return (this.model()?.items ?? []).map(item => {
      const summary = item.source ? this.#summary(item, value, this.labels) : '';
      return { item, summary: summary || (item.source ? all : ''), active: !!summary, field: item.key.slice(item.key.indexOf(':') + 1) };
    });
  });
  readonly activeCount = computed(() => {
    this.revision();
    const value = this.working();
    return (this.model()?.items ?? []).filter(item => sdTableMobileFilterActive(item, value)).length;
  });

  constructor() {
    effect(onCleanup => {
      const head = this.head()?.nativeElement;
      if (head) onCleanup(sdTableSheetSwipe(head, () => this.close()));
    });
    // Escape on a page goes back to the list (listener here: the body is not focusable itself).
    effect(onCleanup => {
      const body = this.body()?.nativeElement;
      if (!body) return;
      const listener = (event: KeyboardEvent) => this.onKeydown(event);
      body.addEventListener('keydown', listener);
      onCleanup(() => body.removeEventListener('keydown', listener));
    });
    inject(DestroyRef).onDestroy(() => this.#history.dispose());
  }

  // ==========================================
  // 5. PUBLIC API
  // ==========================================
  open = () => {
    const reg = this.filterRegister();
    const val = reg?.value.get();
    const cloned = (o: any) => (o ? clone(o) : {});
    this.workingColumnFilter.set(cloned(val?.columnFilter));
    this.workingColumnOperator.set(cloned(val?.columnOperator));
    this.workingExternalFilter.set(cloned(val?.externalFilter));
    this.page.set(undefined);
    this.revision.update(value => value + 1);
    this.sheet().open();
    // why: Back closes the sheet (drops the copy) instead of leaving the page.
    this.#history.push(() => this.sheet().forceClose());
  };

  close = () => this.sheet().close();

  // ==========================================
  // 6. HANDLERS
  // ==========================================
  /** Opens the page of a filter; Back returns to the list. */
  enter(item: SdTableMobileFilterItem): void {
    this.page.set(item);
    this.#history.push(() => this.#leave(item));
    this.#focus('.sd-mobile-sheet-title');
  }

  /** Done / ← / Escape on a page: back to the list, the edits stay in the copy. */
  back(): void {
    const item = this.page();
    if (!item) return;
    this.#history.release(1);
    this.#leave(item);
  }

  onApply = () => {
    this.filterRegister()?.value.set(this.working());
    this.sheet().close();
  };

  onCancel = () => {
    // Local working state — không ghi gì khi cancel, chỉ đóng sheet.
    this.sheet().close();
  };

  /** "Clear all": empties every filter of the copy; Apply still writes it. */
  clearAll(): void {
    const ctx = this.model()?.ctx;
    if (!ctx) return;
    let value = this.working();
    for (const item of this.model()?.items ?? []) value = sdTableMobileFilterClear(item, value, ctx);
    this.workingColumnFilter.set(value.columnFilter ?? {});
    this.workingColumnOperator.set(value.columnOperator ?? {});
    this.workingExternalFilter.set(value.externalFilter ?? {});
    this.revision.update(revision => revision + 1);
  }

  /** "Clear" on a page: that filter only. */
  clearPage(): void {
    const item = this.page();
    const ctx = this.model()?.ctx;
    if (!item || !ctx) return;
    const value = sdTableMobileFilterClear(item, this.working(), ctx);
    this.workingColumnFilter.set(value.columnFilter ?? {});
    this.workingColumnOperator.set(value.columnOperator ?? {});
    this.workingExternalFilter.set(value.externalFilter ?? {});
    this.revision.update(revision => revision + 1);
  }

  onChanged(): void {
    this.revision.update(value => value + 1);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.page()) return;
    // why: Escape on a page goes back to the list; the sheet must not see it and close.
    event.stopPropagation();
    event.preventDefault();
    this.back();
  }

  /** Every close path ends here: drop the history entries the sheet pushed. */
  onClosed(): void {
    this.#history.release();
    this.page.set(undefined);
  }

  #leave(item: SdTableMobileFilterItem): void {
    this.page.set(undefined);
    this.#focus(`[data-filter-key="${CSS.escape(item.key)}"]`);
  }

  #focus(selector: string): void {
    afterNextRender(
      () => {
        // why: the page title sits in the sheet header, the rows in its body; both are under the modal root.
        const root = this.head()?.nativeElement.closest('.sd-modal-root') ?? this.body()?.nativeElement;
        root?.querySelector<HTMLElement>(selector)?.focus();
      },
      { injector: this.#injector }
    );
  }
}
