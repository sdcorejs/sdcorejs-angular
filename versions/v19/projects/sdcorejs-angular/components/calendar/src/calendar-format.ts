import type { SdCalendarMoveSource } from './calendar.model';
import { sdCalendarClockText, sdCalendarDay, sdCalendarDayParts } from './calendar.utils';

// Date names of the toolbar title, the labels and the live region (calendar.md §6, §15), shared with sd-scheduler
// through the ɵ exports of the entry point so both components name a day the same way.

/** `Intl` formatters of one locale; build them once per locale (a `computed` on the i18n locale). */
export interface SdCalendarFormats {
  /** English names months ("Oct 22"); other languages write numeric dates ("22/10"). */
  readonly named: boolean;
  readonly weekday: Intl.DateTimeFormat;
  readonly monthShort: Intl.DateTimeFormat;
  readonly monthLong: Intl.DateTimeFormat;
  readonly date: Intl.DateTimeFormat;
  readonly dateYear: Intl.DateTimeFormat;
}

/** Translation function of `I18nService.t`. */
export type SdCalendarTranslate = (key: string, params?: Record<string, string | number>) => string;

/** What the title names: a month, one day, a week of the calendar or any other span of days. */
export type SdCalendarTitleKind = 'month' | 'day' | 'week' | 'range';

export function sdCalendarFormats(locale: string, language: string): SdCalendarFormats {
  const named = language === 'en';
  const format = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
  return {
    named,
    weekday: format({ weekday: 'long' }),
    monthShort: format({ month: 'short' }),
    monthLong: format({ month: 'long' }),
    date: format(named ? { month: 'short', day: 'numeric' } : { day: '2-digit', month: '2-digit' }),
    dateYear: format(named ? { month: 'short', day: 'numeric', year: 'numeric' } : { day: '2-digit', month: '2-digit', year: 'numeric' }),
  };
}

/** Noon UTC of a calendar day, only to name it with `Intl` in `timeZone: 'UTC'`. */
export function sdCalendarUtcDay(day: string): Date {
  const { year, month, day: date } = sdCalendarDayParts(day)!;
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, date);
  value.setUTCHours(12);
  return value;
}

export function sdCalendarWeekdayLong(formats: SdCalendarFormats, day: string): string {
  return formats.weekday.format(sdCalendarUtcDay(day));
}

/**
 * Short date of a day: "Oct 22" / "Oct 22, 2026" in English, otherwise the numeric parts in the order of the
 * locale joined by "/" ("22/10/2026", "2026/10/22").
 *
 * why: `Intl` writes vi-VN numeric dates with "-" in current Chromium, while the design shows "22/10".
 */
export function sdCalendarDateText(formats: SdCalendarFormats, day: string, withYear: boolean): string {
  const format = withYear ? formats.dateYear : formats.date;
  if (formats.named) return format.format(sdCalendarUtcDay(day));
  return format
    .formatToParts(sdCalendarUtcDay(day))
    .filter(part => part.type === 'day' || part.type === 'month' || part.type === 'year')
    .map(part => part.value)
    .join('/');
}

/**
 * Toolbar title. `month` names the month of `anchor`; `day` the day `from`; `week` the days `from`–`to` in one
 * month ("19–25 Thg 10, 2026"), and any span across months or a `range` falls back to "22/10 – 04/11/2026".
 */
export function sdCalendarTitle(
  kind: SdCalendarTitleKind,
  span: { readonly anchor: string; readonly from: string; readonly to: string },
  formats: SdCalendarFormats,
  t: SdCalendarTranslate
): string {
  const anchor = sdCalendarDayParts(span.anchor)!;
  if (kind === 'month') {
    return t('core.component.calendar.title-month', {
      month: anchor.month,
      monthName: formats.monthLong.format(sdCalendarUtcDay(sdCalendarDay(anchor.year, anchor.month, 1))),
      year: anchor.year,
    });
  }
  if (kind === 'day') {
    return t('core.component.calendar.title-day', {
      weekday: sdCalendarWeekdayLong(formats, span.from),
      day: anchor.day,
      month: anchor.month,
      monthName: formats.monthLong.format(sdCalendarUtcDay(span.from)),
      year: anchor.year,
    });
  }
  const a = sdCalendarDayParts(span.from)!;
  const b = sdCalendarDayParts(span.to)!;
  if (kind === 'week' && a.year === b.year && a.month === b.month) {
    return t('core.component.calendar.title-week', {
      from: a.day,
      to: b.day,
      month: a.month,
      monthName: formats.monthShort.format(sdCalendarUtcDay(span.from)),
      year: a.year,
    });
  }
  return t('core.component.calendar.title-range', {
    from: sdCalendarDateText(formats, span.from, a.year !== b.year),
    to: sdCalendarDateText(formats, span.to, true),
  });
}

/**
 * Live-region text of an accepted move (calendar.md §15): "resized" when only the end changed (or the move was a
 * resize), otherwise "moved" with the new day and time.
 */
export function sdCalendarMovedText(
  title: string,
  target: { readonly allDay: boolean; readonly startDay: string; readonly startMinutes: number; readonly endMinutes: number },
  from: { readonly start: string; readonly end: string },
  to: { readonly start: string; readonly end: string },
  source: SdCalendarMoveSource,
  formats: SdCalendarFormats,
  t: SdCalendarTranslate
): string {
  if (source === 'resize' || (from.start === to.start && from.end !== to.end)) {
    return t('core.component.calendar.resized', {
      title,
      start: sdCalendarClockText(target.startMinutes),
      end: sdCalendarClockText(target.endMinutes),
    });
  }
  return t('core.component.calendar.moved', {
    title,
    weekday: sdCalendarWeekdayLong(formats, target.startDay),
    date: sdCalendarDateText(formats, target.startDay, false),
    time: target.allDay ? t('core.component.calendar.all-day') : sdCalendarClockText(target.startMinutes),
  });
}
