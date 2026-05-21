/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
import { Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
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
  signal,
  Injector,
} from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SD_FORM_CONFIGURATION, SdFormControl } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdSize } from '@sdcorejs/angular/utilities';
import { DateUtilities, SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { isValid as isValidDate, parse as parseDate } from 'date-fns';
import { enUS as dfEnUS } from 'date-fns/locale';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';
import { SdDatetimePicker } from './popup/sd-datetime-picker.component';

/**
 * Format parse/display dÃ¹ng cho MatDateAdapter (date-fns).
 * Note: format input lÃ  `dd/MM/yyyy HH:mm` (khÃ´ng cÃ³ giÃ¢y máº·c Ä‘á»‹nh) â€”
 *       giÃ¢y chá»‰ Ä‘Æ°á»£c render khi `showSeconds` = true.
 * Token date-fns dÃ¹ng chá»¯ thÆ°á»ng: `yyyy` (nÄƒm), `dd` (ngÃ y), `HH` (giá» 24h).
 */
const SD_DATETIME_FORMATS = {
  parse: { dateInput: 'dd/MM/yyyy HH:mm' },
  display: {
    dateInput: 'dd/MM/yyyy HH:mm',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'PP',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

/**
 * Thá»­ parse `value` theo láº§n lÆ°á»£t nhiá»u format; tráº£ vá» Date Ä‘áº§u tiÃªn há»£p lá»‡.
 * date-fns khÃ´ng há»— trá»£ multi-format parse nhÆ° moment(value, [fmt1, fmt2], true).
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
  styleUrls: ['./datetime.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // DateFnsAdapter inject MAT_DATE_LOCALE; cáº¥p default en-US Ä‘á»ƒ parse/format hoáº¡t Ä‘á»™ng.
    { provide: MAT_DATE_LOCALE, useValue: dfEnUS },
    provideDateFnsAdapter(SD_DATETIME_FORMATS),
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    SdLabel,
    SdView,
  ],
})
export class SdDatetime implements OnDestroy, OnInit {
  id = `I${uuid.v4()}`;

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  sdViewDef = contentChild(SdViewDefDirective);

  // ==========================================
  // 2. INJECTS
  // ==========================================
  private ref = inject(ChangeDetectorRef);
  private overlay = inject(Overlay);
  private elementRef = inject(ElementRef);
  private injector = inject(Injector);
  private formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #i18n = inject(I18nService);

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => this.autoIdInput() ? `forms-datetime-${this.autoIdInput()}` : undefined);
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
  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });
  viewed = input(false, { transform: booleanAttribute });
  /** Hiá»ƒn thá»‹ thÃªm cá»™t giÃ¢y trong picker. Máº·c Ä‘á»‹nh: chá»‰ HH:MM. */
  showSeconds = input(false, { transform: booleanAttribute });

  inlineError = input<string | undefined>();

  /**
   * Tá»•ng há»£p error message Ä‘á»ƒ hiá»ƒn thá»‹ trong tooltip khi hideInlineError = true.
   */
  get errorTooltipMessage(): string | undefined {
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.datetime.required');
    if (errors['matDatepickerMin']) { const d = this.resolvedMin(); return this.#i18n.t('core.form.datetime.min-date', { date: d ? new Date(d).toLocaleDateString('vi-VN') : '' }); }
    if (errors['matDatepickerMax']) { const d = this.resolvedMax(); return this.#i18n.t('core.form.datetime.max-date', { date: d ? new Date(d).toLocaleDateString('vi-VN') : '' }); }
    if (errors['date']) return errors['date'] as string;
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  }

  hyperlink = input<string | null | undefined>();

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  // Min/max â€” cháº¥p nháº­n 'TODAY', Date, hoáº·c string ISO
  minInput = input<any>(undefined, { alias: 'min' });
  minDateInput = input<any>(undefined, { alias: 'minDate' });
  resolvedMin = computed(() => this.#parseDateBoundary(this.minInput() ?? this.minDateInput()));

  maxInput = input<any>(undefined, { alias: 'max' });
  maxDateInput = input<any>(undefined, { alias: 'maxDate' });
  resolvedMax = computed(() => this.#parseDateBoundary(this.maxInput() ?? this.maxDateInput()));

  valueModel = model<string | number | Date | undefined | null>(undefined, { alias: 'model' });

  // viewed-mode: formControl.value lÃ  chuá»—i display (dd/MM/yyyy HH:mm) nÃªn DatePipe khÃ´ng parse Ä‘Æ°á»£c.
  // Láº¥y tháº³ng tá»« valueModel (nguá»“n dá»¯ liá»‡u tháº­t) rá»“i convert sang Date cho DatePipe.
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
  isMobileOrTablet = SdUtilities.isMobile();
  formControl = new SdFormControl();
  isFocused = false;
  isValid?: boolean;

  /** State popup â€” true khi Ä‘ang má»Ÿ. */
  pickerOpened = signal(false);

  #date: string | undefined | null;
  #subscription = new Subscription();
  #overlayRef: OverlayRef | null = null;

  constructor() {
    // EFFECT 1: Sync model thay Ä‘á»•i tá»« bÃªn ngoÃ i â†’ cáº­p nháº­t hiá»ƒn thá»‹
    effect(() => {
      let val = this.valueModel();
      untracked(() => {
        if (!DateUtilities.isDate(val)) {
          val = null;
        }
        val = DateUtilities.toFormat(val, 'yyyy/MM/dd HH:mm');
        if (this.#date !== val) {
          this.#date = val;
          // Cáº­p nháº­t formControl vá»›i chuá»—i hiá»ƒn thá»‹ dd/MM/yyyy HH:mm
          const fmt = this.showSeconds() ? 'dd/MM/yyyy HH:mm:ss' : 'dd/MM/yyyy HH:mm';
          const displayStr = DateUtilities.isDate(this.#date)
            ? DateUtilities.toFormat(this.#date, fmt)
            : null;
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
        if (inl) validators.push(this.customInlineErrorValidator());

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
    this.#closeOverlay();
  }

  // ==========================================
  // 6. POPUP MANAGEMENT â€” CDK Overlay
  // ==========================================

  /** Má»Ÿ popup chá»n datetime, neo vÃ o input. */
  open() {
    if (this.formControl.disabled || this.pickerOpened()) return;

    const origin = this.elementRef.nativeElement as HTMLElement;
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPositions([
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
        { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
        { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
      ])
      .withFlexibleDimensions(false)
      .withPush(true);

    const overlayConfig = new OverlayConfig({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'sd-datetime-backdrop',
      panelClass: 'sd-datetime-overlay-panel',
    });

    this.#overlayRef = this.overlay.create(overlayConfig);
    const portal = new ComponentPortal(SdDatetimePicker, null, this.injector);
    const ref = this.#overlayRef.attach(portal);

    // Äáº©y state hiá»‡n táº¡i vÃ o popup
    ref.setInput('initialValue', this.#currentValueAsDate());
    ref.setInput('minDate', this.resolvedMin());
    ref.setInput('maxDate', this.resolvedMax());
    ref.setInput('showSeconds', this.showSeconds());

    // Subscribe events tá»« popup
    ref.instance.confirmed.subscribe((value: Date) => this.#onPickerConfirm(value));
    ref.instance.cancelled.subscribe(() => this.#onPickerCancel());

    // ÄÃ³ng khi click backdrop
    this.#overlayRef.backdropClick().subscribe(() => this.#onPickerCancel());

    this.pickerOpened.set(true);
    this.ref.markForCheck();
  }

  /** ÄÃ³ng popup (public â€” gá»i tá»« template náº¿u cáº§n). */
  close() {
    this.#closeOverlay();
  }

  #closeOverlay() {
    if (this.#overlayRef) {
      this.#overlayRef.dispose();
      this.#overlayRef = null;
    }
    if (this.pickerOpened()) {
      this.pickerOpened.set(false);
      this.ref.markForCheck();
    }
  }

  #onPickerConfirm(value: Date) {
    const fmt = this.showSeconds() ? 'yyyy/MM/dd HH:mm:ss' : 'yyyy/MM/dd HH:mm:00';
    // value giá» lÃ  native Date (date-fns), khÃ´ng cáº§n .toDate() nhÆ° Moment.
    const stored = DateUtilities.toFormat(value, fmt);
    if (this.#date !== stored) {
      this.valueModel.set(stored);
      this.sdChange.emit(stored);
    }
    this.#closeOverlay();
  }

  #onPickerCancel() {
    this.#closeOverlay();
  }

  /** Láº¥y giÃ¡ trá»‹ hiá»‡n táº¡i dÆ°á»›i dáº¡ng native Date Ä‘á»ƒ truyá»n vÃ o popup. */
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

  customInlineErrorValidator(): ValidatorFn {
    return (): Record<string, any> | null => ({ inlineError: true });
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
   * Khi user gÃµ trá»±c tiáº¿p vÃ o input vÃ  rá»i focus â†’ validate format dd/MM/yyyy HH:mm
   * Há»— trá»£ cáº£ format cÃ³ giÃ¢y.
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

    // Äá»“ng bá»™ ngÆ°á»£c vá» model náº¿u há»£p lá»‡.
    // date-fns khÃ´ng cÃ³ multi-format strict parse nhÆ° moment, dÃ¹ng helper parseFirstValid.
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

