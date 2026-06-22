import { MapToSdTableItem } from '../../models/table-item.model';
import { SdTableOption } from '../../models/table-option.model';
import { SdTableFilterRequest } from '../table-filter/table-filter.model';
import { filterLocalItems, hasActiveColumnFilter, matchesColumnFilter } from './table-local.util';

interface TableLocalTestRow {
  id: number;
  user: {
    name: string;
  };
  amount: number;
  createdAt: string;
  statuses?: { id: string; name: string }[];
  children?: TableLocalTestRow[];
}

const columns: SdTableOption<TableLocalTestRow>['columns'] = [
  { field: 'user.name', title: 'Name', type: 'string' },
  { field: 'amount', title: 'Amount', type: 'number' },
  { field: 'createdAt', title: 'Created At', type: 'date' },
  {
    field: 'statuses',
    title: 'Statuses',
    type: 'values',
    option: {
      items: [],
      valueField: 'id',
      displayField: 'name',
      selection: 'MULTIPLE',
    },
  },
];

const request = (
  rawColumnFilter: Partial<SdTableFilterRequest<TableLocalTestRow>['rawColumnFilter']> = {},
  overrides: Partial<SdTableFilterRequest<TableLocalTestRow>> = {}
): SdTableFilterRequest<TableLocalTestRow> => ({
  columnOperator: {} as SdTableFilterRequest<TableLocalTestRow>['columnOperator'],
  rawColumnFilter: rawColumnFilter as SdTableFilterRequest<TableLocalTestRow>['rawColumnFilter'],
  rawExternalFilter: {},
  pageNumber: 0,
  pageSize: 20,
  ...overrides,
});

describe('table-local.util', () => {
  it('detects active column filters across scalar, range and array values', () => {
    expect(hasActiveColumnFilter({}, columns)).toBeFalse();
    expect(hasActiveColumnFilter({ 'user.name': '' }, columns)).toBeFalse();
    expect(hasActiveColumnFilter({ statuses: [] }, columns)).toBeFalse();
    expect(hasActiveColumnFilter({ createdAt: { from: undefined, to: undefined } }, columns)).toBeFalse();

    expect(hasActiveColumnFilter({ 'user.name': 'ali' }, columns)).toBeTrue();
    expect(hasActiveColumnFilter({ statuses: ['active'] }, columns)).toBeTrue();
    expect(hasActiveColumnFilter({ createdAt: { from: '2026-01-01' } }, columns)).toBeTrue();
  });

  it('matches nested fields, multiple values and date ranges', () => {
    const row: TableLocalTestRow = {
      id: 1,
      user: { name: 'Alice' },
      amount: 10,
      createdAt: '2026-01-05T10:00:00.000Z',
      statuses: [
        { id: 'active', name: 'Active' },
        { id: 'vip', name: 'VIP' },
      ],
    };

    expect(
      matchesColumnFilter(row, columns, {
        'user.name': 'ali',
        statuses: ['vip'],
        createdAt: { from: '2026-01-01', to: '2026-01-31' },
      })
    ).toBeTrue();
    expect(matchesColumnFilter(row, columns, { statuses: ['inactive'] })).toBeFalse();
    expect(matchesColumnFilter(row, columns, { createdAt: { from: '2026-02-01' } })).toBeFalse();
  });

  it('filters local table items, sorts by nested fields and returns the requested page', () => {
    const rows = [
      MapToSdTableItem<TableLocalTestRow>({ id: 1, user: { name: 'Alice' }, amount: 30, createdAt: '2026-01-01' }),
      MapToSdTableItem<TableLocalTestRow>({ id: 2, user: { name: 'Bob' }, amount: 10, createdAt: '2026-01-02' }),
      MapToSdTableItem<TableLocalTestRow>({ id: 3, user: { name: 'Alicia' }, amount: 20, createdAt: '2026-01-03' }),
    ];

    const result = filterLocalItems(
      rows,
      { type: 'local', columns },
      request(
        { 'user.name': 'ali' },
        {
          orderBy: 'amount',
          orderDirection: 'ASC',
          pageNumber: 1,
          pageSize: 1,
        }
      )
    );

    expect(result.total).toBe(2);
    expect(result.items).toEqual([rows[0]]);
  });

  it('keeps a static tree root when a descendant matches the column filter', () => {
    const child: TableLocalTestRow = { id: 2, user: { name: 'Needle Child' }, amount: 20, createdAt: '2026-01-02' };
    const root = MapToSdTableItem<TableLocalTestRow>({
      id: 1,
      user: { name: 'Parent' },
      amount: 10,
      createdAt: '2026-01-01',
      children: [child],
    });
    const other = MapToSdTableItem<TableLocalTestRow>({ id: 3, user: { name: 'Other' }, amount: 30, createdAt: '2026-01-03' });

    const result = filterLocalItems(
      [root, other],
      { type: 'local', columns, tree: { loadType: 'static', childrenKey: 'children' } },
      request({ 'user.name': 'needle' })
    );

    expect(result.items).toEqual([root]);
    expect(result.treeSearchPredicate?.(root.data)).toBeFalse();
    expect(result.treeSearchPredicate?.(child)).toBeTrue();
  });
});
