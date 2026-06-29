import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, isSignal, output, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { isObservable } from 'rxjs';

import { SdButton } from '@sdcorejs/angular/components/button';
import { SdOperator } from '@sdcorejs/angular/components/operator';
import { SdDate } from '@sdcorejs/angular/forms/date';
import { SdDatetime } from '@sdcorejs/angular/forms/datetime';
import { SdInput } from '@sdcorejs/angular/forms/input';
import { SdInputNumber } from '@sdcorejs/angular/forms/input-number';
import { SdSelect } from '@sdcorejs/angular/forms/select';
import { Filter, Operator } from '@sdcorejs/utils/models';

import {
  SD_QUERY_MULTI_OPERATORS,
  SD_QUERY_NO_DATA_OPERATORS,
  SdQueryField,
  sdQueryAllowedOperators,
  sdQueryFieldIcon,
  sdQueryShowOperatorSelector,
} from '../../query-bar.model';

interface Range {
  from?: string | number | null;
  to?: string | number | null;
}

/**
 * Popover-mode chip editor — the entire `<mat-menu>` that opens when a popover-mode
 * chip is clicked. Owns ALL operator+value staging signals and async option loading.
 *
 * why: tách khỏi `<sd-query-bar>` để parent chỉ giữ `editingIndex` (chip nào đang
 * mở) + nhận `(commit)` khi popover đóng. Mỗi lần parent gọi `seed(filter, field)`
 * trước khi mở chip popover, child reset staging signals + kích option loading.
 *
 * Public surface (template ref `#cp`):
 *   - `cp.menu()` — the `<mat-menu>` to feed `[menu]` of `<sd-query-popover-chip>`
 *   - `cp.seed(filter, field)` — parent reseeds staging before opening
 *   - `(commit)` output — emitted on mat-menu close with staged Filter
 *   - `(swapField)` output — emitted when the nested field switcher picks a new field
 */
@Component({
  selector: 'sd-query-chip-popover',
  templateUrl: './chip-popover.component.html',
  styleUrl: './chip-popover.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
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
  readonly autoIdBase = input<string>('qb');

  /** MatMenu for the field switcher — parent passes its `<sd-query-field-picker>` menu. */
  readonly switchPickerMenu = input<MatMenu | undefined>(undefined);

  // ---------------------------------------------------------------------------
  // Outputs
  // ---------------------------------------------------------------------------

  /** Emitted when mat-menu closes — parent splices `next` into filters[idx]. */
  readonly commit = output<Filter>();

  /** Emitted when nested field-switcher picks a new field — parent calls changeFilterField. */
  readonly swapField = output<SdQueryField>();

  // ---------------------------------------------------------------------------
  // Staging signals — uncommitted edits, committed on menu close.
  // ---------------------------------------------------------------------------

  /** Staged operator. */
  readonly editingOperator = signal<Operator>('EQUAL');
  /** Staged value (shape depends on field type + operator). */
  readonly editingValue = signal<unknown>(null);
  /** Resolved option list for values / lazy-values. */
  readonly editingOptions = signal<any[]>([]);
  /** Loading flag for async option fetch. */
  readonly editingOptionsLoading = signal(false);

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  readonly allowedOperators = computed<Operator[]>(() => {
    const f = this.field();
    return f ? sdQueryAllowedOperators(f) : [];
  });

  readonly showOperatorSelector = computed<boolean>(() => {
    const f = this.field();
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
    const idx = this.chipIndex();
    return `${base}-chip${idx ?? 'x'}-${role}`;
  }

  readonly iconFor = sdQueryFieldIcon;

  // ---------------------------------------------------------------------------
  // mat-menu instance — parent reads via `cp.menu()`
  // ---------------------------------------------------------------------------

  readonly menu = viewChild<MatMenu>('menu');

  // ---------------------------------------------------------------------------
  // Seed — parent calls before opening the popover so staging signals are
  // primed from the current filter + the option list is loaded.
  // ---------------------------------------------------------------------------

  /** Reseed staging from a new filter/field pair — call before opening the menu. */
  seed(filter: Filter | undefined, field: SdQueryField | undefined): void {
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

  /** Single-value input change. */
  onEditingValueInput(value: unknown): void {
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
  // Menu lifecycle — close = commit
  // ---------------------------------------------------------------------------

  /**
   * mat-menu's (closed) handler — compose the next Filter from staging signals and
   * emit (commit). Parent splices into its filters[] and nulls editingIndex.
   */
  onMenuClosed(): void {
    const f = this.filter();
    if (!f) return;
    const next: Filter = {
      field: (f as any).field,
      operator: this.editingOperator(),
      data: this.editingValue(),
    } as Filter;
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
