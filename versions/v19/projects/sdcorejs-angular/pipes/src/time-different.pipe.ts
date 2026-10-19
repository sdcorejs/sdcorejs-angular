import { Pipe, PipeTransform } from '@angular/core';
import { ɵsdInjectDateTime } from '@sdcorejs/angular/services/date-time';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { interval, Observable, of } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
@Pipe({
  name: 'sdTimeDifferent',
  standalone: true,
})
export class SdTimeDifferentPipe implements PipeTransform {
  // why: `new …Pipe()` outside an injection context keeps the local behavior (no zone).
  readonly #dateTime = ɵsdInjectDateTime();

  private maxSecond = 60;
  private maxMinute = this.maxSecond * 60;
  private maxHour = this.maxMinute * 24;
  private maxDay = this.maxHour * 30;
  private maxMonth = this.maxHour * 365;
  transform(value: any, format: string, different: 'second' | 'minute' | 'hour' | 'day' | 'month'): Observable<string> {
    if (!DateUtilities.isDate(value)) {
      return of('');
    }
    if (!different) {
      return of(this.#format(value, format));
    }
    const elapsedSeconds = () => Math.round((new Date().getTime() - this.#instant(value)) / 1000);
    if (elapsedSeconds() < 0) {
      return of(this.#format(value, format));
    }
    const threshold = this.#threshold(different);
    // why: quá ngưỡng thì output là một chuỗi ngày tĩnh, tick mỗi giây không đổi được gì nữa.
    // Trả `of()` để không tạo timer nào cho các giá trị đã cũ (list N dòng = N timer thừa).
    if (elapsedSeconds() >= threshold) {
      return of(this.#format(value, format));
    }
    // why: `interval(1000)` cũ KHÔNG BAO GIỜ complete — mỗi usage giữ một timer + một lượt
    // change-detection của async pipe mỗi giây, vĩnh viễn, kể cả khi giá trị đã vượt ngưỡng
    // tương đối. `takeWhile(..., true)` phát nốt lần cuối (dạng ngày tuyệt đối) rồi complete.
    return interval(1000).pipe(
      map(() => elapsedSeconds()),
      takeWhile(elapsed => elapsed < threshold, true),
      map(elapsed => (elapsed < threshold ? this.#relative(value) : this.#format(value, format)))
    );
  }

  #format(value: unknown, format: string): string {
    return this.#dateTime ? this.#dateTime.toFormat(value, format) : DateUtilities.toFormat(value, format);
  }

  // why: local mode keeps the native parse it always used; a zone reads zone-less values as wall clock in the zone.
  #instant(value: any): number {
    return this.#zoned() ? (this.#dateTime!.parse(value)?.getTime() ?? NaN) : new Date(value).getTime();
  }

  #relative(value: any): string {
    return this.#zoned() ? DateUtilities.timeDifference(new Date(this.#instant(value))) : DateUtilities.timeDifference(value);
  }

  #zoned(): boolean {
    return !!this.#dateTime && this.#dateTime.timeZone !== 'local';
  }

  #threshold(different: 'second' | 'minute' | 'hour' | 'day' | 'month'): number {
    switch (different) {
      case 'month':
        return this.maxMonth;
      case 'day':
        return this.maxDay;
      case 'hour':
        return this.maxHour;
      case 'minute':
        return this.maxMinute;
      default:
        return this.maxSecond;
    }
  }
}
