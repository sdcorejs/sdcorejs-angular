/* eslint-disable @angular-eslint/no-input-rename */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
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
  contentChild
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';
import { ISdFormConfiguration, SD_FORM_CONFIGURATION, sdFormControlState } from '@sdcorejs/angular/forms/models';
import { sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdView } from '@sdcorejs/angular/components/view';
import { I18nService, TranslatePipe } from '@sdcorejs/angular/i18n';
import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import { BrowserUtilities } from '@sdcorejs/utils/fns';
import { Size } from '@sdcorejs/utils/models';
import { parse as parseDate } from 'date-fns';
import { enUS as dfEnUS } from 'date-fns/locale';
import * as uuid from 'uuid';

interface Daterange {
  from?: string | null;
  to?: string | null;
}

@Component({
  selector: 'sd-date-range',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.sd-bare]': 'bare()', '[class.sd-viewed]': 'viewed()', '[class.sd-has-label]': '!!label()' },
  providers: [
    // DateFnsAdapter inject MAT_DATE_LOCALE; cáº¥p default en-US Ä‘á»ƒ parse/format hoáº¡t Ä‘á»™ng.
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
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SdLabel,
    SdView,
    TranslatePipe,
  ],
})
export class SdDateRange implements OnDestroy, OnInit {
  id1 = `I${uuid.v4()}`;
  id2 = `I${uuid.v4()}`;
  #c1 = uuid.v4();
  #c2 = uuid.v4();

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  picker = viewChild<MatDateRangePicker<Date>>(MatDateRangePicker);
  sdLabelDef = contentChild(SdLabelDefDirective);

  // ==========================================
  // 2. INJECTS
  // ==========================================
  private cdRef = inject(ChangeDetectorRef);
  private formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });
  readonly #i18n = inject(I18nService);

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => this.autoIdInput() ? `forms-date-range-${this.autoIdInput()}` : undefined);

  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataInvalid = computed(() => (this.#state().invalid ? 'true' : 'false'));
  readonly dataEmpty = computed(() => {
    const v = this.#state().value as { from?: Date | null; to?: Date | null } | null | undefined;
    const empty = !v || !v.from || !v.to;
    return empty ? 'true' : 'false';
  });
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));

  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataErrorMessage = computed(() => {
    void this.#state();
    const msg = this.errorMessage();
    return msg && msg.length > 0 ? msg : null;
  });

  name = input<string>(uuid.v4());

  size = input<Size>('md');
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

  hideInlineError = input(false, { transform: booleanAttribute });

  /**
   * Tá»•ng há»£p error message Ä‘á»ƒ hiá»ƒn thá»‹ trong tooltip khi hideInlineError = true.
   */
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    const outerErrors = this.formControl.errors;
    const c1Errors = this.control1?.errors;
    const c2Errors = this.control2?.errors;

    if (outerErrors?.['required'] || c1Errors?.['required'] || c2Errors?.['required']) {
      return this.#i18n.t('core.form.date-range.required');
    }
    if (outerErrors?.['matDatepickerMin'] || c1Errors?.['matDatepickerMin']) {
      return this.#i18n.t('core.form.date-range.invalid-min');
    }
    if (outerErrors?.['matDatepickerMax'] || c2Errors?.['matDatepickerMax']) {
      return this.#i18n.t('core.form.date-range.invalid-max');
    }
    return undefined;
  });

  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });

  /** Bare mode â€” strip the form-field shell to fit inline in a chip / token. */
  bare = input(false, { transform: booleanAttribute });

  /** Viewed mode â€” render a read-only <sd-view> instead of the editable form-field. */
  viewed = input(false, { transform: booleanAttribute });

  /** Optional <ng-template #sdValue> projected by consumer to override the viewed text. */
  sdValueTemplate = contentChild<TemplateRef<unknown>>('sdValue');

  /**
   * Formatted "dd/MM/yyyy â†’ dd/MM/yyyy" string for the viewed-mode display.
   * why: viewed mode chá»‰ hiá»ƒn thá»‹ text â€” cáº§n format gá»n cho cáº£ 2 Ä‘áº§u range,
   * Returns empty when both ends are blank, "from â†’" when only from is set, and so on.
   */
  formatted = computed<string>(() => {
    const m = this.valueModel();
    const fmt = (d: unknown): string => {
      if (d == null || d === '') return '';
      const dt = d instanceof Date ? d : new Date(String(d));
      if (isNaN(dt.getTime())) return '';
      const dd = String(dt.getDate()).padStart(2, '0');
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}/${dt.getFullYear()}`;
    };
    const a = fmt(m?.from);
    const b = fmt(m?.to);
    if (!a && !b) return '';
    return `${a} â†’ ${b}`;
  });

  /** Open the range picker panel programmatically (for query-bar chip auto-open). */
  open = (): void => {
    if (this.formControl.disabled) return;
    this.picker()?.open();
  };

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  minInput = input<any>(undefined, { alias: 'min' });
  resolvedMin = computed(() => this.#parseDateBoundary(this.minInput()));

  maxInput = input<any>(undefined, { alias: 'max' });
  resolvedMax = computed(() => this.#parseDateBoundary(this.maxInput()));

  valueModel = model<Daterange | undefined | null>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS
  // ==========================================
  sdChange = output<Daterange | undefined | null>();

  // ==========================================
  // 5. INTERNAL STATE & STREAMS
  // ==========================================
  isMobileOrTablet = BrowserUtilities.isMobile();
  formControl = new FormControl();
  control1 = new FormControl();
  control2 = new FormControl();

  #isFocus: boolean = false;
  #isModelChange: boolean = false;
  #isSdChangeEmittedByEnter: boolean = false;
  #isSdChangeEmittedByClear: boolean = false;

  constructor() {
    this.cdRef.markForCheck();

    // EFFECT 1: Sync model thay Ä‘á»•i tá»« bÃªn ngoÃ i vÃ o control1 vÃ  control2
    effect(() => {
      const val = this.valueModel();
      untracked(() => {
        const fromStr = DateUtilities.isDate(val?.from) ? DateUtilities.toFormat(val?.from, 'yyyy/MM/dd') : null;
        const toStr = DateUtilities.isDate(val?.to) ? DateUtilities.toFormat(val?.to, 'yyyy/MM/dd') : null;

        // Chá»‰ set value náº¿u cÃ³ sá»± khÃ¡c biá»‡t (trÃ¡nh loop)
        // control1/control2 giá» giá»¯ native Date (date-fns adapter), khÃ´ng cáº§n .toDate() nhÆ° Moment.
        const currentFrom = this.control1.value ? DateUtilities.toFormat(this.control1.value, 'yyyy/MM/dd') : null;
        const currentTo = this.control2.value ? DateUtilities.toFormat(this.control2.value, 'yyyy/MM/dd') : null;

        if (fromStr !== currentFrom) {
          this.control1.setValue(fromStr ? parseDate(fromStr, 'yyyy/MM/dd', new Date()) : null, { emitEvent: false });
        }
        if (toStr !== currentTo) {
          this.control2.setValue(toStr ? parseDate(toStr, 'yyyy/MM/dd', new Date()) : null, { emitEvent: false });
        }

        // Äá»“ng bá»™ control tá»•ng Ä‘á»ƒ required cá»§a form cha khÃ´ng bá»‹ invalid khi model default Ä‘Ã£ cÃ³ giÃ¡ trá»‹.
        this.formControl.setValue({ from: this.control1.value, to: this.control2.value }, { emitEvent: false });
        this.formControl.updateValueAndValidity({ emitEvent: false });
      });
    });

    // EFFECT 2: Sync Disable
    effect(() => {
      if (this.disabled()) {
        this.formControl.disable({ emitEvent: false });
        this.control1.disable({ emitEvent: false });
        this.control2.disable({ emitEvent: false });
      } else {
        this.formControl.enable({ emitEvent: false });
        this.control1.enable({ emitEvent: false });
        this.control2.enable({ emitEvent: false });
      }
    });

    // EFFECT 3: Sync Required
    effect(() => {
      const isReq = this.required();
      untracked(() => {
        if (isReq) {
          this.formControl.setValidators([Validators.required]);
          this.control1.setValidators([Validators.required]);
          this.control2.setValidators([Validators.required]);
        } else {
          this.formControl.clearValidators();
          this.control1.clearValidators();
          this.control2.clearValidators();
        }
        this.formControl.updateValueAndValidity({ emitEvent: false });
        this.control1.updateValueAndValidity({ emitEvent: false });
        this.control2.updateValueAndValidity({ emitEvent: false });
      });
    });
  }

  ngOnInit() {
    const formGroup = this.form();
    formGroup?.addControl(this.#c1, this.control1);
    formGroup?.addControl(this.#c2, this.control2);
    formGroup?.addControl(this.name(), this.formControl);
  }

  ngOnDestroy() {
    const formGroup = this.form();
    formGroup?.removeControl(this.#c1);
    formGroup?.removeControl(this.#c2);
    formGroup?.removeControl(this.name());
  }

  #parseDateBoundary(val: any): Date | null {
    if (val === 'TODAY') return new Date();
    if (val && DateUtilities.isDate(val)) return new Date(val);
    return null;
  }

  onStartChange = (event: MatDatepickerInputEvent<Date>) => {
    if (!this.#isFocus) this.#emit();
  };

  onEndChange = (event: MatDatepickerInputEvent<Date>) => {
    if (!this.#isFocus) this.#emit();
  };

  #emit = () => {
    // control1/control2 giá» giá»¯ native Date, khÃ´ng cáº§n .toDate().
    const from = this.control1.value || null;
    const to = this.control2.value || null;

    const currentModel = this.valueModel();
    const newFrom = DateUtilities.isDate(from) ? DateUtilities.toFormat(from, 'yyyy/MM/dd') : null;
    const newTo = DateUtilities.isDate(to) ? DateUtilities.toFormat(to, 'yyyy/MM/dd') : null;

    if (newFrom !== currentModel?.from || newTo !== currentModel?.to) {
      const nextModel = { from: newFrom, to: newTo };
      this.formControl.setValue({ from: this.control1.value, to: this.control2.value }, { emitEvent: false });
      this.valueModel.set(nextModel);
      this.#isModelChange = true;
      this.cdRef.markForCheck();
    }
  };

  clear = () => {
    const emptyModel = { from: null, to: null };
    this.control1.setValue(null, { emitEvent: false });
    this.control2.setValue(null, { emitEvent: false });
    this.formControl.setValue(emptyModel, { emitEvent: false });
    
    this.valueModel.set(emptyModel);
    this.sdChange.emit(emptyModel);
    
    this.#isSdChangeEmittedByClear = true;
    this.cdRef.markForCheck();
  };

  onEnter = () => {
    this.#emit();
    this.sdChange.emit(this.valueModel());
    this.#isSdChangeEmittedByEnter = true;
  };

  onFocus = () => {
    this.#isFocus = true;
    this.#isModelChange = false;
    this.#isSdChangeEmittedByEnter = false;
    this.#isSdChangeEmittedByClear = false;
  };

  onBlur = () => {
    this.#isFocus = false;
    this.#emit();
    setTimeout(() => {
      if (!this.#isFocus && this.#isModelChange && !(this.#isSdChangeEmittedByEnter || this.#isSdChangeEmittedByClear)) {
        this.sdChange.emit(this.valueModel());
      }
    });
  };

  onClosePicker = () => {
    this.sdChange.emit(this.valueModel());
  };

  onOpenPicker = (event: MouseEvent) => {
    event.stopPropagation();
    if (!this.formControl.disabled) {
      this.picker()?.open();
    }
  };
}
