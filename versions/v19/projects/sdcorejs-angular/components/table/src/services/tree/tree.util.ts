import { SdTableOptionTree } from '../../models/table-option-tree.model';
import { SdTableItem } from '../../models/table-item.model';

export const getChildrenKey = (option?: SdTableOptionTree): string => option?.childrenKey ?? 'children';

export const getChildrenFromData = <T>(data: T, option?: SdTableOptionTree): T[] => {
  const key = getChildrenKey(option);
  const raw = (data as Record<string, unknown>)?.[key];
  return Array.isArray(raw) ? (raw as T[]) : [];
};

export const resolveDefaultExpanded = (level: number, option?: SdTableOptionTree): boolean => {
  const def = option?.defaultExpanded ?? false;
  if (def === true) return true;
  if (def === false) return false;
  if (typeof def === 'number') return level < def;
  return false;
};

export const resolveHasChildren = <T>(row: SdTableItem<T>, option?: SdTableOptionTree): boolean => {
  const embedded = getChildrenFromData(row.data, option);
  if (embedded.length > 0) return true;
  return !!option?.onExpandChildren;
};

export const hasLazyChildren = <T>(row: SdTableItem<T>, option?: SdTableOptionTree): boolean => {
  if (!option?.onExpandChildren) return false;
  return getChildrenFromData(row.data, option).length === 0;
};

export const flattenTree = <T>(
  roots: SdTableItem<T>[],
  option?: SdTableOptionTree,
  visited: Set<string> = new Set()
): SdTableItem<T>[] => {
  if (!option) return roots;
  const maxDepth = option.maxDepth;
  const result: SdTableItem<T>[] = [];

  const walk = (rows: SdTableItem<T>[], level: number, parentPath: number[]) => {
    rows.forEach((row, siblingIdx) => {
      if (visited.has(row.meta.id)) return;
      visited.add(row.meta.id);
      row.meta.tree ??= { level, hasChildren: false, isExpanded: false };
      row.meta.tree.level = level;
      // why: hierarchical numbering (1, 1.2, 1.2.1, ...) — STT template join('.').
      const indexPath = [...parentPath, siblingIdx + 1];
      row.meta.tree.indexPath = indexPath;
      result.push(row);

      const canDescend = row.meta.tree.isExpanded && row.meta.tree.hasChildren;
      const depthOk = maxDepth === undefined || level < maxDepth;
      if (!canDescend || !depthOk) return;

      const children = row.meta.tree.childItems ?? [];
      walk(children, level + 1, indexPath);
    });
  };

  walk(roots, 0, []);
  return result;
};

/** Thu thập mọi SdTableItem đã format trong cây (kể cả node đang collapse). */
export const collectFormattedTreeRows = <T>(roots: SdTableItem<T>[]): SdTableItem<T>[] => {
  const result: SdTableItem<T>[] = [];
  const walk = (rows: SdTableItem<T>[]) => {
    for (const row of rows) {
      result.push(row);
      const children = row.meta.tree?.childItems;
      if (children?.length) walk(children);
    }
  };
  walk(roots);
  return result;
};

/** Flatten ALL nodes regardless of expand state — used for export */
export const flattenTreeAll = <T>(
  roots: SdTableItem<T>[],
  option?: SdTableOptionTree,
  visited: Set<string> = new Set()
): SdTableItem<T>[] => {
  if (!option) return roots;
  const maxDepth = option.maxDepth;
  const result: SdTableItem<T>[] = [];

  const walk = (rows: SdTableItem<T>[], level: number) => {
    for (const row of rows) {
      if (visited.has(row.meta.id)) continue;
      visited.add(row.meta.id);
      result.push(row);
      const depthOk = maxDepth === undefined || level < maxDepth;
      if (!depthOk) continue;
      const children = row.meta.tree?.childItems ?? [];
      walk(children, level + 1);
    }
  };

  walk(roots, 0);
  return result;
};

/** Flatten raw data tree for export (ignores expand state) */
export const flattenDataTree = <T>(roots: T[], option?: SdTableOptionTree, visited: Set<unknown> = new Set()): T[] => {
  if (!option) return roots;
  const maxDepth = option.maxDepth;
  const result: T[] = [];

  const walk = (rows: T[], level: number) => {
    for (const row of rows) {
      if (visited.has(row as object)) continue;
      visited.add(row as object);
      result.push(row);
      const depthOk = maxDepth === undefined || level < maxDepth;
      if (!depthOk) continue;
      walk(getChildrenFromData(row, option), level + 1);
    }
  };

  walk(roots, 0);
  return result;
};
