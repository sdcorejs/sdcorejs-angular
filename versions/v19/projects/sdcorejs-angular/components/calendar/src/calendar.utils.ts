import { ɵsdNormalizeCalendarDay, sdSerializeTemporalValue, type SdTemporalValueTransform } from '@sdcorejs/angular/forms/models';
import { sdTimeToMinutes } from '@sdcorejs/angular/forms/time';
import { DateUtilities } from '@sdcorejs/utils/fns';
import type { SdCalendarEvent, SdCalendarRange, SdCalendarView, SdCalendarVisibleRange, SdCalendarWorkingHours } from './calendar.model';

/**
 * Pure helpers of `sd-calendar`, shared with `sd-scheduler` through the `ɵ` exports of the entry point.
 *
 * A calendar day is the string `'yyyy/MM/dd'` (it sorts as text) and a time of day is a number of wall-clock
 * minutes, 0–1440. Day arithmetic works on year/month/day numbers only: never on instants, never by adding
 * 24 hours, so a 23- or 25-hour DST day cannot move a date.
 */

/** The part of `SdDateTimeService` the pure helpers need; pass the service itself. */
export interface SdCalendarClock {
  readonly timeZone: string;
  toFormat(value: unknown, format: string): string;
  parse(value: unknown): Date | null;
  beginOfNextDay(value: unknown): Date | null;
}

export interface SdCalendarDayParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/** What the visible range depends on. `date` is the anchor day `'yyyy/MM/dd'`. */
export interface SdCalendarRangeInput {
  readonly view: SdCalendarView;
  readonly date: string;
  readonly firstDayOfWeek: number;
  readonly hideWeekends: boolean;
  readonly agendaDays: number;
}

/** A span of wall-clock minutes inside one day, end exclusive. */
export interface SdCalendarSpan {
  readonly start: number;
  readonly end: number;
}

/** Column of one timed event inside its overlap cluster; `index` points into the input. */
export interface SdCalendarStacked {
  readonly index: number;
  readonly column: number;
  readonly columns: number;
}

/** Days covered by a bar, both ends included. */
export interface SdCalendarDaySpan {
  readonly firstDay: string;
  readonly lastDay: string;
}

/** One bar of the all-day row: `from`/`to` are indexes of the visible days; `index` points into the input. */
export interface SdCalendarBar {
  readonly index: number;
  readonly row: number;
  readonly from: number;
  readonly to: number;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
}

export interface SdCalendarAllDayLayout {
  /** Bars of the rows on screen, in layout order. */
  readonly bars: readonly SdCalendarBar[];
  /** Rows on screen. */
  readonly rows: number;
  /** Bars left out, per visible day ("+N"). */
  readonly more: readonly number[];
}

/** Where an event sits, read in the zone of the clock. */
export interface SdCalendarPlacement {
  readonly allDay: boolean;
  /** Drawn in the time grid; `false` for all-day events and timed events that cross midnight. */
  readonly inGrid: boolean;
  readonly startDay: string;
  readonly startMinutes: number;
  /** Timed: the day of the end; an end at midnight of the next day reads as `startDay` at 1440. All-day: last day. */
  readonly endDay: string;
  readonly endMinutes: number;
  /** Days covered, both included. */
  readonly firstDay: string;
  readonly lastDay: string;
  /** Epoch milliseconds; all-day events span from the start of the first day to the start of the day after the last. */
  readonly startInstant: number;
  readonly endInstant: number;
}

const DAY = /^(\d{4})\/(\d{2})\/(\d{2})$/;
const MINUTES_PER_DAY = 1440;

/** Slot lengths `step` accepts: the divisors of 60 a time grid can draw. */
export const SD_CALENDAR_STEPS: readonly number[] = [5, 10, 15, 20, 30, 60];

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

/** Year, month and day of `'yyyy/MM/dd'`; `null` for anything else, including an impossible date. */
export function sdCalendarDayParts(day: string): SdCalendarDayParts | null {
  const match = DAY.exec(day);
  if (!match) return null;
  const [year, month, date] = [Number(match[1]), Number(match[2]), Number(match[3])];
  return sdCalendarDay(year, month, date) === day ? { year, month, day: date } : null;
}

/** `'yyyy/MM/dd'` of the given numbers; overflowing months and days roll over like `Date` does. */
export function sdCalendarDay(year: number, month: number, day: number): string {
  // why: UTC fields carry plain calendar arithmetic (no zone, no DST); the instant itself is never used.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return `${pad(date.getUTCFullYear(), 4)}/${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}`;
}

const partsOf = (day: string): SdCalendarDayParts => {
  const parts = sdCalendarDayParts(day);
  if (!parts) throw new Error(`[sd-calendar] invalid day "${day}"`);
  return parts;
};

export function sdCalendarAddDays(day: string, days: number): string {
  const { year, month, day: date } = partsOf(day);
  return sdCalendarDay(year, month, date + days);
}

/** First day of the month `months` away from the month of `day`. */
export function sdCalendarAddMonths(day: string, months: number): string {
  const { year, month } = partsOf(day);
  return sdCalendarDay(year, month + months, 1);
}

/** 0 (Sunday) – 6 (Saturday). */
export function sdCalendarWeekday(day: string): number {
  const { year, month, day: date } = partsOf(day);
  const utc = new Date(0);
  utc.setUTCFullYear(year, month - 1, date);
  return utc.getUTCDay();
}

/** Number of days from `from` to `to` (negative when `to` is earlier). */
export function sdCalendarDayDiff(from: string, to: string): number {
  const epochDay = (day: string): number => {
    const { year, month, day: date } = partsOf(day);
    const utc = new Date(0);
    utc.setUTCFullYear(year, month - 1, date);
    return Math.round(utc.getTime() / 86_400_000);
  };
  return epochDay(to) - epochDay(from);
}

export function sdCalendarStartOfWeek(day: string, firstDayOfWeek: number): string {
  return sdCalendarAddDays(day, -((sdCalendarWeekday(day) - firstDayOfWeek + 7) % 7));
}

export function sdCalendarIsWeekend(day: string): boolean {
  const weekday = sdCalendarWeekday(day);
  return weekday === 0 || weekday === 6;
}

/** `agendaDays` kept in 1–62; not a number → 14. */
export function sdCalendarClampAgendaDays(days: number): number {
  if (!Number.isFinite(days)) return 14;
  return Math.min(62, Math.max(1, Math.floor(days)));
}

/** `step` when it is one of `SD_CALENDAR_STEPS`, otherwise `null`. */
export function sdCalendarNormalizeStep(step: number): number | null {
  return SD_CALENDAR_STEPS.includes(step) ? step : null;
}

/** Granularity of moving and resizing: `min(step, 15)`. */
export function sdCalendarMoveStep(step: number): number {
  return Math.min(step, 15);
}

const daysBetween = (from: string, to: string): string[] => {
  const days: string[] = [];
  for (let day = from; day <= to; day = sdCalendarAddDays(day, 1)) days.push(day);
  return days;
};

/** Full weeks of the month view (4–6 rows), weekends left out when `hideWeekends`. */
export function sdCalendarMonthWeeks(input: SdCalendarRangeInput): string[][] {
  const first = sdCalendarAddMonths(input.date, 0);
  const last = sdCalendarAddDays(sdCalendarAddMonths(input.date, 1), -1);
  const weeks: string[][] = [];
  for (let start = sdCalendarStartOfWeek(first, input.firstDayOfWeek); start <= last; start = sdCalendarAddDays(start, 7)) {
    const week = daysBetween(start, sdCalendarAddDays(start, 6));
    weeks.push(input.hideWeekends ? week.filter(day => !sdCalendarIsWeekend(day)) : week);
  }
  return weeks;
}

/** Days on screen, in order. Day and agenda views ignore `hideWeekends`. */
export function sdCalendarVisibleDays(input: SdCalendarRangeInput): string[] {
  switch (input.view) {
    case 'month':
      return sdCalendarMonthWeeks(input).flat();
    case 'week': {
      const start = sdCalendarStartOfWeek(input.date, input.firstDayOfWeek);
      const week = daysBetween(start, sdCalendarAddDays(start, 6));
      return input.hideWeekends ? week.filter(day => !sdCalendarIsWeekend(day)) : week;
    }
    case 'agenda':
      return daysBetween(input.date, sdCalendarAddDays(input.date, sdCalendarClampAgendaDays(input.agendaDays) - 1));
    default:
      return [input.date];
  }
}

/** First and last day on screen (both included) and the view. */
export function sdCalendarVisibleRange(input: SdCalendarRangeInput): SdCalendarVisibleRange {
  const days = sdCalendarVisibleDays(input);
  return { from: days[0], to: days[days.length - 1], view: input.view };
}

/** Anchor day after "Previous" (`-1`) or "Next" (`1`): ±7 days, ±1 day, ±1 month on day 1, ±`agendaDays` days. */
export function sdCalendarShiftDate(input: SdCalendarRangeInput, direction: 1 | -1): string {
  switch (input.view) {
    case 'month':
      return sdCalendarAddMonths(input.date, direction);
    case 'week':
      return sdCalendarAddDays(input.date, 7 * direction);
    case 'agenda':
      return sdCalendarAddDays(input.date, sdCalendarClampAgendaDays(input.agendaDays) * direction);
    default:
      return sdCalendarAddDays(input.date, direction);
  }
}

/**
 * Columns of overlapping timed events of one day (§8.4): sorted by start, longer first on a tie; a cluster grows
 * while an event starts before the latest end so far; each event takes the first column that is free by its
 * start; every event of a cluster shares its column count. Output order is the sorted order (the DOM order).
 */
export function sdCalendarStack(items: readonly SdCalendarSpan[]): SdCalendarStacked[] {
  const order = items.map((item, index) => ({ item, index })).sort((a, b) => a.item.start - b.item.start || b.item.end - a.item.end);
  const result: { index: number; column: number; columns: number }[] = [];
  let cluster: { index: number; column: number; columns: number }[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -Infinity;
  const close = (): void => {
    for (const entry of cluster) entry.columns = columnEnds.length;
    result.push(...cluster);
    cluster = [];
    columnEnds = [];
    clusterEnd = -Infinity;
  };
  for (const { item, index } of order) {
    if (item.start >= clusterEnd) close();
    let column = columnEnds.findIndex(end => end <= item.start);
    if (column < 0) column = columnEnds.push(item.end) - 1;
    else columnEnds[column] = item.end;
    cluster.push({ index, column, columns: 0 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  close();
  return result;
}

/**
 * Rows of the all-day band (§7) over `days`. Bars sort by first day, then the longer first; each takes the first
 * row that is free at its first visible day. Rows from `maxRows` on are left out and counted per day in `more`.
 */
export function sdCalendarAllDayLayout(items: readonly SdCalendarDaySpan[], days: readonly string[], maxRows = 3): SdCalendarAllDayLayout {
  const more = days.map(() => 0);
  const bars: SdCalendarBar[] = [];
  if (!days.length) return { bars, rows: 0, more };
  const first = days[0];
  const last = days[days.length - 1];
  const order = items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        (a.item.firstDay < b.item.firstDay ? -1 : a.item.firstDay > b.item.firstDay ? 1 : 0) ||
        sdCalendarDayDiff(b.item.firstDay, b.item.lastDay) - sdCalendarDayDiff(a.item.firstDay, a.item.lastDay)
    );
  const rowEnds: number[] = [];
  for (const { item, index } of order) {
    const from = days.findIndex(day => day >= item.firstDay);
    let to = days.length - 1;
    while (to >= 0 && days[to] > item.lastDay) to--;
    if (from < 0 || to < from) continue;
    let row = rowEnds.findIndex(end => end < from);
    if (row < 0) row = rowEnds.push(to) - 1;
    else rowEnds[row] = to;
    if (row >= maxRows) {
      for (let day = from; day <= to; day++) more[day]++;
      continue;
    }
    bars.push({ index, row, from, to, clippedStart: item.firstDay < first, clippedEnd: item.lastDay > last });
  }
  return { bars, rows: Math.min(rowEnds.length, maxRows), more };
}

const clampMinutes = (minutes: number): number => Math.min(MINUTES_PER_DAY, Math.max(0, minutes));

/** The slot of `step` minutes under `minutes`: a click or a tap. */
export function sdCalendarSlot(minutes: number, step: number): SdCalendarSpan {
  const start = Math.min(MINUTES_PER_DAY - step, Math.floor(clampMinutes(minutes) / step) * step);
  return { start, end: start + step };
}

/** Span swept from `anchor` to `current` minutes: `[min, max + step]`, kept inside the day. */
export function sdCalendarSweep(anchor: number, current: number, step: number): SdCalendarSpan {
  const a = sdCalendarSlot(anchor, step).start;
  const b = sdCalendarSlot(current, step).start;
  return { start: Math.min(a, b), end: Math.min(MINUTES_PER_DAY, Math.max(a, b) + step) };
}

/** New start of a block dragged by `delta` minutes: `delta` rounded to `moveStep`, kept in `[0, 1440 − duration]`. */
export function sdCalendarSnapMove(start: number, delta: number, duration: number, moveStep: number): number {
  const next = start + Math.round(delta / moveStep) * moveStep;
  return Math.min(MINUTES_PER_DAY - duration, Math.max(0, next));
}

/** New end of a block whose bottom edge moved by `delta`: at least 15 minutes (one step under 15) long, at most 24:00. */
export function sdCalendarResizeEnd(start: number, end: number, delta: number, step: number): number {
  const next = end + Math.round(delta / sdCalendarMoveStep(step)) * sdCalendarMoveStep(step);
  return Math.min(MINUTES_PER_DAY, Math.max(start + Math.min(step, 15), next));
}

/** `'HH:mm'`; 1440 reads `'24:00'`. */
export function sdCalendarClockText(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** Minutes of `'HH:mm'` as `sd-time` reads it, plus `'24:00'` for the end of the day. */
export function sdCalendarTimeToMinutes(value: unknown): number | null {
  if (typeof value === 'string' && value.trim() === '24:00') return MINUTES_PER_DAY;
  return sdTimeToMinutes(value);
}

/**
 * Working spans of a weekday, sorted. `null` hours → `null` (no shading). A weekday without hours is a day off
 * (`[]`). A span without both ends, or whose end is not after its start, is left out.
 */
export function sdCalendarWorkingRanges(hours: SdCalendarWorkingHours | null, weekday: number): SdCalendarSpan[] | null {
  if (hours === null) return null;
  const spans: SdCalendarSpan[] = [];
  for (const range of hours[weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6] ?? []) {
    const start = sdCalendarTimeToMinutes(range.from);
    const end = sdCalendarTimeToMinutes(range.to);
    if (start !== null && end !== null && end > start) spans.push({ start, end });
  }
  return spans.sort((a, b) => a.start - b.start);
}

/** Off-hours spans of a day: the complement of the working spans. `null` (no shading) → none. */
export function sdCalendarOffSegments(working: readonly SdCalendarSpan[] | null): SdCalendarSpan[] {
  if (working === null) return [];
  const off: SdCalendarSpan[] = [];
  let cursor = 0;
  for (const span of working) {
    if (span.start > cursor) off.push({ start: cursor, end: span.start });
    cursor = Math.max(cursor, span.end);
  }
  if (cursor < MINUTES_PER_DAY) off.push({ start: cursor, end: MINUTES_PER_DAY });
  return off;
}

/** First `scrollTop` of the time grid: half an hour above `minutes`, never above the top. */
export function sdCalendarInitialScroll(minutes: number, hourHeight: number): number {
  return (Math.max(0, minutes - 30) / 60) * hourHeight;
}

/** Calendar day of a date-like value, read like `sd-date` reads its model (an instant takes its day in the zone). */
export function sdCalendarReadDay(value: unknown, clock: SdCalendarClock): string | null {
  if (value === 'TODAY') return null;
  return ɵsdNormalizeCalendarDay(value, clock);
}

const localZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Wall-clock day and minutes of a value in the clock's zone.
 *
 * why: read from the zoned parts, not from `SdDateTimeService.toWallClock`: its carrier is a local `Date`, and a
 * wall clock that falls in a DST gap of the browser's own zone (02:30 on a spring-forward day) would shift by an hour.
 */
function wallClock(value: unknown, clock: SdCalendarClock): { day: string; minutes: number } | null {
  if (value === null || value === undefined || value === '') return null;
  const parts = DateUtilities.toZonedParts(value, clock.timeZone === 'local' ? localZone() : clock.timeZone);
  if (!parts) return null;
  return { day: sdCalendarDay(parts.year, parts.month, parts.day), minutes: parts.hour * 60 + parts.minute };
}

/**
 * Where an event sits (§5). `null` when a date cannot be read or a timed event does not end after its start (a
 * timed event needs an `end`). A timed event that ends after midnight of its start day goes to the all-day row; one
 * that ends exactly at that midnight stays in the grid with an end of 1440.
 */
export function sdCalendarPlace(event: SdCalendarEvent, clock: SdCalendarClock): SdCalendarPlacement | null {
  if (event.allDay) {
    const firstDay = sdCalendarReadDay(event.start, clock);
    const hasEnd = event.end !== null && event.end !== undefined && event.end !== '';
    const lastDay = hasEnd ? sdCalendarReadDay(event.end, clock) : firstDay;
    if (!firstDay || !lastDay || lastDay < firstDay) return null;
    // A day read back by `sdCalendarReadDay` always parses.
    const startInstant = clock.parse(firstDay)!.getTime();
    const endInstant = clock.beginOfNextDay(lastDay)!.getTime();
    return {
      allDay: true,
      inGrid: false,
      startDay: firstDay,
      startMinutes: 0,
      endDay: lastDay,
      endMinutes: MINUTES_PER_DAY,
      firstDay,
      lastDay,
      startInstant,
      endInstant,
    };
  }
  const start = wallClock(event.start, clock);
  const end = wallClock(event.end, clock);
  const startInstant = clock.parse(event.start)?.getTime();
  const endInstant = clock.parse(event.end)?.getTime();
  const nextDay = clock.beginOfNextDay(event.start)?.getTime();
  if (!start || !end || startInstant === undefined || endInstant === undefined || nextDay === undefined || endInstant <= startInstant)
    return null;
  if (endInstant <= nextDay) {
    // Ends the same day, or exactly at midnight of the next one (24:00).
    const endMinutes = end.day === start.day ? end.minutes : MINUTES_PER_DAY;
    return {
      allDay: false,
      inGrid: true,
      startDay: start.day,
      startMinutes: start.minutes,
      endDay: start.day,
      endMinutes,
      firstDay: start.day,
      lastDay: start.day,
      startInstant,
      endInstant,
    };
  }
  return {
    allDay: false,
    inGrid: false,
    startDay: start.day,
    startMinutes: start.minutes,
    endDay: end.day,
    endMinutes: end.minutes,
    firstDay: start.day,
    lastDay: end.minutes > 0 ? end.day : sdCalendarAddDays(end.day, -1),
    startInstant,
    endInstant,
  };
}

/** Instant of a wall clock (`minutes` may be 1440: midnight of the next day) in the clock's zone. */
function instantOf(day: string, minutes: number, clock: SdCalendarClock): Date {
  const { year, month, day: date } = partsOf(day);
  if (clock.timeZone === 'local') return new Date(year, month - 1, date, 0, minutes, 0, 0);
  // why: straight from the zoned parts, like `SdDateTimeService.fromWallClock`, without a local carrier in between.
  const next = sdCalendarDayParts(minutes >= MINUTES_PER_DAY ? sdCalendarAddDays(day, 1) : day)!;
  return DateUtilities.fromZonedParts(
    { year: next.year, month: next.month, day: next.day, hour: Math.floor((minutes % MINUTES_PER_DAY) / 60), minute: minutes % 60 },
    clock.timeZone
  );
}

/**
 * Value the calendar emits for a wall clock (§5). Without `transform`: `'yyyy/MM/dd HH:mm:ss'`, or `'yyyy/MM/dd'`
 * when `minutes` is `null` (all-day). With `transform`: the instant of that wall clock in the zone, serialized by
 * `sdSerializeTemporalValue` like `sd-date` and `sd-datetime` (an all-day value is the start of its day).
 */
export function sdCalendarSerialize(
  day: string,
  minutes: number | null,
  clock: SdCalendarClock,
  transform: SdTemporalValueTransform | null | undefined
): string {
  if (transform) return sdSerializeTemporalValue(instantOf(day, minutes ?? 0, clock), transform)!;
  if (minutes === null) return day;
  const target = minutes >= MINUTES_PER_DAY ? sdCalendarAddDays(day, 1) : day;
  const rest = minutes % MINUTES_PER_DAY;
  return `${target} ${pad(Math.floor(rest / 60))}:${pad(rest % 60)}:00`;
}

/** The current span of a placed event, serialized like a new one so `request.from` and `request.to` match. */
export function sdCalendarRangeOf(
  placement: SdCalendarPlacement,
  clock: SdCalendarClock,
  transform: SdTemporalValueTransform | null | undefined
): SdCalendarRange {
  if (placement.allDay) {
    return {
      start: sdCalendarSerialize(placement.startDay, null, clock, transform),
      end: sdCalendarSerialize(placement.endDay, null, clock, transform),
      allDay: true,
    };
  }
  return {
    start: sdCalendarSerialize(placement.startDay, placement.startMinutes, clock, transform),
    end: sdCalendarSerialize(placement.endDay, placement.endMinutes, clock, transform),
    allDay: false,
  };
}
