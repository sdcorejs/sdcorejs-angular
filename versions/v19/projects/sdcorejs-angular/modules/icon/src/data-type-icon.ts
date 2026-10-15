import {
  LucideAlignLeft,
  LucideBanknote,
  LucideBinary,
  LucideBraces,
  LucideCalculator,
  LucideCalendarDays,
  LucideCalendarRange,
  LucideCircleChevronDown,
  LucideClock,
  LucideHash,
  LucideLink,
  LucideListChecks,
  LucideLockKeyhole,
  LucideMail,
  LucideNetwork,
  LucidePercent,
  LucidePhone,
  LucideSquareCheck,
  LucideTag,
  LucideText,
  LucideUpload,
} from '@lucide/angular';

import type { SdLucideIconRegistration } from './icon.model';

/**
 * Khoá kiểu dữ liệu dùng chung cho icon: theo ngữ nghĩa dữ liệu, không theo widget của form.
 *
 * why: `modules/icon` là entry point lá mà generic, form-generic… cùng import, nên bộ khoá này không được
 * phụ thuộc model của bất kỳ component nào — mỗi nơi tự quy dữ liệu của mình về một khoá.
 */
export type SdDataTypeIconKey =
  | 'string'
  | 'string-list'
  | 'email'
  | 'phone'
  | 'url'
  | 'password'
  | 'text'
  | 'number'
  | 'integer'
  | 'decimal'
  | 'currency'
  | 'percent'
  | 'boolean'
  | 'date'
  | 'date-list'
  | 'datetime'
  | 'time'
  | 'enum'
  | 'enum-multiple'
  | 'relation'
  | 'json'
  | 'file';

/**
 * Tên icon Material của từng kiểu dữ liệu. `SdIcon` tự đổi sang Lucide qua `SD_DEFAULT_LUCIDE_ALIASES`.
 *
 * why: `number` dùng `numbers` chứ không dùng `tag` — `SD_DEFAULT_MATERIAL_ALIASES` đổi `tag` thành
 * `local_offer` (hình nhãn giá).
 */
export const SD_DATA_TYPE_ICON: Readonly<Record<SdDataTypeIconKey, string>> = Object.freeze({
  string: 'text_fields',
  'string-list': 'label',
  email: 'mail',
  phone: 'call',
  url: 'link',
  password: 'lock',
  text: 'notes',
  number: 'numbers',
  integer: 'pin',
  decimal: 'calculate',
  currency: 'payments',
  percent: 'percent',
  boolean: 'check_box',
  date: 'calendar_month',
  'date-list': 'event_note',
  datetime: 'schedule',
  time: 'access_time',
  enum: 'arrow_drop_down_circle',
  'enum-multiple': 'checklist',
  relation: 'hub',
  json: 'data_object',
  file: 'upload_file',
});

/** Khoá i18n tên kiểu dữ liệu (`core.data-type.<key>`); component dùng tự dịch. */
export const SD_DATA_TYPE_LABEL: Readonly<Record<SdDataTypeIconKey, string>> = Object.freeze(
  Object.fromEntries(Object.keys(SD_DATA_TYPE_ICON).map(key => [key, `core.data-type.${key}`])) as Record<SdDataTypeIconKey, string>
);

/**
 * Đăng ký Lucide cho mọi icon của bộ kiểu dữ liệu.
 *
 * why: `@lucide/angular` chỉ render icon đã đăng ký và `provideSdIcon` chỉ đăng ký danh sách của app. Danh sách
 * này là opt-in — app dùng Lucide truyền vào `provideSdIcon({ lucideIcons: [...SD_DATA_TYPE_LUCIDE_ICONS] })`, app
 * Material không phải tải thêm icon nào.
 */
export const SD_DATA_TYPE_LUCIDE_ICONS: readonly SdLucideIconRegistration[] = Object.freeze([
  LucideAlignLeft,
  LucideBanknote,
  LucideBinary,
  LucideBraces,
  LucideCalculator,
  LucideCalendarDays,
  LucideCalendarRange,
  LucideCircleChevronDown,
  LucideClock,
  LucideHash,
  LucideLink,
  LucideListChecks,
  LucideLockKeyhole,
  LucideMail,
  LucideNetwork,
  LucidePercent,
  LucidePhone,
  LucideSquareCheck,
  LucideTag,
  LucideText,
  LucideUpload,
]);

/** Icon Material của một kiểu dữ liệu; khoá rỗng hoặc lạ trả về `'tune'` (cùng fallback với query-bar/query-builder). */
export function sdDataTypeIcon(key: SdDataTypeIconKey | (string & {}) | null | undefined): string {
  return (key && SD_DATA_TYPE_ICON[key as SdDataTypeIconKey]) || 'tune';
}
