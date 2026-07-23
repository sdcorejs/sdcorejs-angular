import { sdNormalizeTime, sdParseTime, sdTimeToMinutes, sdValidateTime } from './time-value';

describe('time-only value contract', () => {
  describe('parsing and normalization', () => {
    const validCases: readonly (readonly [string, string, number])[] = [
      ['00:00', '00:00', 0],
      ['9:05', '09:05', 545],
      ['23:59', '23:59', 1439],
    ];

    for (const [input, normalized, minutes] of validCases) {
      it(`normalizes ${input} to ${normalized}`, () => {
        expect(sdNormalizeTime(input)).toBe(normalized);
        expect(sdTimeToMinutes(input)).toBe(minutes);
      });
    }

    for (const input of ['24:00', '12:60', '12', '12:3', 'abc', '09:05:00']) {
      it(`rejects invalid time ${input}`, () => {
        expect(sdParseTime(input)).toBeNull();
        expect(sdNormalizeTime(input)).toBeNull();
      });
    }
  });

  describe('boundaries and step', () => {
    it('accepts inclusive min/max boundaries', () => {
      expect(sdValidateTime('08:30', { min: '08:30', max: '17:30' })).toBeNull();
      expect(sdValidateTime('17:30', { min: '08:30', max: '17:30' })).toBeNull();
    });

    it('reports min and max violations without changing the input', () => {
      expect(sdValidateTime('08:29', { min: '08:30' })).toBe('min');
      expect(sdValidateTime('17:31', { max: '17:30' })).toBe('max');
    });

    it('anchors step validation to min when present and midnight otherwise', () => {
      expect(sdValidateTime('08:45', { min: '08:30', step: 15 })).toBeNull();
      expect(sdValidateTime('08:40', { min: '08:30', step: 15 })).toBe('step');
      expect(sdValidateTime('00:10', { step: 10 })).toBeNull();
    });

    it('treats empty values as optional and malformed constraints as non-restrictive', () => {
      expect(sdValidateTime('', { min: 'invalid', max: 'invalid', step: 0 })).toBeNull();
      expect(sdValidateTime(null, { min: '08:00' })).toBeNull();
    });

    it('reports malformed non-empty values as time errors', () => {
      expect(sdValidateTime('25:00')).toBe('time');
    });
  });
});
