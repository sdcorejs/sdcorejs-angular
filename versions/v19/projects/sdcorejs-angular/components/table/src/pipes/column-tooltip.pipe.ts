import { Pipe, PipeTransform } from '@angular/core';
import { SdTableColumn } from '../models/table-column.model';
@Pipe({
  name: 'columnTooltip',
})
export class SdColumnTooltipPipe implements PipeTransform {
  constructor() {}
  transform(value: any, rowData: any, column: SdTableColumn): string {
    if (column?.tooltip) {
      return column.tooltip(value, rowData);
    }
    return '';
  }
}
