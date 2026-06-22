import { SdTableItem } from '../../models/table-item.model';
import { SdTableOptionTree } from '../../models/table-option-tree.model';
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

export const resolveSelectAllState = <T>(visibleRows: SdTableItem<T>[]): boolean =>
  visibleRows.length > 0 && visibleRows.every(row => row.meta.selector?.isSelected);

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
