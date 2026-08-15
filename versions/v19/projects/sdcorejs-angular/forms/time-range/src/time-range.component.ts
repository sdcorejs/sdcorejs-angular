import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdViewDefDirective } from '@sdcorejs/angular/forms/directives';
import { SdLabel } from '@sdcorejs/angular/forms/label';
import {
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
import { SdTime, SdTimeModelValue } from '@sdcorejs/angular/forms/time';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsEmpty, sdSerializeDataValue } from '@sdcorejs/angular/utilities/data-state';
import { Utilities } from '@sdcorejs/utils/fns';
import { Size } from '@sdcorejs/utils/models';

import { SdTimeRangeValue, sdNormalizeTimeRange, sdValidateTimeRange } from './time-range-value';

export type SdTimeRangeModelValue = SdTimeRangeValue | null | undefined;

const EMPTY_RANGE: SdTimeRangeValue = { from: null, to: null };

function rangeEquals(left: SdTimeRangeModelValue, right: SdTimeRangeModelValue): boolean {
  return (left?.from ?? null) === (right?.from ?? null) && (left?.to ?? null) === (right?.to ?? null);
}

/**
 * Composes two `SdTime` editors into one timezone-free range model.
 * Endpoint and aggregate validation are surfaced through the group state.
 */
@Component({
  selector: 'sd-time-range',
  templateUrl: './time-range.component.html',
  styleUrl: './time-range.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  host: {
    '[class.sd-has-label]': '!!label()',
    '[class.sd-viewed]': 'connectorState().isViewed || connectorState().isInline',
    '[class.sd-bare]': 'connectorState().isInline',
    // why: mũi tên "→" phải canh giữa theo CHIỀU CAO Ô INPUT, không phải theo cả field (field còn
    // ôm subscript lỗi bên dưới). Chiều cao ô đổi theo size của mat-form-field, nên host phát class
    // size để SCSS chọn đúng `--sd-time-range-row-height`.
    '[class.sd-time-range--md]': "size() === 'md'",
    '[class.sd-time-range--sm]': "size() === 'sm'",
  },
  imports: [SdLabel, SdTime, SdView],
})
export class SdTimeRange {
  readonly #i18n = inject(I18nService);
  readonly fromName = `from-${Utilities.generateUuid()}`;
  readonly toName = `to-${Utilities.generateUuid()}`;

  readonly sdLabelTemplate = contentChild<TemplateRef<unknown>>('sdLabel');
  readonly sdValueTemplate = contentChild<TemplateRef<unknown>>('sdValue');
  readonly sdViewDef = contentChild(SdViewDefDirective);
  readonly fromTime = viewChild<SdTime>('fromTime');
  readonly toTime = viewChild<SdTime>('toTime');

  readonly autoIdInput = input<string | null | undefined>(undefined, { alias: 'autoId' });
  readonly autoId = computed(() => (this.autoIdInput() ? `forms-time-range-${this.autoIdInput()}` : undefined));
  readonly fromAutoId = computed(() => (this.autoId() ? `${this.autoId()}-from` : undefined));
  readonly toAutoId = computed(() => (this.autoId() ? `${this.autoId()}-to` : undefined));
  readonly fromAriaLabel = computed(() => {
    const endpoint = this.#i18n.t('core.form.time-range.from');
    return this.label() ? `${this.label()}: ${endpoint}` : endpoint;
  });
  readonly toAriaLabel = computed(() => {
    const endpoint = this.#i18n.t('core.form.time-range.to');
    return this.label() ? `${this.label()}: ${endpoint}` : endpoint;
  });
  readonly groupAriaLabel = computed(() => this.label() || `${this.fromAriaLabel()} / ${this.toAriaLabel()}`);
  readonly name = input<string>(Utilities.generateUuid());
  readonly form = input<FormGroup | undefined, ɵSdFormControlParent>(undefined, { transform: ɵsdCoerceFormGroup });
  readonly label = input<string | undefined>();
  readonly helperText = input<string | undefined>();
  readonly fromPlaceholder = input<string | undefined>();
  readonly toPlaceholder = input<string | undefined>();
  readonly size = input<Size>('md');
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
  readonly allowOpenEnded = input(false, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly viewed = input<SdViewed, SdViewedInput>(false, { transform: sdViewedTransform });
  readonly hideInlineError = input(false, { transform: booleanAttribute });
  readonly inlineError = input<string | undefined>();
  readonly hyperlink = input<string | null | undefined>();
  readonly valueModel = model<SdTimeRangeModelValue>(undefined, { alias: 'model' });

  readonly sdChange = output<SdTimeRangeModelValue>();
  readonly sdFocus = output<void>();
  readonly sdBlur = output<SdTimeRangeModelValue>();

  readonly fromValue = signal<SdTimeModelValue>(null);
  readonly toValue = signal<SdTimeModelValue>(null);
  readonly formControl = new SdFormControl({ value: EMPTY_RANGE, disabled: false });
  readonly #state = sdFormControlState(
    computed<AbstractControl<SdTimeRangeValue>>(() => this.formControl as AbstractControl<SdTimeRangeValue>)
  );
  readonly #validators = computed<readonly ValidatorFn[]>(() => {
    const constraints = {
      min: this.min(),
      max: this.max(),
      step: this.step(),
      required: this.required(),
      allowOpenEnded: this.allowOpenEnded(),
    };
    // why: text gõ sai ở endpoint (vd "25:10") KHÔNG bao giờ tới được model tổng — `sd-time` chỉ
    // ghi model khi giá trị hợp lệ. Vì chỉ control tổng được đăng ký vào form cha, trạng thái
    // invalid của endpoint phải được kéo lên đây, nếu không form cha báo VALID trong khi UI đang đỏ.
    // why: phải đọc bản THÔ, KHÔNG phải `endpointInvalid` (đã gate theo `touched || dirty`). Kể từ
    // khi endpoint bị gỡ khỏi FormGroup của consumer, validator này là ĐƯỜNG DUY NHẤT để validity
    // của endpoint tới được form cha — gate theo tương tác ở đây nghĩa là một endpoint invalid mà
    // người dùng chưa chạm vào sẽ để `form.valid === true` trong khi UI đang đỏ. Bản gate chỉ dùng
    // cho HIỂN THỊ (`visibleError`, `dataInvalid`).
    const endpointInvalid = this.endpointInvalidRaw();
    const rangeValidator: ValidatorFn = control => {
      // why: `endpoint` phải CỘNG THÊM vào lỗi của range chứ không được THAY THẾ. Trả về mỗi
      // `{ endpoint: true }` sẽ xoá sạch `required`/`incomplete`/`range` khỏi control tổng, nên
      // consumer (và cả `errorMessage` của chính component) bắt theo các key đó sẽ hỏng trong im
      // lặng — vd `[required]` + blur ô "Từ" khi chưa gõ gì: `hasError('required')` bỗng thành false.
      const error = sdValidateTimeRange(control.value as SdTimeRangeModelValue, constraints);
      const errors: ValidationErrors = error ? { [error]: true } : {};
      if (endpointInvalid) errors['endpoint'] = true;
      return Object.keys(errors).length > 0 ? errors : null;
    };
    return this.inlineError() ? [rangeValidator, SdInlineErrorValidator] : [rangeValidator];
  });
  readonly #connector = ɵsdFormControlConnector<SdTimeRangeModelValue, SdTimeRangeValue>({
    form: this.form,
    name: this.name,
    control: computed<AbstractControl<SdTimeRangeValue>>(() => this.formControl as AbstractControl<SdTimeRangeValue>),
    model: this.valueModel,
    writeModel: value => {
      this.valueModel.set(value);
      this.sdChange.emit(value);
    },
    modelToControl: value =>
      sdNormalizeTimeRange(value) ?? {
        from: value?.from ?? null,
        to: value?.to ?? null,
      },
    controlToModel: value => sdNormalizeTimeRange(value) ?? this.valueModel() ?? value,
    modelEquals: rangeEquals,
    controlEquals: rangeEquals,
    validators: this.#validators,
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
    const value = sdNormalizeTimeRange(this.valueModel());
    const from = value?.from ?? '';
    const to = value?.to ?? '';
    return from || to ? `${from} → ${to}` : '';
  });
  /**
   * Endpoint invalid ĐÃ gate theo tương tác — CHỈ dùng cho hiển thị (message, `data-invalid`).
   * `connectorState().invalid` của `sd-time` là `invalid && (touched || dirty)`.
   */
  readonly endpointInvalid = computed(() => !!(this.fromTime()?.connectorState().invalid || this.toTime()?.connectorState().invalid));

  /**
   * Endpoint invalid THÔ — không gate theo tương tác. Dùng cho VALIDATOR của control tổng.
   * why: endpoint không còn được đăng ký vào FormGroup của consumer, nên validity của chúng chỉ
   * tới được form cha qua control tổng. Nếu đường đó cũng gate theo `touched || dirty` thì một
   * endpoint invalid do ghi programmatic (chưa ai chạm vào) sẽ để form cha VALID — sai contract
   * đã ghi trong `sd-time-range.md`.
   * `formControl.invalid` là property thường nên tự nó không phát tín hiệu; đọc `connectorState()`
   * một nhịp để computed có dependency reactive theo `events` của endpoint control.
   */
  readonly endpointInvalidRaw = computed(() => {
    const from = this.fromTime();
    const to = this.toTime();
    void from?.connectorState();
    void to?.connectorState();
    return !!(from?.formControl.invalid || to?.formControl.invalid);
  });

  /**
   * Message đã gate theo tương tác — thứ template được phép hiển thị.
   * why: `errorMessage()` thô bung lỗi ngay lần paint đầu với `[required]`, khi người dùng chưa
   * chạm vào ô nào. `connectorState().validationError` gate theo control tổng; range còn có 2
   * endpoint có thể invalid trong khi control tổng chưa dirty (text sai không tới được model tổng),
   * nên phải cộng thêm nhánh endpoint — `endpointInvalid` tự nó đã gate theo touched/dirty.
   */
  readonly visibleError = computed<string | undefined>(
    () => this.connectorState().validationError ?? (this.endpointInvalid() ? this.errorMessage() : undefined)
  );

  readonly dataDisabled = computed(() => (this.#state().disabled ? 'true' : 'false'));
  readonly dataInvalid = computed(() => (this.#state().invalid || this.endpointInvalid() ? 'true' : 'false'));
  readonly dataEmpty = computed(() => {
    const fromControlValue = this.fromTime()?.connectorState().value;
    const toControlValue = this.toTime()?.connectorState().value;
    return sdIsEmpty(fromControlValue) && sdIsEmpty(toControlValue) && sdIsEmpty(this.fromValue()) && sdIsEmpty(this.toValue())
      ? 'true'
      : 'false';
  });
  readonly dataValue = computed(() => sdSerializeDataValue(this.#state().value));
  readonly dataRequired = computed(() => (this.required() ? 'true' : 'false'));
  readonly dataErrorMessage = computed(() => this.errorMessage() ?? null);

  readonly errorMessage = computed<string | undefined>(() => {
    void this.#state();
    // why: đọc bản THÔ. Connector gắn lại validator bằng `updateValueAndValidity({ emitEvent: false })`
    // nên `#state` KHÔNG tick khi tập lỗi của control tổng đổi vì endpoint; `endpointInvalidRaw`
    // đổi đúng vào lúc đó nên nó là dependency duy nhất kéo message tính lại.
    void this.endpointInvalidRaw();
    const errors = this.formControl.errors;
    const endpointErrors = this.fromTime()?.formControl.errors ?? this.toTime()?.formControl.errors;
    if (errors?.['required'] || endpointErrors?.['required']) return this.#i18n.t('core.form.time-range.required');
    if (errors?.['incomplete']) return this.#i18n.t('core.form.time-range.incomplete');
    if (errors?.['range']) return this.#i18n.t('core.form.time-range.range');
    if (errors?.['fromTime'] || errors?.['toTime'] || endpointErrors?.['time']) {
      return this.#i18n.t('core.form.time-range.invalid');
    }
    if (errors?.['fromMin'] || errors?.['toMin'] || endpointErrors?.['min']) {
      return this.#i18n.t('core.form.time-range.min', { min: this.min() ?? '' });
    }
    if (errors?.['fromMax'] || errors?.['toMax'] || endpointErrors?.['max']) {
      return this.#i18n.t('core.form.time-range.max', { max: this.max() ?? '' });
    }
    if (errors?.['fromStep'] || errors?.['toStep'] || endpointErrors?.['step']) {
      return this.#i18n.t('core.form.time-range.step', { step: this.step() });
    }
    if (errors?.['inlineError']) return this.inlineError();
    return undefined;
  });

  constructor() {
    effect(() => {
      const value = sdNormalizeTimeRange(this.valueModel()) ?? EMPTY_RANGE;
      untracked(() => {
        if (this.fromValue() !== value.from) this.fromValue.set(value.from);
        if (this.toValue() !== value.to) this.toValue.set(value.to);
      });
    });
  }

  onFromChange(value: SdTimeModelValue): void {
    this.fromValue.set(value);
    this.#writeEndpoints(value, this.toValue());
  }

  onToChange(value: SdTimeModelValue): void {
    this.toValue.set(value);
    this.#writeEndpoints(this.fromValue(), value);
  }

  onFocus(): void {
    this.sdFocus.emit();
  }

  onBlur(): void {
    this.#connector.markAsTouched();
    this.sdBlur.emit(this.valueModel());
  }

  clear(): void {
    const model = this.valueModel();
    const fromTime = this.fromTime();
    const toTime = this.toTime();
    if (
      sdIsEmpty(fromTime?.formControl.value) &&
      sdIsEmpty(toTime?.formControl.value) &&
      !this.fromValue() &&
      !this.toValue() &&
      !model?.from &&
      !model?.to
    ) {
      return;
    }
    fromTime?.clear();
    toTime?.clear();
    this.fromValue.set(null);
    this.toValue.set(null);
    this.formControl.setValue({ ...EMPTY_RANGE });
    this.formControl.markAsDirty();
    this.formControl.markAsTouched();
  }

  #writeEndpoints(from: SdTimeModelValue, to: SdTimeModelValue): void {
    this.formControl.setValue({ from: from ?? null, to: to ?? null });
    this.formControl.markAsDirty();
  }
}
