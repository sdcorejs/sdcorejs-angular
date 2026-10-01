import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  contentChildren,
  DestroyRef,
  DoCheck,
  effect,
  ElementRef,
  inject,
  input,
  isSignal,
  model,
  numberAttribute,
  OnInit,
  output,
  signal, // THÊM IMPORT NÀY
  Signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormGroupDirective, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher, MatOption, MatOptionSelectionChange, MatPseudoCheckbox } from '@angular/material/core';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelect, MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SdView } from '@sdcorejs/angular/components/view';
import { SdDataState, SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { cloneReadRequest, combineReadStates, SdReadChannel, SdSearchReadState } from '@sdcorejs/angular/utilities/read-state';
import { SdTooltipDirective } from '@sdcorejs/angular/directives';
import { SdItemDefDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  HandleSdCustomValidator,
  SD_FORM_CONFIGURATION,
  SdCustomValidator,
  SdFormControl,
  sdFormControlState,
  SdInlineErrorValidator,
  SdSearch,
  SdSearchReq,
  SdSelectionData,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
  ɵsdTimerScope,
} from '@sdcorejs/angular/forms/models';
import type { SdLabelPlacement } from '@sdcorejs/angular/forms/models';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { ArrayUtilities, StringUtilities, Utilities } from '@sdcorejs/utils/fns';
import { NestedKeyOf, Size } from '@sdcorejs/utils/models';

import { combineLatest, timer } from 'rxjs';
import { debounce, filter, map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import { SdSelectFooterActionDirective, SdSelectFooterActionWhenFn } from './select-footer-action.directive';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

interface SelectReadRequest {
  loader: SdSearch;
  args: SdSearchReq;
  key: string;
  valid: () => boolean;
}

/**
 * why (D-030 V1): value of the single hidden option of the virtual branch. `mat-select` renders its
 * trigger — and so our labels — only while at least one option is selected, but with virtual scrolling
 * most selected options are not rendered. `virtualCompareWith` lets this option stand in for them; it is
 * disabled, hidden, and never reaches the model.
 */
const SD_SELECT_VIRTUAL_SENTINEL = Symbol('sd-select-virtual-sentinel');
/** Rows the virtual viewport shows at most before it scrolls. */
const SD_SELECT_VIRTUAL_ROWS = 6;
/** Same step as Material's key manager (`withPageUpDown()`). */
const SD_SELECT_VIRTUAL_PAGE = 10;
/** Same window as Material's typeahead (`withTypeAhead()`). */
const SD_SELECT_TYPEAHEAD_MS = 200;
const SD_SELECT_VIRTUAL_NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']);

/**
 * why (D-026): the only code in sd-select that touches a Material internal for virtual scrolling —
 * `MatSelect._keyManager`. It keeps Material's active option on the row the component made active, so
 * the trigger's `aria-activedescendant` and Material's own Enter/Tab handling point at that row. Only the
 * active item changes: no styles and no `change` event (which would make Material scroll its panel).
 * Covered by select.virtual-scroll.spec.ts.
 */
class SdSelectVirtualAdapter {
  constructor(private readonly select: () => MatSelect | undefined) {}

  setActive(option: MatOption | undefined): void {
    const manager = this.select()?._keyManager;
    if (!manager || manager.activeItem === (option ?? null)) return;
    if (option) manager.updateActiveItem(option);
    else manager.updateActiveItem(-1);
  }
}

@Component({
  selector: 'sd-select',
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    '[class.sd-bare]': 'isInline()',
    '[class.sd-viewed]': 'isViewed() || isInline()',
    '[class.sd-has-label]': '!!label()',
    '[class.sd-label-top]': "labelPlacement() === 'top'",
  },
  imports: [
    SdDataState,
    SdDataStateTemplateDirective,
    SdTooltipDirective,
    SdIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatPseudoCheckbox,
    MatProgressSpinnerModule,
    SdLabel,
    SdView,
    SdSelectFooterActionDirective,
    SdTranslatePipe,
    ScrollingModule,
  ],
})
export class SdSelect<T extends object | string | number = Record<string, unknown>> implements OnInit, DoCheck {
  id = `I${Utilities.generateUuid()}`;
  /** why: id ổn định của <mat-error> để control trỏ `aria-describedby` sang — thông báo lỗi
   *  phải đọc được từ chính control, không chỉ hiện ra màn hình. */
  readonly errorId = `${this.id}-error`;
  /** id của nhãn/helper khi `labelPlacement='top'` — `mat-select` trỏ `aria-labelledby` sang nhãn. */
  readonly labelId = `${this.id}-label`;
  readonly hintId = `${this.id}-hint`;

  // ==========================================
  // 1. SIGNAL QUERIES & INJECTS
  // ==========================================
  matInputRef = viewChild(MatInput);
  selectRef = viewChild<MatSelect>('select');
  private readonly selectElement = viewChild('select', { read: ElementRef });
  private readonly virtualViewport = viewChild(CdkVirtualScrollViewport);

  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  /**
   * Custom render for the SELECTED value shown in the editable trigger (`<mat-select-trigger>`).
   * Distinct from `#sdValue`/`sdViewDef` which only drive the read-only `viewed`/`inline` face.
   * Context: `{ $implicit, item, items: selectedItems(), display, multiple }` — `item`/`$implicit`
   * is the single selected item object (single mode) or the selected-item array (multiple mode).
   * Falls back to the plain `display` text when not projected, so existing usages are unaffected.
   */
  sdSelectedTemplate = contentChild<TemplateRef<any>>('sdSelected');
  itemDef = contentChild(SdItemDefDefDirective);
  sdViewDef = contentChild(SdViewDefDirective);
  footerActions = contentChildren(SdSelectFooterActionDirective);

  /**
   * View display template. `sdViewDef` is now just a custom override of the view rendering —
   * it replaces the projected `#sdValue` template when present (fed into `<sd-view>`'s
   * `valueTemplate`), so there is ONE rendering path. No more `.sd-view` class / focus-swap;
   * click-to-edit is governed by `viewed='inline'`.
   */
  readonly viewTemplate = computed<TemplateRef<any> | undefined>(() => this.sdViewDef()?.templateRef ?? this.sdValueTemplate());

  #ref = inject(ChangeDetectorRef);
  #formConfiguration = inject(SD_FORM_CONFIGURATION, { optional: true });
  #el = inject(ElementRef);
  readonly #i18n = inject(I18nService);
  // why: focus/mở panel + focus ô search đều hoãn 100ms; handle phải bị clear khi destroy,
  // nếu không callback vẫn chạm selectRef/matInputRef của view đã tháo.
  readonly #timers = ɵsdTimerScope();
  readonly #liveAnnouncer = inject(LiveAnnouncer);
  readonly #dir = inject(Directionality, { optional: true });
  readonly #virtualAdapter = new SdSelectVirtualAdapter(() => this.selectRef());

  // ==========================================
  // 2. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-select-${this.autoIdInput()}` : undefined));

  // E2E data-* attributes
  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataInvalid = computed(() => (this.#state().invalid ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
  readonly dataLoading = computed(() => (this.loading() ? 'true' : 'false'));

  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataErrorMessage = computed(() => {
    void this.#state();
    const msg = this.errorMessage();
    return msg && msg.length > 0 ? msg : null;
  });

  name = input<string>(Utilities.generateUuid());

  size = input<Size>('md');
  // Ghi (TransformT): any (để không bị lỗi typing khi cha truyền vào)
  form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      // Nếu cha truyền vào NgForm (template-driven) -> Bóc lấy FormGroup bên trong
      if (val instanceof NgForm) return val.form;
      // Nếu cha truyền sẵn FormGroup (reactive) -> Lấy luôn
      if (val instanceof FormGroup) return val;
      // Fallback an toàn phòng trường hợp cha truyền 1 object chứa form
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });
  label = input<string | undefined>();
  helperText = input<string | undefined>();
  placeholder = input<string | undefined>();

  // why: KHÔNG dùng input.required. Component nhận `T extends object | string | number` và template
  // có nhánh riêng cho mảng primitive (`@else if (!_valueField && !_displayField)`), nhưng
  // input.required làm nhánh đó không bao giờ tới được: `<sd-select [items]="['a','b']">` ném NG0950
  // ngay lần render đầu vì template đọc valueField()/displayField() trước khi có giá trị.
  // Mặc định '' (giống disabledField) → bỏ trống cả hai = item chính là value + label.
  valueField = input<NestedKeyOf<T> | ''>('');
  displayField = input<NestedKeyOf<T> | ''>('');
  disabledField = input<NestedKeyOf<T> | ''>('');
  cacheChecksum = input<any>();

  limit = input<number>(50);
  /**
   * Virtual scrolling for long lists (opt-in, default `false`). When on, the panel renders only the rows
   * in view, array items are no longer cut by `limit`, and the component — not `mat-select` — owns the
   * value. See sd-select.md, "Virtual scroll".
   */
  readonly virtualScroll = input(false, { transform: booleanAttribute });
  /** Fixed row height in px for the virtual viewport. Default 36 = the panel's compact option row. */
  readonly itemSize = input(36, { transform: numberAttribute });
  hyperlink = input<string | null | undefined>();

  minWidthPanel = input<string | number, string | number | undefined | null>('auto', {
    transform: value => value ?? 'auto',
  });

  hideInlineError = input(false, { transform: booleanAttribute });
  readonly hideReadError = input(false, { transform: booleanAttribute });
  readonly dataStateTemplate = contentChild(SdDataStateTemplateDirective);
  readonly sdReadStateChange = output<SdSearchReadState>();
  readonly #valueRead = new SdReadChannel('VALUE', () => this.#emitReadState());
  readonly #searchRead = new SdReadChannel('SEARCH', () => this.#emitReadState());
  readonly readState = computed(() => combineReadStates(this.#valueRead.state(), this.#searchRead.state()));
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` view + click-to-edit (bare editor). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  multiple = input(false, { transform: booleanAttribute });
  /**
   * Hiện option "Tất cả" đầu panel (chỉ multiple + items là mảng tĩnh/Signal — ẩn với
   * SdSearch lazy vì dataset không xác định). Opt-in, default `false`.
   */
  showSelectAll = input(false, { transform: booleanAttribute });
  /**
   * Whether the `viewed='inline'` text face shows a hover clear-× to empty the value.
   * Default `true`. Set `false` where the HOST owns removal (e.g. `<sd-query-bar>` chips,
   * whose own `×` removes the whole filter) so the chip isn't cluttered with two ×.
   */
  clearable = input(true, { transform: booleanAttribute });

  // Tri-state `viewed` (isViewed / isInline) — shared primitive. In `'inline'` the editor is
  // always rendered (chrome hidden via CSS); the sd-view text face opens the panel on click.
  readonly #viewedState = sdViewedInline(this.viewed, () => this.open(), this.disabled);
  /** `true` when `viewed === 'inline'` — editor mounted but chrome hidden; sd-view text is the trigger face. */
  readonly isInline = this.#viewedState.isInline;
  /** `true` when `viewed === true` — static read-only view, no editor mounted. */
  readonly isViewed = this.#viewedState.isViewed;
  /** Open the picker from the inline text face. No-op unless `viewed='inline'`. */
  enterInlineEdit = (): void => this.#viewedState.enterInlineEdit();

  validator = input<SdCustomValidator | undefined>();
  inlineError = input<string | undefined>();

  /**
   * Tổng hợp error message để hiển thị trong tooltip khi hideInlineError = true.
   */
  // why: `required` và `inlineError` PHẢI được đọc VÔ ĐIỀU KIỆN. Connector cài/gỡ validator bằng
  // `updateValueAndValidity({ emitEvent: false })` → `formControl.errors` đổi mà KHÔNG phát event
  // nào → `#state` (sdFormControlState) không tick. Nếu computed chỉ phụ thuộc `#state` thì bật
  // `[required]` (hoặc set `[inlineError]`) lúc RUNTIME sẽ giữ nguyên message cũ dưới OnPush:
  // control invalid, viền đỏ, nhưng KHÔNG có chữ. Đọc trong nhánh `errors[...]` là không đủ — lần
  // chạy "không lỗi" thoát sớm ở `if (!errors)` nên không đăng ký được dependency nào.
  // `customValidator` thì an toàn: nó tới từ async validator, `setErrors` mặc định CÓ phát event.
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    void this.required();
    const inlineError = this.inlineError();
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.select.required');
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return inlineError;
    return undefined;
  });

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.#formConfiguration?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');
  /** `'float'` (mặc định) hoặc `'top'` — nhãn tĩnh phía trên, helper text dưới control. */
  labelPlacement = input<SdLabelPlacement>('float');

  // Mở rộng kiểu dữ liệu cho phép nhận Signal từ bên ngoài truyền vào
  items = input<undefined | null | T[] | SdSearch | Signal<T[]>>();

  valueModel = model<boolean | number | string | (number | string)[] | undefined | null>(undefined, { alias: 'model' });

  // ==========================================
  // 3. SIGNAL OUTPUTS
  // ==========================================
  sdChange = output<any>();
  sdSelection = output<SdSelectionData>();

  // ==========================================
  // 4. INTERNAL STATE & STREAMS
  // ==========================================
  formControl = new SdFormControl();
  // why: validator đi qua connector (addValidators/removeValidators — additive) thay vì
  // clearValidators()+clearAsyncValidators()+setValidators() như trước. `formControl` là public API,
  // consumer hoàn toàn có thể tự gắn validator lên nó; cách cũ xoá SẠCH những validator đó mỗi lần
  // required/[validator]/inlineError đổi. Connector chỉ thêm/gỡ đúng phần component sở hữu.
  readonly #formConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: this.name,
    control: computed(() => this.formControl),
    required: this.required,
    validators: computed(() => (this.inlineError() ? [SdInlineErrorValidator] : null)),
    asyncValidators: computed(() => {
      const custom = this.validator();
      return custom ? [HandleSdCustomValidator(custom)] : null;
    }),
  });
  inputControl = new FormControl('');

  loading = signal<boolean>(false);
  focused = signal<boolean>(false);
  allSelected = false;

  #cache: Record<string, any[]> = {};
  #allItem: Record<string, any> = {};
  #searchRequestId = 0;
  #destroyed = false;
  #searchDebouncing = false;
  #failedValue?: SelectReadRequest;
  #failedSearch?: SelectReadRequest;
  #pendingValue?: { request: SelectReadRequest; result: Promise<any[] | undefined> };
  #pendingSearch?: { request: SelectReadRequest; result: Promise<any[] | undefined> };
  #valueCache: Record<string, any[]> = {};
  #hashedValue?: string;

  // [NÂNG CẤP]: Xử lý Unwrap (Mở hộp) Signal lồng nhau nếu có
  actualItems = computed(() => {
    const rawItems = this.items();
    // Nếu cha truyền vào một biến Signal, ta cần gọi rawItems() để lấy mảng thật
    if (isSignal(rawItems)) {
      return rawItems();
    }
    return rawItems;
  });

  // Thay vì toObservable(this.items), ta observe cái actualItems đã được unwrap
  #items$ = toObservable(
    computed(() => ({
      items: this.actualItems(),
      checksum: this.cacheChecksum(),
      valueField: this.valueField(),
      displayField: this.displayField(),
      // why: switching virtualScroll re-runs the pipeline, since only the non-virtual list is cut at `limit`.
      virtualScroll: this.virtualScroll(),
    }))
  ).pipe(map(context => context.items));
  #valueModel$ = toObservable(this.valueModel);

  filteredItems = signal<T[]>([]);
  selectedItems = signal<T[]>([]);
  display = signal<string>('');
  calculatedPanelWidth = signal<string | number>('auto');

  readonly searchText = signal<string>('');
  readonly footerActionContext = computed(() => ({
    searchText: this.searchText(),
    filteredItems: this.filteredItems() as T[],
    selectedItems: this.selectedItems() as T[],
  }));
  readonly #footerFnVisibility = signal<WeakMap<SdSelectFooterActionDirective, boolean>>(new WeakMap());
  readonly visibleFooterActions = computed(() => this.footerActions().filter(action => this.shouldRenderFooterAction(action)));

  // ==========================================
  // VIRTUAL SCROLL (opt-in) — D-026: the component owns the value; D-030 V1: Material shell + one sentinel
  // ==========================================
  /** Value bound one-way to the virtual shell; the shell never writes it back (no `formControl` on it). */
  protected readonly virtualShellValue = computed(() => {
    const value = this.normalizedValue();
    if (this.multiple()) return Array.isArray(value) ? value : [];
    return value ?? null;
  });
  protected readonly virtualSentinel = SD_SELECT_VIRTUAL_SENTINEL;
  protected readonly virtualPanelClass = {
    single: ['sd-select-panel', 'sd-select-virtual'],
    multiple: ['sd-select-panel', 'sd-multiple', 'sd-select-virtual'],
  };
  /** A rendered option matches its own value; the sentinel matches any value whose option is not rendered. */
  protected readonly virtualCompareWith = (optionValue: unknown, value: unknown): boolean =>
    value != null && (optionValue === value || optionValue === SD_SELECT_VIRTUAL_SENTINEL);
  /** The virtual shell cannot see `formControl`, so the component supplies Material's error state. */
  protected readonly virtualErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (_control: unknown, form: FormGroupDirective | NgForm | null) =>
      !!(this.formControl.invalid && (this.formControl.touched || form?.submitted)),
  };
  /** Same rule as the non-virtual template: rows render when both fields are set, or neither. */
  protected readonly virtualRenderable = computed(() => !this.valueField() === !this.displayField());
  protected readonly virtualViewportHeight = computed(
    () => Math.min(this.filteredItems().length, SD_SELECT_VIRTUAL_ROWS) * this.itemSize()
  );
  protected readonly virtualTrackBy = (_index: number, item: T): unknown => this.itemValue(item);
  /** Stable id per row index: aria-activedescendant targets and finds the rendered option by it. */
  protected readonly virtualOptionId = (index: number): string => `${this.id}-option-${index}`;
  /** Context of `#sdSelected` in the virtual branch — the same shape as the non-virtual templates. */
  protected readonly selectedTemplateContext = computed(() => {
    const items = this.selectedItems();
    const display = this.display();
    return this.multiple()
      ? { $implicit: items, item: items, items, display, multiple: true }
      : { $implicit: items[0], item: items[0], items, display, multiple: false };
  });

  /** Row the keyboard made active, tracked by value so re-sorting the list keeps it. */
  readonly #virtualActiveKey = signal<{ value: unknown } | null>(null);
  /** Index of the active row in the full filtered list, or -1. */
  readonly virtualActiveIndex = computed(() => {
    const key = this.#virtualActiveKey();
    if (!key || !this.virtualScroll()) return -1;
    return this.filteredItems().findIndex(item => this.itemValue(item) === key.value);
  });
  readonly #virtualRange = signal({ start: 0, end: 0 });
  /** `aria-activedescendant` of the search box: the active row, only while it is rendered. */
  protected readonly virtualActiveDescendant = computed(() => {
    const index = this.virtualActiveIndex();
    const range = this.#virtualRange();
    return index >= range.start && index < range.end ? this.virtualOptionId(index) : null;
  });
  /** Labels folded like the search box (no diacritics, lower case), computed once per list for typeahead. */
  readonly #virtualLabels = computed(() => this.filteredItems().map(item => StringUtilities.changeAliasLowerCase(this.itemDisplay(item))));
  #typeahead = '';
  #typeaheadAt = 0;

  normalizedValue = computed(() => {
    const val = this.valueModel();
    if (this.multiple() && val !== undefined && val !== null && !Array.isArray(val)) {
      return [val];
    }
    return val;
  });

  filtered = computed(() => {
    const data = this.actualItems();
    if (typeof data === 'function') return true;
    if (Array.isArray(data)) return data.filter(e => e != null).length > 10;
    return false;
  });

  delayTime = computed(() => (typeof this.actualItems() === 'function' ? 500 : 0));

  /**
   * Scope của "Tất cả": item enabled khớp search text hiện tại, tính trên MẢNG NGUỒN
   * `actualItems()`.
   */
  // why: KHÔNG đọc filteredItems — nó đã bị cắt theo `limit` paging nên tick all sẽ thiếu item;
  // luật khớp search phải trùng với filter của allItems$ (aliasIncludes trên cả value + display).
  readonly selectAllScope = computed<T[]>(() => {
    const data = this.actualItems();
    if (!Array.isArray(data)) return [];
    const sText = this.searchText() || '';
    return (data as T[]).filter(item => {
      if (item == null || this.itemDisabled(item)) return false;
      return StringUtilities.aliasIncludes(this.itemValue(item), sText) || StringUtilities.aliasIncludes(this.itemDisplay(item), sText);
    });
  });

  /** Row "Tất cả" chỉ render khi opt-in + multiple + items tĩnh + scope có item để thao tác. */
  readonly selectAllVisible = computed(
    () => this.showSelectAll() && this.multiple() && Array.isArray(this.actualItems()) && this.selectAllScope().length > 0
  );

  /** Trạng thái checkbox "Tất cả", tính trên items ENABLED trong scope (item disabled bỏ qua). */
  readonly selectAllState = computed<'checked' | 'indeterminate' | 'unchecked'>(() => {
    const scope = this.selectAllScope();
    const val = this.normalizedValue();
    const selected = new Set((Array.isArray(val) ? val : []).map(v => String(v)));
    if (!scope.length || !selected.size) return 'unchecked';
    let count = 0;
    for (const item of scope) {
      if (selected.has(String(this.itemValue(item)))) count++;
    }
    if (count === 0) return 'unchecked';
    return count === scope.length ? 'checked' : 'indeterminate';
  });

  // ==========================================
  // 5. GETTER & HELPERS
  // ==========================================
  itemValue = (item: T): unknown => {
    const path = this.valueField();
    if (!path || item == null) return item;
    return Utilities.getNestedValue(item, path as string);
  };

  itemDisplay = (item: T): string => {
    const path = this.displayField();
    if (!path || item == null) return String(item ?? '');
    return String(Utilities.getNestedValue(item, path as string) ?? '');
  };

  itemDisabled = (item: T): boolean => {
    const path = this.disabledField();
    if (!path || item == null) return false;
    return Boolean(Utilities.getNestedValue(item, path as string));
  };

  shouldRenderFooterAction(action: SdSelectFooterActionDirective): boolean {
    const when = action.when();

    if (typeof when === 'function') {
      return this.#footerFnVisibility().get(action) ?? false;
    }

    if (when === 'always') return true;
    if (when === 'empty') {
      return this.searchText().trim().length > 0 && this.filteredItems().length === 0;
    }
    if (when === 'has-result') return this.filteredItems().length > 0;
    return false;
  }

  setNestedValue = (obj: any, path: string, value: any) => {
    if (!path) return;
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  };

  #addToDict = (dataList: any[]) => {
    if (!this.valueField()) return;
    dataList.forEach(e => {
      const k = this.itemValue(e);
      if (k != null) this.#allItem[String(k)] = e;
    });
  };

  tooltip = computed(() => {
    const items = this.selectedItems();
    if (!items || !items.length) return '';
    if (this.multiple()) {
      return [
        this.#i18n.t('core.form.select.selected-count', { count: items.length }),
        ...items.map(item => `• ${this.itemDisplay(item)}`),
      ].join('\n');
    }
    const vF = this.valueField();
    return items.map(item => (vF ? `• ${this.itemValue(item)} - ${this.itemDisplay(item)}` : `• ${item}`)).join('\n');
  });

  updatePanelWidth = () => {
    let minWInput = this.minWidthPanel();
    // why: inline mode — trigger là text hẹp (.sd-inline-view), panel tối thiểu 200px cho dễ đọc options.
    if (this.isInline() && (!minWInput || minWInput === 'auto')) minWInput = '200px';
    if (!minWInput || minWInput === 'auto') {
      this.calculatedPanelWidth.set('auto');
      return;
    }

    const minWStr = String(minWInput).trim().toLowerCase();
    if (!minWStr.endsWith('px') && isNaN(Number(minWStr))) {
      this.calculatedPanelWidth.set(minWInput);
      return;
    }

    const hostWidth = this.#el.nativeElement.getBoundingClientRect().width;
    const minW = parseFloat(minWStr);

    if (hostWidth >= minW) {
      this.calculatedPanelWidth.set('auto');
    } else {
      this.calculatedPanelWidth.set(minWInput);
    }
  };

  #destroyRef = inject(DestroyRef);

  constructor() {
    // why: CDK dispatch keydown ở body capture; bắt Tab sớm hơn nhưng chỉ trong control/panel này.
    this.#el.nativeElement.ownerDocument.addEventListener('keydown', this.focusReadRetry, true);
    this.#destroyRef.onDestroy(() => {
      this.#destroyed = true;
      this.#el.nativeElement.ownerDocument.removeEventListener('keydown', this.focusReadRetry, true);
      this.#valueRead.invalidate();
      this.#searchRead.invalidate();
      ++this.#searchRequestId;
    });
    effect(() => {
      this.actualItems();
      this.valueModel();
      this.valueField();
      this.displayField();
      this.cacheChecksum();
      untracked(() => {
        if ((this.#failedValue && !this.#failedValue.valid()) || (this.#pendingValue && !this.#pendingValue.request.valid())) {
          this.#failedValue = undefined;
          this.#pendingValue = undefined;
          this.#valueRead.invalidate();
        }
      });
    });
    effect(() => {
      const val = this.normalizedValue();
      untracked(() => {
        const current = this.formControl.value;
        const isDiff = Array.isArray(val) && Array.isArray(current) ? JSON.stringify(val) !== JSON.stringify(current) : val !== current;

        if (isDiff) {
          this.formControl.setValue(val, { emitEvent: false });
        }
      });
    });

    effect(() => {
      if (this.disabled()) this.formControl.disable({ emitEvent: false });
      else this.formControl.enable({ emitEvent: false });
    });

    effect(() => {
      const actions = this.footerActions();
      const context = this.footerActionContext();

      const fnActions: { action: SdSelectFooterActionDirective; fn: SdSelectFooterActionWhenFn }[] = [];
      for (const action of actions) {
        const when = action.when();
        if (typeof when === 'function') fnActions.push({ action, fn: when });
      }

      if (!fnActions.length) return;

      // why: Promise.all chạy ngoài reactive context — không tạo circular dependency
      Promise.all(
        fnActions.map(async ({ action, fn }) => ({
          action,
          result: await Promise.resolve(fn(context)),
        }))
      ).then(results => {
        const map = new WeakMap<SdSelectFooterActionDirective, boolean>();
        results.forEach(({ action, result }) => map.set(action, result));
        this.#footerFnVisibility.set(map);
        this.#ref.markForCheck();
      });
    });

    // Virtual scroll wiring. Each effect removes its listener when the virtual branch goes away.
    effect(onCleanup => {
      const select = this.selectRef();
      if (!select || !this.virtualScroll()) return;
      const selections = select.optionSelectionChanges.subscribe(this.#onVirtualOptionSelection);
      // why: Material re-syncs its selection in a microtask queued when the options change (and moves its
      // active option there); queue after it so Material's active option points back at ours.
      const options = select.options.changes.subscribe(() => Promise.resolve().then(() => this.#syncVirtualKeyManager()));
      onCleanup(() => {
        selections.unsubscribe();
        options.unsubscribe();
      });
    });
    effect(onCleanup => {
      const element: HTMLElement | undefined = this.selectElement()?.nativeElement;
      if (!element || !this.virtualScroll()) return;
      // why: capture phase on the trigger runs before MatSelect's own keydown listener on the same element.
      element.addEventListener('keydown', this.#onVirtualTriggerKeydown, true);
      onCleanup(() => element.removeEventListener('keydown', this.#onVirtualTriggerKeydown, true));
    });
    effect(onCleanup => {
      const viewport = this.virtualViewport();
      if (!viewport) return;
      this.#virtualRange.set(viewport.getRenderedRange());
      const range = viewport.renderedRangeStream.subscribe(value => this.#virtualRange.set(value));
      onCleanup(() => range.unsubscribe());
    });
  }

  ngDoCheck(): void {
    // why: MatSelect refreshes its error state in its own ngDoCheck only when it has an NgControl; the
    // virtual shell has none, so refresh it at the same cadence here.
    if (this.virtualScroll()) this.selectRef()?.updateErrorState();
  }

  ngOnInit() {
    this.formControl.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(val => {
      const currentModel = this.valueModel();
      const isDiff =
        Array.isArray(val) && Array.isArray(currentModel) ? JSON.stringify(val) !== JSON.stringify(currentModel) : val !== currentModel;

      if (isDiff) {
        this.valueModel.set(val);
      }
    });

    this.formControl.sdChanges.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(() => this.#ref.markForCheck());

    const cleanItems$ = this.#items$.pipe(
      tap(() => {
        this.#cache = {};
        this.#allItem = {};
        this.#valueCache = {};
        this.#failedValue = this.#failedSearch = undefined;
        this.#pendingValue = this.#pendingSearch = undefined;
        this.#valueRead.invalidate();
        this.#searchRead.invalidate();
        ++this.#searchRequestId;
        this.inputControl.setValue('');
      }),
      map(items => {
        if (!items) return [];
        if (Array.isArray(items)) return items.filter(e => e !== null && e !== undefined);
        return items;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const search$ = this.inputControl.valueChanges.pipe(
      startWith(''),
      tap(searchText => {
        const text = searchText?.toString() || '';
        if (text !== this.searchText()) {
          ++this.#searchRequestId;
          this.#failedSearch = undefined;
          this.#pendingSearch = undefined;
          this.#searchRead.invalidate();
        }
        this.searchText.set(text);
      }),
      tap(() => {
        if (typeof this.actualItems() === 'function' && this.focused()) {
          this.#searchDebouncing = true;
          this.loading.set(true);
          this.#ref.markForCheck();
        }
      }),
      debounce(() => timer(this.delayTime()))
    );

    const allItems$ = combineLatest([cleanItems$, search$, this.#valueModel$]).pipe(
      switchMap(async ([items, searchText]) => {
        const sText = searchText || '';
        const formValue = this.valueModel();
        const vField = this.valueField();

        if (typeof items === 'function') {
          return await this.#loadItems(sText, items);
        }

        this.#addToDict(items);
        const isArray = Array.isArray(formValue);
        const hasFields = !!vField && !!this.displayField();

        const filteredList = items.filter(item => {
          const value = hasFields ? this.itemValue(item) : item;
          const display = hasFields ? this.itemDisplay(item) : item;
          if (StringUtilities.aliasIncludes(value, sText) || StringUtilities.aliasIncludes(display, sText)) return true;
          if (isArray) return formValue.some((e: any) => e === value);
          return formValue === value;
        });

        // Khi filtered mode bật và multiple=true, luôn đẩy item đã chọn lên trên
        // để user dễ nhìn thấy selection hiện tại, kể cả dataset chưa vượt limit.
        const shouldPinSelectedFirst = this.filtered() && this.multiple() && isArray;
        if (!shouldPinSelectedFirst && items.length <= this.limit()) return filteredList;

        return filteredList.sort((current, next) => {
          const value1 = hasFields ? this.itemValue(current) : current;
          const value2 = hasFields ? this.itemValue(next) : next;
          let flag1 = 0;
          let flag2 = 0;
          if (isArray) {
            flag1 = formValue.some((e: any) => e === value1) ? 1 : 0;
            flag2 = formValue.some((e: any) => e === value2) ? 1 : 0;
            return flag2 - flag1;
          }
          flag1 = formValue === value1 ? 1 : 0;
          flag2 = formValue === value2 ? 1 : 0;
          return flag2 - flag1;
        });
      }),
      filter((items): items is any[] => items !== undefined),
      tap(() => this.#syncReadLoading())
    );

    const selectedItems$ = combineLatest([cleanItems$, this.#valueModel$]).pipe(
      switchMap(async ([items, val]) => {
        const vField = this.valueField();
        const dField = this.displayField();

        if (val === undefined || val === null || val === '') {
          this.#failedValue = undefined;
          this.#valueRead.invalidate();
          return [];
        }

        const values = Array.isArray(val) ? val : [val];
        if (!vField) return values;

        if (typeof items === 'function') {
          return await this.#loadSelectedItems(val, items as SdSearch);
        }

        return values.map(value => {
          return (
            (items as any[])?.find(item => this.itemValue(item) === value) || {
              [vField]: value,
              [dField]: value,
            }
          );
        });
      }),
      filter((items): items is any[] => items !== undefined),
      // why: selectedItems và display cùng dùng một request VALUE, kể cả khi retry.
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const filteredItems$ = allItems$.pipe(map(this.#visibleItems));

    const display$ = selectedItems$.pipe(
      map(items => items?.map(item => (this.displayField() ? this.itemDisplay(item) : item))?.join(', ') || '')
    );

    filteredItems$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(val => {
      this.filteredItems.set(val || []);
      this.#ref.markForCheck();
    });
    selectedItems$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(val => {
      this.selectedItems.set(val || []);
      this.#ref.markForCheck();
    });
    display$.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(val => {
      this.display.set(val || '');
      this.#ref.markForCheck();
    });
  }

  /** Rows the panel shows: the non-virtual list is cut at `limit`; the virtual list is not (D-026). */
  #visibleItems = (allItems: T[]): T[] => (this.virtualScroll() ? allItems : this.#pageReadItems(allItems));

  #pageReadItems = (allItems: T[]): T[] => {
    const limit = this.limit();
    const val = this.valueModel();
    if (!this.multiple() || !Array.isArray(val) || val.length === 0) return ArrayUtilities.paging(allItems, limit);
    // why: giữ toàn bộ selection và thêm limit item chưa chọn, kể cả sau retry.
    const selectedSet = new Set(val.map(String));
    const selected: T[] = [];
    const unselected: T[] = [];
    for (const item of allItems) {
      const value = this.valueField() ? String(this.itemValue(item) ?? '') : String(item ?? '');
      (selectedSet.has(value) ? selected : unselected).push(item);
    }
    return [...selected, ...ArrayUtilities.paging(unselected, limit)];
  };

  #readRegion = (): HTMLElement | null => this.selectRef()?.panel?.nativeElement.querySelector('.sd-read-state-region') ?? null;

  protected focusReadRetry = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab' || event.shiftKey || !this.selectRef()?.panelOpen) return;
    const region = this.#readRegion();
    if (!(event.target instanceof Node) || region?.contains(event.target)) return;
    if (!this.#el.nativeElement.contains(event.target) && !this.selectRef()?.panel?.nativeElement.contains(event.target)) return;
    const button = region?.querySelector<HTMLElement>('button:not([disabled]), [tabindex="0"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.focus();
  };

  protected onReadRegionKeydown = (event: KeyboardEvent): void => {
    event.stopPropagation();
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape' || event.shiftKey) event.preventDefault();
      this.selectRef()?.focus();
      this.selectRef()?.close();
    }
  };

  #loadSelectedItems = async (value: any, items: SdSearch, retry = false): Promise<any[] | undefined> => {
    if (value === undefined || value === null || value === '') return [];

    const values = cloneReadRequest(Array.isArray(value) ? value : [value]);
    const vField = this.valueField();
    const dField = this.displayField();

    if (!vField && !dField) return values;

    const request = this.#createReadRequest(items, { type: 'VALUE', value: cloneReadRequest(value) });
    if (!request.valid()) return undefined;
    if (this.#pendingValue?.request.key === request.key && this.#pendingValue.request.valid()) {
      await this.#pendingValue.result;
    } else if (!retry && this.#failedValue?.key === request.key && this.#failedValue.valid()) {
      // why: mở panel/search không tự retry hoặc che lỗi VALUE còn hiệu lực.
    } else {
      const revision = this.#valueRead.begin(request.valid);
      this.#failedValue = undefined;
      const cached = this.#valueCache[request.key];
      if (!retry && (cached !== undefined || values.every(val => this.#allItem[String(val)] !== undefined))) {
        this.#valueRead.succeed(revision, cached?.length ?? values.length);
      } else {
        const result = (async () => {
          try {
            const results = (await items(cloneReadRequest(request.args))) || [];
            if (!this.#valueRead.isCurrent(revision)) return undefined;
            this.#addToDict(results);
            this.#valueCache[request.key] = results;
            this.#valueRead.succeed(revision, results.length);
            return results;
          } catch (error) {
            if (this.#valueRead.isCurrent(revision)) {
              this.#failedValue = request;
              this.#valueRead.fail(revision, error);
            }
            return undefined;
          } finally {
            if (this.#pendingValue?.request === request) this.#pendingValue = undefined;
            this.#syncReadLoading();
          }
        })();
        this.#pendingValue = { request, result };
        await result;
        if (this.#pendingValue?.request === request) this.#pendingValue = undefined;
      }
    }
    if (!request.valid()) return undefined;

    return values.map(val => {
      if (this.#allItem[val?.toString()]) return this.#allItem[val?.toString()];
      const dummy = {};
      this.setNestedValue(dummy, vField, val);
      if (dField) this.setNestedValue(dummy, dField, val);
      return dummy;
    });
  };

  #loadItems = async (searchText: string | undefined | null, items: SdSearch, retry = false): Promise<any[] | undefined> => {
    searchText = searchText?.toString() || '';
    const key = Utilities.hash({ checksum: this.cacheChecksum() || null, searchText });
    const request = this.#createReadRequest(items, { type: 'SEARCH', searchText });
    if (!request.valid()) return undefined;
    this.#searchDebouncing = false;
    if (this.#pendingSearch?.request.key === request.key && this.#pendingSearch.request.valid()) {
      await this.#pendingSearch.result;
    } else if (!retry && this.#failedSearch?.key === request.key && this.#failedSearch.valid()) {
      // why: thất bại không ghi [] vào cache và không tự retry do subscription khác.
    } else if (this.#cache[key] !== undefined && !retry) {
      const revision = this.#searchRead.begin(request.valid);
      this.#searchRead.succeed(revision, this.#cache[key].length);
    } else if (this.focused() || retry) {
      const currentRequestId = ++this.#searchRequestId;
      const revision = this.#searchRead.begin(() => request.valid() && currentRequestId === this.#searchRequestId);
      this.#failedSearch = undefined;
      const result = (async () => {
        try {
          const results = (await items(cloneReadRequest(request.args))) || [];
          if (!this.#searchRead.isCurrent(revision)) return undefined;
          this.#addToDict(results);
          const unique = new Map();
          results.forEach(item => {
            const value = this.itemValue(item as T);
            if (value != null && !unique.has(value)) unique.set(value, item);
          });
          this.#cache[key] = Array.from(unique.values());
          this.#searchRead.succeed(revision, results.length);
          return results;
        } catch (error) {
          if (this.#searchRead.isCurrent(revision)) {
            this.#failedSearch = request;
            this.#searchRead.fail(revision, error);
          }
          return undefined;
        } finally {
          if (this.#pendingSearch?.request === request) this.#pendingSearch = undefined;
          this.#syncReadLoading();
        }
      })();
      this.#pendingSearch = { request, result };
      await result;
      if (this.#pendingSearch?.request === request) this.#pendingSearch = undefined;
    }

    // why: continuation của loader cũ không được mở revision VALUE sau khi đổi items/context.
    if (!request.valid()) return undefined;
    const selectedItems = await this.#loadSelectedItems(this.valueModel(), items);

    if (!request.valid() || selectedItems === undefined) return undefined;

    const finalMap = new Map();
    [...selectedItems, ...(this.#cache[key] || [])].forEach(e => {
      const k = this.itemValue(e);
      if (k != null && !finalMap.has(k)) finalMap.set(k, e);
    });
    return Array.from(finalMap.values());
  };

  #createReadRequest = (loader: SdSearch, args: SdSearchReq): SelectReadRequest => {
    const checksum = Utilities.hash({ checksum: this.cacheChecksum(), valueField: this.valueField(), displayField: this.displayField() });
    const key = Utilities.hash({ checksum, args });
    return {
      loader,
      args: cloneReadRequest(args),
      key,
      valid: () =>
        !this.#destroyed &&
        this.actualItems() === loader &&
        checksum === Utilities.hash({ checksum: this.cacheChecksum(), valueField: this.valueField(), displayField: this.displayField() }) &&
        key ===
          Utilities.hash({
            checksum,
            args:
              args.type === 'VALUE'
                ? { type: 'VALUE', value: this.valueModel() }
                : { type: 'SEARCH', searchText: this.inputControl.value || '' },
          }),
    };
  };

  #syncReadLoading = () => {
    if (this.#destroyed) return;
    this.loading.set(
      this.#searchDebouncing || this.#valueRead.state().status === 'loading' || this.#searchRead.state().status === 'loading'
    );
    this.#ref.markForCheck();
  };

  #emitReadState = () => {
    if (this.#destroyed) return;
    this.#syncReadLoading();
    this.sdReadStateChange.emit(this.readState());
  };

  /** Retry the error selected by readState; VALUE and SEARCH retain separate snapshots. */
  retryRead = async (): Promise<void> => {
    const state = this.readState();
    if (state.status !== 'error') return;
    const request = state.operation === 'VALUE' ? this.#failedValue : this.#failedSearch;
    if (!request || !request.valid()) return;
    if (this.#readRegion()?.contains(this.#el.nativeElement.ownerDocument.activeElement)) this.selectRef()?.focus();
    if (state.operation === 'VALUE') {
      const items = await this.#loadSelectedItems(request.args.value, request.loader, true);
      if (!request.valid() || !items) return;
      this.selectedItems.set(items);
      this.display.set(items.map(item => this.itemDisplay(item)).join(', '));
      const selectedKeys = new Set(items.map(item => this.itemValue(item)));
      this.filteredItems.set([...items, ...this.filteredItems().filter(item => !selectedKeys.has(this.itemValue(item)))]);
    } else {
      const items = await this.#loadItems(request.args.searchText, request.loader, true);
      if (!request.valid() || !items) return;
      this.filteredItems.set(this.#visibleItems(items));
    }
    this.#syncReadLoading();
  };

  onSelectionChange = (change: MatSelectChange) => {
    this.allSelected = !this.selectRef()?.options.some(e => !e.selected);
    const value = change?.value ?? '';
    // why: KHÔNG dùng { emitEvent: false } khi mirror giá trị chọn sang formControl. formControl mang
    // async [validator] (HandleSdCustomValidator). CVA của mat-select đã setValue (có event) trước khi
    // (selectionChange) chạy; setValue im lặng ở đây HUỶ lần async đang pending đó rồi chạy lại im →
    // setErrors lúc resolve cũng im → #state (sdFormControlState) không tick → errorMessage không
    // recompute → viền đỏ nhưng KHÔNG có message.
    // NHƯNG cũng KHÔNG được setValue vô điều kiện: control lúc này ĐÃ mang đúng giá trị (CVA vừa ghi),
    // nên ghi lại sẽ phát valueChanges LẦN HAI trên chính control và trên FormGroup cha, đồng thời
    // khởi động lại async [validator] hai lần cho mỗi lần chọn. Guard `!==` giữ đúng MỘT event:
    // đi qua UI thì CVA lo, gọi trực tiếp (programmatic/test) thì nhánh setValue lo.
    if (this.multiple()) {
      const next = value || [];
      if (this.formControl.value !== next) this.formControl.setValue(next);
      this.#onChange(next);
    } else {
      this.clearSearch();
      if (this.formControl.value !== value) this.formControl.setValue(value);
      this.#onChange(value);
    }
  };

  /**
   * Toggle "Tất cả" theo scope hiện tại (items enabled khớp search):
   * - Đang `checked` → BỎ chọn các value trong scope (giữ value ngoài scope, kể cả item disabled đã chọn).
   * - Ngược lại → CHỌN THÊM toàn bộ scope, union với selection hiện có (additive khi đang search).
   */
  // why: KHÔNG emit sdChange/sdSelection ở đây — giữ đúng semantics hiện hành: hai output đó chỉ
  // bắn khi panel đóng với giá trị đổi (onOpenedChange so hash).
  // why: setValue KHÔNG dùng { emitEvent: false } — cùng lý do như onSelectionChange: formControl
  // mang async [validator], setValue im lặng sẽ huỷ lần async pending rồi chạy lại im → setErrors
  // không phát event → #state không tick → errorMessage stale (viền đỏ mà không có message).
  // Guard `!==` giữ đúng MỘT event: đây là đường programmatic nên nhánh setValue luôn chạy.
  toggleSelectAll = (): void => {
    const scope = this.selectAllScope();
    if (!scope.length) return;

    const current = this.normalizedValue();
    // why: normalizedValue có nhánh bọc scalar boolean thành mảng — với multiple thực tế value là
    // (number | string)[], cast để khớp chữ ký #onChange.
    const currentArr: (number | string)[] = Array.isArray(current) ? ([...current] as (number | string)[]) : [];
    const scopeValues = scope.map(item => this.itemValue(item) as number | string);

    let next: (number | string)[];
    if (this.selectAllState() === 'checked') {
      const scopeKeys = new Set(scopeValues.map(v => String(v)));
      next = currentArr.filter(v => !scopeKeys.has(String(v)));
    } else {
      const existing = new Set(currentArr.map(v => String(v)));
      next = [...currentArr, ...scopeValues.filter(v => !existing.has(String(v)))];
    }

    if (this.formControl.value !== next) this.formControl.setValue(next);
    this.#onChange(next);
  };

  reValidate = () => {
    this.formControl.updateValueAndValidity({ emitEvent: true });
  };

  // Chỉ cập nhật model binding, KHÔNG emit event.
  // sdChange + sdSelection sẽ chỉ được emit khi panel đóng (onOpenedChange).
  #onChange = async (value: boolean | number | string | (number | string)[]) => {
    this.valueModel.set(value);
  };

  clear = ($event?: any) => {
    $event?.stopPropagation();
    if (this.multiple()) {
      this.formControl.setValue([]);
      this.valueModel.set([]);
      this.sdChange.emit([]);
      this.sdSelection.emit({ multiple: true, values: [], selectedItems: [], value: undefined, selectedItem: undefined });
    } else {
      this.formControl.setValue(null);
      this.valueModel.set(null);
      this.sdChange.emit(null);
      this.sdSelection.emit({ multiple: false, values: [], selectedItems: [], value: null, selectedItem: null });
    }
  };

  onClick = () => {
    this.updatePanelWidth();
    if (this.sdViewDef()?.templateRef) {
      if (!this.formControl.disabled && !this.focused()) this.focus();
    }
  };

  /**
   * Bấm nhãn rời (`labelPlacement='top'`) focus `mat-select` — như `<label for>` với input gốc.
   * why: `mat-select` không phải phần tử "labelable" nên `for` không có tác dụng; chỉ focus, KHÔNG
   * mở panel (hành vi giống select gốc).
   */
  onLabelClick = () => {
    if (this.formControl.disabled) return;
    this.selectRef()?.focus();
  };

  focus = () => {
    this.focused.set(true);
    this.updatePanelWidth();
    // why: vẫn 100ms như cũ — chỉ scope handle theo DestroyRef. Mở panel trên mat-select đã
    // destroy sẽ dựng overlay mồ côi không ai đóng.
    this.#timers.schedule(() => {
      this.selectRef()?.focus();
      this.selectRef()?.open();
    }, 100);
  };

  /** Clears the panel search/filter input and resets `searchText`. */
  clearSearch = (): void => {
    const input = this.matInputRef();
    if (input) {
      input.value = '';
    }
    this.inputControl.setValue('');
  };

  /** Open the select panel programmatically (anchors to the mat-select trigger). */
  open = () => {
    if (this.formControl.disabled) return;
    // why: signal write từ updatePanelWidth() chưa qua CD trong cùng tick → mat-select
    // sẽ đọc [panelWidth] cũ và panel co lại theo bare trigger. Gán trực tiếp panelWidth
    // lên mat-select instance để open() thấy giá trị mới ngay, không phải chờ CD.
    this.updatePanelWidth();
    const ref = this.selectRef();
    if (!ref) return;
    (ref as { panelWidth: string | number }).panelWidth = this.calculatedPanelWidth();
    ref.open();
  };

  onOpenedChange = (isOpened: boolean) => {
    if (isOpened) {
      this.focused.set(true);
      this.clearSearch();
      // why: vẫn 100ms như cũ — chỉ scope handle theo DestroyRef.
      this.#timers.schedule(() => this.matInputRef()?.focus(), 100);
      this.#hashedValue = Utilities.hash({ value: this.formControl.value });
      if (this.virtualScroll()) this.#onVirtualOpened();
    } else {
      // why: the non-virtual shell marks the control touched through its value accessor when it closes.
      if (this.virtualScroll()) {
        this.formControl.markAsTouched();
        this.#virtualActiveKey.set(null);
      }
      this.focused.set(false);
      const hashedValue = Utilities.hash({ value: this.formControl.value });

      if (this.#hashedValue !== hashedValue) {
        this.sdChange.emit(this.formControl.value);
        if (this.multiple()) {
          this.sdSelection.emit({
            multiple: true,
            values: this.formControl.value,
            selectedItems: this.formControl.value?.map((val: any) => this.#allItem[val?.toString()]) || [],
          });
        } else {
          this.sdSelection.emit({
            multiple: false,
            values: [this.formControl.value],
            selectedItems: [this.#allItem[this.formControl.value?.toString()]],
            value: this.formControl.value,
            selectedItem: this.#allItem[this.formControl.value?.toString()],
          });
        }
      }
      this.#hashedValue = undefined;
    }
  };

  // ==========================================
  // VIRTUAL SCROLL — selection, keyboard, active row
  // ==========================================
  /** Mirrors MatSelect._onBlur: a blur while the panel is open is focus moving into the panel. */
  protected onVirtualBlur = (): void => {
    if (!this.selectRef()?.panelOpen) this.formControl.markAsTouched();
  };

  /** Keys in the search box: rows move with the arrows/Page/Home/End, Enter chooses the active row. */
  protected onVirtualSearchKeydown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (SD_SELECT_VIRTUAL_NAV_KEYS.has(event.key)) {
      // why: the search box only filters, so Home/End move through the rows instead of the caret (the
      // MUI autocomplete default) — otherwise nothing past the first screen of 10,000 rows is reachable.
      event.preventDefault();
      this.#moveVirtualActive(event.key);
    } else if (event.key === 'Enter' && this.virtualActiveIndex() >= 0) {
      event.preventDefault();
      this.#commitVirtualIndex(this.virtualActiveIndex());
    }
  };

  /** Keys on the trigger. Material's own handling only reaches the rendered rows, so the list-wide keys are ours. */
  #onVirtualTriggerKeydown = (event: KeyboardEvent): void => {
    const select = this.selectRef();
    if (!select || select.disabled || event.defaultPrevented) return;
    const modified = event.altKey || event.ctrlKey || event.metaKey;
    const printable = event.key.length === 1 && event.key !== ' ' && !modified;
    let handled = false;
    if (select.panelOpen) {
      if (SD_SELECT_VIRTUAL_NAV_KEYS.has(event.key) && !modified) {
        const previous = this.virtualActiveIndex();
        const index = this.#moveVirtualActive(event.key);
        // Material: Shift + arrow in a multiple select also toggles the row it lands on.
        if (this.multiple() && event.shiftKey && event.key.startsWith('Arrow') && index !== previous) this.#commitVirtualIndex(index);
        handled = true;
      } else if ((event.key === 'Enter' || (event.key === ' ' && !this.#isTyping())) && !modified && this.virtualActiveIndex() >= 0) {
        this.#commitVirtualIndex(this.virtualActiveIndex());
        handled = true;
      } else if (this.multiple() && event.ctrlKey && event.key.toLowerCase() === 'a' && !this.#isTyping()) {
        // Material: Ctrl + A selects every option, or clears them when all are selected — here over the whole list.
        this.#toggleAllVirtual();
        handled = true;
      } else if (printable) {
        this.#typeaheadVirtual(event.key, false);
        handled = true;
      }
    } else if (!this.multiple() && !modified) {
      // Closed single select: Material changes the value with these keys, but only among the rendered rows.
      if (SD_SELECT_VIRTUAL_NAV_KEYS.has(event.key) || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        this.#stepClosedVirtual(event.key);
        handled = true;
      } else if (printable) {
        this.#typeaheadVirtual(event.key, true);
        handled = true;
      }
    }
    if (handled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  };

  /** A click (or Material's own keyboard selection) on a rendered row. */
  #onVirtualOptionSelection = (event: MatOptionSelectionChange): void => {
    const option = event.source;
    if (!event.isUserInput || option.value === SD_SELECT_VIRTUAL_SENTINEL) return;
    this.#virtualActiveKey.set({ value: option.value });
    if (this.multiple()) {
      this.#toggleVirtualValue(option.value, option.selected);
    } else if (option.selected) {
      // Material closes the panel and focuses the trigger itself after a single-select user choice.
      this.clearSearch();
      this.#commitVirtualValue(option.value);
    }
  };

  #onVirtualOpened = (): void => {
    // why: the viewport was created while the panel was detached (size 0). After the search box is cleared
    // (a zero-delay search) measure it and bring the selected row — or the first enabled one — into view,
    // like Material does for its active option.
    this.#timers.schedule(() => {
      this.virtualViewport()?.checkViewportSize();
      const items = this.filteredItems();
      let index = -1;
      if (this.multiple()) {
        const selected = new Set(this.#virtualValues());
        index = items.findIndex(item => selected.has(this.itemValue(item)));
      } else {
        index = this.#virtualSelectedIndex();
      }
      if (index < 0) index = items.findIndex(item => !this.itemDisabled(item));
      if (index >= 0) this.#activateVirtual(index);
    }, 0);
  };

  /** Moves the active row like Material's open-panel key manager (no wrap; disabled rows stay reachable). */
  #moveVirtualActive = (key: string): number => {
    const count = this.filteredItems().length;
    const current = this.virtualActiveIndex();
    if (!count) return current;
    let target: number;
    switch (key) {
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = count - 1;
        break;
      case 'PageDown':
        target = current + SD_SELECT_VIRTUAL_PAGE;
        break;
      case 'PageUp':
        target = current - SD_SELECT_VIRTUAL_PAGE;
        break;
      case 'ArrowDown':
        target = current + 1;
        break;
      default:
        // ArrowUp with no active row does nothing, as in Material.
        if (current < 0) return current;
        target = current - 1;
    }
    const index = Math.min(count - 1, Math.max(0, target));
    this.#activateVirtual(index);
    return index;
  };

  #activateVirtual = (index: number): void => {
    const item = this.filteredItems()[index];
    if (item === undefined) return;
    this.#virtualActiveKey.set({ value: this.itemValue(item) });
    this.#scrollVirtualIntoView(index);
    // The row may render only after the viewport scrolls; the options subscription syncs again then.
    this.#syncVirtualKeyManager();
  };

  /** Scrolls the least distance that shows the whole row (Material's `_getOptionScrollPosition` rule). */
  #scrollVirtualIntoView = (index: number): void => {
    const viewport = this.virtualViewport();
    if (!viewport) return;
    const size = this.itemSize();
    const top = index * size;
    const offset = viewport.measureScrollOffset();
    const height = viewport.getViewportSize() || this.virtualViewportHeight();
    if (top < offset) viewport.scrollToOffset(top);
    else if (top + size > offset + height) viewport.scrollToOffset(top + size - height);
  };

  #syncVirtualKeyManager = (): void => {
    const select = this.selectRef();
    if (!select?.panelOpen || !this.virtualScroll()) return;
    const index = this.virtualActiveIndex();
    const id = index >= 0 ? this.virtualOptionId(index) : null;
    this.#virtualAdapter.setActive(id ? select.options.find(option => option.id === id) : undefined);
  };

  /** Chooses row `index`: toggles it in a multiple select; sets it and closes the panel in a single one. */
  #commitVirtualIndex = (index: number): void => {
    const item = this.filteredItems()[index];
    // A disabled row can be active (ARIA listbox) but not chosen — same as a disabled mat-option.
    if (item === undefined || this.itemDisabled(item)) return;
    const value = this.itemValue(item);
    this.#virtualActiveKey.set({ value });
    if (this.multiple()) {
      this.#toggleVirtualValue(value, !this.#virtualValues().includes(value));
      return;
    }
    this.clearSearch();
    this.#commitVirtualValue(value);
    const select = this.selectRef();
    select?.close();
    select?.focus();
  };

  #toggleVirtualValue = (value: unknown, selected: boolean): void => {
    const current = this.#virtualValues();
    if (current.includes(value) === selected) return;
    const next = selected ? [...current, value] : current.filter(entry => entry !== value);
    this.#commitVirtualValue(this.#orderByList(next));
  };

  #toggleAllVirtual = (): void => {
    const enabled = this.filteredItems()
      .filter(item => !this.itemDisabled(item))
      .map(item => this.itemValue(item));
    const current = this.#virtualValues();
    const selected = new Set(current);
    if (enabled.some(value => !selected.has(value))) {
      this.#commitVirtualValue(this.#orderByList([...current, ...enabled.filter(value => !selected.has(value))]));
    } else {
      const scope = new Set(enabled);
      this.#commitVirtualValue(current.filter(value => !scope.has(value)));
    }
  };

  #virtualValues = (): unknown[] => {
    const value = this.normalizedValue();
    return Array.isArray(value) ? value : [];
  };

  #virtualSelectedIndex = (): number => {
    const value = this.normalizedValue();
    if (value === undefined || value === null) return -1;
    return this.filteredItems().findIndex(item => this.itemValue(item) === value);
  };

  /** The order the non-virtual branch emits: the order of the (pinned) filtered list; unknown values last. */
  #orderByList = (values: unknown[]): unknown[] => {
    const position = new Map<unknown, number>();
    this.filteredItems().forEach((item, index) => {
      const value = this.itemValue(item);
      if (!position.has(value)) position.set(value, index);
    });
    return values
      .map((value, index) => ({ value, index, position: position.get(value) ?? Number.MAX_SAFE_INTEGER }))
      .sort((a, b) => a.position - b.position || a.index - b.index)
      .map(entry => entry.value);
  };

  #commitVirtualValue = (next: unknown): void => {
    // why: same rules as toggleSelectAll — setValue with its event (async validator kept) and the `!==`
    // guard so one choice emits one valueChanges.
    if (this.formControl.value !== next) this.formControl.setValue(next);
    this.#onChange(next as boolean | number | string | (number | string)[]);
  };

  /** Closed single select: steps the value through the whole list, skipping disabled rows like Material. */
  #stepClosedVirtual = (key: string): void => {
    const items = this.filteredItems();
    const count = items.length;
    if (!count) return;
    const rtl = this.#dir?.value === 'rtl';
    const direction = key === 'ArrowLeft' ? (rtl ? 'ArrowDown' : 'ArrowUp') : key === 'ArrowRight' ? (rtl ? 'ArrowUp' : 'ArrowDown') : key;
    const current = this.#virtualSelectedIndex();
    const scan = (start: number, step: number): number => {
      for (let index = start; index >= 0 && index < count; index += step) if (!this.itemDisabled(items[index])) return index;
      return -1;
    };
    let target: number;
    switch (direction) {
      case 'ArrowDown':
        target = scan(current + 1, 1);
        break;
      case 'ArrowUp':
        target = current < 0 ? -1 : scan(current - 1, -1);
        break;
      case 'Home':
        target = scan(0, 1);
        break;
      case 'End':
        target = scan(count - 1, -1);
        break;
      case 'PageDown':
        target = scan(Math.min(count - 1, current + SD_SELECT_VIRTUAL_PAGE), -1);
        break;
      default:
        target = scan(Math.max(0, current - SD_SELECT_VIRTUAL_PAGE), 1);
    }
    if (target >= 0 && target !== current) this.#selectClosedVirtual(target);
  };

  #selectClosedVirtual = (index: number): void => {
    const item = this.filteredItems()[index];
    this.clearSearch();
    this.#commitVirtualValue(this.itemValue(item));
    // Material announces the new value itself when a closed select changes; do the same.
    this.#liveAnnouncer.announce(this.itemDisplay(item), 10000);
  };

  #isTyping = (): boolean => !!this.#typeahead && performance.now() - this.#typeaheadAt <= SD_SELECT_TYPEAHEAD_MS;

  /**
   * Typeahead over the whole list, folded like the search box. Unlike Material's (debounced, rendered rows
   * only) it moves on every key: a longer prefix keeps the current row if it still matches.
   */
  #typeaheadVirtual = (char: string, commit: boolean): void => {
    const now = performance.now();
    if (now - this.#typeaheadAt > SD_SELECT_TYPEAHEAD_MS) this.#typeahead = '';
    this.#typeahead += char;
    this.#typeaheadAt = now;
    const query = StringUtilities.changeAliasLowerCase(this.#typeahead);
    const labels = this.#virtualLabels();
    const count = labels.length;
    if (!query || !count) return;
    const start = commit ? this.#virtualSelectedIndex() : this.virtualActiveIndex();
    const first = start < 0 ? 0 : this.#typeahead.length > 1 ? start : start + 1;
    for (let step = 0; step < count; step++) {
      const index = (first + step) % count;
      if (commit && this.itemDisabled(this.filteredItems()[index])) continue;
      if (!labels[index].startsWith(query)) continue;
      if (commit) this.#selectClosedVirtual(index);
      else this.#activateVirtual(index);
      return;
    }
  };
}
