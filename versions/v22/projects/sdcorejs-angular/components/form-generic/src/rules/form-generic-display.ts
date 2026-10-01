import { EMPTY_STR } from '@sdcorejs/utils/constants';
import { DateUtilities, NumberUtilities } from '@sdcorejs/utils/fns';
import type { SdFormGenericField, SdFormGenericNumber } from '../models/form-generic-field.model';

// why: the read-only text of a field value, shared by the viewed pipe and SdFormRenderService.viewEntities.
// Pure: catalog labels and the number format are passed in by the caller.

/** Chuỗi che mật khẩu ở chế độ chỉ xem. */
export const SD_FORM_GENERIC_PASSWORD_MASK = '••••••••';

export type SdFormGenericNumberFormat = '1,234,567.89' | '1.234.567,89';

export interface SdFormGenericDisplayOptions {
  /** Nhãn theo value cho options catalog (lấy từ `catalog.labels` hoặc `catalog.load`). */
  labels?: Readonly<Record<string, string>>;
  /** Định dạng số của Core (`SD_CORE_CONFIGURATION.format.number`). */
  numberFormat?: SdFormGenericNumberFormat;
}

type NumberPreset = Pick<SdFormGenericNumber, 'subtype' | 'precision' | 'currency'>;

/**
 * Số chữ số thập phân khi preset không quy định — CÙNG giá trị cho ô nhập (`sd-input-number`) và chế
 * độ xem, để giá trị đã nhập hiển thị lại y như vậy.
 */
export const SD_FORM_GENERIC_DEFAULT_PRECISION = 3;

/** Số chữ số thập phân theo preset; `undefined` = mặc định của control. */
export const sdNumberPrecision = (field: NumberPreset | null | undefined): number | undefined => {
  const subtype = field?.subtype;
  if (subtype === 'integer') return 0;
  const configured = field?.precision;
  if (typeof configured === 'number' && Number.isInteger(configured) && configured >= 0 && configured <= 10) return configured;
  if (subtype === 'currency') return 0;
  if (subtype === 'decimal' || subtype === 'percent') return 2;
  return undefined;
};

/** Hậu tố trình bày: mã tiền tệ cho `currency`, `%` cho `percent`. */
export const sdNumberSuffix = (field: NumberPreset | null | undefined): string | undefined => {
  if (field?.subtype === 'currency') return (field.currency || 'VND').toString();
  if (field?.subtype === 'percent') return '%';
  return undefined;
};

const present = (value: unknown): boolean => value !== undefined && value !== null && value !== '';
const listOf = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value]).filter(present);

const formatNumber = (value: unknown, digits: number, format: SdFormGenericNumberFormat | undefined): string => {
  const fixed = NumberUtilities.isNumber(value) ? (+(value as number)).toFixed(digits) : null;
  return (format === '1.234.567,89' ? NumberUtilities.toVN(fixed) : NumberUtilities.toISO(fixed)) ?? '';
};

const optionLabels = (
  field: Extract<SdFormGenericField, { options: unknown }>,
  values: unknown[],
  labels: Readonly<Record<string, string>> | undefined
): string => {
  if (field.options?.source === 'static') {
    return (field.options.items ?? [])
      .filter(item => values.includes(item.value))
      .map(item => item.label)
      .join(', ');
  }
  return values
    .map(value => labels?.[String(value)])
    .filter(present)
    .join(', ');
};

/** Chuỗi hiển thị của giá trị field ở chế độ chỉ xem. */
export const sdDisplayValue = (field: SdFormGenericField, value: unknown, options: SdFormGenericDisplayOptions = {}): string => {
  if (!field?.key) return '';
  if (value === undefined || value === null) return EMPTY_STR;
  switch (field.type) {
    case 'textfield':
      if (field.subtype === 'password') return value ? SD_FORM_GENERIC_PASSWORD_MASK : EMPTY_STR;
      return (value as string) || EMPTY_STR;
    case 'textarea':
      return (value as string) || EMPTY_STR;
    case 'number': {
      const formatted = formatNumber(value, sdNumberPrecision(field) ?? SD_FORM_GENERIC_DEFAULT_PRECISION, options.numberFormat);
      if (!formatted) return EMPTY_STR;
      const suffix = sdNumberSuffix(field);
      return suffix ? `${formatted} ${suffix}` : formatted;
    }
    case 'chip-string': {
      const items = listOf(value);
      return items.length ? items.join(', ') : EMPTY_STR;
    }
    case 'chip-calendar': {
      const items = listOf(value);
      return items.length ? items.map(item => DateUtilities.toFormat(item as string, 'dd/MM/yyyy') || item).join(', ') : EMPTY_STR;
    }
    case 'datetime':
      return DateUtilities.toFormat(value as string, field.subtype === 'datetime' ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy') || EMPTY_STR;
    case 'select':
    case 'radio': {
      const values = listOf(value);
      if (!values.length) return EMPTY_STR;
      return optionLabels(field, values, options.labels) || EMPTY_STR;
    }
    default:
      return '';
  }
};
