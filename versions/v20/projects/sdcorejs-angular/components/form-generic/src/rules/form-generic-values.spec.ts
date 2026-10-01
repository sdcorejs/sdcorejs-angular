import type { SdFormGenericSchema } from '../models/form-generic-schema.model';
import { sdApplyDefaults, sdCatalogKey, sdFillPatch, sdResolveParams, sdResolveValueRef, sdValueKeys } from './form-generic-values';

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(child => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
};

const schema = deepFreeze({
  pages: [
    {
      id: 'p',
      elements: [
        { id: 'f1', key: 'name', type: 'textfield', label: 'Name', defaultValue: 'Guest' },
        { id: 'f2', key: 'secret', type: 'textfield', subtype: 'password', label: 'Password', defaultValue: 'x' },
        { id: 'g', type: 'group', label: 'G', elements: [{ id: 'f3', key: 'age', type: 'number', label: 'Age', defaultValue: 18 }] },
        { id: 'f4', key: 'note', type: 'textarea', label: 'Note' },
        { id: 'h', type: 'html', content: '<b>Hi</b>' },
        { id: 's', type: 'heading', content: 'Unknown' },
      ],
    },
  ],
}) as unknown as SdFormGenericSchema;

describe('form generic values', () => {
  describe('value references', () => {
    it('resolves a field, a variable and a constant', () => {
      const value = { city: 'HCM' };
      const variables = { tenant: 't1' };
      expect(sdResolveValueRef({ field: 'city' }, value, variables)).toBe('HCM');
      expect(sdResolveValueRef({ variable: 'tenant' }, value, variables)).toBe('t1');
      expect(sdResolveValueRef({ value: 5 }, value, variables)).toBe(5);
      expect(sdResolveValueRef({ field: 'missing' }, value, variables)).toBeUndefined();
    });

    it('resolves a parameter list into a record', () => {
      const params = [
        { name: 'provinceId', value: { field: 'city' } },
        { name: 'tenant', value: { variable: 'tenant' } },
        { name: 'limit', value: { value: 10 } },
      ];
      expect(sdResolveParams(params, { city: 'HCM' }, { tenant: 't1' })).toEqual({ provinceId: 'HCM', tenant: 't1', limit: 10 });
      expect(sdResolveParams(undefined, {}, {})).toEqual({});
    });
  });

  describe('sdApplyDefaults', () => {
    it('fills only keys without a value and returns a new object from a frozen input', () => {
      const value = deepFreeze({ name: 'Lan', note: null });
      const next = sdApplyDefaults(schema, value, { viewed: false });
      expect(next).toEqual({ name: 'Lan', note: null, age: 18 });
      expect(next).not.toBe(value);
    });

    it('keeps a value the user cleared (null) instead of refilling the default', () => {
      expect(sdApplyDefaults(schema, { name: null, age: null }, { viewed: false })).toEqual({ name: null, age: null });
    });

    it('never applies a default to a password field', () => {
      expect(sdApplyDefaults(schema, {}, { viewed: false })['secret']).toBeUndefined();
    });

    it('does not apply defaults in view mode', () => {
      const value = deepFreeze({ name: 'Lan' });
      const next = sdApplyDefaults(schema, value, { viewed: true });
      expect(next).toEqual({ name: 'Lan' });
      expect(next).not.toBe(value);
    });
  });

  describe('sdFillPatch', () => {
    it('reads item.data[from] for every fill target', () => {
      const item = { value: '79', label: 'HCM', data: { name: 'Ho Chi Minh', code: 'SG' } };
      expect(
        sdFillPatch(
          [
            { field: 'note', from: 'name' },
            { field: 'code', from: 'code' },
          ],
          item
        )
      ).toEqual({ note: 'Ho Chi Minh', code: 'SG' });
    });

    it('clears fill targets when the selection is cleared', () => {
      expect(sdFillPatch([{ field: 'note', from: 'name' }], null)).toEqual({ note: null });
      expect(sdFillPatch(undefined, null)).toEqual({});
    });
  });

  describe('sdCatalogKey', () => {
    it('is stable regardless of parameter order and changes with values', () => {
      expect(sdCatalogKey('districts', { a: 1, b: 2 })).toBe(sdCatalogKey('districts', { b: 2, a: 1 }));
      expect(sdCatalogKey('districts', { a: 1 })).not.toBe(sdCatalogKey('districts', { a: 2 }));
      expect(sdCatalogKey('districts', { a: 1 })).not.toBe(sdCatalogKey('wards', { a: 1 }));
    });
  });

  describe('sdValueKeys', () => {
    it('lists only field keys (no html, no unknown elements)', () => {
      expect(sdValueKeys(schema)).toEqual(['name', 'secret', 'age', 'note']);
    });
  });

  it('never writes a reserved name — params, fill patches and defaults keep plain objects', () => {
    const polluted = { polluted: true };
    const params = sdResolveParams([{ name: '__proto__', value: { field: 'obj' } }], { obj: polluted }, {});
    expect(Object.getPrototypeOf(params)).toBe(Object.prototype);
    expect(Object.keys(params)).toEqual([]);
    const patch = sdFillPatch([{ field: '__proto__', from: 'data' }], { value: 'v', label: 'V', data: { data: polluted } });
    expect(Object.getPrototypeOf(patch)).toBe(Object.prototype);
    expect(Object.keys(patch)).toEqual([]);
    const reserved = {
      pages: [{ id: 'p', elements: [{ id: 'x', key: 'prototype', type: 'textfield', label: 'X', defaultValue: 'x' }] }],
    } as unknown as SdFormGenericSchema;
    expect(Object.keys(sdApplyDefaults(reserved, {}, { viewed: false }))).toEqual([]);
  });

  it('skips a malformed param (no name) and resolves a param without a value to undefined', () => {
    const params = [{ value: { field: 'a' } }, { name: 'b' }, null] as unknown as Parameters<typeof sdResolveParams>[0];
    expect(() => sdResolveParams(params, { a: 1 }, {})).not.toThrow();
    expect(sdResolveParams(params, { a: 1 }, {})).toEqual({ b: undefined });
  });
});
