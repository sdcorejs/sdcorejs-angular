import { SdEmptyPipe } from './empty.pipe';

describe('SdEmptyPipe', () => {
  let pipe: SdEmptyPipe;

  beforeEach(() => {
    pipe = new SdEmptyPipe();
  });

  it('returns "--" for null', () => {
    expect(pipe.transform(null)).toBe('--');
  });

  it('returns "--" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('--');
  });

  it('returns "--" for empty string', () => {
    expect(pipe.transform('')).toBe('--');
  });

  it('returns the value for a non-empty string', () => {
    expect(pipe.transform('hello')).toBe('hello');
    expect(pipe.transform('  ')).toBe('  ');
  });

  it('returns the value for a number (including 0)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(pipe.transform(42) as any).toBe(42);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(pipe.transform(0) as any).toBe(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(pipe.transform(-1) as any).toBe(-1);
  });

  it('returns the value for a boolean false', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(pipe.transform(false) as any).toBe(false);
  });

  it('returns the value for truthy objects and arrays', () => {
    const obj = { key: 'value' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(pipe.transform(obj) as any).toBe(obj);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(pipe.transform([1, 2, 3]) as any).toEqual([1, 2, 3]);
  });
});
