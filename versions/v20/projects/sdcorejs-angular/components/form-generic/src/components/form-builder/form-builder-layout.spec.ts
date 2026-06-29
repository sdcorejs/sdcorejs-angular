import { buildFormBuilderRows, canPlaceInRow, flattenFormBuilderRows, moveItemToRow } from './form-builder-layout';

function field(id: string, columns: number | string = '12'): any {
  return {
    id,
    key: `key_${id}`,
    type: 'textfield',
    label: id,
    layout: { columns },
    validate: {},
    properties: {},
  };
}

describe('form-builder-layout', () => {
  it('builds stable 12-column rows from schema order', () => {
    const a = field('a', 6);
    const b = field('b', 6);
    const c = field('c', 8);
    const d = field('d', 4);
    const e = field('e', 6);

    const rows = buildFormBuilderRows([a, b, c, d, e]);

    expect(rows.map((row: any) => row.id)).toEqual(['row-a', 'row-c', 'row-e']);
    expect(rows.map((row: any) => row.columns)).toEqual([12, 12, 6]);
    expect(rows.map((row: any) => row.items.map((item: any) => item.id))).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    expect(flattenFormBuilderRows(rows)).toEqual([a, b, c, d, e]);
  });

  it('moves an item into a row without changing object identity or losing sibling data', () => {
    const a = field('a', 4);
    const b = field('b', 4);
    const d = field('d', 6);
    const c = field('c', 4);
    const rows = buildFormBuilderRows([a, b, d, c]);

    const result = moveItemToRow(rows, { itemId: 'c', targetRowId: 'row-a', targetIndex: 1 });

    expect(result.moved).toBeTrue();
    expect(flattenFormBuilderRows(result.rows)).toEqual([a, c, b, d]);
    expect(flattenFormBuilderRows(rows)).toEqual([a, b, d, c]);
  });

  it('rejects a row move that would overflow the 12-column grid', () => {
    const a = field('a', 6);
    const b = field('b', 6);
    const c = field('c', 6);
    const rows = buildFormBuilderRows([a, b, c]);

    const result = moveItemToRow(rows, { itemId: 'c', targetRowId: 'row-a', targetIndex: 1 });

    expect(canPlaceInRow(rows[0], c)).toBeFalse();
    expect(result.moved).toBeFalse();
    expect(result.reason).toBe('row-overflow');
    expect(flattenFormBuilderRows(result.rows)).toEqual([a, b, c]);
  });
});
