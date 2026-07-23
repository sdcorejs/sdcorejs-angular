import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  input,
  model,
  computed,
  OnDestroy,
  OnInit,
  output,
  TemplateRef,
  viewChild,
  contentChild,
} from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  SD_FORM_CONFIGURATION,
  SdFormControl,
  SdInlineErrorValidator,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
} from '@sdcorejs/angular/forms/models';
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { sdFormControlState } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { Size } from '@sdcorejs/utils/models';
import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import { BrowserUtilities, Utilities } from '@sdcorejs/utils/fns';
import { parse as parseDate } from 'date-fns';
import { enUS as dfEnUS } from 'date-fns/locale';
import { Subscription } from 'rxjs';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

type SdDateModelValue = string | number | Date | undefined | null;

function normalizeDateModel(value: SdDateModelValue): string | null {
  if (!DateUtilities.isDate(value)) return null;
  return DateUtilities.toFormat(value, 'yyyy/MM/dd') || null;
}

function dateModelToControl(value: SdDateModelValue): Date | null {
  const normalized = normalizeDateModel(value);
  return normalized ? parseDate(normalized, 'yyyy/MM/dd', new Date()) : null;
}

function dateControlToModel(value: Date | null): SdDateModelValue {
  return value ? normalizeDateModel(value) : null;
}

function dateControlsEqual(left: Date | null, right: Date | null): boolean {
  return left === right || normalizeDateModel(left) === normalizeDateModel(right);
}

@Component({
  selector: 'sd-date',
  templateUrl: './date.component.html',
  styleUrl: './date.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.sd-bare]': 'isInline()', '[class.sd-viewed]': 'isViewed() || isInline()', '[class.sd-has-label]': '!!label()' },
  providers: [
    // DateFnsAdapter inject MAT_DATE_LOCALE; nếu undefined sẽ throw khi format/parse.
    // Provide locale en-US tại scope component để hành vi giống Moment cũ (English default).
    { provide: MAT_DATE_LOCALE, useValue: dfEnUS },
    provideDateFnsAdapter({
      parse: { dateInput: 'dd/MM/yyyy' },
      display: {
        dateInput: 'dd/MM/yyyy',
        monthYearLabel: 'MMM yyyy',
        dateA11yLabel: 'PP',
        monthYearA11yLabel: 'MMMM yyyy',
      },
    }),
  ],
  standalone: true,
  imports: [
    SdIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatDatepickerModule,
    SdLabel,
    SdView,
  ],
})
export class SdDate implements OnDestroy, OnInit {
  id = `I${Utilities.generateUuid()}`;

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  datePicker = viewChild<MatDatepicker<Date>>(MatDatepicker);

  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  sdViewDef = contentChild(SdViewDefDirective);
  sdLabelDef = contentChild(SdLabelDefDirective);

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
  autoId = computed(() => (this.autoIdInput() ? `forms-date-${this.autoIdInput()}` : undefined));

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
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` view + click-to-edit (calendar). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  /** Whether to show the value-gated clear button in edit and inline modes. */
  clearable = input(false, { transform: booleanAttribute });

  // Tri-state `viewed` — shared primitive. In `'inline'` the calendar editor is always mounted
  // (chrome hidden via CSS); the sd-view text face opens the calendar on click.
  readonly #viewedState = sdViewedInline(this.viewed, () => this.open(), this.disabled);
  /** `true` when `viewed === 'inline'`. */
  readonly isInline = this.#viewedState.isInline;
  /** `true` when `viewed === true` (static view, no editor). */
  readonly isViewed = this.#viewedState.isViewed;
  /** Open the calendar from the inline text face. No-op unless `viewed='inline'`. */
  enterInlineEdit = (): void => this.#viewedState.enterInlineEdit();
  /** View display template: `sdViewDef` overrides the projected `#sdValue` (unified). */
  readonly viewTemplate = computed<TemplateRef<any> | undefined>(() => this.sdViewDef()?.templateRef ?? this.sdValueTemplate());

  inlineError = input<string | undefined>();

  /**
   * Tổng hợp error message để hiển thị trong tooltip khi hideInlineError = true.
   */
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.date.required');
    if (errors['matDatepickerMin']) {
      const d = this.resolvedMin();
      return this.#i18n.t('core.form.date.min-date', { date: d ? new Date(d).toLocaleDateString('vi-VN') : '' });
    }
    if (errors['matDatepickerMax']) {
      const d = this.resolvedMax();
      return this.#i18n.t('core.form.date.max-date', { date: d ? new Date(d).toLocaleDateString('vi-VN') : '' });
    }
    if (errors['matDatetimePickerParse'])
      return this.#i18n.t('core.form.date.parse-error', { text: errors['matDatetimePickerParse']?.text ?? '' });
    if (errors['date']) return errors['date'] as string;
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });

  hyperlink = input<string | null | undefined>();

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  // Xử lý thông minh Gom min/minDate và max/maxDate
  minInput = input<any>(undefined, { alias: 'min' });
  minDateInput = input<any>(undefined, { alias: 'minDate' });
  resolvedMin = computed(() => this.#parseDateBoundary(this.minInput() ?? this.minDateInput()));

  maxInput = input<any>(undefined, { alias: 'max' });
  maxDateInput = input<any>(undefined, { alias: 'maxDate' });
  resolvedMax = computed(() => this.#parseDateBoundary(this.maxInput() ?? this.maxDateInput()));

  valueModel = model<SdDateModelValue>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS
  // ==========================================
  sdChange = output<any>();
  sdFocus = output<void>();

  // ==========================================
  // 5. INTERNAL STATE & STREAMS
  // ==========================================
  isMobileOrTablet = BrowserUtilities.isMobile();
  formControl = new SdFormControl();
  readonly #formConnector = ɵsdFormControlConnector<SdDateModelValue, Date | null>({
    form: this.form,
    name: this.name,
    control: computed<AbstractControl<Date | null>>(() => this.formControl),
    model: this.valueModel,
    writeModel: value => {
      this.valueModel.set(value);
      this.sdChange.emit(value);
    },
    modelToControl: dateModelToControl,
    controlToModel: dateControlToModel,
    modelEquals: (left, right) => normalizeDateModel(left) === normalizeDateModel(right),
    controlEquals: dateControlsEqual,
    validators: computed(() => (this.inlineError() ? SdInlineErrorValidator : null)),
    required: this.required,
    disabled: this.disabled,
    viewed: this.viewed,
    validationError: computed(() => this.errorMessage()),
  });
  isFocused = false;
  isValid?: boolean;

  #subscription = new Subscription();

  ngOnInit() {
    this.#subscription.add(
      this.formControl.sdChanges.subscribe(() => {
        this.ref.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  // Hàm private tái sử dụng cho parse Min/Max Date
  #parseDateBoundary(val: any): Date | null {
    if (val === 'TODAY') return new Date();
    if (val && DateUtilities.isDate(val)) return new Date(val);
    return null;
  }

  onFocus = () => {
    this.isFocused = true;
    this.sdFocus.emit();
  };

  onBlur = () => {
    this.isFocused = false;
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
      this.inputRef()?.nativeElement?.focus();
      this.datePicker()?.open();
    }, 100);
  };

  /** Open the datepicker calendar programmatically (anchors to the field input). */
  open = () => {
    if (this.formControl.disabled) return;
    this.datePicker()?.open();
  };

  focusInputElement() {
    this.inputRef()?.nativeElement?.focus();
  }

  onKeyDown = (event: KeyboardEvent) => {
    const key = event.keyCode || event.charCode;
    const isShift = key === 16;

    if (event.ctrlKey && (key === 67 || key === 86)) return true;

    if (
      ((key >= 48 && key <= 57) ||
        key === 8 ||
        key <= 37 ||
        key <= 39 ||
        (key >= 96 && key <= 105) ||
        key === 191 ||
        key === 186 ||
        key === 59) &&
      !isShift
    ) {
      return true;
    }
    return false;
  };

  onKeyup = (event: any) => {
    const currentVal: string = event.target.value;
    const formControl: AbstractControl = this.formControl;
    const regex = /^([1-9]|([012][0-9])|(3[01]))\/([0]{0,1}[1-9]|1[012])\/\d\d\d\d$/g;

    if (currentVal && !regex.test(currentVal)) {
      setTimeout(() => {
        this.isValid = true;
        formControl.markAsDirty();
        formControl.markAsTouched();
        formControl.setErrors({ ...formControl.errors, date: this.#i18n.t('core.form.date.invalid-format') });
      }, 0);
    } else {
      setTimeout(() => {
        this.isValid = false;
        formControl.setErrors({ ...formControl.errors, date: null });
        this.formControl.updateValueAndValidity();
      }, 0);
    }
  };

  onChange = (event: MatDatepickerInputEvent<Date>) => {
    this.inputRef()?.nativeElement?.focus();
    const value = this.isValid ? null : event.value;
    this.isValid = false;

    if (!dateControlsEqual(this.formControl.value as Date | null, value)) {
      this.formControl.setValue(value);
    }
  };

  clear = ($event: any) => {
    $event?.stopPropagation();
    if (this.formControl.value) {
      this.formControl.setValue(null);
    }
  };
}
