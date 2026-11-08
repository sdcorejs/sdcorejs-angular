import { ɵsdFormatBytes } from './format-bytes';

describe('ɵsdFormatBytes', () => {
  it('uses base 1024 with one fraction digit below 10 units and a locale decimal separator', () => {
    expect(ɵsdFormatBytes(2_516_582, 'en-US')).toBe('2.4 MB');
    expect(ɵsdFormatBytes(2_516_582, 'vi-VN')).toBe('2,4 MB');
    expect(ɵsdFormatBytes(866_304, 'en-US')).toBe('846 KB');
    expect(ɵsdFormatBytes(1024 * 1024, 'en-US')).toBe('1 MB');
    expect(ɵsdFormatBytes(3 * 1024 ** 3, 'en-US')).toBe('3 GB');
    expect(ɵsdFormatBytes(5 * 1024 ** 4, 'en-US')).toBe('5 TB');
  });

  it('keeps bytes below 1 KB', () => {
    expect(ɵsdFormatBytes(0, 'en-US')).toBe('0 B');
    expect(ɵsdFormatBytes(512, 'en-US')).toBe('512 B');
  });

  it('returns an empty string for missing or invalid values', () => {
    expect(ɵsdFormatBytes(undefined, 'en-US')).toBe('');
    expect(ɵsdFormatBytes(null, 'en-US')).toBe('');
    expect(ɵsdFormatBytes(-1, 'en-US')).toBe('');
    expect(ɵsdFormatBytes(Number.NaN, 'en-US')).toBe('');
  });
});
