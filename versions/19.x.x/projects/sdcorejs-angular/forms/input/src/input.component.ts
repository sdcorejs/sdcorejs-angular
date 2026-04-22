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
  output,
  Output,
  TemplateRef,
  untracked,
  viewChild,
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
import { MatButtonModule } from '@angular/material/button';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdSuffixDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { HandleSdCustomValidator, SD_FORM_CONFIGURATION, SdCustomValidator, SdFormControl } from '@sdcorejs/angular/forms/models';
import { SdPatternCommons, SdPatternType, SdSize } from '@sdcorejs/angular/utilities/models';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';

@Component({
  selector: 'sd-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
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
    SdView,
  ],
})
export class SdInput implements OnDestroy, OnInit, AfterViewInit {
  id = `I${uuid.v4()}`;

  // ==========================================
  // 1. SIGNAL QUERIES (Thay tháº¿ @ViewChild / @ContentChild)
  // ==========================================
  control = viewChild<ElementRef<HTMLInputElement>>('control');
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  sdSuffixDef = contentChild(SdSuffixDefDirective);
  sdViewDef = contentChild(SdViewDefDirective);

  // ==========================================
  // 2. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-input-${this.autoIdInput()}` : undefined));
  name = input<string>(uuid.v4());

  // ==========================================
  // 3. INJECT (Thay tháº¿ Constructor DI)
  // ==========================================
  #ref = inject(ChangeDetectorRef);
  #formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.#formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

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
  type = input<'text' | 'number' | 'password' | 'email'>('text');

  hideInlineError = input(false, { transform: booleanAttribute });
  blurOnEnter = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  readonly = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  viewed = input(false, { transform: booleanAttribute });

  minlength = input<number | undefined, unknown>(undefined, { transform: v => (v == null ? undefined : Number(v)) });
  maxlength = input<number | undefined, unknown>(undefined, { transform: v => (v == null ? undefined : Number(v)) });

  pattern = input<SdPatternType | string | undefined | null>();
  patternErrorMessage = input<string | undefined | null>();

  resolvedPattern = computed(() => {
    const val = this.pattern();
    const patternObj = SdPatternCommons.find(e => e.type === val);
    return patternObj ? patternObj.regex : (val ?? undefined);
  });

  resolvedPatternErrorMsg = computed(() => {
    const val = this.pattern();
    const patternObj = SdPatternCommons.find(e => e.type === val);
    return this.patternErrorMessage() ?? (patternObj ? patternObj.errorMessage : undefined);
  });

  /**
   * Tá»•ng há»£p error message Ä‘áº§u tiÃªn Ä‘á»ƒ hiá»ƒn thá»‹ trong tooltip khi hideInlineError = true.
   * DÃ¹ng getter (khÃ´ng pháº£i computed) vÃ¬ formControl.errors khÃ´ng pháº£i Angular signal.
   * cdRef.markForCheck() Ä‘Æ°á»£c gá»i qua sdChanges subscription nÃªn getter sáº½ Ä‘Æ°á»£c re-evaluate Ä‘Ãºng cycle.
   */
  get errorTooltipMessage(): string | undefined {
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return 'Vui lÃ²ng nháº­p thÃ´ng tin';
    if (errors['maxlength']) return `Sá»‘ kÃ½ tá»± tá»‘i Ä‘a: ${this.maxlength()}`;
    if (errors['pattern']) return this.resolvedPatternErrorMsg() || 'Äá»‹nh dáº¡ng khÃ´ng há»£p lá»‡';
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  }

  validator = input<SdCustomValidator | undefined>();
  inlineError = input<string | undefined>();
  hyperlink = input<string | null | undefined>();
  tooltip = input<string | undefined>();

  valueModel = model<any>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS (Thay tháº¿ @Output)
  // ==========================================
  sdChange = output<any>();
  sdFocus = output<void>(); // Äá»•i sang void vÃ¬ khÃ´ng truyá»n data
  sdBlur = output<any>();
  keyupEnter = output<any>();

  // ðŸš¨ GIá»® Láº I EVENT_EMITTER DUY NHáº¤T VÃŒ Cáº¦N CHECK OBSERVERED
  @Output() sdFocusForceBlur = new EventEmitter<void>();

  formControl = new SdFormControl();
  #subscription = new Subscription();
  isFocused = false;

  constructor() {
    effect(() => {
      const val = this.valueModel();
      untracked(() => {
        if (this.formControl.value !== val) {
          this.formControl.setValue(val, { emitEvent: false });
        }
      });
    });

    effect(() => {
      if (this.disabled()) {
        this.formControl.disable({ emitEvent: false });
      } else {
        this.formControl.enable({ emitEvent: false });
      }
    });

    effect(() => {
      const req = this.required();
      const min = this.minlength();
      const max = this.maxlength();
      const pat = this.resolvedPattern();
      const inl = this.inlineError();
      const val = this.validator();

      untracked(() => {
        this.#updateValidator(req, min, max, pat, inl, val);
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

    const formGroup = this.form();
    formGroup?.addControl(this.name(), this.formControl);

    this.#ref.detectChanges();
  }

  ngOnDestroy() {
    const formGroup = this.form();
    formGroup?.removeControl(this.name());
    this.#subscription.unsubscribe();
  }

  reValidate = () => {
    this.formControl.updateValueAndValidity();
  };

  #updateValidator = (
    req: boolean,
    min: number | undefined,
    max: number | undefined,
    pat: string | undefined,
    inl: string | undefined,
    val: SdCustomValidator | undefined
  ) => {
    const validators: ValidatorFn[] = [];
    const asyncValidators: AsyncValidatorFn[] = [];

    if (req) validators.push(Validators.required);
    if (min && min > 0) validators.push(Validators.minLength(min));
    if (max && max > 0) validators.push(Validators.maxLength(max));
    if (pat) validators.push(Validators.pattern(pat));
    if (inl) validators.push(this.customInlineErrorValidator());
    if (val) asyncValidators.push(HandleSdCustomValidator(val));

    this.formControl.setValidators(validators.length ? validators : null);
    this.formControl.setAsyncValidators(asyncValidators.length ? asyncValidators : null);
    this.formControl.updateValueAndValidity({ emitEvent: false });
  };

  customInlineErrorValidator(): ValidatorFn {
    return (): Record<string, any> | null => ({ inlineError: true });
  }

  #onChange = () => {
    const value = this.formControl.value ?? '';
    this.valueModel.set(value);
    this.sdChange.emit(value);
  };

  onKeyupEnter = () => {
    const val: string = (this.formControl.value ?? '').toString();
    if (val.length > val.trim().length) {
      this.formControl.setValue(val.trim());
    }
    this.keyupEnter.emit(this.formControl.value);
    if (this.blurOnEnter()) {
      this.blur();
    }
  };

  onFocus = () => {
    this.isFocused = true;
    this.sdFocus.emit(); // Gá»i .emit() y há»‡t nhÆ° cÅ©

    if (this.sdFocusForceBlur.observed) {
      this.blur();
      this.sdFocusForceBlur.emit();
    }
  };

  onBlur = () => {
    this.isFocused = false;
    const val: string = (this.formControl.value ?? '').toString();
    if (val.length > val.trim().length) {
      this.formControl.setValue(val.trim());
    }
    this.sdBlur.emit(this.formControl.value);
  };

  onClick = () => {
    // ðŸš¨ Gá»ŒI SIGNAL: Pháº£i thÃªm () vÃ o sdViewDef
    if (this.sdViewDef()?.templateRef) {
      if (!this.formControl.disabled && !this.isFocused) {
        this.focus();
      }
    }
  };

  blur = () => {
    this.isFocused = false;
    // ðŸš¨ Gá»ŒI SIGNAL: Pháº£i thÃªm () vÃ o control
    this.control()?.nativeElement?.blur();
  };

  focus = () => {
    this.isFocused = true;
    setTimeout(() => {
      // ðŸš¨ Gá»ŒI SIGNAL: Pháº£i thÃªm () vÃ o control
      this.control()?.nativeElement?.focus();
    }, 100);
  };
}

export function backendErrorValidator(backendErrorMessage: string): ValidatorFn {
  return (control: AbstractControl): Record<string, any> | null => {
    const value = control.value as string;
    if (value === backendErrorMessage) {
      return { backendError: true };
    }
    return null;
  };
}

