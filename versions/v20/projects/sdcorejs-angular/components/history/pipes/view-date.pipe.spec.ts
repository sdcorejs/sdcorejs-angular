import { ViewDateTimePipe } from './view-date.pipe';
import { SD_EMPTY_STR } from '@sdcorejs/angular/utilities';

describe('ViewDateTimePipe', () => {
  let pipe: ViewDateTimePipe;

  beforeEach(() => {
    pipe = new ViewDateTimePipe();
  });

  it('returns empty marker for null', () => {
    expect(pipe.transform(null)).toBe(SD_EMPTY_STR);
  });

  it('returns empty marker for undefined', () => {
    expect(pipe.transform(undefined)).toBe(SD_EMPTY_STR);
  });

  it('returns empty marker for empty string', () => {
    expect(pipe.transform('')).toBe(SD_EMPTY_STR);
  });

  it('returns empty marker for an invalid date string', () => {
    expect(pipe.transform('not-a-date')).toBe(SD_EMPTY_STR);
  });

  it('formats a valid ISO date as HH:mm dd/MM/yyyy', () => {
    const result = pipe.transform('2026-05-28T10:15:00');
    expect(result).toMatch(/^\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/);
    expect(result).toContain('28/05/2026');
  });

  it('formats a Date instance', () => {
    const d = new Date(2026, 0, 5, 9, 7); // 09:07 05/01/2026
    const result = pipe.transform(d);
    expect(result).toMatch(/^\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/);
    expect(result).toContain('05/01/2026');
    expect(result.startsWith('09:07')).toBe(true);
  });
});

