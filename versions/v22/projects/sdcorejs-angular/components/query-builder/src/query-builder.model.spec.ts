import { I18N_MESSAGES } from '@sdcorejs/angular/i18n';
import {
  SD_QB_DATE_MODES,
  SD_QB_RELATIVE_UNIT_OPTIONS,
  SD_QB_TODAY,
  SD_QB_VALUE_SOURCE_OPTIONS,
  sdQbDefaultRelative,
  sdQbIsRelativeDate,
  sdQbIsToday,
  qbRelativeLabelKey,
} from './query-builder.model';

describe('query-builder.model › relative date helpers', () => {
  it('sdQbIsRelativeDate recognises a utils DateRelative offset spec', () => {
    expect(sdQbIsRelativeDate({ amount: 3, direction: 'previous', unit: 'day' })).toBe(true);
    expect(sdQbIsRelativeDate({ amount: 1, direction: 'next', unit: 'month' })).toBe(true);
  });

  it('sdQbIsRelativeDate rejects non-relative values', () => {
    expect(sdQbIsRelativeDate(null)).toBe(false);
    expect(sdQbIsRelativeDate('2026-01-01')).toBe(false);
    expect(sdQbIsRelativeDate(100)).toBe(false);
    expect(sdQbIsRelativeDate({ from: 1, to: 2 })).toBe(false);
    expect(sdQbIsRelativeDate(SD_QB_TODAY)).toBe(false);
    expect(sdQbIsRelativeDate({ amount: 1, direction: 'sideways', unit: 'day' })).toBe(false);
  });

  it('sdQbIsToday recognises the TODAY sentinel only', () => {
    expect(sdQbIsToday(SD_QB_TODAY)).toBe(true);
    expect(sdQbIsToday('TODAY')).toBe(true);
    expect(sdQbIsToday('today')).toBe(false);
    expect(sdQbIsToday({ amount: 1, direction: 'previous', unit: 'day' })).toBe(false);
  });

  it('sdQbDefaultRelative returns a 1-day-previous offset', () => {
    expect(sdQbDefaultRelative()).toEqual({ amount: 1, direction: 'previous', unit: 'day' });
  });

  it('sdQbDefaultRelative returns a fresh object each call (no shared mutable ref)', () => {
    expect(sdQbDefaultRelative()).not.toBe(sdQbDefaultRelative());
  });

  it('SD_QB_DATE_MODES exposes absolute / now / relative', () => {
    expect(SD_QB_DATE_MODES.map(m => m.value)).toEqual(['absolute', 'now', 'relative']);
  });

  it('SD_QB_RELATIVE_UNIT_OPTIONS lists the 6 unit×direction tokens keyed for i18n', () => {
    expect(SD_QB_RELATIVE_UNIT_OPTIONS.map(o => o.value)).toEqual([
      'day:previous',
      'day:next',
      'week:previous',
      'week:next',
      'month:previous',
      'month:next',
    ]);
    expect(SD_QB_RELATIVE_UNIT_OPTIONS.find(o => o.value === 'day:previous')!.labelKey).toBe(
      'core.component.query-builder.relative.day-previous'
    );
    expect(SD_QB_RELATIVE_UNIT_OPTIONS.find(o => o.value === 'month:next')!.labelKey).toBe(
      'core.component.query-builder.relative.month-next'
    );
  });

  it('SD_QB_DATE_MODES / SD_QB_RELATIVE_UNIT_OPTIONS are stable module references', () => {
    expect(SD_QB_DATE_MODES).toBe(SD_QB_DATE_MODES);
    expect(SD_QB_RELATIVE_UNIT_OPTIONS).toBe(SD_QB_RELATIVE_UNIT_OPTIONS);
  });
});

describe('query-builder.model › option tables carry i18n keys, not baked labels', () => {
  // why: bảng hằng số được đánh giá MỘT lần lúc load module. Nhãn dịch sẵn ở đây sẽ đóng băng theo
  // ngôn ngữ lúc đó; guard này chốt rằng chúng chỉ giữ key và việc dịch xảy ra lúc đọc.
  const ALL_OPTIONS = [...SD_QB_DATE_MODES, ...SD_QB_VALUE_SOURCE_OPTIONS, ...SD_QB_RELATIVE_UNIT_OPTIONS];

  it('never exposes a `display` field baked at module-eval time', () => {
    for (const option of ALL_OPTIONS) {
      expect((option as unknown as Record<string, unknown>)['display']).toBeUndefined();
    }
  });

  it('every labelKey resolves in all five shipped catalogues', () => {
    for (const option of ALL_OPTIONS) {
      for (const locale of ['vi', 'en', 'ja', 'ko', 'zh'] as const) {
        expect(I18N_MESSAGES[locale][option.labelKey]).withContext(`${locale} is missing ${option.labelKey}`).toBeDefined();
      }
    }
  });

  it('qbRelativeLabelKey covers every unit×direction the utils model allows', () => {
    for (const unit of ['hour', 'day', 'week', 'month'] as const) {
      for (const direction of ['previous', 'next'] as const) {
        expect(I18N_MESSAGES.vi[qbRelativeLabelKey(unit, direction)])
          .withContext(`vi is missing ${qbRelativeLabelKey(unit, direction)}`)
          .toBeDefined();
      }
    }
  });
});
