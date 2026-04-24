/* eslint-disable @typescript-eslint/no-explicit-any */
import { Pipe, PipeTransform } from '@angular/core';
import { SD_EMPTY_STR } from '@sdcorejs/angular/utilities/models';
@Pipe({
  name: 'sdEmpty',
  standalone: true,
})
export class SdEmptyPipe implements PipeTransform {
  transform(value: any): string {
    if (value === undefined || value === null || value === '') {
      return SD_EMPTY_STR;
    }
    return value;
  }
}

