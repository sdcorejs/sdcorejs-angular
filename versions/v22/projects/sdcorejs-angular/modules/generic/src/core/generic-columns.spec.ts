import type { SdGenericSchema } from '../models';
import { sdGenericExternalFilters, sdGenericTableColumns, type SdGenericColumnDeps } from './generic-columns';

const schema = (extra: Partial<SdGenericSchema> = {}): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'note', label: 'Note', dataType: 'text' },
      { key: 'amount', label: 'Amount', dataType: 'number' },
      { key: 'paid', label: 'Paid', dataType: 'boolean' },
      { key: 'due', label: 'Due', dataType: 'date' },
      { key: 'at', label: 'At', dataType: 'datetime' },
      { key: 'start', label: 'Start', dataType: 'time' },
      { key: 'status', label: 'Status', dataType: 'enum', enums: [{ value: 'NEW', label: 'New', color: 'primary', icon: 'fiber_new' }] },
      { key: 'customer', label: 'Customer', dataType: 'relation', relation: { entity: 'customer', displayField: 'name' } },
      { key: 'meta', label: 'Meta', dataType: 'json' },
    ],
  },
  ...extra,
});

const deps: SdGenericColumnDeps = {
  relationSearch: () => async () => [],
  relationViews: () => async () => [],
};

describe('generic table columns', () => {
  it('maps data types to sd-table column types and skips json by default (AC-001)', () => {
    const columns = sdGenericTableColumns(schema(), deps);
    expect(columns.map(column => [column.field, column.type])).toEqual([
      ['code', 'string'],
      ['note', 'string'],
      ['amount', 'number'],
      ['paid', 'boolean'],
      ['due', 'date'],
      ['at', 'datetime'],
      ['start', 'time'],
      ['status', 'values'],
      ['customer', 'lazy-values'],
    ]);
    expect(columns[0].title).toBe('Code');
  });

  it('builds enum badges and relation lookups from the schema', () => {
    const columns = sdGenericTableColumns(schema(), deps);
    const status = columns.find(column => column.field === 'status') as any;
    expect(status.option).toEqual(jasmine.objectContaining({ valueField: 'value', displayField: 'label' }));
    expect(status.useBadge('NEW', {}, status.option.items)).toEqual(jasmine.objectContaining({ color: 'primary', icon: 'fiber_new' }));
    const customer = columns.find(column => column.field === 'customer') as any;
    expect(customer.option).toEqual(jasmine.objectContaining({ valueField: 'id', displayField: 'name' }));
    expect(typeof customer.option.items).toBe('function');
    expect(typeof customer.option.views).toBe('function');
  });

  it('applies width, visibility, sort and filter flags of the configured columns (AC-013)', () => {
    const columns = sdGenericTableColumns(
      schema({
        list: {
          columns: [{ key: 'amount', width: 120, visible: false, sortable: false, filterable: false }, { key: 'meta' }, { key: 'gone' }],
        },
      }),
      deps
    );
    expect(columns.map(column => column.field))
      .withContext('json is allowed when configured; unknown keys are skipped')
      .toEqual(['amount', 'meta']);
    expect(columns[0]).toEqual(jasmine.objectContaining({ width: '120px', invisible: true, sortable: false, filter: { disabled: true } }));
    expect(columns[1].type).toBe('string');
    expect((columns[1] as any).transform({ a: 1 }, {})).toBe('{"a":1}');
  });

  it('builds external filters with their default value and operator (AC-013)', () => {
    const filters = sdGenericExternalFilters(
      schema({
        list: {
          externalFilters: [
            { key: 'code', operator: 'EQUAL', default: 'SO', required: true },
            { key: 'due' },
            { key: 'status', default: ['NEW'] },
            { key: 'customer' },
            { key: 'paid' },
            { key: 'gone' },
          ],
        },
      }),
      deps
    );
    expect(filters.map(filter => [filter.field, filter.type])).toEqual([
      ['code', 'string'],
      ['due', 'daterange'],
      ['status', 'values'],
      ['customer', 'lazy-values'],
      ['paid', 'boolean'],
    ]);
    expect(filters[0]).toEqual(jasmine.objectContaining({ title: 'Code', default: 'SO', defaultOperator: 'EQUAL', required: true }));
    expect(filters[2]).toEqual(jasmine.objectContaining({ default: ['NEW'] }));
  });
});
