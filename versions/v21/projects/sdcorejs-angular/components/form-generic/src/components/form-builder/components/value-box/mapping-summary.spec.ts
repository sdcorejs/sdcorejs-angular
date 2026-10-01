import type { SdFormGenericPageElement } from '../../../../models/form-generic-schema.model';
import { fillRows, mappingText, paramRows, referenceLabels, valueRefText } from './mapping-summary';

const elements = [
  { id: 'a', key: 'city', type: 'select', label: 'City', options: { source: 'static', items: [] } },
  { id: 'g', type: 'group', label: 'G', elements: [{ id: 'b', key: 'note', type: 'textfield', label: 'Note' }] },
  { id: 'h', type: 'html', label: 'H', content: '' },
] as unknown as SdFormGenericPageElement[];

describe('mapping-summary', () => {
  const labels = referenceLabels(elements, [{ key: 'tenant', label: 'Tenant' }]);

  it('labels fields in groups and variables by key', () => {
    expect([...labels.entries()]).toEqual([
      ['city', 'City'],
      ['note', 'Note'],
      ['tenant', 'Tenant'],
    ]);
  });

  it('shows a value reference as a field label, a prefixed variable label or the constant', () => {
    expect(valueRefText({ field: 'city' }, labels)).toBe('City');
    expect(valueRefText({ variable: 'tenant' }, labels, '[Biến] ')).toBe('[Biến] Tenant');
    expect(valueRefText({ value: 10 }, labels)).toBe('10');
    expect(valueRefText({ field: 'missing' }, labels)).toBe('missing');
  });

  it('lists params and fill targets as name = value rows', () => {
    const params = paramRows(
      [
        { name: 'provinceId', value: { field: 'city' } },
        { name: 'limit', value: { value: 5 } },
      ],
      labels,
      name => (name === 'provinceId' ? 'Tỉnh' : name)
    );
    expect(params).toEqual([
      { name: 'Tỉnh', value: 'City' },
      { name: 'limit', value: '5' },
    ]);
    expect(fillRows([{ field: 'note', from: 'name' }], labels, from => `#${from}`)).toEqual([{ name: 'Note', value: '#name' }]);
    expect(mappingText(params)).toBe('Tỉnh = City\nlimit = 5');
  });
});
