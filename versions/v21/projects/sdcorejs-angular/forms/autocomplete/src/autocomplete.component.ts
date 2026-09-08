import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormGroupDirective, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdDataState, SdDataStateTemplateDirective } from '@sdcorejs/angular/components/data-state';
import { cloneReadRequest, combineReadStates, SdReadChannel, SdSearchReadState } from '@sdcorejs/angular/utilities/read-state';
import { SdItemDefDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  HandleSdCustomValidator,
  SD_FORM_CONFIGURATION,
  SdCustomValidator,
  SdFormControl,
  SdInlineErrorValidator,
  SdSearch,
  SdSearchReq,
  SdSelectionData,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
  ɵsdTimerScope,
} from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { ArrayUtilities } from '@sdcorejs/utils/fns';
import { Size } from '@sdcorejs/utils/models';
import { Utilities } from '@sdcorejs/utils/fns';
import { EMPTY, Observable, Subject, Subscription, combineLatest, defer, from, merge, of, timer } from 'rxjs';
import { catchError, debounce, filter, finalize, map, shareReplay, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';

interface AutocompleteReadRequest<T> {
  loader: SdSearch<T>;
  args: SdSearchReq;
  key: string;
  valid: () => boolean;
}
import { SdIcon } from '@sdcorejs/angular/modules/icon';

class SdAutocompleteErrotStateMatcher implements ErrorStateMatcher {
  constructor(private formControl: FormControl) {}
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(this.formControl?.invalid && (this.formControl?.dirty || this.formControl?.touched || isSubmitted));
  }
}

@Component({
  selector: 'sd-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrl: './autocomplete.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: { '[class.sd-has-label]': '!!label()', '[class.sd-viewed]': 'isViewed() || isInline()', '[class.sd-bare]': 'isInline()' },
  imports: [
    SdIcon,
    SdDataState,
    SdDataStateTemplateDirective,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    SdLabel,
    SdView,
  ],
})
export class SdAutocomplete<T = unknown> implements OnInit, OnDestroy {
  id = `I${Utilities.generateUuid()}`;
  /** why: id ổn định của <mat-error> để control trỏ `aria-describedby` sang — thông báo lỗi
   *  phải đọc được từ chính control, không chỉ hiện ra màn hình. */
  readonly errorId = `${this.id}-error`;

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  autocompleteTrigger = viewChild(MatAutocompleteTrigger);

  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  itemDef = contentChild(SdItemDefDefDirective);
  sdViewDef = contentChild(SdViewDefDirective);

  // ==========================================
  // 2. INJECTS
  // ==========================================
  private ref = inject(ChangeDetectorRef);
  private formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #i18n = inject(I18nService);
  // why: focus() (và open() gọi lại nó) hoãn 100ms rồi mới openPanel(). Không giữ handle thì
  // panel overlay có thể mở SAU khi control đã destroy và không còn ai đóng nó.
  readonly #timers = ɵsdTimerScope();
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-autocomplete-${this.autoIdInput()}` : undefined));

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

  valueField = input<string | undefined>();
  displayField = input<string | undefined>();
  disabledField = input<string>('');
  limit = input<number>(100);
  cacheChecksum = input<any>();
  hyperlink = input<string | null | undefined>();

  items = input<undefined | null | T[] | SdSearch<T>>();

  hideInlineError = input(false, { transform: booleanAttribute });
  readonly hideReadError = input(false, { transform: booleanAttribute });
  readonly dataStateTemplate = contentChild(SdDataStateTemplateDirective);
  readonly sdReadStateChange = output<SdSearchReadState>();
  readonly #valueRead = new SdReadChannel('VALUE', () => this.#emitReadState());
  readonly #searchRead = new SdReadChannel('SEARCH', () => this.#emitReadState());
  readonly readState = computed(() => combineReadStates(this.#valueRead.state(), this.#searchRead.state()));
  readonly hasSearched = signal(false);
  addable = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` view + click-to-edit (autocomplete panel). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  /** In `viewed='inline'`, show a hover clear-× on the text face. Set `false` when the host owns removal (chips). */
  clearable = input(true, { transform: booleanAttribute });

  // Tri-state `viewed` — shared primitive. In `'inline'` the autocomplete editor is always mounted
  // (chrome hidden via CSS); the sd-view text face opens the panel on click.
  readonly #viewedState = sdViewedInline(this.viewed, () => this.open(), this.disabled);
  /** `true` when `viewed === 'inline'`. */
  readonly isInline = this.#viewedState.isInline;
  /** `true` when `viewed === true` (static view, no editor). */
  readonly isViewed = this.#viewedState.isViewed;
  /** Open the autocomplete panel from the inline text face. No-op unless `viewed='inline'`. */
  enterInlineEdit = (): void => this.#viewedState.enterInlineEdit();
  /** View display template: `sdViewDef` overrides the projected `#sdValue` (unified). */
  readonly viewTemplate = computed<TemplateRef<any> | undefined>(() => this.sdViewDef()?.templateRef ?? this.sdValueTemplate());

  validator = input<SdCustomValidator | undefined>();
  inlineError = input<string | undefined>();

  /**
   * Tổng hợp error message để hiển thị trong tooltip khi hideInlineError = true.
   */
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.autocomplete.required');
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.formConfig?.appearance ?? 'outline');

  valueModel = model<string | number | undefined | null>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS
  // ==========================================
  sdChange = output<string | number | null>();
  sdSelection = output<SdSelectionData>();
  // why: the template reads EventEmitter.observed to render the add action only when a consumer handles it.
  @Output() readonly sdAdd = new EventEmitter<void>();

  // ==========================================
  // 5. INTERNAL STATE & STREAMS
  // ==========================================
  loading = signal(false);
  isFocused = false;
  isTyping = signal(false);

  inputControl = new SdFormControl();
  formControl = new SdFormControl();
  // why: validator đi qua connector (addValidators/removeValidators — additive) thay vì
  // setValidators()/setAsyncValidators() như trước. `formControl` là public API, consumer hoàn toàn
  // có thể tự gắn validator lên nó; setValidators THAY THẾ cả danh sách nên xoá sạch validator của
  // consumer mỗi lần required/[validator]/inlineError đổi. Connector chỉ thêm/gỡ đúng phần component
  // sở hữu, phần còn lại của danh sách giữ nguyên.
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
  matcher = new SdAutocompleteErrotStateMatcher(this.formControl);

  #cache: Record<string, T[]> = {};
  #item: Record<string, T> = {};
  #subscription = new Subscription();
  #destroyed = false;
  #searchDebouncing = false;
  #lastSearchText = '';
  #restoringReadFocus = false;
  #valueCache: Record<string, T[]> = {};
  #failedValue?: AutocompleteReadRequest<T>;
  #failedSearch?: AutocompleteReadRequest<T>;
  #valueRetryRequest?: AutocompleteReadRequest<T>;
  #searchRetryRequest?: AutocompleteReadRequest<T>;
  #retrySearch = new Subject<string>();
  #retryValue = new Subject<void>();

  // RXJS STREAMS
  #items$ = toObservable(
    computed(() => ({
      items: this.items(),
      checksum: this.cacheChecksum(),
      valueField: this.valueField(),
      displayField: this.displayField(),
    }))
  ).pipe(map(context => context.items));
  #valueModel$ = toObservable(this.valueModel);

  // PUBLIC SIGNALS (Render View)
  filteredItems = signal<any[]>([]);
  selected = signal<any>(null);
  display = signal<string>('');
  controlPlaceHolder = signal<string>('');

  normalizedValue = computed(() => this.valueModel());

  // ==========================================
  // [NEW]: Hàm đọc thuộc tính lồng nhau (a.b.c)
  // ==========================================
  getNestedValue = (obj: any, path: string | undefined): any => {
    if (!path || obj == null) return obj;
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      if (result == null) return undefined;
      result = result[key];
    }
    return result;
  };

  constructor() {
    effect(() => {
      this.items();
      this.valueModel();
      this.cacheChecksum();
      this.valueField();
      this.displayField();
      untracked(() => {
        if (this.#failedValue && !this.#failedValue.valid()) {
          this.#failedValue = undefined;
          this.#valueRead.invalidate();
        }
      });
    });
    effect(() => {
      const val = this.normalizedValue();
      untracked(() => {
        if (this.formControl.value !== val) {
          this.formControl.setValue(val, { emitEvent: false });
        }
      });
    });

    effect(() => {
      if (this.disabled()) {
        this.inputControl.disable({ emitEvent: false });
        this.formControl.disable({ emitEvent: false });
      } else {
        this.inputControl.enable({ emitEvent: false });
        this.formControl.enable({ emitEvent: false });
      }
    });
  }

  ngOnInit() {
    this.#subscription.add(
      this.formControl.valueChanges.subscribe(val => {
        if (this.valueModel() !== val) {
          this.valueModel.set(val);
        }
      })
    );

    this.#subscription.add(
      this.inputControl.touchChanges.subscribe(() => {
        this.formControl.markAsTouched();
        this.ref.markForCheck();
      })
    );
    this.#subscription.add(this.formControl.sdChanges.subscribe(() => this.ref.markForCheck()));
    this.#subscription.add(this.inputControl.sdChanges.subscribe(() => this.ref.markForCheck()));

    this.#element.nativeElement.addEventListener('keydown', this.focusReadRetry, true);
    this.#subscription.add(
      this.inputControl.valueChanges.subscribe(value => {
        this.isTyping.set(true);
        this.hasSearched.set(true);
        this.#searchDebouncing = typeof this.items() === 'function';
        const text = value || '';
        if (text !== this.#lastSearchText) {
          this.#failedSearch = undefined;
          this.#searchRead.invalidate();
          this.#lastSearchText = text;
        }
        this.#syncReadLoading();
      })
    );

    const cleanItems$ = this.#items$.pipe(
      tap(() => {
        this.#cache = {};
        this.#item = {};
        this.#valueCache = {};
        this.#failedValue = this.#failedSearch = undefined;
        this.#valueRetryRequest = this.#searchRetryRequest = undefined;
        this.#valueRead.invalidate();
        this.#searchRead.invalidate();
      }),
      map(items => {
        if (!items) return [];
        if (Array.isArray(items)) return items.filter(e => e !== null && e !== undefined);
        return items;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const filteredItems$ = combineLatest([
      cleanItems$,
      merge(
        this.inputControl.valueChanges.pipe(
          startWith(''),
          // why: retry thay thế debounce đang chờ; text cũ không được phát thêm một request sau retry.
          debounce(() => timer(typeof this.items() === 'function' ? 500 : 0).pipe(takeUntil(this.#retrySearch)))
        ),
        this.#retrySearch
      ),
    ]).pipe(
      tap(() => {
        this.isTyping.set(false);
        this.#searchDebouncing = false;
      }),
      switchMap(([items, searchText]) => {
        const sText = searchText || '';

        if (typeof items !== 'function') {
          this.#syncReadLoading();
          // [UPDATED]: Hỗ trợ search lồng nhau (nested) local
          const filtered = items.filter((e: any) => {
            const v = String(this.getNestedValue(e, this.valueField()) || '').toLowerCase();
            const d = String(this.getNestedValue(e, this.displayField()) || '').toLowerCase();
            const q = sText.toLowerCase();
            return v.includes(q) || d.includes(q);
          });
          return of(ArrayUtilities.paging(filtered, this.limit()));
        }

        const retry = this.#searchRetryRequest;
        this.#searchRetryRequest = undefined;
        const request = retry?.valid() ? retry : this.#createReadRequest(items, { type: 'SEARCH', searchText: sText });
        return this.#readItems(request, retry === request);
      })
    );

    const selected$ = combineLatest([cleanItems$, this.#valueModel$, this.#retryValue.pipe(startWith(undefined))]).pipe(
      switchMap(([items, val]) => {
        const vField = this.valueField();
        const dField = this.displayField();

        if (!vField) {
          this.#valueRead.invalidate();
          return of(val);
        }

        if (val || val === 0) {
          if (typeof items === 'function') {
            const retry = this.#valueRetryRequest;
            this.#valueRetryRequest = undefined;
            const request = retry?.valid() ? retry : this.#createReadRequest(items, { type: 'VALUE', value: val as any });
            if (!retry && this.#item[val as any] && !this.#failedValue?.valid()) {
              const revision = this.#valueRead.begin(request.valid);
              this.#valueRead.succeed(revision, 1);
              return of(this.#item[val as any]);
            }
            return this.#readItems(request, retry === request).pipe(map(() => this.#item[val as any] || { [vField]: val, [dField!]: val }));
          }
          // [UPDATED]: Tìm local theo nested field
          return of((items as any[]).find((e: any) => this.getNestedValue(e, vField) === val));
        }
        this.#failedValue = undefined;
        this.#valueRead.invalidate();
        return of('');
      }),
      // why: ba subscriber (selected/display/placeholder) dùng chung một request VALUE.
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const controlPlaceHolder$ = selected$.pipe(
      map((item: T) => {
        // [UPDATED]: Đọc PlaceHolder bằng getNestedValue
        const dispVal = this.getNestedValue(item, this.displayField());
        return dispVal ?? item ?? this.placeholder() ?? (this.appearance() ? this.label() : '');
      })
    );

    const display$ = selected$.pipe(
      map((item: T) => {
        // [UPDATED]: Đọc Display bằng getNestedValue
        const dField = this.displayField();

        if (dField && typeof item === 'object' && !!item) {
          return this.getNestedValue(item, dField) ?? '';
        }
        if (typeof item === 'string' || typeof item === 'number') {
          return item.toString();
        }
        return '';
      })
    );

    this.#subscription.add(
      filteredItems$.subscribe(val => {
        this.filteredItems.set(val || []);
        this.ref.markForCheck();
      })
    );
    this.#subscription.add(
      selected$.subscribe(val => {
        this.selected.set(val);
        this.ref.markForCheck();
      })
    );
    this.#subscription.add(
      controlPlaceHolder$.subscribe(val => {
        this.controlPlaceHolder.set(val || '');
        this.ref.markForCheck();
      })
    );
    this.#subscription.add(
      display$.subscribe(val => {
        this.display.set(val || '');
        this.ref.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.#destroyed = true;
    this.#element.nativeElement.removeEventListener('keydown', this.focusReadRetry, true);
    this.#valueRead.invalidate();
    this.#searchRead.invalidate();
    this.#subscription.unsubscribe();
    this.#cache = {};
    this.#item = {};
  }

  onSelect = (item: T) => {
    if (!item) return;

    const vField = this.valueField();
    const dField = this.displayField();

    // why: KHÔNG dùng { emitEvent: false } khi mirror giá trị chọn sang formControl. formControl
    // mang async [validator] (HandleSdCustomValidator). Nếu chặn event thì khi async resolve,
    // setErrors cũng im → #state (sdFormControlState) không tick → errorMessage không recompute →
    // message lỗi không hiện/không clear. Để event lan ra: formControl.valueChanges có subscriber
    // set valueModel (guard `!==`), và onSelect set lại valueModel cùng giá trị (no-op) → không lặp.
    if (typeof item === 'string' || typeof item === 'number') {
      if (this.formControl.value !== item) {
        this.formControl.setValue(item);
        this.valueModel.set(item);
        this.sdChange.emit(item);
        this.sdSelection.emit({ values: [item], selectedItems: [item], value: item, selectedItem: item });
      }
    } else if (vField && dField) {
      // [UPDATED]: Lấy giá trị val = getNestedValue(item, vField)
      const val = this.getNestedValue(item, vField) ?? null;
      if (this.formControl.value !== val) {
        this.formControl.setValue(val);
        this.valueModel.set(val);
        this.sdChange.emit(val);
        this.sdSelection.emit({ values: [val], selectedItems: [item], value: val, selectedItem: item });
      }
    }
    this.#resetSearchText();
  };

  onFocus = () => {
    this.hasSearched.set(true);
    this.isFocused = true;
    if (this.#restoringReadFocus || this.#failedSearch?.valid()) return;
    this.filteredItems.set([]);

    if (typeof this.items() === 'function') {
      this.loading.set(true);
    }

    this.inputControl.setValue('', { emitEvent: true });
  };

  onBlur = (event?: FocusEvent) => {
    // why: Tab vào retry thuộc cùng control, không đổi snapshot text hoặc selection.
    if (event?.relatedTarget instanceof Node && this.#readRegion()?.contains(event.relatedTarget)) return;
    this.isFocused = false;
    this.#resetSearchText();
  };

  #resetSearchText = () => {
    const changed = !!this.inputControl.value;
    this.inputControl.setValue('', { emitEvent: false });
    this.#lastSearchText = '';
    this.#searchDebouncing = false;
    this.isTyping.set(false);
    if (changed) {
      this.#failedSearch = undefined;
      this.#searchRead.invalidate();
    }
    this.#syncReadLoading();
  };

  #readRegion = (): HTMLElement | null =>
    this.autocompleteTrigger()?.autocomplete.panel?.nativeElement.querySelector('.sd-read-state-region') ?? null;

  protected focusReadRetry = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab' || event.shiftKey || !this.autocompleteTrigger()?.panelOpen) return;
    const button = this.#readRegion()?.querySelector<HTMLElement>('button:not([disabled]), [tabindex="0"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.focus();
  };

  protected onReadRegionKeydown = (event: KeyboardEvent): void => {
    event.stopPropagation();
    if (event.key === 'Escape' || (event.key === 'Tab' && event.shiftKey)) {
      event.preventDefault();
      this.#restoreReadFocus();
      if (event.key === 'Escape') this.autocompleteTrigger()?.closePanel();
    } else if (event.key === 'Tab') {
      this.autocompleteTrigger()?.closePanel();
      this.#restoreReadFocus();
    }
  };

  #restoreReadFocus = () => {
    this.#restoringReadFocus = true;
    this.inputRef()?.nativeElement.focus();
    this.#restoringReadFocus = false;
  };

  onClick = () => {
    if (this.sdViewDef()?.templateRef) {
      if (!this.formControl.disabled && !this.isFocused) {
        this.focus();
      }
    }
  };

  blur = () => {
    this.inputRef()?.nativeElement?.blur();
  };

  focus = () => {
    this.isFocused = true;
    // why: vẫn 100ms như cũ — chỉ scope handle theo DestroyRef.
    this.#timers.schedule(() => {
      this.autocompleteTrigger()?.openPanel();
      this.inputRef()?.nativeElement?.focus();
    }, 100);
  };

  /** Open the autocomplete panel programmatically (anchors to the field input). Used by inline mode. */
  open = () => {
    if (this.formControl.disabled) return;
    this.focus();
  };

  clear = ($event?: any) => {
    $event?.stopPropagation();
    this.filteredItems.set([]);
    this.inputControl?.setValue('');
    // why: guard bằng `!= null && !== ''` chứ KHÔNG dùng truthiness. Giá trị `0` là hợp lệ —
    // load path (selected$) đã coi `val === 0` là có giá trị — nên `if (this.valueModel())`
    // im lặng từ chối xoá đúng những item có value = 0 (hoặc false).
    const current = this.valueModel();
    if (current != null && current !== '') {
      // why: KHÔNG dùng { emitEvent: false } khi reset formControl. formControl mang async
      // [validator] (HandleSdCustomValidator). Chặn event thì lúc async resolve, setErrors cũng im →
      // #state (sdFormControlState) không tick → errorMessage không recompute → message lỗi không
      // hiện/không clear sau khi xoá. Đúng lỗi mà comment ở onSelect nói là đã fix. Subscriber
      // formControl.valueChanges set valueModel có guard `!==`, và clear() set lại cùng giá trị
      // (no-op) → không lặp.
      this.formControl.setValue(null);
      this.valueModel.set(null);
      this.sdChange.emit(null);
      this.sdSelection.emit({ values: [null], selectedItems: [], value: null, selectedItem: null });
    }
  };

  onAdd = ($event: Event) => {
    $event.stopPropagation();
    $event?.preventDefault();
    this.sdAdd.emit();
  };

  reValidate = () => {
    // why: mọi validator (required / [validator] / inlineError) được cài trên formControl —
    // inputControl chỉ giữ text search và KHÔNG có validator nào. Gọi trên inputControl là no-op,
    // tức API public reValidate() trước đây không validate gì cả.
    this.formControl.updateValueAndValidity({ emitEvent: true });
  };

  #createReadRequest = (loader: SdSearch<T>, args: SdSearchReq): AutocompleteReadRequest<T> => {
    const checksum = Utilities.hash({ checksum: this.cacheChecksum(), valueField: this.valueField(), displayField: this.displayField() });
    const key = Utilities.hash({ checksum, args });
    return {
      loader,
      args: cloneReadRequest(args),
      key,
      valid: () =>
        !this.#destroyed &&
        this.items() === loader &&
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

  #readItems = (request: AutocompleteReadRequest<T>, retry: boolean): Observable<T[]> =>
    defer(() => {
      const valueRequest = request.args.type === 'VALUE';
      const channel = valueRequest ? this.#valueRead : this.#searchRead;
      const failed = valueRequest ? this.#failedValue : this.#failedSearch;
      if (!request.valid()) return EMPTY;
      if (!retry && failed?.key === request.key && failed.valid()) {
        this.#syncReadLoading();
        return EMPTY;
      }
      const revision = channel.begin(request.valid);
      if (valueRequest) this.#failedValue = undefined;
      else this.#failedSearch = undefined;
      const cache = valueRequest ? this.#valueCache : this.#cache;
      if (!retry && cache[request.key] !== undefined) {
        channel.succeed(revision, cache[request.key].length);
        return of(cache[request.key]);
      }
      // why: defer bao quanh chính lời gọi loader để bắt cả throw đồng bộ; from giữ Promise/Observable.
      return defer(() => from(request.loader(cloneReadRequest(request.args)))).pipe(
        filter(() => channel.isCurrent(revision)),
        map(data => data || []),
        tap(data => {
          cache[request.key] = data;
          data.forEach(item => {
            const key = this.getNestedValue(item, this.valueField());
            if (key != null) this.#item[key] = item;
          });
          channel.succeed(revision, data.length);
        }),
        filter(() => channel.isCurrent(revision)),
        catchError(error => {
          if (channel.isCurrent(revision)) {
            if (valueRequest) this.#failedValue = request;
            else this.#failedSearch = request;
            channel.fail(revision, error);
          }
          return EMPTY;
        }),
        finalize(() => {
          // why: cleanup của request cũ không đổi state/loading của request mới.
          if (channel.isCurrent(revision)) {
            if (channel.state().status === 'loading') channel.invalidate();
            this.#syncReadLoading();
          }
        })
      );
    });

  #syncReadLoading = () => {
    if (this.#destroyed) return;
    this.loading.set(
      this.#searchDebouncing || this.#valueRead.state().status === 'loading' || this.#searchRead.state().status === 'loading'
    );
    this.ref.markForCheck();
  };

  #emitReadState = () => {
    if (this.#destroyed) return;
    this.#syncReadLoading();
    this.sdReadStateChange.emit(this.readState());
  };

  /** Retry bypasses text debounce/distinctness while using the original loader and request snapshot. */
  retryRead = (): void => {
    const state = this.readState();
    if (state.status !== 'error') return;
    const request = state.operation === 'VALUE' ? this.#failedValue : this.#failedSearch;
    if (!request?.valid()) return;
    if (this.#readRegion()?.contains(this.#element.nativeElement.ownerDocument.activeElement)) this.#restoreReadFocus();
    if (state.operation === 'VALUE') {
      this.#valueRetryRequest = request;
      this.#retryValue.next();
    } else {
      this.#searchRetryRequest = request;
      this.#retrySearch.next(request.args.searchText || '');
    }
  };
}
