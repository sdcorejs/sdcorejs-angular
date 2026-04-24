import { Pipe, PipeTransform } from '@angular/core';
import { SdTableExternalFilter } from '../services/table-filter/table-filter.model';
@Pipe({
  name: 'filterExternal',
})
export class SdFilterExternalPipe implements PipeTransform {
  transform(externalFilters: SdTableExternalFilter[]): SdTableExternalFilter[] {
    const results: SdTableExternalFilter[] = [];
    if (!externalFilters) {
      return results;
    }
    for (const filter of externalFilters) {
      results.push(filter);
    }
    return results;
  }
}
