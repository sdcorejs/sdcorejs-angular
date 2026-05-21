import { SdUtilities } from './utility.extension';

describe('SdUtilities', () => {
  describe('randomId', () => {
    it('returns a non-empty string', () => {
      const id = SdUtilities.randomId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('includes the prefix when provided', () => {
      const id = SdUtilities.randomId('test');
      expect(id.startsWith('test_')).toBeTrue();
    });

    it('does not include prefix when null is passed', () => {
      const id = SdUtilities.randomId(null);
      expect(id.includes('_')).toBeFalse();
    });

    it('generates unique values across multiple rapid calls', () => {
      const ids = new Set(Array.from({ length: 50 }, () => SdUtilities.randomId()));
      expect(ids.size).toBeGreaterThan(40);
    });
  });

  describe('hash', () => {
    it('returns a string starting with "h"', () => {
      expect(SdUtilities.hash({ a: 1 }).startsWith('h')).toBeTrue();
    });

    it('produces the same hash for equivalent objects (key-order independent)', () => {
      const hash1 = SdUtilities.hash({ a: 1, b: 2 });
      const hash2 = SdUtilities.hash({ b: 2, a: 1 });
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different objects', () => {
      expect(SdUtilities.hash({ a: 1 })).not.toBe(SdUtilities.hash({ a: 2 }));
      expect(SdUtilities.hash({ a: 1 })).not.toBe(SdUtilities.hash({ b: 1 }));
    });

    it('handles primitive values', () => {
      expect(SdUtilities.hash('hello')).toBeTruthy();
      expect(SdUtilities.hash(42)).toBeTruthy();
      expect(SdUtilities.hash(null)).toBeTruthy();
    });

    it('handles arrays', () => {
      expect(SdUtilities.hash([1, 2, 3])).toBeTruthy();
      expect(SdUtilities.hash([1, 2, 3])).toBe(SdUtilities.hash([1, 2, 3]));
      expect(SdUtilities.hash([1, 2, 3])).not.toBe(SdUtilities.hash([3, 2, 1]));
    });
  });

  describe('parseQueryParams', () => {
    it('parses a simple query string', () => {
      const result = SdUtilities.parseQueryParams('key=value&foo=bar');
      expect(result['key']).toBe('value');
      expect(result['foo']).toBe('bar');
    });

    it('handles URL-encoded characters', () => {
      const result = SdUtilities.parseQueryParams('name=Hello%20World');
      expect(result['name']).toBe('Hello World');
    });

    it('returns an empty object for empty string', () => {
      expect(SdUtilities.parseQueryParams('')).toEqual({});
    });

    it('returns an empty object for undefined', () => {
      expect(SdUtilities.parseQueryParams(undefined)).toEqual({});
    });

    it('handles a single parameter', () => {
      const result = SdUtilities.parseQueryParams('only=one');
      expect(result['only']).toBe('one');
    });
  });

  describe('getNestedValue', () => {
    it('retrieves a deeply nested value', () => {
      const obj = { user: { address: { city: 'Hanoi' } } };
      expect(SdUtilities.getNestedValue(obj, 'user.address.city')).toBe('Hanoi');
    });

    it('retrieves a top-level value', () => {
      expect(SdUtilities.getNestedValue({ name: 'Alice' }, 'name')).toBe('Alice');
    });

    it('returns undefined for a missing nested path', () => {
      const obj = { user: { name: 'Alice' } };
      expect(SdUtilities.getNestedValue(obj, 'user.age')).toBeUndefined();
    });

    it('returns undefined for null object', () => {
      expect(SdUtilities.getNestedValue(null, 'user.name')).toBeUndefined();
    });

    it('returns undefined for empty path', () => {
      expect(SdUtilities.getNestedValue({ name: 'Alice' }, '')).toBeUndefined();
    });

    it('handles intermediate null in path gracefully', () => {
      const obj = { user: null };
      expect(SdUtilities.getNestedValue(obj, 'user.name')).toBeUndefined();
    });
  });

  describe('isMobile', () => {
    it('returns a boolean', () => {
      expect(typeof SdUtilities.isMobile()).toBe('boolean');
    });
  });

  describe('generateUuid', () => {
    it('returns a non-empty string', () => {
      const id = SdUtilities.generateUuid();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('generates unique values', () => {
      const ids = new Set(Array.from({ length: 20 }, () => SdUtilities.generateUuid()));
      expect(ids.size).toBe(20);
    });
  });
});
