import { Pipe, PipeTransform } from '@angular/core';
// import hash from 'object-hash';
import { SdTableOptionSelector } from '../models/table-option-selector.model';
import { SdTableItem } from '../models/table-item.model';
import { Utilities } from '@sdcorejs/utils/fns';
@Pipe({
  name: 'selectionDisabled',
})
export class SdSelectionDisabledPipe implements PipeTransform {
  transform = <T>(selectedItems: SdTableItem<T>[], rowData: SdTableItem<T>, selection: SdTableOptionSelector<T>): boolean => {
    const { disabled, actions } = selection;
    const selectedData = selectedItems.map(e => e.data);
    const setDisabled = (isDisabled: boolean): boolean => {
      rowData.meta.selector!.selectable = !isDisabled;
      return isDisabled;
    };
    if (rowData.meta.selector!.isSelected) {
      return setDisabled(false);
    }
    // Kiểm tra có bị disabled theo function không
    // Dữ liệu chưa được check thì kiểm tra hàm disable nếu có
    if (disabled?.(rowData.data, selectedData)) {
      return setDisabled(true);
    }
    if (!actions?.length) {
      return setDisabled(false);
    }
    // Lọc các action theo selectedItems hiện tại
    const availableActions = actions.filter(action => {
      if ('children' in action) {
        for (const childAction of action.children) {
          const key = Utilities.hash(childAction);
          if (selectedItems.every(e => e.meta.selector?.actions?.includes(key))) {
            return true;
          }
        }
        return false;
      } else {
        const key = Utilities.hash(action);
        return selectedItems.every(e => e.meta.selector?.actions?.includes(key));
      }
    });
    // Kiểm tra rowData có action nào thỏa hay ko, nếu ko thì disabled
    for (const action of availableActions) {
      if ('children' in action) {
        for (const childAction of action.children) {
          if (rowData.meta.selector?.actions?.includes(Utilities.hash(childAction))) {
            return setDisabled(false);
          }
        }
      } else {
        if (rowData.meta.selector?.actions?.includes(Utilities.hash(action))) {
          return setDisabled(false);
        }
      }
    }
    return setDisabled(true);
  };
}
