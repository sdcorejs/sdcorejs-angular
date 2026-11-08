import type { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type { SdTimelineChange, SdTimelineItem } from './timeline.model';

/** What the timeline helpers need from `SdDateTimeService`; every date is read in the configured zone. */
export type SdTimelineClock = Pick<SdDateTimeService, 'toWallClock' | 'toFormat' | 'parse'>;

/** Consecutive entries of one day (`key` = `yyyy-MM-dd` in the zone; `null` when no entry has a readable date). */
export interface SdTimelineDayGroup<T = unknown> {
  readonly key: string | null;
  readonly items: readonly SdTimelineItem<T>[];
}

/** Day of a wall-clock carrier as `yyyy-MM-dd`. */
function keyOfCarrier(carrier: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `${carrier.getFullYear()}-${pad(carrier.getMonth() + 1)}-${pad(carrier.getDate())}`;
}

/** Day key of `at` in the zone, or `null` when it is not a date. */
export function sdTimelineDayKey(at: unknown, clock: SdTimelineClock): string | null {
  const carrier = clock.toWallClock(at);
  return carrier && Number.isFinite(carrier.getTime()) ? keyOfCarrier(carrier) : null;
}

/**
 * Groups consecutive entries of the same day without reordering them, so newest-first, oldest-first and mixed
 * orders all show a day heading at every day change. An unreadable date stays at the end of the current group.
 */
export function sdTimelineGroupByDay<T>(items: readonly SdTimelineItem<T>[], clock: SdTimelineClock): SdTimelineDayGroup<T>[] {
  const groups: { key: string | null; items: SdTimelineItem<T>[] }[] = [];
  for (const item of items) {
    const key = sdTimelineDayKey(item.at, clock);
    const current = groups[groups.length - 1];
    if (current && (key === null || current.key === key)) {
      current.items.push(item);
    } else if (current && current.key === null) {
      // why: a group that so far holds only unreadable dates takes the first readable day after it.
      current.key = key;
      current.items.push(item);
    } else {
      groups.push({ key, items: [item] });
    }
  }
  return groups;
}

/** Day heading: today, yesterday, or the date, in the zone. `text` is always `dd/MM/yyyy`. */
export function sdTimelineDayLabel(
  key: string,
  nowMs: number,
  clock: SdTimelineClock
): { kind: 'today' | 'yesterday' | 'date'; text: string } {
  const [year, month, day] = key.split('-');
  const text = `${day}/${month}/${year}`;
  const today = clock.toWallClock(nowMs);
  if (!today) return { kind: 'date', text };
  if (keyOfCarrier(today) === key) return { kind: 'today', text };
  // why: arithmetic on the wall-clock carrier, not on the instant, so a DST shift cannot skip a day.
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  return { kind: keyOfCarrier(yesterday) === key ? 'yesterday' : 'date', text };
}

/** Time of an entry: relative within the last hour of today (day groups), `HH:mm`, or `HH:mm dd/MM/yyyy`. */
export interface SdTimelineTime {
  readonly kind: 'just-now' | 'minutes' | 'clock' | 'full' | 'invalid';
  /** Whole minutes since the entry, for `minutes`. */
  readonly minutes: number;
  /** `HH:mm` in the zone. */
  readonly clock: string;
  /** `HH:mm dd/MM/yyyy` in the zone. */
  readonly full: string;
  /** ISO instant for `<time datetime>`, or empty. */
  readonly iso: string;
}

const MINUTE = 60_000;

export function sdTimelineTime(at: unknown, groupBy: 'day' | 'none', nowMs: number, clock: SdTimelineClock): SdTimelineTime {
  const instant = clock.parse(at);
  if (!instant || !Number.isFinite(instant.getTime())) return { kind: 'invalid', minutes: 0, clock: '', full: '', iso: '' };
  const base = { clock: clock.toFormat(at, 'HH:mm'), full: clock.toFormat(at, 'HH:mm dd/MM/yyyy'), iso: instant.toISOString() };
  if (groupBy === 'none') return { kind: 'full', minutes: 0, ...base };
  const elapsed = nowMs - instant.getTime();
  const sameDay = sdTimelineDayKey(at, clock) === sdTimelineDayKey(nowMs, clock);
  if (sameDay && elapsed >= 0 && elapsed < 60 * MINUTE) {
    const minutes = Math.floor(elapsed / MINUTE);
    return { kind: minutes < 1 ? 'just-now' : 'minutes', minutes, ...base };
  }
  return { kind: 'clock', minutes: 0, ...base };
}

/** Whether `at` still shows a relative time, so the instance timer has to keep running. */
export function sdTimelineIsRecent(at: unknown, nowMs: number, clock: SdTimelineClock): boolean {
  const kind = sdTimelineTime(at, 'day', nowMs, clock).kind;
  return kind === 'just-now' || kind === 'minutes';
}

/** Visible change rows: three while folded, all when expanded; `hidden` counts the rows past the third. */
export function sdTimelineChangeRows(
  changes: readonly SdTimelineChange[],
  expanded: boolean
): { rows: readonly SdTimelineChange[]; hidden: number } {
  const hidden = Math.max(changes.length - 3, 0);
  return { rows: expanded || hidden === 0 ? changes : changes.slice(0, 3), hidden };
}
