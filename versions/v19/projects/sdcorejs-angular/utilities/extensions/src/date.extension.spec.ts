import { DateUtilities } from './date.extension';

describe('DateUtilities', () => {
  describe('isDate', () => {
    it('returns true for Date objects', () => {
      expect(DateUtilities.isDate(new Date())).toBeTrue();
      expect(DateUtilities.isDate(new Date('2024-01-15'))).toBeTrue();
    });

    it('returns true for valid date strings', () => {
      expect(DateUtilities.isDate('2024-01-15')).toBeTrue();
      expect(DateUtilities.isDate('01/15/2024')).toBeTrue();
      expect(DateUtilities.isDate('2024/01/15')).toBeTrue();
    });

    it('returns true for numeric timestamps including 0', () => {
      expect(DateUtilities.isDate(new Date().getTime())).toBeTrue();
      expect(DateUtilities.isDate(0)).toBeTrue(); // Unix epoch is a valid date
    });

    it('returns false for null and undefined', () => {
      expect(DateUtilities.isDate(null)).toBeFalse();
      expect(DateUtilities.isDate(undefined)).toBeFalse();
    });

    it('returns false for empty string', () => {
      expect(DateUtilities.isDate('')).toBeFalse();
    });

    it('returns false for non-date strings', () => {
      expect(DateUtilities.isDate('not-a-date')).toBeFalse();
      expect(DateUtilities.isDate('2024')).toBeFalse(); // too short
      expect(DateUtilities.isDate('hello world')).toBeFalse();
    });
  });

  describe('toFormat', () => {
    it('returns empty string for invalid date', () => {
      expect(DateUtilities.toFormat('invalid', 'yyyy-MM-dd')).toBe('');
      expect(DateUtilities.toFormat(null, 'yyyy-MM-dd')).toBe('');
      expect(DateUtilities.toFormat(undefined, 'yyyy-MM-dd')).toBe('');
    });

    it('formats date to yyyy-MM-dd pattern', () => {
      const result = DateUtilities.toFormat(new Date('2024-06-15T12:00:00'), 'yyyy-MM-dd');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toContain('2024');
    });

    it('formats date to dd/MM/yyyy pattern', () => {
      const result = DateUtilities.toFormat(new Date('2024-06-15T12:00:00'), 'dd/MM/yyyy');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe('addDays', () => {
    it('adds days to a date', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = DateUtilities.addDays(date, 5);
      expect(result).not.toBeNull();
      expect(result!.getDate()).toBe(20);
    });

    it('subtracts days when a negative value is given', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = DateUtilities.addDays(date, -5);
      expect(result!.getDate()).toBe(10);
    });

    it('rolls over month boundaries', () => {
      const date = new Date('2024-01-31T12:00:00');
      const result = DateUtilities.addDays(date, 1);
      expect(result!.getMonth()).toBe(1); // February
    });

    it('returns null for invalid date input', () => {
      expect(DateUtilities.addDays('invalid', 5)).toBeNull();
      expect(DateUtilities.addDays(null, 5)).toBeNull();
      expect(DateUtilities.addDays(undefined, 5)).toBeNull();
    });
  });

  describe('addMonths', () => {
    it('adds months to a date', () => {
      const date = new Date('2024-01-15T12:00:00');
      const result = DateUtilities.addMonths(date, 2);
      expect(result!.getMonth()).toBe(2); // March (0-indexed)
    });

    it('rolls over year boundaries', () => {
      const date = new Date('2024-11-15T12:00:00');
      const result = DateUtilities.addMonths(date, 3);
      expect(result!.getFullYear()).toBe(2025);
      expect(result!.getMonth()).toBe(1); // February
    });

    it('returns null for invalid date input', () => {
      expect(DateUtilities.addMonths(null, 1)).toBeNull();
      expect(DateUtilities.addMonths('not-a-date', 1)).toBeNull();
    });
  });

  describe('addHours', () => {
    it('adds hours to a date', () => {
      const date = new Date('2024-01-15T10:00:00');
      const result = DateUtilities.addHours(date, 3);
      expect(result!.getHours()).toBe(13);
    });

    it('rolls over day boundaries', () => {
      const date = new Date('2024-01-15T22:00:00');
      const result = DateUtilities.addHours(date, 4);
      expect(result!.getDate()).toBe(16);
      expect(result!.getHours()).toBe(2);
    });

    it('returns null for invalid date input', () => {
      expect(DateUtilities.addHours(null, 1)).toBeNull();
    });
  });

  describe('addMiliseconds', () => {
    it('adds milliseconds to a date', () => {
      const date = new Date('2024-01-15T10:00:00.000');
      const result = DateUtilities.addMiliseconds(date, 500);
      expect(result!.getMilliseconds()).toBe(500);
    });

    it('returns null for invalid date input', () => {
      expect(DateUtilities.addMiliseconds(null, 1000)).toBeNull();
    });
  });

  describe('dayDiff', () => {
    it('calculates positive day difference', () => {
      const date1 = new Date('2024-01-01T12:00:00');
      const date2 = new Date('2024-01-11T12:00:00');
      expect(DateUtilities.dayDiff(date1, date2)).toBe(10);
    });

    it('calculates negative day difference for reversed order', () => {
      const date1 = new Date('2024-01-11T12:00:00');
      const date2 = new Date('2024-01-01T12:00:00');
      expect(DateUtilities.dayDiff(date1, date2)).toBe(-10);
    });

    it('returns 0 for the same date', () => {
      const date = new Date('2024-01-15T12:00:00');
      expect(DateUtilities.dayDiff(date, new Date(date.getTime()))).toBe(0);
    });

    it('returns null when either date is invalid', () => {
      expect(DateUtilities.dayDiff(null, new Date())).toBeNull();
      expect(DateUtilities.dayDiff(new Date(), null)).toBeNull();
      expect(DateUtilities.dayDiff(null, null)).toBeNull();
    });
  });

  describe('yearDiff', () => {
    it('calculates the year difference', () => {
      const date1 = new Date('2020-01-01T12:00:00');
      const date2 = new Date('2024-01-01T12:00:00');
      expect(DateUtilities.yearDiff(date1, date2)).toBe(4);
    });

    it('returns null for invalid dates', () => {
      expect(DateUtilities.yearDiff(null, new Date())).toBeNull();
    });
  });

  describe('equal', () => {
    it('returns true for identical dates', () => {
      const date = new Date('2024-01-15T12:00:00');
      expect(DateUtilities.equal(date, new Date(date.getTime()))).toBeTrue();
    });

    it('returns false for different dates', () => {
      const d1 = new Date('2024-01-15T12:00:00');
      const d2 = new Date('2024-01-16T12:00:00');
      expect(DateUtilities.equal(d1, d2)).toBeFalse();
    });

    it('returns true when both values are invalid', () => {
      expect(DateUtilities.equal(null, null)).toBeTrue();
      expect(DateUtilities.equal(undefined, undefined)).toBeTrue();
    });

    it('returns false when one is invalid and one is valid', () => {
      expect(DateUtilities.equal(new Date(), null)).toBeFalse();
      expect(DateUtilities.equal(null, new Date())).toBeFalse();
    });
  });

  describe('begin', () => {
    it('returns the start of day (midnight)', () => {
      const date = new Date('2024-06-15T15:30:00');
      const result = DateUtilities.begin(date);
      expect(result).not.toBeNull();
      expect(result!.getHours()).toBe(0);
      expect(result!.getMinutes()).toBe(0);
      expect(result!.getSeconds()).toBe(0);
    });

    it('returns null for invalid date', () => {
      expect(DateUtilities.begin(null)).toBeNull();
      expect(DateUtilities.begin('invalid')).toBeNull();
    });
  });

  describe('end', () => {
    it('returns one millisecond before the start of the next day', () => {
      const date = new Date('2024-06-15T10:00:00');
      const result = DateUtilities.end(date);
      expect(result).not.toBeNull();
      expect(result!.getHours()).toBe(23);
      expect(result!.getMinutes()).toBe(59);
      expect(result!.getSeconds()).toBe(59);
    });

    it('returns null for invalid date', () => {
      expect(DateUtilities.end(null)).toBeNull();
    });
  });

  describe('timeDifference', () => {
    it('returns empty string for invalid previous date', () => {
      expect(DateUtilities.timeDifference(null)).toBe('');
      expect(DateUtilities.timeDifference('invalid')).toBe('');
    });

    it('returns empty string for invalid current date', () => {
      expect(DateUtilities.timeDifference(new Date(), 'invalid')).toBe('');
    });

    it('returns "X seconds ago" for a date seconds in the past', () => {
      const past = new Date(Date.now() - 30 * 1000);
      expect(DateUtilities.timeDifference(past)).toContain('seconds ago');
    });

    it('returns "X minutes ago" for a date minutes in the past', () => {
      const past = new Date(Date.now() - 10 * 60 * 1000);
      expect(DateUtilities.timeDifference(past)).toContain('minutes ago');
    });

    it('returns "X hours ago" for a date hours in the past', () => {
      const past = new Date(Date.now() - 5 * 60 * 60 * 1000);
      expect(DateUtilities.timeDifference(past)).toContain('hours ago');
    });

    it('returns "X days ago" for a date days in the past', () => {
      const past = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      expect(DateUtilities.timeDifference(past)).toContain('days ago');
    });

    it('returns "X months ago" for a date months in the past', () => {
      const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // ~2 months
      expect(DateUtilities.timeDifference(past)).toContain('months ago');
    });

    it('returns "X years ago" for a date years in the past', () => {
      const past = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // >1 year
      expect(DateUtilities.timeDifference(past)).toContain('years ago');
    });
  });

  describe('parseFrom', () => {
    it('parses date string according to format', () => {
      const result = DateUtilities.parseFrom('15/01/2024', 'dd/MM/yyyy');
      expect(result).not.toBeNull();
      expect(result!.getFullYear()).toBe(2024);
      expect(result!.getMonth()).toBe(0); // January
      expect(result!.getDate()).toBe(15);
    });

    it('returns null for empty input', () => {
      expect(DateUtilities.parseFrom(null, 'dd/MM/yyyy')).toBeNull();
      expect(DateUtilities.parseFrom('', 'dd/MM/yyyy')).toBeNull();
    });

    it('returns null when format is missing', () => {
      expect(DateUtilities.parseFrom('15/01/2024', '')).toBeNull();

      expect(DateUtilities.parseFrom('15/01/2024', null as any)).toBeNull();
    });
  });
});
