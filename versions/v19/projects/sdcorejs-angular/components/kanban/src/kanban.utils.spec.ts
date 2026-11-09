import type { SdKanbanCard, SdKanbanColumn } from './kanban.model';
import {
  kanbanApplyMove,
  kanbanDataInvalid,
  kanbanDropTarget,
  kanbanNextColumn,
  kanbanResolveMove,
  kanbanStepTarget,
} from './kanban.utils';

interface Dto {
  readonly owner: string;
}

const dto: Dto = Object.freeze({ owner: 'Lan' });
const card = (id: string, columnId: string, extra: Partial<SdKanbanCard<Dto>> = {}): SdKanbanCard<Dto> =>
  Object.freeze({ id, columnId, title: id.toUpperCase(), ...extra });
const columns: readonly SdKanbanColumn[] = Object.freeze([Object.freeze({ id: 'a', label: 'A' }), Object.freeze({ id: 'b', label: 'B' })]);
// Interleaved columns, frozen deep (SC-03).
const cards: readonly SdKanbanCard<Dto>[] = Object.freeze([
  card('x', 'a', { data: dto }),
  card('hidden', 'b'),
  card('y', 'a'),
  card('z', 'b'),
]);
const ids = (list: readonly SdKanbanCard<Dto>[], columnId?: string): string[] =>
  list.filter(item => columnId === undefined || item.columnId === columnId).map(item => item.id);

describe('sd-kanban utils', () => {
  describe('cards after an accepted move', () => {
    it('[KAN-U-01] reorder off: keeps the card at its place in the items array, with the new column', () => {
      const next = kanbanApplyMove(cards, 'x', { columnId: 'b', beforeId: null }, false);
      expect(ids(next)).toEqual(['x', 'hidden', 'y', 'z']);
      expect(next[0].columnId).toBe('b');
      expect(ids(next, 'b')).toEqual(['x', 'hidden', 'z']);
    });

    it('[KAN-U-02] reorder on: inserts before beforeId, or after the last card of the target column for null', () => {
      expect(ids(kanbanApplyMove(cards, 'x', { columnId: 'b', beforeId: 'z' }, true))).toEqual(['hidden', 'y', 'x', 'z']);
      expect(ids(kanbanApplyMove(cards, 'x', { columnId: 'b', beforeId: null }, true))).toEqual(['hidden', 'y', 'z', 'x']);
      const lone: readonly SdKanbanCard<Dto>[] = [card('x', 'a'), card('y', 'a')];
      expect(ids(kanbanApplyMove(lone, 'x', { columnId: 'b', beforeId: null }, true))).toEqual(['y', 'x']);
    });

    it('[KAN-SC-02] [KAN-SC-03] keeps the data reference and never changes the frozen input', () => {
      for (const reorder of [false, true]) {
        const next = kanbanApplyMove(cards, 'x', { columnId: 'b', beforeId: null }, reorder);
        const moved = next.find(item => item.id === 'x');
        expect(moved?.data).withContext(`reorder ${reorder}`).toBe(dto);
        expect(moved).not.toBe(cards[0]);
        expect(next).not.toBe(cards);
      }
      expect(cards[0].columnId).toBe('a');
      expect(kanbanApplyMove(cards, 'missing', { columnId: 'b', beforeId: null }, true))
        .withContext('unknown card')
        .toBe(cards);
      expect(ids(cards)).toEqual(['x', 'hidden', 'y', 'z']);
    });
  });

  describe('resolving a move', () => {
    it('[KAN-U-01] reorder off: index and beforeId are null; the same column is a no-op', () => {
      expect(kanbanResolveMove(cards, 'y', { columnId: 'b' }, false)).toEqual({ fromIndex: 1, index: null, beforeId: null });
      expect(kanbanResolveMove(cards, 'y', { columnId: 'a', beforeId: 'x' }, false)).toBeUndefined();
    });

    it('[KAN-U-02] reorder on: index of beforeId in the target column without the card; null is the end', () => {
      expect(kanbanResolveMove(cards, 'x', { columnId: 'b', beforeId: 'z' }, true)).toEqual({ fromIndex: 0, index: 1, beforeId: 'z' });
      expect(kanbanResolveMove(cards, 'x', { columnId: 'b', beforeId: null }, true)).toEqual({ fromIndex: 0, index: 2, beforeId: null });
      expect(kanbanResolveMove(cards, 'x', { columnId: 'b' }, true))
        .withContext('beforeId left out')
        .toEqual({
          fromIndex: 0,
          index: 2,
          beforeId: null,
        });
    });

    it('[KAN-U-03] moves up and down in one column; the same place is a no-op', () => {
      expect(kanbanResolveMove(cards, 'x', { columnId: 'a', beforeId: null }, true)).toEqual({ fromIndex: 0, index: 1, beforeId: null });
      expect(kanbanResolveMove(cards, 'y', { columnId: 'a', beforeId: 'x' }, true)).toEqual({ fromIndex: 1, index: 0, beforeId: 'x' });
      expect(kanbanResolveMove(cards, 'x', { columnId: 'a', beforeId: 'y' }, true))
        .withContext('before its own next card')
        .toBeUndefined();
      expect(kanbanResolveMove(cards, 'y', { columnId: 'a', beforeId: null }, true))
        .withContext('already last')
        .toBeUndefined();
      expect(kanbanStepTarget(cards, 'x', 1)).toBe(null);
      expect(kanbanStepTarget(cards, 'y', -1)).toBe('x');
      expect(kanbanStepTarget(cards, 'x', -1))
        .withContext('first card up')
        .toBeUndefined();
      expect(kanbanStepTarget(cards, 'y', 1))
        .withContext('last card down')
        .toBeUndefined();
      const three: readonly SdKanbanCard<Dto>[] = [card('p', 'a'), card('q', 'a'), card('r', 'a')];
      expect(kanbanStepTarget(three, 'p', 1)).toBe('r');
      expect(kanbanStepTarget(cards, 'missing', 1))
        .withContext('unknown card')
        .toBeUndefined();
    });

    it('[KAN-U-03] ignores an unknown card, an unknown beforeId or a beforeId of another column', () => {
      expect(kanbanResolveMove(cards, 'missing', { columnId: 'b' }, true)).toBeUndefined();
      expect(kanbanResolveMove(cards, 'x', { columnId: 'b', beforeId: 'missing' }, true)).toBeUndefined();
      expect(kanbanResolveMove(cards, 'x', { columnId: 'b', beforeId: 'y' }, true)).toBeUndefined();
    });

    it('[KAN-U-06] maps a slot of the filtered list to index and beforeId in the loaded cards', () => {
      const target = [card('hidden', 'b'), card('v', 'b'), card('late', 'b')];
      const visible = [target[1]];
      // Slot 0 of the visible list sits before "v", which is index 1 of the loaded column.
      expect(kanbanDropTarget(target, visible, 'x', 0)).toEqual({ index: 1, beforeId: 'v' });
      // After the last visible card: the end of the loaded cards, also with hidden cards after it.
      expect(kanbanDropTarget(target, visible, 'x', 1)).toEqual({ index: 3, beforeId: null });
      // The dragged card itself is left out of both lists, in its own column too.
      const own = [card('x', 'b'), ...target];
      expect(kanbanDropTarget(own, [own[0], own[2]], 'x', 0)).toEqual({ index: 1, beforeId: 'v' });
      // A column that is only partly loaded: the end of what is loaded.
      expect(kanbanDropTarget(target.slice(0, 2), target.slice(0, 2), 'x', 2)).toEqual({ index: 2, beforeId: null });
    });
  });

  describe('invalid data (§8)', () => {
    it('[KAN-U-04] fails on duplicate or empty ids, unknown columns, empty titles, duplicate column ids and empty labels', () => {
      expect(kanbanDataInvalid(cards, columns)).toBeFalse();
      expect(kanbanDataInvalid([...cards, card('x', 'b')], columns))
        .withContext('duplicate id')
        .toBeTrue();
      expect(kanbanDataInvalid([card('', 'a')], columns))
        .withContext('empty id')
        .toBeTrue();
      expect(kanbanDataInvalid([card('x', 'missing')], columns))
        .withContext('unknown column')
        .toBeTrue();
      expect(kanbanDataInvalid([card('x', 'a', { title: '  ' })], columns))
        .withContext('empty title')
        .toBeTrue();
      expect(kanbanDataInvalid(cards, [...columns, { id: 'a', label: 'Again' }]))
        .withContext('duplicate column')
        .toBeTrue();
      expect(kanbanDataInvalid([], [{ id: 'a', label: ' ' }]))
        .withContext('empty label')
        .toBeTrue();
      expect(kanbanDataInvalid([], [{ id: '', label: 'A' }]))
        .withContext('empty column id')
        .toBeTrue();
      const loose: SdKanbanCard<Dto>[] = JSON.parse('[{"id":"x","columnId":"a","title":"X","searchText":5}]');
      expect(kanbanDataInvalid(loose, columns)).withContext('searchText that is not a string').toBeTrue();
    });
  });

  describe('Alt + Left / Right', () => {
    const board: readonly SdKanbanColumn[] = [
      { id: 'a', label: 'A' },
      { id: 'off', label: 'Off', disabled: true },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ];
    const none = (): boolean => false;

    it('[KAN-U-05] goes to the next column that is not disabled, collapsed or refused; reversed in RTL', () => {
      expect(kanbanNextColumn(board, 'a', 'ArrowRight', false, none)?.id).toBe('b');
      expect(kanbanNextColumn(board, 'b', 'ArrowLeft', false, none)?.id).toBe('a');
      expect(kanbanNextColumn(board, 'a', 'ArrowRight', false, column => column.id === 'b')?.id)
        .withContext('skipped')
        .toBe('c');
      expect(kanbanNextColumn(board, 'b', 'ArrowLeft', true, none)?.id)
        .withContext('RTL')
        .toBe('c');
      expect(kanbanNextColumn(board, 'c', 'ArrowRight', false, none))
        .withContext('no column after the last')
        .toBeUndefined();
      expect(kanbanNextColumn(board, 'a', 'ArrowLeft', false, none)).toBeUndefined();
      expect(kanbanNextColumn(board, 'missing', 'ArrowRight', false, none)).toBeUndefined();
    });
  });
});
