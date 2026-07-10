import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';
import { SdDateAdapter } from '../core/date-adapter';

@Injectable()
export class SdNativeDateAdapter extends NativeDateAdapter implements SdDateAdapter<Date> {

  // Nếu displayFormat là string chứa token thời gian (h/H/m/s), dùng Intl để render đầy đủ ngày+giờ
  // Lý do: NativeDateAdapter.format() chỉ nhận Intl.DateTimeFormatOptions, không hiểu chuỗi pattern
  public override format(date: Date, displayFormat: unknown): string {
    if (typeof displayFormat === 'string' && /[hHms]/.test(displayFormat)) {
      const opts: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        ...(/s/.test(displayFormat) ? { second: '2-digit' } : {}),
        hour12: /a/i.test(displayFormat),
      };
      return new Intl.DateTimeFormat(this.locale, opts).format(date);
    }
    return super.format(date, displayFormat as Intl.DateTimeFormatOptions);
  }

  public getHour(date: Date): number { return date.getHours(); }
  public getMinute(date: Date): number { return date.getMinutes(); }
  public getSecond(date: Date): number { return date.getSeconds(); }

  public setHour(date: Date, hour: number): Date {
    const c = new Date(date);
    c.setHours(hour);
    return c;
  }

  public setMinute(date: Date, minute: number): Date {
    const c = new Date(date);
    c.setMinutes(minute);
    return c;
  }

  public setSecond(date: Date, second: number): Date {
    const c = new Date(date);
    c.setSeconds(second);
    return c;
  }

  public createDatetime(
    year: number, month: number, date: number,
    hour: number, minute: number, second: number,
  ): Date {
    if (month < 0 || month > 11) throw Error(`month ${month} out of range [0,11]`);
    if (hour < 0 || hour > 23) throw Error(`hour ${hour} out of range [0,23]`);
    if (minute < 0 || minute > 59) throw Error(`minute ${minute} out of range [0,59]`);
    if (second < 0 || second > 59) throw Error(`second ${second} out of range [0,59]`);
    return new Date(year, month, date, hour, minute, second);
  }
}
