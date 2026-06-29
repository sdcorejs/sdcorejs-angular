import { SdFormatDatetimePipe } from './format-datetime.pipe';

describe('SdFormatDatetimePipe', () => {
  let pipe: SdFormatDatetimePipe;

  beforeEach(() => {
    pipe = new SdFormatDatetimePipe();
  });

  it('formats valid datetime-like values with dd/MM/yyyy HH:mm:ss by default', () => {
    expect(pipe.transform(new Date(2025, 5, 20, 14, 30, 5))).toBe('20/06/2025 14:30:05');
  });

  it('accepts a custom DateUtilities format string', () => {
    expect(pipe.transform(new Date(2025, 5, 20, 14, 30, 5), 'HH:mm dd/MM/yyyy')).toBe('14:30 20/06/2025');
  });

  it('returns null for empty or invalid values so sdView can render the placeholder', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
    expect(pipe.transform('not-a-date')).toBeNull();
  });
});
