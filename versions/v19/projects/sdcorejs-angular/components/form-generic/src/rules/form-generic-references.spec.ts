import type { SdFormGenericSchema } from '../models/form-generic-schema.model';
import { sdFindKeyReferences, sdRenameKey } from './form-generic-references';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(child => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
};

const schema = (): SdFormGenericSchema =>
  deepFreeze({
    pages: [
      {
        id: 'p',
        elements: [
          { id: 'f-city', key: 'city', type: 'select', label: 'City', options: { source: 'static', items: [] } },
          {
            id: 'f-district',
            key: 'district',
            type: 'select',
            label: 'District',
            rules: {
              visible: { field: 'city', operator: 'NOT_NULL' },
              required: { operator: 'AND', data: [{ field: 'price', operator: 'GREATER_THAN', dataType: 'field', data: 'city' }] },
            },
            options: {
              source: 'catalog',
              catalog: 'districts',
              params: [
                { name: 'provinceId', value: { field: 'city' } },
                { name: 'tenant', value: { variable: 'tenant' } },
              ],
              fill: [{ field: 'city', from: 'provinceName' }],
            },
            hyperlink: '/city/${city}',
          },
          {
            id: 'g',
            type: 'group',
            label: 'Files',
            rules: { hidden: { field: 'city', operator: 'NULL' } },
            elements: [
              { id: 'f-file', key: 'file', type: 'upload', label: 'File', params: [{ name: 'folder', value: { field: 'city' } }] },
              {
                id: 'f-html',
                type: 'html',
                definition: 'summary',
                query: [{ name: 'cityId', value: { field: 'city' } }],
                content: 'City: ${city}',
              },
            ],
          },
          { id: 'f-price', key: 'price', type: 'number', label: 'Price' },
        ],
      },
    ],
    variables: [{ key: 'tenant', label: 'Tenant' }],
    validations: [{ type: 'filter', filter: { field: 'city', operator: 'EQUAL', data: 'HN' }, message: 'x', alert: 'warning' }],
  }) as unknown as SdFormGenericSchema;

describe('form generic key references', () => {
  it('finds every structured reference and counts free-text ones separately', () => {
    const references = sdFindKeyReferences(schema(), 'city');
    const structured: string[] = references.filter(ref => ref.kind === 'structured').map(ref => ref.where);
    const text: string[] = references.filter(ref => ref.kind === 'text').map(ref => ref.where);
    expect(structured.sort()).toEqual(
      ['group-rule', 'html-query', 'options-fill', 'options-param', 'rule', 'rule', 'upload-param', 'validation'].sort()
    );
    expect(text.sort()).toEqual(['html-content', 'hyperlink']);
  });

  it('renames the key and every structured reference, leaves free text, and never mutates input', () => {
    const input = schema();
    const renamed = sdRenameKey(input, 'city', 'province');
    const json = JSON.stringify(renamed);
    expect(sdFindKeyReferences(renamed, 'city').filter(ref => ref.kind === 'structured')).toEqual([]);
    expect(sdFindKeyReferences(renamed, 'province').filter(ref => ref.kind === 'structured').length).toBe(8);
    expect(json).toContain('"key":"province"');
    expect(json).toContain('/city/${city}');
    expect(json).toContain('City: ${city}');
    expect(json).toContain('"from":"provinceName"');
    expect(JSON.stringify(input)).toContain('"key":"city"');
  });

  it('renames a variable key and its value references', () => {
    const renamed = sdRenameKey(schema(), 'tenant', 'org');
    expect(renamed.variables).toEqual([{ key: 'org', label: 'Tenant' }]);
    expect(JSON.stringify(renamed)).toContain('{"variable":"org"}');
  });

  it('rejects a target key that already exists', () => {
    expect(() => sdRenameKey(schema(), 'city', 'price')).toThrowError(/price/);
    expect(() => sdRenameKey(schema(), 'city', 'tenant')).toThrowError(/tenant/);
  });

  it('walks hand-edited JSON without throwing: null entries, null children and a ref that is not an object', () => {
    const malformed = {
      pages: [
        null,
        {
          id: 'p',
          elements: [
            null,
            {
              id: 'a',
              key: 'a',
              type: 'textfield',
              label: 'A',
              rules: { visible: { operator: 'AND', data: [null, { field: 'b', operator: 'NULL' }] } },
            },
            {
              id: 's',
              key: 's',
              type: 'select',
              label: 'S',
              options: { source: 'catalog', catalog: 'c', params: [{ name: 'x', value: 'b' }], fill: [null] },
            },
            { id: 'b', key: 'b', type: 'textfield', label: 'B' },
          ],
        },
      ],
      variables: [null],
      validations: [null],
    } as unknown as SdFormGenericSchema;
    expect(sdFindKeyReferences(malformed, 'b').length).toBe(1);
    const renamed = sdRenameKey(malformed, 'b', 'c');
    expect((renamed.pages[1].elements[3] as { key: string }).key).toBe('c');
  });
});
