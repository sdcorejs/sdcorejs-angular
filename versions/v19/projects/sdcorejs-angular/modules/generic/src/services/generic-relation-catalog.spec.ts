import { EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SD_GENERIC_RELATION_CATALOG } from '../core';
import { SdGenericDataService } from './generic-data.service';
import { SdGenericCatalogBridge, sdGenericRelationCatalog } from './generic-relation-catalog';

describe('generic relation catalog', () => {
  const params = { module: 'tms', entity: 'customer', valueField: 'id', displayField: 'name', searchFields: 'name', display: '' };
  let data: { relationItems: jasmine.Spy };
  let bridge: SdGenericCatalogBridge;

  beforeEach(() => {
    data = { relationItems: jasmine.createSpy('relationItems').and.resolveTo([{ value: '7', label: 'Lan' }]) };
    TestBed.configureTestingModule({ providers: [{ provide: SdGenericDataService, useValue: data }] });
    bridge = new SdGenericCatalogBridge();
    bridge.attach(TestBed.inject(EnvironmentInjector));
  });

  it('is the catalog that relation fields point to (D-022)', () => {
    const catalog = sdGenericRelationCatalog(bridge);
    expect(catalog.id).toBe(SD_GENERIC_RELATION_CATALOG);
    expect(catalog.params!.map(param => param.name)).toEqual(['module', 'entity', 'valueField', 'displayField', 'searchFields', 'display']);
  });

  it('loads, searches and labels through the data service of the route injector (AC-016)', async () => {
    const catalog = sdGenericRelationCatalog(bridge);
    const context = { field: {} as never, value: {}, variables: {} };
    expect(await catalog.load(params, context)).toEqual([{ value: '7', label: 'Lan' }]);
    expect(data.relationItems).toHaveBeenCalledWith(params, {});
    await catalog.search!('la', params, context);
    expect(data.relationItems).toHaveBeenCalledWith(params, { term: 'la' });
    expect(await catalog.labels!(['7'], params)).toEqual([{ value: '7', label: 'Lan' }]);
    expect(data.relationItems).toHaveBeenCalledWith(params, { values: ['7'] });
  });

  it('fails clearly when used outside a generic route', async () => {
    const catalog = sdGenericRelationCatalog(new SdGenericCatalogBridge());
    await expectAsync(catalog.load(params, { field: {} as never, value: {}, variables: {} })).toBeRejectedWithError(/generic route/);
  });
});
