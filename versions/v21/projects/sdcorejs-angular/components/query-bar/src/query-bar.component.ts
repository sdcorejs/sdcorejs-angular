/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  input,
  isSignal,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Filter, Operator } from '@sdcorejs/utils/models';

import { SdQueryActionsBar } from './components/actions-bar/actions-bar.component';
import { SdQueryBuildChip } from './components/build-chip/build-chip.component';
import { SdQueryChipPopover } from './components/chip-popover/chip-popover.component';
import { SdQueryFieldPicker } from './components/field-picker/field-picker.component';
import { SdQueryInlineChip } from './components/inline-chip/inline-chip.component';
import { SdQueryInlineValueChip } from './components/inline-value-chip/inline-value-chip.component';
import { SdQueryPopoverChip } from './components/popover-chip/popover-chip.component';
import {
  BuildingChip,
  SD_QUERY_MULTI_OPERATORS,
  SD_QUERY_NO_DATA_OPERATORS,
  SdQuery,
  SdQueryField,
  SdQueryLogic,
  SdSavedFilter,
  sdQueryAllowedOperators,
  sdQueryDefaultOperator,
  sdQueryFieldIcon,
} from './query-bar.model';

type Density = 'compact' | 'comfortable';
type Range = { from?: string | number | null; to?: string | number | null };

/** Shared empty array — stable reference so template bindings don't churn change detection. */
const EMPTY_ARRAY: any[] = [];

@Component({
  selector: 'sd-query-bar',
  templateUrl: './query-bar.component.html',
  styleUrls: ['./query-bar.component.scss', './query-bar.controls.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    SdQueryActionsBar,
    SdQueryBuildChip,
    SdQueryChipPopover,
    SdQueryFieldPicker,
    SdQueryInlineChip,
    SdQueryInlineValueChip,
    SdQueryPopoverChip,
  ],
})
export class SdQueryBar {
  readonly #i18n = inject(I18nService);
  readonly #injector = inject(Injector);

  /** All popover-mode chips in order — used to auto-open after addFilter / close before removeFilter. */
  readonly popoverChips = viewChildren(SdQueryPopoverChip);

  /** The extracted in-progress chip — owns operator menu + value picker view refs. */
  private readonly buildChip = viewChild(SdQueryBuildChip);

  /** The extracted chip popover — owns operator+value staging + commit-on-close. */
  readonly chipPopover = viewChild(SdQueryChipPopover);

  /**
   * Land the user in the value editor after the build chip reaches the value step:
   * popover-kind controls auto-open their native picker via the child; string/number
   * branches use the seamless chip whose `[autofocus]` handles focus internally.
   */
  #enterValueStep(field: SdQueryField): void {
    const k = field.type;
    if (k === 'values' || k === 'lazy-values' || k === 'date' || k === 'datetime') {
      afterNextRender(() => this.buildChip()?.openPicker(), { injector: this.#injector });
    }
    // why: string/number branch — <sd-query-inline-value-chip [autofocus]> tự focus,
    // không cần parent gọi thêm.
  }

  // ---------------------------------------------------------------------------
  // Inputs — all accept null|undefined at boundary, transform to canonical shape
  // ---------------------------------------------------------------------------

  /** Prefix for auto-generated `data-autoid` on inner controls (chips, operator/value editors, buttons). */
  readonly autoIdInput = input<string | undefined, string | null | undefined>(undefined, {
    alias: 'autoId',
    transform: (v): string | undefined => v ?? undefined,
  });

  /** Available fields the user can filter by. Required for the field picker. */
  readonly fields = input<SdQueryField[], SdQueryField[] | null | undefined>([], {
    transform: (v): SdQueryField[] => (Array.isArray(v) ? v : []),
  });

  /**
   * Active filter chips. Two-way bindable via `[(filters)]`.
   * Use this when you only need a flat `Filter[]` (no global logic / search box).
   */
  readonly filters = model<Filter[]>([]);

  /**
   * Global connector between filters. Two-way bindable via `[(logic)]`.
   * Only meaningful when `showLogicToggle=true` and there are ≥2 filters.
   */
  readonly logic = model<SdQueryLogic>('AND');

  /** Free-text search string. Two-way bindable via `[(search)]`. Only shown when `showSearch=true`. */
  readonly search = model<string>('');

  /**
   * Editing mode:
   * - `'popover'` (default) → compact chips; click a chip to edit operator + value in a
   *   mat-menu popover, commit with "Áp dụng".
   * - `'inline'` → GitLab-style. Each filter's operator + value controls render directly
   *   on the bar (no popup, no per-filter apply). Edits update `filters` live; the user
   *   presses the search button (or Enter) once to fire `(apply)`.
   */
  readonly mode = input<'popover' | 'inline', 'popover' | 'inline' | null | undefined>('popover', {
    transform: (v): 'popover' | 'inline' => v || 'popover',
  });

  /** Density preset — chip / control height. */
  readonly density = input<Density, Density | null | undefined>('compact', {
    transform: (v): Density => v || 'compact',
  });

  /** Show free-text search input on the left. */
  readonly showSearch = input(false, { transform: booleanAttribute });

  /** Show saved-filters dropdown on the right. Requires `[savedFiltersKey]` to actually persist. */
  readonly showSavedFilters = input(false, { transform: booleanAttribute });

  /**
   * Namespace key for persisting saved filters to `localStorage`. When set, the saved-filters
   * dropdown loads/saves under `sd-query-bar:savedFilters:<key>`. Leave undefined to disable.
   */
  readonly savedFiltersKey = input<string | undefined>(undefined);

  /**
   * Snapshot of the current query — fed into `<sd-query-saved-filters-menu [query]>` so
   * saving a filter captures live filters/logic/search.
   */
  readonly currentQuery = computed<SdQuery>(() => this.#buildQuery());

  /** Receive an applied filter from the saved-filters menu — re-install bar state + trigger apply. */
  onApplyFilter(saved: SdSavedFilter): void {
    this.filters.set(saved.query.filters ?? []);
    this.logic.set(saved.query.logic ?? 'AND');
    if (saved.query.search !== undefined) this.search.set(saved.query.search);
    this.triggerApply();
  }

  /** Show AND/OR segmented toggle (renders only when there are ≥2 filters). */
  readonly showLogicToggle = input(false, { transform: booleanAttribute });

  /** Show "Clear all" button when at least one filter is active. */
  readonly showClearAll = input(true, { transform: booleanAttribute });

  /** Render the operator label on the chip face (default: hidden — operator only visible in popover). */
  readonly showOperatorOnChip = input(false, { transform: booleanAttribute });

  // ---------------------------------------------------------------------------
  // Outputs
  // ---------------------------------------------------------------------------

  /** Composite payload — emitted whenever filters / logic / search change. */
  readonly queryChange = output<SdQuery>();

  /** Fires when the user presses "Áp dụng" inside a chip popover — host should reload data. */
  readonly apply = output<SdQuery>();

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  /** Map of `field.key` → `SdQueryField` for fast lookup from filters[]. */
  readonly fieldByKey = computed<Record<string, SdQueryField>>(() => {
    const map: Record<string, SdQueryField> = {};
    for (const f of this.fields()) map[f.key as string] = f;
    return map;
  });

  /** Field keys already chained on a chip — the picker greys these out. */
  readonly usedFieldKeys = computed<Set<string>>(() => {
    const set = new Set<string>();
    for (const f of this.filters()) {
      if ('field' in f && typeof f.field === 'string') set.add(f.field);
    }
    return set;
  });

  /** Render the global AND/OR connector text between chips when `logic === 'OR'`. */
  readonly showOrConnector = computed(
    () => this.showLogicToggle() && this.logic() === 'OR' && this.filters().length >= 2,
  );

  /** Search button is actionable only when there is something to apply. */
  readonly canSearch = computed(() => this.filters().length > 0 || this.search().trim().length > 0);

  // ---------------------------------------------------------------------------
  // Chip popover state — only `editingIndex` lives on the parent; the
  // `<sd-query-chip-popover>` child owns ALL staging (operator + value + options).
  // ---------------------------------------------------------------------------

  /** Index of the chip whose popover is open. Reset to null after commit / close. */
  readonly editingIndex = signal<number | null>(null);

  /** Resolved field of the chip whose popover is currently open (or null). */
  readonly editingField = computed<SdQueryField | null>(() => {
    const idx = this.editingIndex();
    if (idx === null) return null;
    const f = this.filters()[idx];
    if (!f || !('field' in f)) return null;
    return this.fieldByKey()[f.field as string] ?? null;
  });

  /**
   * Multi-select is derived from the operator (IN / NOT_IN) — not a field flag.
   * Only called by inline-mode + build-mode templates with a known operator;
   * popover-mode chips read `multiple()` from the child popover directly.
   */
  multiple(op: Operator): boolean {
    return SD_QUERY_MULTI_OPERATORS.includes(op);
  }

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  readonly iconFor = sdQueryFieldIcon;

  /** Chip is "active" when it has a non-empty value OR a no-data operator (NULL/NOT_NULL). */
  isFilterActive(filter: Filter): boolean {
    if (SD_QUERY_NO_DATA_OPERATORS.includes(filter.operator as Operator)) return true;
    const data = (filter as any).data;
    if (data === null || data === undefined || data === '') return false;
    if (Array.isArray(data) && data.length === 0) return false;
    return true;
  }

  /** Rendered value text on a chip. */
  chipValueText(filter: Filter): string {
    if (SD_QUERY_NO_DATA_OPERATORS.includes(filter.operator as Operator)) return '';
    const data = (filter as any).data;
    if (data === null || data === undefined) return '';
    if (filter.operator === 'BETWEEN' && data && typeof data === 'object') {
      return `${data.from ?? ''} — ${data.to ?? ''}`;
    }
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const head = this.#displayOne(filter, data[0]);
      return data.length > 1 ? `${head} +${data.length - 1}` : head;
    }
    return this.#displayOne(filter, data);
  }

  isNoDataOperator(op: Operator | string): boolean {
    return SD_QUERY_NO_DATA_OPERATORS.includes(op as Operator);
  }


  // ---------------------------------------------------------------------------
  // Inline mode — per-field helpers + live mutators (no popover / no Apply gate)
  // ---------------------------------------------------------------------------

  /** The single in-progress inline chip (not yet in `filters`). */
  readonly #building = signal<BuildingChip | null>(null);
  readonly building = this.#building.asReadonly();

  allowedOperatorsFor(field: SdQueryField): Operator[] {
    return sdQueryAllowedOperators(field);
  }

  inlineAutoId(index: number, role: string): string {
    const base = this.autoIdInput() ?? 'qb';
    return `${base}-inline${index}-${role}`;
  }

  // ---------------------------------------------------------------------------
  // Inline mode — progressive token build flow (field → operator → value)
  // ---------------------------------------------------------------------------

  /** Append a completed chip to `filters` WITHOUT emitting (inline mode commits on Search). */
  #pushComplete(field: SdQueryField, operator: Operator, value: unknown): void {
    let data: unknown = value;
    if (SD_QUERY_NO_DATA_OPERATORS.includes(operator)) data = null;
    else if (operator === 'BETWEEN') {
      if (!data || typeof data !== 'object') data = { from: null, to: null };
    } else if (SD_QUERY_MULTI_OPERATORS.includes(operator)) {
      data = Array.isArray(data) ? data : value == null ? [] : [value];
    }
    const next = { field: field.key as any, operator, data } as Filter;
    this.filters.set([...this.filters(), next]);
  }

  /** Entry point from the field picker — start building a chip for `field`. */
  beginBuild(field: SdQueryField): void {
    const allowed = sdQueryAllowedOperators(field);
    const def = sdQueryDefaultOperator(field);
    // why: date/datetime mặc định là BETWEEN — skip operator step để user vào value
    // step ngay (95% case dùng BETWEEN cho date/datetime; cắt 1 click cho luồng phổ
    // biến nhất). Field type khác giữ flow chọn operator để user thấy đầy đủ lựa chọn.
    const skipOperatorStep = (field.type === 'date' || field.type === 'datetime') && allowed.includes(def);
    if (allowed.length > 1 && !skipOperatorStep) {
      this.#building.set({ field, step: 'operator' });
      // why: auto-open the operator menu so the user can pick the condition without a
      // second click — the viewChild only resolves after the building chip renders.
      afterNextRender(() => this.buildChip()?.openOperator(), { injector: this.#injector });
      return;
    }
    const operator = skipOperatorStep ? def : (allowed[0] ?? def);
    if (SD_QUERY_NO_DATA_OPERATORS.includes(operator)) {
      this.#pushComplete(field, operator, null);
      this.#building.set(null);
      return;
    }
    this.#building.set({ field, operator, step: 'value' });
    this.#enterValueStep(field);
  }

  /** Operator chosen during build — finish (no-data) or advance to the value step. */
  pickBuildOperator(op: Operator): void {
    const b = this.#building();
    if (!b) return;
    if (SD_QUERY_NO_DATA_OPERATORS.includes(op)) {
      this.#pushComplete(b.field, op, null);
      this.#building.set(null);
      return;
    }
    this.#building.set({ ...b, operator: op, step: 'value' });
    this.#enterValueStep(b.field);
  }

  /** Value committed during build — push the completed chip, clear building. No emit. */
  commitBuildValue(value: unknown): void {
    const b = this.#building();
    if (!b || !b.operator) return;
    this.#pushComplete(b.field, b.operator, value);
    this.#building.set(null);
  }

  /**
   * Commit from the seamless build chip (string / number). An empty value (blur with no
   * input) cancels the build instead of pushing a blank chip.
   */
  onBuildSeamlessCommit(value: unknown): void {
    const empty =
      value == null ||
      value === '' ||
      (typeof value === 'object' &&
        (value as Range).from == null &&
        (value as Range).to == null);
    if (empty) {
      this.cancelBuild();
      return;
    }
    this.commitBuildValue(value);
  }

  /** Abandon the in-progress chip. */
  cancelBuild(): void {
    this.#building.set(null);
  }


  /**
   * Commit both ends of a BETWEEN range at once — called from `<sd-query-inline-chip>`'s
   * `(commitRange)` output when the user picks a date range.
   * why: sd-date-range emits {from,to} via (sdChange) — single call thay cho cặp
   * setFilterRangeFrom / setFilterRangeTo cũ (đã bỏ).
   */
  setFilterRange(i: number, ev: { from: unknown; to: unknown } | null): void {
    this.updateFilter(i, { data: ev ?? { from: null, to: null } } as Partial<Filter>);
  }

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  addFilter(field: SdQueryField): void {
    const operator = sdQueryDefaultOperator(field);
    const data = SD_QUERY_MULTI_OPERATORS.includes(operator) ? [] : null;
    const next: Filter = { field: field.key as any, operator, data } as Filter;
    const newIndex = this.filters().length;
    this.filters.set([...this.filters(), next]);
    // why: user added a field — open its edit popover immediately so they can pick
    // operator + value in one continuous flow (no second click required).
    afterNextRender(
      () => this.popoverChips()[newIndex]?.openMenu(),
      { injector: this.#injector },
    );
  }

  /** Swap the field of an existing chip — reset operator + value to the new field's defaults. */
  changeFilterField(index: number, field: SdQueryField): void {
    const list = [...this.filters()];
    if (index < 0 || index >= list.length) return;
    const operator = sdQueryDefaultOperator(field);
    const data = SD_QUERY_MULTI_OPERATORS.includes(operator) ? [] : null;
    list[index] = { field: field.key as any, operator, data } as Filter;
    this.filters.set(list);
    // why: clicking an item in the nested fieldSwitchPicker closes both the picker AND
    // the parent chipPopover. Re-open the chip's popover on the next render so user can
    // continue picking operator + value without a second manual click.
    afterNextRender(
      () => this.popoverChips()[index]?.openMenu(),
      { injector: this.#injector },
    );
  }

  updateFilter(index: number, patch: Partial<Filter>): void {
    const list = [...this.filters()];
    if (index < 0 || index >= list.length) return;
    list[index] = { ...list[index], ...patch } as Filter;
    this.filters.set(list);
  }

  removeFilter(index: number): void {
    const list = [...this.filters()];
    if (index < 0 || index >= list.length) return;
    // close the open popover (if it's this chip's) before the chip + its trigger vanish
    if (this.editingIndex() === index) {
      this.popoverChips()[index]?.closeMenu();
      this.editingIndex.set(null);
    }
    list.splice(index, 1);
    this.filters.set(list);
  }

  clearAll(): void {
    if (this.filters().length === 0) return;
    this.filters.set([]);
    this.editingIndex.set(null);
  }

  setLogic(value: SdQueryLogic): void {
    if (this.logic() === value) return;
    this.logic.set(value);
  }

  setSearch(value: string): void {
    if (this.search() === value) return;
    this.search.set(value);
  }

  triggerApply(): void {
    // why: single deferred trigger — fire both the change notification and the reload
    // signal once, from here only (mutations no longer emit).
    const q = this.#buildQuery();
    this.queryChange.emit(q);
    this.apply.emit(q);
  }

  // ---------------------------------------------------------------------------
  // Chip popover — delegate staging to `<sd-query-chip-popover>` child.
  // ---------------------------------------------------------------------------

  /**
   * Called when a popover-mode chip is clicked — set editingIndex and seed the
   * child popover's staging signals from the chip's Filter.
   */
  openChipPopover(index: number): void {
    const filter = this.filters()[index];
    if (!filter || !('field' in filter)) return;
    this.editingIndex.set(index);
    const field = this.fieldByKey()[filter.field as string];
    this.chipPopover()?.seed(filter, field);
  }

  /** Receive `(commit)` from the child popover — splice into filters, null the index. */
  onChipPopoverCommit(next: Filter): void {
    const idx = this.editingIndex();
    if (idx === null) return;
    const list = [...this.filters()];
    list[idx] = next;
    this.filters.set(list);
    this.editingIndex.set(null);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  #buildQuery(): SdQuery {
    return {
      filters: this.filters(),
      logic: this.logic(),
      ...(this.showSearch() ? { search: this.search() } : {}),
    };
  }

  #displayOne(filter: Filter, raw: any): string {
    const fieldKey = 'field' in filter ? (filter.field as string) : '';
    const field = this.fieldByKey()[fieldKey];
    if (!field) return String(raw);
    if (field.type === 'boolean') {
      const trueLabel = (field as any).trueLabel ?? 'Có';
      const falseLabel = (field as any).falseLabel ?? 'Không';
      return raw ? trueLabel : falseLabel;
    }
    if (field.type === 'values' || field.type === 'lazy-values') {
      const opt = (field as any).option;
      const cachedOptions = this.chipPopover()?.editingOptions() ?? [];
      const items = this.#resolveSyncItems(opt?.items) ?? cachedOptions;
      const match = items.find((i: any) => i?.[opt.valueField] === raw);
      if (match) return String(match[opt.displayField]);
      const cached = cachedOptions.find((i: any) => i?.[opt.valueField] === raw);
      return cached ? String(cached[opt.displayField]) : String(raw);
    }
    return String(raw);
  }

  #resolveSyncItems(items: any): any[] | null {
    if (Array.isArray(items)) return items;
    if (isSignal(items)) return (items as any)();
    return null;
  }
}
