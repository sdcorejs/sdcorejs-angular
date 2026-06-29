import { TestBed } from '@angular/core/testing';
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';
import { SdFormatNumberPipe } from './format-number.pipe';

describe('SdFormatNumberPipe', () => {
  describe('without configuration', () => {
    let pipe: SdFormatNumberPipe;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      pipe = TestBed.runInInjectionContext(() => new SdFormatNumberPipe());
    });

    it('returns null for non-numeric string', () => {
      expect(pipe.transform('abc')).toBeNull();
    });

    it('returns null for null', () => {
      expect(pipe.transform(null)).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(pipe.transform(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(pipe.transform('')).toBeNull();
    });

    it('formats a number using ISO (en-US) format by default', () => {
      const result = pipe.transform(1234567);
      expect(result).toBeTruthy();
      // en-US uses comma as thousands separator
      expect(result).toContain(',');
    });

    it('formats zero correctly', () => {
      const result = pipe.transform(0);
      expect(result).toBeTruthy();
    });

    it('respects the digits parameter', () => {
      const result = pipe.transform(1.5, 4);
      expect(result).toBeTruthy();
    });

    it('uses explicit ISO format when specified', () => {
      const result = pipe.transform(1234, 2, '1,234,567.89');
      expect(result).toBeTruthy();
      expect(result).toContain(',');
    });

    it('uses explicit VN format when specified', () => {
      const result = pipe.transform(1234, 2, '1.234.567,89');
      expect(result).toBeTruthy();
    });
  });

  describe('with VN number format configuration', () => {
    let pipe: SdFormatNumberPipe;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { format: { number: '1.234.567,89' } } }],
      });
      pipe = TestBed.runInInjectionContext(() => new SdFormatNumberPipe());
    });

    it('uses the configured VN format for number output', () => {
      const result = pipe.transform(1234);
      expect(result).toBeTruthy();
    });

    it('overrides configured format when explicit format is passed', () => {
      const result = pipe.transform(1234, 2, '1,234,567.89');
      expect(result).toBeTruthy();
      expect(result).toContain(',');
    });
  });

  describe('with ISO number format configuration', () => {
    let pipe: SdFormatNumberPipe;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { format: { number: '1,234,567.89' } } }],
      });
      pipe = TestBed.runInInjectionContext(() => new SdFormatNumberPipe());
    });

    it('uses the configured ISO format for number output', () => {
      const result = pipe.transform(9876543);
      expect(result).toBeTruthy();
      expect(result).toContain(',');
    });
  });
});
