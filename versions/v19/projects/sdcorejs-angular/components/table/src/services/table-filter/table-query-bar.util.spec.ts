import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdQuery, SdQueryField } from '@sdcorejs/angular/components/query-bar';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { Filter } from '@sdcorejs/utils/models';
import { SdTableColumn, SdTableColumnAnyRow } from '../../models/table-column.model';
import { SdConvertToPagingReq, SdTableExternalFilter, SdTableOptionQuickSearch, TableFilterValue } from './table-filter.model';
import {
  SdTableQueryContext,
  mergeQueryDraft,
  queryToTableFilter,
  sdTableActiveQueryKeys,
  sdTableQueryFields,
  tableFilterToQuery,
} from './table-query-bar.util';

// Adapter of the sd-table query-bar mode (handoff table-query-bar, section 3–5 and 15 · 1–4). The bar
// is a view: the same edit must produce the same pagingReq as the default-mode controls.

const LABELS = { filters: 'Bộ lọc', columns: 'Cột' };

const quickSearch: SdTableOptionQuickSearch = {
  containFields: ['code', 'customer.name'],
  equalFields: ['phone'],
  filters: [
    {
      field: 'warehouseId',
      title: 'Kho xuất',
      type: 'values',
      required: true,
      option: { valueField: 'id', displayField: 'name', items: [{ id: 'hn', name: 'Hà Nội' }] },
    },
    {
      field: 'tags',
      title: 'Nhãn',
      type: 'values',
      option: { valueField: 'id', displayField: 'name', items: [], selection: 'MULTIPLE' },
    },
  ],
};

const externalFilters = [
  {
    field: 'status',
    title: 'Trạng thái',
    type: 'values',
    defaultShowing: true,
    option: { valueField: 'id', displayField: 'name', items: [], selection: 'MULTIPLE' },
  },
  { field: 'createdAt', title: 'Ngày tạo', type: 'daterange', default: { from: '2026/10/01', to: '2026/10/31' } },
  {
    field: 'channel',
    title: 'Kênh bán',
    type: 'lazy-values',
    option: { valueField: 'id', displayField: 'name', items: () => Promise.resolve([]) },
  },
  { field: 'note', title: 'Ghi chú', type: 'string' },
  { field: 'codes', title: 'Mã', type: 'string', defaultOperator: 'EQUAL' },
  { field: 'qty', title: 'Số lượng', type: 'number' },
  { field: 'paid', title: 'Đã trả', type: 'boolean', option: { displayOnTrue: 'Rồi', displayOnFalse: 'Chưa' } },
  { field: 'from', title: 'Từ ngày', type: 'date', defaultOperator: 'GREATER_OR_EQUAL', minDate: '2020/01/01' },
  { field: 'until', title: 'Đến lúc', type: 'datetime', defaultOperator: 'LESS_OR_EQUAL' },
  { field: 'kind', title: 'Loại', type: 'values', option: { valueField: 'id', displayField: 'name', items: [] } },
] as SdTableExternalFilter[];

const columns = [
  {
    field: 'code',
    title: 'Mã đơn',
    type: 'string',
    filter: { operator: { enable: true, default: 'CONTAIN', list: ['CONTAIN', 'EQUAL', 'BETWEEN', 'NULL'] } },
  },
  { field: 'customer.name', title: { title: 'Khách hàng' }, type: 'string' },
  {
    field: 'total',
    title: 'Tổng tiền',
    type: 'number',
    align: 'right',
    filter: { operator: { enable: true, default: 'EQUAL', list: ['EQUAL', 'GREATER_THAN'] } },
  },
  { field: 'weight', title: 'Cân nặng', type: 'number', filter: { type: 'split-number' } },
  { field: 'active', title: 'Hoạt động', type: 'boolean', option: { displayOnTrue: 'Bật' } },
  {
    field: 'payment',
    title: 'Thanh toán',
    type: 'values',
    option: { valueField: 'id', displayField: 'name', items: [], selection: 'MULTIPLE' },
    filter: { operator: { enable: true, list: ['EQUAL', 'NULL', 'NOT_NULL'] } },
  },
  {
    field: 'shipper',
    title: 'Giao hàng',
    type: 'values',
    option: { valueField: 'id', displayField: 'name', items: [] },
    filter: { operator: { enable: true, default: 'EQUAL', list: ['EQUAL', 'NOT_EQUAL', 'IN'] } },
  },
  { field: 'deliveredOn', title: 'Ngày giao', type: 'date', filter: { type: 'date' } },
  { field: 'updatedAt', title: 'Cập nhật', type: 'datetime' },
  { field: 'createdAt', title: 'Ngày tạo (cột)', type: 'date' },
  {
    field: 'group',
    title: 'Nhóm',
    type: 'children',
    children: [
      {
        field: 'owner',
        title: 'Người phụ trách',
        type: 'lazy-values',
        option: { valueField: 'id', displayField: 'name', items: () => Promise.resolve([]) },
      },
    ],
  },
] as SdTableColumnAnyRow[];

const fieldsOf = (overrides: Partial<Parameters<typeof sdTableQueryFields>[0]> = {}) =>
  sdTableQueryFields({
    columns,
    externalFilters,
    quickSearch,
    inlineExternal: { status: true },
    hideColumns: false,
    labels: LABELS,
    ...overrides,
  });

/** What `SdTableFilterService` stores before any edit (`#defaultValue`). */
const defaults = (): TableFilterValue => ({
  quickSearch: { term: '', filters: { warehouseId: undefined, tags: undefined } },
  externalFilter: {
    status: undefined,
    createdAt: { from: '2026/10/01', to: '2026/10/31' },
    channel: undefined,
    note: undefined,
    codes: undefined,
    qty: undefined,
    paid: undefined,
    from: undefined,
    until: undefined,
    kind: undefined,
  },
  columnFilter: {},
  columnOperator: { code: 'CONTAIN', total: 'EQUAL' },
});

const context = (): SdTableQueryContext => ({ ...fieldsOf(), defaultColumnOperator: { code: 'CONTAIN', total: 'EQUAL' } });

const paging = (value: TableFilterValue, dateTime?: SdDateTimeService) =>
  SdConvertToPagingReq(
    {
      quickSearch: value.quickSearch,
      columnOperator: value.columnOperator ?? {},
      rawColumnFilter: value.columnFilter ?? {},
      rawExternalFilter: value.externalFilter ?? {},
      pageNumber: 0,
      pageSize: 20,
    },
    { columns: columns as SdTableColumn[], externalFilters, quickSearch, dateTime }
  ).filters;

const zoned = (): SdDateTimeService => {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone: 'Asia/Ho_Chi_Minh' } }] });
  return TestBed.inject(SdDateTimeService);
};

const keysOf = (query: SdQuery): string[] => query.filters.map(filter => (filter as { field: string }).field);
const chip = (field: string, operator: Filter['operator'], data?: unknown): Filter => ({ field, operator, data }) as Filter;

describe('table-query-bar.util', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('sdTableQueryFields', () => {
    it('keys every field by source and orders quick filters, external filters, then leaf columns', () => {
      const keys = fieldsOf().fields.map(field => field.key);
      expect(keys).toEqual([
        'quick:warehouseId',
        'quick:tags',
        'external:status',
        'external:createdAt',
        'external:channel',
        'external:note',
        'external:codes',
        'external:qty',
        'external:paid',
        'external:from',
        'external:until',
        'external:kind',
        'column:code',
        'column:customer.name',
        'column:total',
        'column:weight',
        'column:active',
        'column:payment',
        'column:shipper',
        'column:deliveredOn',
        'column:updatedAt',
        'column:owner',
      ]);
    });

    it('maps every key back to its source', () => {
      const { sources } = fieldsOf();
      expect(sources.get('quick:tags')).toEqual(jasmine.objectContaining({ source: 'quick', field: 'tags' }));
      expect(sources.get('external:createdAt')?.external?.title).toBe('Ngày tạo');
      expect(sources.get('column:owner')?.column?.field).toBe('owner');
    });

    it('groups quick and external filters under "filters", columns under "columns"', () => {
      const { fields } = fieldsOf();
      const group = (key: string) => fields.find(field => field.key === key)?.group;
      expect(group('quick:warehouseId')).toBe('Bộ lọc');
      expect(group('external:note')).toBe('Bộ lọc');
      expect(group('column:code')).toBe('Cột');
    });

    it('pins visible quick filters, inline externals and required fields by default', () => {
      const pinned = fieldsOf({ inlineExternal: { status: true, note: false } })
        .fields.filter(field => field.pinned)
        .map(field => field.key);
      expect(pinned).toEqual(['quick:warehouseId', 'quick:tags', 'external:status']);
    });

    it('replaces the default pinned list with queryBar.pinned, keeping required fields pinned', () => {
      const pinned = fieldsOf({ queryBar: { pinned: ['note', 'total'] } })
        .fields.filter(field => field.pinned)
        .map(field => field.key);
      expect(pinned).toEqual(['quick:warehouseId', 'external:note', 'column:total']);
    });

    it('marks required quick and external filters required', () => {
      const required = fieldsOf({ externalFilters: [{ ...externalFilters[3], required: true }] })
        .fields.filter(field => field.required)
        .map(field => field.key);
      expect(required).toEqual(['quick:warehouseId', 'external:note']);
    });

    it('lets an external filter cover the column of the same field', () => {
      const result = fieldsOf();
      expect(result.sources.has('column:createdAt')).toBe(false);
      expect(result.covered).toEqual(['createdAt']);
      expect(result.columnKeys.get('createdAt')).toBe('external:createdAt');
      expect(result.columnKeys.get('code')).toBe('column:code');
    });

    it('keeps a quick filter and an external filter of the same field', () => {
      const result = fieldsOf({ externalFilters: [{ field: 'warehouseId', title: 'Kho', type: 'string' } as SdTableExternalFilter] });
      expect(result.sources.has('quick:warehouseId')).toBe(true);
      expect(result.sources.has('external:warehouseId')).toBe(true);
    });

    it('leaves columns out with hideColumns', () => {
      const result = fieldsOf({ hideColumns: true });
      expect(result.fields.some(field => field.group === 'Cột')).toBe(false);
      expect(result.covered).toEqual([]);
    });

    it('shows the search box whenever quick search is configured', () => {
      expect(fieldsOf().search).toBe(true);
      expect(fieldsOf({ quickSearch: { filters: quickSearch.filters } }).search).toBe(true);
      expect(fieldsOf({ quickSearch: undefined }).search).toBe(false);
    });

    it('excludes what the bar cannot edit, with a reason', () => {
      const result = sdTableQueryFields({
        columns: [
          { field: 'tpl', title: 'Tpl', type: 'string', filter: { filterDef: {} as never } },
          { field: 'at', title: 'At', type: 'time' },
          { field: 'secret', title: 'Secret', type: 'string', hidden: true },
          { field: 'locked', title: 'Locked', type: 'string', filter: { disabled: true } },
          { field: 'def', title: 'Def', type: 'string' },
          { field: 'skip', title: 'Skip', type: 'string' },
        ] as SdTableColumnAnyRow[],
        externalFilters: [
          { field: 'custom', title: 'Custom', type: 'custom' },
          { field: 'day', title: 'Day', type: 'date' },
        ] as SdTableExternalFilter[],
        quickSearch: { filters: [{ ...quickSearch.filters![1], hidden: true }] },
        inlineExternal: {},
        hideColumns: false,
        labels: LABELS,
        filterDefs: ['def'],
        queryBar: { exclude: ['skip'] },
      });
      expect(result.fields).toEqual([]);
      expect(result.excluded.map(entry => entry.field)).toEqual([
        'quick:tags',
        'external:custom',
        'external:day',
        'column:tpl',
        'column:at',
        'column:secret',
        'column:locked',
        'column:def',
        'column:skip',
      ]);
      expect(result.excluded.every(entry => !!entry.reason)).toBe(true);
    });

    it('maps operators the raw record can express', () => {
      const ops = (key: string) => fieldsOf().fields.find(field => field.key === key)?.operators;
      expect(ops('quick:warehouseId')).toEqual(['EQUAL']);
      expect(ops('quick:tags')).toEqual(['IN']);
      expect(ops('external:note')).toEqual(['CONTAIN']);
      expect(ops('external:codes')).toEqual(['EQUAL']);
      expect(ops('external:qty')).toEqual(['EQUAL']);
      expect(ops('external:paid')).toEqual(['EQUAL']);
      expect(ops('external:from')).toEqual(['GREATER_OR_EQUAL']);
      expect(ops('external:until')).toEqual(['LESS_OR_EQUAL']);
      expect(ops('external:createdAt')).toEqual(['BETWEEN']);
      expect(ops('external:status')).toEqual(['IN']);
      expect(ops('external:kind')).toEqual(['EQUAL']);
      expect(ops('column:code')).toEqual(['CONTAIN', 'EQUAL', 'NULL']);
      expect(ops('column:customer.name')).toEqual(['CONTAIN']);
      expect(ops('column:total')).toEqual(['EQUAL', 'GREATER_THAN']);
      expect(ops('column:weight')).toEqual(['BETWEEN']);
      expect(ops('column:active')).toEqual(['EQUAL']);
      expect(ops('column:payment')).toEqual(['IN', 'NULL', 'NOT_NULL']);
      expect(ops('column:shipper')).toEqual(['EQUAL', 'NOT_EQUAL']);
      expect(ops('column:deliveredOn')).toEqual(['EQUAL']);
      expect(ops('column:updatedAt')).toEqual(['BETWEEN']);
    });

    it('maps types, labels and options', () => {
      const field = (key: string) => fieldsOf().fields.find(item => item.key === key) as SdQueryField & Record<string, any>;
      expect(field('external:createdAt').type).toBe('date');
      expect(field('column:updatedAt').type).toBe('date');
      expect(field('external:until').type).toBe('datetime');
      expect(field('external:from').min).toBe('2020/01/01');
      expect(field('external:paid').trueLabel).toBe('Rồi');
      expect(field('column:active').trueLabel).toBe('Bật');
      expect(field('column:customer.name').label).toBe('Khách hàng');
      expect(field('external:channel').type).toBe('lazy-values');
      expect(typeof field('external:channel').option.search).toBe('function');
      expect(field('column:owner').option.search).toBe((columns[10] as any).children[0].option.items);
    });

    it('feeds a column values field from the loaded cache when its items are a function', () => {
      const loader = () => Promise.resolve([]);
      const result = sdTableQueryFields({
        columns: [
          { field: 'st', title: 'St', type: 'values', option: { valueField: 'id', displayField: 'name', items: loader } },
        ] as SdTableColumnAnyRow[],
        inlineExternal: {},
        hideColumns: false,
        labels: LABELS,
        cacheValues: { st: [{ id: 1, name: 'One' }] },
      });
      expect((result.fields[0] as any).option.items).toEqual([{ id: 1, name: 'One' }]);
    });
  });

  describe('tableFilterToQuery', () => {
    it('shows every pinned field plus the unpinned ones that hold a value', () => {
      const value = defaults();
      value.columnFilter = { total: 5, payment: [] };
      value.columnOperator = { ...value.columnOperator, code: 'NULL' };
      const query = tableFilterToQuery(value, context());
      expect(keysOf(query)).toEqual([
        'quick:warehouseId',
        'quick:tags',
        'external:status',
        'external:createdAt',
        'column:code',
        'column:total',
      ]);
      expect(query.filters[4]).toEqual(chip('column:code', 'NULL', null));
      expect(query.filters[5]).toEqual(chip('column:total', 'EQUAL', 5));
      expect(query.search).toBe('');
    });

    it('converts raw shapes into chip data', () => {
      const value = defaults();
      value.quickSearch = { term: 'KH-1', filters: { warehouseId: 'hn', tags: ['a'] } };
      value.columnFilter = { active: '0', weight: { from: 0, to: null }, payment: 'p1', updatedAt: { from: null, to: null } };
      const query = tableFilterToQuery(value, context());
      const byKey = new Map(query.filters.map(filter => [(filter as any).field, filter]));
      expect(query.search).toBe('KH-1');
      expect(byKey.get('quick:warehouseId')).toEqual(chip('quick:warehouseId', 'EQUAL', 'hn'));
      expect(byKey.get('quick:tags')).toEqual(chip('quick:tags', 'IN', ['a']));
      expect(byKey.get('external:status')).toEqual(chip('external:status', 'IN', []));
      expect(byKey.get('external:createdAt')).toEqual(chip('external:createdAt', 'BETWEEN', { from: '2026/10/01', to: '2026/10/31' }));
      expect(byKey.get('column:active')).toEqual(chip('column:active', 'EQUAL', false));
      expect(byKey.get('column:weight')).toEqual(chip('column:weight', 'BETWEEN', { from: 0, to: null }));
      expect(byKey.get('column:payment')).toEqual(chip('column:payment', 'IN', ['p1']));
      expect(byKey.has('column:updatedAt')).toBe(false);
    });

    it('returns the previous object for an unchanged chip', () => {
      const value = defaults();
      value.columnFilter = { total: 5 };
      const first = tableFilterToQuery(value, context());
      const second = tableFilterToQuery({ ...value, columnFilter: { total: 5, code: 'x' } }, context(), first.filters);
      for (const filter of first.filters) expect(second.filters).toContain(filter);
      const code = second.filters.find(filter => (filter as any).field === 'column:code');
      expect(first.filters).not.toContain(code!);
    });

    it('returns the previous object for a one-ended range the popover committed without the other end', () => {
      const value = defaults();
      value.columnFilter = { weight: { from: 3, to: null } };
      // The popover commits only the end that was typed: `{ from: 3 }`.
      const previous = [chip('column:weight', 'BETWEEN', { from: 3 })];
      const query = tableFilterToQuery(value, context(), previous);
      expect(query.filters).toContain(previous[0]);
    });

    it('keeps the order of unpinned chips from the previous list and appends new ones in declaration order', () => {
      const value = defaults();
      value.columnFilter = { total: 5, code: 'x', active: '1' };
      const previous = [chip('column:active', 'EQUAL', true), chip('column:total', 'EQUAL', 5)];
      const query = tableFilterToQuery(value, context(), previous);
      // Pinned first, then the previous order, then new chips (createdAt has a default value) in declaration order.
      expect(keysOf(query).slice(3)).toEqual(['column:active', 'column:total', 'external:createdAt', 'column:code']);
    });
  });

  describe('queryToTableFilter', () => {
    const apply = (filters: Filter[], current = defaults(), search?: string) => {
      const base = tableFilterToQuery(current, context());
      const keys = new Set(filters.map(filter => (filter as any).field));
      return queryToTableFilter(
        {
          ...base,
          search: search ?? base.search,
          filters: [...base.filters.filter(filter => !keys.has((filter as any).field)), ...filters],
        },
        context(),
        current
      );
    };

    it('round-trips the raw record without changes', () => {
      const value = defaults();
      value.quickSearch = { term: 'KH', filters: { warehouseId: 'hn', tags: ['a', 'b'] } };
      value.externalFilter = { ...value.externalFilter, status: ['new'], note: 'abc', paid: false, from: '2026/10/01' };
      value.columnFilter = { code: 'x', total: 5, weight: { from: 1, to: 2 }, active: '1', payment: ['p'], deliveredOn: '2026/10/05' };
      value.columnOperator = { code: 'EQUAL', total: 'GREATER_THAN' };
      const { patch, changed } = queryToTableFilter(tableFilterToQuery(value, context()), context(), value);
      expect(changed).toEqual([]);
      expect(patch.quickSearch).toEqual(value.quickSearch);
      expect(patch.externalFilter).toEqual(value.externalFilter);
      expect(patch.columnOperator).toEqual(value.columnOperator);
      expect(patch.columnFilter).toEqual({ ...value.columnFilter, createdAt: null });
    });

    it('always clears a covered column', () => {
      const value = defaults();
      value.columnFilter = { createdAt: { from: '2026/01/01', to: null } };
      expect(queryToTableFilter(tableFilterToQuery(value, context()), context(), value).patch.columnFilter!['createdAt']).toBeNull();
    });

    it('also resets a NULL / NOT_NULL operator left on a covered column', () => {
      const value = defaults();
      value.columnFilter = { createdAt: null };
      value.columnOperator = { createdAt: 'NOT_NULL' };
      const { patch } = queryToTableFilter(tableFilterToQuery(value, context()), context(), value);
      expect(['NULL', 'NOT_NULL']).not.toContain(patch.columnOperator!['createdAt']);
      expect(paging({ ...value, ...patch }) ?? []).not.toContain(jasmine.objectContaining({ field: 'createdAt', operator: 'NOT_NULL' }));
    });

    it('writes columnOperator only for columns with operator.enable', () => {
      const { patch } = apply([chip('column:customer.name', 'CONTAIN', 'An'), chip('column:code', 'EQUAL', 'DH')]);
      expect(patch.columnOperator).toEqual({ code: 'EQUAL', total: 'EQUAL' });
      expect(patch.columnFilter!['customer.name']).toBe('An');
    });

    it('empties fields whose chip is gone and resets their column operator', () => {
      const current = defaults();
      current.columnFilter = { code: null };
      current.columnOperator = { code: 'NULL', total: 'EQUAL' };
      current.externalFilter = { ...current.externalFilter, note: 'abc' };
      const base = tableFilterToQuery(current, context());
      const filters = base.filters.filter(filter => !['column:code', 'external:note'].includes((filter as any).field));
      const { patch, changed } = queryToTableFilter({ ...base, filters }, context(), current);
      expect(patch.columnOperator!['code']).toBe('CONTAIN');
      expect(patch.externalFilter!['note']).toBeNull();
      expect(changed.map(entry => entry.key).sort()).toEqual(['column:code', 'external:note']);
    });

    it('writes a removed range chip as an empty range', () => {
      const current = defaults();
      const base = tableFilterToQuery(current, context());
      const filters = base.filters.filter(filter => (filter as any).field !== 'external:createdAt');
      expect(queryToTableFilter({ ...base, filters }, context(), current).patch.externalFilter!['createdAt']).toEqual({
        from: null,
        to: null,
      });
    });

    it('leaves excluded fields untouched', () => {
      const ctx = {
        ...sdTableQueryFields({
          columns,
          externalFilters,
          quickSearch,
          inlineExternal: {},
          hideColumns: false,
          labels: LABELS,
          queryBar: { exclude: ['note'] },
        }),
      };
      const current = defaults();
      current.externalFilter = { ...current.externalFilter, note: 'kept' };
      const { patch } = queryToTableFilter(tableFilterToQuery(current, ctx), ctx, current);
      expect(patch.externalFilter!['note']).toBe('kept');
    });

    it('reports value and operator changes for callbacks', () => {
      const { changed } = apply([chip('column:total', 'GREATER_THAN', 7), chip('external:qty', 'EQUAL', 3)]);
      expect(changed).toEqual([
        { key: 'external:qty', value: 3, valueChanged: true },
        { key: 'column:total', value: 7, valueChanged: true, operator: 'GREATER_THAN' },
      ]);
    });

    it('reports an operator-only change', () => {
      const current = defaults();
      current.columnFilter = { total: 7 };
      const { changed } = apply([chip('column:total', 'GREATER_THAN', 7)], current);
      expect(changed).toEqual([{ key: 'column:total', value: 7, valueChanged: false, operator: 'GREATER_THAN' }]);
    });

    it('keeps the stored representation of an equivalent value', () => {
      const current = defaults();
      current.quickSearch = { term: '', filters: { warehouseId: undefined, tags: null } };
      current.columnFilter = { payment: 'p1', active: true };
      const { patch, changed } = apply([], current);
      expect(changed).toEqual([]);
      expect(patch.quickSearch!.filters['tags']).toBeNull();
      expect(patch.columnFilter!['payment']).toBe('p1');
      expect(patch.columnFilter!['active']).toBe(true);
    });

    it('trims the search term', () => {
      expect(apply([], defaults(), '  DH-1  ').patch.quickSearch!.term).toBe('DH-1');
    });
  });

  describe('sdTableActiveQueryKeys', () => {
    it('lists the fields whose applied value filters something, NULL operators included', () => {
      const value = defaults();
      value.quickSearch = { term: '', filters: { warehouseId: 'hn', tags: [] } };
      value.columnFilter = { total: 0, weight: { from: null, to: null }, code: null };
      value.columnOperator = { ...value.columnOperator, code: 'NULL' };
      expect([...sdTableActiveQueryKeys(value, context())]).toEqual([
        'quick:warehouseId',
        'external:createdAt',
        'column:code',
        'column:total',
      ]);
    });
  });

  describe('mergeQueryDraft', () => {
    const a = chip('column:a', 'EQUAL', 1);
    const b = chip('column:b', 'EQUAL', 2);

    it('keeps drafts of fields whose applied chip did not change', () => {
      const edited = chip('column:a', 'EQUAL', 5);
      const added = chip('column:c', 'EQUAL', 3);
      expect(mergeQueryDraft([edited, added], [a, b], [a, b])).toEqual([edited, added]);
    });

    it('lets an outside change win for its field and drops a chip the outside cleared', () => {
      const outside = chip('column:a', 'EQUAL', 9);
      expect(mergeQueryDraft([chip('column:a', 'EQUAL', 5), b], [a, b], [outside])).toEqual([outside]);
    });

    it('appends new applied chips and keeps chips the user removed removed', () => {
      const added = chip('column:c', 'EQUAL', 3);
      expect(mergeQueryDraft([a], [a, b], [a, b, added])).toEqual([a, added]);
    });
  });

  describe('parity with the default-mode controls', () => {
    /** Raw record the default-mode control would store for the same edit, on top of the defaults. */
    type RawEdit = Partial<Record<'quick' | 'external' | 'column' | 'operator', Record<string, unknown>>> & { term?: string };

    const byHand = (edit: RawEdit): TableFilterValue => {
      const value = defaults();
      value.quickSearch = { term: edit.term ?? '', filters: { ...value.quickSearch!.filters, ...(edit.quick as any) } };
      value.externalFilter = { ...value.externalFilter, ...edit.external };
      value.columnFilter = { ...value.columnFilter, ...edit.column };
      value.columnOperator = { ...value.columnOperator, ...(edit.operator as any) };
      return value;
    };

    const viaBar = (filters: Filter[], search = ''): TableFilterValue => {
      const current = defaults();
      const base = tableFilterToQuery(current, context());
      const keys = new Set(filters.map(filter => (filter as any).field));
      const query = { ...base, search, filters: [...base.filters.filter(filter => !keys.has((filter as any).field)), ...filters] };
      return { ...current, ...queryToTableFilter(query, context(), current).patch };
    };

    const cases: { name: string; bar: Filter[]; search?: string; raw: RawEdit }[] = [
      { name: 'nothing edited', bar: [], raw: {} },
      { name: 'quick term', bar: [], search: 'KH-001', raw: { term: 'KH-001' } },
      { name: 'quick single value', bar: [chip('quick:warehouseId', 'EQUAL', 'hn')], raw: { quick: { warehouseId: 'hn' } } },
      { name: 'quick multiple values', bar: [chip('quick:tags', 'IN', ['a', 'b'])], raw: { quick: { tags: ['a', 'b'] } } },
      { name: 'quick multiple, empty', bar: [chip('quick:tags', 'IN', [])], raw: { quick: { tags: [] } } },
      { name: 'external string', bar: [chip('external:note', 'CONTAIN', 'abc')], raw: { external: { note: 'abc' } } },
      {
        name: 'external string EQUAL with commas',
        bar: [chip('external:codes', 'EQUAL', 'A1, B2')],
        raw: { external: { codes: 'A1, B2' } },
      },
      { name: 'external number', bar: [chip('external:qty', 'EQUAL', 0)], raw: { external: { qty: 0 } } },
      { name: 'external boolean', bar: [chip('external:paid', 'EQUAL', false)], raw: { external: { paid: false } } },
      {
        name: 'external date >=',
        bar: [chip('external:from', 'GREATER_OR_EQUAL', '2026/10/05')],
        raw: { external: { from: '2026/10/05' } },
      },
      {
        name: 'external datetime <=',
        bar: [chip('external:until', 'LESS_OR_EQUAL', '2026/10/05 08:30:00')],
        raw: { external: { until: '2026/10/05 08:30:00' } },
      },
      {
        name: 'external daterange, full',
        bar: [chip('external:createdAt', 'BETWEEN', { from: '2026/09/01', to: '2026/09/30' })],
        raw: { external: { createdAt: { from: '2026/09/01', to: '2026/09/30' } } },
      },
      {
        name: 'external daterange, from only (popover leaves out `to`)',
        bar: [chip('external:createdAt', 'BETWEEN', { from: '2026/09/01' })],
        raw: { external: { createdAt: { from: '2026/09/01', to: null } } },
      },
      {
        name: 'external daterange, cleared',
        bar: [chip('external:createdAt', 'BETWEEN', { from: null, to: null })],
        raw: { external: { createdAt: { from: null, to: null } } },
      },
      {
        name: 'external values multiple',
        bar: [chip('external:status', 'IN', ['new', 'paid'])],
        raw: { external: { status: ['new', 'paid'] } },
      },
      { name: 'external values single', bar: [chip('external:kind', 'EQUAL', 'retail')], raw: { external: { kind: 'retail' } } },
      { name: 'external lazy single', bar: [chip('external:channel', 'EQUAL', 7)], raw: { external: { channel: 7 } } },
      { name: 'column string, default operator', bar: [chip('column:code', 'CONTAIN', 'DH')], raw: { column: { code: 'DH' } } },
      {
        name: 'column string, EQUAL',
        bar: [chip('column:code', 'EQUAL', 'DH')],
        raw: { column: { code: 'DH' }, operator: { code: 'EQUAL' } },
      },
      {
        name: 'column string, NULL',
        bar: [chip('column:code', 'NULL', null)],
        raw: { column: { code: null }, operator: { code: 'NULL' } },
      },
      {
        name: 'column string without operator',
        bar: [chip('column:customer.name', 'CONTAIN', 'An')],
        raw: { column: { 'customer.name': 'An' } },
      },
      {
        name: 'column number >',
        bar: [chip('column:total', 'GREATER_THAN', 5000000)],
        raw: { column: { total: 5000000 }, operator: { total: 'GREATER_THAN' } },
      },
      {
        name: 'column split-number, full',
        bar: [chip('column:weight', 'BETWEEN', { from: 10, to: 20 })],
        raw: { column: { weight: { from: 10, to: 20 } } },
      },
      {
        name: 'column split-number, from 0',
        bar: [chip('column:weight', 'BETWEEN', { from: 0, to: null })],
        raw: { column: { weight: { from: 0, to: null } } },
      },
      {
        name: 'column split-number, to only',
        bar: [chip('column:weight', 'BETWEEN', { to: 5 })],
        raw: { column: { weight: { from: null, to: 5 } } },
      },
      { name: 'column boolean true', bar: [chip('column:active', 'EQUAL', true)], raw: { column: { active: '1' } } },
      { name: 'column boolean false', bar: [chip('column:active', 'EQUAL', false)], raw: { column: { active: '0' } } },
      { name: 'column values multiple', bar: [chip('column:payment', 'IN', ['p1', 'p2'])], raw: { column: { payment: ['p1', 'p2'] } } },
      {
        name: 'column values NOT_NULL',
        bar: [chip('column:payment', 'NOT_NULL', null)],
        raw: { column: { payment: null }, operator: { payment: 'NOT_NULL' } },
      },
      {
        name: 'column values single NOT_EQUAL',
        bar: [chip('column:shipper', 'NOT_EQUAL', 's1')],
        raw: { column: { shipper: 's1' }, operator: { shipper: 'NOT_EQUAL' } },
      },
      {
        name: 'column date, whole day',
        bar: [chip('column:deliveredOn', 'EQUAL', '2026/10/05')],
        raw: { column: { deliveredOn: '2026/10/05' } },
      },
      {
        name: 'column date range, full',
        bar: [chip('column:updatedAt', 'BETWEEN', { from: '2026/10/01', to: '2026/10/31' })],
        raw: { column: { updatedAt: { from: '2026/10/01', to: '2026/10/31' } } },
      },
      {
        name: 'column date range, to only',
        bar: [chip('column:updatedAt', 'BETWEEN', { from: null, to: '2026/10/31' })],
        raw: { column: { updatedAt: { from: null, to: '2026/10/31' } } },
      },
      { name: 'column lazy-values (children)', bar: [chip('column:owner', 'EQUAL', 'u1')], raw: { column: { owner: 'u1' } } },
    ];

    for (const zone of ['machine', 'Asia/Ho_Chi_Minh'] as const) {
      describe(`in the ${zone} zone`, () => {
        for (const item of cases) {
          it(item.name, () => {
            const dateTime = zone === 'machine' ? undefined : zoned();
            const expected = paging(byHand(item.raw), dateTime);
            expect(paging(viaBar(item.bar, item.search), dateTime)).toEqual(expected);
          });
        }
      });
    }

    it('removing every chip gives the same request as clearing every control', () => {
      const current = defaults();
      current.quickSearch = { term: 'x', filters: { warehouseId: 'hn', tags: ['a'] } };
      current.externalFilter = { ...current.externalFilter, status: ['new'], note: 'abc' };
      current.columnFilter = { code: 'DH', weight: { from: 1, to: 2 } };
      const pinnedOnly = tableFilterToQuery(defaults(), context()).filters.map(filter =>
        (filter as any).field === 'external:createdAt' ? chip('external:createdAt', 'BETWEEN', { from: null, to: null }) : filter
      );
      const patch = queryToTableFilter({ filters: pinnedOnly, logic: 'AND', search: '' }, context(), current).patch;
      const cleared = byHand({ external: { createdAt: { from: null, to: null } } });
      expect(paging({ ...current, ...patch })).toEqual(paging(cleared));
    });
  });
});
