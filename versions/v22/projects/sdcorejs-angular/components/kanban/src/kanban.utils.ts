import { SdKanbanColumn, SdKanbanId, SdKanbanMoveRequest, SdKanbanMoveSource, SdKanbanOption } from './kanban.model';

/** Internal pure proposal builder; performs no persistence or input mutation. */
export function prepareKanbanMove<T>(
  items: readonly T[],
  columns: readonly SdKanbanColumn[],
  option: SdKanbanOption<T>,
  itemId: SdKanbanId,
  toColumnId: SdKanbanId,
  toIndex: number,
  source: SdKanbanMoveSource,
  signal: AbortSignal
): SdKanbanMoveRequest<T> | undefined {
  const sourceIndex = items.findIndex(candidate => Object.is(option.getId(candidate), itemId));
  const target = columns.find(column => Object.is(column.id, toColumnId));
  if (sourceIndex < 0 || !target || target.disabled) return undefined;
  const item = items[sourceIndex];
  const fromColumnId = option.getColumnId(item);
  const origin = columns.find(column => Object.is(column.id, fromColumnId));
  if (!origin || origin.disabled) return undefined;
  const fromIndex = items.filter(candidate => Object.is(option.getColumnId(candidate), fromColumnId)).indexOf(item);
  const remaining = items.filter(candidate => !Object.is(option.getId(candidate), itemId));
  const targetItems = remaining.filter(candidate => Object.is(option.getColumnId(candidate), toColumnId));
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex > targetItems.length) return undefined;
  if (Object.is(fromColumnId, toColumnId) && fromIndex === toIndex) return undefined;
  const moved = Object.is(fromColumnId, toColumnId) ? item : option.withColumn(item, toColumnId);
  if (!Object.is(option.getId(moved), itemId) || !Object.is(option.getColumnId(moved), toColumnId)) {
    throw new Error('SdKanban withColumn must preserve the card ID and return the requested column ID.');
  }
  const insertion =
    toIndex < targetItems.length
      ? remaining.indexOf(targetItems[toIndex])
      : targetItems.length
        ? remaining.indexOf(targetItems[targetItems.length - 1]) + 1
        : remaining.length;
  const nextItems = [...remaining];
  nextItems.splice(insertion, 0, moved);
  return { item, itemId, fromColumnId, toColumnId, fromIndex, toIndex, previousItems: items, nextItems, source, signal };
}

/** Invalid data fails closed rather than silently hiding unmapped or duplicate cards. */
export function kanbanDataInvalid<T>(items: readonly T[], columns: readonly SdKanbanColumn[], option: SdKanbanOption<T>): boolean {
  const columnIds = new Set<SdKanbanId>();
  const itemIds = new Set<SdKanbanId>();
  const validId = (id: SdKanbanId) => typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id));
  try {
    for (const column of columns) {
      if (!validId(column.id) || columnIds.has(column.id) || typeof column.label !== 'string' || !column.label.trim()) return true;
      columnIds.add(column.id);
    }
    for (const item of items) {
      const id = option.getId(item);
      if (!validId(id) || itemIds.has(id) || !columnIds.has(option.getColumnId(item))) return true;
      itemIds.add(id);
      const title = option.getTitle(item);
      if (typeof title !== 'string' || !title.trim()) return true;
      if (option.getSearchText && typeof option.getSearchText(item) !== 'string') return true;
      option.filter?.(item);
    }
    return false;
  } catch {
    return true;
  }
}
