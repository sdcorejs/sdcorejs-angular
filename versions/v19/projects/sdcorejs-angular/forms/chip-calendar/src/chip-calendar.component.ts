import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  TemplateRef,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { Utilities } from '@sdcorejs/utils/fns';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher, MatNativeDateModule } from '@angular/material/core';
import { MatCalendar, MatDatepickerModule } from '@angular/material/datepicker';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdLabelDefDirective, SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
  SdFormControl,
  sdFormControlState,
  SdViewed,
  SdViewedInput,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
} from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { DateUtilities } from '@sdcorejs/angular/utilities';
import { Size } from '@sdcorejs/utils/models';
import { Subscription } from 'rxjs';
import { SdRemovableChipPipe } from './pipes';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

class SdChipCalendarErrorStateMatcher implements ErrorStateMatcher {
  constructor(private formControl: FormControl) {}
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(this.formControl?.invalid && (this.formControl?.dirty || this.formControl?.touched || isSubmitted));
  }
}

@Component({
  selector: 'sd-chip-calendar',
  templateUrl: './chip-calendar.component.html',
  styleUrl: './chip-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: { '[class.sd-has-label]': '!!label()', '[class.sd-viewed]': 'isViewed()' },
  imports: [
    SdIcon,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    SdLabel,
    SdView,
    SdRemovableChipPipe,
  ],
})
export class SdChipCalendar implements AfterViewInit, OnDestroy {
  #ref = inject(ChangeDetectorRef);
  readonly #i18n = inject(I18nService);
  #subscription = new Subscription();
  #name = Utilities.generateUuid();
  #isBlurring = false;

  menuTrigger = viewChild(MatMenuTrigger);
  calendar = viewChild<MatCalendar<Date>>(MatCalendar);

  autoIdInput = input<string | undefined, string | null | undefined>(undefined, {
    alias: 'autoId',
    transform: (v): string | undefined => v ?? undefined,
  });
  autoId = computed(() => (this.autoIdInput() ? `forms-chip-calendar-${this.autoIdInput()}` : undefined));
  readonly #state = sdFormControlState(computed(() => this.formControl));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataEmpty = computed(() => (sdIsEmpty(this.#state().value) ? 'true' : 'false'));
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
  readonly dataCount = computed(() => {
    const v = this.#state().value;
    return String(Array.isArray(v) ? v.length : 0);
  });

  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataErrorMessage = computed(() => {
    void this.#state();
    const msg = this.errorMessage();
    return msg && msg.length > 0 ? msg : null;
  });
  name = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  appearance = input<MatFormFieldAppearance, MatFormFieldAppearance | null | undefined>('outline', {
    transform: (v): MatFormFieldAppearance => v || 'outline',
  });
  floatLabel = input<FloatLabelType, FloatLabelType | null | undefined>('auto', {
    transform: (v): FloatLabelType => v || 'auto',
  });
  size = input<Size, Size | null | undefined>('md', {
    transform: (v): Size => v || 'md',
  });
  // why: parent may bind NgForm (template-driven), FormGroup (reactive), or a wrapper with `.form`.
  // Transform once at the input boundary so the rest of the component only deals with FormGroup.
  form = input<FormGroup | undefined, any>(undefined, {
    transform: (val: any): FormGroup | undefined => {
      if (!val) return undefined;
      if (val instanceof NgForm) return val.form;
      if (val instanceof FormGroup) return val;
      if (val?.form instanceof FormGroup) return val.form;
      return undefined;
    },
  });
  label = input<string, string | null | undefined>('', {
    transform: (v): string => v ?? '',
  });
  placeholder = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });
  removable = input<boolean | ((item: any) => boolean), boolean | ((item: any) => boolean) | null | undefined>(true, {
    transform: (v): boolean | ((item: any) => boolean) => v ?? true,
  });
  hideInlineError = input(false, { transform: booleanAttribute });
  required = input(false, { transform: booleanAttribute });
  min = input<number, number | null | undefined>(0, {
    transform: (v): number => v ?? 0,
  });
  max = input<number, number | null | undefined>(0, {
    transform: (v): number => v ?? 0,
  });
  disabled = input(false, { transform: booleanAttribute });
  /** Display mode: `false` edit · `true` static view · `'inline'` interactive (disabled `'inline'` → static). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });

  // why: tri-state viewed — `'inline'` keeps it interactive; disabled `'inline'` falls back to static.
  readonly #viewedState = sdViewedInline(this.viewed, undefined, this.disabled);
  /** `true` when the static view should render (`viewed===true`, or disabled `'inline'`). */
  readonly isViewed = this.#viewedState.isViewed;
  hyperlink = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });

  // Two-way model
  model = model<(string | number)[] | undefined>(undefined);

  // Outputs (modelChange auto-generated by model() signal)
  sdChange = output<any[]>();

  input = viewChild<ElementRef<HTMLInputElement>>('input');
  sdViewDef = contentChild(SdViewDefDirective);
  sdLabelDef = contentChild(SdLabelDefDirective);
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');

  isFocused = false;
  #inputControl = new FormControl();
  #formControl = new SdFormControl();
  // why: `min`/`max` là validator do CHÍNH component sở hữu; `required` đi qua option riêng của
  // connector. Connector chỉ add/remove đúng phần này nên validator do consumer tự gắn vào
  // `formControl` public không bị xoá — trước đây `clearValidators()` + `setValidators()` xoá sạch.
  readonly #validators = computed<readonly ValidatorFn[]>(() => {
    const validators: ValidatorFn[] = [];
    const min = this.min();
    const max = this.max();
    if (min > 0) validators.push(Validators.minLength(min));
    if (max > 0) validators.push(Validators.maxLength(max));
    return validators;
  });
  readonly #formConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: computed(() => this.name() || this.#name),
    control: computed(() => this.#formControl),
    validators: this.#validators,
    required: this.required,
  });
  #matcher!: SdChipCalendarErrorStateMatcher;
  readonly separatorKeysCodes = [ENTER, COMMA];

  constructor() {
    effect(() => {
      const values = this.model();
      if (Array.isArray(values)) {
        this.#formControl.setValue(values);
      }
    });

    effect(() => {
      const isDisabled = this.disabled();
      if (isDisabled) {
        this.#formControl.disable();
        this.#inputControl.disable();
      } else {
        this.#formControl.enable();
        this.#inputControl.enable();
      }
    });

    effect(() => {
      const nameVal = this.name();
      if (nameVal) {
        this.#name = nameVal;
      }
    });

    this.#matcher = new SdChipCalendarErrorStateMatcher(this.#formControl);
  }

  get formControl() {
    return this.#formControl;
  }

  get inputControl() {
    return this.#inputControl;
  }

  // why: PHẢI đọc `required`/`min`/`max` VÔ ĐIỀU KIỆN ở đây. Connector cài/gỡ validator bằng
  // `updateValueAndValidity({ emitEvent: false })` → `formControl.errors` đổi mà KHÔNG phát event
  // nào → `#state` (sdFormControlState) không tick. Nếu computed chỉ phụ thuộc `#state` thì bật
  // `[required]` lúc RUNTIME sẽ giữ nguyên message cũ dưới OnPush: control invalid, viền đỏ, nhưng
  // KHÔNG có chữ. Đọc sớm (trước `if (!errors) return`) để dependency được ghi nhận cả khi control
  // đang hợp lệ — đọc trong nhánh `errors[...]` thì lần chạy "không lỗi" không đăng ký dependency.
  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    void this.required();
    const min = this.min();
    const max = this.max();
    const errors = this.#formControl.errors;
    if (!errors) return undefined;

    if (errors['required']) return this.#i18n.t('core.form.chip-calendar.required');
    if (errors['minlength']) return this.#i18n.t('core.form.chip-calendar.minlength', { min });
    if (errors['maxlength']) return this.#i18n.t('core.form.chip-calendar.maxlength', { max });
    return undefined;
  });

  get matcher() {
    return this.#matcher;
  }

  ngAfterViewInit() {
    this.#subscription.add(
      this.#formControl.sdChanges.subscribe(() => {
        this.#ref.markForCheck();
      })
    );
  }

  ngOnDestroy() {
    this.#subscription.unsubscribe();
  }

  #clickChip = (event: Event, item: any) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!this.#formControl.disabled) {
      this.#focus();
    }
  };

  #remove = (item: string): void => {
    const values: string[] = this.#formControl.value ?? [];
    if (typeof item === 'string') {
      // why: `filter` đã trả mảng mới nên reference đổi → `model.set` phát `modelChange`.
      const next = values.filter(value => item !== value);
      this.#formControl.setValue(next);
      this.model.set(next);
      this.sdChange.emit(next);
    }
    this.#inputControl.setValue('');
    this.#focus();
  };

  #select = (event: MatAutocompleteSelectedEvent) => {
    const item = event.option.value;
    const values: (string | number)[] = this.#formControl.value ?? [];
    if (item) {
      if (typeof item === 'string' || typeof item === 'number') {
        if (!values.includes(item)) {
          // why: PHẢI tạo mảng MỚI. `values` là chính mảng của consumer (model đi thẳng vào
          // formControl), nên `push` vừa sửa trộm mảng của họ, vừa giữ nguyên reference —
          // `model()` dùng equality Object.is nên `model.set(sameRef)` KHÔNG phát `modelChange`.
          const next = [...values, item];
          this.#formControl.setValue(next);
          this.model.set(next);
          this.sdChange.emit(next);
        }
      }
      const inputEl = this.input();
      if (inputEl) inputEl.nativeElement.value = '';
      this.#inputControl.setValue('', {
        emitEvent: false,
      });
    }
  };

  #onClick = () => {
    if (this.sdViewDef()?.templateRef) {
      if (!this.#formControl.disabled && !this.isFocused) {
        this.#focus();
      }
    }
  };

  #focus = () => {
    this.isFocused = true;
    this.#isBlurring = false;
    setTimeout(() => {
      if (this.isFocused) {
        this.input()?.nativeElement?.focus();
      }
    }, 100);
  };

  #clear = (evt?: any) => {
    evt?.stopPropagation();
    this.#inputControl.setValue('');
    this.#formControl.setValue([]);
    this.model.set(this.#formControl.value);
    this.sdChange.emit(this.#formControl.value);
    this.#ref.detectChanges();
  };

  #selectDate = (date: Date | null) => {
    const value = DateUtilities.toFormat(date, 'yyyy/MM/dd');
    const values: (string | number)[] = this.#formControl.value ?? [];
    if (value) {
      // why: toggle ngày — cả nhánh thêm lẫn nhánh bỏ đều dựng mảng MỚI. Nhánh thêm trước đây
      // `push` thẳng vào mảng của consumer: reference không đổi nên `model.set` im lặng
      // (Object.is) → `[(model)]` không nhận ngày vừa chọn, mà mảng gốc lại bị sửa trộm.
      const next = values.includes(value) ? values.filter(date => value !== date) : [...values, value];
      this.#formControl.setValue(next);
      this.model.set(next);
      this.sdChange.emit(next);
      this.calendar()?.updateTodaysDate();
      this.#ref.markForCheck();
    }
  };

  #closeCalendar = () => {
    this.isFocused = false;
    this.input()?.nativeElement?.blur();
  };

  #dateClass = (cellDate: Date) => {
    const dates: string[] = this.#formControl.value || [];
    if (Array.isArray(dates)) {
      const selected = dates.some(date => date === DateUtilities.toFormat(cellDate, 'yyyy/MM/dd'));
      return selected ? 'sd-chip-calendar-selected-date' : '';
    }
    return '';
  };

  onClickChip = (event: Event, item: any) => this.#clickChip(event, item);
  onRemove = (item: string) => this.#remove(item);
  onSelect = (event: MatAutocompleteSelectedEvent) => this.#select(event);
  onClick = () => this.#onClick();
  onClear = (evt?: any) => this.#clear(evt);
  onSelectDate = (date: Date | null) => this.#selectDate(date);
  onCloseCalendar = () => this.#closeCalendar();
  dateClass = (cellDate: Date) => this.#dateClass(cellDate);
}
