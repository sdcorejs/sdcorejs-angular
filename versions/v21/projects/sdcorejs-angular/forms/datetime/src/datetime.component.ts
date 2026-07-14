import { Platform } from '@angular/cdk/platform';
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
  effect,
  untracked,
  OnDestroy,
  OnInit,
  output,
  TemplateRef,
  viewChild,
  contentChild,
} from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  SD_FORM_CONFIGURATION,
  SdFormControl,
  SdInlineErrorValidator,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
} from '@sdcorejs/angular/forms/models';
import { sdSerializeDataValue, sdIsEmpty } from '@sdcorejs/angular/utilities/data-state';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import { Size } from '@sdcorejs/utils/models';
import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import { BrowserUtilities, Utilities } from '@sdcorejs/utils/fns';
import { isValid as isValidDate, parse as parseDate } from 'date-fns';
import { Subscription } from 'rxjs';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import {
  SD_DATE_FORMATS,
  SD_NATIVE_DATE_FORMATS,
  SdDateAdapter,
  SdDatetimePicker as SdMaterialDatetimePicker,
  SdDatetimePickerActions,
  SdDatetimePickerApply,
  SdDatetimePickerCancel,
  SdDatetimePickerNow,
  SdNativeDateAdapter,
} from '@sdcorejs/angular-material-datetime';

/**
 * Thử parse `value` theo lần lượt nhiều format; trả về Date đầu tiên hợp lệ.
 * date-fns không hỗ trợ multi-format parse như moment(value, [fmt1, fmt2], true).
 */
function parseFirstValid(value: string, formats: string[]): Date | null {
  for (const fmt of formats) {
    const d = parseDate(value, fmt, new Date());
    if (isValidDate(d)) return d;
  }
  return null;
}

@Component({
  selector: 'sd-datetime',
  templateUrl: './datetime.component.html',
  styleUrl: './datetime.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.sd-bare]': 'isInline()', '[class.sd-viewed]': 'isViewed() || isInline()', '[class.sd-has-label]': '!!label()' },
  providers: [
    Platform,
    SdNativeDateAdapter,
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: DateAdapter, useExisting: SdNativeDateAdapter },
    { provide: SdDateAdapter, useExisting: SdNativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: SD_NATIVE_DATE_FORMATS },
    { provide: SD_DATE_FORMATS, useValue: SD_NATIVE_DATE_FORMATS },
  ],
  standalone: true,
  imports: [
    SdIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    SdLabel,
    SdView,
    TranslatePipe,
    SdMaterialDatetimePicker,
    SdDatetimePickerActions,
    SdDatetimePickerApply,
    SdDatetimePickerCancel,
    SdDatetimePickerNow,
  ],
})
export class SdDatetime implements OnDestroy, OnInit {
  id = `I${Utilities.generateUuid()}`;

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  private readonly dateTimePicker = viewChild<SdMaterialDatetimePicker<Date>>(SdMaterialDatetimePicker);

  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  sdViewDef = contentChild(SdViewDefDirective);

  // ==========================================
  // 2. INJECTS
  // ==========================================
  private ref = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef);
  private formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #i18n = inject(I18nService);

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-datetime-${this.autoIdInput()}` : undefined));

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
  /** Display mode: `false` edit · `true` static view · `'inline'` view + click-to-edit (datetime overlay). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  /** Hiển thị thêm cột giây trong picker. Mặc định: chỉ HH:MM. */
  showSeconds = input(false, { transform: booleanAttribute });

  /** In `viewed='inline'`, show a hover clear-× on the text face. Set `false` when the host owns removal (chips). */
  clearable = input(true, { transform: booleanAttribute });

  // Tri-state `viewed` — shared primitive. In `'inline'` the datetime editor is always mounted
  // (chrome hidden via CSS); the sd-view text face opens the overlay on click.
  readonly #viewedState = sdViewedInline(this.viewed, () => this.open(), this.disabled);
  /** `true` when `viewed === 'inline'`. */
  readonly isInline = this.#viewedState.isInline;
  /** `true` when `viewed === true` (static view, no editor). */
  readonly isViewed = this.#viewedState.isViewed;
  /** Open the datetime overlay from the inline text face. No-op unless `viewed='inline'`. */
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

    if (errors['required']) return this.#i18n.t('core.form.datetime.required');
    if (errors['matDatepickerMin']) {
      const d = this.resolvedMin();
      return this.#i18n.t('core.form.datetime.min-date', { date: d ? new Date(d).toLocaleDateString('vi-VN') : '' });
    }
    if (errors['matDatepickerMax']) {
      const d = this.resolvedMax();
      return this.#i18n.t('core.form.datetime.max-date', { date: d ? new Date(d).toLocaleDateString('vi-VN') : '' });
    }
    if (errors['date']) return errors['date'] as string;
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  });

  hyperlink = input<string | null | undefined>();

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  // Min/max — chấp nhận 'TODAY', Date, hoặc string ISO
  minInput = input<any>(undefined, { alias: 'min' });
  minDateInput = input<any>(undefined, { alias: 'minDate' });
  resolvedMin = computed(() => this.#parseDateBoundary(this.minInput() ?? this.minDateInput()));

  maxInput = input<any>(undefined, { alias: 'max' });
  maxDateInput = input<any>(undefined, { alias: 'maxDate' });
  resolvedMax = computed(() => this.#parseDateBoundary(this.maxInput() ?? this.maxDateInput()));

  valueModel = model<string | number | Date | undefined | null>(undefined, { alias: 'model' });

  // viewed-mode: formControl.value là chuỗi display (dd/MM/yyyy HH:mm) nên DatePipe không parse được.
  // Lấy thẳng từ valueModel (nguồn dữ liệu thật) rồi convert sang Date cho DatePipe.
  viewedDate = computed<Date | null>(() => {
    const v = this.valueModel();
    if (v == null || !DateUtilities.isDate(v)) return null;
    const iso = DateUtilities.toFormat(v as any, 'yyyy/MM/dd HH:mm:ss');
    if (!iso) return null;
    const d = parseDate(iso, 'yyyy/MM/dd HH:mm:ss', new Date());
    return isValidDate(d) ? d : null;
  });

  // ==========================================
  // 4. SIGNAL OUTPUTS
  // ==========================================
  sdChange = output<any>();
  sdFocus = output<void>();

  // ==========================================
  // 5. INTERNAL STATE
  // ==========================================
  isMobileOrTablet = BrowserUtilities.isMobile();
  formControl = new SdFormControl();
  isFocused = false;
  isValid?: boolean;

  /** State popup — true khi picker package đang mở. */
  pickerOpened = computed(() => this.dateTimePicker()?.opened() ?? false);

  #date: string | undefined | null;
  #subscription = new Subscription();

  constructor() {
    // EFFECT 1: Sync model thay đổi từ bên ngoài → cập nhật hiển thị
    effect(() => {
      let val = this.valueModel();
      untracked(() => {
        if (!DateUtilities.isDate(val)) {
          val = null;
        }
        val = DateUtilities.toFormat(val, 'yyyy/MM/dd HH:mm');
        if (this.#date !== val) {
          this.#date = val;
          // Cập nhật formControl với chuỗi hiển thị dd/MM/yyyy HH:mm
          const fmt = this.showSeconds() ? 'dd/MM/yyyy HH:mm:ss' : 'dd/MM/yyyy HH:mm';
          const displayStr = DateUtilities.isDate(this.#date) ? DateUtilities.toFormat(this.#date, fmt) : null;
          this.formControl.setValue(displayStr, { emitEvent: false });
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
      const inl = this.inlineError();

      untracked(() => {
        const validators: ValidatorFn[] = [];
        if (req) validators.push(Validators.required);
        if (inl) validators.push(SdInlineErrorValidator);

        this.formControl.setValidators(validators.length ? validators : null);
        this.formControl.updateValueAndValidity({ emitEvent: false });
      });
    });
  }

  ngOnInit() {
    this.#subscription.add(
      this.formControl.sdChanges.subscribe(() => {
        this.ref.markForCheck();
      })
    );
    const formGroup = this.form();
    formGroup?.addControl(this.name(), this.formControl);
  }

  ngOnDestroy() {
    const formGroup = this.form();
    formGroup?.removeControl(this.name());
    this.#subscription.unsubscribe();
  }

  // ==========================================
  // 6. POPUP MANAGEMENT — package-backed Material datetime picker
  // ==========================================

  /** Mở popup chọn datetime, neo vào input. */
  open() {
    if (this.formControl.disabled || this.pickerOpened()) return;
    const picker = this.dateTimePicker();
    if (!picker) return;
    picker.setAnchor(this.inputRef()?.nativeElement ?? (this.elementRef.nativeElement as HTMLElement));
    // why: open() rebuilds the draft from committed state, so seed that state before opening.
    picker.setValue(this.#currentValueAsDate() ?? new Date());
    picker.open();
    this.ref.markForCheck();
  }

  /** Đóng popup (public — gọi từ template nếu cần). */
  close() {
    this.dateTimePicker()?.close();
  }

  onPickerConfirm(value: Date) {
    const fmt = this.showSeconds() ? 'yyyy/MM/dd HH:mm:ss' : 'yyyy/MM/dd HH:mm:00';
    // value là native Date từ package, không cần .toDate() như Moment.
    const stored = DateUtilities.toFormat(value, fmt);
    if (this.#date !== stored) {
      this.valueModel.set(stored);
      this.sdChange.emit(stored);
    }
  }

  /** Lấy giá trị hiện tại dưới dạng native Date để truyền vào popup. */
  #currentValueAsDate(): Date | null {
    const v = this.valueModel();
    if (!v || !DateUtilities.isDate(v)) return null;
    const fmtted = DateUtilities.toFormat(v as any, 'yyyy/MM/dd HH:mm:ss');
    if (!fmtted) return null;
    const parsed = parseDate(fmtted, 'yyyy/MM/dd HH:mm:ss', new Date());
    return isValidDate(parsed) ? parsed : null;
  }

  // ==========================================
  // 7. PARSE/VALIDATE HELPERS
  // ==========================================
  #parseDateBoundary(val: any): Date | null {
    if (val === 'TODAY') return new Date();
    if (val && DateUtilities.isDate(val)) return new Date(val);
    return null;
  }

  // ==========================================
  // 8. INPUT EVENT HANDLERS
  // ==========================================
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
      this.open();
    }, 100);
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

  /**
   * Khi user gõ trực tiếp vào input và rời focus → validate format dd/MM/yyyy HH:mm
   * Hỗ trợ cả format có giây.
   */
  onConfirmInput = (event: any) => {
    const currentVal: string = event.target.value;
    const formControl: AbstractControl = this.formControl;
    const regexToMinutes = /^([1-9]|([012][0-9])|(3[01]))\/([0]{0,1}[1-9]|1[012])\/\d\d\d\d [012]{0,1}[0-9]:[0-6][0-9]$/g;
    const regexToSecond = /^([1-9]|([012][0-9])|(3[01]))\/([0]{0,1}[1-9]|1[012])\/\d\d\d\d [012]{0,1}[0-9]:[0-6][0-9]:[0-6][0-9]$/g;

    if (currentVal && !(regexToMinutes.test(currentVal) || regexToSecond.test(currentVal))) {
      setTimeout(() => {
        formControl.markAsDirty();
        formControl.markAsTouched();
        formControl.setErrors({ ...formControl.errors, date: this.#i18n.t('core.form.datetime.invalid-format') });
      }, 0);
      return;
    }

    setTimeout(() => {
      formControl.setErrors({ ...formControl.errors, date: null });
      this.formControl.updateValueAndValidity();
    }, 0);

    // Đồng bộ ngược về model nếu hợp lệ.
    // date-fns không có multi-format strict parse như moment, dùng helper parseFirstValid.
    if (currentVal) {
      const parsed = parseFirstValid(currentVal, ['dd/MM/yyyy HH:mm:ss', 'dd/MM/yyyy HH:mm']);
      if (parsed) {
        const fmt = this.showSeconds() ? 'yyyy/MM/dd HH:mm:ss' : 'yyyy/MM/dd HH:mm:00';
        const stored = DateUtilities.toFormat(parsed, fmt);
        if (this.#date !== stored) {
          this.valueModel.set(stored);
          this.sdChange.emit(stored);
        }
      }
    } else if (this.valueModel()) {
      this.valueModel.set(null);
      this.sdChange.emit(null);
    }
  };

  clear = ($event: any) => {
    $event?.stopPropagation();
    if (this.formControl.value) {
      this.formControl.setValue(null);
      this.valueModel.set(null);
      this.sdChange.emit(null);
    }
  };
}
