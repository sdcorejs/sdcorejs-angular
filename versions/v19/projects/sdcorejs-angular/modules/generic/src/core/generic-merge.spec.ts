import type { SdFormGenericSchema } from '@sdcorejs/angular/components/form-generic';
import type { SdGenericSchema } from '../models';
import { sdGenericMergeSchema } from './generic-merge';
import { sdGenericRelationInfo } from './generic-search';

const base = (): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'code', label: 'Code', dataType: 'string' },
      {
        key: 'status',
        label: 'Status',
        dataType: 'enum',
        enums: [
          { value: 'NEW', label: 'New' },
          { value: 'DONE', label: 'Done' },
        ],
      },
      { key: 'customer', label: 'Customer', dataType: 'relation', relation: { entity: 'customer', displayField: 'name' } },
      { key: 'priority', label: 'Priority', dataType: 'number' },
    ],
  },
});

const layout = (...keys: string[]): SdFormGenericSchema =>
  ({ pages: [{ id: 'p', elements: keys.map(key => ({ id: key, key, type: 'textfield', label: key })) }] }) as SdFormGenericSchema;

const stored = (): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Sales order',
    properties: [
      {
        key: 'status',
        label: 'State',
        dataType: 'string',
        enums: [
          { value: 'NEW', label: 'Open', color: 'primary' },
          { value: 'OLD', label: 'Legacy' },
        ],
      },
      { key: 'code', label: 'Order code', dataType: 'number', validation: { required: true } },
      {
        key: 'customer',
        label: 'Buyer',
        dataType: 'relation',
        relation: { entity: 'client', displayField: 'fullName', display: '${code} - ${fullName}' },
      },
      { key: 'removed', label: 'Removed', dataType: 'string' },
    ],
  },
  list: {
    title: 'Orders',
    columns: [{ key: 'code', width: 120 }, { key: 'removed' }, { key: 'status' }],
    orders: [{ field: 'removed', direction: 'ASC' }],
  },
  detail: { title: 'Order ${code}', form: layout('code', 'removed') },
  import: { columns: [{ key: 'code' }, { key: 'removed' }], upsertKey: 'removed' },
});

describe('sdGenericMergeSchema', () => {
  it('takes the structure from the current schema and the display from the stored one (AC-006)', () => {
    const { schema } = sdGenericMergeSchema(stored(), base());
    const code = schema.general.properties.find(property => property.key === 'code')!;
    expect(code.dataType).withContext('dataType from the backend').toBe('string');
    expect(code.label).withContext('label from the stored configuration').toBe('Order code');
    expect(code.validation).toEqual({ required: true });

    const status = schema.general.properties.find(property => property.key === 'status')!;
    expect(status.dataType).toBe('enum');
    expect(status.label).toBe('State');
    expect(status.enums)
      .withContext('values from the backend, labels and colors from storage')
      .toEqual([
        { value: 'NEW', label: 'Open', color: 'primary' },
        { value: 'DONE', label: 'Done' },
      ]);

    const customer = schema.general.properties.find(property => property.key === 'customer')!;
    expect(customer.relation).toEqual({ entity: 'customer', displayField: 'fullName', display: '${code} - ${fullName}' });
    expect(schema.general.label).toBe('Sales order');
  });

  it('drops properties that no longer exist everywhere (AC-006)', () => {
    const { schema, removed } = sdGenericMergeSchema(stored(), base());
    expect(removed).toEqual(['removed']);
    expect(schema.general.properties.map(property => property.key)).not.toContain('removed');
    expect(schema.list!.columns!.map(column => column.key)).toEqual(['code', 'status', 'priority']);
    expect(schema.list!.orders).toEqual([]);
    expect(JSON.stringify(schema.detail!.form)).not.toContain('removed');
    expect(schema.import!.columns).toEqual([{ key: 'code' }]);
    expect(schema.import!.upsertKey).toBeUndefined();
  });

  it('adds new backend properties to general and to the configured columns as hidden, never to a stored layout (AC-006)', () => {
    const { schema, added } = sdGenericMergeSchema(stored(), base());
    expect(added).toEqual(['priority']);
    expect(schema.general.properties.map(property => property.key)).toEqual(['status', 'code', 'customer', 'priority']);
    expect(schema.list!.columns!.find(column => column.key === 'priority')).toEqual({ key: 'priority', visible: false });
    expect(JSON.stringify(schema.detail!.form)).not.toContain('priority');
  });

  it('keeps titles and leaves unconfigured columns unconfigured', () => {
    const value = stored();
    delete value.list!.columns;
    const { schema } = sdGenericMergeSchema(value, base());
    expect(schema.list!.columns).toBeUndefined();
    expect(schema.list!.title).toBe('Orders');
    expect(schema.detail!.title).toBe('Order ${code}');
  });

  it('lets the stored configuration narrow insertable / updatable but never reopen them', () => {
    const current = base();
    current.general.properties[0].insertable = false;
    const value = stored();
    value.general.properties[1].insertable = true;
    value.general.properties[1].updatable = false;
    const code = sdGenericMergeSchema(value, current).schema.general.properties.find(property => property.key === 'code')!;
    expect(code.insertable).withContext('locked by the backend').toBeFalse();
    expect(code.updatable).withContext('narrowed by the configuration').toBeFalse();
  });

  it('keeps a cleared relation display and search fields instead of falling back to the backend values', () => {
    const current = base();
    current.general.properties[2].relation = {
      entity: 'customer',
      displayField: 'name',
      display: '${code} - ${name}',
      searchFields: ['code'],
    };
    const value = stored();
    value.general.properties[2].relation = { entity: 'customer', display: '', searchFields: [] };
    const customer = sdGenericMergeSchema(value, current).schema.general.properties.find(property => property.key === 'customer')!;
    expect(customer.relation).toEqual(jasmine.objectContaining({ display: '', searchFields: [] }));
    const info = sdGenericRelationInfo(customer, 'tms');
    expect(info.searchFields).withContext('empty search fields mean the display field').toEqual(['name']);
    expect(info.display).withContext('an empty template means none').toBeUndefined();
  });

  it('does not add a new property twice to columns that already list it', () => {
    const current = base();
    current.list = { columns: [{ key: 'code' }, { key: 'priority' }] };
    const value = stored();
    delete value.list;
    const { schema } = sdGenericMergeSchema(value, current);
    expect(schema.list!.columns!.map(column => column.key)).toEqual(['code', 'priority']);
  });

  it('takes list.externalFilters from the current schema, never from the stored one (INV-004)', () => {
    const current = { ...base(), list: { externalFilters: [{ key: 'status' }, { key: 'gone' }] } };
    const saved = { ...stored(), list: { columns: [{ key: 'code' }], externalFilters: [{ key: 'code', default: 'X' }] } };
    const { schema } = sdGenericMergeSchema(saved, current);
    expect(schema.list?.externalFilters).toEqual([{ key: 'status' }]);
    expect(schema.list?.columns?.[0]).toEqual({ key: 'code' });
  });

  it('drops a stored list.externalFilters when the current schema declares none (INV-004)', () => {
    const saved = { ...stored(), list: { columns: [{ key: 'code' }], externalFilters: [{ key: 'code' }] } };
    const { schema } = sdGenericMergeSchema(saved, base());
    expect(schema.list?.externalFilters).toBeUndefined();
  });

  it('never mutates its inputs', () => {
    const value = stored();
    const current = base();
    const before = JSON.stringify([value, current]);
    sdGenericMergeSchema(value, current);
    expect(JSON.stringify([value, current])).toBe(before);
  });
});
