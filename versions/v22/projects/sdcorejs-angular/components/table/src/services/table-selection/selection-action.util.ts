import { Utilities } from '@sdcorejs/utils/fns';
import { SdTableItem } from '../../models/table-item.model';
import { SdTableAction, SdTableOptionSelector } from '../../models/table-option-selector.model';

/** Một action hiển thị được với row này hay không (`hidden` có thể là cờ tĩnh hoặc predicate). */
const isActionVisible = <T>(hidden: SdTableAction<T>['hidden'], data: T): boolean =>
  typeof hidden === 'function' ? !hidden(data) : !hidden;

/**
 * Thu thập danh sách action key khả dụng cho MỘT row.
 *
 * why: ghi thẳng vào 2 mảng do caller cấp (in-place) thay vì `return` mảng mới —
 * hàm này chạy trong đường render (mỗi CD pass, mỗi row) nên không được cấp phát
 * mảng mới mỗi lần gọi. Caller reset độ dài mảng trước khi gọi.
 *
 * Key = `Utilities.hash(action)`, khớp với `ActionFilterPipe` để action bar lọc
 * đúng action chung của mọi item đang chọn.
 */
export const collectRowActionKeys = <T>(
  rowData: SdTableItem<T>,
  selection: SdTableOptionSelector | undefined,
  actions: string[],
  groupedActions: string[]
): void => {
  for (const action of selection?.actions ?? []) {
    if ('children' in action) {
      let flag = false;
      let hasGroup = false;
      for (const child of action.children) {
        const { hidden, isGrouped } = child;
        if (isGrouped) {
          hasGroup = true;
        }
        if (isActionVisible(hidden, rowData.data)) {
          flag = true;
          const key = Utilities.hash(child);
          actions.push(key);
          if (isGrouped) {
            groupedActions.push(key);
          }
        }
      }
      if (flag) {
        const key = Utilities.hash(action);
        actions.push(key);
        if (hasGroup) {
          groupedActions.push(key);
        }
      }
    } else {
      const { hidden, isGrouped } = action;
      if (isActionVisible(hidden, rowData.data)) {
        const key = Utilities.hash(action);
        actions.push(key);
        if (isGrouped) {
          groupedActions.push(key);
        }
      }
    }
  }
};

/**
 * Checkbox "chọn tất cả" ở header có hiển thị hay không.
 *
 * why: trước đây là pure pipe `async` với `await setTimeout(500)` bên trong. Sleep đó
 * che một vấn đề THỨ TỰ change-detection: pipe đọc `meta.selector.actions` — mảng do
 * `SdSelectionVisiblePipe` ghi ở cell BODY, mà CDK render header TRƯỚC body, nên ở pass
 * đầu mảng luôn rỗng. Hệ quả: checkbox hiện trễ 500ms và mỗi lần re-eval lại đẻ thêm
 * một timer không ai dọn. Ở đây tự tính key action từ `selection` nên không phụ thuộc
 * pipe nào chạy trước → quyết định được ngay trong pass hiện tại, không cần timer.
 */
export const resolveSelectAllVisible = <T>(items: SdTableItem<T>[], selection: SdTableOptionSelector | undefined): boolean => {
  // Nếu chỉ chọn 1 thì không có select all
  if (selection?.single) return false;
  if (!items.length) return false;
  if (!selection?.actions?.length) return true;
  if (selection.actions.some(e => ('children' in e && e.children.some(e1 => e1.isGrouped)) || e.isGrouped)) return false;

  const keysPerRow: string[][] = [];
  for (const item of items) {
    const actions: string[] = [];
    collectRowActionKeys(item, selection, actions, []);
    if (actions.length) keysPerRow.push(actions);
  }
  if (!keysPerRow.length) return false;
  // Có ít nhất 1 action chung cho MỌI row còn action → cho phép select all.
  return keysPerRow[0].some(action => keysPerRow.every(keys => keys.includes(action)));
};
