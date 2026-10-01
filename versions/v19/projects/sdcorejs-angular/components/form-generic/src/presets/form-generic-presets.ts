import { VALIDATION_PATTERNS } from '@sdcorejs/utils/constants';
import type { ValidationPatternType } from '@sdcorejs/utils/models';
import type { SdFormGenericNumber, SdFormGenericTextfield } from '../models/form-generic-field.model';
import { sdNumberPrecision } from '../rules/form-generic-display';

export { SD_FORM_GENERIC_PASSWORD_MASK, sdNumberPrecision, sdNumberSuffix } from '../rules/form-generic-display';

/**
 * Preset kiểu nhập của form-generic — MỘT nơi duy nhất quyết định thuộc tính input gốc, validation
 * và trình bày cho `textfield.subtype` / `number.subtype`. Builder (canvas + inspector) và renderer
 * đều đọc từ đây, nên preset không phải "nhãn trên palette" mà là hành vi thật của runtime.
 *
 * why: regex không được rải ở nhiều nơi — email/phone/url dùng lại `VALIDATION_PATTERNS` của
 * `@sdcorejs/utils`; phần kiểm tra thêm (đếm chữ số điện thoại, số chữ số thập phân) nằm ở đây.
 */

/** Lỗi validation của preset: key i18n + tham số. Renderer dịch qua `I18nService`. */
export interface SdFormGenericPresetError {
  key: string;
  params?: Record<string, string | number>;
}

/** Thuộc tính `<input>` gốc tương ứng với preset textfield. */
export interface SdFormGenericTextInputSpec {
  type: 'text' | 'email' | 'tel' | 'url' | 'password';
  inputmode?: 'text' | 'email' | 'tel' | 'url';
  autocomplete?: string;
}

/** Số chữ số tối thiểu/tối đa của một số điện thoại (E.164 tối đa 15 chữ số). */
export const SD_FORM_GENERIC_PHONE_DIGITS = { min: 7, max: 15 } as const;

const patternOf = (type: ValidationPatternType): RegExp | undefined => {
  const pattern = VALIDATION_PATTERNS.find(item => item.type === type)?.pattern;
  return pattern ? new RegExp(pattern) : undefined;
};

const isEmptyValue = (value: unknown): boolean => value === undefined || value === null || value === '';

/** Subtype hiệu lực của textfield (`undefined` và giá trị lạ đều là `'text'`). */
export const sdTextSubtype = (
  component: Pick<SdFormGenericTextfield, 'subtype'> | undefined | null
): NonNullable<SdFormGenericTextfield['subtype']> => {
  const subtype = component?.subtype;
  return subtype === 'email' || subtype === 'phone' || subtype === 'url' || subtype === 'password' ? subtype : 'text';
};

/** Thuộc tính input gốc cho preset textfield. */
export const sdTextInputSpec = (component: Pick<SdFormGenericTextfield, 'subtype'> | undefined | null): SdFormGenericTextInputSpec => {
  switch (sdTextSubtype(component)) {
    case 'email':
      return { type: 'email', inputmode: 'email', autocomplete: 'email' };
    case 'phone':
      return { type: 'tel', inputmode: 'tel', autocomplete: 'tel' };
    case 'url':
      return { type: 'url', inputmode: 'url', autocomplete: 'url' };
    case 'password':
      // why: form do end user thiết kế thường là form ĐẶT mật khẩu (đăng ký, đổi mật khẩu) — không
      // để trình duyệt tự điền mật khẩu đã lưu của người đang thao tác vào đó.
      return { type: 'password', autocomplete: 'new-password' };
    default:
      return { type: 'text' };
  }
};

/**
 * Kiểm tra giá trị theo preset textfield. Giá trị rỗng luôn hợp lệ (rỗng do `required` quyết định).
 * Không đổi dữ liệu: chỉ đọc giá trị (có `trim` để so khớp), không chuẩn hoá ngược vào entity.
 */
export const sdValidateTextPreset = (
  component: Pick<SdFormGenericTextfield, 'subtype' | 'validation'> | undefined | null,
  value: unknown
): SdFormGenericPresetError | null => {
  if (isEmptyValue(value)) return null;
  const text = String(value).trim();
  switch (sdTextSubtype(component)) {
    case 'email': {
      const email = patternOf('EMAIL');
      return email && !email.test(text) ? { key: 'core.validator.email.error' } : null;
    }
    case 'phone': {
      if (component?.validation?.phoneCountry === 'VN') {
        // why: VN_PHONE không nhận khoảng trắng/dấu chấm/gạch — người dùng hay gõ "0912 345 678".
        // Bỏ dấu phân cách CHỈ để kiểm tra; giá trị lưu vẫn là chuỗi người dùng nhập.
        const vnPhone = patternOf('VN_PHONE');
        const compact = text.replace(/[\s.\-()]/g, '');
        return vnPhone && !vnPhone.test(compact) ? { key: 'core.validator.vn-phone.error' } : null;
      }
      const phone = patternOf('PHONE');
      const digits = text.replace(/\D/g, '').length;
      const validShape = !phone || phone.test(text);
      const validLength = digits >= SD_FORM_GENERIC_PHONE_DIGITS.min && digits <= SD_FORM_GENERIC_PHONE_DIGITS.max;
      return validShape && validLength ? null : { key: 'core.validator.phone.error' };
    }
    case 'url': {
      const url = patternOf('URL');
      return url && !url.test(text) ? { key: 'core.validator.url.error' } : null;
    }
    default:
      return null;
  }
};

/**
 * Preset textfield có kiểm tra giá trị không (email / phone / url).
 * why: `sd-input` chạy `validator` như ASYNC validator — gắn cho mọi textfield sẽ làm control chuyển
 * `PENDING` sau mỗi thay đổi. Chỉ preset cần kiểm tra mới được gắn.
 */
export const sdTextPresetValidates = (component: Pick<SdFormGenericTextfield, 'subtype'> | undefined | null): boolean => {
  const subtype = sdTextSubtype(component);
  return subtype === 'email' || subtype === 'phone' || subtype === 'url';
};

/**
 * `validation.pattern.value` có biên dịch được không — thêm `^…$` đúng như `Validators.pattern` của
 * Angular. why: Angular tạo RegExp NGAY khi dựng validator, nên chuỗi sai (vd `[A-Z`) ném lỗi mỗi lần
 * change detection của field thay vì chỉ không khớp.
 */
export const sdIsValidPattern = (pattern: string): boolean => {
  try {
    new RegExp(`${pattern.startsWith('^') ? '' : '^'}${pattern}${pattern.endsWith('$') ? '' : '$'}`);
    return true;
  } catch {
    return false;
  }
};

/** Subtype hiệu lực của number (`undefined` = hành vi cũ). */
export const sdNumberSubtype = (component: Pick<SdFormGenericNumber, 'subtype'> | undefined | null): SdFormGenericNumber['subtype'] => {
  const subtype = component?.subtype;
  return subtype === 'integer' || subtype === 'decimal' || subtype === 'currency' || subtype === 'percent' ? subtype : undefined;
};

/**
 * Kiểm tra giá trị số theo preset: số nguyên và số chữ số thập phân. `null`/rỗng hợp lệ, `0` là
 * giá trị thật (không coi là rỗng). Giá trị không phải số (dữ liệu lạ từ entity) báo lỗi chung.
 */
export const sdValidateNumberPreset = (
  component: Pick<SdFormGenericNumber, 'subtype' | 'precision'> | undefined | null,
  value: unknown
): SdFormGenericPresetError | null => {
  if (isEmptyValue(value)) return null;
  const subtype = sdNumberSubtype(component);
  if (!subtype) return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return { key: 'core.component.form-generic.validator.number' };
  if (subtype === 'integer') {
    return Number.isInteger(numeric) ? null : { key: 'core.component.form-generic.validator.integer' };
  }
  const precision = sdNumberPrecision(component);
  if (precision !== undefined && sdCountDecimals(numeric) > precision) {
    return { key: 'core.component.form-generic.validator.precision', params: { precision } };
  }
  return null;
};

/** Đếm chữ số thập phân của một số hữu hạn (xử lý cả dạng mũ `1e-7`). */
export const sdCountDecimals = (value: number): number => {
  if (!Number.isFinite(value) || Number.isInteger(value)) return 0;
  const text = value.toString().toLowerCase();
  if (text.includes('e-')) {
    const [base, exponent] = text.split('e-');
    const baseDecimals = base.includes('.') ? base.split('.')[1].length : 0;
    return baseDecimals + Number(exponent);
  }
  return text.includes('.') ? text.split('.')[1].length : 0;
};
