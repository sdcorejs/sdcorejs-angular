/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
  effect,
  ElementRef,
  inject,
  input,
  isSignal,
  model,
  OnInit,
  output,
  signal, // THÊM IMPORT NÀY
  Signal,
  TemplateRef,
  untracked,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelect, MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { SdView } from '@sdcorejs/angular/components/view';
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
  SdSelectionData,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
} from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { ArrayUtilities, StringUtilities, Utilities } from '@sdcorejs/angular/utilities/extensions';
import { NestedKeyOf, Size } from '@sdcorejs/utils/models';

import { combineLatest, timer } from 'rxjs';
import { debounce, map, startWith, switchMap, tap } from 'rxjs/operators';
import { SdSelectFooterActionDirective } from './select-footer-action.directive';

@Component({
  selector: 'sd-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: { '[class.sd-bare]': 'isInline()', '[class.sd-viewed]': 'isViewed() || isInline()', '[class.sd-has-label]': '!!label()' },
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    SdLabel,
    SdView,
    SdSelectFooterActionDirective,
  ],
})
export class SdSelect<T extends object | string | number = Record<string, unknown>> implements OnInit {
  id = `I${Utilities.generateUuid()}`;

  // ==========================================
  // 1. SIGNAL QUERIES & INJECTS
  // ==========================================
  matInputRef = viewChild(MatInput);
  selectRef = viewChild<MatSelect>('select');

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

  valueField = input.required<NestedKeyOf<T>>();
  displayField = input.required<NestedKeyOf<T>>();
  disabledField = input<NestedKeyOf<T> | ''>('');
  cacheChecksum = input<any>();

  limit = input<number>(50);
  hyperlink = input<string | null | undefined>();

  minWidthPanel = input<string | number, string | number | undefined | null>('auto', {
    transform: value => value ?? 'auto',
  });

  hideInlineError = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` view + click-to-edit (bare editor). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  multiple = input(false, { transform: booleanAttribute });
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
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.select.required');
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.#formConfiguration?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

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
  inputControl = new FormControl('');

  loading = signal<boolean>(false);
  focused = signal<boolean>(false);
  allSelected = false;

  #cache: Record<string, any[]> = {};
  #allItem: Record<string, any> = {};
  #searchRequestId = 0;
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
  #items$ = toObservable(this.actualItems);
  #valueModel$ = toObservable(this.valueModel);

  filteredItems = signal<T[]>([]);
  selectedItems = signal<T[]>([]);
  display = signal<string>('');
  calculatedPanelWidth = signal<string | number>('auto');

  readonly searchText = signal<string>('');
  readonly footerActionContext = computed(() => ({ searchText: this.searchText() }));
  readonly visibleFooterActions = computed(() => this.footerActions().filter(action => this.shouldRenderFooterAction(action)));

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
    if (when === 'always') return true;
    if (when === 'empty') return this.searchText().length > 0 && this.filteredItems().length === 0;
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
      const req = this.required();
      const val = this.validator();
      const inl = this.inlineError();
      untracked(() => this.#updateValidator(req, val, inl));
    });

    // ==========================================
    // EFFECT: QUẢN LÝ FORM GROUP & CONTROL
    // ==========================================
    effect(onCleanup => {
      // 1. Lấy giá trị mới nhất của form và name
      const formGroup = this.form();
      const controlName = this.name();
      if (formGroup && controlName) {
        // 2. Thêm control vào form
        formGroup.addControl(controlName, this.formControl);
        // 3. Đăng ký hàm dọn dẹp (Cleanup)
        onCleanup(() => {
          // Hàm này sẽ tự động chạy trong 2 trường hợp:
          // - Khi Component bị Destroy (thay thế ngOnDestroy)
          // - Khi form() hoặc name() thay đổi giá trị (nó sẽ gỡ control cũ ra trước khi add cái mới vào)
          formGroup.removeControl(controlName);
        });
      }
    });


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
        this.inputControl.setValue('');
      }),
      map(items => {
        if (!items) return [];
        if (Array.isArray(items)) return items.filter(e => e !== null && e !== undefined);
        return items;
      })
    );

    const search$ = this.inputControl.valueChanges.pipe(
      startWith(''),
      tap(searchText => this.searchText.set(searchText?.toString() || '')),
      tap(() => {
        if (typeof this.actualItems() === 'function' && this.focused()) {
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
      tap(() => {
        this.loading.set(false);
        this.#ref.markForCheck();
      })
    );

    const selectedItems$ = combineLatest([cleanItems$, this.#valueModel$]).pipe(
      switchMap(async ([items, val]) => {
        const vField = this.valueField();
        const dField = this.displayField();

        if (val === undefined || val === null || val === '') return [];

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
      })
    );

    const filteredItems$ = allItems$.pipe(
      map(allItems => {
        const limit = this.limit();
        const val = this.valueModel();
        if (!this.multiple() || !Array.isArray(val) || val.length === 0) {
          return ArrayUtilities.paging(allItems, limit);
        }

        // multiple mode: keep ALL selected items (for checkmarks) + limit unselected items
        // why: if selected.length >= limit, paging would show only selected items → user can't pick new ones
        const vField = this.valueField();
        const selectedSet = new Set(val.map(String));
        const selected: T[] = [];
        const unselected: T[] = [];

        for (const item of allItems) {
          const itemVal = vField ? String(this.itemValue(item) ?? '') : String(item ?? '');
          if (selectedSet.has(itemVal)) {
            selected.push(item);
          } else {
            unselected.push(item);
          }
        }

        return [...selected, ...ArrayUtilities.paging(unselected, limit)];
      })
    );

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

  #updateValidator = (req: boolean, val: SdCustomValidator | undefined, inl: string | undefined) => {
    this.formControl.clearValidators();
    this.formControl.clearAsyncValidators();
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];

    if (req) validators.push(Validators.required);
    if (val) asyncValidators.push(HandleSdCustomValidator(val));
    if (inl) validators.push(SdInlineErrorValidator);

    this.formControl.setValidators(validators.length ? validators : null);
    this.formControl.setAsyncValidators(asyncValidators.length ? asyncValidators : null);
    this.formControl.updateValueAndValidity({ emitEvent: false });
  };

  #loadSelectedItems = async (value: any, items: SdSearch) => {
    if (value === undefined || value === null || value === '') return [];

    const values = Array.isArray(value) ? value : [value];
    const vField = this.valueField();
    const dField = this.displayField();

    if (!vField && !dField) return values;

    if (values.some(val => this.#allItem[val?.toString()] === undefined)) {
      const results: any[] = await items({ type: 'VALUE', value }).catch(() => []);
      this.#addToDict(results);

      const objValue: Record<string, any> = {};
      values.forEach(val => {
        const dummy = {};
        this.setNestedValue(dummy, vField, val);
        if (dField) this.setNestedValue(dummy, dField, val);
        objValue[String(val)] = dummy;
      });

      this.#allItem = { ...objValue, ...this.#allItem };
    }

    return values.map(val => {
      if (this.#allItem[val?.toString()]) return this.#allItem[val?.toString()];
      const dummy = {};
      this.setNestedValue(dummy, vField, val);
      if (dField) this.setNestedValue(dummy, dField, val);
      return dummy;
    });
  };

  #loadItems = async (searchText: string | undefined | null, items: SdSearch) => {
    searchText = searchText?.toString() || '';
    const key = Utilities.hash({ checksum: this.cacheChecksum() || null, searchText });

    this.#searchRequestId++;
    const currentRequestId = this.#searchRequestId;

    if (this.#cache[key] === undefined && this.focused()) {
      const results: any[] = await items({ type: 'SEARCH', searchText }).catch(() => []);

      if (currentRequestId !== this.#searchRequestId) return [];

      this.#addToDict(results);

      const mapObj = new Map();
      results.forEach(e => {
        const k = this.itemValue(e);
        if (k != null && !mapObj.has(k)) mapObj.set(k, e);
      });
      this.#cache[key] = Array.from(mapObj.values());
    }

    const selectedItems = await this.#loadSelectedItems(this.valueModel(), items);

    if (currentRequestId !== this.#searchRequestId) return [];

    const finalMap = new Map();
    [...selectedItems, ...(this.#cache[key] || [])].forEach(e => {
      const k = this.itemValue(e);
      if (k != null && !finalMap.has(k)) finalMap.set(k, e);
    });
    return Array.from(finalMap.values());
  };

  onSelectionChange = (change: MatSelectChange) => {
    this.allSelected = !this.selectRef()?.options.some(e => !e.selected);
    const value = change?.value ?? '';
    if (this.multiple()) {
      this.formControl.setValue(value || [], { emitEvent: false });
      this.#onChange(value || []);
    } else {
      this.inputControl.setValue('');
      this.formControl.setValue(value, { emitEvent: false });
      this.#onChange(value);
    }
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

  focus = () => {
    this.focused.set(true);
    this.updatePanelWidth();
    setTimeout(() => {
      this.selectRef()?.focus();
      this.selectRef()?.open();
    }, 100);
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
      setTimeout(() => {
        const input = this.matInputRef();
        if (input) {
          input.value = '';
          input.focus();
        }
      }, 100);
      this.#hashedValue = Utilities.hash({ value: this.formControl.value });
      this.inputControl.setValue('');
    } else {
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
}
