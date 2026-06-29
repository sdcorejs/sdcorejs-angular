import { SdViewPipe } from './view.pipe';

describe('SdViewPipe', () => {
  let pipe: SdViewPipe;

  beforeEach(() => {
    pipe = new SdViewPipe();
  });

  it('returns "--" for null, undefined, empty string, and NaN', () => {
    expect(pipe.transform(null)).toBe('--');
    expect(pipe.transform(undefined)).toBe('--');
    expect(pipe.transform('')).toBe('--');
    expect(pipe.transform(Number.NaN)).toBe('--');
  });

  it('preserves display-safe scalar values', () => {
    expect(pipe.transform(0)).toBe('0');
    expect(pipe.transform(false)).toBe('false');
    expect(pipe.transform('Ready')).toBe('Ready');
  });

  it('joins array values with comma and one following space', () => {
    expect(pipe.transform(['Draft', 'Approved', 'Archived'])).toBe('Draft, Approved, Archived');
  });

  it('applies the same missing-value fallback inside arrays', () => {
    expect(pipe.transform(['A', null, Number.NaN, 'B'])).toBe('A, --, --, B');
    expect(pipe.transform([])).toBe('--');
  });
});
