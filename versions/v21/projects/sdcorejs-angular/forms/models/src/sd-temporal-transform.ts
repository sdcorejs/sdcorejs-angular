/**
 * Output serialization strategy for the temporal form controls (`<sd-date>`, `<sd-datetime>`,
 * `<sd-date-range>`).
 *
 * This names how a committed value leaves the component — through `model` / `modelChange` /
 * `sdChange` and the registered `FormGroup` field. It does **not** touch what the field displays,
 * and it is **not** an Angular input-coercion `transform`.
 */
export type SdTemporalValueTransform = 'ISOString' | 'UTCString';

/**
 * why: một `Record` khoá bằng chính union — thêm literal mới vào `SdTemporalValueTransform` mà quên
 * serializer là lỗi compile ngay tại đây, không phải một `switch` thiếu nhánh chạy im lặng ở runtime.
 * Ba component chỉ gọi `sdSerializeTemporalValue`, nên không có bản sao logic nào rải rác.
 */
const SD_TEMPORAL_TRANSFORM_STRATEGIES: Record<SdTemporalValueTransform, (value: Date) => string> = {
  ISOString: value => value.toISOString(),
  UTCString: value => value.toUTCString(),
};

/** Every supported strategy, derived from the strategy map so the two can never drift. */
export const SD_TEMPORAL_VALUE_TRANSFORMS = Object.keys(SD_TEMPORAL_TRANSFORM_STRATEGIES) as readonly SdTemporalValueTransform[];

export function sdIsTemporalValueTransform(value: unknown): value is SdTemporalValueTransform {
  return typeof value === 'string' && value in SD_TEMPORAL_TRANSFORM_STRATEGIES;
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/**
 * Serializes a committed value with the active strategy.
 *
 * Returns `null` for anything that is not a usable `Date`, so an invalid value can never reach a
 * serializer and produce the string `"Invalid Date"`. Callers treat `null` as "keep the existing
 * representation".
 */
export function sdSerializeTemporalValue(
  value: Date | null | undefined,
  transform: SdTemporalValueTransform | null | undefined
): string | null {
  if (!transform || !isValidDate(value)) return null;
  return SD_TEMPORAL_TRANSFORM_STRATEGIES[transform](value);
}

/** Local midnight of the given day. Date-only controls serialize this instant, never the raw value. */
export function sdLocalStartOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

// why: ISO 8601 với phần giờ tuỳ chọn. Nhánh date-only được tách riêng bên dưới vì
// `new Date('2026-08-15')` được JS hiểu là NỬA ĐÊM UTC — ở múi giờ âm nó lùi về ngày hôm trước,
// tức là chỉ render thôi đã đổi mất ngày trên lịch của người dùng.
const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;
// RFC 1123, đúng shape mà `Date.prototype.toUTCString()` phát ra: `Sat, 15 Aug 2026 03:20:30 GMT`.
const RFC_1123_UTC = /^[A-Za-z]{3},\s\d{1,2}\s[A-Za-z]{3}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT$/;

/**
 * Parses the wire formats these transforms emit, so a component can read back its own output.
 *
 * Deliberately narrow: only ISO 8601 and the RFC-1123 shape `toUTCString()` produces are accepted.
 * Handing the whole job to `new Date(text)` would make every loosely date-shaped string parse
 * differently per browser, and would swallow the legacy canonical formats the components already
 * parse with their own strict parsers. Returns `null` when the text is not one of these.
 */
export function sdParseTransformedTemporal(value: unknown): Date | null {
  if (typeof value !== 'string') return null;

  const text = value.trim();
  if (!text) return null;

  const dateOnly = ISO_DATE_ONLY.exec(text);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
    return isValidDate(parsed) ? parsed : null;
  }

  if (!ISO_DATE_TIME.test(text) && !RFC_1123_UTC.test(text)) return null;

  const parsed = new Date(text);
  return isValidDate(parsed) ? parsed : null;
}
