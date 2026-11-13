import { Pipe, PipeTransform } from '@angular/core';
// import hash from 'object-hash';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdTableAction, SdTableActionNormal } from '../../models/table-option-selector.model';
import { SdTableItem } from '../../models/table-item.model';
import { type ɵSdSelectionBarAction } from '@sdcorejs/angular/components/quick-action';
/**
 * Resolves the bulk actions a selection is allowed to run.
 *
 * why: tách khỏi pipe để component đọc được cùng KẾT QUẢ trong `computed()` — quick-action chỉ
 * được mở khi danh sách này KHÔNG rỗng, mà điều đó phải quyết định trong TS chứ không thể suy ra
 * từ một pipe chỉ chạy trong template.
 */
export function sdResolveTableActions(selectedItems: SdTableItem[] | undefined, actions: SdTableAction[] | undefined): Action[] {
  const results: SdTableAction[] = [];
  if (!actions?.length || !selectedItems?.length) {
    return [];
  }
  for (const action of actions) {
    if ('children' in action) {
      const children: SdTableActionNormal[] = [];
      for (const childAction of action.children) {
        const key = Utilities.hash(childAction);
        if (selectedItems.every(e => e?.meta?.selector?.actions?.includes(key))) {
          children.push(childAction);
        }
      }
      if (children.length > 0) {
        results.push({ ...action, children });
      }
    } else {
      const key = Utilities.hash(action);
      if (selectedItems.every(e => e?.meta?.selector?.actions?.includes(key))) {
        results.push(action);
      }
    }
  }
  return results.map(result => convertAction(result));
}

function convertAction(action: SdTableAction): Action {
  if ('children' in action) {
    return {
      variant: 'children',
      title: action.title,
      icon: action.icon,
      fontSet: action.fontSet,
      tooltip: action.tooltip,
      color: action.color,
      type: action.type,
      children: action.children.map(e => ({
        variant: 'normal',
        title: e.title,
        icon: e.icon,
        color: e.color ?? action.color,
        type: e.type ?? action.type,
        fontSet: e.fontSet,
        tooltip: e.tooltip,
        click: e.click,
      })),
    };
  }
  return {
    variant: 'normal',
    title: action.title,
    icon: action.icon,
    color: action.color,
    type: action.type,
    fontSet: action.fontSet,
    tooltip: action.tooltip,
    click: action.click,
  };
}

@Pipe({
  name: 'actionFilter',
})
export class ActionFilterPipe implements PipeTransform {
  transform = (selectedItems: SdTableItem[] | undefined, actions: SdTableAction[] | undefined): Action[] =>
    sdResolveTableActions(selectedItems, actions);
}

/** Lệnh đã lọc theo lựa chọn, đúng shape mà thanh chọn dùng chung nhận. */
export type Action<T = any> = ɵSdSelectionBarAction<T>;
