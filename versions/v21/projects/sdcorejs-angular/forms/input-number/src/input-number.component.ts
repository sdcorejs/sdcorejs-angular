import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  input,
  model,
  computed,
  effect,
  untracked,
  OnDestroy,
  OnInit,
  Output,
  output,
  TemplateRef,
  viewChild,
  contentChild,
} from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
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

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdInlineText } from '@sdcorejs/angular/forms/inline-text';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { I18nService } from '@sdcorejs/angular/i18n';
import {
  HandleSdCustomValidator,
  SD_FORM_CONFIGURATION,
  SdCustomValidator,
  SdFormControl,
  SdInlineErrorValidator,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
} from '@sdcorejs/angular/forms/models';
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { NumberUtilities } from '@sdcorejs/angular/utilities/extensions';
import { Size } from '@sdcorejs/utils/models';
import { Subscription } from 'rxjs';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

class SdInputNumberErrotStateMatcher implements ErrorStateMatcher {
  constructor(private formControl: FormControl) {}
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(this.formControl?.invalid && (this.formControl?.dirty || this.formControl?.touched || isSubmitted));
  }
}

@Component({
  selector: 'sd-input-number',
  templateUrl: './input-number.component.html',
  styleUrl: './input-number.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: { '[class.sd-has-label]': '!!label()', '[class.sd-viewed]': 'isViewed() || isInline()' },
  imports: [
    SdIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatButtonModule,
    SdLabel,
    SdFormatNumberPipe,
    SdView,
    SdInlineText,
  ],
})
export class SdInputNumber implements OnDestroy, OnInit, AfterViewInit {
  id = `I${Utilities.generateUuid()}`;

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  control = viewChild<ElementRef<HTMLInputElement>>('control');
  /** The inline primitive — only present when `viewed='inline'`; drives focus/blur in that mode. */
  inlineRef = viewChild(SdInlineText);
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  sdViewDef = contentChild(SdViewDefDirective);
  sdSuffixDef = contentChild(SdSuffixDefDirective);

  // ==========================================
  // 2. INJECTS
  // ==========================================
  private ref = inject(ChangeDetectorRef);
  private coreConfiguration = inject(SD_CORE_CONFIGURATION, { optional: true });
  private formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #i18n = inject(I18nService);

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-input-number-${this.autoIdInput()}` : undefined));

  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataInvalid = computed(() => (this.#state().invalid ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));

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

  hideInlineError = input(false, { transform: booleanAttribute });
  blurOnEnter = input(false, { transform: booleanAttribute });
  /** Whether to show the value-gated clear button in edit and inline modes. */
  clearable = input(false, { transform: booleanAttribute });

  required = input(false, { transform: booleanAttribute });
  readonly = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` borderless inline-edit (input IS the face). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  // Tri-state `viewed` — shared primitive. No panel; in `'inline'` the input is borderless/transparent.
  readonly #viewedState = sdViewedInline(this.viewed, () => this.#focusActiveInput(), this.disabled);
  /** Focus whichever input is live: the inline primitive in `'inline'` mode, else the mat input. */
  #focusActiveInput = (): void => {
    const inline = this.inlineRef();
    if (inline) inline.focus();
    else this.control()?.nativeElement?.focus();
  };
  /** `true` when `viewed === 'inline'`. */
  readonly isInline = this.#viewedState.isInline;
  /** `true` when `viewed === true` (static view, no input). */
  readonly isViewed = this.#viewedState.isViewed;
  /** Focus the inline input. No-op unless `viewed='inline'`. */
  enterInlineEdit = (): void => this.#viewedState.enterInlineEdit();
  /** View display template: `sdViewDef` overrides the projected `#sdValue` for the static view (unified). */
  readonly viewTemplate = computed<TemplateRef<any> | undefined>(() => this.sdViewDef()?.templateRef ?? this.sdValueTemplate());

  type = input<'negative' | 'positive' | undefined>();
  precision = input<number>(3);
  format = input<'1,234,567.89' | '1.234.567,89' | undefined>(undefined);

  min = input<number | undefined, unknown>(undefined, { transform: v => (v == null ? undefined : Number(v)) });
  max = input<number | undefined, unknown>(undefined, { transform: v => (v == null ? undefined : Number(v)) });

  validator = input<SdCustomValidator | undefined>();
  inlineError = input<string | undefined>();

  /**
   * Tổng hợp error message để hiển thị trong tooltip khi hideInlineError = true.
   */
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.input-number.required');
    if (errors['min']) return this.#i18n.t('core.form.input-number.min', { min: this.min() ?? '' });
    if (errors['max']) return this.#i18n.t('core.form.input-number.max', { max: this.max() ?? '' });
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });

  hyperlink = input<string | null | undefined>();

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  valueModel = model<any>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS (Giữ lại sdFocusForceBlur)
  // ==========================================
  sdChange = output<any>();
  sdFocus = output<void>();
  sdBlur = output<any>();
  keyupEnter = output<any>();
  // why: same lý do như sd-input — sdChange fire per-keystroke. `cleared` là
  // intent dedicated cho X (clear button), consumer dùng để trigger reload ngay.
  cleared = output<void>();

  // why: focus handling reads EventEmitter.observed before emitting a forced blur event.
  @Output() readonly sdFocusForceBlur = new EventEmitter<void>();

  // ==========================================
  // 5. INTERNAL STATE & COMPUTED
  // ==========================================
  formControl = new SdFormControl();
  inputControl = new SdFormControl();
  readonly #formConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: this.name,
    control: computed(() => this.formControl),
  });
  #subscription = new Subscription();
  matcher = new SdInputNumberErrotStateMatcher(this.formControl);
  #preCompositionValue?: string;
  isFocused = false;

  // Dùng computed thay cho getter cũ để tận dụng cache
  decimalSeparator = computed(() => {
    const fmt = this.format() ?? this.coreConfiguration?.format?.number;
    return fmt === '1.234.567,89' ? ',' : '.';
  });
  thousandsSeparator = computed(() => {
    const fmt = this.format() ?? this.coreConfiguration?.format?.number;
    return fmt === '1.234.567,89' ? '.' : ',';
  });

  regexPattern = computed(() => {
    const decimal = this.decimalSeparator();
    const thousand = this.thousandsSeparator();
    const escDecimal = decimal === '.' ? '\\.' : decimal;
    const escThousand = thousand === '.' ? '\\.' : thousand;

    const integerPart = `(([0-9]+(${escThousand}[0-9])?)+)`;
    const decimalPart = this.precision() > 0 ? `(${escDecimal}[0-9]{0,${this.precision()}})?` : '';

    const baseReg = `${integerPart}${decimalPart}$`;

    if (this.type() === 'negative') return `[-]${baseReg}`;
    if (!this.type()) return `[-]?${baseReg}`;
    return baseReg;
  });

  constructor() {
    // EFFECT 1: Sync model thay đổi từ bên ngoài (Parent -> Component)
    effect(() => {
      const val = this.valueModel();
      untracked(() => {
        if (this.formControl.value !== val) {
          this.formControl.setValue(val, { emitEvent: false });
          if (val != null && val !== '') {
            const strVal = val.toString().replace(/\./g, this.decimalSeparator());
            this.inputControl.setValue(this.#getValueWithFormat(strVal), { emitEvent: false });
          } else {
            this.inputControl.setValue('', { emitEvent: false });
          }
        }
      });
    });

    // EFFECT 2: Sync Disable
    effect(() => {
      if (this.disabled()) {
        this.inputControl.disable({ emitEvent: false });
        this.formControl.disable({ emitEvent: false });
      } else {
        this.inputControl.enable({ emitEvent: false });
        this.formControl.enable({ emitEvent: false });
      }
    });

    // EFFECT 3: Update Validator
    effect(() => {
      const req = this.required();
      const minVal = this.min();
      const maxVal = this.max();
      const val = this.validator();
      const inl = this.inlineError();

      untracked(() => {
        this.#updateValidator(req, minVal, maxVal, val, inl);
      });
    });
  }

  ngOnInit() {
    this.#subscription.add(
      this.inputControl.touchChanges.subscribe(() => {
        this.formControl.markAsTouched();
        this.ref.markForCheck();
      })
    );
    this.#subscription.add(
      this.formControl.sdChanges.subscribe(() => {
        this.ref.markForCheck();
      })
    );
    this.#subscription.add(
      this.inputControl.sdChanges.subscribe(() => {
        this.ref.markForCheck();
      })
    );
  }

  ngAfterViewInit() {
    this.#subscription.add(
      this.inputControl.valueChanges.subscribe(() => {
        const val = this.inputControl.value;
        if (!val) {
          this.#onChange(undefined);
          return;
        }
        const value = this.#toNumber(val);
        if (!isNaN(value)) {
          this.inputControl.setValue(this.#getValueWithFormat(val), { emitEvent: false });
          this.#onChange(value);
        }
      })
    );

    this.ref.detectChanges();
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  #getValueWithFormat = (value: string) => {
    const arrayNext = value.split(this.decimalSeparator());
    if (arrayNext.length >= 2) {
      return `${this.#formatNumber(arrayNext[0])}${this.decimalSeparator()}${arrayNext[1]}`;
    }
    return this.#formatNumber(value);
  };

  #formatNumber = (text: any) => {
    const fmt = this.format() ?? this.coreConfiguration?.format?.number;
    if (fmt === '1.234.567,89') {
      return NumberUtilities.toVN((text?.toString() || '').replace(/\./g, ''));
    } else {
      return NumberUtilities.toISO((text?.toString() || '').replace(/,/g, ''));
    }
  };

  #toNumber = (text: any): number => {
    const raw = text?.toString() || '';
    const value = raw.split(this.thousandsSeparator()).join('').replace(this.decimalSeparator(), '.');
    return +value;
  };

  reValidate = () => {
    this.formControl.updateValueAndValidity();
  };

  #updateValidator = (
    req: boolean,
    minVal: number | undefined,
    maxVal: number | undefined,
    val: SdCustomValidator | undefined,
    inl: string | undefined
  ) => {
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];

    if (req) validators.push(Validators.required);
    if (minVal != null) validators.push(Validators.min(minVal));
    if (maxVal != null) validators.push(Validators.max(maxVal));
    if (val) asyncValidators.push(HandleSdCustomValidator(val));
    if (inl) validators.push(SdInlineErrorValidator);

    this.formControl.setValidators(validators.length ? validators : null);
    this.formControl.setAsyncValidators(asyncValidators.length ? asyncValidators : null);
    this.formControl.updateValueAndValidity({ emitEvent: false });
  };

  #onChange = (value: any) => {
    this.valueModel.set(value ?? null);
    this.sdChange.emit(value ?? null);
    // why: KHÔNG dùng { emitEvent: false } ở đây. formControl mang async validator
    // ([validator] → HandleSdCustomValidator). Nếu set value mà chặn event thì khi async
    // resolve, setErrors cũng chạy với emitEvent:false → AbstractControl.events không phát →
    // #state (sdFormControlState) không tick → errorMessage (computed theo #state) không
    // recompute → message lỗi không hiển thị (dù form invalid + viền đỏ). Để event lan ra để
    // #state tick. formControl.valueChanges không có subscriber nào nên không gây vòng lặp.
    this.formControl.setValue(value ?? null);
  };

  // why: method (không phải computed) để template re-eval mỗi change-detection.
  // clearable là opt-in; required không được clear; disabled/readonly ẩn nút.
  showClear = (): boolean => {
    if (!this.clearable() || this.required() || this.disabled() || this.readonly()) return false;
    return !sdIsEmpty(this.valueModel());
  };

  clear = ($event?: Event) => {
    $event?.stopPropagation();
    if (sdIsEmpty(this.formControl.value)) return;
    // Reset cả ô hiển thị (inputControl) lẫn giá trị thật (formControl), rồi
    // đồng bộ model + sdChange một lần.
    this.inputControl.setValue('', { emitEvent: false });
    this.formControl.setValue(null, { emitEvent: false });
    this.valueModel.set(null);
    this.sdChange.emit(null);
    this.cleared.emit();
  };

  onKeyupEnter = () => {
    const val: string = (this.inputControl.value ?? '').toString();
    if (val.length > val.trim().length) {
      this.inputControl.setValue(val.trim());
    }
    this.keyupEnter.emit(this.inputControl.value);
    if (this.blurOnEnter()) {
      this.blur();
    }
  };

  onKeydown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key == 'v') {
      this.#checkValue(event, '');
      return;
    }
    const key = event.keyCode || event.charCode;
    if (key == 8 || key == 46 || key == 37 || key == 39 || key == 35 || key == 36 || key == 9) return;
    if (event.ctrlKey && (event.key == 'c' || event.key == 'x' || event.key == 'a')) return;
    if (event.shiftKey && key == 9) return;

    this.#checkValue(event, event.key);
  };

  onPaste(event: ClipboardEvent) {
    const nextKey = event?.clipboardData?.getData('text');
    this.#checkValue(event, nextKey);
  }

  onCompositionEnd(event: CompositionEvent) {
    const compositionValue = event.data;
    const regExp = new RegExp(`^${this.regexPattern()}`, 'g');
    if (compositionValue && !String(compositionValue).match(regExp)) {
      this.inputControl.setValue(this.#preCompositionValue || '');
    }
    this.#preCompositionValue = undefined;
  }

  onCompositionStart(event: CompositionEvent) {
    this.#preCompositionValue = this.inputControl.value;
  }

  #checkValue = (event: any, nextKey?: string) => {
    const current: string = event?.target?.value;
    const curval_arr = current.split('');
    curval_arr.splice(event.target.selectionStart, event.target.selectionEnd - event.target.selectionStart, nextKey || '');
    const newval = curval_arr.join('');

    if (this.type() !== 'positive' && newval === '-') return;

    const regExp = new RegExp(`^${this.regexPattern()}`, 'g');
    if (newval && !String(newval).match(regExp)) {
      event.preventDefault();
      return;
    }
  };

  onFocus = () => {
    this.isFocused = true;
    this.sdFocus.emit();

    // RxJS 7 chuẩn bài
    if (this.sdFocusForceBlur.observed) {
      this.blur();
      this.sdFocusForceBlur.emit();
    }
  };

  onBlur = () => {
    this.isFocused = false;
    const val: string = (this.inputControl.value ?? '').toString();

    if (!val || val.trim() === '') {
      this.inputControl.setValue('', { emitEvent: false });
      this.#onChange(null);
      this.sdBlur.emit(null);
      return;
    }

    const arrayValue = val.split(this.decimalSeparator());
    if (arrayValue.length >= 2 && arrayValue[1] == '') {
      this.inputControl.setValue(this.#formatNumber(arrayValue[0]));
      return;
    }

    if (val.length > val.trim().length) {
      this.inputControl.setValue(val.trim());
    }
    this.sdBlur.emit(this.formControl.value);
  };

  onClick = () => {
    if (this.sdViewDef()?.templateRef) {
      if (!this.formControl.disabled && !this.isFocused) {
        this.focus();
      }
    }
  };

  blur = () => {
    this.isFocused = false;
    const inline = this.inlineRef();
    if (inline) inline.blur();
    else this.control()?.nativeElement?.blur();
  };

  focus = () => {
    this.isFocused = true;
    setTimeout(() => {
      this.#focusActiveInput();
    }, 100);
  };
}
