import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { DateUtilities } from '@sdcorejs/utils/fns';

@Pipe({
  name: 'sdFormatDate',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class SdFormatDatePipe implements PipeTransform {
  transform(value: unknown, format = 'dd/MM/yyyy'): string | null {
    return DateUtilities.toFormat(value, format) || null;
  }
}
