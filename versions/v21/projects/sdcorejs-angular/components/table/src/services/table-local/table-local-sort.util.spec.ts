import { SdTableColumn } from '../../models/table-column.model';
import { MapToSdTableItem } from '../../models/table-item.model';
import { SdTableFilterRequest } from '../table-filter/table-filter.model';
import { filterLocalItems } from './table-local.util';
import { compareLocalValues } from './table-local-sort.util';

interface SortRow {
  id: number;
  nested: { value: unknown };
}

type SortType = 'date' | 'datetime' | 'time' | 'number' | 'string';
const directions = ['ASC', 'DESC'] as const;
const temporalValues = [
  null,
  '2026-01-03T12:00:00Z',
  undefined,
  '2026-01-01T12:00:00Z',
  '',
  'not-a-date',
  '2026-01-02T12:00:00Z',
  '2026-01-01T12:00:00Z',
  new Date(NaN),
  0,
  new Date('2026-01-02T12:00:00Z'),
  null,
  '2026-01-04T12:00:00Z',
  '',
  undefined,
  'invalid',
];
const cases: { type: SortType; values: unknown[]; asc: number[]; desc: number[] }[] = [
  ...(['date', 'datetime', 'time'] as const).map(type => ({
    type,
    values: temporalValues,
    asc: [9, 3, 7, 6, 10, 1, 12, 0, 2, 4, 5, 8, 11, 13, 14, 15],
    desc: [12, 1, 6, 10, 3, 7, 9, 0, 2, 4, 5, 8, 11, 13, 14, 15],
  })),
  {
    type: 'number',
    values: [null, 2, undefined, 0, '', -2, 'bad', 0, NaN, '10', -Infinity, Infinity, 2, null, Infinity, -0],
    asc: [10, 5, 3, 7, 15, 1, 12, 9, 11, 14, 0, 2, 4, 6, 8, 13],
    desc: [11, 14, 9, 1, 12, 3, 7, 15, 5, 10, 0, 2, 4, 6, 8, 13],
  },
  {
    type: 'string',
    values: [null, 'b', undefined, 'a', '', 'invalid-date', 'a', 0, false, '2026-01-01', 'c', null, '', 'b', 'z', undefined],
    asc: [7, 9, 3, 6, 1, 13, 10, 8, 5, 14, 0, 2, 4, 11, 12, 15],
    desc: [14, 5, 8, 10, 1, 13, 3, 6, 9, 7, 0, 2, 4, 11, 12, 15],
  },
];

const sortRequest = (orderDirection: 'ASC' | 'DESC', pageNumber = 0, pageSize = 100): SdTableFilterRequest<SortRow> => ({
  columnOperator: {} as SdTableFilterRequest<SortRow>['columnOperator'],
  rawColumnFilter: {} as SdTableFilterRequest<SortRow>['rawColumnFilter'],
  rawExternalFilter: {},
  orderBy: 'nested.value',
  orderDirection,
  pageNumber,
  pageSize,
});

describe('table-local sorting', () => {
  for (const { type, values, asc, desc } of cases) {
    const columns: SdTableColumn<SortRow>[] = [{ field: 'nested.value', title: 'Value', type }];

    for (const direction of directions) {
      const expected = direction === 'ASC' ? asc : desc;

      it(`${type} ${direction}: comparator is finite, reflexive, antisymmetric and transitive`, () => {
        const compare = (a: unknown, b: unknown) => compareLocalValues(a, b, type, direction);
        for (const a of values) {
          expect(compare(a, a)).toBe(0);
          for (const b of values) {
            const ab = compare(a, b);
            expect(Number.isFinite(ab)).toBeTrue();
            expect(ab + compare(b, a)).toBe(0);
            for (const c of values) {
              if (ab <= 0 && compare(b, c) <= 0) expect(compare(a, c)).toBeLessThanOrEqual(0);
            }
          }
        }
      });

      it(`${type} ${direction}: orders mixed values with stable ties and empties last (>10 rows)`, () => {
        const rows = values.map((value, id) => ({ id, nested: { value } }));
        const original = [...rows];
        let input = rows;
        for (let attempt = 0; attempt < 3; attempt++) {
          const result = filterLocalItems(input, { type: 'local', columns }, sortRequest(direction));
          expect(result.items.map(row => row.id)).toEqual(expected);
          expect(result.total).toBe(values.length);
          input = result.items;
        }
        expect(rows).toEqual(original);
      });

      it(`${type} ${direction}: sorts wrapped rows before paging`, () => {
        const rows = values.map((value, id) => MapToSdTableItem<SortRow>({ id, nested: { value } }));
        const result = filterLocalItems(rows, { type: 'local', columns }, sortRequest(direction, 1, 5));
        expect(result.items.map(row => row.data.id)).toEqual(expected.slice(5, 10));
        expect(result.total).toBe(values.length);
      });
    }

    it(`${type}: keeps equal rows in input order across ASC/DESC toggles`, () => {
      let rows = values.map((value, id) => ({ id, nested: { value } }));
      for (const direction of ['ASC', 'DESC', 'ASC', 'DESC'] as const) {
        rows = filterLocalItems(rows, { type: 'local', columns }, sortRequest(direction)).items;
        expect(rows.map(row => row.id)).toEqual(direction === 'ASC' ? asc : desc);
      }
    });
  }
});
