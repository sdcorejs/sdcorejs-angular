/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @angular-eslint/no-input-rename */
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
  contentChild
} from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatDatepicker, MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { ISdFormConfiguration, SD_FORM_CONFIGURATION, SdFormControl } from '@sdcorejs/angular/forms/models';
import { SdSize } from '@sdcorejs/angular/utilities';
import { DateUtilities, SdUtilities } from '@sdcorejs/angular/utilities/extensions';
import moment, { Moment } from 'moment';
import { Subscription } from 'rxjs';
import * as uuid from 'uuid';

@Component({
  selector: 'sd-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.scss'],
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
    MatInputModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatDatepickerModule,
    SdLabel,
    SdView
  ],
})
export class SdDate implements OnDestroy, OnInit {
  id = `I${uuid.v4()}`;

  // ==========================================
  // 1. SIGNAL QUERIES
  // ==========================================
  inputRef = viewChild<ElementRef<HTMLInputElement>>('input');
  datePicker = viewChild<MatDatepicker<Moment>>(MatDatepicker);

  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');
  sdViewDef = contentChild(SdViewDefDirective);
  sdLabelDef = contentChild(SdLabelDefDirective);

  // ==========================================
  // 2. INJECTS
  // ==========================================
  private ref = inject(ChangeDetectorRef);
  private formConfig = inject(SD_FORM_CONFIGURATION, { optional: true });

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => this.autoIdInput() ? `forms-date-${this.autoIdInput()}` : undefined);
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

  inlineError = input<string | undefined>();

  /**
   * Tá»•ng há»£p error message Ä‘á»ƒ hiá»ƒn thá»‹ trong tooltip khi hideInlineError = true.
   * DÃ¹ng getter (khÃ´ng pháº£i computed) vÃ¬ formControl.errors khÃ´ng pháº£i Angular signal.
   */
  get errorTooltipMessage(): string | undefined {
    const errors = this.formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return 'Vui lÃ²ng nháº­p thÃ´ng tin';
    if (errors['matDatepickerMin']) { const d = this.resolvedMin(); return `NgÃ y nhá» nháº¥t: ${d ? new Date(d).toLocaleDateString('vi-VN') : ''}`; }
    if (errors['matDatepickerMax']) { const d = this.resolvedMax(); return `NgÃ y lá»›n nháº¥t: ${d ? new Date(d).toLocaleDateString('vi-VN') : ''}`; }
    if (errors['matDatetimePickerParse']) return `Parse error: ${errors['matDatetimePickerParse']?.text}`;
    if (errors['date']) return errors['date'] as string;
    if (errors['customValidator']) return errors['customValidator'] as string;
    if (errors['inlineError']) return this.inlineError();
    return undefined;
  }

  hyperlink = input<string | null | undefined>();

  appearanceInput = input<MatFormFieldAppearance | undefined>(undefined, { alias: 'appearance' });
  appearance = computed(() => this.appearanceInput() ?? this.formConfig?.appearance ?? 'outline');

  floatLabel = input<FloatLabelType>('auto');

  // Xá»­ lÃ½ thÃ´ng minh Gom min/minDate vÃ  max/maxDate
  minInput = input<any>(undefined, { alias: 'min' });
  minDateInput = input<any>(undefined, { alias: 'minDate' });
  resolvedMin = computed(() => this.#parseDateBoundary(this.minInput() ?? this.minDateInput()));

  maxInput = input<any>(undefined, { alias: 'max' });
  maxDateInput = input<any>(undefined, { alias: 'maxDate' });
  resolvedMax = computed(() => this.#parseDateBoundary(this.maxInput() ?? this.maxDateInput()));

  valueModel = model<string | number | Date | undefined | null>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS
  // ==========================================
  sdChange = output<any>();
  sdFocus = output<void>();

  // ==========================================
  // 5. INTERNAL STATE & STREAMS
  // ==========================================
  isMobileOrTablet = SdUtilities.isMobile();
  formControl = new SdFormControl();
  isFocused = false;
  isValid?: boolean;
  
  #date: string | undefined | null;
  #subscription = new Subscription();

  constructor() {
    // EFFECT 1: Sync model thay Ä‘á»•i tá»« bÃªn ngoÃ i (String/Date -> Moment)
    effect(() => {
      let val = this.valueModel();
      untracked(() => {
        if (!DateUtilities.isDate(val)) {
          val = null;
        }
        val = DateUtilities.toFormat(val, 'yyyy/MM/dd');
        if (this.#date !== val) {
          this.#date = val;
          const dateObj = DateUtilities.isDate(this.#date) 
              ? moment(DateUtilities.toFormat(this.#date, 'yyyy/MM/dd'), 'YYYY/MM/DD') 
              : null;
          this.formControl.setValue(dateObj, { emitEvent: false });
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
  }

  // HÃ m private tÃ¡i sá»­ dá»¥ng cho parse Min/Max Date
  #parseDateBoundary(val: any): Date | null {
    if (val === 'TODAY') return new Date();
    if (val && DateUtilities.isDate(val)) return new Date(val);
    return null;
  }

  customInlineErrorValidator(): ValidatorFn {
    return (): Record<string, any> | null => ({ inlineError: true });
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
        formControl.setErrors({ ...formControl.errors, date: `Sai Ä‘á»‹nh dáº¡ng` });
      }, 0);
    } else {
      setTimeout(() => {
        this.isValid = false;
        formControl.setErrors({ ...formControl.errors, date: null });
        this.formControl.updateValueAndValidity();
      }, 0);
    }
  };

  onChange = (event: MatDatepickerInputEvent<Moment>) => {
    const value = DateUtilities.toFormat(event.value?.toDate(), 'yyyy/MM/dd');
    this.inputRef()?.nativeElement?.focus();
    
    if (!this.isValid) {
      if (this.#date !== value) {
        this.valueModel.set(value);
        this.sdChange.emit(value);
      }
    } else {
      this.isValid = false;
      this.formControl.setValue(null);
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
