import {
  LucideAlignJustify,
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
 * Kiểu giữ nhiều giá trị luôn dùng hậu tố `-multiple`, khớp cờ `multiple` của property generic và form-generic.
 */
export type SdDataTypeIconKey =
  | 'string'
  | 'string-multiple'
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
  | 'date-multiple'
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
 * why: các hằng của file này đánh dấu `@__PURE__` — lời gọi `Object.freeze` ở top-level bị bundler coi là có side
 * effect, nên nếu không đánh dấu thì app nào import `modules/icon` cũng phải tải chúng (kèm các class Lucide).
 */
export const SD_DATA_TYPE_ICON: Readonly<Record<SdDataTypeIconKey, string>> = /* @__PURE__ */ Object.freeze({
  string: 'text_fields',
  'string-multiple': 'label',
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
  'date-multiple': 'event_note',
  datetime: 'schedule',
  time: 'access_time',
  enum: 'arrow_drop_down_circle',
  'enum-multiple': 'checklist',
  relation: 'hub',
  json: 'data_object',
  file: 'upload_file',
});

/** Khoá i18n tên kiểu dữ liệu (`core.data-type.<key>`), chưa dịch; component dùng tự dịch. */
export const SD_DATA_TYPE_LABEL_KEY: Readonly<Record<SdDataTypeIconKey, string>> = /* @__PURE__ */ dataTypeLabelKeys();

// why: dựng trong một hàm để một lời gọi `@__PURE__` bao trọn — đánh dấu thẳng `Object.freeze(...)` thì bundler vẫn
// giữ các lời gọi lồng bên trong (`Object.fromEntries`, `Object.keys`).
function dataTypeLabelKeys(): Readonly<Record<SdDataTypeIconKey, string>> {
  return Object.freeze(
    Object.fromEntries(Object.keys(SD_DATA_TYPE_ICON).map(key => [key, `core.data-type.${key}`])) as Record<SdDataTypeIconKey, string>
  );
}

/**
 * Đăng ký Lucide cho mọi icon của bộ kiểu dữ liệu.
 *
 * why: `@lucide/angular` chỉ render icon đã đăng ký và `provideSdIcon` chỉ đăng ký danh sách của app. Danh sách
 * này là opt-in — app dùng Lucide truyền vào `provideSdIcon({ lucideIcons: [...SD_DATA_TYPE_LUCIDE_ICONS] })`, app
 * Material không phải tải thêm icon nào.
 */
export const SD_DATA_TYPE_LUCIDE_ICONS: readonly SdLucideIconRegistration[] = /* @__PURE__ */ Object.freeze([
  LucideAlignJustify,
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
  // why: `Object.hasOwn` — tên kế thừa từ prototype (`constructor`, `toString`) không phải khoá.
  return key && Object.hasOwn(SD_DATA_TYPE_ICON, key) ? SD_DATA_TYPE_ICON[key as SdDataTypeIconKey] : 'tune';
}
