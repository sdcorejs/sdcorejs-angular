import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  EventEmitter,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
  Output,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import { AsyncValidatorFn, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdInlineText } from '@sdcorejs/angular/forms/inline-text';
import { SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  HandleSdCustomValidator,
  SD_FORM_CONFIGURATION,
  SdCustomValidator,
  SdFormControl,
  sdFormControlState,
  SdInlineErrorValidator,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
} from '@sdcorejs/angular/forms/models';
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import { Size } from '@sdcorejs/utils/models';
import type { ValidationPatternType } from '@sdcorejs/utils/models';
import { VALIDATION_PATTERNS } from '@sdcorejs/utils/constants';

// Back-compat: SdPatternType cũ → ValidationPatternType mới.
// 3 key đã đổi tên trong @sdcorejs/utils v1.x.
const LEGACY_PATTERN_ALIAS: Record<string, ValidationPatternType> = {
  PHONE_VN: 'VN_PHONE',
  IDVN: 'VN_ID',
  IDVN_OR_PASSPORT: 'VN_ID_OR_PASSPORT',
};
import { Subscription } from 'rxjs';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

import { SdInputMask, SdInputMaskResult, SdInputMaskStatus, sdResolveInputMask } from './input-mask';

@Component({
  selector: 'sd-input',
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
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
    SdView,
    SdInlineText,
    TranslatePipe,
  ],
})
export class SdInput implements OnDestroy, OnInit, AfterViewInit {
  id = `I${Utilities.generateUuid()}`;

  // ==========================================
  // 1. SIGNAL QUERIES (Thay thế @ViewChild / @ContentChild)
  // ==========================================
  control = viewChild<ElementRef<HTMLInputElement>>('control');
  /** The inline primitive — only present when `viewed='inline'`; drives focus/blur in that mode. */
  inlineRef = viewChild(SdInlineText);
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  sdSuffixDef = contentChild(SdSuffixDefDirective);
  sdViewDef = contentChild(SdViewDefDirective);

  // ==========================================
  // 2. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-input-${this.autoIdInput()}` : undefined));

  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataInvalid = computed(() => (this.#state().invalid ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed<string | null>(() => {
    if (this.type() === 'password') return null;
    return sdSerializeDataValue(this.#state().value);
  });

  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataMaxLength = computed(() => {
    const v = this.maxlength();
    return v == null ? null : String(v);
  });
  readonly dataMinLength = computed(() => {
    const v = this.minlength();
    return v == null ? null : String(v);
  });
  readonly dataPattern = computed(() => {
    const v = this.pattern();
    return v == null || v === '' ? null : String(v);
  });
  readonly dataErrorMessage = computed(() => {
    void this.#state();
    const msg = this.errorMessage();
    return msg && msg.length > 0 ? msg : null;
  });

  name = input<string>(Utilities.generateUuid());

  // ==========================================
  // 3. INJECT (Thay thế Constructor DI)
  // ==========================================
  #ref = inject(ChangeDetectorRef);
  #formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #i18n = inject(I18nService);

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.#formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

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
  type = input<'text' | 'number' | 'password' | 'email'>('text');
  mask = input<SdInputMask | null | undefined>();
  readonly maskAdapter = computed(() => sdResolveInputMask(this.mask()));
  readonly effectiveType = computed(() => (this.maskAdapter() ? 'text' : this.type()));
  readonly inputMode = computed(() => this.maskAdapter()?.inputMode);
  readonly maxDisplayLength = computed(() => this.maskAdapter()?.maxDisplayLength);

  hideInlineError = input(false, { transform: booleanAttribute });
  blurOnEnter = input(false, { transform: booleanAttribute });
  /** Whether to show the value-gated clear button in edit and inline modes. */
  clearable = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  readonly = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` borderless inline-edit (no panel — the input IS the face). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  /** Focus whichever input is live: the inline primitive in `'inline'` mode, else the mat input. */
  #focusActiveInput = (): void => {
    const inline = this.inlineRef();
    if (inline) inline.focus();
    else this.control()?.nativeElement?.focus();
  };
  /** View display template: `sdViewDef` overrides the projected `#sdValue` for the static view (unified). */
  readonly viewTemplate = computed<TemplateRef<any> | undefined>(() => this.sdViewDef()?.templateRef ?? this.sdValueTemplate());

  minlength = input<number | undefined, unknown>(undefined, { transform: v => (v == null ? undefined : Number(v)) });
  maxlength = input<number | undefined, unknown>(undefined, { transform: v => (v == null ? undefined : Number(v)) });

  pattern = input<ValidationPatternType | string | undefined | null>();
  patternErrorMessage = input<string | undefined | null>();

  // Bỏ qua nếu val không phải string (number/boolean/object truyền nhầm → tránh validator hỏng)
  #lookupPattern = (val: unknown) => {
    if (typeof val !== 'string') return undefined;
    const key = (LEGACY_PATTERN_ALIAS[val] ?? val) as ValidationPatternType;
    return VALIDATION_PATTERNS.find(e => e.type === key);
  };

  resolvedPattern = computed(() => {
    const val = this.pattern();
    if (typeof val !== 'string') return undefined;
    const patternObj = this.#lookupPattern(val);
    return patternObj ? patternObj.pattern : val;
  });

  resolvedPatternErrorMsg = computed(() => {
    // patternObj.errorMessage là i18n key (vd 'core.validator.email.error') → wrap qua i18n.t() để hiển thị string đã dịch
    const customMsg = this.patternErrorMessage();
    if (customMsg) return customMsg;
    const patternObj = this.#lookupPattern(this.pattern());
    return patternObj ? this.#i18n.t(patternObj.errorMessage) : undefined;
  });

  /**
   * First active error message for tooltip display when `hideInlineError = true`.
   * Re-runs only when `#state` ticks (value / status / touched change) — no longer
   * invoked on every change-detection cycle as a getter would be.
   */
  readonly errorMessage = computed<string | undefined>(() => {
    // Subscribe to form-state changes so the computed re-evaluates correctly.
    void this.#state();
    // why: `#state` KHÔNG đủ. Connector cài/gỡ validator bằng `updateValueAndValidity({
    // emitEvent: false })` → `formControl.errors` đổi mà không phát event nào → `#state` không
    // tick. Nên phải đọc VÔ ĐIỀU KIỆN cả `required` lẫn danh sách validator do component sở hữu
    // (`#validators` gói min/max/pattern/mask/inlineError, mảng mới mỗi lần đổi) làm dependency.
    // Không có 2 dòng này thì bật `[required]` lúc RUNTIME cho ra control invalid + viền đỏ nhưng
    // message giữ nguyên giá trị cũ dưới OnPush.
    void this.required();
    void this.#validators();
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.input.required');
    if (errors['maxlength']) return this.#i18n.t('core.form.input.maxlength', { max: this.maxlength() ?? '' });
    if (errors['maskIncomplete']) return this.#i18n.t('core.form.input.mask-incomplete');
    if (errors['maskInvalid']) return this.#i18n.t('core.form.input.mask-invalid');
    if (errors['pattern']) return this.resolvedPatternErrorMsg() || this.#i18n.t('core.form.input.invalid-pattern');
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });

  validator = input<SdCustomValidator | undefined>();
  inlineError = input<string | undefined>();
  hyperlink = input<string | null | undefined>();

  valueModel = model<any>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS (Thay thế @Output)
  // ==========================================
  sdChange = output<any>();
  sdFocus = output<void>(); // Đổi sang void vì không truyền data
  sdBlur = output<any>();
  keyupEnter = output<any>();
  // why: sdChange fire per-keystroke nên consumer KHÔNG dùng nó để trigger
  // "commit filter" (sẽ over-reload). `cleared` là intent rõ ràng cho action
  // X (clear button) — consumer như column-filter dùng để fire reload ngay.
  cleared = output<void>();

  // why: focus handling reads EventEmitter.observed before emitting a forced blur event.
  @Output() readonly sdFocusForceBlur = new EventEmitter<void>();

  formControl = new SdFormControl();
  /** Display-only control used by the input element while a mask is active. */
  readonly displayControl = new SdFormControl();
  readonly activeControl = computed(() => (this.maskAdapter() ? this.displayControl : this.formControl));
  readonly maskStatus = signal<SdInputMaskStatus>('empty');
  readonly displayValue = computed(() => {
    const adapter = this.maskAdapter();
    return adapter ? adapter.format(this.formControl.value == null ? '' : String(this.formControl.value)).display : this.formControl.value;
  });
  #subscription = new Subscription();
  #isComposing = false;
  #pendingMaskResult: SdInputMaskResult | undefined;
  isFocused = false;
  readonly #validators = computed<readonly ValidatorFn[]>(() => {
    const validators: ValidatorFn[] = [];
    const min = this.minlength();
    const max = this.maxlength();
    const pattern = this.resolvedPattern();

    if (min && min > 0) validators.push(Validators.minLength(min));
    if (max && max > 0) validators.push(Validators.maxLength(max));
    if (pattern) validators.push(Validators.pattern(pattern));
    if (this.maskAdapter()) {
      const maskStatus = this.maskStatus();
      validators.push(() => {
        if (maskStatus === 'invalid') return { maskInvalid: true };
        if (maskStatus === 'incomplete') return { maskIncomplete: true };
        return null;
      });
    }
    if (this.inlineError()) validators.push(SdInlineErrorValidator);
    return validators;
  });
  readonly #asyncValidators = computed<readonly AsyncValidatorFn[]>(() => {
    const validator = this.validator();
    return validator ? [HandleSdCustomValidator(validator)] : [];
  });
  readonly #formConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: this.name,
    control: computed(() => this.formControl),
    validators: this.#validators,
    asyncValidators: this.#asyncValidators,
    required: this.required,
    disabled: this.disabled,
    readonly: this.readonly,
    viewed: this.viewed,
    validationError: computed(() => this.errorMessage()),
  });
  /** Shared reactive form policy consumed by template-facing state below. */
  readonly connectorState = this.#formConnector.state;
  readonly isReadonly = computed(() => this.connectorState().readonly);
  // why: KHÔNG lấy `connectorState().validationError`. Cổng hiển thị của connector là
  // `snapshot.invalid` — snapshot đó do sdFormControlState memo hoá và chỉ đổi khi control PHÁT
  // event. Connector lại cài validator im lặng (`emitEvent: false`), nên bật `[required]` lúc
  // runtime làm control invalid thật mà snapshot vẫn "valid" → message bị nuốt (viền đỏ, không
  // chữ). Đọc trực tiếp `formControl` cho trạng thái tươi, vẫn giữ nguyên luật interaction-gated
  // (chỉ hiện sau khi người dùng đã chạm/sửa) như connector.
  readonly visibleErrorMessage = computed(() => {
    const message = this.errorMessage();
    if (!message) return undefined;
    void this.#state();
    const control = this.formControl;
    return control.invalid && (control.touched || control.dirty) ? message : undefined;
  });

  // Tri-state `viewed` — shared primitive. Input has NO panel; in `'inline'` the input is rendered
  // borderless/transparent (looks like text), always editable — clicking/focusing it edits directly.
  readonly #viewedState = sdViewedInline(
    computed(() => this.connectorState().viewed),
    () => this.#focusActiveInput(),
    this.disabled
  );
  /** `true` when `viewed === 'inline'`. */
  readonly isInline = this.#viewedState.isInline;
  /** `true` when `viewed === true` (static view, no input). */
  readonly isViewed = this.#viewedState.isViewed;
  /** Focus the inline input. No-op unless `viewed='inline'`. */
  enterInlineEdit = (): void => this.#viewedState.enterInlineEdit();

  constructor() {
    effect(() => {
      const val = this.valueModel();
      const adapter = this.maskAdapter();
      untracked(() => {
        if (this.formControl.value !== val) {
          this.formControl.setValue(val, { emitEvent: false });
        }
        if (adapter) {
          const rawValue = val == null ? '' : String(val);
          const result = this.#pendingMaskResult?.raw === rawValue ? this.#pendingMaskResult : adapter.format(rawValue);
          this.#pendingMaskResult = undefined;
          this.maskStatus.set(result.status);
          if (this.displayControl.value !== result.display) {
            this.displayControl.setValue(result.display, { emitEvent: false });
          }
        } else {
          this.maskStatus.set('empty');
        }
      });
    });

    effect(() => {
      const masked = !!this.maskAdapter();
      const disabled = this.disabled();
      untracked(() => {
        if (masked && disabled) this.displayControl.disable({ emitEvent: false });
        else this.displayControl.enable({ emitEvent: false });
      });
    });
  }

  ngOnInit() {
    this.#subscription.add(
      this.formControl.sdChanges.subscribe(() => {
        this.#ref.markForCheck();
      })
    );
  }

  ngAfterViewInit() {
    this.#subscription.add(this.formControl.valueChanges.subscribe(this.#onChange));
    this.#subscription.add(this.displayControl.valueChanges.subscribe(value => this.#onMaskedDisplayChange(value)));

    this.#ref.detectChanges();
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  reValidate = () => {
    this.formControl.updateValueAndValidity();
  };

  getCurrentLength = (): number => {
    return (this.formControl.value ?? '').toString().length;
  };

  isMaxlengthExceeded = (): boolean => {
    const max = this.maxlength();
    return !!(max && max > 0 && this.getCurrentLength() > max);
  };

  // why: clear() phải để formControl phát event (xem comment ở clear()), nhưng nó ĐÃ tự
  // set model + emit sdChange(null) rồi. Không chặn thì #onChange chạy thêm một vòng với
  // `null ?? ''` → consumer nhận thừa một sdChange('') trước sdChange(null) và model bị
  // nhảy '' → null. Cờ chỉ sống trong đúng lời gọi setValue đồng bộ của clear().
  #isClearing = false;

  #onChange = () => {
    if (this.#isClearing) return;
    const value = this.formControl.value ?? '';

    this.valueModel.set(value);
    this.sdChange.emit(value);
  };

  #onMaskedDisplayChange(value: unknown): void {
    const adapter = this.maskAdapter();
    if (!adapter || this.#isComposing) return;

    const nativeInput = this.control()?.nativeElement;
    const display = value == null ? '' : String(value);
    const result = adapter.parse(display, nativeInput?.selectionStart, nativeInput?.selectionEnd);
    this.#applyMaskResult(result);
  }

  #applyMaskResult(result: SdInputMaskResult): void {
    this.maskStatus.set(result.status);
    if (this.displayControl.value !== result.display) {
      this.displayControl.setValue(result.display, { emitEvent: false });
    }
    if (this.formControl.value !== result.raw) {
      this.#pendingMaskResult = this.valueModel() === result.raw ? undefined : result;
      this.formControl.setValue(result.raw);
    } else {
      this.#pendingMaskResult = undefined;
      this.formControl.updateValueAndValidity({ emitEvent: false });
    }

    queueMicrotask(() => {
      const nativeInput = this.control()?.nativeElement;
      if (nativeInput) {
        nativeInput.setSelectionRange(result.selectionStart, result.selectionEnd);
      }
    });
  }

  onCompositionStart(): void {
    if (this.maskAdapter()) this.#isComposing = true;
  }

  onCompositionEnd(event: CompositionEvent): void {
    const adapter = this.maskAdapter();
    if (!adapter) return;
    this.#isComposing = false;
    const target = event.target as HTMLInputElement | null;
    const display = target?.value ?? String(this.displayControl.value ?? '');
    this.#applyMaskResult(adapter.parse(display, target?.selectionStart, target?.selectionEnd));
  }

  // why: dựa trên valueModel() (signal model-input) thay vì formControl.value —
  // khi bị wrap (vd <sd-input-color>) effect set formControl chạy SAU lúc template
  // eval nên formControl.value chưa kịp có; valueModel() thì có ngay. Method (không
  // computed) để re-eval mỗi CD. clearable là opt-in; required không được clear;
  // disabled/readonly ẩn nút.
  showClear = (): boolean => {
    if (!this.clearable() || this.required() || this.disabled() || this.readonly()) return false;
    return !sdIsEmpty(this.valueModel());
  };

  clear = ($event?: Event) => {
    $event?.stopPropagation();
    if (sdIsEmpty(this.valueModel()) && sdIsEmpty(this.formControl.value)) return;
    // why: clear là thao tác chủ động → model về null (không phải '' hay undefined).
    // undefined chỉ dành cho trạng thái pristine chưa từng nhập.
    // why: KHÔNG dùng { emitEvent: false } cho formControl. Control này mang required /
    // pattern / mask validator và cả async validator ([validator] → HandleSdCustomValidator).
    // Chặn event thì AbstractControl.events không phát → #state (sdFormControlState) không
    // tick → errorMessage / dataEmpty / dataValue / visibleErrorMessage giữ nguyên giá trị
    // cũ → xoá xong field rỗng nhưng lỗi required KHÔNG hiện (chỉ còn viền đỏ). Đây đúng là
    // lỗi đã sửa ở #onChange của sd-input-number, chỉ sót nhánh clear().
    // displayControl thì VẪN giữ emitEvent:false — valueChanges của nó có subscriber
    // (#onMaskedDisplayChange) sẽ parse ngược và ghi đè lại formControl.
    this.#isClearing = true;
    try {
      this.formControl.setValue(null);
    } finally {
      this.#isClearing = false;
    }
    this.displayControl.setValue('', { emitEvent: false });
    this.maskStatus.set('empty');
    this.valueModel.set(null);
    this.sdChange.emit(null);
    this.cleared.emit();
  };

  onKeyupEnter = () => {
    const val: string = (this.formControl.value ?? '').toString();
    if (!this.maskAdapter() && val.length > val.trim().length) {
      this.formControl.setValue(val.trim());
    }
    this.keyupEnter.emit(this.formControl.value);
    if (this.blurOnEnter()) {
      this.blur();
    }
  };

  onFocus = () => {
    this.isFocused = true;
    this.sdFocus.emit(); // Gọi .emit() y hệt như cũ

    if (this.sdFocusForceBlur.observed) {
      this.blur();
      this.sdFocusForceBlur.emit();
    }
  };

  onBlur = () => {
    this.isFocused = false;
    const val: string = (this.formControl.value ?? '').toString();
    if (!this.maskAdapter() && val.length > val.trim().length) {
      this.formControl.setValue(val.trim());
    }
    this.sdBlur.emit(this.formControl.value);
  };

  onClick = () => {
    // 🚨 GỌI SIGNAL: Phải thêm () vào sdViewDef
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
