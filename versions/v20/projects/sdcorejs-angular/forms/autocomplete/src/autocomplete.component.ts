import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
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
import {
  AsyncValidatorFn,
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdItemDefDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  HandleSdCustomValidator,
  SD_FORM_CONFIGURATION,
  SdCustomValidator,
  SdFormControl,
  SdInlineErrorValidator,
  SdSearch,
  SdSelectionData,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
} from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { ArrayUtilities } from '@sdcorejs/angular/utilities/extensions';
import { Size } from '@sdcorejs/utils/models';
import { Utilities } from '@sdcorejs/utils/fns';
import { Observable, Subscription, combineLatest, defer, from, of, timer } from 'rxjs';
import { catchError, debounce, map, startWith, switchMap, tap } from 'rxjs/operators';
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
export class SdAutocomplete<T = any> implements OnInit, OnDestroy, AfterViewInit {
  id = `I${Utilities.generateUuid()}`;

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
  @Output() sdAdd = new EventEmitter<void>();

  // ==========================================
  // 5. INTERNAL STATE & STREAMS
  // ==========================================
  loading = signal(false);
  isFocused = false;
  isTyping = signal(false);

  inputControl = new SdFormControl();
  formControl = new SdFormControl();
  matcher = new SdAutocompleteErrotStateMatcher(this.formControl);

  #cache: Record<string, T[]> = {};
  #item: Record<string, T> = {};
  #subscription = new Subscription();

  // RXJS STREAMS
  #items$ = toObservable(this.items);
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

    effect(() => {
      const req = this.required();
      const val = this.validator();
      const inl = this.inlineError();
      untracked(() => this.#updateValidator(req, val, inl));
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

    this.#subscription.add(this.inputControl.valueChanges.subscribe(() => this.isTyping.set(true)));

    const cleanItems$ = this.#items$.pipe(
      tap(() => {
        this.#cache = {};
      }),
      map(items => {
        if (!items) return [];
        if (Array.isArray(items)) return items.filter(e => e !== null && e !== undefined);
        return items;
      })
    );

    const filteredItems$ = combineLatest([
      cleanItems$,
      this.inputControl.valueChanges.pipe(
        startWith(''),
        debounce(() => timer(typeof this.items() === 'function' ? 500 : 0))
      ),
    ]).pipe(
      tap(() => this.isTyping.set(false)),
      switchMap(([items, searchText]) => {
        const sText = searchText || '';

        if (typeof items !== 'function') {
          // [UPDATED]: Hỗ trợ search lồng nhau (nested) local
          const filtered = items.filter((e: any) => {
            const v = String(this.getNestedValue(e, this.valueField()) || '').toLowerCase();
            const d = String(this.getNestedValue(e, this.displayField()) || '').toLowerCase();
            const q = sText.toLowerCase();
            return v.includes(q) || d.includes(q);
          });
          return of(ArrayUtilities.paging(filtered, this.limit()));
        }

        const key = Utilities.hash({
          checksum: this.cacheChecksum() || null,
          searchText: sText,
        });

        if (this.#cache[key] !== undefined) {
          return of(this.#cache[key]);
        }

        this.loading.set(true);

        let obs: Observable<T[]>;
        const func = items({ type: 'SEARCH', searchText: sText });
        if (func instanceof Promise) obs = defer(() => from(func));
        else obs = func;

        return obs.pipe(
          map(data => {
            this.#cache[key] = data || [];
            // [UPDATED]: Lưu cache #item theo nested value
            (this.#cache[key] || []).forEach((e: any) => {
              const valKey = this.getNestedValue(e, this.valueField());
              if (valKey != null) {
                this.#item[valKey] = e;
              }
            });
            return this.#cache[key];
          }),
          catchError(() => of([]))
        );
      }),
      tap(() => this.loading.set(false))
    );

    const selected$ = combineLatest([cleanItems$, this.#valueModel$]).pipe(
      switchMap(([items, val]) => {
        const vField = this.valueField();
        const dField = this.displayField();

        if (!vField) return of(val);

        if (val || val === 0) {
          if (typeof items === 'function') {
            if (this.#item[val as any]) return of(this.#item[val as any]);

            this.loading.set(true);

            let obs: Observable<T[]>;
            const func = items({ type: 'VALUE', value: val as any });
            if (func instanceof Promise) obs = defer(() => from(func));
            else obs = func;

            return obs.pipe(
              map(data => {
                // [UPDATED]: Lưu cache #item theo nested value
                (data || []).forEach((e: any) => {
                  const valKey = this.getNestedValue(e, vField);
                  if (valKey != null) {
                    this.#item[valKey] = e;
                  }
                });
                return this.#item[val as any] || { [vField]: val, [dField!]: val };
              }),
              catchError(() => of({ [vField]: val, [dField!]: val }))
            );
          }
          // [UPDATED]: Tìm local theo nested field
          return of((items as any[]).find((e: any) => this.getNestedValue(e, vField) === val));
        }
        return of('');
      }),
      tap(() => this.loading.set(false))
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

  ngAfterViewInit() {
    const formGroup = this.form();
    formGroup?.addControl(this.name(), this.formControl);
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
    const formGroup = this.form();
    formGroup?.removeControl(this.name());

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
    this.inputControl.setValue('', { emitEvent: false });
  };

  onFocus = () => {
    this.isFocused = true;
    this.filteredItems.set([]);

    if (typeof this.items() === 'function') {
      this.loading.set(true);
    }

    this.inputControl.setValue('', { emitEvent: true });
  };

  onBlur = () => {
    this.isFocused = false;
    this.inputControl.setValue('', { emitEvent: false });
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
    setTimeout(() => {
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
    if (this.valueModel()) {
      this.formControl.setValue(null, { emitEvent: false });
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
    this.inputControl.updateValueAndValidity({ emitEvent: true });
  };

  #updateValidator = (req: boolean, val: SdCustomValidator | undefined, inl: string | undefined) => {
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];

    if (req) validators.push(Validators.required);
    if (val) asyncValidators.push(HandleSdCustomValidator(val));
    if (inl) validators.push(SdInlineErrorValidator);

    this.formControl.setValidators(validators.length ? validators : null);
    this.formControl.setAsyncValidators(asyncValidators.length ? asyncValidators : null);
    this.formControl.updateValueAndValidity({ emitEvent: false });
  };
}
