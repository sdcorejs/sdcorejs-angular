import { TestBed } from '@angular/core/testing';
import type { PagingReq } from '@sdcorejs/utils/models';
import type { SdGenericAdapter, SdGenericRecord, SdGenericSchema, SdGenericSearchReq } from '../models';
import { provideSdGeneric, provideSdGenericEntity } from '../registry/provide-sd-generic';
import { SdGenericDataService } from './generic-data.service';

const schema = (): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'number', system: true },
      { key: 'code', label: 'Code', dataType: 'string' },
      { key: 'customer', label: 'Customer', dataType: 'relation', relation: { entity: 'customer', displayField: 'name' } },
      {
        key: 'warehouse',
        label: 'Warehouse',
        dataType: 'relation',
        relation: { module: 'wms', entity: 'warehouse', displayField: 'name' },
      },
    ],
  },
});

const stubAdapter = (module: string, withSearch: boolean) => {
  const adapter = jasmine.createSpyObj<Required<SdGenericAdapter>>(`${module}-adapter`, [
    'schema',
    'query',
    'detail',
    'create',
    'update',
    'delete',
    'search',
  ]);
  (adapter as { module: string }).module = module;
  adapter.query.and.resolveTo({ items: [{ id: 1, name: 'Main' }], total: 1 });
  adapter.search.and.resolveTo([{ id: 7, name: 'Lan' }]);
  adapter.create.and.callFake(async (_entity, data) => ({ id: 99, ...data }));
  adapter.update.and.callFake(async (_entity, id, data) => ({ id, ...data }));
  if (!withSearch) delete (adapter as Partial<SdGenericAdapter>).search;
  return adapter;
};

describe('SdGenericDataService', () => {
  let tms: jasmine.SpyObj<Required<SdGenericAdapter>>;
  let wms: jasmine.SpyObj<Required<SdGenericAdapter>>;
  let entitySearch: jasmine.Spy<(req: SdGenericSearchReq) => Promise<SdGenericRecord[]>>;
  let beforeSave: jasmine.Spy;
  let afterSave: jasmine.Spy;
  let service: SdGenericDataService;

  beforeEach(() => {
    tms = stubAdapter('tms', true);
    wms = stubAdapter('wms', false);
    entitySearch = jasmine.createSpy('entitySearch').and.resolveTo([{ id: 5, name: 'Ha' }]);
    beforeSave = jasmine.createSpy('beforeSave').and.callFake(async ({ data }) => ({ ...data, source: 'portal' }));
    afterSave = jasmine.createSpy('afterSave');
    TestBed.configureTestingModule({
      providers: [
        provideSdGeneric({ adapters: [tms, wms] }),
        provideSdGenericEntity({ module: 'tms', entity: 'vip', search: entitySearch }),
        provideSdGenericEntity({ module: 'tms', entity: 'order', hooks: { beforeSave, afterSave } }),
        SdGenericDataService,
      ],
    });
    service = TestBed.inject(SdGenericDataService);
  });

  it('passes the list request to the adapter unchanged (AC-001)', async () => {
    const req: PagingReq = { pageNumber: 0, pageSize: 20, orders: [{ field: 'code', direction: 'ASC' }], filters: [] };
    await service.query('tms', 'order', req);
    expect(tms.query).toHaveBeenCalledWith('order', req);
  });

  it('searches with the entity search, then the adapter search, then query (AC-016)', async () => {
    const req: SdGenericSearchReq = { term: 'a', fields: ['name'], valueField: 'id' };
    expect(await service.search('tms', 'vip', req)).toEqual([{ id: 5, name: 'Ha' }]);
    expect(entitySearch).toHaveBeenCalledWith(req);
    expect(tms.search).not.toHaveBeenCalled();

    expect(await service.search('tms', 'customer', req)).toEqual([{ id: 7, name: 'Lan' }]);
    expect(tms.search).toHaveBeenCalledWith('customer', req);

    expect(await service.search('wms', 'warehouse', { values: [1], fields: ['name'], valueField: 'id' })).toEqual([
      { id: 1, name: 'Main' },
    ]);
    expect(wms.query).toHaveBeenCalledWith(
      'warehouse',
      jasmine.objectContaining({ filters: [{ field: 'id', operator: 'IN', data: [1] }] })
    );
  });

  it('serves relation options as strings and saves the original value type (D-022)', async () => {
    const items = await service.relationItems(
      { module: 'tms', entity: 'customer', valueField: 'id', displayField: 'name', searchFields: 'name', display: '' },
      { term: 'L' }
    );
    expect(items).toEqual([{ value: '7', label: 'Lan', data: { id: 7, name: 'Lan' } }]);
    await service.save(schema(), 'create', { code: 'SO1', customer: '7' });
    expect(tms.create).toHaveBeenCalledWith('order', jasmine.objectContaining({ code: 'SO1', customer: 7 }));
  });

  it('turns stored relation values into option strings for the form and back on save', async () => {
    const value = service.toFormValue(schema(), { id: 3, code: 'SO3', customer: 7, warehouse: [1, 2] });
    expect(value).toEqual({ id: 3, code: 'SO3', customer: '7', warehouse: ['1', '2'] });
    await service.save(schema(), 'update', value, '3');
    expect(tms.update).toHaveBeenCalledWith('order', '3', jasmine.objectContaining({ customer: 7, warehouse: [1, 2] }));
  });

  it('looks option strings up with the original value type (INV-008)', async () => {
    service.toFormValue(schema(), { id: 3, code: 'SO3', customer: 7 });
    const params = { module: 'tms', entity: 'customer', valueField: 'id', displayField: 'name', searchFields: 'name', display: '' };
    await service.relationItems(params, { values: ['7'] });
    expect(tms.search).toHaveBeenCalledWith('customer', jasmine.objectContaining({ values: [7] }));
  });

  it('remembers at most 500 option values per relation, forgetting the oldest first', async () => {
    for (let id = 1; id <= 501; id++) service.toFormValue(schema(), { id, code: `SO${id}`, customer: id });
    const params = { module: 'tms', entity: 'customer', valueField: 'id', displayField: 'name', searchFields: 'name', display: '' };
    await service.relationItems(params, { values: ['1', '501'] });
    expect(tms.search).toHaveBeenCalledWith('customer', jasmine.objectContaining({ values: ['1', 501] }));
  });

  it('runs beforeSave on the payload and afterSave once after success (AC-017)', async () => {
    const result = await service.save(schema(), 'create', { id: 1, code: 'SO1' });
    expect(beforeSave).toHaveBeenCalledWith(jasmine.objectContaining({ action: 'create', data: { code: 'SO1' } }));
    expect(tms.create).toHaveBeenCalledWith('order', { code: 'SO1', source: 'portal' });
    expect(afterSave).toHaveBeenCalledTimes(1);
    expect(afterSave).toHaveBeenCalledWith(jasmine.objectContaining({ action: 'create', result }));
  });

  it('does not run afterSave when the adapter fails (AC-017)', async () => {
    tms.update.and.rejectWith(new Error('conflict'));
    await expectAsync(service.save(schema(), 'update', { code: 'X' }, '1')).toBeRejectedWithError('conflict');
    expect(afterSave).not.toHaveBeenCalled();
  });

  it('labels related records with the display template for table lookups', async () => {
    const property = {
      ...schema().general.properties[2],
      relation: { entity: 'customer', displayField: 'name', display: '#${id} ${name}' },
    };
    const records = await service.relationViews(schema(), property)(['7']);
    expect(records).toEqual([{ id: 7, name: 'Lan', $label: '#7 Lan' }]);
    expect(tms.search).toHaveBeenCalledWith('customer', jasmine.objectContaining({ values: ['7'], valueField: 'id' }));
  });

  it('rejects calls for a module without an adapter', async () => {
    await expectAsync(service.query('nope', 'x', {})).toBeRejectedWithError(/nope/);
  });
});
