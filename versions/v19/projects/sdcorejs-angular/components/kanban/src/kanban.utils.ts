import type { SdKanbanCard, SdKanbanColumn } from './kanban.model';

/** Where a move goes: `index` and `beforeId` are `null` when `reorder` is off (kanban.md §3, §7.5). */
export interface KanbanPlacement {
  /** Index of the card in the loaded cards of its column. */
  readonly fromIndex: number;
  readonly index: number | null;
  readonly beforeId: string | null;
}

const inColumn = <T>(cards: readonly SdKanbanCard<T>[], columnId: string): SdKanbanCard<T>[] =>
  cards.filter(card => card.columnId === columnId);

/**
 * Resolves a move of `cardId` within the loaded `cards`, or `undefined` for an unknown card, an unknown `beforeId`,
 * a `beforeId` of another column, the same column with `reorder` off, or the same place with `reorder` on.
 */
export function kanbanResolveMove<T>(
  cards: readonly SdKanbanCard<T>[],
  cardId: string,
  to: { readonly columnId: string; readonly beforeId?: string | null },
  reorder: boolean
): KanbanPlacement | undefined {
  const card = cards.find(candidate => candidate.id === cardId);
  if (!card) return undefined;
  const fromIndex = inColumn(cards, card.columnId).indexOf(card);
  if (!reorder) return card.columnId === to.columnId ? undefined : { fromIndex, index: null, beforeId: null };
  const target = inColumn(cards, to.columnId).filter(candidate => candidate.id !== cardId);
  const beforeId = to.beforeId ?? null;
  const index = beforeId === null ? target.length : target.findIndex(candidate => candidate.id === beforeId);
  if (index < 0) return undefined;
  if (card.columnId === to.columnId && index === fromIndex) return undefined;
  return { fromIndex, index, beforeId };
}

/** `beforeId` for one step up (-1) or down (1) in the card's column; `undefined` at the edge. */
export function kanbanStepTarget<T>(cards: readonly SdKanbanCard<T>[], cardId: string, step: -1 | 1): string | null | undefined {
  const card = cards.find(candidate => candidate.id === cardId);
  if (!card) return undefined;
  const column = inColumn(cards, card.columnId);
  const index = column.indexOf(card);
  if (step < 0) return index > 0 ? column[index - 1].id : undefined;
  if (index >= column.length - 1) return undefined;
  return column[index + 2]?.id ?? null;
}

/**
 * The drop slot `visibleIndex` of the rendered (maybe filtered) cards of a column, as `index` and `beforeId` in its
 * loaded cards. The dragged card is left out of both lists.
 */
export function kanbanDropTarget<T>(
  loaded: readonly SdKanbanCard<T>[],
  visible: readonly SdKanbanCard<T>[],
  cardId: string,
  visibleIndex: number
): { readonly index: number; readonly beforeId: string | null } {
  const anchor = visible.filter(card => card.id !== cardId)[visibleIndex];
  const rest = loaded.filter(card => card.id !== cardId);
  return anchor ? { index: rest.indexOf(anchor), beforeId: anchor.id } : { index: rest.length, beforeId: null };
}

/**
 * The items after an accepted move (kanban.md §5.1): with `reorder` off the card keeps its place in the array; with
 * `reorder` on it goes before `beforeId`, or after the last card of the target column. Never changes the input.
 */
export function kanbanApplyMove<T>(
  cards: readonly SdKanbanCard<T>[],
  cardId: string,
  to: { readonly columnId: string; readonly beforeId: string | null },
  reorder: boolean
): readonly SdKanbanCard<T>[] {
  const card = cards.find(candidate => candidate.id === cardId);
  if (!card) return cards;
  const moved: SdKanbanCard<T> = { ...card, columnId: to.columnId };
  if (!reorder) return cards.map(candidate => (candidate === card ? moved : candidate));
  const rest = cards.filter(candidate => candidate !== card);
  let at = to.beforeId === null ? -1 : rest.findIndex(candidate => candidate.id === to.beforeId);
  if (at < 0) {
    let last = -1;
    for (let index = 0; index < rest.length; index++) if (rest[index].columnId === to.columnId) last = index;
    at = last < 0 ? rest.length : last + 1;
  }
  return [...rest.slice(0, at), moved, ...rest.slice(at)];
}

const blank = (value: unknown): boolean => typeof value !== 'string' || !value.trim();

/** Invalid board data fails closed (kanban.md §8): every card and column must be identifiable and named. */
export function kanbanDataInvalid<T>(cards: readonly SdKanbanCard<T>[], columns: readonly SdKanbanColumn[]): boolean {
  const columnIds = new Set<string>();
  for (const column of columns) {
    if (blank(column.id) || columnIds.has(column.id) || blank(column.label)) return true;
    columnIds.add(column.id);
  }
  const cardIds = new Set<string>();
  for (const card of cards) {
    if (blank(card.id) || cardIds.has(card.id) || !columnIds.has(card.columnId) || blank(card.title)) return true;
    if (card.searchText !== undefined && typeof card.searchText !== 'string') return true;
    cardIds.add(card.id);
  }
  return false;
}

/** The next column for Alt + Left / Right, skipping disabled columns and those `skip` refuses; reversed in RTL. */
export function kanbanNextColumn(
  columns: readonly SdKanbanColumn[],
  fromColumnId: string,
  key: 'ArrowLeft' | 'ArrowRight',
  rtl: boolean,
  skip: (column: SdKanbanColumn) => boolean
): SdKanbanColumn | undefined {
  const from = columns.findIndex(column => column.id === fromColumnId);
  if (from < 0) return undefined;
  const step = (key === 'ArrowLeft' ? -1 : 1) * (rtl ? -1 : 1);
  for (let index = from + step; index >= 0 && index < columns.length; index += step) {
    const column = columns[index];
    if (!column.disabled && !skip(column)) return column;
  }
  return undefined;
}
