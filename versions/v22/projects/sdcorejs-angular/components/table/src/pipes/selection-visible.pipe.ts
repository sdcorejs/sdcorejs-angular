import { Pipe, PipeTransform } from '@angular/core';
// import hash from 'object-hash';
import { SdTableOptionSelector } from '../models/table-option-selector.model';
import { SdTableItem } from '../models/table-item.model';
import { collectRowActionKeys } from '../services/table-selection/selection-action.util';

@Pipe({
  name: 'selectionVisible',
})
export class SdSelectionVisiblePipe implements PipeTransform {
  transform = (rowData: SdTableItem, selection: SdTableOptionSelector | undefined): boolean => {
    const selector = rowData.meta.selector!;
    const actions = (selector.actions ??= []);
    if (!selection?.actions?.length) {
      selector.selectable = true;
      return selector.selectable;
    }
    // why: pipe là pure nhưng lại GHI vào chính input (`meta.selector.actions`). Bản cũ
    // chỉ `actions = actions || []` rồi push, không bao giờ reset — mỗi lần re-eval cho
    // cùng một row (mỗi CD pass) lại nối thêm bản sao của các key vào MẢNG CŨ, tăng vô
    // hạn; `selectable` và `ActionFilterPipe`/select-all sau đó đọc mảng đã nhiễm.
    // Reset TẠI CHỖ (giữ nguyên reference, không cấp phát mảng mới mỗi pass) rồi mới
    // tính lại → transform trở nên idempotent.
    actions.length = 0;
    const groupedActions: string[] = [];
    collectRowActionKeys(rowData, selection, actions, groupedActions);

    selector.selectable = !!actions.length;
    if (!selector.selectable || !groupedActions.length || rowData?.meta.group?.items?.length) {
      return selector.selectable;
    }
    // Đối với trường hợp grouped, tuy selectable là true nhưng vẫn ẩn đi checkbox
    // nếu các action đều thuộc groupedActions và rowData ko phải là dòng group
    return actions.some(action => !groupedActions.includes(action));
  };
}
