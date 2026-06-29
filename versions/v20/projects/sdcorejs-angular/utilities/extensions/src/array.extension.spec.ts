import { ArrayUtilities } from './array.extension';

describe('ArrayUtilities', () => {
  describe('search', () => {
    const items = [
      { id: 1, name: 'Hà Nội', code: 'HN' },
      { id: 2, name: 'Hồ Chí Minh', code: 'HCM' },
      { id: 3, name: 'Đà Nẵng', code: 'DN' },
    ];

    it('returns all items when search text is empty', () => {
      expect(ArrayUtilities.search(items, '', ['name'])).toEqual(items);
      expect(ArrayUtilities.search(items, null, ['name'])).toEqual(items);
      expect(ArrayUtilities.search(items, undefined, ['name'])).toEqual(items);
    });

    it('returns all items when items array is empty or null', () => {
      expect(ArrayUtilities.search([], 'test', ['name'])).toEqual([]);

      expect(ArrayUtilities.search(null as any, 'test', ['name'])).toBeNull();
    });

    it('searches by single string field', () => {
      const result = ArrayUtilities.search(items, 'Ha', ['name']);
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('HN');
    });

    it('searches case and diacritics insensitively', () => {
      const result = ArrayUtilities.search(items, 'ho chi minh', ['name']);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(2);
    });

    it('searches across multiple fields', () => {
      const result = ArrayUtilities.search(items, 'HCM', ['name', 'code']);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(2);
    });

    it('returns empty array when no items match', () => {
      expect(ArrayUtilities.search(items, 'XYZ123', ['name', 'code'])).toEqual([]);
    });

    it('searches primitive string arrays without field spec', () => {
      const strings = ['apple', 'banana', 'cherry'];
      const result = ArrayUtilities.search(strings, 'ban');
      expect(result).toEqual(['banana']);
    });

    it('searches with children (recursive)', () => {
      const tree = [
        { id: 1, name: 'Parent', children: [{ id: 11, name: 'Child A', children: [] }] },
        { id: 2, name: 'Other', children: [] },
      ];
      const result = ArrayUtilities.search(tree, 'Child A', ['name'], 'children');
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('distinct', () => {
    it('removes duplicate numbers', () => {
      expect(ArrayUtilities.distinct([1, 2, 2, 3, 1])).toEqual([1, 2, 3]);
    });

    it('removes duplicate strings', () => {
      expect(ArrayUtilities.distinct(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('returns empty array for null or undefined input', () => {
      expect(ArrayUtilities.distinct(null as any)).toEqual([]);

      expect(ArrayUtilities.distinct(undefined as any)).toEqual([]);
    });

    it('returns same array when all elements are unique', () => {
      expect(ArrayUtilities.distinct([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('paging', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('returns the first page (page 0)', () => {
      expect(ArrayUtilities.paging(items, 3, 0)).toEqual([1, 2, 3]);
    });

    it('returns subsequent pages correctly', () => {
      expect(ArrayUtilities.paging(items, 3, 1)).toEqual([4, 5, 6]);
      expect(ArrayUtilities.paging(items, 3, 2)).toEqual([7, 8, 9]);
    });

    it('returns a partial last page', () => {
      expect(ArrayUtilities.paging(items, 3, 3)).toEqual([10]);
    });

    it('returns empty array for out-of-bounds page', () => {
      expect(ArrayUtilities.paging(items, 3, 10)).toEqual([]);
    });

    it('defaults to page 0 when not specified', () => {
      expect(ArrayUtilities.paging(items, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns empty array for null or undefined input', () => {
      expect(ArrayUtilities.paging(null as any, 3)).toEqual([]);

      expect(ArrayUtilities.paging(undefined as any, 3)).toEqual([]);
    });
  });

  describe('toObject', () => {
    const items = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
      { id: '3', name: 'Carol' },
    ];

    it('converts array to an object keyed by the specified field', () => {
      const result = ArrayUtilities.toObject('id', items);
      expect(result['1']).toEqual({ id: '1', name: 'Alice' });
      expect(result['2']).toEqual({ id: '2', name: 'Bob' });
      expect(result['3']).toEqual({ id: '3', name: 'Carol' });
    });

    it('returns empty object for null or undefined input', () => {
      expect(ArrayUtilities.toObject('id', null)).toEqual({});
      expect(ArrayUtilities.toObject('id', undefined)).toEqual({});
    });

    it('skips items where the key is missing or null', () => {
      const mixed = [{ id: '1', name: 'Alice' }, { name: 'No ID' }] as { id?: string; name: string }[];
      const result = ArrayUtilities.toObject('id', mixed);
      expect(Object.keys(result).length).toBe(1);
      expect(result['1']).toBeDefined();
    });
  });

  describe('union', () => {
    const arr1 = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ];
    const arr2 = [
      { id: 2, name: 'B_updated' },
      { id: 3, name: 'C' },
    ];

    it('merges arrays and deduplicates by key', () => {
      const result = ArrayUtilities.union('id', arr1, arr2);
      expect(result.length).toBe(3);
      expect(result.find(e => e.id === 1)).toBeTruthy();
      expect(result.find(e => e.id === 2)).toBeTruthy();
      expect(result.find(e => e.id === 3)).toBeTruthy();
    });

    it('keeps the first occurrence when there are duplicates', () => {
      const result = ArrayUtilities.union('id', arr1, arr2);
      const item2 = result.find(e => e.id === 2);
      expect(item2?.name).toBe('B');
    });

    it('returns empty array when no arguments provided', () => {
      expect(ArrayUtilities.union('id')).toEqual([]);
    });

    it('handles null/undefined array arguments gracefully', () => {
      const result = ArrayUtilities.union('id', arr1, null, arr2);
      expect(result.length).toBe(3);
    });

    it('works with a single array (deduplication)', () => {
      const dupes = [
        { id: 1, v: 'a' },
        { id: 1, v: 'b' },
        { id: 2, v: 'c' },
      ];
      const result = ArrayUtilities.union('id', dupes);
      expect(result.length).toBe(2);
    });
  });
});
