/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  isSignal,
  model,
  OnDestroy,
  OnInit,
  output,
  signal, // THÃŠM IMPORT NÃ€Y
  Signal,
  TemplateRef,
  untracked,
  viewChild,
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
  SdSearch,
  SdSelectionData,
} from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { ArrayUtilities, SdUtilities, StringUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdNestedKeyOf, SdSize } from '@sdcorejs/angular/utilities/models';

import { combineLatest, timer } from 'rxjs';
import { debounce, map, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'sd-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  ],
})
export class SdSelect<T extends object | string | number = Record<string, unknown>> implements OnInit {
  id = `I${SdUtilities.generateUuid()}`;

  // ==========================================
  // 1. SIGNAL QUERIES & INJECTS
  // ==========================================
  matInputRef = viewChild(MatInput);
  selectRef = viewChild<MatSelect>('select');

  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  itemDef = contentChild(SdItemDefDefDirective);
  sdViewDef = contentChild(SdViewDefDirective);

  #ref = inject(ChangeDetectorRef);
  #formConfiguration = inject(SD_FORM_CONFIGURATION, { optional: true });
  #el = inject(ElementRef);
  readonly #i18n = inject(I18nService);

  // ==========================================
  // 2. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-select-${this.autoIdInput()}` : undefined));
  name = input<string>(SdUtilities.generateUuid());

  size = input<SdSize>('md');
  // Ghi (TransformT): any (Ä‘á»ƒ khÃ´ng bá»‹ lá»—i typing khi cha truyá»n vÃ o)
  form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      // Náº¿u cha truyá»n vÃ o NgForm (template-driven) -> BÃ³c láº¥y FormGroup bÃªn trong
      if (val instanceof NgForm) return val.form;
      // Náº¿u cha truyá»n sáºµn FormGroup (reactive) -> Láº¥y luÃ´n
      if (val instanceof FormGroup) return val;
      // Fallback an toÃ n phÃ²ng trÆ°á»ng há»£p cha truyá»n 1 object chá»©a form
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });
  label = input<string | undefined>();
  helperText = input<string | undefined>();
  placeholder = input<string | undefined>();

  valueField = input.required<SdNestedKeyOf<T>>();
  displayField = input.required<SdNestedKeyOf<T>>();
  disabledField = input<SdNestedKeyOf<T> | ''>('');
  cacheChecksum = input<any>();

  limit = input<number>(50);
  hyperlink = input<string | null | undefined>();

  minWidthPanel = input<string | number, string | number | undefined | null>('auto', {
    transform: value => value ?? 'auto',
  });

  hideInlineError = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  viewed = input(false, { transform: booleanAttribute });
  multiple = input(false, { transform: booleanAttribute });

  validator = input<SdCustomValidator | undefined>();
  inlineError = input<string | undefined>();

  /**
   * Tá»•ng há»£p error message Ä‘á»ƒ hiá»ƒn thá»‹ trong tooltip khi hideInlineError = true.
   * DÃ¹ng getter (khÃ´ng pháº£i computed) vÃ¬ formControl.errors khÃ´ng pháº£i Angular signal.
   */
  get errorTooltipMessage(): string | undefined {
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.select.required');
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  }

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.#formConfiguration?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  // Má»Ÿ rá»™ng kiá»ƒu dá»¯ liá»‡u cho phÃ©p nháº­n Signal tá»« bÃªn ngoÃ i truyá»n vÃ o
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

  // [NÃ‚NG Cáº¤P]: Xá»­ lÃ½ Unwrap (Má»Ÿ há»™p) Signal lá»“ng nhau náº¿u cÃ³
  actualItems = computed(() => {
    const rawItems = this.items();
    // Náº¿u cha truyá»n vÃ o má»™t biáº¿n Signal, ta cáº§n gá»i rawItems() Ä‘á»ƒ láº¥y máº£ng tháº­t
    if (isSignal(rawItems)) {
      return rawItems();
    }
    return rawItems;
  });

  // Thay vÃ¬ toObservable(this.items), ta observe cÃ¡i actualItems Ä‘Ã£ Ä‘Æ°á»£c unwrap
  #items$ = toObservable(this.actualItems);
  #valueModel$ = toObservable(this.valueModel);

  filteredItems = signal<T[]>([]);
  selectedItems = signal<T[]>([]);
  display = signal<string>('');
  calculatedPanelWidth = signal<string | number>('auto');

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
    return SdUtilities.getNestedValue(item, path as string);
  };

  itemDisplay = (item: T): string => {
    const path = this.displayField();
    if (!path || item == null) return String(item ?? '');
    return String(SdUtilities.getNestedValue(item, path as string) ?? '');
  };

  itemDisabled = (item: T): boolean => {
    const path = this.disabledField();
    if (!path || item == null) return false;
    return Boolean(SdUtilities.getNestedValue(item, path as string));
  };

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
    return items.map(item => (vF ? `â€¢ ${this.itemValue(item)} - ${this.itemDisplay(item)}` : `â€¢ ${item}`)).join('\n');
  });

  updatePanelWidth = () => {
    const minWInput = this.minWidthPanel();
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
    // EFFECT: QUáº¢N LÃ FORM GROUP & CONTROL
    // ==========================================
    effect(onCleanup => {
      // 1. Láº¥y giÃ¡ trá»‹ má»›i nháº¥t cá»§a form vÃ  name
      const formGroup = this.form();
      const controlName = this.name();
      if (formGroup && controlName) {
        // 2. ThÃªm control vÃ o form
        formGroup.addControl(controlName, this.formControl);
        // 3. ÄÄƒng kÃ½ hÃ m dá»n dáº¹p (Cleanup)
        onCleanup(() => {
          // HÃ m nÃ y sáº½ tá»± Ä‘á»™ng cháº¡y trong 2 trÆ°á»ng há»£p:
          // - Khi Component bá»‹ Destroy (thay tháº¿ ngOnDestroy)
          // - Khi form() hoáº·c name() thay Ä‘á»•i giÃ¡ trá»‹ (nÃ³ sáº½ gá»¡ control cÅ© ra trÆ°á»›c khi add cÃ¡i má»›i vÃ o)
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

        // Khi filtered mode báº­t vÃ  multiple=true, luÃ´n Ä‘áº©y item Ä‘Ã£ chá»n lÃªn trÃªn
        // Ä‘á»ƒ user dá»… nhÃ¬n tháº¥y selection hiá»‡n táº¡i, ká»ƒ cáº£ dataset chÆ°a vÆ°á»£t limit.
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

    const filteredItems$ = allItems$.pipe(map(allItems => ArrayUtilities.paging(allItems, this.limit())));

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
    if (inl) validators.push(this.customInlineErrorValidator());

    this.formControl.setValidators(validators.length ? validators : null);
    this.formControl.setAsyncValidators(asyncValidators.length ? asyncValidators : null);
    this.formControl.updateValueAndValidity({ emitEvent: false });
  };

  customInlineErrorValidator(): ValidatorFn {
    return (): Record<string, any> | null => ({ inlineError: true });
  }

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
    const key = SdUtilities.hash({ checksum: this.cacheChecksum() || null, searchText });

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

  // Chá»‰ cáº­p nháº­t model binding, KHÃ”NG emit event.
  // sdChange + sdSelection sáº½ chá»‰ Ä‘Æ°á»£c emit khi panel Ä‘Ã³ng (onOpenedChange).
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
      this.#hashedValue = SdUtilities.hash({ value: this.formControl.value });
      this.inputControl.setValue('');
    } else {
      this.focused.set(false);
      const hashedValue = SdUtilities.hash({ value: this.formControl.value });

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

