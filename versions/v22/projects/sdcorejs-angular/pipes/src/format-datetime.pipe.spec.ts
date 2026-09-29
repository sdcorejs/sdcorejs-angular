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

  // why: @sdcorejs/utils 1.2.0–1.2.2 trả rỗng cho timestamp BE có micro/nano giây hoặc offset không dấu hai chấm,
  // làm cột ngày của bảng hiện '--'; 1.2.3 khôi phục. Test này chặn lần nâng utils sau đi lùi.
  it('formats backend timestamps with sub-millisecond fractions and colon-less offsets', () => {
    const expected = pipe.transform('2026-07-09T08:49:29.851Z');
    expect(expected).not.toBeNull();
    for (const value of ['2026-07-09T08:49:29.851409Z', '2026-07-09T08:49:29.851409123Z', '2026-07-09T15:49:29.851+0700']) {
      expect(pipe.transform(value)).withContext(value).toBe(expected);
    }
  });

  it('returns null for empty or invalid values so sdView can render the placeholder', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
    expect(pipe.transform('')).toBeNull();
    expect(pipe.transform('not-a-date')).toBeNull();
  });
});
