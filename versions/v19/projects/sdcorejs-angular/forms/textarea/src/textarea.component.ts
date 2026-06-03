/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
  model,
  computed,
  effect,
  untracked,
  OnDestroy,
  OnInit,
  output,
  viewChild,
  contentChild
} from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormGroup,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdLabelDefDirective, SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { ISdFormConfiguration, SD_FORM_CONFIGURATION, SdCustomValidator, SdFormControl, sdFormControlState, SdInlineErrorValidator, SdViewed, SdViewedInput, sdViewedInline, sdViewedTransform } from '@sdcorejs/angular/forms/models';
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { Size } from '@sdcorejs/utils/models';
import { NumberUtilities } from '@sdcorejs/angular/utilities/extensions';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdEmptyPipe } from '@sdcorejs/angular/pipes';

@Component({
  selector: 'sd-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  standalone: true,
  host: { '[class.sd-has-label]': '!!label()', '[class.sd-viewed]': 'isViewed() || isInline()' },
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    SdLabel,
    SdEmptyPipe,
    TranslatePipe,
  ],
})
export class SdTextarea implements OnInit, AfterViewInit, OnDestroy {
  id = `I${uuid.v4()}`;

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');
  sdViewDef = contentChild(SdViewDefDirective);
  sdLabelDef = contentChild(SdLabelDefDirective);
  sdSuffixDef = contentChild(SdSuffixDefDirective);

  // ==========================================
  // 2. INJECTS
  // ==========================================
  #ref = inject(ChangeDetectorRef);
  #formConfiguration = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #i18n = inject(I18nService);

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => this.autoIdInput() ? `forms-textarea-${this.autoIdInput()}` : undefined);

  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataInvalid = computed(() => (this.#state().invalid ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));

  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataMaxLength = computed(() => {
    const v = this.maxlength();
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

  name = input<string>(uuid.v4());

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
  label = input<string | undefined, string | undefined | null>(undefined, {
    transform: (v: string | undefined | null): string | undefined => v ?? undefined,
  });
  helperText = input<string | undefined, string | undefined | null>(undefined, {
    transform: (v: string | undefined | null): string | undefined => v ?? undefined,
  });
  placeholder = input<string | undefined, string | undefined | null>(undefined, {
    transform: (v: string | undefined | null): string | undefined => v ?? undefined,
  });
  rows = input<number>(5);
  
  hideInlineError = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` borderless inline-edit (textarea reads like text). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  autoHeight = input(false, { transform: booleanAttribute });

  // Tri-state `viewed` — shared primitive. No panel; in `'inline'` the textarea renders borderless.
  // why: disabled 'inline' falls back to static view (cannot edit a disabled control).
  readonly #viewedState = sdViewedInline(this.viewed, () => this.textareaRef()?.nativeElement?.focus(), this.disabled);
  /** `true` when `viewed === 'inline'`. */
  readonly isInline = this.#viewedState.isInline;
  /** `true` when `viewed === true` (static view, no editor). */
  readonly isViewed = this.#viewedState.isViewed;
  /** Focus the inline textarea. No-op unless `viewed='inline'`. */
  enterInlineEdit = (): void => this.#viewedState.enterInlineEdit();

  maxlength = input<number | null, unknown>(null, { 
    transform: (v) => (v != null && NumberUtilities.isPositiveInteger(Number(v))) ? Number(v) : null 
  });
  
  pattern = input<string | undefined, string | undefined | null>(undefined, {
    transform: (v: string | undefined | null): string | undefined => v ?? undefined,
  });
  validator = input<SdCustomValidator | undefined>();
  inlineError = input<string | undefined, string | undefined | null>(undefined, {
    transform: (v: string | undefined | null): string | undefined => v ?? undefined,
  });

  /**
   * Tổng hợp error message để hiển thị trong tooltip khi hideInlineError = true.
   */
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.textarea.required');
    if (errors['maxlength']) return this.#i18n.t('core.form.textarea.maxlength', { max: this.maxlength() ?? '' });
    if (errors['pattern']) return this.#i18n.t('core.form.textarea.invalid-pattern');
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.#formConfiguration?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  valueModel = model<any>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS
  // ==========================================
  sdChange = output<any>();

  // ==========================================
  // 5. INTERNAL STATE & STREAMS
  // ==========================================
  formControl = new SdFormControl();
  #subscription = new Subscription();
  isFocused = false;

  constructor() {
    // EFFECT 1: Sync model thay đổi từ bên ngoài
    effect(() => {
      const val = this.valueModel();
      untracked(() => {
        if (this.formControl.value !== val) {
          this.formControl.setValue(val, { emitEvent: false });
          // [IMPROVE] Cập nhật chiều cao khi value đổi từ bên ngoài
          if (this.autoHeight()) this.#adjustHeight();
        }
      });
    });

    // EFFECT 2: Sync Disable
    effect(() => {
      if (this.disabled()) this.formControl.disable({ emitEvent: false });
      else this.formControl.enable({ emitEvent: false });
    });

    // EFFECT 3: Update Validators
    effect(() => {
      const req = this.required();
      const maxLen = this.maxlength();
      const pat = this.pattern();
      const val = this.validator();
      const inl = this.inlineError();

      untracked(() => this.#updateValidator(req, maxLen, pat, val, inl));
    });
  }

  ngOnInit() {
    this.#subscription.add(this.formControl.sdChanges.subscribe(() => this.#ref.markForCheck()));
    this.#subscription.add(this.formControl.valueChanges.subscribe(this.#onChange));

    const formGroup = this.form();
    formGroup?.addControl(this.name(), this.formControl);
  }

  ngAfterViewInit() {
    if (this.autoHeight()) {
      setTimeout(() => this.#adjustHeight(), 0);
    }
  }

  ngOnDestroy() {
    const formGroup = this.form();
    formGroup?.removeControl(this.name());
    this.#subscription.unsubscribe();
  }

  // Hàm private tính toán chiều cao mượt mà
  #adjustHeight() {
    const el = this.textareaRef()?.nativeElement;
    if (el) {
      el.style.height = 'auto';
      el.style.overflowY = 'hidden';
      el.style.height = `${el.scrollHeight}px`;
    }
  }

  onFocus = () => {
    this.isFocused = true;
  };

  onBlur = () => {
    this.isFocused = false;
    const val: string = (this.formControl.value ?? '').toString();
    if (val.length > val.trim().length) {
      this.formControl.setValue(val.trim());
    }
  };

  onClick = () => {
    if (this.sdViewDef()?.templateRef) {
      if (!this.formControl.disabled && !this.isFocused) {
        this.focus();
      }
    }
  };

  blur = () => {
    this.textareaRef()?.nativeElement?.blur();
  };

  focus = () => {
    this.isFocused = true;
    setTimeout(() => {
      this.textareaRef()?.nativeElement?.focus();
    }, 100);
  };

  #onChange = (value: any) => {
    if (this.autoHeight()) {
      this.#adjustHeight();
    }
    this.valueModel.set(value);
    this.sdChange.emit(value);
  };

  #updateValidator = (
    req: boolean, maxLen: number | null, pat: string | undefined, 
    val: SdCustomValidator | undefined, inl: string | undefined
  ) => {
    this.formControl.clearValidators();
    this.formControl.clearAsyncValidators();
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];

    if (req) validators.push(Validators.required);
    if (maxLen != null) validators.push(Validators.maxLength(maxLen));
    if (pat) validators.push(Validators.pattern(pat));
    if (val) asyncValidators.push(this.#customValidator(val));
    if (inl) validators.push(SdInlineErrorValidator);

    this.formControl.setValidators(validators.length ? validators : null);
    this.formControl.setAsyncValidators(asyncValidators.length ? asyncValidators : null);
    this.formControl.updateValueAndValidity({ emitEvent: false });
  };

  getCurrentLength = (): number => {
    return (this.formControl.value ?? '').toString().length;
  };

  isMaxlengthExceeded = (): boolean => {
    const max = this.maxlength();
    return !!(max && max > 0 && this.getCurrentLength() > max);
  };

  #customValidator = (func: (value: any) => string | Promise<string>): AsyncValidatorFn => {
    return async (c: AbstractControl): Promise<Record<string, any> | null> => {
      const value = c.value || null;
      if (func && typeof func === 'function') {
        const result = func(value);
        if (result instanceof Promise) {
          const message = await result;
          if (message) return { customValidator: message };
          return null;
        }
        if (result) return { customValidator: result };
        return null;
      }
      return null;
    };
  };
}