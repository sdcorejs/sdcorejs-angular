import { SdKanbanColumn, SdKanbanOption } from './kanban.model';
import { kanbanDataInvalid, prepareKanbanMove } from './kanban.utils';

interface Card {
  key: string | number;
  lane: string;
  title: string;
}
const option: SdKanbanOption<Card> = {
  getId: item => item.key,
  getColumnId: item => item.lane,
  getTitle: item => item.title,
  withColumn: (item, id) => ({ ...item, lane: String(id) }),
};
const columns: SdKanbanColumn[] = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
];
const items: readonly Card[] = Object.freeze([
  Object.freeze({ key: 'x', lane: 'a', title: 'X' }),
  Object.freeze({ key: 'hidden', lane: 'b', title: 'Hidden' }),
  Object.freeze({ key: 'y', lane: 'a', title: 'Y' }),
  Object.freeze({ key: 'z', lane: 'b', title: 'Z' }),
]);
const move = (id: string | number, column: string, index: number, data = items) =>
  prepareKanbanMove(data, columns, option, id, column, index, 'api', new AbortController().signal);

describe('kanban move proposals', () => {
  it('maps arbitrary domain fields immutably and inserts before a full-data anchor', () => {
    const request = move('x', 'b', 1)!;
    expect(request.fromIndex).toBe(0);
    expect(request.toIndex).toBe(1);
    expect(request.nextItems.filter(item => item.lane === 'b').map(item => item.key)).toEqual(['hidden', 'x', 'z']);
    expect(items[0].lane).toBe('a');
    expect(request.nextItems.find(item => item.key === 'x')).not.toBe(items[0]);
  });
  it('reorders within a column without mapping or losing unrelated cards', () => {
    const request = move('x', 'a', 1)!;
    expect(request.nextItems.filter(item => item.lane === 'a').map(item => item.key)).toEqual(['y', 'x']);
    expect(request.nextItems.filter(item => item.lane === 'b')).toEqual(items.filter(item => item.lane === 'b'));
  });
  it('keeps numeric and string IDs distinct', () => {
    const data = [
      { key: 1, lane: 'a', title: 'Number' },
      { key: '1', lane: 'a', title: 'String' },
    ];
    expect(move(1, 'b', 0, data)!.item.title).toBe('Number');
  });
  it('reorders falsy generic items rather than treating them as missing', () => {
    const primitiveOption: SdKanbanOption<number> = {
      getId: item => item,
      getColumnId: () => 'a',
      getTitle: String,
      withColumn: item => item,
    };
    const request = prepareKanbanMove([0, 1], columns, primitiveOption, 1, 'a', 0, 'api', new AbortController().signal)!;
    expect(request.nextItems).toEqual([1, 0]);
  });
  it('fails closed on duplicate, unmapped or throwing domain mappings', () => {
    expect(kanbanDataInvalid([...items, items[0]], columns, option)).toBeTrue();
    expect(kanbanDataInvalid([{ key: 'x', lane: 'missing', title: 'X' }], columns, option)).toBeTrue();
    expect(
      kanbanDataInvalid(items, columns, {
        ...option,
        getTitle: () => {
          throw new Error('mapping');
        },
      })
    ).toBeTrue();
    expect(kanbanDataInvalid(items, columns, option)).toBeFalse();
  });
  it('ignores no-op, missing identity, disabled target and invalid insertion positions', () => {
    expect(move('x', 'a', 0)).toBeUndefined();
    expect(move('missing', 'a', 0)).toBeUndefined();
    expect(move('x', 'b', -1)).toBeUndefined();
    expect(move('x', 'b', 99)).toBeUndefined();
    expect(move('x', 'b', 0.5)).toBeUndefined();
    expect(
      prepareKanbanMove(items, [{ id: 'b', label: 'B', disabled: true }], option, 'x', 'b', 0, 'api', new AbortController().signal)
    ).toBeUndefined();
  });
});
