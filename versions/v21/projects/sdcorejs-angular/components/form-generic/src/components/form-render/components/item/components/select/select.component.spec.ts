import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import type { SdSearch } from '@sdcorejs/angular/forms/models';
import { provideSdFormGeneric } from '../../../../../../configurations/form-generic.provider';
import type { SdFormGenericSchema } from '../../../../../../models/form-generic-schema.model';
import { SdFormRender } from '../../../../form-render.component';
import { SelectComponent } from './select.component';

const schema = {
  pages: [
    {
      id: 'p',
      elements: [
        { id: 'f-city', key: 'city', type: 'textfield', label: 'City' },
        {
          id: 'f-district',
          key: 'district',
          type: 'select',
          label: 'District',
          options: {
            source: 'catalog',
            catalog: 'districts',
            params: [{ name: 'provinceId', value: { field: 'city' } }],
            fill: [{ field: 'note', from: 'name' }],
          },
        },
        {
          id: 'f-ward',
          key: 'ward',
          type: 'select',
          label: 'Ward',
          options: { source: 'catalog', catalog: 'wards', params: [{ name: 'districtId', value: { field: 'district' } }] },
        },
        {
          id: 'f-kind',
          key: 'kind',
          type: 'select',
          label: 'Kind',
          options: {
            source: 'static',
            items: [
              { value: 'b', label: 'Beta' },
              { value: 'a', label: 'Alpha' },
            ],
          },
        },
        { id: 'f-note', key: 'note', type: 'textfield', label: 'Note' },
      ],
    },
  ],
} as unknown as SdFormGenericSchema;

describe('lib-select options', () => {
  let fixture: ComponentFixture<SdFormRender>;
  let load: jasmine.Spy;
  let search: jasmine.Spy;

  const select = (key: string) =>
    fixture.debugElement
      .queryAll(By.directive(SelectComponent))
      .map(debug => debug.componentInstance as SelectComponent)
      .find(component => component.field().key === key)!;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    localStorage.setItem('sd-core.language', 'vi');
    load = jasmine
      .createSpy('load')
      .and.callFake(async (params: Record<string, unknown>) => [
        { value: `${params['provinceId']}-1`, label: 'Q1', data: { name: `Quận 1 (${params['provinceId']})` } },
      ]);
    search = jasmine.createSpy('search').and.resolveTo([{ value: 'w1', label: 'Ward 1' }]);
    TestBed.configureTestingModule({
      imports: [SdFormRender, NoopAnimationsModule],
      providers: [
        provideSdFormGeneric({
          catalogs: [
            { id: 'districts', label: 'Districts', load },
            { id: 'wards', label: 'Wards', load: async () => [], search },
          ],
        }),
      ],
    });
    fixture = TestBed.createComponent(SdFormRender);
    fixture.componentRef.setInput('schema', schema);
    fixture.componentRef.setInput('value', { city: '79' });
    await settle();
  });

  afterEach(() => fixture.destroy());

  it('loads the catalog with resolved params and loads again when the source field changes', async () => {
    expect(load).toHaveBeenCalledWith({ provinceId: '79' }, jasmine.objectContaining({ value: jasmine.objectContaining({ city: '79' }) }));
    expect(select('district').items()).toEqual([{ value: '79-1', label: 'Q1', data: { name: 'Quận 1 (79)' } }]);

    fixture.componentRef.setInput('value', { city: '1' });
    await settle();
    expect(load).toHaveBeenCalledWith({ provinceId: '1' }, jasmine.anything());
    expect(select('district').items()).toEqual([{ value: '1-1', label: 'Q1', data: { name: 'Quận 1 (1)' } }]);
  });

  it('does not reload when an unrelated field changes', async () => {
    const calls = load.calls.count();
    fixture.componentRef.setInput('value', { city: '79', note: 'typing' });
    await settle();
    expect(load.calls.count()).toBe(calls);
  });

  it('fills the target field from item.data when the user picks an item', async () => {
    select('district').select('79-1');
    await settle();
    expect(fixture.componentInstance.value()).toEqual(jasmine.objectContaining({ district: '79-1', note: 'Quận 1 (79)' }));
    select('district').select(null);
    await settle();
    expect(fixture.componentInstance.value()).toEqual(jasmine.objectContaining({ district: null, note: null }));
  });

  it('searches by term when the catalog has search', async () => {
    fixture.componentRef.setInput('value', { city: '79', district: '79-1' });
    await settle();
    const items = select('ward').items() as SdSearch;
    expect(typeof items).toBe('function');
    expect(await items({ type: 'SEARCH', searchText: 'ph' })).toEqual([{ value: 'w1', label: 'Ward 1' }]);
    expect(search).toHaveBeenCalledWith('ph', { districtId: '79-1' }, jasmine.anything());
  });

  it('keeps static items in their declared order', () => {
    expect(select('kind').items()).toEqual([
      { value: 'b', label: 'Beta' },
      { value: 'a', label: 'Alpha' },
    ]);
  });
});
