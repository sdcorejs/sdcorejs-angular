import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { ɵsdInjectDateTime } from '@sdcorejs/angular/services/date-time';
import { DateUtilities } from '@sdcorejs/utils/fns';
import { EMPTY_STR } from '@sdcorejs/utils/constants';

@Pipe({
  name: 'viewDateTime',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class ViewDateTimePipe implements PipeTransform {
  // why: `new …Pipe()` outside an injection context keeps the local behavior (no zone).
  readonly #dateTime = ɵsdInjectDateTime();

  transform(value: any): string {
    if (!value || !DateUtilities.isDate(value)) {
      return EMPTY_STR;
    }
    return this.#dateTime ? this.#dateTime.toFormat(value, 'HH:mm dd/MM/yyyy') : DateUtilities.toFormat(value, 'HH:mm dd/MM/yyyy');
  }
}
