import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { provideSdFormGeneric } from '../configurations/form-generic.provider';
import type { SdFormGenericSchema } from '../models/form-generic-schema.model';
import { SdFormRenderService } from './form-render.service';

const schema = {
  pages: [
    {
      id: 'p',
      elements: [
        { id: 'f1', key: 'name', type: 'textfield', label: 'Name' },
        { id: 'f2', key: 'secret', type: 'textfield', subtype: 'password', label: 'Password' },
        {
          id: 'f3',
          key: 'status',
          type: 'radio',
          label: 'Status',
          options: { source: 'static', items: [{ value: 'a', label: 'Active' }] },
        },
        { id: 'f4', key: 'city', type: 'select', label: 'City', options: { source: 'catalog', catalog: 'cities' } },
        {
          id: 'f5',
          key: 'district',
          type: 'select',
          label: 'District',
          options: { source: 'catalog', catalog: 'districts', params: [{ name: 'cityId', value: { field: 'city' } }] },
        },
        { id: 'g', type: 'group', label: 'G', elements: [{ id: 'f6', key: 'price', type: 'number', subtype: 'currency', label: 'Price' }] },
        { id: 'f7', key: 'files', type: 'upload', label: 'Files' },
        { id: 'h', type: 'html', content: '<b>x</b>' },
      ],
    },
  ],
} as unknown as SdFormGenericSchema;

describe('SdFormRenderService.viewEntities', () => {
  let citiesLoad: jasmine.Spy;
  let districtLabels: jasmine.Spy;

  const create = (numberFormat?: '1.234.567,89') => {
    citiesLoad = jasmine.createSpy('citiesLoad').and.resolveTo([
      { value: '79', label: 'Hồ Chí Minh' },
      { value: '1', label: 'Hà Nội' },
    ]);
    districtLabels = jasmine.createSpy('districtLabels').and.resolveTo([{ value: '760', label: 'Quận 1' }]);
    TestBed.configureTestingModule({
      providers: [
        provideSdFormGeneric({
          catalogs: [
            { id: 'cities', label: 'Cities', load: citiesLoad },
            { id: 'districts', label: 'Districts', load: async () => [], labels: districtLabels },
          ],
        }),
        ...(numberFormat ? [{ provide: SD_CORE_CONFIGURATION, useValue: { format: { number: numberFormat } } }] : []),
      ],
    });
    return TestBed.inject(SdFormRenderService);
  };

  it('returns the display text of every field except upload and html', async () => {
    const [row] = await create().viewEntities(schema, [
      { name: 'Lan', secret: 'x', status: 'a', city: '79', district: '760', price: 1500000, files: [{}] },
    ]);
    expect(row).toEqual({
      name: 'Lan',
      secret: '••••••••',
      status: 'Active',
      city: 'Hồ Chí Minh',
      district: 'Quận 1',
      price: '1,500,000 VND',
    });
  });

  it('resolves catalog params from each entity and asks each catalog once per params and values', async () => {
    const service = create();
    await service.viewEntities(schema, [
      { city: '79', district: '760' },
      { city: '79', district: '760' },
    ]);
    expect(citiesLoad).toHaveBeenCalledTimes(1);
    expect(districtLabels).toHaveBeenCalledOnceWith(['760'], { cityId: '79' });
  });

  it('loads a catalog without `labels` once for all entities, whatever their values', async () => {
    const rows = await create().viewEntities(schema, [{ city: '79' }, { city: '1' }, { city: '79' }]);
    expect(citiesLoad).toHaveBeenCalledTimes(1);
    expect(rows.map(row => row['city'])).toEqual(['Hồ Chí Minh', 'Hà Nội', 'Hồ Chí Minh']);
  });

  it('uses the Core number format', async () => {
    const [row] = await create('1.234.567,89').viewEntities(schema, [{ price: 1500000 }]);
    expect(row['price']).toBe('1.500.000 VND');
    expect(row['name']).toBe('--');
  });
});
