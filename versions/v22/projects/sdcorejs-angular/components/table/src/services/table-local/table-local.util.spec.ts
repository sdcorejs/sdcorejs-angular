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
  status?: string;
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
  {
    field: 'status',
    title: 'Status',
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

  it('matches a scalar row value against a MULTIPLE dropdown filter (IN semantics)', () => {
    const row: TableLocalTestRow = { id: 1, user: { name: 'Alice' }, amount: 10, createdAt: '2026-01-05', status: 'ACTIVE' };

    expect(matchesColumnFilter(row, columns, { status: ['ACTIVE'] })).toBeTrue();
    // regression: từ 2 giá trị trở lên, scalar row từng bị so với `['ACTIVE','PENDING'].toString()` nên rụng hết dòng
    expect(matchesColumnFilter(row, columns, { status: ['ACTIVE', 'PENDING'] })).toBeTrue();
    expect(matchesColumnFilter(row, columns, { status: ['PENDING', 'ACTIVE'] })).toBeTrue();
    expect(matchesColumnFilter(row, columns, { status: ['DRAFT', 'PENDING'] })).toBeFalse();
    expect(matchesColumnFilter(row, columns, { status: [] })).toBeTrue();
  });

  it('accepts a scalar filter value on a MULTIPLE column', () => {
    const row: TableLocalTestRow = {
      id: 1,
      user: { name: 'Alice' },
      amount: 10,
      createdAt: '2026-01-05',
      status: 'ACTIVE',
      statuses: [{ id: 'active', name: 'Active' }],
    };

    expect(matchesColumnFilter(row, columns, { status: 'ACTIVE' })).toBeTrue();
    expect(matchesColumnFilter(row, columns, { status: 'DRAFT' })).toBeFalse();
    // regression: `filter.default` dạng string trên cột MULTIPLE từng ném TypeError (`.map is not a function`)
    expect(matchesColumnFilter(row, columns, { statuses: 'active' })).toBeTrue();
    expect(matchesColumnFilter(row, columns, { statuses: 'vip' })).toBeFalse();
  });

  it('keeps OR semantics when both the row value and the filter are arrays', () => {
    const row: TableLocalTestRow = {
      id: 1,
      user: { name: 'Alice' },
      amount: 10,
      createdAt: '2026-01-05',
      statuses: [
        { id: 'active', name: 'Active' },
        { id: 'vip', name: 'VIP' },
      ],
    };

    expect(matchesColumnFilter(row, columns, { statuses: ['vip', 'archived'] })).toBeTrue();
    expect(matchesColumnFilter(row, columns, { statuses: ['archived', 'banned'] })).toBeFalse();
  });

  it('filters local items by a MULTIPLE dropdown column filter', () => {
    const rows = [
      MapToSdTableItem<TableLocalTestRow>({ id: 1, user: { name: 'Alice' }, amount: 10, createdAt: '2026-01-01', status: 'ACTIVE' }),
      MapToSdTableItem<TableLocalTestRow>({ id: 2, user: { name: 'Bob' }, amount: 20, createdAt: '2026-01-02', status: 'PENDING' }),
      MapToSdTableItem<TableLocalTestRow>({ id: 3, user: { name: 'Carol' }, amount: 30, createdAt: '2026-01-03', status: 'DRAFT' }),
    ];

    const result = filterLocalItems(rows, { type: 'local', columns }, request({ status: ['ACTIVE', 'PENDING'] }));

    expect(result.total).toBe(2);
    expect(result.items.map(item => item.data.id)).toEqual([1, 2]);
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
