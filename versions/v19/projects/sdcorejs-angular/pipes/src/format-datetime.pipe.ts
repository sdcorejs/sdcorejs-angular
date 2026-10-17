import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { ɵsdInjectDateTime } from '@sdcorejs/angular/services/date-time';
import { DateUtilities } from '@sdcorejs/utils/fns';

@Pipe({
  name: 'sdFormatDatetime',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class SdFormatDatetimePipe implements PipeTransform {
  // why: `new …Pipe()` outside an injection context keeps the local behavior (no zone).
  readonly #dateTime = ɵsdInjectDateTime();

  transform(value: unknown, format = 'dd/MM/yyyy HH:mm:ss'): string | null {
    return (this.#dateTime ? this.#dateTime.toFormat(value, format) : DateUtilities.toFormat(value, format)) || null;
  }
}
