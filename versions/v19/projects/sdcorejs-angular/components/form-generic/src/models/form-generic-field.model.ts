import type { Filter } from '@sdcorejs/utils/models';

/**
 * Bố cục của một phần tử trên lưới 12 cột, theo 3 mức bề rộng FORM (không phải màn hình).
 *
 * - `span.desktop` mặc định 12; `span.tablet` mặc định theo desktop; `span.mobile` mặc định 12.
 * - `newRow: true` luôn mở hàng mới dù hàng trước còn chỗ (thay cho phần tử `break` cũ).
 */
export interface SdFormGenericLayout {
  span?: {
    desktop?: number;
    tablet?: number;
    mobile?: number;
  };
  newRow?: boolean;
}

/**
 * Điều kiện động, lưu bằng `Filter` của `@sdcorejs/utils` và đánh giá trên `{ ...value, ...variables }`.
 * Hiện khi (`visible` vắng hoặc đúng) và (`hidden` vắng hoặc sai); `disabled`/`required` là OR với cờ tĩnh.
 */
export interface SdFormGenericRules {
  visible?: Filter;
  hidden?: Filter;
  disabled?: Filter;
  required?: Filter;
}

/** Quốc gia ép định dạng số điện thoại cho `subtype: 'phone'`. Hiện hỗ trợ `'VN'`. */
export type SdFormGenericPhoneCountry = 'VN';

/** Ràng buộc của field. `min`/`max`: số với `number`; `'today'` hoặc ngày ISO với `datetime`. */
export interface SdFormGenericFieldValidation {
  required?: boolean;
  min?: number | 'today' | (string & {});
  max?: number | 'today' | (string & {});
  minLength?: number;
  maxLength?: number;
  pattern?: { value: string; message?: string };
  /** Số phần tử tối đa của chip-string / chip-calendar. */
  maxItems?: number;
  phoneCountry?: SdFormGenericPhoneCountry;
}

/** Một lựa chọn tĩnh của select/radio. */
export interface SdFormGenericOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Tham chiếu có cấu trúc tới giá trị: field khác, biến, hoặc hằng số. */
export type SdFormGenericValueRef = { field: string } | { variable: string } | { value: string | number | boolean };

/** Tham số gửi cho catalog / html query / upload, giá trị là tham chiếu có cấu trúc. */
export interface SdFormGenericParam {
  name: string;
  value: SdFormGenericValueRef;
}

/** Khi người dùng chọn một mục catalog: ghi `item.data[from]` vào field `field`. */
export interface SdFormGenericFill {
  field: string;
  from: string;
}

/** Nguồn lựa chọn: danh sách tĩnh, hoặc catalog đăng ký ở `provideSdFormGeneric`. */
export type SdFormGenericOptions =
  | { source: 'static'; items: SdFormGenericOption[] }
  | { source: 'catalog'; catalog: string; params?: SdFormGenericParam[]; fill?: SdFormGenericFill[] };

/**
 * Kiểu nhập (preset) của `textfield`. Không có / `'text'` = văn bản tự do.
 * `'password'` che ký tự, không áp `defaultValue`, không hiện giá trị ở chế độ xem.
 */
export type SdFormGenericTextfieldSubtype = 'text' | 'email' | 'phone' | 'url' | 'password';

/**
 * Kiểu số (preset) của `number`. Dữ liệu luôn là `number`; ký hiệu và dấu phân cách chỉ là trình bày.
 * `'percent'` theo quy ước của `sd-input-number`: nhập `10` nghĩa là 10%.
 */
export type SdFormGenericNumberSubtype = 'integer' | 'decimal' | 'currency' | 'percent';

interface SdFormGenericFieldBase<TType extends string, TValue> {
  id: string;
  type: TType;
  key: string;
  label: string;
  placeholder?: string;
  helperText?: string;
  defaultValue?: TValue;
  layout?: SdFormGenericLayout;
  rules?: SdFormGenericRules;
  validation?: SdFormGenericFieldValidation;
  disabled?: boolean;
  /** Hiển thị dạng chỉ xem (khác disabled). */
  viewed?: boolean;
  hidden?: boolean;
  /** Link khi ở chế độ chỉ xem; `${key}` trong chuỗi là văn bản tự do, không được đổi khi đổi mã. */
  hyperlink?: string;
}

export interface SdFormGenericTextfield extends SdFormGenericFieldBase<'textfield', string> {
  subtype?: SdFormGenericTextfieldSubtype;
}

export type SdFormGenericTextarea = SdFormGenericFieldBase<'textarea', string>;

export interface SdFormGenericNumber extends SdFormGenericFieldBase<'number', number> {
  subtype?: SdFormGenericNumberSubtype;
  /** Số chữ số thập phân tối đa; không có thì theo preset. */
  precision?: number;
  /** Mã tiền tệ cho `subtype: 'currency'` (mặc định `VND`). */
  currency?: string;
}

export interface SdFormGenericSelect extends SdFormGenericFieldBase<'select', string | string[]> {
  options: SdFormGenericOptions;
  multiple?: boolean;
}

export interface SdFormGenericRadio extends SdFormGenericFieldBase<'radio', string> {
  options: SdFormGenericOptions;
  direction?: 'row' | 'column';
}

export type SdFormGenericCheckbox = SdFormGenericFieldBase<'checkbox', boolean>;

export interface SdFormGenericDatetime extends SdFormGenericFieldBase<'datetime', string> {
  subtype?: 'date' | 'datetime';
}

export type SdFormGenericChipString = SdFormGenericFieldBase<'chip-string', string[]>;

export type SdFormGenericChipCalendar = SdFormGenericFieldBase<'chip-calendar', string[]>;

export interface SdFormGenericUpload extends SdFormGenericFieldBase<'upload', unknown> {
  accept?: 'file' | 'image';
  source?: 'ALL' | 'PHOTO_LIBRARY' | 'CAPTURE';
  extensions?: string[];
  maxFiles?: number;
  maxSizeMb?: number;
  params?: SdFormGenericParam[];
}

/** Nội dung HTML: tĩnh (`content` + `variables`) hoặc theo html definition của portal (`definition` + `query`). */
export interface SdFormGenericHtml extends Omit<SdFormGenericFieldBase<'html', never>, 'key' | 'defaultValue' | 'validation'> {
  key?: string;
  definition?: string;
  content?: string;
  variables?: Record<string, string>;
  query?: SdFormGenericParam[];
}

export type SdFormGenericField =
  | SdFormGenericTextfield
  | SdFormGenericTextarea
  | SdFormGenericNumber
  | SdFormGenericSelect
  | SdFormGenericRadio
  | SdFormGenericCheckbox
  | SdFormGenericDatetime
  | SdFormGenericChipString
  | SdFormGenericChipCalendar
  | SdFormGenericUpload
  | SdFormGenericHtml;

export type SdFormGenericFieldType = SdFormGenericField['type'];
