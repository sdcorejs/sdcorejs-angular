import { SdFormatDatePipe } from './format-date.pipe';

describe('SdFormatDatePipe', () => {
  let pipe: SdFormatDatePipe;

  beforeEach(() => {
    pipe = new SdFormatDatePipe();
  });

  it('formats valid date-like values with dd/MM/yyyy by default', () => {
    expect(pipe.transform(new Date(2025, 5, 20, 14, 30, 5))).toBe('20/06/2025');
    expect(pipe.transform('2025-06-20')).toBe('20/06/2025');
  });

  it('accepts a custom DateUtilities format string', () => {
    expect(pipe.transform(new Date(2025, 5, 20, 14, 30, 5), 'yyyy-MM-dd')).toBe('2025-06-20');
  });

  it('returns null for empty or invalid values so sdView can render the placeholder', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
    expect(pipe.transform('not-a-date')).toBeNull();
  });
});
