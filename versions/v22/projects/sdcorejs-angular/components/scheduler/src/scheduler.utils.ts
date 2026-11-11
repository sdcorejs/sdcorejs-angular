import {
  ɵsdCalendarAddDays,
  ɵsdCalendarAddMonths,
  ɵsdCalendarDaysBetween,
  ɵsdCalendarIsWeekend,
  ɵsdCalendarStartOfWeek,
  type ɵSdCalendarPlacement,
} from '@sdcorejs/angular/components/calendar';
import type { SdSchedulerResource, SdSchedulerView, SdSchedulerVisibleRange } from './scheduler.model';

/**
 * Pure helpers of `sd-scheduler` (scheduler.md §1): only what the calendar does not have. Day arithmetic, rounding,
 * reading and writing dates come from the `ɵ` exports of `@sdcorejs/angular/components/calendar`.
 */

const MINUTES_PER_DAY = 1440;
/** Row height without events and per lane (§7). */
const ROW_MIN = 48;
const LANE = 32;
/** Smallest block on the hour axis (§8.2). */
const MIN_BLOCK = 12;

/** Where an event sits; the fields of `ɵSdCalendarPlacement` the scheduler lays out. */
export type SdSchedulerPlacement = Pick<
  ɵSdCalendarPlacement,
  'allDay' | 'inGrid' | 'startDay' | 'startMinutes' | 'endDay' | 'endMinutes' | 'firstDay' | 'lastDay'
>;

/** One item to lay out in lanes: a half-open span `[start, end)` in minutes (day view) or column indexes. */
export interface SdSchedulerLaneItem {
  readonly start: number;
  readonly end: number;
  readonly allDay: boolean;
  /** Week and month: the start instant, so timed blocks of one day keep the order of their start time (§8.4 step 2). */
  readonly at?: number;
}

export interface SdSchedulerLaneLayout {
  /** Lanes the row needs, at least 1. */
  readonly count: number;
  /** In DOM order (§8.4 step 6): `index` points into the input. */
  readonly order: readonly { readonly index: number; readonly lane: number }[];
}

/** Part of one day an event covers on the hour axis, `[start, end)` in minutes. */
export interface SdSchedulerDaySpan {
  readonly start: number;
  readonly end: number;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
}

/** Columns an event covers on the day axis, both ends included. */
export interface SdSchedulerColumnSpan {
  readonly from: number;
  readonly to: number;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
}

/** A row of the drag hit test, in content coordinates of the scroll area. `resourceId` is `null` for a group row. */
export interface SdSchedulerHitRow {
  readonly key: string;
  readonly resourceId: string | null;
  readonly top: number;
  readonly bottom: number;
}

/** Days of the visible range, both ends: one day, the week of `firstDayOfWeek` that holds `date`, or its month (§6). */
export function sdSchedulerVisibleDays(view: SdSchedulerView, date: string, firstDayOfWeek: number): string[] {
  if (view === 'week') {
    const start = ɵsdCalendarStartOfWeek(date, firstDayOfWeek);
    return ɵsdCalendarDaysBetween(start, ɵsdCalendarAddDays(start, 6));
  }
  if (view === 'month') {
    const first = ɵsdCalendarAddMonths(date, 0);
    return ɵsdCalendarDaysBetween(first, ɵsdCalendarAddDays(ɵsdCalendarAddMonths(date, 1), -1));
  }
  return [date];
}

/** `from`/`to` of the visible range; `hideWeekends` does not change them (§6). */
export function sdSchedulerVisibleRange(view: SdSchedulerView, date: string, firstDayOfWeek: number): SdSchedulerVisibleRange {
  const days = sdSchedulerVisibleDays(view, date, firstDayOfWeek);
  return { from: days[0], to: days[days.length - 1], view };
}

/** Columns drawn: the visible days, Saturday and Sunday left out of a week or a month with `hideWeekends`. */
export function sdSchedulerColumns(days: readonly string[], view: SdSchedulerView, hideWeekends: boolean): string[] {
  return view !== 'day' && hideWeekends ? days.filter(day => !ɵsdCalendarIsWeekend(day)) : [...days];
}

/**
 * Lanes of one resource row (§8.4): sorted by start, all-day first on a tie, then by `at`, then the longer first; each
 * item takes the first lane whose last end is at or before its start, otherwise a new lane.
 */
export function sdSchedulerLanes(items: readonly SdSchedulerLaneItem[]): SdSchedulerLaneLayout {
  const sorted = items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        a.item.start - b.item.start ||
        Number(b.item.allDay) - Number(a.item.allDay) ||
        (a.item.at ?? 0) - (b.item.at ?? 0) ||
        b.item.end - a.item.end
    );
  const ends: number[] = [];
  const order = sorted.map(({ item, index }) => {
    let lane = ends.findIndex(end => end <= item.start);
    if (lane < 0) lane = ends.push(item.end) - 1;
    else ends[lane] = item.end;
    return { index, lane };
  });
  return { count: Math.max(1, ends.length), order };
}

/** Row height in px: `max(48, 8 + 32 × lanes)` (§7). */
export function sdSchedulerRowHeight(lanes: number): number {
  return Math.max(ROW_MIN, 8 + LANE * Math.max(1, lanes));
}

/** Top of a block in its row (px): 10 with one lane, `6 + lane × 32` from two lanes (§7). */
export function sdSchedulerLaneTop(lane: number, lanes: number): number {
  return lanes <= 1 ? 10 : 6 + lane * LANE;
}

/**
 * Part of `day` an event covers on the hour axis (§8.2). All-day events cover the whole day. A side that goes past
 * `day` is clipped. `null` when the event does not touch `day` (a timed event that ends at 00:00 of `day` included).
 */
export function sdSchedulerDaySpan(placement: SdSchedulerPlacement, day: string): SdSchedulerDaySpan | null {
  if (placement.firstDay > day || placement.lastDay < day) return null;
  if (placement.allDay) {
    return { start: 0, end: MINUTES_PER_DAY, clippedStart: placement.firstDay < day, clippedEnd: placement.lastDay > day };
  }
  // An end at 24:00 of the start day is read as the start day at 1440, so it is not clipped.
  const clippedStart = placement.startDay < day;
  const clippedEnd = placement.endDay > day;
  const start = clippedStart ? 0 : placement.startMinutes;
  return { start, end: clippedEnd ? MINUTES_PER_DAY : placement.endMinutes, clippedStart, clippedEnd };
}

/** Inline start and size (px) of a block on the hour axis: 1px gap before, 2px after, at least 12px (§7, §8.2). */
export function sdSchedulerDayBox(span: Pick<SdSchedulerDaySpan, 'start' | 'end'>, hourWidth: number): { left: number; width: number } {
  return {
    left: (span.start / 60) * hourWidth + 1,
    width: Math.max(MIN_BLOCK, ((span.end - span.start) / 60) * hourWidth - 3),
  };
}

/**
 * Columns an event covers on the day axis (§8.2): a timed event that stays in its day takes the column of its start
 * day; all-day events and timed events across midnight take every column they cover. `null` when none is drawn.
 */
export function sdSchedulerColumnSpan(placement: SdSchedulerPlacement, columns: readonly string[]): SdSchedulerColumnSpan | null {
  if (!columns.length) return null;
  if (placement.inGrid) {
    const column = columns.indexOf(placement.startDay);
    return column < 0 ? null : { from: column, to: column, clippedStart: false, clippedEnd: false };
  }
  const from = columns.findIndex(day => day >= placement.firstDay);
  let to = columns.length - 1;
  while (to >= 0 && columns[to] > placement.lastDay) to--;
  if (from < 0 || to < from) return null;
  return { from, to, clippedStart: placement.firstDay < columns[0], clippedEnd: placement.lastDay > columns[columns.length - 1] };
}

/** Inline start and size of a column span as fractions of the row (0–1). */
export function sdSchedulerColumnBox(span: Pick<SdSchedulerColumnSpan, 'from' | 'to'>, count: number): { start: number; size: number } {
  return { start: span.from / count, size: (span.to - span.from + 1) / count };
}

/**
 * Resource of `Alt` + `↑` `↓` (§9.7): the nearest one in `direction` that `accept` allows. `ids` are every resource in
 * row order, those of collapsed groups included (the move opens the group, Step 0 H4); group rows are not resources.
 */
export function sdSchedulerNextResource(
  ids: readonly string[],
  current: string,
  direction: 1 | -1,
  accept: (id: string) => boolean
): string | null {
  for (let index = ids.indexOf(current) + direction; index >= 0 && index < ids.length; index += direction) {
    if (accept(ids[index])) return ids[index];
  }
  return null;
}

/**
 * New last day of an all-day event whose end moved by `shift` columns (§9.4): along the columns on screen, so
 * `hideWeekends` skips the weekend; at least its first column, at most the last column. `null` when the last day has no
 * column (cut by the end of the range, or on a hidden weekend day): the end on screen is not the event's end, so that
 * block has no end handle and a resize there would cut the event short.
 */
export function sdSchedulerResizeLastDay(
  placement: Pick<SdSchedulerPlacement, 'firstDay' | 'lastDay'>,
  columns: readonly string[],
  shift: number
): string | null {
  const end = columns.indexOf(placement.lastDay);
  if (end < 0) return null;
  const first = columns.findIndex(day => day >= placement.firstDay);
  return columns[Math.min(columns.length - 1, Math.max(first, end + shift))];
}

/** Resources in row order (§10): those without a group first, then each group in the order of its first resource. */
export function sdSchedulerGroups<R>(resources: readonly SdSchedulerResource<R>[]): {
  readonly ungrouped: readonly SdSchedulerResource<R>[];
  readonly groups: readonly { readonly name: string; readonly resources: readonly SdSchedulerResource<R>[] }[];
} {
  const ungrouped: SdSchedulerResource<R>[] = [];
  const groups = new Map<string, SdSchedulerResource<R>[]>();
  for (const resource of resources) {
    if (!resource.group) {
      ungrouped.push(resource);
      continue;
    }
    const list = groups.get(resource.group);
    if (list) list.push(resource);
    else groups.set(resource.group, [resource]);
  }
  return { ungrouped, groups: [...groups].map(([name, list]) => ({ name, resources: list })) };
}

/** Row under `y` (content coordinates), by binary search over rows sorted by `top`; `null` above or below every row. */
export function sdSchedulerRowAt(rows: readonly SdSchedulerHitRow[], y: number): SdSchedulerHitRow | null {
  let low = 0;
  let high = rows.length - 1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    const row = rows[middle];
    if (y < row.top) high = middle - 1;
    else if (y >= row.bottom) low = middle + 1;
    else return row;
  }
  return null;
}
