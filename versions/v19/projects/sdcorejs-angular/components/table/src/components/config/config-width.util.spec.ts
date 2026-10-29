import { configWidthClamp, configWidthFromInput, configWidthPx } from './config-width.util';

describe('config width helpers', () => {
  describe('configWidthPx', () => {
    it('reads px values and bare numbers', () => {
      expect(configWidthPx('120px')).toBe(120);
      expect(configWidthPx('120')).toBe(120);
      expect(configWidthPx(' 80.5 PX ')).toBe(80.5);
    });

    it('returns undefined for empty and non-px values', () => {
      for (const value of [undefined, null, '', '  ', '20%', '10rem', 'calc(100px - 2rem)', 'auto', 'px', '-20px']) {
        expect(configWidthPx(value)).withContext(String(value)).toBeUndefined();
      }
    });
  });

  describe('configWidthFromInput', () => {
    it('stores a number as px', () => {
      expect(configWidthFromInput('150')).toBe('150px');
      expect(configWidthFromInput(150)).toBe('150px');
      expect(configWidthFromInput(' 96 ')).toBe('96px');
      expect(configWidthFromInput('96px')).toBe('96px');
    });

    it('stores an empty field as undefined', () => {
      expect(configWidthFromInput('')).toBeUndefined();
      expect(configWidthFromInput('   ')).toBeUndefined();
      expect(configWidthFromInput(null)).toBeUndefined();
      expect(configWidthFromInput(undefined)).toBeUndefined();
    });

    it('keeps any other CSS width verbatim', () => {
      expect(configWidthFromInput('30%')).toBe('30%');
      expect(configWidthFromInput(' 12rem ')).toBe('12rem');
    });
  });

  describe('configWidthClamp', () => {
    it('clamps a px width to px bounds and rounds it', () => {
      expect(configWidthClamp('50px', '80px', '300px')).toBe('80px');
      expect(configWidthClamp('400px', '80px', '300px')).toBe('300px');
      expect(configWidthClamp('120.6px', '80px', '300px')).toBe('121px');
      expect(configWidthClamp('120px', undefined, undefined)).toBe('120px');
    });

    it('ignores bounds that are not px', () => {
      expect(configWidthClamp('50px', '10rem', '50%')).toBe('50px');
      expect(configWidthClamp('500px', '80px', '50%')).toBe('500px');
    });

    it('leaves empty and non-px widths alone', () => {
      expect(configWidthClamp(undefined, '80px', '300px')).toBeUndefined();
      expect(configWidthClamp('20%', '80px', '300px')).toBe('20%');
    });
  });
});
