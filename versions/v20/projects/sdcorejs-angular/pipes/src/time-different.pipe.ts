/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pipe, PipeTransform } from '@angular/core';
import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';
import { interval, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
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
    if (Math.round((new Date().getTime() - new Date(value).getTime()) / 1000) < 0) {
      return of(DateUtilities.toFormat(value, format));
    }
    return interval(1000).pipe(
      map(() => {
        const timeDifferent = Math.round((new Date().getTime() - new Date(value).getTime()) / 1000);
        if (different === 'month' && timeDifferent < this.maxMonth) {
          return DateUtilities.timeDifference(value);
        }
        if (different === 'day' && timeDifferent < this.maxDay) {
          return DateUtilities.timeDifference(value);
        }
        if (different === 'hour' && timeDifferent < this.maxHour) {
          return DateUtilities.timeDifference(value);
        }
        if (different === 'minute' && timeDifferent < this.maxMinute) {
          return DateUtilities.timeDifference(value);
        }
        if (different === 'second' && timeDifferent < this.maxSecond) {
          return DateUtilities.timeDifference(value);
        }
        return DateUtilities.toFormat(value, format);
      })
    );
  }
}
