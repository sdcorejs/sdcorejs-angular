import { CommonModule } from '@angular/common';
import { Platform } from '@angular/cdk/platform';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  SD_FORM_CONFIGURATION,
  SdFormControl,
  SdInlineErrorValidator,
  SdViewed,
  SdViewedInput,
  sdFormControlState,
  sdViewedTransform,
  ɵSdFormControlParent,
  ɵsdCoerceFormGroup,
  ɵsdFormControlConnector,
} from '@sdcorejs/angular/forms/models';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import {
  SD_DATE_FORMATS,
  SD_NATIVE_DATE_FORMATS,
  SdDateAdapter,
  SdNativeDateAdapter,
  SdTimeSpinner,
} from '@sdcorejs/angular-material-datetime';
import { Utilities } from '@sdcorejs/utils/fns';
import { Size } from '@sdcorejs/utils/models';

import { SdDateTimePickerAdapter } from './time-picker.adapter';
import { sdNormalizeTime, sdTimeToMinutes, sdValidateTime } from './time-value';

export type SdTimeModelValue = string | null | undefined;

/**
 * Edits a timezone-free time of day and emits valid values as canonical `HH:mm` strings.
 * Invalid typed text remains in the control without replacing the last valid model.
 */
@Component({
  selector: 'sd-time',
  templateUrl: './time.component.html',
  styleUrl: './time.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    Platform,
    SdNativeDateAdapter,
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: DateAdapter, useExisting: SdNativeDateAdapter },
    { provide: SdDateAdapter, useExisting: SdNativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: SD_NATIVE_DATE_FORMATS },
    { provide: SD_DATE_FORMATS, useValue: SD_NATIVE_DATE_FORMATS },
  ],
  host: {
    '[class.sd-has-label]': '!!label()',
    '[class.sd-viewed]': 'connectorState().isViewed || connectorState().isInline',
    '[class.sd-bare]': 'connectorState().isInline',
  },
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatTooltipModule,
    SdIcon,
    SdLabel,
    SdTimeSpinner,
    SdView,
    TranslatePipe,
  ],
})
export class SdTime {
  readonly id = `I${Utilities.generateUuid()}`;
  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  readonly menuTrigger = viewChild(MatMenuTrigger);
  readonly sdLabelTemplate = contentChild<TemplateRef<unknown>>('sdLabel');
  readonly sdValueTemplate = contentChild<TemplateRef<unknown>>('sdValue');
  readonly sdViewDef = contentChild(SdViewDefDirective);

  readonly #formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #i18n = inject(I18nService);
  readonly #pickerAdapter = new SdDateTimePickerAdapter();

  readonly autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `forms-time-${this.autoIdInput()}` : undefined));
  readonly name = input<string>(Utilities.generateUuid());
  readonly form = input<FormGroup | undefined, ɵSdFormControlParent>(undefined, { transform: ɵsdCoerceFormGroup });
  readonly label = input<string | undefined>();
  readonly ariaLabel = input<string | undefined>();
  readonly helperText = input<string | undefined>();
  readonly placeholder = input<string | undefined>();
  readonly size = input<Size>('md');
  readonly appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  readonly appearance = computed(() => this.appearanceInput() ?? this.#formConfig?.appearance ?? 'outline');
  readonly floatLabel = input<FloatLabelType>('auto');
  readonly min = input<string | null | undefined>();
  readonly max = input<string | null | undefined>();
  readonly stepInput = input<number | undefined, number | string | null | undefined>(1, {
    alias: 'step',
    transform: value => (value == null ? 1 : Number(value)),
  });
  readonly step = computed(() => {
    const value = this.stepInput();
    return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.max(1, Math.trunc(value)) : 1;
  });
  readonly required = input(false, { transform: booleanAttribute });
  readonly clearable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  readonly inlineError = input<string | undefined>();
  readonly hyperlink = input<string | null | undefined>();
  readonly valueModel = model<SdTimeModelValue>(undefined, { alias: 'model' });

  readonly sdChange = output<SdTimeModelValue>();
  readonly sdFocus = output<void>();
  readonly sdBlur = output<SdTimeModelValue>();

  readonly formControl = new SdFormControl();
  readonly #state = sdFormControlState(computed<AbstractControl<string | null>>(() => this.formControl));
  readonly #validators = computed<readonly ValidatorFn[]>(() => {
    const constraints = { min: this.min(), max: this.max(), step: this.step() };
    const timeValidator: ValidatorFn = control => {
      const error = sdValidateTime(control.value, constraints);
      return error ? ({ [error]: true } satisfies ValidationErrors) : null;
    };
    return this.inlineError() ? [timeValidator, SdInlineErrorValidator] : [timeValidator];
  });
  readonly #connector = ɵsdFormControlConnector<SdTimeModelValue, string | null>({
    form: this.form,
    name: this.name,
    control: computed<AbstractControl<string | null>>(() => this.formControl),
    model: this.valueModel,
    writeModel: value => {
      this.valueModel.set(value);
      this.sdChange.emit(value);
    },
    modelToControl: value => {
      if (value == null) return null;
      return sdNormalizeTime(value) ?? value;
    },
    controlToModel: value => {
      if (value == null || value.trim() === '') return null;
      return sdNormalizeTime(value) ?? this.valueModel();
    },
    validators: this.#validators,
    required: this.required,
    disabled: this.disabled,
    readonly: this.readonly,
    viewed: this.viewed,
    validationError: computed(() => this.errorMessage()),
  });

  readonly connectorState = this.#connector.state;
  readonly isViewed = computed(() => this.connectorState().isViewed);
  readonly isInline = computed(() => this.connectorState().isInline);
  readonly isReadonly = computed(() => this.connectorState().readonly);
  readonly viewTemplate = computed<TemplateRef<unknown> | undefined>(() => this.sdViewDef()?.templateRef ?? this.sdValueTemplate());
  readonly displayValue = computed(() => {
    const value = this.valueModel();
    return value == null ? null : (sdNormalizeTime(value) ?? value);
  });
  readonly showClear = computed(
    () => this.clearable() && !this.required() && !this.disabled() && !this.isReadonly() && !sdIsEmpty(this.formControl.value)
  );

  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataInvalid = computed(() => (this.#state().invalid ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataErrorMessage = computed(() => this.errorMessage() ?? null);

  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const errors = this.formControl.errors;
    if (!errors) return undefined;
    if (errors['required']) return this.#i18n.t('core.form.time.required');
    if (errors['time']) return this.#i18n.t('core.form.time.invalid');
    if (errors['min']) return this.#i18n.t('core.form.time.min', { min: this.min() ?? '' });
    if (errors['max']) return this.#i18n.t('core.form.time.max', { max: this.max() ?? '' });
    if (errors['step']) return this.#i18n.t('core.form.time.step', { step: this.step() });
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });

  protected readonly pickerDraft = signal(this.#pickerAdapter.toPickerValue(null));

  preparePicker(): void {
    this.pickerDraft.set(this.#pickerAdapter.toPickerValue(sdNormalizeTime(this.formControl.value) ?? this.valueModel()));
  }

  onPickerValue(value: Date): void {
    this.pickerDraft.set(value);
  }

  applyPicker(): void {
    const value = this.#pickerAdapter.fromPickerValue(this.pickerDraft());
    if (value) {
      this.formControl.setValue(value);
      this.formControl.markAsDirty();
      this.formControl.markAsTouched();
    }
    this.menuTrigger()?.closeMenu();
  }

  cancelPicker(): void {
    this.menuTrigger()?.closeMenu();
  }

  open(): void {
    if (this.formControl.disabled || this.isReadonly()) return;
    this.preparePicker();
    this.menuTrigger()?.openMenu();
  }

  focus(): void {
    this.inputRef()?.nativeElement.focus();
  }

  clear(event?: Event): void {
    event?.stopPropagation();
    if (sdIsEmpty(this.formControl.value) && this.valueModel() == null) return;
    this.formControl.setValue(null);
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  onFocus(): void {
    this.sdFocus.emit();
  }

  onBlur(): void {
    this.#connector.markAsTouched();
    this.sdBlur.emit(this.valueModel());
  }

  stepBy(direction: 1 | -1, event: KeyboardEvent): void {
    if (this.formControl.disabled || this.isReadonly()) return;
    event.preventDefault();
    const base = sdTimeToMinutes(this.formControl.value) ?? sdTimeToMinutes(this.min()) ?? 0;
    const min = sdTimeToMinutes(this.min()) ?? 0;
    const max = sdTimeToMinutes(this.max()) ?? 23 * 60 + 59;
    const next = Math.min(max, Math.max(min, base + direction * this.step()));
    const value = `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}`;
    this.formControl.setValue(value);
    this.formControl.markAsDirty();
  }
}
