import { sdFindHighlightRanges, sdNormalizeSearchText } from './text-search';

/** Cắt `text` theo các range để so bằng mắt người đọc spec. */
const slices = (text: string, term: string): string[] => sdFindHighlightRanges(text, term).map(({ start, end }) => text.slice(start, end));

describe('text-search', () => {
  describe('sdNormalizeSearchText', () => {
    it('lower-cases and strips Vietnamese diacritics, including đ/Đ', () => {
      expect(sdNormalizeSearchText('Đà Nẵng')).toBe('da nang');
      expect(sdNormalizeSearchText('NGUYỄN VĂN ĐỨC')).toBe('nguyen van duc');
      expect(sdNormalizeSearchText('Thành phố Hồ Chí Minh')).toBe('thanh pho ho chi minh');
    });

    it('keeps spaces, digits and punctuation as they are', () => {
      expect(sdNormalizeSearchText('Hà Nội (HN) - 2026!')).toBe('ha noi (hn) - 2026!');
    });

    it('handles text that is already decomposed (NFD)', () => {
      // 'e' + U+0301 COMBINING ACUTE ACCENT
      expect(sdNormalizeSearchText('Cafe\u0301')).toBe('cafe');
    });

    it('keeps characters outside the Latin range, such as emoji', () => {
      expect(sdNormalizeSearchText('Xin chào 😀')).toBe('xin chao 😀');
    });

    it('returns an empty string for null, undefined and empty input', () => {
      expect(sdNormalizeSearchText(null)).toBe('');
      expect(sdNormalizeSearchText(undefined)).toBe('');
      expect(sdNormalizeSearchText('')).toBe('');
    });
  });

  describe('sdFindHighlightRanges', () => {
    it('maps a diacritic-insensitive match back to indexes of the original text', () => {
      expect(sdFindHighlightRanges('Nguyễn Văn Đức', 'duc')).toEqual([{ start: 11, end: 14 }]);
      expect(slices('Nguyễn Văn Đức', 'van duc')).toEqual(['Văn Đức']);
    });

    it('ignores case on both sides', () => {
      expect(slices('HÀ NỘI và hà nội', 'Ha Noi')).toEqual(['HÀ NỘI', 'hà nội']);
      expect(slices('Đồng Đức', 'ĐỨC')).toEqual(['Đức']);
    });

    it('returns every occurrence, left to right, without overlap', () => {
      expect(sdFindHighlightRanges('an an an', 'an')).toEqual([
        { start: 0, end: 2 },
        { start: 3, end: 5 },
        { start: 6, end: 8 },
      ]);
      expect(sdFindHighlightRanges('aaaa', 'aa')).toEqual([
        { start: 0, end: 2 },
        { start: 2, end: 4 },
      ]);
    });

    it('treats regular-expression metacharacters as plain text and never throws', () => {
      expect(slices('Giá (VNĐ) *đặc biệt*', '(vnd)')).toEqual(['(VNĐ)']);
      expect(slices('Giá (VNĐ) *đặc biệt*', '*dac')).toEqual(['*đặc']);
      expect(slices('a.b.c', '.')).toEqual(['.', '.']);
      expect(slices('a+b', 'a+b')).toEqual(['a+b']);
      expect(() => sdFindHighlightRanges('text [ with ( brackets', '[')).not.toThrow();
      expect(() => sdFindHighlightRanges('text', '(')).not.toThrow();
      expect(sdFindHighlightRanges('abc', '.*')).toEqual([]);
    });

    it('never splits a surrogate pair', () => {
      const text = '😀 Đà Lạt 😀';
      expect(sdFindHighlightRanges(text, 'da lat')).toEqual([{ start: 3, end: 9 }]);
      expect(sdFindHighlightRanges(text, '😀')).toEqual([
        { start: 0, end: 2 },
        { start: 10, end: 12 },
      ]);
      // Một nửa cặp surrogate làm term vẫn trả range phủ trọn emoji.
      expect(sdFindHighlightRanges(text, '\uD83D')).toEqual([
        { start: 0, end: 2 },
        { start: 10, end: 12 },
      ]);
    });

    it('keeps a trailing combining mark inside the range of its base letter', () => {
      // 'Cafe\u0301' dài 5 đơn vị; dấu sắc tách rời phải nằm trong đoạn khớp.
      expect(sdFindHighlightRanges('Cafe\u0301 ngon', 'cafe')).toEqual([{ start: 0, end: 5 }]);
    });

    it('trims the term before matching', () => {
      expect(slices('Nguyễn Văn Đức', '  đức  ')).toEqual(['Đức']);
    });

    it('returns no ranges for an empty, blank or diacritic-only term', () => {
      expect(sdFindHighlightRanges('Đà Nẵng', '')).toEqual([]);
      expect(sdFindHighlightRanges('Đà Nẵng', '   ')).toEqual([]);
      expect(sdFindHighlightRanges('Đà Nẵng', '\u0301')).toEqual([]);
      expect(sdFindHighlightRanges('Đà Nẵng', null)).toEqual([]);
      expect(sdFindHighlightRanges('Đà Nẵng', undefined)).toEqual([]);
    });

    it('returns no ranges for empty or missing text, or when nothing matches', () => {
      expect(sdFindHighlightRanges('', 'a')).toEqual([]);
      expect(sdFindHighlightRanges(null, 'a')).toEqual([]);
      expect(sdFindHighlightRanges(undefined, 'a')).toEqual([]);
      expect(sdFindHighlightRanges('Đà Nẵng', 'huế')).toEqual([]);
      expect(sdFindHighlightRanges('ab', 'abc')).toEqual([]);
    });
  });
});
