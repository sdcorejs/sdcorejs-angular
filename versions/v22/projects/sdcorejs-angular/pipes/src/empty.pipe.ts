import { Pipe, PipeTransform } from '@angular/core';
import { EMPTY_STR } from '@sdcorejs/utils/constants';
@Pipe({
  name: 'sdEmpty',
  standalone: true,
})
export class SdEmptyPipe implements PipeTransform {
  transform(value: any): string {
    if (value === undefined || value === null || value === '') {
      return EMPTY_STR;
    }
    return value;
  }
}
