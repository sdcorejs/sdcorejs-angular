import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { DateUtilities } from '@sdcorejs/angular/utilities';
import { EMPTY_STR } from '@sdcorejs/utils/constants';

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
      return EMPTY_STR;
    }
    return DateUtilities.toFormat(value, 'HH:mm dd/MM/yyyy');
  }
}

