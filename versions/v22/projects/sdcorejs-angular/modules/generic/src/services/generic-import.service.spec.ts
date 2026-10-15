import { TestBed } from '@angular/core/testing';
import type { PagingReq } from '@sdcorejs/utils/models';
import type { SdGenericAdapter, SdGenericSchema } from '../models';
import { provideSdGeneric, provideSdGenericEntity } from '../registry/provide-sd-generic';
import { SdGenericDataService } from './generic-data.service';
import { SdGenericImportService } from './generic-import.service';

const schema = (): SdGenericSchema => ({
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
    ],
  },
  import: { upsertKey: 'code' },
});

describe('SdGenericImportService', () => {
  let adapter: jasmine.SpyObj<Required<SdGenericAdapter>>;
  let service: SdGenericImportService;
  let beforeSave: jasmine.Spy;

  beforeEach(() => {
    adapter = jasmine.createSpyObj<Required<SdGenericAdapter>>('adapter', [
      'schema',
      'query',
      'detail',
      'create',
      'update',
      'delete',
      'search',
    ]);
    (adapter as { module: string }).module = 'tms';
    adapter.query.and.callFake(async (_entity: string, req: PagingReq) => {
      const codes = (req.filters?.[0] as { data?: string[] } | undefined)?.data ?? [];
      return { items: codes.includes('SO2') ? [{ id: '42', code: 'SO2' }] : [], total: 1 };
    });
    adapter.search.and.resolveTo([{ id: 7, name: 'Lan' }]);
    adapter.create.and.callFake(async (_entity, data) => ({ id: 'new', ...data }));
    adapter.update.and.callFake(async (_entity, id, data) => ({ id, ...data }));
    beforeSave = jasmine.createSpy('beforeSave').and.callFake(async ({ data }) => data);
    TestBed.configureTestingModule({
      providers: [
        provideSdGeneric({ adapters: [adapter] }),
        provideSdGenericEntity({ module: 'tms', entity: 'order', hooks: { beforeSave } }),
        SdGenericDataService,
        SdGenericImportService,
      ],
    });
    service = TestBed.inject(SdGenericImportService);
  });

  it('updates rows whose upsert key exists and creates the others (AC-019)', async () => {
    const results = await service.run(schema(), [
      { code: 'SO1', status: 'New', customer: 'Lan' },
      { code: 'SO2', status: 'DONE' },
      { code: 'SO3' },
    ]);
    expect(results.map(result => result.status)).toEqual(['created', 'updated', 'created']);
    expect(adapter.update).toHaveBeenCalledOnceWith('order', '42', jasmine.objectContaining({ code: 'SO2', status: 'DONE' }));
    expect(adapter.create).toHaveBeenCalledWith('order', jasmine.objectContaining({ code: 'SO1', status: 'NEW', customer: 7 }));
    expect(adapter.create).toHaveBeenCalledTimes(2);
    expect(adapter.search).toHaveBeenCalledWith('customer', jasmine.objectContaining({ values: ['Lan'], valueField: 'name' }));
    expect(beforeSave).withContext('saves go through the data service hooks').toHaveBeenCalledTimes(3);
  });

  it('reports cells that cannot be converted and does not save their row (AC-019)', async () => {
    adapter.search.and.resolveTo([]);
    const results = await service.run(schema(), [{ code: 'SO9', status: 'Lost', customer: 'Nobody' }]);
    expect(results[0].status).toBe('error');
    expect(results[0].errors.map(error => error.code)).toEqual(['enum-unknown', 'relation-not-found']);
    expect(adapter.create).not.toHaveBeenCalled();
  });

  it('reports an adapter failure on its own row only', async () => {
    adapter.create.and.callFake(async (_entity, data) => {
      if (data['code'] === 'SO3') throw new Error('duplicate');
      return { id: 'new', ...data };
    });
    const results = await service.run(schema(), [{ code: 'SO1' }, { code: 'SO3' }]);
    expect(results.map(result => result.status)).toEqual(['created', 'error']);
    expect(results[1].message).toBe('duplicate');
  });

  it('looks existing records up in batches and reads every page of a batch (INV-014)', async () => {
    const stored = Array.from({ length: 150 }, (_, index) => ({ id: `id${index}`, code: `SO${index}` }));
    adapter.query.and.callFake(async (_entity: string, req: PagingReq) => {
      const codes = (req.filters?.[0] as { data: string[] }).data;
      const matches = stored.filter(record => codes.includes(record.code));
      // A backend that caps the page size at 30.
      return { items: matches.slice(req.pageNumber! * 30, req.pageNumber! * 30 + 30), total: matches.length };
    });
    const results = await service.run(
      schema(),
      Array.from({ length: 150 }, (_, index) => ({ code: `SO${index}` }))
    );
    const batches = adapter.query.calls.allArgs().map(([, req]) => (req.filters?.[0] as { data: string[] }).data.length);
    expect(Math.max(...batches)).toBeLessThanOrEqual(100);
    expect(results.every(result => result.status === 'updated'))
      .withContext('no existing record turned into a create')
      .toBeTrue();
    expect(adapter.create).not.toHaveBeenCalled();
  });

  it('reports a row whose upsert key matches several records instead of saving it', async () => {
    adapter.query.and.resolveTo({
      items: [
        { id: '1', code: 'SO1' },
        { id: '2', code: 'SO1' },
      ],
      total: 2,
    });
    const results = await service.run(schema(), [{ code: 'SO1' }, { code: 'SO5' }]);
    expect(results[0]).toEqual({ index: 0, status: 'error', errors: [{ key: 'code', code: 'match-ambiguous', value: 'SO1' }] });
    expect(results[1].status).toBe('created');
    expect(adapter.update).not.toHaveBeenCalled();
  });

  it('searches relation values in batches of at most 100', async () => {
    adapter.search.and.resolveTo([]);
    await service.run(
      schema(),
      Array.from({ length: 230 }, (_, index) => ({ code: `SO${index}`, customer: `C${index}` }))
    );
    expect(adapter.search.calls.allArgs().map(([, req]) => req.values!.length)).toEqual([100, 100, 30]);
  });

  it('never runs more than five saves at the same time (AC-019)', async () => {
    let running = 0;
    let peak = 0;
    adapter.create.and.callFake(async (_entity, data) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise(resolve => setTimeout(resolve, 5));
      running--;
      return data;
    });
    const value = schema();
    delete value.import;
    await service.run(
      value,
      Array.from({ length: 12 }, (_, index) => ({ code: `SO${index}` }))
    );
    expect(peak).toBe(5);
  });
});
