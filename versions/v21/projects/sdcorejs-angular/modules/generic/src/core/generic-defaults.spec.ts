import type { SdGenericSchema } from '../models';
import { sdGenericCanInsert, sdGenericCanUpdate, sdGenericListColumns, sdGenericPageSize, sdGenericPrimaryKey } from './generic-defaults';

const schema = (extra: Partial<SdGenericSchema> = {}): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'string', system: true },
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'meta', label: 'Meta', dataType: 'json' },
      { key: 'attachment', label: 'Attachment', dataType: 'file' },
      { key: 'qty', label: 'Qty', dataType: 'number', updatable: false },
      { key: 'locked', label: 'Locked', dataType: 'boolean', insertable: false },
    ],
  },
  ...extra,
});

describe('generic defaults', () => {
  it('lists every property except json and file when no columns are configured (AC-001)', () => {
    expect(sdGenericListColumns(schema()).map(column => column.key)).toEqual(['id', 'code', 'qty', 'locked']);
  });

  it('keeps the configured columns as they are', () => {
    const columns = [
      { key: 'code', width: 120 },
      { key: 'meta', visible: false },
    ];
    expect(sdGenericListColumns(schema({ list: { columns } }))).toEqual(columns);
  });

  it('defaults the page size to 20 and the primary key to id', () => {
    expect(sdGenericPageSize(schema())).toBe(20);
    expect(sdGenericPageSize(schema({ list: { pageSize: 50 } }))).toBe(50);
    expect(sdGenericPrimaryKey(schema())).toBe('id');
    expect(sdGenericPrimaryKey(schema({ general: { label: 'Order', primaryKey: 'code', properties: [] } }))).toBe('code');
  });

  it('keeps system and non-insertable properties out of create, system and non-updatable ones out of update', () => {
    const [id, code, , , qty, locked] = schema().general.properties;
    expect([id, code, qty, locked].map(sdGenericCanInsert)).toEqual([false, true, true, false]);
    expect([id, code, qty, locked].map(sdGenericCanUpdate)).toEqual([false, true, false, true]);
  });
});
