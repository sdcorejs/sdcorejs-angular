import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { DateUtilities } from '@sdcorejs/angular/utilities/extensions';

@Pipe({
  name: 'sdFormatDatetime',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class SdFormatDatetimePipe implements PipeTransform {
  transform(value: unknown, format = 'dd/MM/yyyy HH:mm:ss'): string | null {
    return DateUtilities.toFormat(value, format) || null;
  }
}
