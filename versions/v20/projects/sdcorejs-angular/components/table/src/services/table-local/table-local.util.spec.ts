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

  it('filters and sorts by fields that are not valid @sdcorejs/utils paths (NSP-5745)', () => {
    type ImportRow = Record<string, string | number>;
    const importColumns: SdTableOption<ImportRow>['columns'] = [
      { field: 'Hướng ban công', title: 'Hướng ban công', type: 'string' },
      { field: 'Số tầng', title: 'Số tầng', type: 'number' },
    ];
    const rows = [
      MapToSdTableItem<ImportRow>({ id: 1, 'Hướng ban công': 'Tây', 'Số tầng': 30 }),
      MapToSdTableItem<ImportRow>({ id: 2, 'Hướng ban công': 'Đông', 'Số tầng': 10 }),
      MapToSdTableItem<ImportRow>({ id: 3, 'Hướng ban công': 'Tây Nam', 'Số tầng': 20 }),
    ];

    expect(matchesColumnFilter(rows[0].data, importColumns, { 'Hướng ban công': 'tây' })).toBeTrue();
    expect(matchesColumnFilter(rows[1].data, importColumns, { 'Hướng ban công': 'tây' })).toBeFalse();

    const result = filterLocalItems(rows, { type: 'local', columns: importColumns }, {
      columnOperator: {},
      rawColumnFilter: { 'Hướng ban công': 'tây' },
      rawExternalFilter: {},
      orderBy: 'Số tầng',
      orderDirection: 'ASC',
      pageNumber: 0,
      pageSize: 20,
    } as SdTableFilterRequest<ImportRow>);

    expect(result.items.map(item => item.data['id'])).toEqual([3, 1]);
  });

  describe('column operators (same meaning as SdConvertToPagingReq)', () => {
    it('NULL / NOT_NULL match a missing value and ignore the cell value; the filter is active without one', () => {
      const noteRows = [{ id: 1, note: null }, { id: 2, note: 'a' }, { id: 3 }, { id: 4, note: '' }];
      const noteColumns = [{ field: 'note', title: 'Note', type: 'string' }] as unknown as SdTableOption<TableLocalTestRow>['columns'];
      const ids = (operator: string) =>
        noteRows
          .filter(row => matchesColumnFilter(row as never, noteColumns, { note: 'ignored' }, { note: operator } as never))
          .map(row => row.id);
      expect(ids('NULL')).toEqual([1, 3]);
      expect(ids('NOT_NULL')).toEqual([2, 4]);
      expect(hasActiveColumnFilter({}, noteColumns, { note: 'NULL' } as never)).toBeTrue();
      expect(hasActiveColumnFilter({}, noteColumns, { note: 'CONTAIN' } as never)).toBeFalse();
    });

    type ColumnOperator = SdTableFilterRequest<TableLocalTestRow>['columnOperator'];
    const amountRows = [0, 3, 5, 8, 12].map(amount =>
      MapToSdTableItem<TableLocalTestRow>({ id: amount, user: { name: `User ${amount}` }, amount, createdAt: '2026-01-01' })
    );
    const amountsFor = (rawColumnFilter: Record<string, unknown>, columnOperator = {}, tableColumns = columns) =>
      filterLocalItems(
        amountRows,
        { type: 'local', columns: tableColumns },
        request(rawColumnFilter, { columnOperator: columnOperator as ColumnOperator })
      ).items.map(item => item.data.amount);

    it('applies the selected operator to a number column filter', () => {
      expect(amountsFor({ amount: 5 })).toEqual([5]);
      expect(amountsFor({ amount: 5 }, { amount: 'EQUAL' })).toEqual([5]);
      expect(amountsFor({ amount: 5 }, { amount: 'NOT_EQUAL' })).toEqual([0, 3, 8, 12]);
      expect(amountsFor({ amount: 5 }, { amount: 'GREATER_THAN' })).toEqual([8, 12]);
      expect(amountsFor({ amount: 5 }, { amount: 'GREATER_OR_EQUAL' })).toEqual([5, 8, 12]);
      expect(amountsFor({ amount: 5 }, { amount: 'LESS_THAN' })).toEqual([0, 3]);
      expect(amountsFor({ amount: 5 }, { amount: 'LESS_OR_EQUAL' })).toEqual([0, 3, 5]);
      expect(amountsFor({ amount: '5' }, { amount: 'GREATER_THAN' })).toEqual([8, 12]);
    });

    it('falls back to column.filter.operator.default when no operator was chosen', () => {
      const withDefault: SdTableOption<TableLocalTestRow>['columns'] = [
        { field: 'amount', title: 'Amount', type: 'number', filter: { operator: { enable: true, default: 'GREATER_THAN' } } },
      ];

      expect(amountsFor({ amount: 5 }, {}, withDefault)).toEqual([8, 12]);
      expect(amountsFor({ amount: 5 }, { amount: 'LESS_THAN' }, withDefault)).toEqual([0, 3]);
    });

    it('treats 0 as a value for both the filter and the row', () => {
      expect(amountsFor({ amount: 0 }, { amount: 'EQUAL' })).toEqual([0]);
      expect(amountsFor({ amount: 0 }, { amount: 'GREATER_THAN' })).toEqual([3, 5, 8, 12]);
      expect(amountsFor({ amount: -1 }, { amount: 'GREATER_OR_EQUAL' })).toEqual([0, 3, 5, 8, 12]);
      expect(amountsFor({ amount: 4 }, { amount: 'LESS_THAN' })).toEqual([0, 3]);
    });

    it('keeps the typed comparison prefix, which wins over the operator dropdown', () => {
      expect(amountsFor({ amount: '>=5' })).toEqual([5, 8, 12]);
      expect(amountsFor({ amount: '>5' })).toEqual([8, 12]);
      expect(amountsFor({ amount: '<=5' })).toEqual([0, 3, 5]);
      expect(amountsFor({ amount: '<5' })).toEqual([0, 3]);
      expect(amountsFor({ amount: '>= 5' }, { amount: 'EQUAL' })).toEqual([5, 8, 12]);
    });

    it('filters a split-number range with open ends', () => {
      expect(amountsFor({ amount: { from: 3, to: 8 } })).toEqual([3, 5, 8]);
      expect(amountsFor({ amount: { from: 0, to: null } })).toEqual([0, 3, 5, 8, 12]);
      expect(amountsFor({ amount: { from: null, to: 3 } })).toEqual([0, 3]);
      expect(amountsFor({ amount: { from: null, to: null } })).toEqual([0, 3, 5, 8, 12]);
      expect(hasActiveColumnFilter({ amount: { from: 0, to: null } }, columns)).toBeTrue();
    });

    it('ignores an empty or non-numeric number filter', () => {
      expect(amountsFor({ amount: '' })).toEqual([0, 3, 5, 8, 12]);
      expect(amountsFor({ amount: null })).toEqual([0, 3, 5, 8, 12]);
      expect(amountsFor({ amount: 'abc' })).toEqual([0, 3, 5, 8, 12]);
    });

    it('applies the selected operator to a string column filter', () => {
      const names = ['Alice', 'Alicia', 'Bob'].map((name, index) => ({ id: index, user: { name }, amount: 0, createdAt: '2026-01-01' }));
      const namesFor = (value: string, operator?: string) =>
        names
          .filter(row => matchesColumnFilter(row, columns, { 'user.name': value }, operator ? { 'user.name': operator as never } : {}))
          .map(row => row.user.name);

      expect(namesFor('ali')).toEqual(['Alice', 'Alicia']);
      expect(namesFor('ALI', 'CONTAIN')).toEqual(['Alice', 'Alicia']);
      expect(namesFor('ali', 'NOT_CONTAIN')).toEqual(['Bob']);
      expect(namesFor('alice', 'EQUAL')).toEqual(['Alice']);
      expect(namesFor('alice', 'NOT_EQUAL')).toEqual(['Alicia', 'Bob']);
      expect(namesFor('ali', 'START_WITH')).toEqual(['Alice', 'Alicia']);
      expect(namesFor('b', 'NOT_START_WITH')).toEqual(['Alice', 'Alicia']);
      expect(namesFor('ce', 'END_WITH')).toEqual(['Alice']);
      expect(namesFor('ia', 'NOT_END_WITH')).toEqual(['Alice', 'Bob']);
    });
  });
});
