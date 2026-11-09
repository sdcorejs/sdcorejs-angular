import type { SdKanbanCard, SdKanbanColumn } from './kanban.model';

// RED stubs of checkpoint 1: the signatures are final, the bodies come with the next commit.

/** Where a move goes: `index` and `beforeId` are `null` when `reorder` is off (kanban.md §3, §7.5). */
export interface KanbanPlacement {
  /** Index of the card in the loaded cards of its column. */
  readonly fromIndex: number;
  readonly index: number | null;
  readonly beforeId: string | null;
}

export function kanbanResolveMove<T>(
  _cards: readonly SdKanbanCard<T>[],
  _cardId: string,
  _to: { readonly columnId: string; readonly beforeId?: string | null },
  _reorder: boolean
): KanbanPlacement | undefined {
  return undefined;
}

export function kanbanStepTarget<T>(_cards: readonly SdKanbanCard<T>[], _cardId: string, _step: -1 | 1): string | null | undefined {
  return undefined;
}

export function kanbanDropTarget<T>(
  _loaded: readonly SdKanbanCard<T>[],
  _visible: readonly SdKanbanCard<T>[],
  _cardId: string,
  _visibleIndex: number
): { readonly index: number; readonly beforeId: string | null } {
  return { index: -1, beforeId: null };
}

export function kanbanApplyMove<T>(
  cards: readonly SdKanbanCard<T>[],
  _cardId: string,
  _to: { readonly columnId: string; readonly beforeId: string | null },
  _reorder: boolean
): readonly SdKanbanCard<T>[] {
  return cards;
}

export function kanbanDataInvalid<T>(_cards: readonly SdKanbanCard<T>[], _columns: readonly SdKanbanColumn[]): boolean {
  return false;
}

export function kanbanNextColumn(
  _columns: readonly SdKanbanColumn[],
  _fromColumnId: string,
  _key: 'ArrowLeft' | 'ArrowRight',
  _rtl: boolean,
  _skip: (column: SdKanbanColumn) => boolean
): SdKanbanColumn | undefined {
  return undefined;
}
