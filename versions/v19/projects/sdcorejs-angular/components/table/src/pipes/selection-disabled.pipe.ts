import { Pipe, PipeTransform } from '@angular/core';
// import hash from 'object-hash';
import { SdTableOptionSelector } from '../models/table-option-selector.model';
import { SdTableItem } from '../models/table-item.model';
import { SdUtilities } from '@sdcorejs/angular/utilities';
@Pipe({
  name: 'selectionDisabled',
})
export class SdSelectionDisabledPipe implements PipeTransform {
  transform = (selectedItems: SdTableItem[], rowData: SdTableItem, selection: SdTableOptionSelector): boolean => {
    const { disabled, actions } = selection;
    if (!actions?.length) {
      if (!disabled) {
        rowData.meta.selector!.selectable = true;
        return false;
      }
      rowData.meta.selector!.selectable = !disabled(rowData, selectedItems);
      return !rowData.meta.selector!.selectable;
    }
    // Kiá»ƒm tra cÃ³ bá»‹ disabled theo function khÃ´ng
    // Dá»¯ liá»‡u chÆ°a Ä‘Æ°á»£c check thÃ¬ kiá»ƒm tra hÃ m disable náº¿u cÃ³
    if (disabled && !rowData.meta.selector!.isSelected) {
      // Náº¿u disabled vÃ  dá»¯ liá»‡u chÆ°a Ä‘Æ°á»£c check
      if(disabled(rowData, selectedItems)) {
        return true;
      }
    }
    // Lá»c cÃ¡c action theo selectedItems hiá»‡n táº¡i
    const availableActions = actions.filter(action => {
      if ('children' in action) {
        for (const childAction of action.children) {
          const key = SdUtilities.hash(childAction);
          if (selectedItems.every(e => e.meta.selector?.actions?.includes(key))) {
            return true;
          }
        }
        return false;
      } else {
        const key = SdUtilities.hash(action);
        return selectedItems.every(e => e.meta.selector?.actions?.includes(key));
      }
    });
    // Kiá»ƒm tra rowData cÃ³ action nÃ o thá»a hay ko, náº¿u ko thÃ¬ disabled
    for (const action of availableActions) {
      if ('children' in action) {
        for (const childAction of action.children) {
          if (rowData.meta.selector?.actions?.includes(SdUtilities.hash(childAction))) {
            return false;
          }
        }
      } else {
        if (rowData.meta.selector?.actions?.includes(SdUtilities.hash(action))) {
          return false;
        }
      }
    }
    return true;
  };
}

