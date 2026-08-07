import {
  DATE_DISPLAY_PATTERN,
  dateControlsEqual,
  formatDateInput,
  getCaretPosition,
  isPartialDateInput,
  parseDateInput,
} from './date-input.util';

describe('formatDateInput', () => {
  it('keeps a lone day unchanged', () => {
    expect(formatDateInput('2', true)).toBe('2');
  });

  it('closes the day with a separator once two digits are typed', () => {
    expect(formatDateInput('22', true)).toBe('22/');
  });

  it('closes the month with a separator once four digits are typed', () => {
    expect(formatDateInput('2208', true)).toBe('22/08/');
  });

  it('groups a full date', () => {
    expect(formatDateInput('22081991', true)).toBe('22/08/1991');
  });

  it('omits the trailing separator while deleting, so it cannot be re-added', () => {
    expect(formatDateInput('22', false)).toBe('22');
    expect(formatDateInput('2208', false)).toBe('22/08');
  });

  it('drops non-digits and truncates past eight digits', () => {
    expect(formatDateInput('22a08b1991', true)).toBe('22/08/1991');
    expect(formatDateInput('220819912345', true)).toBe('22/08/1991');
  });

  it('returns an empty string for an empty input', () => {
    expect(formatDateInput('', true)).toBe('');
  });
});

describe('isPartialDateInput', () => {
  const partials = ['', '2', '22', '22/', '22/0', '22/08', '22/08/', '22/08/1', '22/08/199', '22/08/1991'];
  for (const value of partials) {
    it(`accepts "${value}" as a well-shaped (possibly unfinished) date`, () => {
      expect(isPartialDateInput(value)).toBeTrue();
    });
  }

  const malformed = ['22/08/19911', '2a', '22-08-1991', '22/08/1991/'];
  for (const value of malformed) {
    it(`rejects "${value}"`, () => {
      expect(isPartialDateInput(value)).toBeFalse();
    });
  }

  // Empty segments pass the shape check. That is deliberate: this predicate
  // only decides whether to show the "invalid format" hint mid-typing, and
  // formatDateInput has already stripped stray separators from the field by
  // then ("22//08" is rewritten to "22/08"), so the raw form never survives.
  const tolerated = ['22//08', '/22'];
  for (const value of tolerated) {
    it(`tolerates "${value}", which the formatter normalizes anyway`, () => {
      expect(isPartialDateInput(value)).toBeTrue();
      expect(formatDateInput(value, false)).toBe(value === '/22' ? '22' : '22/08');
    });
  }
});

describe('parseDateInput', () => {
  it('parses a complete date', () => {
    const parsed = parseDateInput('22/08/1991');

    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(1991);
    expect(parsed!.getMonth()).toBe(7);
    expect(parsed!.getDate()).toBe(22);
  });

  // The reported bug: date-fns happily reads a half-typed year, so "11/12/2"
  // used to resolve to year 0002 and the field looked complete.
  const unfinished = ['', '1', '11', '11/', '11/1', '11/12', '11/12/', '11/12/2', '11/12/20', '11/12/202'];
  for (const value of unfinished) {
    it(`refuses the unfinished input "${value}"`, () => {
      expect(parseDateInput(value)).toBeNull();
    });
  }

  it('refuses a date that does not exist on the calendar', () => {
    expect(parseDateInput('31/02/1991')).toBeNull();
    expect(parseDateInput('32/01/1991')).toBeNull();
    expect(parseDateInput('01/13/1991')).toBeNull();
  });

  it('refuses a single-digit day or month even with a full year', () => {
    expect(parseDateInput('1/12/2026')).toBeNull();
    expect(parseDateInput('11/2/2026')).toBeNull();
  });

  it('only matches the exact dd/MM/yyyy shape', () => {
    expect(DATE_DISPLAY_PATTERN.test('22/08/1991')).toBeTrue();
    expect(DATE_DISPLAY_PATTERN.test('22/08/1991 ')).toBeFalse();
  });
});

describe('getCaretPosition', () => {
  it('moves the caret past a separator that was just inserted', () => {
    expect(getCaretPosition('22', 2, '22/', true)).toBe(3);
  });

  it('keeps the caret before the separator while deleting', () => {
    expect(getCaretPosition('22', 2, '22', false)).toBe(2);
  });

  it('maps a caret sitting mid-string onto the formatted value', () => {
    expect(getCaretPosition('2208', 2, '22/08', false)).toBe(2);
  });
});

describe('dateControlsEqual', () => {
  it('treats two references to the same calendar day as equal', () => {
    expect(dateControlsEqual(new Date(2026, 7, 6, 9, 0), new Date(2026, 7, 6, 23, 30))).toBeTrue();
  });

  it('separates different days', () => {
    expect(dateControlsEqual(new Date(2026, 7, 6), new Date(2026, 7, 7))).toBeFalse();
  });

  it('handles nulls', () => {
    expect(dateControlsEqual(null, null)).toBeTrue();
    expect(dateControlsEqual(new Date(2026, 7, 6), null)).toBeFalse();
  });
});
