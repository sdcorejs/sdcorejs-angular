import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { SdUploadExcelColumn } from '../import-excel.model';
@Pipe({
  name: 'columnHidden',
})
@Injectable()
export class ColumnHiddenPipe implements PipeTransform {
  constructor() {}
  transform(column: SdUploadExcelColumn): boolean {
    if (column.hidden === undefined) {
      return true;
    }
    if (typeof column.hidden === 'boolean') {
      return !column.hidden;
    }
    if (typeof column.hidden === 'function') {
      return !column.hidden();
    }
    return false;
  }
}
