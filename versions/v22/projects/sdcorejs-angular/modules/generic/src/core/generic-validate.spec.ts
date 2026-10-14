import type { SdGenericSchema } from '../models';
import { sdGenericBlocksLoad, validateSdGenericSchema } from './generic-validate';

const base = (): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'string', system: true },
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'tags', label: 'Tags', dataType: 'string', multiple: true },
      { key: 'qty', label: 'Qty', dataType: 'number', updatable: false },
      { key: 'locked', label: 'Locked', dataType: 'boolean', insertable: false },
      { key: 'status', label: 'Status', dataType: 'enum', enums: [{ value: 'NEW', label: 'New' }] },
    ],
  },
});

const field = (key: string, type: string) => ({ id: key, key, type, label: key });
const layout = (...fields: object[]) => ({ pages: [{ id: 'p', elements: fields }] });
const codes = (stored: unknown) => validateSdGenericSchema(stored, base()).map(issue => issue.code);

describe('validateSdGenericSchema', () => {
  it('accepts the schema returned by the backend', () => {
    expect(validateSdGenericSchema(base(), base())).toEqual([]);
  });

  it('reports a wrong shape or version as blocking the load (AC-007)', () => {
    expect(codes(null)).toEqual(['shape']);
    expect(codes('x')).toEqual(['shape']);
    expect(codes({ ...base(), version: 2 })).toContain('version');
    expect(codes({ ...base(), general: { label: 'Order' } })).toContain('shape');
    const issues = validateSdGenericSchema({ ...base(), version: 2 }, base());
    expect(issues.some(sdGenericBlocksLoad)).toBeTrue();
  });

  it('reports module/entity mismatches, duplicate keys and unknown data types (AC-008)', () => {
    const stored = base();
    stored.module = 'wms';
    stored.entity = 'stock';
    stored.general.properties.push({ key: 'code', label: 'Again', dataType: 'string' });
    stored.general.properties.push({ key: 'weird', label: 'Weird', dataType: 'money' as never });
    expect(codes(stored)).toEqual(
      jasmine.arrayContaining(['module-mismatch', 'entity-mismatch', 'property-key-duplicate', 'property-type'])
    );
  });

  it('reports dangling references with a path and does not block the load for them (AC-006)', () => {
    const stored: SdGenericSchema = {
      ...base(),
      list: { columns: [{ key: 'gone' }], externalFilters: [{ key: 'gone2' }], orders: [{ field: 'gone3', direction: 'ASC' }] },
      import: { columns: [{ key: 'gone4' }], upsertKey: 'gone5' },
      detail: { form: layout(field('gone6', 'textfield')) as never },
    };
    const issues = validateSdGenericSchema(stored, base());
    expect(issues.map(issue => issue.code)).toEqual(Array(6).fill('reference-dangling'));
    expect(issues.map(issue => issue.path)).toEqual([
      'list.columns[0].key',
      'list.externalFilters[0].key',
      'list.orders[0].field',
      'import.columns[0].key',
      'import.upsertKey',
      'detail.form.pages[0].elements[0].key',
    ]);
    expect(issues.some(sdGenericBlocksLoad)).toBeFalse();
  });

  it('reports layout grammar and field type mismatches (AC-008)', () => {
    expect(codes({ ...base(), detail: { form: { pages: 'x' } } })).toEqual(['layout-grammar']);
    const nested = layout({ id: 'g', type: 'group', label: 'G', elements: [{ id: 'g2', type: 'group', label: 'G2', elements: [] }] });
    expect(codes({ ...base(), detail: { form: nested } })).toEqual(['layout-grammar']);
    expect(codes({ ...base(), detail: { form: layout(field('code', 'number')) } })).toEqual(['layout-type-mismatch']);
    expect(codes({ ...base(), detail: { form: layout(field('tags', 'chip-string'), field('status', 'radio')) } })).toEqual([]);
  });

  it('reports constraint violations of upsert key, create and update layouts (AC-008)', () => {
    const stored: SdGenericSchema = {
      ...base(),
      import: { upsertKey: 'tags' },
      create: { form: layout(field('id', 'textfield'), field('locked', 'checkbox')) as never },
      update: { form: layout(field('qty', 'number')) as never },
    };
    expect(codes(stored)).toEqual(['upsert-key-multiple', 'create-not-insertable', 'create-not-insertable', 'update-not-updatable']);
  });

  it('reports members of the wrong type instead of throwing (AC-007)', () => {
    expect(codes({ ...base(), list: { columns: {} } })).toEqual(['shape']);
    expect(codes({ ...base(), list: { externalFilters: 'code', orders: 1 } })).toEqual(['shape', 'shape']);
    expect(codes({ ...base(), list: { pageSize: 0 } })).toEqual(['shape']);
    expect(codes({ ...base(), list: { pageSize: 2.5 } })).toEqual(['shape']);
    expect(codes({ ...base(), import: { columns: 'code' } })).toEqual(['shape']);
    const stored = base();
    (stored.general.properties[5] as unknown as Record<string, unknown>)['enums'] = 'NEW';
    (stored.general.properties[1] as unknown as Record<string, unknown>)['insertable'] = 'yes';
    expect(() => validateSdGenericSchema(stored, base())).not.toThrow();
    expect(codes(stored)).toEqual(['shape', 'shape']);
    const relation: SdGenericSchema = {
      ...base(),
      general: {
        label: 'Order',
        properties: [
          ...base().general.properties,
          { key: 'customer', label: 'Customer', dataType: 'relation', relation: { entity: 'customer', searchFields: 'name' as never } },
        ],
      },
    };
    const current: SdGenericSchema = {
      ...base(),
      general: {
        label: 'Order',
        properties: [
          ...base().general.properties,
          { key: 'customer', label: 'Customer', dataType: 'relation', relation: { entity: 'customer' } },
        ],
      },
    };
    expect(validateSdGenericSchema(relation, current).map(issue => issue.code)).toEqual(['shape']);
  });

  it('requires the upsert key to be one of the import columns (AC-020)', () => {
    expect(codes({ ...base(), import: { columns: [{ key: 'code' }], upsertKey: 'code' } })).toEqual([]);
    expect(codes({ ...base(), import: { columns: [{ key: 'qty' }], upsertKey: 'code' } })).toEqual(['upsert-key-not-imported']);
    expect(codes({ ...base(), import: { upsertKey: 'code' } }))
      .withContext('default columns contain the insertable code')
      .toEqual([]);
    expect(codes({ ...base(), import: { upsertKey: 'id' } }))
      .withContext('system properties are not default import columns')
      .toEqual(['upsert-key-not-imported']);
  });

  it('lets a load keep a configuration whose issues come from a backend change (AC-006)', () => {
    const blocking = (stored: unknown) => validateSdGenericSchema(stored, base()).filter(sdGenericBlocksLoad);
    expect(blocking({ ...base(), detail: { title: 'Order ${gone}', form: layout(field('code', 'number')) } })).toEqual([]);
    expect(
      blocking({ ...base(), create: { form: layout(field('id', 'textfield')) }, update: { form: layout(field('qty', 'number')) } })
    ).toEqual([]);
    expect(blocking({ ...base(), version: 2 }).map(issue => issue.code)).toEqual(['version']);
    expect(blocking({ ...base(), import: { upsertKey: 'id' } }).map(issue => issue.code)).toEqual(['upsert-key-not-imported']);
  });

  it('reports invalid titles (AC-009)', () => {
    const stored: SdGenericSchema = { ...base(), list: { title: 'Orders ${code}' }, update: { title: 'Order ${unknown}' } };
    expect(codes(stored)).toEqual(['title-placeholder-forbidden', 'title-placeholder-unknown']);
  });

  it('gives every issue a severity, a path and an English message', () => {
    for (const issue of validateSdGenericSchema({ ...base(), version: 3, list: { title: 'X ${code}' } }, base())) {
      expect(issue.severity).toBe('error');
      expect(issue.path).toBeTruthy();
      expect(issue.message).toBeTruthy();
    }
  });
});
