import { Utilities } from '@sdcorejs/utils/fns';

import { resolveFieldValue } from './field-value.util';

/**
 * NSP-5745: `@sdcorejs/utils` 1.2 rejects property paths with whitespace, so a column whose
 * field is a backend key such as "Số phòng ngủ" made the whole table read fail. These specs
 * pin the resolver contract: valid paths behave exactly like `getNestedValue`, rejected paths
 * fall back to the 1.1.x dot-split lookup over own data properties, and prototype segments are
 * never read.
 */
describe('resolveFieldValue', () => {
  describe('fields rejected by the utils 1.2 path parser', () => {
    it('reads a literal key that contains whitespace', () => {
      expect(resolveFieldValue({ 'Số phòng ngủ': '2PN' }, 'Số phòng ngủ')).toBe('2PN');
    });

    it('reads a literal key that contains "*" and whitespace', () => {
      expect(resolveFieldValue({ 'Loại sản phẩm*': 'Cao tầng' }, 'Loại sản phẩm*')).toBe('Cao tầng');
    });

    it('reads a literal key with leading and trailing whitespace', () => {
      expect(resolveFieldValue({ ' Mã ': 'X-01' }, ' Mã ')).toBe('X-01');
    });

    it('reads a nested own property the way utils 1.1.x did (dot split)', () => {
      expect(resolveFieldValue({ a: { 'b c': 1 } }, 'a.b c')).toBe(1);
    });

    it('returns undefined when the key is missing', () => {
      expect(resolveFieldValue({ other: 1 }, 'Số phòng ngủ')).toBeUndefined();
      expect(resolveFieldValue({ a: 1 }, 'a.b c')).toBeUndefined();
    });

    it('does not read inherited properties', () => {
      const source = Object.create({ 'Hướng ban công': 'Tây' }) as Record<string, unknown>;
      expect(resolveFieldValue(source, 'Hướng ban công')).toBeUndefined();
    });

    it('does not invoke getters', () => {
      const getter = jasmine.createSpy('getter').and.returnValue('secret');
      const source = {};
      Object.defineProperty(source, 'Số tầng', { enumerable: true, get: getter });
      expect(resolveFieldValue(source, 'Số tầng')).toBeUndefined();
      expect(getter).not.toHaveBeenCalled();
    });
  });

  describe('fields accepted by the utils 1.2 path parser', () => {
    const source = { id: 7, customer: { id: 'C-1' }, items: ['first', 'second'] };

    for (const field of ['id', 'customer.id', 'items[0]', 'customer.missing']) {
      it(`matches Utilities.getNestedValue for "${field}"`, () => {
        expect(resolveFieldValue(source, field)).toEqual(Utilities.getNestedValue(source, field));
      });
    }
  });

  describe('prototype-sensitive segments', () => {
    for (const field of ['__proto__', 'constructor', 'prototype', 'a.__proto__.b', 'Số phòng.__proto__', 'a b.constructor']) {
      it(`never reads "${field}"`, () => {
        const source = { a: { b: 1 }, 'a b': { x: 1 }, 'Số phòng': {} };
        const value = resolveFieldValue(source, field);
        expect(value).toBeUndefined();
        expect(value).not.toBe(Object.prototype as never);
      });
    }
  });

  describe('invalid inputs', () => {
    it('returns undefined for a non-object source', () => {
      for (const source of [null, undefined, 1, 'text', true]) {
        expect(resolveFieldValue(source, 'Số phòng ngủ')).toBeUndefined();
        expect(resolveFieldValue(source, 'id')).toBeUndefined();
      }
    });

    it('returns undefined for an empty or non-string field', () => {
      for (const field of ['', undefined, null, 1]) {
        expect(resolveFieldValue({ '': 1, 1: 2 }, field)).toBeUndefined();
      }
    });
  });

  describe('prototype objects (review R2)', () => {
    it('never reads a member of a prototype root', () => {
      for (const field of ['toString', 'to String', 'hasOwnProperty']) {
        expect(resolveFieldValue(Object.prototype, field)).toBeUndefined();
        expect(resolveFieldValue(Function.prototype, field)).toBeUndefined();
      }
    });

    it('never traverses into or returns a prototype object held by an own property', () => {
      const source = { 'a b': Object.prototype, 'c d': Function.prototype };
      expect(resolveFieldValue(source, 'a b.hasOwnProperty')).toBeUndefined();
      expect(resolveFieldValue(source, 'c d.call')).toBeUndefined();
      expect(resolveFieldValue(source, 'a b')).toBeUndefined();
      expect(resolveFieldValue(source, 'c d')).toBeUndefined();
    });
  });

  describe('path rejection detection (review R1, R3)', () => {
    it('falls back without depending on the class of the thrown error', () => {
      // why: in bundled apps the error thrown by `@sdcorejs/utils/fns` is not `instanceof` the class
      // exported by `@sdcorejs/utils/errors`; any rejection of the path must still fall back.
      spyOn(Utilities, 'getNestedValue').and.throwError(new Error('foreign error class'));
      expect(resolveFieldValue({ 'NSP 5745 foreign': 'X' }, 'NSP 5745 foreign')).toBe('X');
    });

    it('probes a rejected field once instead of throwing on every row', () => {
      const getNestedValue = spyOn(Utilities, 'getNestedValue').and.callThrough();
      const rows = [{ 'NSP 5745 cache': 1 }, { 'NSP 5745 cache': 2 }, { 'NSP 5745 cache': 3 }];

      expect(rows.map(row => resolveFieldValue(row, 'NSP 5745 cache'))).toEqual([1, 2, 3]);
      expect(getNestedValue).toHaveBeenCalledTimes(1);
    });

    it('keeps reading an accepted field through Utilities.getNestedValue', () => {
      const getNestedValue = spyOn(Utilities, 'getNestedValue').and.callThrough();
      const rows = [{ nsp5745: { id: 1 } }, { nsp5745: { id: 2 } }];

      expect(rows.map(row => resolveFieldValue(row, 'nsp5745.id'))).toEqual([1, 2]);
      // one cached probe plus one read per row
      expect(getNestedValue).toHaveBeenCalledTimes(3);
    });
  });
});
