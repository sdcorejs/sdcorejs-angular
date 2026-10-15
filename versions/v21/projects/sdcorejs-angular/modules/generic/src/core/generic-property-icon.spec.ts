import type { SdDataTypeIconKey } from '@sdcorejs/angular/modules/icon';
import type { SdGenericProperty } from '../models';
import { sdGenericPropertyIconKey } from './generic-property-icon';

const property = (extra: Partial<SdGenericProperty> & Pick<SdGenericProperty, 'dataType'>): SdGenericProperty => ({
  key: 'field',
  label: 'Field',
  ...extra,
});

describe('sdGenericPropertyIconKey', () => {
  const cases: [Partial<SdGenericProperty> & Pick<SdGenericProperty, 'dataType'>, SdDataTypeIconKey][] = [
    [{ dataType: 'string' }, 'string'],
    [{ dataType: 'string', multiple: true }, 'string-list'],
    [{ dataType: 'string', format: 'email' }, 'email'],
    [{ dataType: 'string', format: 'phone' }, 'phone'],
    [{ dataType: 'string', format: 'url' }, 'url'],
    [{ dataType: 'string', format: 'password' }, 'password'],
    [{ dataType: 'string', format: 'email', multiple: true }, 'string-list'],
    [{ dataType: 'text' }, 'text'],
    [{ dataType: 'number' }, 'number'],
    [{ dataType: 'number', format: 'integer' }, 'integer'],
    [{ dataType: 'number', format: 'decimal' }, 'decimal'],
    [{ dataType: 'number', format: 'currency' }, 'currency'],
    [{ dataType: 'number', format: 'percent' }, 'percent'],
    [{ dataType: 'boolean' }, 'boolean'],
    [{ dataType: 'date' }, 'date'],
    [{ dataType: 'datetime' }, 'datetime'],
    [{ dataType: 'time' }, 'time'],
    [{ dataType: 'enum' }, 'enum'],
    [{ dataType: 'enum', multiple: true }, 'enum-multiple'],
    [{ dataType: 'relation' }, 'relation'],
    [{ dataType: 'relation', multiple: true }, 'relation'],
    [{ dataType: 'json' }, 'json'],
    [{ dataType: 'file' }, 'file'],
    [{ dataType: 'file', multiple: true }, 'file'],
  ];

  for (const [extra, key] of cases) {
    it(`maps ${JSON.stringify(extra)} to ${key} (AC-007)`, () => {
      expect(sdGenericPropertyIconKey(property(extra))).toBe(key);
    });
  }

  it('ignores a format that does not belong to the data type', () => {
    expect(sdGenericPropertyIconKey(property({ dataType: 'string', format: 'currency' }))).toBe('string');
    expect(sdGenericPropertyIconKey(property({ dataType: 'number', format: 'email' }))).toBe('number');
  });
});
