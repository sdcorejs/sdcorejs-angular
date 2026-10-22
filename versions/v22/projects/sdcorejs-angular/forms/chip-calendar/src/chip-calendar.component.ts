import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  model,
  output,
  TemplateRef,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Utilities } from '@sdcorejs/utils/fns';
import {
  AbstractControl,
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
  SdTemporalValueTransform,
  SdViewed,
  SdViewedInput,
  sdLocalStartOfDay,
  sdSerializeTemporalValue,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
  ɵsdModelFacingControl,
  ɵsdNormalizeCalendarDay,
  ɵsdTimerScope,
} from '@sdcorejs/angular/forms/models';
import type { SdLabelPlacement } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { Size } from '@sdcorejs/utils/models';
import { Subscription } from 'rxjs';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/** One date of the model: canonical `yyyy/MM/dd`, ISO / RFC-1123 string, `Date` or timestamp (read like `<sd-date>`). */
export type SdChipCalendarValue = string | number | Date;
/** Model of `<sd-chip-calendar>`: read wide, written back as `string[]` (see `transform`). */
export type SdChipCalendarModel = SdChipCalendarValue[] | null | undefined;

/** `removable`: all chips, none, or a predicate that receives the normalised `yyyy/MM/dd` day. */
export type SdChipCalendarRemovable = boolean | ((day: string) => boolean);

const FULL_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

/** Same days in the same order. */
function sameDays(left: readonly unknown[] | null | undefined, right: readonly unknown[] | null | undefined): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((value, index) => Object.is(value, right[index]));
}

/** `yyyy/MM/dd` → local midnight of that day (the carrier `mat-calendar` and `Intl` work with). */
function dayToDate(day: string): Date {
  const [year, month, date] = day.split('/').map(Number);
  return new Date(year, month - 1, date);
}

@Component({
  selector: 'sd-chip-calendar',
  templateUrl: './chip-calendar.component.html',
  styleUrl: './chip-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    '[class.sd-has-label]': '!!label()',
    '[class.sd-viewed]': 'isViewed()',
    '[class.sd-label-top]': "labelPlacement() === 'top'",
  },
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
  ],
})
export class SdChipCalendar implements AfterViewInit, OnDestroy {
  #ref = inject(ChangeDetectorRef);
  readonly #i18n = inject(I18nService);
  readonly #dateTime = inject(SdDateTimeService);
  readonly #zoned = this.#dateTime.timeZone !== 'local';
  // why: lỗi phải hiện khi form cha đã submit dù field chưa chạm (A4). NgForm / FormGroupDirective tổ tiên
  // giữ cờ `submitted`; MatInput cũng lấy đúng hai directive này cho ErrorStateMatcher.
  readonly #parentForm = inject(FormGroupDirective, { optional: true }) ?? inject(NgForm, { optional: true });
  // why: focus hoãn 100ms; handle phải bị clear khi destroy, nếu không timer vẫn chạm
  // input của view đã tháo.
  readonly #timers = ɵsdTimerScope();
  #subscription = new Subscription();
  #name = Utilities.generateUuid();
  #isBlurring = false;
  #warnedUnreadable = false;
  /** why: id ổn định của <mat-error> để ô nhập chip trỏ `aria-describedby` sang — thông báo
   *  lỗi phải đọc được từ chính control, không chỉ hiện ra màn hình. */
  readonly errorId = `sd-chip-calendar-error-${Utilities.generateUuid()}`;

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
  /**
   * `'float'` (mặc định) hoặc `'top'` — nhãn `<label for>` tĩnh phía trên ô nhập chip.
   * why: ô nhập chip là `<input matInput>` thật nên nhãn rời gắn `for` vào đó (`inputId`).
   */
  labelPlacement = input<SdLabelPlacement>('float');
  /**
   * id ổn định của ô nhập chip — nhãn rời trỏ `for` sang, và `mat-chip-grid` dùng nó làm id cho
   * `<mat-label>` ở chế độ nổi. why: luôn gán (kể cả `'float'`): `[id]="null"` sẽ ghi đè id mặc định
   * của `MatChipInput` thành chuỗi `"null"` và làm mất liên kết nhãn.
   */
  readonly inputId = `I${Utilities.generateUuid()}`;
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
  /**
   * `true` / `false` for every chip, or a predicate. The predicate receives the normalised `yyyy/MM/dd` day and is
   * applied on every removal path: the ✕ button, Backspace / Delete on a chip, pressing the day again in the
   * calendar and clearing.
   */
  removable = input<SdChipCalendarRemovable, SdChipCalendarRemovable | null | undefined>(true, {
    transform: (v): SdChipCalendarRemovable => v ?? true,
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
  /**
   * String form of each day when the value leaves the component, same contract as `<sd-date>`: `undefined` →
   * `yyyy/MM/dd`, `'ISOString'` / `'UTCString'` → the start of the day (in `ISdCoreConfiguration.timeZone` when
   * configured). Display is not affected.
   */
  transform = input<SdTemporalValueTransform | undefined>();

  // why: tri-state viewed — `'inline'` keeps it interactive; disabled `'inline'` falls back to static.
  readonly #viewedState = sdViewedInline(this.viewed, undefined, this.disabled);
  /** `true` when the static view should render (`viewed===true`, or disabled `'inline'`). */
  readonly isViewed = this.#viewedState.isViewed;
  hyperlink = input<string | undefined, string | null | undefined>(undefined, {
    transform: (v): string | undefined => v ?? undefined,
  });

  /**
   * Two-way model. Read wide (each item `string | number | Date`, like `<sd-date>`), written back only on a user
   * action, as `string[]`. A model from the parent is never rewritten.
   */
  model = model<SdChipCalendarModel>(undefined);

  // Outputs (modelChange auto-generated by model() signal)
  sdChange = output<string[]>();

  input = viewChild<ElementRef<HTMLInputElement>>('input');
  sdViewDef = contentChild(SdViewDefDirective);
  sdLabelDef = contentChild(SdLabelDefDirective);
  sdLabelTemplate = contentChild<TemplateRef<any>>('sdLabel');
  sdValueTemplate = contentChild<TemplateRef<any>>('sdValue');

  isFocused = false;
  #inputControl = new FormControl();
  /** Holds the normalised days (`yyyy/MM/dd`, no duplicates, model order); the parent form gets this control
   *  unless a `transform` is set. */
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

  /**
   * why: with a `transform` the model holds ISO / RFC-1123 strings while the control keeps `yyyy/MM/dd`. Like
   * `<sd-date>`, the parent form then gets a control that carries the model, so `form.value` equals `modelChange`.
   */
  readonly #modelFacing = ɵsdModelFacingControl<SdChipCalendarModel>({
    active: computed(() => !!this.transform()),
    model: this.model,
    writeModel: value => this.#writeModel(value),
    source: computed<AbstractControl>(() => this.#formControl),
    modelEquals: (left, right) => this.#modelsEqual(left, right),
  });
  readonly #formConnector = ɵsdFormControlConnector<SdChipCalendarModel, string[] | null>({
    form: this.form,
    name: computed(() => this.name() || this.#name),
    control: computed<AbstractControl<string[] | null>>(() => this.#formControl),
    registeredControl: this.#modelFacing.registered,
    model: this.model,
    writeModel: value => this.#writeModel(value),
    modelToControl: value => this.#days(value),
    controlToModel: days => this.#serializeDays(days),
    modelEquals: (left, right) => this.#modelsEqual(left, right),
    controlEquals: sameDays,
    validators: this.#validators,
    required: this.required,
  });
  #matcher!: ErrorStateMatcher;

  readonly #fullDate = computed(() => new Intl.DateTimeFormat(this.#i18n.locale(), FULL_DATE));

  constructor() {
    effect(() => {
      const isDisabled = this.disabled();
      // why: `enable()` / `disable()` phát `valueChanges`; connector sẽ coi đó là thao tác và ghi model (đã
      // transform) ngược lên cha. Chỉ đổi khi trạng thái thật sự khác, và không phát event.
      if (isDisabled !== this.#formControl.disabled) {
        if (isDisabled) this.#formControl.disable({ emitEvent: false });
        else this.#formControl.enable({ emitEvent: false });
        this.#ref.markForCheck();
      }
      if (isDisabled) this.#inputControl.disable();
      else this.#inputControl.enable();
    });

    effect(() => {
      const nameVal = this.name();
      if (nameVal) {
        this.#name = nameVal;
      }
    });

    // why: `submitted` của form cha không phải signal; submit phải vẽ lại lỗi dưới OnPush.
    this.#parentForm?.ngSubmit.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.#ref.markForCheck());

    this.#matcher = { isErrorState: (_control, form) => this.#errorGate(form) };
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

  /**
   * The one place that decides whether the error shows (A4): `ErrorStateMatcher`, `<mat-error>`, `aria-invalid` and
   * the `hideInlineError` icon all read it. Invalid and touched, or the parent form was submitted; a selection that
   * is still too short while the user picks (dirty only) shows nothing.
   */
  isErrorShown(): boolean {
    return !!this.errorMessage() && this.#errorGate();
  }

  #errorGate(form?: FormGroupDirective | NgForm | null): boolean {
    const control = this.#formControl;
    return control.invalid && (control.touched || !!(form ?? this.#parentForm)?.submitted);
  }

  /** Whether `day` (`yyyy/MM/dd`) may be removed, per `removable`. */
  isRemovable(day: string): boolean {
    const removable = this.removable();
    return typeof removable === 'function' ? !!removable(day) : removable;
  }

  /** Accessible name of a chip: the full date in the current locale, plus the locked note. */
  chipLabel(day: string): string {
    const full = this.#fullDate().format(dayToDate(day));
    return this.isRemovable(day) ? full : `${full}, ${this.#i18n.t('core.form.chip-calendar.locked')}`;
  }

  /** Accessible name of the ✕ button of a chip. */
  removeLabel(day: string): string {
    return this.#i18n.t('core.form.chip-calendar.remove', { date: this.#fullDate().format(dayToDate(day)) });
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

  /** Normalised days of a model: one `yyyy/MM/dd` per calendar day, model order, unreadable items skipped. */
  #days(value: SdChipCalendarModel): string[] | null {
    if (!Array.isArray(value)) return null;
    const zone = this.#zoned ? this.#dateTime : null;
    const days: string[] = [];
    let unreadable = false;
    for (const item of value) {
      const day = ɵsdNormalizeCalendarDay(item, zone);
      if (!day) {
        unreadable = true;
        continue;
      }
      if (!days.includes(day)) days.push(day);
    }
    if (unreadable && !this.#warnedUnreadable && isDevMode()) {
      this.#warnedUnreadable = true;
      console.warn('[sd-chip-calendar] Skipped model items that are not dates:', value);
    }
    return days;
  }

  /** Days → the model written back: `yyyy/MM/dd`, or the start of each day per `transform` (like `<sd-date>`). */
  #serializeDays(days: string[] | null): SdChipCalendarModel {
    if (!days) return days;
    const transform = this.transform();
    if (!transform) return [...days];
    return days.map(day => {
      const startOfDay = sdLocalStartOfDay(dayToDate(day));
      return sdSerializeTemporalValue(this.#zoned ? this.#dateTime.fromWallClock(startOfDay) : startOfDay, transform) ?? day;
    });
  }

  /**
   * why: không có transform thì so theo ngày, để `[Date]` từ cha và `['yyyy/MM/dd']` của chính ta là một (không ghi
   * ngược model của cha). Có transform thì so nguyên văn, như sd-date: đổi transform rồi thao tác phải ra chuỗi mới.
   */
  #modelsEqual(left: SdChipCalendarModel, right: SdChipCalendarModel): boolean {
    if (this.transform()) return sameDays(left, right);
    return sameDays(this.#days(left), this.#days(right));
  }

  #writeModel(value: SdChipCalendarModel): void {
    this.model.set(value);
    this.sdChange.emit(value ? (value as string[]) : []);
  }

  #currentDays(): string[] {
    const value = this.#formControl.value;
    return Array.isArray(value) ? value : [];
  }

  /** Every user action ends here: a new array of days, written once (the connector writes the model). */
  #commit(next: string[]): void {
    this.#formControl.setValue(next);
    this.#ref.markForCheck();
  }

  #clickChip = (event: Event, item: any) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (!this.#formControl.disabled) {
      this.#focus();
    }
  };

  #remove = (day: string): void => {
    if (typeof day === 'string' && this.isRemovable(day)) {
      const days = this.#currentDays();
      // why: `filter` đã trả mảng mới nên reference đổi → model ghi một lần.
      if (days.includes(day)) this.#commit(days.filter(value => value !== day));
    }
    this.#inputControl.setValue('');
    this.#focus();
  };

  #select = (event: MatAutocompleteSelectedEvent) => {
    const day = ɵsdNormalizeCalendarDay(event.option.value, this.#zoned ? this.#dateTime : null);
    const days = this.#currentDays();
    // why: PHẢI tạo mảng MỚI — không sửa mảng của consumer, và `model()` so Object.is.
    if (day && !days.includes(day)) this.#commit([...days, day]);
    const inputEl = this.input();
    if (inputEl) inputEl.nativeElement.value = '';
    this.#inputControl.setValue('', {
      emitEvent: false,
    });
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
    // why: vẫn 100ms như cũ — chỉ scope handle theo DestroyRef.
    this.#timers.schedule(() => {
      if (this.isFocused) {
        this.input()?.nativeElement?.focus();
      }
    }, 100);
  };

  /** Removes every day the predicate allows; kept days stay. One change, none when nothing goes. */
  #clear = (evt?: any) => {
    evt?.stopPropagation();
    this.#inputControl.setValue('');
    const days = this.#currentDays();
    const kept = days.filter(day => !this.isRemovable(day));
    if (kept.length !== days.length) this.#commit(kept);
    this.#ref.detectChanges();
  };

  #selectDate = (date: Date | null) => {
    // why: ô lịch là ngày lịch (nửa đêm local của native adapter), không phải instant → chỉ đọc chữ số.
    const day = DateUtilities.toFormat(date, 'yyyy/MM/dd');
    if (!day) return;
    const days = this.#currentDays();
    if (days.includes(day)) {
      // A1: bấm lại ngày đã chọn chỉ bỏ khi predicate cho phép.
      if (this.isRemovable(day)) this.#commit(days.filter(value => value !== day));
    } else {
      this.#commit([...days, day]);
    }
    this.calendar()?.updateTodaysDate();
  };

  #closeCalendar = () => {
    this.isFocused = false;
    this.input()?.nativeElement?.blur();
    // A4: đóng lịch là đã tương tác — lỗi (vd thiếu so với `min`) hiện từ đây.
    this.#formConnector.markAsTouched();
    this.#ref.markForCheck();
  };

  #dateClass = (cellDate: Date) => {
    const day = DateUtilities.toFormat(cellDate, 'yyyy/MM/dd');
    return this.#currentDays().includes(day) ? 'sd-chip-calendar-selected-date' : '';
  };

  onClickChip = (event: Event, item: any) => this.#clickChip(event, item);
  onRemove = (item: string) => this.#remove(item);
  onSelect = (event: MatAutocompleteSelectedEvent) => this.#select(event);
  onClick = () => this.#onClick();
  /**
   * why: khi `sdViewDef` đang hiển thị thì bên trong KHÔNG còn phần tử nào focus được, nên
   * click là lối vào DUY NHẤT để chuyển sang chế độ sửa. Bàn phím phải mở được y hệt chuột
   * → Enter/Space chạy chung handler. preventDefault chặn Space cuộn trang (hành vi mặc
   * định của phần tử không phải <button>).
   */
  onViewKeydown = (event: Event) => {
    event.preventDefault();
    this.#onClick();
  };
  onClear = (evt?: any) => this.#clear(evt);
  onSelectDate = (date: Date | null) => this.#selectDate(date);
  onCloseCalendar = () => this.#closeCalendar();
  dateClass = (cellDate: Date) => this.#dateClass(cellDate);
}
