import { SdTableOptionTree, TableOptionTreeLazy } from '../../models/table-option-tree.model';
import { SdTableItem } from '../../models/table-item.model';

/**
 * Type-guard: tree có nạp children lười (lazy) hay không.
 * Dùng để narrow discriminated union `SdTableOptionTree` một cách an toàn —
 * thay vì truy cập `option.onExpandChildren` trực tiếp trên union (chỉ tồn tại
 * ở nhánh lazy).
 */
export const isLazyTree = <T = unknown>(option?: SdTableOptionTree<T>): option is TableOptionTreeLazy<T> => option?.loadType === 'lazy';

/**
 * Key chứa mảng children trên object row.
 * - `static`: lấy `childrenKey` đã cấu hình, mặc định `'children'`.
 * - `lazy`: không có `childrenKey` riêng → luôn dùng `'children'` làm nơi lưu
 *   kết quả nạp lười.
 */
export const getChildrenKey = (option?: SdTableOptionTree): string =>
  (option?.loadType === 'static' ? option.childrenKey : undefined) ?? 'children';

export const getChildrenFromData = <T>(data: T, option?: SdTableOptionTree): T[] => {
  const key = getChildrenKey(option);
  const raw = (data as Record<string, unknown>)?.[key];
  return Array.isArray(raw) ? (raw as T[]) : [];
};

/**
 * Trạng thái bung mặc định cho một cấp.
 * Chỉ `static` mới có `defaultExpanded`; lazy luôn trả `false` (không thể bung
 * mặc định nhánh chưa nạp).
 */
export const resolveDefaultExpanded = (level: number, option?: SdTableOptionTree): boolean => {
  const def = option?.loadType === 'static' ? (option.defaultExpanded ?? false) : false;
  if (def === true) return true;
  if (def === false) return false;
  if (typeof def === 'number') return level < def;
  return false;
};

/**
 * Row có khả năng có children hay không (để hiện nút bung).
 * - Có children embedded → true.
 * - Lazy tree: dùng `hasChildren(row.data)` nếu được cấu hình; không thì luôn
 *   true (chưa biết cho tới khi nạp).
 */
export const resolveHasChildren = <T>(row: SdTableItem<T>, option?: SdTableOptionTree<T>): boolean => {
  const embedded = getChildrenFromData(row.data, option);
  if (embedded.length > 0) return true;
  if (isLazyTree(option)) return option.hasChildren ? option.hasChildren(row.data) : true;
  return false;
};

/** Row cần nạp lười (lazy) khi bung: là lazy tree và chưa có children embedded. */
export const hasLazyChildren = <T>(row: SdTableItem<T>, option?: SdTableOptionTree): boolean => {
  if (!isLazyTree(option)) return false;
  return getChildrenFromData(row.data, option).length === 0;
};

/**
 * True nếu `data` HOẶC bất kỳ hậu duệ nào (theo `childrenKey`) thoả `predicate`.
 *
 * Dùng cho search ở cấp con (static tree, table `type: 'local'`): một nhánh
 * gốc được giữ lại trong kết quả lọc nếu subtree của nó có ít nhất một node
 * khớp từ khoá. `visited` chống đệ quy vô hạn khi data có circular reference.
 */
export const subtreeMatches = <T>(
  data: T,
  predicate: (data: T) => boolean,
  option?: SdTableOptionTree,
  visited: Set<unknown> = new Set()
): boolean => {
  if (data == null || visited.has(data)) return false;
  visited.add(data);
  if (predicate(data)) return true;
  for (const child of getChildrenFromData(data, option)) {
    if (subtreeMatches(child, predicate, option, visited)) return true;
  }
  return false;
};

/**
 * Lọc mảng children: chỉ giữ child có subtree khớp `predicate`.
 *
 * Trả về MẢNG MỚI nhưng GIỮ NGUYÊN object reference của từng child (không clone)
 * — nhờ vậy `meta.id` (hash từ data) ổn định, selection / trạng thái bung không
 * bị mất khi từ khoá search đổi. Đây là bước "prune" của tính năng search-con.
 */
export const filterMatchingChildren = <T>(children: T[], predicate: (data: T) => boolean, option?: SdTableOptionTree): T[] =>
  children.filter(child => subtreeMatches(child, predicate, option));

export const getVisibleChildrenData = <T>(data: T, option: SdTableOptionTree<T>, predicate?: (data: T) => boolean): T[] => {
  const children = getChildrenFromData(data, option);
  return predicate ? filterMatchingChildren(children, predicate, option) : children;
};

export const saveTreeExpandState = <T>(rows: SdTableItem<T>[], expandState: Map<string, boolean>): void => {
  for (const row of rows) {
    if (row.meta.tree?.isExpanded) {
      expandState.set(row.meta.id, true);
    }
    const children = row.meta.tree?.childItems;
    if (children?.length) {
      saveTreeExpandState(children, expandState);
    }
  }
};

export const clearTreeChildCache = <T>(rows: SdTableItem<T>[]): void => {
  for (const row of rows) {
    const children = row.meta.tree?.childItems;
    if (children?.length) {
      clearTreeChildCache(children);
      row.meta.tree!.childItems = undefined;
    }
  }
};

export const initTreeMeta = <T>(
  rows: SdTableItem<T>[],
  option: SdTableOptionTree<T>,
  args: {
    expandState?: Map<string, boolean>;
    treeSearchPredicate?: (data: T) => boolean;
    level?: number;
    parentId?: string;
  } = {}
): void => {
  const { expandState, treeSearchPredicate, level = 0, parentId } = args;
  const searchActive = !!treeSearchPredicate;
  for (const row of rows) {
    const saved = expandState?.get(row.meta.id);
    const hasChildren = searchActive
      ? getVisibleChildrenData(row.data, option, treeSearchPredicate).length > 0
      : resolveHasChildren(row, option);
    row.meta.tree = {
      ...row.meta.tree,
      level,
      parentId,
      hasChildren,
      isExpanded: searchActive ? hasChildren : (saved ?? resolveDefaultExpanded(level, option)),
      isExpanding: false,
    };
  }
};

export const flattenTree = <T>(roots: SdTableItem<T>[], option?: SdTableOptionTree, visited: Set<string> = new Set()): SdTableItem<T>[] => {
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
