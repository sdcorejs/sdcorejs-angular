import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import { isValid as isValidDate, parse as parseDate } from 'date-fns';

export const DATE_DISPLAY_FORMAT = 'dd/MM/yyyy';
export const DATE_DISPLAY_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
export const DATE_INPUT_MAX_DIGITS = 8;

/** Chèn `/` vào chuỗi số người dùng đang gõ: `22081991` → `22/08/1991`. */
export function formatDateInput(value: string, addTrailingSeparator: boolean): string {
  const digits = value.replace(/\D/g, '').slice(0, DATE_INPUT_MAX_DIGITS);
  let formatted = digits.slice(0, 2);

  if (digits.length > 2) formatted += `/${digits.slice(2, 4)}`;
  if (digits.length > 4) formatted += `/${digits.slice(4)}`;
  if (addTrailingSeparator && (digits.length === 2 || digits.length === 4)) formatted += '/';

  return formatted;
}

/** Chuỗi còn dở dang (đang gõ) — chưa đủ `dd/MM/yyyy` nhưng vẫn đúng khuôn. */
export function isPartialDateInput(value: string): boolean {
  return /^(?:\d{0,2})(?:\/\d{0,2})?(?:\/\d{0,4})?$/.test(value);
}

/**
 * Chỉ nhận đúng `dd/MM/yyyy` ĐẦY ĐỦ và có thật trên lịch.
 *
 * WHY chặt tay như vậy: `date-fns.parse(value, 'dd/MM/yyyy')` rất dễ dãi — nó
 * nhận cả năm thiếu chữ số, nên `11/12/2` ra năm 0002 còn `11/12/20` ra năm
 * 0020. Nếu để lọt, người dùng mới gõ nửa chừng đã bị coi là nhập xong.
 */
export function parseDateInput(value: string): Date | null {
  if (!DATE_DISPLAY_PATTERN.test(value)) return null;

  const parsed = parseDate(value, DATE_DISPLAY_FORMAT, new Date());
  return isValidDate(parsed) && DateUtilities.toFormat(parsed, DATE_DISPLAY_FORMAT) === value ? parsed : null;
}

/** Giữ con trỏ đứng đúng chỗ sau khi chuỗi được chèn thêm `/`. */
export function getCaretPosition(value: string, selectionStart: number, formattedValue: string, addTrailingSeparator: boolean): number {
  const digitsBeforeCaret = value.slice(0, selectionStart).replace(/\D/g, '').length;
  let formattedIndex = 0;
  let digitCount = 0;

  while (formattedIndex < formattedValue.length && digitCount < digitsBeforeCaret) {
    if (/\d/.test(formattedValue[formattedIndex])) digitCount++;
    formattedIndex++;
  }

  if (addTrailingSeparator && digitCount === digitsBeforeCaret && formattedValue[formattedIndex] === '/') formattedIndex++;
  return formattedIndex;
}

export function dateControlsEqual(left: Date | null, right: Date | null): boolean {
  return (
    left === right || (!!left && !!right && DateUtilities.toFormat(left, 'yyyy/MM/dd') === DateUtilities.toFormat(right, 'yyyy/MM/dd'))
  );
}
