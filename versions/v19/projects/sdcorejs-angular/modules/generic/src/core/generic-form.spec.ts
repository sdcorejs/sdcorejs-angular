import type { SdFormGenericField, SdFormGenericSchema } from '@sdcorejs/angular/components/form-generic';
import type { SdGenericSchema } from '../models';
import { SD_GENERIC_RELATION_CATALOG, sdGenericBuildForm, sdGenericFieldType, sdGenericFormPayload } from './generic-form';

const schema = (extra: Partial<SdGenericSchema> = {}): SdGenericSchema => ({
  version: 1,
  module: 'tms',
  entity: 'order',
  general: {
    label: 'Order',
    properties: [
      { key: 'id', label: 'Id', dataType: 'string', system: true },
      {
        key: 'code',
        label: 'Code',
        dataType: 'string',
        format: 'email',
        validation: { required: true, maxLength: 20, pattern: '^[A-Z]+$' },
      },
      { key: 'note', label: 'Note', dataType: 'text' },
      { key: 'qty', label: 'Qty', dataType: 'number', format: 'integer', updatable: false, defaultValue: 1 },
      {
        key: 'status',
        label: 'Status',
        dataType: 'enum',
        enums: [
          { value: 'NEW', label: 'New' },
          { value: 'DONE', label: 'Done' },
        ],
      },
      {
        key: 'customer',
        label: 'Customer',
        dataType: 'relation',
        relation: { entity: 'customer', displayField: 'name', searchFields: ['code', 'name'] },
      },
      { key: 'tags', label: 'Tags', dataType: 'string', multiple: true },
      { key: 'due', label: 'Due', dataType: 'date' },
      { key: 'start', label: 'Start', dataType: 'time' },
      { key: 'meta', label: 'Meta', dataType: 'json' },
    ],
  },
  ...extra,
});

const fields = (form: SdFormGenericSchema): SdFormGenericField[] =>
  form.pages.flatMap(page =>
    page.elements.flatMap(element => (element.type === 'group' ? element.elements : [element]))
  ) as SdFormGenericField[];
const keysOf = (form: SdFormGenericSchema) => fields(form).map(field => field.key);
const byKey = (form: SdFormGenericSchema, key: string) => fields(form).find(field => field.key === key) as unknown as Record<string, any>;

describe('generic form building', () => {
  it('maps every data type to a form-generic field type', () => {
    const types = schema().general.properties.map(sdGenericFieldType);
    expect(types).toEqual(['textfield', 'textfield', 'textarea', 'number', 'select', 'select', 'chip-string', 'datetime', 'time', 'json']);
    expect(sdGenericFieldType({ key: 'b', label: 'B', dataType: 'boolean' })).toBe('checkbox');
    expect(sdGenericFieldType({ key: 'f', label: 'F', dataType: 'file' })).toBe('upload');
  });

  it('generates the create, update and detail forms from the properties (AC-015)', () => {
    const create = sdGenericBuildForm(schema(), 'create');
    const update = sdGenericBuildForm(schema(), 'update');
    const detail = sdGenericBuildForm(schema(), 'detail');
    expect(keysOf(create)).toEqual(['code', 'note', 'qty', 'status', 'customer', 'tags', 'due', 'start', 'meta']);
    expect(keysOf(update))
      .withContext('no system and no non-updatable property')
      .toEqual(['code', 'note', 'status', 'customer', 'tags', 'due', 'start', 'meta']);
    expect(keysOf(detail)).withContext('detail shows system properties').toContain('id');
  });

  it('fills label, type, options and validation of every field from general (AC-015)', () => {
    const create = sdGenericBuildForm(schema(), 'create');
    expect(byKey(create, 'code')).toEqual(
      jasmine.objectContaining({
        type: 'textfield',
        label: 'Code',
        subtype: 'email',
        validation: jasmine.objectContaining({ required: true, maxLength: 20, pattern: { value: '^[A-Z]+$' } }),
      })
    );
    expect(byKey(create, 'qty')).toEqual(jasmine.objectContaining({ type: 'number', subtype: 'integer', defaultValue: 1 }));
    expect(byKey(sdGenericBuildForm(schema(), 'detail'), 'qty')['defaultValue'])
      .withContext('a default never replaces an empty value of an existing record')
      .toBeUndefined();
    expect(byKey(create, 'status')['options']).toEqual({
      source: 'static',
      items: [
        { value: 'NEW', label: 'New' },
        { value: 'DONE', label: 'Done' },
      ],
    });
    expect(byKey(create, 'due')).toEqual(jasmine.objectContaining({ type: 'datetime', subtype: 'date' }));
  });

  it('points relation fields to the relation catalog with constant params per relation (D-022)', () => {
    const customer = byKey(sdGenericBuildForm(schema(), 'create'), 'customer');
    expect(customer['options'].source).toBe('catalog');
    expect(customer['options'].catalog).toBe(SD_GENERIC_RELATION_CATALOG);
    const params = Object.fromEntries(customer['options'].params.map((param: any) => [param.name, param.value.value]));
    expect(params).toEqual({
      module: 'tms',
      entity: 'customer',
      valueField: 'id',
      displayField: 'name',
      searchFields: 'code,name',
      display: '',
    });
  });

  it('keeps the stored layout but takes field data from general and drops what the action forbids (AC-015)', () => {
    const detailForm = {
      pages: [
        {
          id: 'p',
          elements: [
            {
              id: 'g',
              type: 'group',
              label: 'Main',
              elements: [{ id: 'c', key: 'code', type: 'textfield', label: 'Stale', layout: { span: { desktop: 6 } } }],
            },
            { id: 'q', key: 'qty', type: 'number', label: 'Q' },
            { id: 'x', key: 'gone', type: 'textfield', label: 'Gone' },
          ],
        },
      ],
    } as unknown as SdFormGenericSchema;
    const update = sdGenericBuildForm(schema({ detail: { form: detailForm } }), 'update');
    expect(keysOf(update)).toEqual(['code']);
    const code = byKey(update, 'code');
    expect(code['label']).toBe('Code');
    expect(code['layout']).toEqual({ span: { desktop: 6 } });
    expect(update.pages[0].elements[0]).toEqual(jasmine.objectContaining({ type: 'group', label: 'Main' }));
  });

  it('prefers the layout of the action over the detail layout', () => {
    const own = {
      pages: [{ id: 'p', elements: [{ id: 'n', key: 'note', type: 'textarea', label: 'N' }] }],
    } as unknown as SdFormGenericSchema;
    const detailForm = {
      pages: [{ id: 'p', elements: [{ id: 'c', key: 'code', type: 'textfield', label: 'C' }] }],
    } as unknown as SdFormGenericSchema;
    expect(keysOf(sdGenericBuildForm(schema({ detail: { form: detailForm }, create: { form: own } }), 'create'))).toEqual(['note']);
    expect(keysOf(sdGenericBuildForm(schema({ detail: { form: detailForm } }), 'create'))).toEqual(['code']);
  });

  it('sends only insertable values on create and only updatable values on update (AC-015)', () => {
    const value = { id: 'X', code: 'A', qty: 3, status: 'NEW', extra: 1 };
    expect(sdGenericFormPayload(schema(), 'create', value)).toEqual({ code: 'A', qty: 3, status: 'NEW' });
    expect(sdGenericFormPayload(schema(), 'update', value)).toEqual({ code: 'A', status: 'NEW' });
  });
});
