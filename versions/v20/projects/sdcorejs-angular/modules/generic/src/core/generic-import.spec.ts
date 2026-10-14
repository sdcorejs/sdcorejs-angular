import type { SdGenericSchema } from '../models';
import {
  SD_GENERIC_AMBIGUOUS,
  sdGenericChunk,
  sdGenericImportColumns,
  sdGenericLookupMap,
  sdGenericParseImportRow,
  sdGenericPlanUpsert,
  sdGenericRunLimited,
} from './generic-import';

const schema = (extra: Partial<SdGenericSchema> = {}): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'string', system: true },
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
      { key: 'amount', label: 'Amount', dataType: 'number' },
      { key: 'meta', label: 'Meta', dataType: 'json' },
      { key: 'locked', label: 'Locked', dataType: 'boolean', insertable: false },
    ],
  },
  ...extra,
});

describe('generic import', () => {
  it('uses insertable properties except system, json and file when no columns are configured', () => {
    expect(sdGenericImportColumns(schema()).map(column => column.key)).toEqual(['code', 'status', 'customer', 'amount']);
    expect(sdGenericImportColumns(schema()).find(column => column.key === 'customer')!.matchField).toBe('name');
  });

  it('keeps configured columns and their match field', () => {
    const columns = sdGenericImportColumns(schema({ import: { columns: [{ key: 'customer', matchField: 'code' }, { key: 'gone' }] } }));
    expect(columns.map(column => [column.key, column.matchField])).toEqual([['customer', 'code']]);
  });

  it('maps enum cells by value or label and relation cells through the lookup (AC-019)', () => {
    const columns = sdGenericImportColumns(schema());
    const lookups = new Map([['customer', new Map<string, unknown>([['Lan', 7]])]]);
    expect(sdGenericParseImportRow({ code: 'SO1', status: 'Done', customer: 'Lan', amount: 5 }, columns, lookups)).toEqual({
      data: { code: 'SO1', status: 'DONE', customer: 7, amount: 5 },
      errors: [],
    });
    expect(sdGenericParseImportRow({ code: 'SO2', status: 'NEW' }, columns, lookups).data['status']).toBe('NEW');
    const failed = sdGenericParseImportRow({ code: 'SO3', status: 'Lost', customer: 'Nobody' }, columns, lookups);
    expect(failed.errors).toEqual([
      { key: 'status', code: 'enum-unknown', value: 'Lost' },
      { key: 'customer', code: 'relation-not-found', value: 'Nobody' },
    ]);
  });

  it('updates rows whose upsert key exists and creates the others (AC-019)', () => {
    const rows = [{ code: 'A' }, { code: 'B' }, { code: 'C' }];
    const existing = new Map<string, string>([['B', '42']]);
    expect(sdGenericPlanUpsert(rows, 'code', existing)).toEqual([
      { kind: 'create', data: { code: 'A' } },
      { kind: 'update', id: '42', data: { code: 'B' } },
      { kind: 'create', data: { code: 'C' } },
    ]);
    expect(sdGenericPlanUpsert(rows, undefined, existing).every(op => op?.kind === 'create')).toBeTrue();
  });

  it('does not plan a row whose upsert key matches several records', () => {
    const existing = sdGenericLookupMap([
      ['B', '42'],
      ['B', '43'],
      ['C', '44'],
    ]);
    expect(sdGenericPlanUpsert([{ code: 'B' }, { code: 'C' }], 'code', existing)).toEqual([
      null,
      { kind: 'update', id: '44', data: { code: 'C' } },
    ]);
  });

  it('reports a relation cell that matches several records as ambiguous', () => {
    const columns = sdGenericImportColumns(schema());
    const lookups = new Map([
      [
        'customer',
        sdGenericLookupMap([
          ['Lan', 7],
          ['Lan', 8],
          ['Minh', 9],
          ['Minh', 9],
        ]),
      ],
    ]);
    expect(lookups.get('customer')!.get('Minh')).withContext('the same record twice is not ambiguous').toBe(9);
    expect(sdGenericParseImportRow({ code: 'SO1', customer: 'Lan' }, columns, lookups).errors).toEqual([
      { key: 'customer', code: 'match-ambiguous', value: 'Lan' },
    ]);
    expect(lookups.get('customer')!.get('Lan')).toBe(SD_GENERIC_AMBIGUOUS);
  });

  it('splits lookup values into batches', () => {
    expect(sdGenericChunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(sdGenericChunk([], 2)).toEqual([]);
  });

  it('never runs more than the limit at once and keeps the result order (AC-019)', async () => {
    let running = 0;
    let peak = 0;
    const results = await sdGenericRunLimited([1, 2, 3, 4, 5, 6, 7, 8], 5, async value => {
      running++;
      peak = Math.max(peak, running);
      await new Promise(resolve => setTimeout(resolve, 5));
      running--;
      if (value === 3) throw new Error('boom');
      return value * 10;
    });
    expect(peak).toBe(5);
    expect(results.map(result => (result.status === 'fulfilled' ? result.value : 'x'))).toEqual([10, 20, 'x', 40, 50, 60, 70, 80]);
  });
});
