import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { DateUtilities, SD_EMPTY_STR } from '@sdcorejs/angular/utilities';

@Pipe({
  name: 'viewDateTime',
  standalone: true,
})
@Injectable({
  providedIn: 'root',
})
export class ViewDateTimePipe implements PipeTransform {
  transform(value: any): string {
    if (!value || !DateUtilities.isDate(value)) {
      return SD_EMPTY_STR;
    }
    return DateUtilities.toFormat(value, 'HH:mm dd/MM/yyyy');
  }
}

