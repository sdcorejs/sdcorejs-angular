import { Injectable, Provider } from '@angular/core';
import { DateFnsAdapter, provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { DateAdapter, MatDateFormats } from '@angular/material/core';
import { isValid as isValidDate, parse as parseDate } from 'date-fns';

/**
 * DateAdapter từ chối mọi chuỗi người dùng chưa gõ xong.
 *
 * WHY cần đến mức này: `<input matInput [matDatepicker]>` khiến Material tự
 * `parse()` lại ô nhập SAU MỖI PHÍM GÕ rồi ghi thẳng kết quả vào form control.
 * Adapter mặc định quá dễ dãi trên hai đường:
 *
 * 1. `date-fns.parse` nhận năm thiếu chữ số → `11/12/2` thành năm 0002,
 *    `11/12/20` thành năm 0020. Ô nhập vừa gõ dở đã bị coi là hợp lệ (cờ lỗi
 *    bị xoá) và control ôm một ngày rác.
 * 2. `parseISO` coi chuỗi 2 chữ số là thế kỷ → xoá lùi còn `11` ra năm 1100.
 *
 * Cả hai đường đều bị chặn ở đây: control chỉ nhận giá trị khi người dùng thực
 * sự gõ xong.
 */
@Injectable()
export class SdStrictDateFnsAdapter extends DateFnsAdapter {
  override parse(value: unknown, parseFormat: string | string[]): Date | null {
    if (typeof value !== 'string') return super.parse(value, parseFormat);

    const trimmed = value.trim();
    if (!trimmed) return null;

    // Cố tình KHÔNG gọi super.parse: chỗ đó có ISO fallback (đường số 2 ở trên).
    for (const currentFormat of Array.isArray(parseFormat) ? parseFormat : [parseFormat]) {
      const parsed = parseDate(trimmed, currentFormat, new Date(), { locale: this.locale });
      if (!isValidDate(parsed)) continue;
      // Round-trip: chuỗi phải khớp 1-1 với format, nên năm thiếu chữ số bị loại.
      if (this.format(parsed, currentFormat) === trimmed) return parsed;
    }

    return null;
  }
}

/** `provideDateFnsAdapter` + ép dùng adapter parse chặt ở trên. */
export function provideSdStrictDateFnsAdapter(formats: MatDateFormats): Provider[] {
  return [
    provideDateFnsAdapter(formats),
    // Phải đứng SAU provideDateFnsAdapter để ghi đè DateAdapter mà nó đăng ký.
    { provide: DateAdapter, useClass: SdStrictDateFnsAdapter },
  ];
}
