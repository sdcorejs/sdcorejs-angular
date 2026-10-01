import { ChangeDetectionStrategy, Component, computed, inject, input, isDevMode } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdInput } from '@sdcorejs/angular/forms';
import { SdCustomValidator } from '@sdcorejs/angular/forms/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { sdIsExternalHttpUrl } from '@sdcorejs/angular/utilities';
import type { SdFormGenericTextfield } from '../../../../../../models/form-generic-field.model';
import {
  SD_FORM_GENERIC_PASSWORD_MASK,
  sdIsValidPattern,
  sdTextInputSpec,
  sdTextPresetValidates,
  sdTextSubtype,
  sdValidateTextPreset,
} from '../../../../../../presets/form-generic-presets';
import { FormRenderContext } from '../../../../form-render.context';

@Component({
  selector: 'lib-textfield',
  templateUrl: './textfield.component.html',
  styleUrl: './textfield.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdInput, SdView],
})
export class TextfieldComponent {
  readonly field = input.required<SdFormGenericTextfield>();
  readonly form = input.required<FormGroup>();
  readonly disabled = input(false);
  readonly required = input(false);

  readonly #context = inject(FormRenderContext);
  readonly #i18n = inject(I18nService);

  readonly labelPlacement = this.#context.labelPlacement;
  readonly viewed = computed(() => this.#context.viewed() || !!this.field().viewed);
  readonly value = computed(() => this.#context.value()[this.field().key] as string | null | undefined);
  /** Thuộc tính `<input>` gốc theo preset (type/inputmode/autocomplete). */
  readonly inputSpec = computed(() => sdTextInputSpec(this.field()));
  readonly isPassword = computed(() => sdTextSubtype(this.field()) === 'password');
  readonly passwordMask = SD_FORM_GENERIC_PASSWORD_MASK;

  /**
   * Validator của preset (email/phone/url).
   * why: tham chiếu ỔN ĐỊNH — `sd-input` cài lại async validator mỗi khi input `validator` đổi.
   */
  readonly presetValidator: SdCustomValidator = value => {
    const error = sdValidateTextPreset(this.field(), value);
    return error ? this.#i18n.t(error.key, error.params) : '';
  };

  /**
   * Chỉ preset cần kiểm tra mới gắn validator, để textfield thường không chuyển `PENDING` sau mỗi lần gõ.
   * Field chỉ xem không được validate (như `required`, xem `LibItemComponent`).
   */
  readonly effectiveValidator = computed<SdCustomValidator | undefined>(() =>
    !this.viewed() && sdTextPresetValidates(this.field()) ? this.presetValidator : undefined
  );

  /** Regex của schema; chuỗi không biên dịch được bị bỏ qua (cảnh báo khi dev) thay vì làm vỡ field. */
  readonly pattern = computed(() => {
    const field = this.field();
    const pattern = field.validation?.pattern?.value;
    if (!pattern || this.viewed()) return undefined;
    if (sdIsValidPattern(pattern)) return pattern;
    if (isDevMode())
      console.warn(`[sd-form-render] validation.pattern of field "${field.key}" is not a valid regular expression and is ignored.`);
    return undefined;
  });

  /** Link ở chế độ xem cho preset URL — CHỈ khi giá trị là URL http(s) an toàn, ngoài ra là chữ thường. */
  readonly viewedHyperlink = computed(() => {
    if (sdTextSubtype(this.field()) !== 'url') return undefined;
    const value = this.value();
    return typeof value === 'string' && sdIsExternalHttpUrl(value.trim()) ? value.trim() : undefined;
  });

  setValue(value: unknown): void {
    this.#context.patch({ [this.field().key]: value });
  }
}
