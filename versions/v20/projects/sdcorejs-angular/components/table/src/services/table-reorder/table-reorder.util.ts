import { SdTableItem } from '../../models/table-item.model';

export interface TableReorderOption<T> {
  disabled?: (row: T, index: number) => boolean;
}

export interface CanSortReorderArgs<T> {
  enabled?: boolean;
  index: number;
  dragItem: SdTableItem<T>;
  allItems?: SdTableItem<T>[];
  hasGroup?: boolean;
}

export interface ReorderTableItemsArgs<T> {
  items: SdTableItem<T>[];
  renderedItems: SdTableItem<T>[];
  previousRenderedIndex: number;
  currentRenderedIndex: number;
  localItems?: SdTableItem<T>[];
}

export interface ReorderTableItemsResult<T> {
  items: SdTableItem<T>[];
  localItems?: SdTableItem<T>[];
  fromIndex: number;
  toIndex: number;
}

const isGroupHeader = <T>(item?: SdTableItem<T>): boolean => !!item?.meta?.group?.items?.length;
const isChildRow = <T>(item?: SdTableItem<T>): boolean => (item?.meta.tree?.level ?? 0) > 0;
const isRootReorderRow = <T>(item?: SdTableItem<T>): boolean => !!item && !isGroupHeader(item) && !isChildRow(item);

const moveItem = <T>(items: T[], fromIndex: number, toIndex: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return next;
  next.splice(toIndex, 0, moved);
  return next;
};

export const isReorderDisabled = <T>(item: SdTableItem<T>, option?: TableReorderOption<T>, index = -1): boolean => {
  if (isChildRow(item)) return true;
  if (!option?.disabled || isGroupHeader(item)) return false;
  return option.disabled(item.data, index);
};

export const sameReorderGroup = <T>(a: SdTableItem<T>, b: SdTableItem<T>, allItems: SdTableItem<T>[]): boolean => {
  const groupOf = (item: SdTableItem<T>): number => {
    let lastGroupIdx = -1;
    for (let i = 0; i < allItems.length; i++) {
      if (isGroupHeader(allItems[i])) lastGroupIdx = i;
      if (allItems[i] === item) return lastGroupIdx;
    }
    return -1;
  };
  return groupOf(a) === groupOf(b);
};

export const canSortReorder = <T>({ enabled, index, dragItem, allItems = [], hasGroup }: CanSortReorderArgs<T>): boolean => {
  if (!enabled) return false;
  const targetItem = allItems[index];
  if (!isRootReorderRow(targetItem)) return false;
  if (isChildRow(dragItem)) return false;
  if (hasGroup) {
    return sameReorderGroup(dragItem, targetItem, allItems);
  }
  return true;
};

export const toReorderItemsIndex = <T>(renderedItems: SdTableItem<T>[], renderedIndex: number): number => {
  let count = 0;
  for (let i = 0; i < renderedIndex; i++) {
    if (isRootReorderRow(renderedItems[i])) count++;
  }
  return count;
};

export const reorderTableItems = <T>({
  items,
  renderedItems,
  previousRenderedIndex,
  currentRenderedIndex,
  localItems,
}: ReorderTableItemsArgs<T>): ReorderTableItemsResult<T> => {
  const fromIndex = toReorderItemsIndex(renderedItems, previousRenderedIndex);
  const toIndex = toReorderItemsIndex(renderedItems, currentRenderedIndex);
  const nextItems = moveItem(items, fromIndex, toIndex);
  let nextLocalItems = localItems;

  if (localItems) {
    const localPositions = items.map(item => localItems.indexOf(item));
    if (localPositions.every(p => p >= 0)) {
      nextLocalItems = [...localItems];
      nextItems.forEach((item, i) => {
        nextLocalItems![localPositions[i]] = item;
      });
    }
  }

  return {
    items: nextItems,
    localItems: nextLocalItems,
    fromIndex,
    toIndex,
  };
};
