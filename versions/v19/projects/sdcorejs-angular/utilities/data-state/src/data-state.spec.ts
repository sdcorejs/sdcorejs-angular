import { sdSerializeDataValue, sdIsEmpty } from './data-state';

describe('sdSerializeDataValue', () => {
  it('returns empty string for null/undefined/empty-string', () => {
    expect(sdSerializeDataValue(null)).toBe('');
    expect(sdSerializeDataValue(undefined)).toBe('');
    expect(sdSerializeDataValue('')).toBe('');
  });

  it('returns ISO string for Date', () => {
    const d = new Date('2026-05-24T10:00:00.000Z');
    expect(sdSerializeDataValue(d)).toBe('2026-05-24T10:00:00.000Z');
  });

  it('JSON.stringifies arrays', () => {
    expect(sdSerializeDataValue(['a', 'b'])).toBe('["a","b"]');
    expect(sdSerializeDataValue([])).toBe('[]');
  });

  it('JSON.stringifies plain objects', () => {
    expect(sdSerializeDataValue({ a: 1 })).toBe('{"a":1}');
  });

  it('returns "" when JSON.stringify throws (circular)', () => {
    const a: Record<string, unknown> = {};
    a['self'] = a;
    expect(sdSerializeDataValue(a)).toBe('');
  });

  it('String()-coerces primitives', () => {
    expect(sdSerializeDataValue(42)).toBe('42');
    expect(sdSerializeDataValue(true)).toBe('true');
    expect(sdSerializeDataValue(false)).toBe('false');
    expect(sdSerializeDataValue('hello')).toBe('hello');
  });
});

describe('sdIsEmpty', () => {
  it('returns true for null/undefined/empty-string', () => {
    expect(sdIsEmpty(null)).toBe(true);
    expect(sdIsEmpty(undefined)).toBe(true);
    expect(sdIsEmpty('')).toBe(true);
  });

  it('returns true for empty array, false for non-empty', () => {
    expect(sdIsEmpty([])).toBe(true);
    expect(sdIsEmpty(['a'])).toBe(false);
  });

  it('returns false for non-empty primitives and objects', () => {
    expect(sdIsEmpty('x')).toBe(false);
    expect(sdIsEmpty(0)).toBe(false);
    expect(sdIsEmpty(false)).toBe(false);
    expect(sdIsEmpty({})).toBe(false);
  });

  it('returns false for NaN (not treated as empty)', () => {
    expect(sdIsEmpty(NaN)).toBe(false);
  });
});
