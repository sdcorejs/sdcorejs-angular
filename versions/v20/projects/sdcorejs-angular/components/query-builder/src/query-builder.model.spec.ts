import {
  QB_DATE_MODES,
  QB_RELATIVE_UNIT_OPTIONS,
  qbDefaultRelative,
  qbIsRelativeDate,
} from './query-builder.model';

describe('query-builder.model › relative date helpers', () => {
  it('qbIsRelativeDate recognises now + offset objects', () => {
    expect(qbIsRelativeDate({ rel: 'now' })).toBe(true);
    expect(qbIsRelativeDate({ rel: 'offset', unit: 'day', amount: 3, direction: 'previous' })).toBe(true);
  });

  it('qbIsRelativeDate rejects non-relative values', () => {
    expect(qbIsRelativeDate(null)).toBe(false);
    expect(qbIsRelativeDate('2026-01-01')).toBe(false);
    expect(qbIsRelativeDate(100)).toBe(false);
    expect(qbIsRelativeDate({ from: 1, to: 2 })).toBe(false);
    expect(qbIsRelativeDate({ rel: 'bogus' })).toBe(false);
  });

  it('qbDefaultRelative returns 1 day previous offset', () => {
    expect(qbDefaultRelative()).toEqual({ rel: 'offset', unit: 'day', amount: 1, direction: 'previous' });
  });

  it('qbDefaultRelative returns a fresh object each call (no shared mutable ref)', () => {
    expect(qbDefaultRelative()).not.toBe(qbDefaultRelative());
  });

  it('QB_DATE_MODES exposes absolute / now / relative', () => {
    expect(QB_DATE_MODES.map(m => m.value)).toEqual(['absolute', 'now', 'relative']);
  });

  it('QB_RELATIVE_UNIT_OPTIONS lists the 6 unit×direction tokens with VN labels', () => {
    expect(QB_RELATIVE_UNIT_OPTIONS.map(o => o.value)).toEqual([
      'day:previous', 'day:next', 'week:previous', 'week:next', 'month:previous', 'month:next',
    ]);
    expect(QB_RELATIVE_UNIT_OPTIONS.find(o => o.value === 'day:previous')!.display).toBe('ngày trước');
    expect(QB_RELATIVE_UNIT_OPTIONS.find(o => o.value === 'month:next')!.display).toBe('tháng tới');
  });

  it('QB_DATE_MODES / QB_RELATIVE_UNIT_OPTIONS are stable module references', () => {
    expect(QB_DATE_MODES).toBe(QB_DATE_MODES);
    expect(QB_RELATIVE_UNIT_OPTIONS).toBe(QB_RELATIVE_UNIT_OPTIONS);
  });
});
