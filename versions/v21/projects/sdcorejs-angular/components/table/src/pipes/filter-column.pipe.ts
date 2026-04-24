import { Pipe, PipeTransform } from '@angular/core';
import { SdTableColumn } from '../models/table-column.model';
@Pipe({
  name: 'sdFilterColumn',
})
export class SdFilterColumnPipe implements PipeTransform {
  transform(columns: SdTableColumn[], field?: string): SdTableColumn[] {
    const results: SdTableColumn[] = [];
    if (!columns) {
      return results;
    }
    for (const column of columns) {
      if (column.type === 'children') {
        for (const columnChildren of column?.children) {
          if (!columnChildren.filter?.disabled) {
            results.push(columnChildren);
          }
        }
        continue;
      }
      if (!column.filter?.disabled) {
        results.push(column);
      }
    }
    return results.filter(e => !field || e.field === field);
  }
}
