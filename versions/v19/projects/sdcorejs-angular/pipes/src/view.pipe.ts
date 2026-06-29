import { Pipe, PipeTransform } from '@angular/core';
import { EMPTY_STR } from '@sdcorejs/utils/constants';

@Pipe({
  name: 'sdView',
  standalone: true,
})
export class SdViewPipe implements PipeTransform {
  transform(value: unknown): string {
    if (value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
      return EMPTY_STR;
    }

    if (Array.isArray(value)) {
      if (!value.length) return EMPTY_STR;
      return value.map(item => this.transform(item)).join(', ');
    }

    return `${value}`;
  }
}
