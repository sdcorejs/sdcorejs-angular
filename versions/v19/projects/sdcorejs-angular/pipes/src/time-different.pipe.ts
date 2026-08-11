import { Pipe, PipeTransform } from '@angular/core';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { interval, Observable, of } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
@Pipe({
  name: 'sdTimeDifferent',
  standalone: true,
})
export class SdTimeDifferentPipe implements PipeTransform {
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
      return of(DateUtilities.toFormat(value, format));
    }
    const elapsedSeconds = () => Math.round((new Date().getTime() - new Date(value).getTime()) / 1000);
    if (elapsedSeconds() < 0) {
      return of(DateUtilities.toFormat(value, format));
    }
    const threshold = this.#threshold(different);
    // why: quá ngưỡng thì output là một chuỗi ngày tĩnh, tick mỗi giây không đổi được gì nữa.
    // Trả `of()` để không tạo timer nào cho các giá trị đã cũ (list N dòng = N timer thừa).
    if (elapsedSeconds() >= threshold) {
      return of(DateUtilities.toFormat(value, format));
    }
    // why: `interval(1000)` cũ KHÔNG BAO GIỜ complete — mỗi usage giữ một timer + một lượt
    // change-detection của async pipe mỗi giây, vĩnh viễn, kể cả khi giá trị đã vượt ngưỡng
    // tương đối. `takeWhile(..., true)` phát nốt lần cuối (dạng ngày tuyệt đối) rồi complete.
    return interval(1000).pipe(
      map(() => elapsedSeconds()),
      takeWhile(elapsed => elapsed < threshold, true),
      map(elapsed => (elapsed < threshold ? DateUtilities.timeDifference(value) : DateUtilities.toFormat(value, format)))
    );
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
