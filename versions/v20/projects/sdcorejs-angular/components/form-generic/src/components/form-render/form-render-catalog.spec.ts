import { TestBed } from '@angular/core/testing';
import { provideSdFormGeneric } from '../../configurations/form-generic.provider';
import type { SdFormGenericCatalog, SdFormGenericCatalogContext } from '../../models/form-generic-config.model';
import type { SdFormGenericField } from '../../models/form-generic-field.model';
import { FormRenderCatalog } from './form-render-catalog';

const context: SdFormGenericCatalogContext = {
  field: {
    id: 'f',
    key: 'district',
    type: 'select',
    label: 'District',
    options: { source: 'catalog', catalog: 'districts' },
  } as SdFormGenericField,
  value: { city: '79' },
  variables: {},
};

describe('FormRenderCatalog', () => {
  let load: jasmine.Spy;
  let search: jasmine.Spy;
  let labels: jasmine.Spy;

  const create = () => TestBed.runInInjectionContext(() => new FormRenderCatalog());

  beforeEach(() => {
    load = jasmine
      .createSpy('load')
      .and.callFake(async (params: Record<string, unknown>) => [
        { value: `${params['provinceId']}-1`, label: 'Q1', data: { name: 'Quận 1' } },
      ]);
    search = jasmine.createSpy('search').and.resolveTo([{ value: 's', label: 'Search hit' }]);
    labels = jasmine.createSpy('labels').and.resolveTo([{ value: '79-1', label: 'Q1' }]);
    const districts: SdFormGenericCatalog = { id: 'districts', label: 'Districts', load, search, labels };
    const cities: SdFormGenericCatalog = {
      id: 'cities',
      label: 'Cities',
      load: async () => [
        { value: '79', label: 'HCM' },
        { value: '1', label: 'HN' },
      ],
    };
    TestBed.configureTestingModule({ providers: [provideSdFormGeneric({ catalogs: [districts, cities] })] });
  });

  it('calls catalog.load with the resolved params once per catalog id + params', async () => {
    const catalog = create();
    const first = await catalog.load('districts', { provinceId: '79' }, context);
    const again = await catalog.load('districts', { provinceId: '79' }, context);
    expect(first).toEqual([{ value: '79-1', label: 'Q1', data: { name: 'Quận 1' } }]);
    expect(again).toEqual(first);
    expect(load).toHaveBeenCalledOnceWith({ provinceId: '79' }, context);
  });

  it('loads again when the resolved params change', async () => {
    const catalog = create();
    await catalog.load('districts', { provinceId: '79' }, context);
    await catalog.load('districts', { provinceId: '1' }, context);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not share its cache with another renderer instance', async () => {
    await create().load('districts', { provinceId: '79' }, context);
    await create().load('districts', { provinceId: '79' }, context);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('retries after a failed load instead of caching the failure', async () => {
    load.and.returnValues(Promise.reject(new Error('offline')), Promise.resolve([{ value: 'x', label: 'X' }]));
    const catalog = create();
    await expectAsync(catalog.load('districts', { provinceId: '79' }, context)).toBeRejected();
    expect(await catalog.load('districts', { provinceId: '79' }, context)).toEqual([{ value: 'x', label: 'X' }]);
  });

  it('searches by term when the catalog supports search', async () => {
    const catalog = create();
    expect(catalog.searchable('districts')).toBeTrue();
    expect(catalog.searchable('cities')).toBeFalse();
    expect(await catalog.search('districts', 'q', { provinceId: '79' }, context)).toEqual([{ value: 's', label: 'Search hit' }]);
    expect(search).toHaveBeenCalledOnceWith('q', { provinceId: '79' }, context);
  });

  it('resolves labels with catalog.labels, or from load when the catalog has none', async () => {
    const catalog = create();
    expect(await catalog.labels('districts', ['79-1'], {}, context)).toEqual({ '79-1': 'Q1' });
    expect(labels).toHaveBeenCalledOnceWith(['79-1'], {});
    expect(await catalog.labels('cities', ['1'], {}, context)).toEqual({ '1': 'HN' });
  });

  it('returns no items and warns once for a catalog that is not registered', async () => {
    const warn = spyOn(console, 'warn');
    const catalog = create();
    expect(await catalog.load('unknown', {}, context)).toEqual([]);
    expect(await catalog.load('unknown', { a: 1 }, context)).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
