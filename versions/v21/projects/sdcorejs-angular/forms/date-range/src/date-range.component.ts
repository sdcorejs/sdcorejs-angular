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
  output,
  TemplateRef,
  viewChild,
  contentChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, NgForm, ReactiveFormsModule, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule, MatDateRangePicker } from '@angular/material/datepicker';
import { FloatLabelType, MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdLabelDefDirective } from '@sdcorejs/angular/forms/directives';
import {
  provideSdStrictDateFnsAdapter,
  SD_FORM_CONFIGURATION,
  sdFormControlState,
  SdTemporalValueTransform,
  SdViewed,
  SdViewedInput,
  sdLocalStartOfDay,
  sdParseTransformedTemporal,
  sdSerializeTemporalValue,
  sdViewedInline,
  sdViewedTransform,
  ɵsdFormControlConnector,
  ɵsdModelFacingControl,
  ɵsdTimerScope,
} from '@sdcorejs/angular/forms/models';
import { sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import { SdView } from '@sdcorejs/angular/components/view';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { BrowserUtilities, Utilities } from '@sdcorejs/utils/fns';
import { Size } from '@sdcorejs/utils/models';
import { parse as parseDate } from 'date-fns';
import { enUS as dfEnUS } from 'date-fns/locale';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

export interface SdDateRangeValue {
  from?: string | null;
  to?: string | null;
}

/** Runtime shape held by the aggregate `formControl` — native `Date` endpoints, not the model strings. */
interface SdDateRangeControlValue {
  from: Date | null;
  to: Date | null;
}

function dateStamp(value: unknown): number | null {
  return value instanceof Date && !isNaN(value.getTime()) ? value.getTime() : null;
}

function sameRange(left: SdDateRangeControlValue | null | undefined, right: SdDateRangeControlValue): boolean {
  // why: lần đồng bộ đầu tiên phải luôn ghi, kể cả khi range rỗng — control khởi tạo là `null`
  // còn contract của `formControl.value` (và `form.value[name]`) là object `{ from, to }`.
  if (!left) return false;
  return dateStamp(left.from) === dateStamp(right.from) && dateStamp(left.to) === dateStamp(right.to);
}

/**
 * Chữ ký lỗi ổn định của một control — GỒM CẢ payload, không chỉ tên key.
 * why: fingerprint chỉ theo tên key thì đổi NỘI DUNG lỗi (vd `matDatepickerParse: { text }` từ
 * `"11/1"` sang `"11/12"`) không làm validator tổng chạy lại, nên object lỗi đã copy sang
 * `formControl` giữ nguyên payload cũ và consumer đọc ra text đã lỗi thời.
 * Key được sort để cùng một tập lỗi luôn cho cùng một chữ ký bất kể thứ tự chèn.
 */
function serializeErrors(errors: ValidationErrors | null): string {
  if (!errors) return '';
  const keys = Object.keys(errors).sort();
  try {
    return JSON.stringify(keys.map(key => [key, errors[key]]));
  } catch {
    // Payload không serialize được (tham chiếu vòng) — lùi về chữ ký theo tên key.
    return keys.join(',');
  }
}

/**
 * why: `Validators.required` dùng `isEmptyInputValue`, mà value của control tổng LUÔN là object
 * `{ from, to }` (ghi vô điều kiện mỗi lần đồng bộ) — object thì không bao giờ "empty", nên
 * `[required]` trên `<sd-date-range>` TRƯỚC ĐÂY KHÔNG BAO GIỜ làm form cha invalid được.
 * Ở đây phải kiểm tra thật sự từng đầu range.
 */
function rangeIsComplete(value: unknown): boolean {
  const range = value as SdDateRangeControlValue | null | undefined;
  return !!range?.from && !!range?.to;
}

@Component({
  selector: 'sd-date-range',
  templateUrl: './date-range.component.html',
  styleUrl: './date-range.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.sd-bare]': 'isInline()', '[class.sd-viewed]': 'isViewed() || isInline()', '[class.sd-has-label]': '!!label()' },
  providers: [
    // DateFnsAdapter inject MAT_DATE_LOCALE; cấp default en-US để parse/format hoạt động.
    { provide: MAT_DATE_LOCALE, useValue: dfEnUS },
    provideSdStrictDateFnsAdapter({
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
    MatTooltipModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    SdLabel,
    SdView,
    SdTranslatePipe,
  ],
})
export class SdDateRange {
  id1 = `I${Utilities.generateUuid()}`;
  id2 = `I${Utilities.generateUuid()}`;
  /** why: id ổn định của <mat-error> để hai ô nhập trỏ `aria-describedby` sang — thông báo
   *  lỗi phải đọc được từ chính control, không chỉ hiện ra màn hình. */
  readonly errorId = `${this.id1}-error`;

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
  // why: onBlur hoãn 1 macrotask rồi mới emit sdChange. Không giữ handle thì blur ngay trước
  // khi control bị tháo vẫn bắn output sau destroy — consumer đã unsubscribe, hoặc tệ hơn là
  // nhận một lần emit "ma" cho control không còn tồn tại.
  readonly #timers = ɵsdTimerScope();

  // ==========================================
  // 3. SIGNAL INPUTS & MODEL
  // ==========================================
  autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  autoId = computed(() => (this.autoIdInput() ? `forms-date-range-${this.autoIdInput()}` : undefined));
  fromAutoId = computed(() => {
    const id = this.autoId();
    return id ? `${id}-from` : undefined;
  });
  toAutoId = computed(() => {
    const id = this.autoId();
    return id ? `${id}-to` : undefined;
  });

  readonly #state = sdFormControlState(computed(() => this.formControl));
  // why: control tổng KHÔNG phải nguồn duy nhất của trạng thái. Material bắn matDatepickerParse /
  // matDatepickerMin / matDatepickerMax / matStartDateInvalid lên control1 + control2, và connector
  // gắn/gỡ validator bằng `updateValueAndValidity({ emitEvent: false })` nên `#state` không tick theo.
  // Thiếu 2 snapshot này thì mọi computed bên dưới đóng băng ở giá trị render đầu tiên dưới OnPush.
  readonly #state1 = sdFormControlState(computed(() => this.control1));
  readonly #state2 = sdFormControlState(computed(() => this.control2));
  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataInvalid = computed(() => (this.#state().invalid || this.#state1().invalid || this.#state2().invalid ? 'true' : 'false'));
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

  hideInlineError = input(false, { transform: booleanAttribute });

  /**
   * Tổng hợp error message để hiển thị trong tooltip khi hideInlineError = true.
   */
  readonly errorMessage = computed<string | undefined>(() => {
    // why: message được nuôi bởi CẢ BA control — đọc đủ 3 snapshot thì computed mới invalidate.
    // Trước đây chỉ `#state` được đọc, nên lỗi min/max của 2 đầu range không bao giờ vẽ ra message.
    void this.#state();
    void this.#state1();
    void this.#state2();
    const outerErrors = this.formControl.errors;
    const c1Errors = this.control1.errors;
    const c2Errors = this.control2.errors;

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

  /** Display mode: `false` edit · `true` static view · `'inline'` view + click-to-edit (range picker). */
  viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  /** In `viewed='inline'`, show a hover clear-× on the text face. Set `false` when the host owns removal (chips). */
  clearable = input(true, { transform: booleanAttribute });

  // Tri-state `viewed` — shared primitive. In `'inline'` the range editor is always mounted
  // (chrome hidden via CSS); the sd-view text face opens the range picker on click.
  readonly #viewedState = sdViewedInline(this.viewed, () => this.open(), this.disabled);
  /** `true` when `viewed === 'inline'`. */
  readonly isInline = this.#viewedState.isInline;
  /** `true` when `viewed === true` (static view, no editor). */
  readonly isViewed = this.#viewedState.isViewed;
  /** Open the range picker from the inline text face. No-op unless `viewed='inline'`. */
  enterInlineEdit = (): void => this.#viewedState.enterInlineEdit();

  /** Optional <ng-template #sdValue> projected by consumer to override the viewed text. */
  sdValueTemplate = contentChild<TemplateRef<unknown>>('sdValue');

  /**
   * Formatted "dd/MM/yyyy → dd/MM/yyyy" string for the viewed-mode display.
   * why: viewed mode chỉ hiển thị text — cần format gọn cho cả 2 đầu range,
   * Returns empty when both ends are blank, "from →" when only from is set, and so on.
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
    return `${a} → ${b}`;
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

  /**
   * Output serialization strategy applied to **each endpoint** of the committed range. Affects
   * `model` / `modelChange` / `sdChange` and the registered form field only — the field keeps
   * showing `dd/MM/yyyy → dd/MM/yyyy`. Left unset, endpoints stay canonical `yyyy/MM/dd` strings.
   */
  transform = input<SdTemporalValueTransform | undefined>();

  valueModel = model<SdDateRangeValue | undefined | null>(undefined, { alias: 'model' });

  // ==========================================
  // 4. SIGNAL OUTPUTS
  // ==========================================
  sdChange = output<SdDateRangeValue | undefined | null>();

  // ==========================================
  // 5. INTERNAL STATE & STREAMS
  // ==========================================
  isMobileOrTablet = BrowserUtilities.isMobile();
  formControl = new FormControl();
  control1 = new FormControl();
  control2 = new FormControl();
  /**
   * why: 2 control đầu range là CHI TIẾT NỘI BỘ. Trước đây chúng được đăng ký vào FormGroup của
   * consumer dưới 2 tên UUID ngẫu nhiên (`#c1` / `#c2`), nên `form.value` mọc thêm 2 key đổi theo
   * từng instance — vỡ shape giá trị gửi lên server và làm `form.reset(obj)` không thể viết đúng.
   * Giờ CHỈ control tổng được đăng ký (dưới `name`); 2 connector này để `name` rỗng nên connector
   * bỏ qua hẳn bước đăng ký, ta chỉ dùng phần quản lý validator/disabled dạng CỘNG DỒN của nó.
   */
  readonly #fromConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: computed(() => undefined),
    control: computed(() => this.control1),
    required: this.required,
    disabled: this.disabled,
  });
  readonly #toConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: computed(() => undefined),
    control: computed(() => this.control2),
    required: this.required,
    disabled: this.disabled,
  });

  /**
   * Chữ ký tập lỗi của 2 đầu range — TÊN KEY + PAYLOAD.
   * why: dùng làm dependency cho `#validators` để validator tổng chỉ được hoán đổi khi lỗi thật sự
   * đổi, thay vì mỗi event của control (computed so sánh kết quả bằng `Object.is`).
   * why: chữ ký PHẢI gồm payload. Trước đây chỉ lấy tên key, nên `matDatepickerParse: { text: '11/1' }`
   * đổi thành `{ text: '11/12' }` cho ra cùng chữ ký → validator không chạy lại → object lỗi đã copy
   * sang `formControl` treo lại payload cũ.
   */
  readonly #endpointErrorFingerprint = computed(() => {
    void this.#state1();
    void this.#state2();
    return `${serializeErrors(this.control1.errors)}|${serializeErrors(this.control2.errors)}`;
  });

  readonly #validators = computed<readonly ValidatorFn[]>(() => {
    const isRequired = this.required();
    void this.#endpointErrorFingerprint();

    // why: chỉ control tổng được đăng ký vào form cha, nên lỗi Material nằm trên control1/control2
    // phải được KÉO lên đây — nếu không form cha báo VALID trong khi UI đang đỏ và submit lọt.
    const validator: ValidatorFn = control => {
      const errors: ValidationErrors = { ...(this.control1.errors ?? {}), ...(this.control2.errors ?? {}) };
      if (isRequired && !rangeIsComplete(control.value)) errors['required'] = true;
      return Object.keys(errors).length > 0 ? errors : null;
    };
    return [validator];
  });

  /**
   * why: control tổng giữ `{ from: Date, to: Date }` — biểu diễn của editor. Có `transform` thì
   * consumer được hứa `form.get(name).value` bằng `model` (hai endpoint đã serialize), nên form phải
   * nhận control này. Không có transform thì `registered` trả null, form vẫn nhận control tổng.
   */
  readonly #modelFacing = ɵsdModelFacingControl<SdDateRangeValue | undefined | null>({
    active: computed(() => !!this.transform()),
    model: this.valueModel,
    writeModel: value => {
      this.valueModel.set(value);
      this.sdChange.emit(value);
    },
    source: computed(() => this.formControl),
    modelEquals: (left, right) => (left?.from ?? null) === (right?.from ?? null) && (left?.to ?? null) === (right?.to ?? null),
  });
  /** Control registered in the parent form while a `transform` is active; holds the public model. */
  readonly modelControl = this.#modelFacing.control;

  readonly #rangeConnector = ɵsdFormControlConnector<unknown, unknown>({
    form: this.form,
    name: this.name,
    control: computed(() => this.formControl),
    registeredControl: this.#modelFacing.registered,
    validators: this.#validators,
    disabled: this.disabled,
  });

  #isFocus = false;
  #isModelChange = false;
  #isSdChangeEmittedByEnter = false;
  #isSdChangeEmittedByClear = false;
  /** Cờ loại trừ giữa write đi XUỐNG (`#syncAggregate`) và write đi LÊN (subscriber bên dưới). */
  #isWritingAggregate = false;

  constructor() {
    this.cdRef.markForCheck();

    // EFFECT 1: Sync model thay đổi từ bên ngoài vào control1 và control2
    effect(() => {
      const val = this.valueModel();
      untracked(() => {
        // why: đi qua `#coerceEndpoint` chứ không gọi thẳng `DateUtilities.isDate` — hàm đó từ chối
        // chuỗi RFC-1123, nên `transform="UTCString"` sẽ không render được chính giá trị nó phát ra.
        const fromDate = this.#coerceEndpoint(val?.from);
        const toDate = this.#coerceEndpoint(val?.to);
        const fromStr = fromDate ? DateUtilities.toFormat(fromDate, 'yyyy/MM/dd') : null;
        const toStr = toDate ? DateUtilities.toFormat(toDate, 'yyyy/MM/dd') : null;

        // Chỉ set value nếu có sự khác biệt (tránh loop)
        // control1/control2 giờ giữ native Date (date-fns adapter), không cần .toDate() như Moment.
        const currentFrom = this.control1.value ? DateUtilities.toFormat(this.control1.value, 'yyyy/MM/dd') : null;
        const currentTo = this.control2.value ? DateUtilities.toFormat(this.control2.value, 'yyyy/MM/dd') : null;

        // why: bỏ `{ emitEvent: false }` — nó chặn luôn `events` của control, nên `sdFormControlState`
        // không tick và sau lần render đầu mọi computed (errorMessage, data-invalid, data-value,
        // data-empty) lẫn `<mat-error>` đứng im dưới OnPush.
        if (fromStr !== currentFrom) {
          this.control1.setValue(fromStr ? parseDate(fromStr, 'yyyy/MM/dd', new Date()) : null);
        }
        if (toStr !== currentTo) {
          this.control2.setValue(toStr ? parseDate(toStr, 'yyyy/MM/dd', new Date()) : null);
        }

        // Đồng bộ control tổng để required của form cha không bị invalid khi model default đã có giá trị.
        this.#syncAggregate();
      });
    });

    // SUBSCRIPTION: đẩy giá trị ghi từ NGOÀI vào control tổng ngược xuống 2 đầu range.
    // why: từ khi control1/control2 không còn được đăng ký vào FormGroup của consumer, `fg.reset()`
    // và `fg.patchValue({ period })` chỉ chạm tới control tổng — không còn ai đẩy giá trị đó xuống
    // 2 đầu range nữa, nên `<mat-date-range-input>` vẫn hiện ngày cũ trong khi `form.value.period`
    // đã null. Trước đây reset "vô tình" chạy đúng chỉ vì 2 đầu range nằm sẵn trong group dưới 2 key
    // UUID — chính thứ đã bị gỡ bỏ.
    this.formControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      // Write do chính ta phát ra thì bỏ qua, nếu không sẽ đá nhau với `#syncAggregate`.
      if (this.#isWritingAggregate) return;
      this.#applyAggregate(value);
    });
  }

  /**
   * Ghi `{ from, to }` xuống control tổng, và CHỈ khi thật sự khác giá trị đang giữ.
   * why: write giờ đã phát event; nếu ghi vô điều kiện thì mỗi lần model đổi sẽ bắn thêm một
   * `valueChanges` thừa lên FormGroup cha (object mới luôn "khác" nếu so bằng tham chiếu).
   */
  #syncAggregate(): void {
    const next: SdDateRangeControlValue = { from: this.control1.value ?? null, to: this.control2.value ?? null };
    if (sameRange(this.formControl.value as SdDateRangeControlValue | null | undefined, next)) return;
    this.#isWritingAggregate = true;
    try {
      this.formControl.setValue(next);
    } finally {
      this.#isWritingAggregate = false;
    }
  }

  /**
   * Phân phối giá trị của control tổng xuống `control1` / `control2` / `valueModel`.
   * why: đây là nửa còn thiếu của vòng đồng bộ sau khi 2 đầu range rời FormGroup — `fg.reset(obj)`
   * và `fg.patchValue(obj)` chỉ biết tới control tổng.
   */
  #applyAggregate(value: unknown): void {
    const range = value as { from?: unknown; to?: unknown } | null | undefined;
    const from = this.#coerceEndpoint(range?.from);
    const to = this.#coerceEndpoint(range?.to);

    if (dateStamp(this.control1.value) !== dateStamp(from)) this.control1.setValue(from);
    if (dateStamp(this.control2.value) !== dateStamp(to)) this.control2.setValue(to);

    // Model giữ contract chuỗi `yyyy/MM/dd` (giống `#emit`), không phải native Date.
    const next: SdDateRangeValue = { from: this.#endpointOut(from), to: this.#endpointOut(to) };
    const current = this.valueModel();
    if (next.from !== (current?.from ?? null) || next.to !== (current?.to ?? null)) {
      this.valueModel.set(next);
      this.cdRef.markForCheck();
    }
  }

  /**
   * Serializes one endpoint. Each end is a date, so the instant is local start-of-day — the calendar
   * day the user picked. The two ends are serialized independently; the range object itself is never
   * turned into a single string.
   */
  #endpointOut(value: Date | null): string | null {
    if (!value) return null;
    const transformed = sdSerializeTemporalValue(sdLocalStartOfDay(value), this.transform());
    return transformed ?? DateUtilities.toFormat(value, 'yyyy/MM/dd') ?? null;
  }

  /** Consumer có thể ghi thẳng `Date` hoặc chuỗi ngày vào control tổng — chấp nhận cả hai. */
  #coerceEndpoint(value: unknown): Date | null {
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value !== 'string' || value.trim() === '') return null;
    if (!DateUtilities.isDate(value)) {
      // why: `DateUtilities.isDate` từ chối chuỗi RFC-1123 của `toUTCString()`, nên không có nhánh
      // này thì `<sd-date-range transform="UTCString">` không đọc lại được chính output của nó.
      const parsedTransformed = sdParseTransformedTemporal(value);
      return parsedTransformed ? sdLocalStartOfDay(parsedTransformed) : null;
    }
    const normalized = DateUtilities.toFormat(value, 'yyyy/MM/dd');
    return normalized ? parseDate(normalized, 'yyyy/MM/dd', new Date()) : null;
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
    // control1/control2 giờ giữ native Date, không cần .toDate().
    const from = this.control1.value || null;
    const to = this.control2.value || null;

    const currentModel = this.valueModel();
    const newFrom = DateUtilities.isDate(from) ? this.#endpointOut(from as Date) : null;
    const newTo = DateUtilities.isDate(to) ? this.#endpointOut(to as Date) : null;

    if (newFrom !== currentModel?.from || newTo !== currentModel?.to) {
      const nextModel = { from: newFrom, to: newTo };
      this.#syncAggregate();
      this.valueModel.set(nextModel);
      this.#isModelChange = true;
      this.cdRef.markForCheck();
    }
  };

  clear = () => {
    const emptyModel = { from: null, to: null };
    this.control1.setValue(null);
    this.control2.setValue(null);
    this.#syncAggregate();

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
    // why: vẫn hoãn đúng 1 macrotask như cũ (để onFocus của ô kia kịp huỷ emit khi tab giữa
    // from/to) — chỉ scope handle theo DestroyRef.
    this.#timers.schedule(() => {
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
