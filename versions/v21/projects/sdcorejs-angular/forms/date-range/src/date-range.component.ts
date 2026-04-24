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
  viewChild,
  contentChild
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';
import { ISdFormConfiguration, SD_FORM_CONFIGURATION } from '@sdcorejs/angular/forms/models';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { DateUtilities, SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import { SdSize } from '@sdcorejs/angular/utilities/models';
import moment, { Moment } from 'moment';
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
  providers: [
    provideMomentDateAdapter({
      parse: { dateInput: 'DD/MM/YYYY' },
      display: {
        dateInput: 'DD/MM/YYYY',
        monthYearLabel: 'MMM YYYY',
        dateA11yLabel: 'LL',
        monthYearA11yLabel: 'MMMM YYYY',
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

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => this.autoIdInput() ? `forms-date-range-${this.autoIdInput()}` : undefined);
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

  hideInlineError = input(false, { transform: booleanAttribute });

  /**
   * Tá»•ng há»£p error message Ä‘á»ƒ hiá»ƒn thá»‹ trong tooltip khi hideInlineError = true.
   * DÃ¹ng getter (khÃ´ng pháº£i computed) vÃ¬ formControl.errors khÃ´ng pháº£i Angular signal.
   */
  get errorTooltipMessage(): string | undefined {
    const outerErrors = this.formControl.errors;
    const c1Errors = this.control1?.errors;
    const c2Errors = this.control2?.errors;

    if (outerErrors?.['required'] || c1Errors?.['required'] || c2Errors?.['required']) {
      return 'Vui lÃ²ng nháº­p thÃ´ng tin';
    }
    if (outerErrors?.['matDatepickerMin'] || c1Errors?.['matDatepickerMin']) {
      return `NgÃ y báº¯t Ä‘áº§u khÃ´ng há»£p lá»‡ (nhá» hÆ¡n giá»›i háº¡n)`;
    }
    if (outerErrors?.['matDatepickerMax'] || c2Errors?.['matDatepickerMax']) {
      return `NgÃ y káº¿t thÃºc khÃ´ng há»£p lá»‡ (lá»›n hÆ¡n giá»›i háº¡n)`;
    }
    return undefined;
  }

  required = input(false, { transform: booleanAttribute });
  disabled = input(false, { transform: booleanAttribute });

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
  isMobileOrTablet = SdUtilities.isMobile();
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
        const currentFrom = this.control1.value ? DateUtilities.toFormat(this.control1.value.toDate(), 'yyyy/MM/dd') : null;
        const currentTo = this.control2.value ? DateUtilities.toFormat(this.control2.value.toDate(), 'yyyy/MM/dd') : null;

        if (fromStr !== currentFrom) {
          this.control1.setValue(fromStr ? moment(fromStr, 'YYYY/MM/DD') : null, { emitEvent: false });
        }
        if (toStr !== currentTo) {
          this.control2.setValue(toStr ? moment(toStr, 'YYYY/MM/DD') : null, { emitEvent: false });
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

  onStartChange = (event: MatDatepickerInputEvent<Moment>) => {
    if (!this.#isFocus) this.#emit();
  };

  onEndChange = (event: MatDatepickerInputEvent<Moment>) => {
    if (!this.#isFocus) this.#emit();
  };

  #emit = () => {
    const from = this.control1.value?.toDate() || null;
    const to = this.control2.value?.toDate() || null;

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
