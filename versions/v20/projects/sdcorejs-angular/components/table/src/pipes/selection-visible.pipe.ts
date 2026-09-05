import { Pipe, PipeTransform } from '@angular/core';
import { SdTableOptionSelector } from '../models/table-option-selector.model';
import { SdTableItem } from '../models/table-item.model';
import { prepareRowSelectionVisibility } from '../services/table-selection/selection-action.util';

@Pipe({ name: 'selectionVisible' })
export class SdSelectionVisiblePipe implements PipeTransform {
  transform(row: SdTableItem, selection: SdTableOptionSelector | undefined): boolean {
    return prepareRowSelectionVisibility(row, selection);
  }
}
