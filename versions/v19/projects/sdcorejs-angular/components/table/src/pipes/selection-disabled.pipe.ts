import { Pipe, PipeTransform } from '@angular/core';
import { SdTableOptionSelector } from '../models/table-option-selector.model';
import { SdTableItem } from '../models/table-item.model';
import { resolveRowSelectionDisabled } from '../services/table-selection/selection-action.util';

@Pipe({ name: 'selectionDisabled' })
export class SdSelectionDisabledPipe implements PipeTransform {
  transform<T>(selected: SdTableItem<T>[], row: SdTableItem<T>, selection: SdTableOptionSelector<T>): boolean {
    const disabled = resolveRowSelectionDisabled(selected, row, selection);
    row.meta.selector!.selectable = !disabled;
    return disabled;
  }
}
