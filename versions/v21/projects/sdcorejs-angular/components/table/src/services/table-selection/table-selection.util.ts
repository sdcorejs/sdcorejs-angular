import { SdTableItem } from '../../models/table-item.model';
import { SdTableOptionTree } from '../../models/table-option-tree.model';
import type { SdTableGroupDefContext } from '../../directives/sd-table-group-def.directive';
import { collectFormattedTreeRows, flattenTree } from '../tree/tree.util';

export const getSelectionRows = <T>(roots: SdTableItem<T>[], treeOpt?: SdTableOptionTree<T>): SdTableItem<T>[] =>
  treeOpt ? flattenTree(roots, treeOpt) : roots;

export const getSelectedRowData = <T>(rows: SdTableItem<T>[]): T[] =>
  rows.filter(row => row.meta.selector!.isSelected).map(row => row.data);

export const applyDefaultSelected = <T>(
  roots: SdTableItem<T>[],
  treeOpt: SdTableOptionTree<T> | undefined,
  defaultSelected?: (row: T) => boolean
): void => {
  if (!defaultSelected) return;
  const rows = treeOpt ? collectFormattedTreeRows(roots) : roots;
  rows.forEach(item => {
    item.meta.selector!.isSelected = defaultSelected(item.data);
  });
};

export const resolveSelectAllState = <T>(visibleRows: SdTableItem<T>[]): boolean => {
  const selectableRows = visibleRows.filter(row => row.meta.selector?.selectable);
  return selectableRows.length > 0 && selectableRows.every(row => row.meta.selector?.isSelected);
};

export const restorePreservedSelection = <T>(visibleRows: SdTableItem<T>[], preservedSelectedMap: Map<string, SdTableItem<T>>): void => {
  visibleRows.forEach(item => {
    if (preservedSelectedMap.has(item.meta.id)) {
      item.meta.selector!.isSelected = true;
      preservedSelectedMap.set(item.meta.id, item);
    }
  });
};

export const syncPreservedSelection = <T>(
  visibleRows: SdTableItem<T>[],
  preservedSelectedMap: Map<string, SdTableItem<T>>
): SdTableItem<T>[] => {
  visibleRows.forEach(item => {
    const id = item.meta.id;
    if (item.meta.selector!.isSelected) {
      preservedSelectedMap.set(id, item);
    } else {
      preservedSelectedMap.delete(id);
    }
  });
  return Array.from(preservedSelectedMap.values());
};

// ==========================================
// GROUP HEADER — selection state + template context
// ==========================================

/**
 * Cầu nối giữa `SdGroupPipe` (nơi group header được sinh ra) và `SdTable`.
 *
 * why: pipe dựng header nhưng KHÔNG biết method của component, còn component thì không
 * giữ mảng output của pipe. Host là một object DUY NHẤT, ổn định do component sở hữu:
 * pipe đổ header vào `headers` để component sync lại selection state sau này, và mượn
 * `toggleExpand`/`toggleSelect` để gắn vào template context.
 */
export interface SdGroupHeaderHost<T = any> {
  /** Sink các group header của lần transform gần nhất. Pipe clear + fill lại mỗi lần. */
  headers: SdTableItem<T>[];
  toggleExpand: (header: SdTableItem<T>) => void;
  toggleSelect: (header: SdTableItem<T>) => void;
}

/**
 * Tính lại `isSelected` / `indeterminate` của một group header và ĐỒNG BỘ sang context.
 *
 * why: template trước đây bind `[checked]="isGroupAllSelected(item)"` +
 * `[indeterminate]="isGroupIndeterminate(item)"` — mỗi binding duyệt toàn bộ children,
 * mỗi CD pass, cho mỗi group row (và `groupContext()` duyệt thêm lần nữa). Giờ tính MỘT
 * lần ở selection sync path rồi cache lên meta; template chỉ đọc property.
 * Một vòng duyệt duy nhất thay cho cặp `every` + `some`.
 */
export const syncGroupSelectionMeta = <T>(header: SdTableItem<T>): void => {
  const group = header.meta.group;
  if (!group?.isGroupHeader) return;
  let total = 0;
  let selected = 0;
  for (const child of group.items ?? []) {
    if (child.meta.selector?.selectable === false) continue;
    total++;
    if (child.meta.selector?.isSelected) selected++;
  }
  group.isSelected = total > 0 && selected === total;
  group.indeterminate = total > 0 && selected > 0 && selected < total;
  const context = group.context;
  if (context) {
    // Mutate TẠI CHỖ — giữ nguyên reference để ngTemplateOutlet không dựng lại view.
    context.isSelected = group.isSelected;
    context.indeterminate = group.indeterminate;
    context.isExpanded = group.isExpanded ?? true;
  }
};

/**
 * Dựng context truyền cho template `sdTableGroupDef`.
 * Chỉ gọi MỘT lần cho mỗi header (lúc pipe sinh header); sau đó reference được giữ
 * nguyên và giá trị bên trong cập nhật qua `syncGroupSelectionMeta`.
 */
export const buildGroupHeaderContext = <T>(header: SdTableItem<T>, host?: SdGroupHeaderHost<T>): SdTableGroupDefContext<T> => {
  const group = header.meta.group;
  const items = group?.items ?? [];
  return {
    items,
    data: group?.data ?? items.map(i => i.data),
    key: group?.key || '',
    values: group?.values || {},
    isExpanded: group?.isExpanded ?? true,
    isSelected: group?.isSelected ?? false,
    indeterminate: group?.indeterminate ?? false,
    toggleExpand: () => host?.toggleExpand(header),
    toggleSelect: () => host?.toggleSelect(header),
  };
};
