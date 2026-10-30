import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  isSignal,
  model,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { Utilities } from '@sdcorejs/utils/fns';
import { Filter, Operator } from '@sdcorejs/utils/models';
import { firstValueFrom, isObservable } from 'rxjs';

import { SdQueryActionsBar } from './components/actions-bar/actions-bar.component';
import { SdQueryBuildChip } from './components/build-chip/build-chip.component';
import { SdQueryChipPopover } from './components/chip-popover/chip-popover.component';
import { SdQueryFieldPicker } from './components/field-picker/field-picker.component';
import { SdQueryInlineChip } from './components/inline-chip/inline-chip.component';
import { SdQueryInlineValueChip } from './components/inline-value-chip/inline-value-chip.component';
import { SdQueryPopoverChip } from './components/popover-chip/popover-chip.component';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import {
  BuildingChip,
  SD_QUERY_DEFAULT_OPERATOR_BY_TYPE,
  SD_QUERY_MULTI_OPERATORS,
  SD_QUERY_NO_DATA_OPERATORS,
  SdQuery,
  SdQueryBarOption,
  SdQueryField,
  SdQueryLogic,
  SdSavedFilter,
  sdQueryAllowedOperators,
  sdQueryDefaultOperator,
  sdQueryFieldIcon,
} from './query-bar.model';

type Density = 'compact' | 'comfortable';
interface Range {
  from?: string | number | null;
  to?: string | number | null;
}

/** Shared empty array — stable reference so template bindings don't churn change detection. */
const EMPTY_ARRAY: any[] = [];

/** Chip date formats — the `dd/MM/yyyy` that sd-date / sd-datetime show in their input. */
const DATE_FORMAT = 'dd/MM/yyyy';
const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

const hasValue = (value: unknown): boolean => value !== null && value !== undefined && value !== '';

@Component({
  selector: 'sd-query-bar',
  templateUrl: './query-bar.component.html',
  styleUrls: ['./query-bar.component.scss', './query-bar.controls.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SdIcon,
    CommonModule,
    FormsModule,
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
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #dateTime = inject(SdDateTimeService);

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

  /** Main option object. Prefer this API for new usage; individual inputs stay as a migration bridge. */
  readonly option = input<SdQueryBarOption | undefined>(undefined);

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
  // why: chữ trong ô tìm trước khi người dùng bắt đầu gõ — đổi chip ở applyOn 'commit' áp dụng giá trị này, không áp
  // dụng phần đang gõ dở. `null`: không có gì đang gõ.
  #searchBase: string | null = null;

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

  /**
   * Render the operator label on the chip face (default: hidden — operator only visible in popover).
   * `'auto'`: only on chips whose field offers a choice or whose operator is not the type default.
   */
  readonly showOperatorOnChip = input<boolean | 'auto', boolean | 'auto' | string | null | undefined>(false, {
    transform: (v): boolean | 'auto' => (v === 'auto' ? 'auto' : booleanAttribute(v)),
  });

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

  // ---------------------------------------------------------------------------
  // Nhãn i18n cho template
  // why: `#i18n` trước đây được inject nhưng KHÔNG dùng — mọi chuỗi trong template đều hardcode
  // tiếng Việt. Bọc qua `computed()` thay vì pipe `translate` vì pipe là pure: nó chỉ chạy lại khi
  // input đổi tham chiếu, nên đổi ngôn ngữ runtime không refresh được. `t()` đọc signal `messages()`
  // nên computed tự invalidate khi `I18nService.setLanguage()` chạy.
  // ---------------------------------------------------------------------------

  /** Placeholder của ô tìm kiếm tự do bên trái; `option.searchPlaceholder` thắng i18n. */
  readonly searchPlaceholder = computed(
    () => this.option()?.searchPlaceholder ?? this.#i18n.t('core.component.query-bar.search-placeholder')
  );
  /** Chữ trên chip ghim đang rỗng. */
  readonly allLabel = computed(() => this.#i18n.t('core.component.query-bar.all'));
  /** Chữ trên chip bắt buộc đang rỗng — "Tất cả" sai nghĩa khi field không cho phép bỏ trống. */
  readonly selectValueLabel = computed(() => this.#i18n.t('core.component.query-bar.placeholder.select-value'));
  /** Tooltip nút "+" khi consumer chưa khai `fields`. */
  readonly noFieldsLabel = computed(() => this.#i18n.t('core.component.query-bar.no-fields'));
  /** Tooltip nút "+" ở trạng thái bình thường. */
  readonly addFilterLabel = computed(() => this.#i18n.t('core.component.query-bar.add-filter'));

  /** Map of `field.key` → `SdQueryField` for fast lookup from filters[]. */
  readonly resolvedAutoId = computed(() => this.option()?.autoId ?? this.autoIdInput() ?? undefined);
  readonly resolvedFields = computed(() => this.option()?.fields ?? this.fields());
  readonly resolvedMode = computed(() => this.option()?.mode ?? this.mode());
  readonly resolvedDensity = computed(() => this.option()?.density ?? this.density());
  readonly resolvedShowSearch = computed(() => this.option()?.showSearch ?? this.showSearch());
  readonly resolvedShowSavedFilters = computed(() => this.option()?.showSavedFilters ?? this.showSavedFilters());
  readonly resolvedSavedFiltersKey = computed(() => this.option()?.savedFiltersKey ?? this.savedFiltersKey());
  readonly resolvedShowLogicToggle = computed(() => this.option()?.showLogicToggle ?? this.showLogicToggle());
  readonly resolvedShowClearAll = computed(() => this.option()?.showClearAll ?? this.showClearAll());
  readonly resolvedShowOperatorOnChip = computed(() => this.option()?.showOperatorOnChip ?? this.showOperatorOnChip());
  readonly resolvedApplyOn = computed(() => this.option()?.applyOn ?? 'search');
  readonly resolvedAppearance = computed(() => this.option()?.appearance ?? 'default');
  readonly resolvedClearDisabled = computed(() => !!this.option()?.clearDisabled);
  readonly resolvedInvalidHintId = computed(() => this.option()?.invalidHintId);

  constructor() {
    effect(() => {
      const option = this.option();
      if (!option) return;
      untracked(() => {
        if (option.filters && this.filters() !== option.filters) this.filters.set(option.filters);
        if (option.logic && this.logic() !== option.logic) this.logic.set(option.logic);
        if (option.search !== undefined && this.search() !== option.search) this.search.set(option.search);
      });
    });

    // why: chip khôi phục (cache, URL) mang id chứ không mang nhãn; nhãn của values/lazy-values chỉ có
    // khi popover nạp option. Tra một lần cho mỗi giá trị lạ để chip không hiện id thô.
    effect(() => {
      const filters = this.filters();
      const fields = this.fieldByKey();
      untracked(() => {
        for (const filter of filters) this.#resolveLabels(filter, fields);
      });
    });
  }

  readonly fieldByKey = computed<Record<string, SdQueryField>>(() => {
    const map: Record<string, SdQueryField> = {};
    for (const f of this.resolvedFields()) map[f.key as string] = f;
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

  /** Fields the user can add: pinned fields always have their chip, so the picker leaves them out. */
  readonly pickerFields = computed<SdQueryField[]>(() => {
    const fields = this.resolvedFields();
    // why: giữ nguyên ref khi không có field ghim để picker (OnPush) không bị dirty vô cớ.
    return fields.some(field => field.pinned) ? fields.filter(field => !field.pinned) : fields;
  });

  /** "+" is disabled when nothing is left to add. */
  readonly addDisabled = computed(() => {
    const fields = this.pickerFields();
    const used = this.usedFieldKeys();
    return fields.length === 0 || fields.every(field => used.has(field.key as string));
  });

  /** Required fields without a chip value. The host renders the explanation from this list. */
  readonly invalidFields = computed<SdQueryField[]>(() => {
    const required = this.resolvedFields().filter(field => field.required);
    if (!required.length) return EMPTY_ARRAY;
    const filled = new Set<string>();
    for (const filter of this.filters()) {
      if ('field' in filter && this.isFilterActive(filter)) filled.add(filter.field as string);
    }
    const invalid = required.filter(field => !filled.has(field.key as string));
    return invalid.length ? invalid : EMPTY_ARRAY;
  });

  /** Chips holding a value — the number shown in the clear-all label. */
  readonly activeCount = computed(() => this.filters().filter(filter => this.isFilterActive(filter)).length);

  /** Render the global AND/OR connector text between chips when `logic === 'OR'`. */
  readonly showOrConnector = computed(() => this.resolvedShowLogicToggle() && this.logic() === 'OR' && this.filters().length >= 2);

  /** Search button is actionable only when there is something to apply and no required field is empty. */
  readonly canSearch = computed(() => (this.filters().length > 0 || this.search().trim().length > 0) && this.invalidFields().length === 0);

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
  // Row identity — stable synthetic id per filter chip, used as the `@for` track key
  // ---------------------------------------------------------------------------

  /**
   * Filter object → synthetic row id.
   *
   * why: `@for (... ; track $index)` gắn chip với VỊ TRÍ, không phải với filter. Xoá chip index 0
   * thì chip index 0 không bị huỷ mà được bind lại sang filter kế tiếp, kéo theo state nội bộ
   * của chip (`inline-chip` `#editing`, `inline-value-chip` `draft`) sang một filter khác.
   * Gắn id tổng hợp cho từng dòng để `track` bám đúng filter.
   *
   * Lưu trong WeakMap thay vì gắn thẳng thuộc tính lên `Filter` để payload `SdQuery.filters` phát
   * ra ngoài vẫn sạch (không rò field nội bộ cho consumer).
   */
  readonly #rowIds = new WeakMap<Filter, string>();
  #rowIdSeq = 0;

  /**
   * Stable track key of a filter row. Assigned lazily on first read.
   *
   * ⚠️ Hai ràng buộc với `filters`, đều là hợp đồng của consumer:
   *
   * 1. KHÔNG được chứa cùng một object `Filter` ở hai vị trí. Khoá theo identity nên hai vị trí sẽ
   *    cho hai track key trùng nhau và Angular ném NG0955. Đã thử khử trùng bằng hậu tố `$index`
   *    và HỎNG: Angular đánh giá biểu thức `track` trên CẢ collection cũ khi diff, nên một filter
   *    vừa bị xoá cho `indexOf === -1`, key đổi, và MỌI chip bị huỷ rồi dựng lại. Để Angular báo
   *    NG0955 là đúng — thông điệp của nó đã chỉ rõ vấn đề.
   * 2. Object phải ỔN ĐỊNH giữa các lần change detection. Sinh lại object mới mỗi pass
   *    (vd `[option]="{ filters: buildFilters() }"`) sẽ khiến mọi chip nhận id mới mỗi pass và bị
   *    huỷ + dựng lại — tệ hơn cả `track $index` cũ.
   */
  rowId(filter: Filter): string {
    let id = this.#rowIds.get(filter);
    if (!id) {
      id = `qbr-${++this.#rowIdSeq}`;
      this.#rowIds.set(filter, id);
    }
    return id;
  }

  /**
   * Chuyển id của một dòng sang object thay thế.
   * why: mọi mutation đều tạo object mới (`{ ...previous, ...patch }`); không kế thừa id thì mỗi
   * lần sửa giá trị lại huỷ + dựng lại chip, mất focus và state đang gõ dở.
   */
  #inheritRowId(previous: Filter, next: Filter): void {
    this.#rowIds.set(next, this.rowId(previous));
  }

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------

  readonly iconFor = sdQueryFieldIcon;

  /**
   * Chip is "active" when it has a non-empty value OR a no-data operator (NULL/NOT_NULL).
   * A BETWEEN range is active when either end is set; `{ from: null, to: null }` is empty.
   */
  isFilterActive(filter: Filter): boolean {
    if (SD_QUERY_NO_DATA_OPERATORS.includes(filter.operator as Operator)) return true;
    const data = (filter as any).data;
    if (data === null || data === undefined || data === '') return false;
    if (Array.isArray(data)) return data.length > 0;
    if (filter.operator === 'BETWEEN' && typeof data === 'object') return hasValue(data.from) || hasValue(data.to);
    return true;
  }

  /** Rendered value text on a chip. */
  chipValueText(filter: Filter): string {
    if (SD_QUERY_NO_DATA_OPERATORS.includes(filter.operator as Operator)) return '';
    const data = (filter as any).data;
    if (data === null || data === undefined) return '';
    if (filter.operator === 'BETWEEN' && data && typeof data === 'object' && !Array.isArray(data)) {
      return this.#rangeText(filter, data);
    }
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const head = this.#displayOne(filter, data[0]);
      return data.length > 1 ? `${head} +${data.length - 1}` : head;
    }
    return this.#displayOne(filter, data);
  }

  /** The field of a chip, or `undefined` for a key the bar does not know. */
  fieldOf(filter: Filter): SdQueryField | undefined {
    return 'field' in filter ? this.fieldByKey()[filter.field as string] : undefined;
  }

  /** Pinned chips have no remove button and survive removeFilter / clearAll. */
  isPinned(filter: Filter): boolean {
    return !!this.fieldOf(filter)?.pinned;
  }

  /** Empty chip of a required field. */
  isInvalid(filter: Filter): boolean {
    return !!this.fieldOf(filter)?.required && !this.isFilterActive(filter);
  }

  /** Text of an empty chip: "All" on a pinned chip, "Select a value" on a required one, nothing otherwise. */
  emptyTextFor(field: SdQueryField | undefined): string {
    if (field?.required) return this.selectValueLabel();
    return field?.pinned ? this.allLabel() : '';
  }

  /**
   * Whether a chip of `field` shows its operator. A boolean setting applies to every chip; `'auto'`
   * shows it when the field offers a choice, or when the operator is not the default of the type.
   */
  showOperatorFor(field: SdQueryField | undefined, operator: Operator | undefined): boolean {
    const setting = this.resolvedShowOperatorOnChip();
    if (setting !== 'auto') return setting;
    if (!field) return false;
    return sdQueryAllowedOperators(field).length > 1 || (!!operator && operator !== SD_QUERY_DEFAULT_OPERATOR_BY_TYPE[field.type]);
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

  /**
   * Allowed operators of `field` — safe to call from a template binding: `sdQueryAllowedOperators`
   * memo hoá theo object field nên ref trả về ổn định giữa các chu kỳ CD.
   * why: `<sd-query-build-chip [allowedOperators]>` là OnPush; ref mới mỗi CD sẽ dirty child liên
   * tục (bug class cấp-phát-mỗi-CD).
   */
  allowedOperatorsFor(field: SdQueryField): Operator[] {
    return sdQueryAllowedOperators(field);
  }

  inlineAutoId(index: number, role: string): string {
    const base = this.resolvedAutoId() ?? 'qb';
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
    if (this.resolvedApplyOn() === 'commit' && this.isFilterActive(next)) this.#applyChipChange();
  }

  /** Value committed by a completed inline chip (seamless input, picker, boolean toggle). */
  onInlineCommit(index: number, data: unknown): void {
    const previous = this.filters()[index];
    this.updateFilterData(index, data);
    this.#applyIfChanged(previous, this.filters()[index]);
  }

  /** Range committed by a completed inline BETWEEN chip. */
  onInlineRange(index: number, ev: { from: unknown; to: unknown } | null): void {
    const previous = this.filters()[index];
    this.setFilterRange(index, ev);
    this.#applyIfChanged(previous, this.filters()[index]);
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
      value == null || value === '' || (typeof value === 'object' && (value as Range).from == null && (value as Range).to == null);
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
    this.#addFilter(field);
  }

  #addFilter(field: SdQueryField, returnFocusTo?: HTMLElement): void {
    const operator = sdQueryDefaultOperator(field);
    const data = SD_QUERY_MULTI_OPERATORS.includes(operator) ? [] : null;
    const next: Filter = { field: field.key as any, operator, data } as Filter;
    const newIndex = this.filters().length;
    this.filters.set([...this.filters(), next]);
    // why: user added a field — open its edit popover immediately so they can pick
    // operator + value in one continuous flow (no second click required).
    afterNextRender(() => this.popoverChips()[newIndex]?.openMenu(returnFocusTo), { injector: this.#injector });
  }

  /**
   * Opens the editor of `key` — for a host control outside the bar, such as a table header icon.
   * Popover mode opens the chip's popover, adding the chip first when the field has none; inline
   * mode focuses the chip or starts building one. `returnFocusTo` receives focus when the popover
   * closes, instead of the chip.
   */
  openField(key: string, returnFocusTo?: HTMLElement | null): void {
    const field = this.fieldByKey()[key];
    if (!field) return;
    const index = this.filters().findIndex(filter => 'field' in filter && filter.field === key);
    if (this.resolvedMode() === 'inline') {
      if (index < 0) this.beginBuild(field);
      else afterNextRender(() => this.#focusInlineChip(index), { injector: this.#injector });
      return;
    }
    if (index < 0) this.#addFilter(field, returnFocusTo ?? undefined);
    else this.popoverChips()[index]?.openMenu(returnFocusTo ?? undefined);
  }

  /** Clear-all button: the host's `onClearAll` when given, else the built-in clearAll(). */
  onClearClick(): void {
    const onClearAll = this.option()?.onClearAll;
    if (onClearAll) onClearAll();
    else this.clearAll();
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
    afterNextRender(() => this.popoverChips()[index]?.openMenu(), { injector: this.#injector });
  }

  updateFilter(index: number, patch: Partial<Filter>): void {
    const list = [...this.filters()];
    if (index < 0 || index >= list.length) return;
    const previous = list[index];
    const next = { ...previous, ...patch } as Filter;
    // why: cùng một dòng logic, chỉ đổi data/operator → giữ nguyên track key để chip được patch
    // tại chỗ thay vì huỷ + dựng lại.
    this.#inheritRowId(previous, next);
    list[index] = next;
    this.filters.set(list);
  }

  updateFilterData(index: number, data: unknown): void {
    this.updateFilter(index, { data } as Partial<Filter>);
  }

  removeFilter(index: number): void {
    const list = [...this.filters()];
    if (index < 0 || index >= list.length) return;
    const removed = list[index];
    if (this.isPinned(removed)) return;
    const editing = this.editingIndex();
    // why: `editingIndex` là chỉ số vào mảng filters, nên mọi lần xoá ở vị trí <= nó đều làm nó
    // lệch. Trước đây chỉ xử lý trường hợp bằng nhau → xoá một chip ĐỨNG TRƯỚC khiến editingIndex
    // trỏ lố 1 ô và `onChipPopoverCommit` ghi giá trị staged vào SAI filter.
    if (editing !== null && index <= editing) {
      if (index === editing) {
        // why: null trước rồi mới đóng — commit mà menu phát khi đóng phải bị bỏ qua (chip sắp mất),
        // nếu không `applyOn: 'commit'` sẽ áp dụng giá trị nháp của một chip đang bị xoá.
        this.editingIndex.set(null);
        this.popoverChips()[index]?.closeMenu();
      } else {
        this.editingIndex.set(editing - 1);
      }
    }
    list.splice(index, 1);
    this.filters.set(list);
    if (this.resolvedApplyOn() === 'commit' && this.isFilterActive(removed)) this.#applyChipChange();
  }

  /** Empties the bar. Pinned chips stay, reset to their field's default operator and no value. */
  clearAll(): void {
    if (this.filters().length === 0) return;
    const kept: Filter[] = [];
    for (const filter of this.filters()) {
      const field = this.fieldOf(filter);
      if (!field?.pinned) continue;
      const operator = sdQueryDefaultOperator(field);
      const next = { field: field.key as any, operator, data: SD_QUERY_MULTI_OPERATORS.includes(operator) ? [] : null } as Filter;
      this.#inheritRowId(filter, next);
      kept.push(next);
    }
    this.filters.set(kept);
    this.editingIndex.set(null);
  }

  setLogic(value: SdQueryLogic): void {
    if (this.logic() === value) return;
    this.logic.set(value);
  }

  setSearch(value: string): void {
    if (this.search() === value) return;
    if (this.#searchBase === null) this.#searchBase = this.search();
    this.search.set(value);
  }

  /** Enter in the search box: applies the typed text too, unless a required field is still empty. */
  applySearch(): void {
    if (this.invalidFields().length) return;
    this.triggerApply();
  }

  triggerApply(): void {
    this.#searchBase = null;
    this.#emitApply(this.#buildQuery());
  }

  /**
   * A chip change applied at once (`applyOn: 'commit'`). It keeps the search text applied last: the text still being
   * typed is applied by Enter, like the quick search of sd-table.
   */
  #applyChipChange(): void {
    const query = this.#buildQuery();
    this.#emitApply(this.#searchBase !== null && 'search' in query ? { ...query, search: this.#searchBase } : query);
  }

  #emitApply(q: SdQuery): void {
    // why: single deferred trigger — fire both the change notification and the reload
    // signal once, from here only (mutations no longer emit).
    this.option()?.onQueryChange?.(q);
    this.queryChange.emit(q);
    this.option()?.onApply?.(q);
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

  /**
   * Receive `(commit)` from the child popover — splice into filters, null the index. With
   * `applyOn: 'commit'` a changed chip applies at once, and an unpinned chip that closes empty is
   * dropped (applying only when it had a value before).
   */
  onChipPopoverCommit(next: Filter): void {
    const idx = this.editingIndex();
    if (idx === null) return;
    const list = [...this.filters()];
    const previous = list[idx];
    if (!previous) return;
    const commit = this.resolvedApplyOn() === 'commit';
    if (commit && !this.isPinned(next) && !this.isFilterActive(next)) {
      list.splice(idx, 1);
      this.filters.set(list);
      this.editingIndex.set(null);
      if (this.isFilterActive(previous)) this.#applyChipChange();
      return;
    }
    // why: popover chỉ đổi operator + value của CHÍNH chip đó → giữ track key, nếu không chip sẽ
    // bị huỷ ngay lúc menu đóng (trigger của overlay biến mất giữa chừng).
    this.#inheritRowId(previous, next);
    list[idx] = next;
    this.filters.set(list);
    this.editingIndex.set(null);
    if (commit && this.#changed(previous, next)) this.#applyChipChange();
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  #buildQuery(): SdQuery {
    return {
      filters: this.filters(),
      logic: this.logic(),
      ...(this.resolvedShowSearch() ? { search: this.search() } : {}),
    };
  }

  /** Operator or value changed. Two empty chips with the same operator count as unchanged. */
  #changed(previous: Filter, next: Filter): boolean {
    if (previous.operator !== next.operator) return true;
    const wasActive = this.isFilterActive(previous);
    if (wasActive !== this.isFilterActive(next)) return true;
    if (!wasActive) return false;
    try {
      return Utilities.canonicalStringify((previous as any).data) !== Utilities.canonicalStringify((next as any).data);
    } catch {
      return true;
    }
  }

  #applyIfChanged(previous: Filter | undefined, next: Filter | undefined): void {
    if (this.resolvedApplyOn() === 'commit' && previous && next && this.#changed(previous, next)) this.#applyChipChange();
  }

  /** Focus the first control of the inline chip at `index` (chips render in `filters` order). */
  #focusInlineChip(index: number): void {
    const chips = this.#host.nativeElement.querySelectorAll('sd-query-inline-value-chip, sd-query-inline-chip');
    chips[index]?.querySelector<HTMLElement>('input, button, [tabindex]:not([tabindex="-1"])')?.focus();
  }

  /** `01/10 – 31/10/2026` inside one year, `From …` / `To …` when one end is open. */
  #rangeText(filter: Filter, range: Range): string {
    const field = this.fieldOf(filter);
    const hasFrom = hasValue(range.from);
    const hasTo = hasValue(range.to);
    if (field?.type === 'date' && hasFrom && hasTo) {
      const year = this.#dateTime.toFormat(range.from, 'yyyy');
      if (year && year === this.#dateTime.toFormat(range.to, 'yyyy')) {
        return `${this.#dateTime.toFormat(range.from, 'dd/MM')} – ${this.#dateTime.toFormat(range.to, DATE_FORMAT)}`;
      }
    }
    const from = hasFrom ? this.#displayOne(filter, range.from) : '';
    const to = hasTo ? this.#displayOne(filter, range.to) : '';
    if (hasFrom && hasTo) return `${from} – ${to}`;
    if (hasFrom) return this.#i18n.t('core.component.query-bar.range.from', { value: from });
    if (hasTo) return this.#i18n.t('core.component.query-bar.range.to', { value: to });
    return '';
  }

  #displayOne(filter: Filter, raw: any): string {
    const fieldKey = 'field' in filter ? (filter.field as string) : '';
    const field = this.fieldByKey()[fieldKey];
    if (!field) return String(raw);
    if (field.type === 'boolean') {
      // why: nhãn mặc định của field boolean phải theo ngôn ngữ đang chọn; consumer vẫn override
      // được bằng `trueLabel` / `falseLabel` trên chính field.
      const trueLabel = (field as any).trueLabel ?? this.#i18n.t('core.component.query-bar.boolean.true');
      const falseLabel = (field as any).falseLabel ?? this.#i18n.t('core.component.query-bar.boolean.false');
      return raw ? trueLabel : falseLabel;
    }
    if (field.type === 'date' || field.type === 'datetime') {
      // why: chip in đúng định dạng của sd-date / sd-datetime, không in chuỗi model `yyyy/MM/dd` hay ISO.
      return this.#dateTime.toFormat(raw, field.type === 'date' ? DATE_FORMAT : DATETIME_FORMAT) || String(raw);
    }
    if (field.type === 'values' || field.type === 'lazy-values') {
      const opt = (field as any).option;
      const cachedOptions = this.chipPopover()?.editingOptions() ?? [];
      const items = this.#resolveSyncItems(opt?.items) ?? cachedOptions;
      const match = items.find((i: any) => i?.[opt.valueField] === raw);
      if (match) return String(match[opt.displayField]);
      const cached = cachedOptions.find((i: any) => i?.[opt.valueField] === raw);
      if (cached) return String(cached[opt.displayField]);
      return this.#labels().get(fieldKey)?.get(raw) ?? String(raw);
    }
    return String(raw);
  }

  // ---------------------------------------------------------------------------
  // Labels of restored values (values with an items function, lazy-values)
  // ---------------------------------------------------------------------------

  /** `field.key` → value → label, filled by #resolveLabels. Replaced (not mutated) so chips re-render. */
  readonly #labels = signal<ReadonlyMap<string, ReadonlyMap<unknown, string>>>(new Map());
  /** Lookups already started — each runs once per field (values) or per field + value (lazy-values). */
  readonly #labelRequests = new Set<string>();

  #resolveLabels(filter: Filter, fields: Record<string, SdQueryField>): void {
    if (!('field' in filter) || SD_QUERY_NO_DATA_OPERATORS.includes(filter.operator as Operator)) return;
    const field = fields[filter.field as string];
    if (field?.type !== 'values' && field?.type !== 'lazy-values') return;
    const data = (filter as any).data;
    const values: unknown[] = Array.isArray(data) ? data : hasValue(data) ? [data] : [];
    if (!values.length) return;
    const key = field.key as string;
    if (field.type === 'values') {
      const items = field.option.items;
      // why: mảng / signal đã đọc đồng bộ trong #displayOne; chỉ hàm (Promise) mới cần nạp.
      if (typeof items !== 'function' || isSignal(items) || this.#labelRequests.has(key)) return;
      this.#labelRequests.add(key);
      this.#loadLabels(field, () => (items as () => Promise<unknown[]>)());
      return;
    }
    const known = this.#labels().get(key);
    if (values.every(value => known?.has(value))) return;
    const request = `${key}|${this.#stringify(data)}`;
    if (this.#labelRequests.has(request)) return;
    this.#labelRequests.add(request);
    const option = field.option;
    this.#loadLabels(field, () => (option.views ? option.views(values) : option.search({ type: 'VALUE', value: data })));
  }

  #loadLabels(field: SdQueryField, load: () => unknown): void {
    const option = (field as any).option;
    let result: unknown;
    try {
      result = load();
    } catch {
      return;
    }
    const items = isObservable(result) ? firstValueFrom(result) : Promise.resolve(result);
    items
      .then(list => {
        if (!Array.isArray(list) || !list.length) return;
        const next = new Map(this.#labels());
        const labels = new Map(next.get(field.key as string) ?? []);
        for (const item of list) {
          const value = item?.[option.valueField];
          if (value !== undefined) labels.set(value, String(item[option.displayField]));
        }
        next.set(field.key as string, labels);
        this.#labels.set(next);
      })
      // why: tra nhãn thất bại thì chip giữ giá trị thô — không phải lỗi của thanh.
      .catch(() => undefined);
  }

  #stringify(value: unknown): string {
    try {
      return Utilities.canonicalStringify(value);
    } catch {
      return String(value);
    }
  }

  #resolveSyncItems(items: any): any[] | null {
    if (Array.isArray(items)) return items;
    if (isSignal(items)) return (items as any)();
    return null;
  }
}
