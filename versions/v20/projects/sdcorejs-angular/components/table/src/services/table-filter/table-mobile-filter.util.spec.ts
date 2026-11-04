import type { TemplateRef } from '@angular/core';
import type { SdTableFilterDefDirective } from '../../directives/sd-table-filter-def.directive';
import type { SdTableColumnAnyRow } from '../../models/table-column.model';
import type { SdTableExternalFilter, TableFilterValue } from './table-filter.model';
import {
  type SdTableMobileFilterItem,
  sdTableMobileFilterActive,
  sdTableMobileFilterChip,
  sdTableMobileFilterClear,
  sdTableMobileFilterItems,
} from './table-mobile-filter.util';
import { type SdTableQueryContext, sdTableQueryFields } from './table-query-bar.util';

const def = (field: string): SdTableFilterDefDirective => ({ sdTableFilterDef: () => field }) as unknown as SdTableFilterDefDirective;

const model = (args: {
  columns?: SdTableColumnAnyRow[];
  externalFilters?: SdTableExternalFilter[];
  filterDefs?: SdTableFilterDefDirective[];
  defaultColumnOperator?: SdTableQueryContext['defaultColumnOperator'];
}): { ctx: SdTableQueryContext; items: SdTableMobileFilterItem[] } => {
  const columns = args.columns ?? [];
  const fields = sdTableQueryFields({
    columns,
    externalFilters: args.externalFilters,
    inlineExternal: {},
    hideColumns: false,
    labels: { filters: 'Filters', columns: 'Columns' },
    filterDefs: (args.filterDefs ?? []).map(entry => entry.sdTableFilterDef()),
  });
  const ctx: SdTableQueryContext = { ...fields, defaultColumnOperator: args.defaultColumnOperator };
  return { ctx, items: sdTableMobileFilterItems({ ctx, columns, externalFilters: args.externalFilters, filterDefs: args.filterDefs }) };
};

const item = (items: SdTableMobileFilterItem[], key: string): SdTableMobileFilterItem => {
  const found = items.find(entry => entry.key === key);
  if (!found) throw new Error(`no item ${key} in ${items.map(entry => entry.key).join(', ')}`);
  return found;
};

const STATUSES = [
  { id: 'new', name: 'New' },
  { id: 'done', name: 'Done' },
];
/** A `custom` external filter with its own template. */
const TAGS: SdTableExternalFilter = { field: 'tags', type: 'custom', title: 'Tags', filterDef: {} as TemplateRef<unknown> };

/** Handoff table-mobile 3 and 5: which filters the phone shows, in which order, and how one is cleared. */
describe('table-mobile-filter.util', () => {
  describe('sdTableMobileFilterItems', () => {
    it('lists external filters, then filter templates, then columns', () => {
      const { items } = model({
        externalFilters: [{ field: 'customer', type: 'string', title: 'Customer' }, TAGS],
        filterDefs: [def('region')],
        columns: [
          { field: 'code', type: 'string', title: 'Code' },
          { field: 'region', type: 'string', title: { title: 'Region' } } as SdTableColumnAnyRow,
        ],
      });

      expect(items.map(entry => entry.key)).toEqual(['external:customer', 'custom-external:tags', 'custom-def:region', 'column:code']);
      expect(items.map(entry => entry.label)).toEqual(['Customer', 'Tags', 'Region', 'Code']);
    });

    it('gives a filter the bar can read its source and field, and a custom filter neither', () => {
      const { items } = model({
        externalFilters: [TAGS],
        columns: [{ field: 'code', type: 'string', title: 'Code' }],
      });

      const code = item(items, 'column:code');
      expect(code.source?.field).toBe('code');
      expect(code.field?.key).toBe('column:code');
      expect(code.custom).toBeUndefined();
      const tags = item(items, 'custom-external:tags');
      expect(tags.source).toBeUndefined();
      expect(tags.custom).toEqual({ kind: 'external', external: jasmine.objectContaining({ field: 'tags' }) });
    });

    it('lets a filter template replace the external filter and the column of its field', () => {
      const { items } = model({
        externalFilters: [{ field: 'tags', type: 'custom', title: 'Tags' }],
        filterDefs: [def('tags'), def('code'), def('free')],
        columns: [{ field: 'code', type: 'string', title: 'Code' }],
      });

      expect(items.map(entry => entry.key)).toEqual(['custom-def:tags', 'custom-def:code', 'custom-def:free']);
      // label: the column title, then the external filter title, then the field itself.
      expect(items.map(entry => entry.label)).toEqual(['Tags', 'Code', 'free']);
    });

    it('opens a time column through its own control, and leaves out hidden, disabled and covered columns', () => {
      const { items } = model({
        externalFilters: [{ field: 'customer', type: 'string', title: 'Customer' }],
        columns: [
          { field: 'at', type: 'time', title: 'At' } as SdTableColumnAnyRow,
          { field: 'secret', type: 'string', title: 'Secret', hidden: true },
          { field: 'note', type: 'string', title: 'Note', filter: { disabled: true } },
          { field: 'customer', type: 'string', title: 'Customer column' },
        ],
      });

      expect(items.map(entry => entry.key)).toEqual(['external:customer', 'custom-column:at']);
      expect(item(items, 'custom-column:at').custom).toEqual({ kind: 'column', column: jasmine.objectContaining({ field: 'at' }) });
    });

    it('leaves out a custom external filter without a template, and opens a date one the bar leaves out', () => {
      const { items } = model({
        externalFilters: [
          { field: 'free', type: 'custom', title: 'Free' },
          { field: 'day', type: 'date', title: 'Day' },
          { field: 'from', type: 'date', title: 'From', defaultOperator: 'GREATER_OR_EQUAL' },
        ],
      });

      expect(items.map(entry => entry.key)).toEqual(['custom-external:day', 'external:from']);
    });

    it('flattens grouped columns', () => {
      const { items } = model({
        columns: [
          {
            field: 'group',
            type: 'children',
            title: 'Group',
            children: [
              { field: 'a', type: 'string', title: 'A' },
              { field: 'b', type: 'number', title: 'B' },
            ],
          } as unknown as SdTableColumnAnyRow,
        ],
      });

      expect(items.map(entry => entry.key)).toEqual(['column:a', 'column:b']);
    });
  });

  describe('sdTableMobileFilterChip / sdTableMobileFilterActive', () => {
    const { items } = model({
      externalFilters: [{ field: 'customer', type: 'string', title: 'Customer' }, TAGS],
      filterDefs: [def('free')],
      columns: [{ field: 'code', type: 'string', title: 'Code' }, { field: 'at', type: 'time', title: 'At' } as SdTableColumnAnyRow],
    });

    it('summarises a filter the bar can read and gives a custom filter no chip', () => {
      const value: TableFilterValue = { externalFilter: { customer: 'An' } };

      expect(sdTableMobileFilterChip(item(items, 'external:customer'), value)?.active).toBeTrue();
      expect(sdTableMobileFilterChip(item(items, 'custom-external:tags'), value)).toBeUndefined();
    });

    it('counts a filter the bar can read when its chip is active', () => {
      expect(sdTableMobileFilterActive(item(items, 'column:code'), { columnFilter: { code: 'DH' } })).toBeTrue();
      expect(sdTableMobileFilterActive(item(items, 'column:code'), { columnFilter: { code: '' } })).toBeFalse();
    });

    it('counts a custom column or external filter when its raw value has content', () => {
      const at = item(items, 'custom-column:at');
      const tags = item(items, 'custom-external:tags');

      expect(sdTableMobileFilterActive(at, { columnFilter: { at: '' } })).toBeFalse();
      expect(sdTableMobileFilterActive(at, { columnFilter: { at: [null, ''] } })).toBeFalse();
      expect(sdTableMobileFilterActive(at, { columnFilter: { at: { from: null, to: undefined } } })).toBeFalse();
      expect(sdTableMobileFilterActive(at, { columnFilter: { at: { from: null, to: '10:00' } } })).toBeTrue();
      expect(sdTableMobileFilterActive(at, { columnFilter: { at: 0 } })).toBeTrue();
      expect(sdTableMobileFilterActive(tags, { externalFilter: { tags: ['a'] } })).toBeTrue();
      expect(sdTableMobileFilterActive(tags, {})).toBeFalse();
    });

    it('never counts a filter template', () => {
      expect(sdTableMobileFilterActive(item(items, 'custom-def:free'), { externalFilter: { free: 'x' } })).toBeFalse();
    });
  });

  describe('sdTableMobileFilterClear', () => {
    const columns: SdTableColumnAnyRow[] = [
      { field: 'code', type: 'string', title: 'Code', filter: { operator: { enable: true, list: ['CONTAIN', 'EQUAL', 'NULL'] } } },
      {
        field: 'status',
        type: 'values',
        title: 'Status',
        option: { items: STATUSES, valueField: 'id', displayField: 'name', selection: 'MULTIPLE' },
        filter: { operator: { enable: true, list: ['NULL', 'NOT_NULL'], default: 'IN' } },
      },
      { field: 'createdAt', type: 'date', title: 'Created', filter: { operator: { enable: true, list: ['NULL'] } } },
      { field: 'at', type: 'time', title: 'At' } as SdTableColumnAnyRow,
    ];
    const externalFilters: SdTableExternalFilter[] = [{ field: 'customer', type: 'string', title: 'Customer' }, TAGS];

    it('empties the value in the shape of the filter', () => {
      const { ctx, items } = model({ columns, externalFilters });
      const value: TableFilterValue = {
        columnFilter: { code: 'DH', status: ['new'], createdAt: { from: '2026/10/01', to: null } },
        externalFilter: { customer: 'An' },
      };

      expect(sdTableMobileFilterClear(item(items, 'column:code'), value, ctx).columnFilter?.['code']).toBeNull();
      expect(sdTableMobileFilterClear(item(items, 'column:status'), value, ctx).columnFilter?.['status']).toEqual([]);
      expect(sdTableMobileFilterClear(item(items, 'column:createdAt'), value, ctx).columnFilter?.['createdAt']).toEqual({
        from: null,
        to: null,
      });
      expect(sdTableMobileFilterClear(item(items, 'external:customer'), value, ctx).externalFilter?.['customer']).toBeNull();
    });

    it('sets a custom column or external filter to undefined', () => {
      const { ctx, items } = model({ columns, externalFilters });
      const value: TableFilterValue = { columnFilter: { at: '10:00' }, externalFilter: { tags: ['a'] } };

      expect(sdTableMobileFilterClear(item(items, 'custom-column:at'), value, ctx).columnFilter?.['at']).toBeUndefined();
      expect(sdTableMobileFilterClear(item(items, 'custom-external:tags'), value, ctx).externalFilter?.['tags']).toBeUndefined();
    });

    it('leaves a filter template alone', () => {
      const { ctx, items } = model({ columns, externalFilters, filterDefs: [def('free')] });
      const value: TableFilterValue = { externalFilter: { free: 'x' }, columnFilter: { code: 'DH' } };

      const next = sdTableMobileFilterClear(item(items, 'custom-def:free'), value, ctx);
      expect(next.externalFilter).toEqual({ free: 'x' });
      expect(next.columnFilter).toEqual({ code: 'DH' });
    });

    it('puts a NULL / NOT_NULL operator back to the table default, then the column default, else removes it', () => {
      const withTableDefault = model({ columns, externalFilters, defaultColumnOperator: { code: 'EQUAL' } });
      const plain = model({ columns, externalFilters });
      const value: TableFilterValue = { columnFilter: {}, columnOperator: { code: 'NULL', status: 'NULL', createdAt: 'NULL' } };

      const code = sdTableMobileFilterClear(item(withTableDefault.items, 'column:code'), value, withTableDefault.ctx);
      expect(code.columnOperator?.['code']).toBe('EQUAL');
      const status = sdTableMobileFilterClear(item(plain.items, 'column:status'), value, plain.ctx);
      expect(status.columnOperator?.['status']).toBe('IN');
      const createdAt = sdTableMobileFilterClear(item(plain.items, 'column:createdAt'), value, plain.ctx);
      expect('createdAt' in (createdAt.columnOperator ?? {})).toBeFalse();
    });

    it('keeps an operator that needs a value', () => {
      const { ctx, items } = model({ columns, externalFilters });
      const value: TableFilterValue = { columnFilter: { code: 'DH' }, columnOperator: { code: 'EQUAL' } };

      expect(sdTableMobileFilterClear(item(items, 'column:code'), value, ctx).columnOperator?.['code']).toBe('EQUAL');
    });

    it('does not change the record it was given', () => {
      const { ctx, items } = model({ columns, externalFilters });
      const value: TableFilterValue = {
        columnFilter: { code: 'DH' },
        columnOperator: { code: 'NULL' },
        externalFilter: { customer: 'An' },
      };
      const before = JSON.stringify(value);

      sdTableMobileFilterClear(item(items, 'column:code'), value, ctx);
      sdTableMobileFilterClear(item(items, 'external:customer'), value, ctx);

      expect(JSON.stringify(value)).toBe(before);
    });
  });
});
