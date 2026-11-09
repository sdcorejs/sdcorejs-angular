import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, isSignal, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { isObservable } from 'rxjs';

import { SdButton } from '@sdcorejs/angular/components/button';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { Filter, Operator } from '@sdcorejs/utils/models';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

import {
  SD_QUERY_MULTI_OPERATORS,
  SD_QUERY_NO_DATA_OPERATORS,
  SdQueryField,
  sdQueryAllowedOperators,
  sdQueryFieldIcon,
  sdQueryShowOperatorSelector,
} from '../../query-bar.model';
import { ɵsdQueryFilterActive } from '../../query-bar-filter';
import { ɵSdQueryPanelCloseReason, ɵSdQueryPanelDirective } from '../panel/query-panel';

let nextLabelId = 0;

interface Range {
  from?: string | number | null;
  to?: string | number | null;
}

/**
 * Popover-mode chip editor — the dialog panel that opens when a popover-mode chip is clicked (handoff section 4).
 * Owns ALL operator+value staging signals and async option loading.
 *
 * why: tách khỏi `<sd-query-bar>` để parent chỉ giữ `editingIndex` (chip nào đang
 * mở) + nhận `(commit)` khi popover đóng. Mỗi lần parent gọi `seed(filter, field)`
 * trước khi mở chip popover, child reset staging signals + kích option loading.
 *
 * Public surface (template ref `#cp`):
 *   - `cp.panel()` — the panel to feed `[panel]` of `<sd-query-popover-chip>`
 *   - `cp.seed(filter, field, index)` — parent reseeds staging before the panel renders
 *   - `(commit)` output — emitted when the panel closes (Esc, click outside, Tab out, close) with the staged Filter
 */
@Component({
  selector: 'sd-query-chip-popover',
  templateUrl: './chip-popover.component.html',
  styleUrl: './chip-popover.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ɵSdQueryPanelDirective,
    SdIcon,
    CommonModule,
    FormsModule,
    SdButton,
    SdOperator,
    SdSelect,
    SdInput,
    SdInputNumber,
    SdDate,
    SdDatetime,
  ],
})
export class SdQueryChipPopover {
  readonly #i18n = inject(I18nService);
  readonly fromPlaceholder = computed(() => this.#i18n.t('core.component.query-bar.placeholder.from-number'));
  readonly toPlaceholder = computed(() => this.#i18n.t('core.component.query-bar.placeholder.to-number'));
  readonly booleanTrueLabel = computed(() => this.#i18n.t('core.component.query-bar.boolean.true'));
  readonly booleanFalseLabel = computed(() => this.#i18n.t('core.component.query-bar.boolean.false'));
  readonly selectValuePlaceholder = computed(() => this.#i18n.t('core.component.query-bar.placeholder.select-value'));
  readonly enterValuePlaceholder = computed(() => this.#i18n.t('core.component.query-bar.placeholder.enter-value'));
  readonly loadingValuesLabel = computed(() => this.#i18n.t('core.component.query-bar.loading-values'));
  readonly minOneLabel = computed(() => this.#i18n.t('core.component.query-bar.required-min-one'));

  // ---------------------------------------------------------------------------
  // Inputs
  // ---------------------------------------------------------------------------

  /** Resolved field of the currently editing chip — parent passes from `fieldByKey()`. */
  readonly field = input<SdQueryField | undefined>(undefined);

  /** The chip's current Filter — used by `seed()` for initial staging values. */
  readonly filter = input<Filter | undefined>(undefined);

  /** Optional chip index — embedded in the composed autoIds. */
  readonly chipIndex = input<number | null>(null);

  /** Prefix for `data-autoId` on inner controls. */
  readonly autoIdBase = input<string | undefined>('qb');

  // ---------------------------------------------------------------------------
  // Outputs
  // ---------------------------------------------------------------------------

  /** Emitted when the panel closes — parent splices `next` into filters[idx]. */
  readonly commit = output<Filter>();

  // ---------------------------------------------------------------------------
  // Staging signals — uncommitted edits, committed when the panel closes.
  // ---------------------------------------------------------------------------

  /** Staged operator. */
  readonly editingOperator = signal<Operator>('EQUAL');
  /** Staged value (shape depends on field type + operator). */
  readonly editingValue = signal<unknown>(null);
  /** Resolved option list for values / lazy-values. */
  readonly editingOptions = signal<any[]>([]);
  /** Loading flag for async option fetch. */
  readonly editingOptionsLoading = signal(false);

  // why: `seed()` chạy trước khi panel vẽ nội dung, còn `[field]` / `[filter]` / `[chipIndex]` của cha chỉ cập nhật ở lượt
  // change detection sau — giữ bản seed để lần vẽ đầu (và focus đầu tiên) đã đúng field.
  readonly #seededField = signal<SdQueryField | undefined>(undefined);
  readonly #seededFilter = signal<Filter | undefined>(undefined);
  readonly #seededIndex = signal<number | null>(null);

  /** Field being edited: the one seeded last, else the `[field]` input. */
  readonly currentField = computed(() => this.#seededField() ?? this.field());

  /** The field is required: no empty selection, no clear button (handoff B3). */
  readonly required = computed(() => !!this.currentField()?.required);
  /** "Choose at least one value." after a required multi-value chip was refused an empty selection. */
  readonly minOneHint = signal(false);
  readonly hintId = `sd-query-chip-popover-hint-${nextLabelId}`;

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  readonly allowedOperators = computed<Operator[]>(() => {
    const f = this.currentField();
    return f ? sdQueryAllowedOperators(f) : [];
  });

  readonly showOperatorSelector = computed<boolean>(() => {
    const f = this.currentField();
    return f ? sdQueryShowOperatorSelector(f) : false;
  });

  /** Whether the staged operator is multi-select (IN/NOT_IN). */
  multiple(op?: Operator): boolean {
    return SD_QUERY_MULTI_OPERATORS.includes(op ?? this.editingOperator());
  }

  /** Whether the staged operator carries no data (NULL/NOT_NULL). */
  isNoDataOperator(op: Operator | string): boolean {
    return SD_QUERY_NO_DATA_OPERATORS.includes(op as Operator);
  }

  /** Compose an autoId for an inner control (`<base>-chip<idx>-<role>`). */
  chipAutoId(role: string): string {
    const base = this.autoIdBase() ?? 'qb';
    const idx = this.#seededIndex() ?? this.chipIndex();
    return `${base}-chip${idx ?? 'x'}-${role}`;
  }

  readonly iconFor = sdQueryFieldIcon;

  // ---------------------------------------------------------------------------
  // Panel — the chip trigger binds `[panel]="cp.panel()"`
  // ---------------------------------------------------------------------------

  readonly panel = viewChild.required<ɵSdQueryPanelDirective>('panel');

  /** Id of the field label in the header — the dialog's accessible name. */
  readonly labelId = `sd-query-chip-popover-label-${nextLabelId++}`;

  // ---------------------------------------------------------------------------
  // Seed — parent calls before opening the popover so staging signals are
  // primed from the current filter + the option list is loaded.
  // ---------------------------------------------------------------------------

  /** Reseed staging from a new filter/field pair — call before the panel renders (`panelOpened`). */
  seed(filter: Filter | undefined, field: SdQueryField | undefined, index: number | null = null): void {
    this.#seededField.set(filter && field ? field : undefined);
    this.#seededFilter.set(filter && field ? filter : undefined);
    this.#seededIndex.set(filter && field ? index : null);
    this.minOneHint.set(false);
    if (!filter || !field) {
      this.editingOperator.set('EQUAL');
      this.editingValue.set(null);
      this.editingOptions.set([]);
      this.editingOptionsLoading.set(false);
      return;
    }
    this.editingOperator.set((filter as any).operator as Operator);
    this.editingValue.set((filter as any).data ?? null);

    if (field.type === 'values') {
      this.#loadValuesOptions(field);
    } else if (field.type === 'lazy-values') {
      this.#loadLazyOptions(field);
    } else {
      this.editingOptions.set([]);
      this.editingOptionsLoading.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Operator + value mutators
  // ---------------------------------------------------------------------------

  /** Called on operator change in the popover header — reshapes value when family changes. */
  onEditingOperatorChange(next: Operator): void {
    const prev = this.editingOperator();
    this.editingOperator.set(next);

    if (SD_QUERY_NO_DATA_OPERATORS.includes(next)) {
      this.editingValue.set(null);
      return;
    }
    if (next === 'BETWEEN') {
      const v = this.editingValue();
      if (v && typeof v === 'object' && 'from' in (v as any)) return;
      this.editingValue.set({ from: null, to: null } as Range);
      return;
    }
    const goingToMulti = SD_QUERY_MULTI_OPERATORS.includes(next);
    const wasMulti = SD_QUERY_MULTI_OPERATORS.includes(prev as Operator);
    if (goingToMulti && !wasMulti) {
      const v = this.editingValue();
      this.editingValue.set(v == null ? [] : [v]);
    } else if (!goingToMulti && wasMulti) {
      const v = this.editingValue();
      this.editingValue.set(Array.isArray(v) && v.length > 0 ? v[0] : null);
    }
  }

  /** Value control change. A required multi-value chip keeps its values when the change would empty it (B3). */
  onEditingValueInput(value: unknown): void {
    if (this.required() && Array.isArray(value) && value.length === 0) {
      // why: bản sao mới (không phải cùng mảng) để sd-select nhận lại model và bỏ phần bỏ chọn nó đang hiện.
      const previous = this.editingValue();
      this.editingValue.set(Array.isArray(previous) ? [...previous] : previous);
      this.minOneHint.set(true);
      return;
    }
    this.minOneHint.set(false);
    this.editingValue.set(value);
  }

  /** BETWEEN range — mutate only `.from`. */
  onEditingRangeFrom(value: string | number | null): void {
    const v = (this.editingValue() as Range) ?? {};
    this.editingValue.set({ ...v, from: value });
  }

  /** BETWEEN range — mutate only `.to`. */
  onEditingRangeTo(value: string | number | null): void {
    const v = (this.editingValue() as Range) ?? {};
    this.editingValue.set({ ...v, to: value });
  }

  /** Toggle a value in the staged multi-select array. */
  toggleEditingMultiValue(value: unknown): void {
    const arr = Array.isArray(this.editingValue()) ? [...(this.editingValue() as unknown[])] : [];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
    this.editingValue.set(arr);
  }

  isEditingMultiSelected(value: unknown): boolean {
    const v = this.editingValue();
    return Array.isArray(v) && v.includes(value);
  }

  // ---------------------------------------------------------------------------
  // Panel lifecycle — close = commit
  // ---------------------------------------------------------------------------

  /**
   * The panel closed (Esc, click outside, Tab out, `closeMenu()`, another panel opened): compose the next Filter from
   * staging signals and emit (commit). Parent splices into its filters[] and nulls editingIndex.
   */
  onMenuClosed(_reason?: ɵSdQueryPanelCloseReason): void {
    const f = this.#seededFilter() ?? this.filter();
    const field = this.#seededField() ?? this.field();
    this.#seededField.set(undefined);
    this.#seededFilter.set(undefined);
    this.#seededIndex.set(null);
    this.minOneHint.set(false);
    if (!f) return;
    let next: Filter = {
      field: (f as any).field,
      operator: this.editingOperator(),
      data: this.editingValue(),
    } as Filter;
    // B3: a required chip that had a value and was emptied gets that value (and operator) back.
    if (field?.required && ɵsdQueryFilterActive(f) && !ɵsdQueryFilterActive(next)) {
      next = { field: (f as any).field, operator: (f as any).operator, data: (f as any).data } as Filter;
    }
    this.commit.emit(next);
  }

  // ---------------------------------------------------------------------------
  // Async option loaders — same logic as the parent's private methods.
  // ---------------------------------------------------------------------------

  #loadValuesOptions(field: SdQueryField): void {
    const opt = (field as any).option;
    const items = opt?.items;
    if (Array.isArray(items)) {
      this.editingOptions.set(items);
      this.editingOptionsLoading.set(false);
      return;
    }
    if (isSignal(items)) {
      this.editingOptions.set((items as any)());
      this.editingOptionsLoading.set(false);
      return;
    }
    if (typeof items === 'function') {
      this.editingOptionsLoading.set(true);
      Promise.resolve(items())
        .then((arr: any[]) => this.editingOptions.set(arr ?? []))
        .finally(() => this.editingOptionsLoading.set(false));
    }
  }

  #loadLazyOptions(field: SdQueryField, search = ''): void {
    const opt = (field as any).option;
    if (!opt?.search) return;
    this.editingOptionsLoading.set(true);
    const result = opt.search({ type: 'SEARCH', searchText: search });
    if (isObservable(result)) {
      (result as any).subscribe({
        next: (arr: any[]) => this.editingOptions.set(arr ?? []),
        complete: () => this.editingOptionsLoading.set(false),
        error: () => this.editingOptionsLoading.set(false),
      });
    } else {
      Promise.resolve(result)
        .then((arr: any[]) => this.editingOptions.set(arr ?? []))
        .finally(() => this.editingOptionsLoading.set(false));
    }
  }
}
