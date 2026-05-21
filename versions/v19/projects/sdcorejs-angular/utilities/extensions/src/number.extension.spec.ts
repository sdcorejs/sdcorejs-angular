import { NumberUtilities } from './number.extension';

describe('NumberUtilities', () => {
  describe('isNumber', () => {
    it('returns true for numeric values', () => {
      expect(NumberUtilities.isNumber(0)).toBeTrue();
      expect(NumberUtilities.isNumber(42)).toBeTrue();
      expect(NumberUtilities.isNumber(-1)).toBeTrue();
      expect(NumberUtilities.isNumber(3.14)).toBeTrue();
      expect(NumberUtilities.isNumber('42')).toBeTrue();
      expect(NumberUtilities.isNumber('0')).toBeTrue();
      expect(NumberUtilities.isNumber('-5')).toBeTrue();
    });

    it('returns false for non-numeric values', () => {
      expect(NumberUtilities.isNumber(undefined)).toBeFalse();
      expect(NumberUtilities.isNumber(null)).toBeFalse();
      expect(NumberUtilities.isNumber('')).toBeFalse();
      expect(NumberUtilities.isNumber('abc')).toBeFalse();
      expect(NumberUtilities.isNumber(NaN)).toBeFalse();
    });
  });

  describe('isPositiveInteger', () => {
    it('returns true for positive integers', () => {
      expect(NumberUtilities.isPositiveInteger(1)).toBeTrue();
      expect(NumberUtilities.isPositiveInteger('10')).toBeTrue();
      expect(NumberUtilities.isPositiveInteger('100')).toBeTrue();
    });

    it('returns false for zero, negatives, floats, and non-numbers', () => {
      expect(NumberUtilities.isPositiveInteger(0)).toBeFalse();
      expect(NumberUtilities.isPositiveInteger(-1)).toBeFalse();
      expect(NumberUtilities.isPositiveInteger('1.5')).toBeFalse();
      expect(NumberUtilities.isPositiveInteger('abc')).toBeFalse();
      expect(NumberUtilities.isPositiveInteger(null)).toBeFalse();
      expect(NumberUtilities.isPositiveInteger(undefined)).toBeFalse();
    });
  });

  describe('isPositiveNumber', () => {
    it('returns true for positive numbers', () => {
      expect(NumberUtilities.isPositiveNumber(1)).toBeTrue();
      expect(NumberUtilities.isPositiveNumber('1.5')).toBeTrue();
      expect(NumberUtilities.isPositiveNumber(0.1)).toBeTrue();
    });

    it('returns false for zero, negatives, and non-numbers', () => {
      expect(NumberUtilities.isPositiveNumber(0)).toBeFalse();
      expect(NumberUtilities.isPositiveNumber(-1)).toBeFalse();
      expect(NumberUtilities.isPositiveNumber('abc')).toBeFalse();
      expect(NumberUtilities.isPositiveNumber(null)).toBeFalse();
      expect(NumberUtilities.isPositiveNumber(undefined)).toBeFalse();
    });
  });

  describe('round', () => {
    it('rounds to 2 decimal places by default', () => {
      expect(NumberUtilities.round(1.555)).toBe(1.56);
      expect(NumberUtilities.round(1.554)).toBe(1.55);
      expect(NumberUtilities.round(1)).toBe(1);
      expect(NumberUtilities.round(0)).toBe(0);
    });

    it('rounds to the specified number of decimal places', () => {
      expect(NumberUtilities.round(1.567, 0)).toBe(2);
      expect(NumberUtilities.round(1.567, 1)).toBe(1.6);
      expect(NumberUtilities.round(1.5671, 3)).toBe(1.567);
    });

    it('returns null for non-numeric input', () => {
      expect(NumberUtilities.round(null)).toBeNull();
      expect(NumberUtilities.round(undefined)).toBeNull();
      expect(NumberUtilities.round('abc')).toBeNull();
    });
  });

  describe('toISO', () => {
    it('returns null for empty or invalid input', () => {
      expect(NumberUtilities.toISO(null)).toBeNull();
      expect(NumberUtilities.toISO(undefined)).toBeNull();
      expect(NumberUtilities.toISO('')).toBeNull();
      expect(NumberUtilities.toISO('abc')).toBeNull();
    });

    it('formats a number using en-US locale style', () => {
      const result = NumberUtilities.toISO(1234);
      expect(result).toBeTruthy();
      // en-US uses comma as thousands separator
      expect(result).toContain(',');
    });

    it('handles string numeric input', () => {
      const result = NumberUtilities.toISO('9876');
      expect(result).toBeTruthy();
    });

    it('handles zero', () => {
      // zero is falsy, function returns null when string is empty after trim
      // but "0" is truthy, so it should format
      const result = NumberUtilities.toISO('0.00');
      expect(result).toBeTruthy();
    });
  });

  describe('toVN', () => {
    it('returns null for empty or invalid input', () => {
      expect(NumberUtilities.toVN(null)).toBeNull();
      expect(NumberUtilities.toVN(undefined)).toBeNull();
      expect(NumberUtilities.toVN('')).toBeNull();
      expect(NumberUtilities.toVN('abc')).toBeNull();
    });

    it('formats a number using vi-VN locale style', () => {
      const result = NumberUtilities.toVN(1234);
      expect(result).toBeTruthy();
    });

    it('handles string numeric input', () => {
      const result = NumberUtilities.toVN('1234.50');
      expect(result).toBeTruthy();
    });
  });

  describe('toVNCurrency', () => {
    it('returns null for empty or invalid input', () => {
      expect(NumberUtilities.toVNCurrency(null)).toBeNull();
      expect(NumberUtilities.toVNCurrency('')).toBeNull();
      expect(NumberUtilities.toVNCurrency('abc')).toBeNull();
    });

    it('formats a number as currency', () => {
      const result = NumberUtilities.toVNCurrency(1000000);
      expect(result).toBeTruthy();
    });
  });
});
