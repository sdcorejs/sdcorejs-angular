import { Pipe, PipeTransform } from '@angular/core';
// import hash from 'object-hash';
import { SdTableOptionSelector } from '../models/table-option-selector.model';
import { SdTableItem } from '../models/table-item.model';
import { Utilities } from '@sdcorejs/utils/fns';

@Pipe({
  name: 'selectionVisible',
})
export class SdSelectionVisiblePipe implements PipeTransform {
  transform = (rowData: SdTableItem, selection: SdTableOptionSelector | undefined): boolean => {
    const groupedActions: string[] = [];
    rowData.meta.selector!.actions = rowData.meta.selector!.actions || [];
    if (!selection?.actions?.length) {
      rowData.meta.selector!.selectable = true;
      return rowData.meta.selector!.selectable;
    }
    for (const action of selection.actions) {
      if ('children' in action) {
        let flag = false;
        let hasGroup = false;
        for (const child of action.children) {
          const { hidden, isGrouped } = child;
          const key = Utilities.hash(child);
          if (isGrouped) {
            hasGroup = true;
          }
          if (typeof hidden === 'function') {
            if (!hidden(rowData.data)) {
              flag = true;
              rowData.meta.selector!.actions.push(key);
              if (isGrouped) {
                groupedActions.push(key);
              }
            }
          } else if (!hidden) {
            flag = true;
            rowData.meta.selector!.actions.push(key);
            if (isGrouped) {
              groupedActions.push(key);
            }
          }
        }
        if (flag) {
          rowData.meta.selector!.actions.push(Utilities.hash(action));
          if (hasGroup) {
            groupedActions.push(Utilities.hash(action));
          }
        }
      } else {
        const { hidden, isGrouped } = action;
        const key = Utilities.hash(action);
        if (typeof hidden === 'function') {
          if (!hidden(rowData.data)) {
            rowData.meta.selector!.actions.push(key);
            if (isGrouped) {
              groupedActions.push(key);
            }
          }
        } else if (!hidden) {
          rowData.meta.selector!.actions.push(key);
          if (isGrouped) {
            groupedActions.push(key);
          }
        }
      }
    }
    rowData.meta.selector!.selectable = !!rowData.meta.selector!.actions?.length;
    if (!rowData.meta.selector!.selectable || !groupedActions.length || rowData?.meta.group?.items?.length) {
      return rowData.meta.selector!.selectable;
    }
    // Đối với trường hợp grouped, tuy selectable là true nhưng vẫn ẩn đi checkbox
    // nếu các action đều thuộc groupedActions và rowData ko phải là dòng group
    return rowData.meta.selector!.actions.some(action => !groupedActions.includes(action));
  };
}
