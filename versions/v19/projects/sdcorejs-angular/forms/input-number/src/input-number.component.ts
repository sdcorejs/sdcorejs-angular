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
  output,
  TemplateRef,
  viewChild,
  contentChild,
  Output,
} from '@angular/core';
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
import * as uuid from 'uuid';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { ISdCoreConfiguration, SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  HandleSdCustomValidator,
  ISdFormConfiguration,
  SD_FORM_CONFIGURATION,
  SdCustomValidator,
  SdFormControl,
} from '@sdcorejs/angular/forms/models';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';
import { NumberUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdSize } from '@sdcorejs/angular/utilities/models';
import { Subscription } from 'rxjs';

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
  styleUrls: ['./input-number.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    SdLabel,
    SdFormatNumberPipe,
    SdView,
  ],
})
export class SdInputNumber implements OnDestroy, OnInit, AfterViewInit {
  id = `I${uuid.v4()}`;

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  control = viewChild<ElementRef<HTMLInputElement>>('control');
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  sdViewDef = contentChild(SdViewDefDirective);
  sdSuffixDef = contentChild(SdSuffixDefDirective);

  // ==========================================
  // 2. INJECTS
  // ==========================================
  private ref = inject(ChangeDetectorRef);
  private coreConfiguration = inject(SD_CORE_CONFIGURATION, { optional: true });
  private formatNumberPipe = inject(SdFormatNumberPipe);
  private formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-input-number-${this.autoIdInput()}` : undefined));
  name = input<string>(uuid.v4());

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

  hideInlineError = input(false, { transform: booleanAttribute });
  blurOnEnter = input(false, { transform: booleanAttribute });

  required = input(false, { transform: booleanAttribute });
  readonly = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  viewed = input(false, { transform: booleanAttribute });

  type = input<'negative' | 'positive' | undefined>();
  precision = input<number>(3);

  min = input<number | undefined, unknown>(undefined, { transform: v => (v == null ? undefined : Number(v)) });
  max = input<number | undefined, unknown>(undefined, { transform: v => (v == null ? undefined : Number(v)) });

  validator = input<SdCustomValidator | undefined>();
  inlineError = input<string | undefined>();

  /**
   * Tá»•ng há»£p error message Ä‘á»ƒ hiá»ƒn thá»‹ trong tooltip khi hideInlineError = true.
   * DÃ¹ng getter (khÃ´ng pháº£i computed) vÃ¬ formControl.errors khÃ´ng pháº£i Angular signal.
   */
  get errorTooltipMessage(): string | undefined {
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return 'Vui lÃ²ng nháº­p thÃ´ng tin';
    if (errors['min']) return `GiÃ¡ trá»‹ khÃ´ng Ä‘Æ°á»£c nhá» hÆ¡n ${this.min()}`;
    if (errors['max']) return `GiÃ¡ trá»‹ khÃ´ng Ä‘Æ°á»£c lá»›n hÆ¡n ${this.max()}`;
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  }

  hyperlink = input<string | null | undefined>();

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  valueModel = model<any>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS (Giá»¯ láº¡i sdFocusForceBlur)
  // ==========================================
  sdChange = output<any>();
  sdFocus = output<void>();
  sdBlur = output<any>();
  keyupEnter = output<any>();

  @Output() sdFocusForceBlur = new EventEmitter<void>();

  // ==========================================
  // 5. INTERNAL STATE & COMPUTED
  // ==========================================
  formControl = new SdFormControl();
  inputControl = new SdFormControl();
  #subscription = new Subscription();
  matcher = new SdInputNumberErrotStateMatcher(this.formControl);
  #preCompositionValue?: string;
  isFocused = false;

  // DÃ¹ng computed thay cho getter cÅ© Ä‘á»ƒ táº­n dá»¥ng cache
  decimalSeparator = computed(() => (this.coreConfiguration?.format?.number === '1.234.567,89' ? ',' : '.'));
  thousandsSeparator = computed(() => (this.coreConfiguration?.format?.number === '1.234.567,89' ? '.' : ','));

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
    // EFFECT 1: Sync model thay Ä‘á»•i tá»« bÃªn ngoÃ i (Parent -> Component)
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

    const formGroup = this.form();
    formGroup?.addControl(this.name(), this.formControl);

    this.ref.detectChanges();
  }

  ngOnDestroy() {
    const formGroup = this.form();
    formGroup?.removeControl(this.name());
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
    if (this.coreConfiguration?.format?.number === '1.234.567,89') {
      return NumberUtilities.toVN((text?.toString() || '').replace(/\./g, ''));
    } else {
      return NumberUtilities.toISO((text?.toString() || '').replace(/\,/g, ''));
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
    if (inl) validators.push(this.customInlineErrorValidator());

    this.formControl.setValidators(validators.length ? validators : null);
    this.formControl.setAsyncValidators(asyncValidators.length ? asyncValidators : null);
    this.formControl.updateValueAndValidity({ emitEvent: false });
  };

  customInlineErrorValidator(): ValidatorFn {
    return (): Record<string, any> | null => ({ inlineError: true });
  }

  #onChange = (value: any) => {
    this.valueModel.set(value ?? null);
    this.sdChange.emit(value ?? null);
    this.formControl.setValue(value ?? null, { emitEvent: false });
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

    // RxJS 7 chuáº©n bÃ i
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
    this.control()?.nativeElement?.blur();
  };

  focus = () => {
    this.isFocused = true;
    setTimeout(() => {
      this.control()?.nativeElement?.focus();
    }, 100);
  };
}

