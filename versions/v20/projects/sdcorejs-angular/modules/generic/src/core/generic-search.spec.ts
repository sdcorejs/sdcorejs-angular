import type { SdGenericProperty } from '../models';
import { sdGenericCoerceValue, sdGenericRecordLabel, sdGenericRelationInfo, sdGenericSearchPagingReq } from './generic-search';

const customer: SdGenericProperty = {
  key: 'customer',
  label: 'Customer',
  dataType: 'relation',
  relation: { entity: 'customer', displayField: 'name', display: '${code} - ${name}' },
};

describe('generic relation search', () => {
  it('resolves relation defaults from the property and the schema module', () => {
    expect(sdGenericRelationInfo(customer, 'tms')).toEqual({
      module: 'tms',
      entity: 'customer',
      valueField: 'id',
      displayField: 'name',
      searchFields: ['name'],
      display: '${code} - ${name}',
    });
    const other: SdGenericProperty = {
      key: 'w',
      label: 'W',
      dataType: 'relation',
      relation: { module: 'wms', entity: 'warehouse', valueField: 'code', searchFields: ['code'] },
    };
    expect(sdGenericRelationInfo(other, 'tms')).toEqual(
      jasmine.objectContaining({ module: 'wms', valueField: 'code', displayField: 'code', searchFields: ['code'] })
    );
  });

  it('turns a term into an OR of CONTAIN filters over the search fields (AC-016)', () => {
    expect(sdGenericSearchPagingReq({ term: 'an', fields: ['code', 'name'], valueField: 'id', limit: 10 })).toEqual({
      pageNumber: 0,
      pageSize: 10,
      filters: [
        {
          operator: 'OR',
          data: [
            { field: 'code', operator: 'CONTAIN', data: 'an' },
            { field: 'name', operator: 'CONTAIN', data: 'an' },
          ],
        },
      ],
    });
  });

  it('turns values into an IN filter on the value field and keeps extra filters (AC-016)', () => {
    expect(
      sdGenericSearchPagingReq({
        values: [1, 2],
        fields: ['name'],
        valueField: 'id',
        filters: [{ field: 'active', operator: 'EQUAL', data: true }],
      })
    ).toEqual({
      pageNumber: 0,
      pageSize: 2,
      filters: [
        { field: 'active', operator: 'EQUAL', data: true },
        { field: 'id', operator: 'IN', data: [1, 2] },
      ],
    });
  });

  it('labels a record with the display template, then the display field', () => {
    const info = sdGenericRelationInfo(customer, 'tms');
    expect(sdGenericRecordLabel({ id: 1, code: 'C1', name: 'Lan' }, info)).toBe('C1 - Lan');
    expect(sdGenericRecordLabel({ id: 1, name: 'Lan' }, { ...info, display: undefined })).toBe('Lan');
    expect(sdGenericRecordLabel({ id: 7 }, { ...info, display: undefined })).toBe('7');
  });

  it('returns relation values with their original type (D-022)', () => {
    const known = new Map<string, unknown>([
      ['1', 1],
      ['2', 2],
    ]);
    expect(sdGenericCoerceValue('1', known)).toBe(1);
    expect(sdGenericCoerceValue(['1', '2'], known)).toEqual([1, 2]);
    expect(sdGenericCoerceValue('9', known)).toBe('9');
    expect(sdGenericCoerceValue(null, known)).toBeNull();
  });
});
