import type { ɵSdCalendarPlacement } from '@sdcorejs/angular/components/calendar';
import type { SdSchedulerResource, SdSchedulerView, SdSchedulerVisibleRange } from './scheduler.model';

// RED stubs of checkpoint 1: the signatures compile, the results are wrong on purpose.

export type SdSchedulerPlacement = Pick<
  ɵSdCalendarPlacement,
  'allDay' | 'inGrid' | 'startDay' | 'startMinutes' | 'endDay' | 'endMinutes' | 'firstDay' | 'lastDay'
>;

export interface SdSchedulerLaneItem {
  readonly start: number;
  readonly end: number;
  readonly allDay: boolean;
}

export interface SdSchedulerLaneLayout {
  readonly count: number;
  readonly order: readonly { readonly index: number; readonly lane: number }[];
}

export interface SdSchedulerDaySpan {
  readonly start: number;
  readonly end: number;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
}

export interface SdSchedulerColumnSpan {
  readonly from: number;
  readonly to: number;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
}

export interface SdSchedulerHitRow {
  readonly key: string;
  readonly resourceId: string | null;
  readonly top: number;
  readonly bottom: number;
}

export function sdSchedulerVisibleDays(_view: SdSchedulerView, date: string, _firstDayOfWeek: number): string[] {
  return [date];
}

export function sdSchedulerVisibleRange(view: SdSchedulerView, date: string, _firstDayOfWeek: number): SdSchedulerVisibleRange {
  return { from: date, to: date, view };
}

export function sdSchedulerColumns(days: readonly string[], _view: SdSchedulerView, _hideWeekends: boolean): string[] {
  return [...days];
}

export function sdSchedulerLanes(items: readonly SdSchedulerLaneItem[]): SdSchedulerLaneLayout {
  return { count: 0, order: items.map((_, index) => ({ index, lane: 0 })) };
}

export function sdSchedulerRowHeight(_lanes: number): number {
  return 0;
}

export function sdSchedulerLaneTop(_lane: number, _lanes: number): number {
  return 0;
}

export function sdSchedulerDaySpan(_placement: SdSchedulerPlacement, _day: string): SdSchedulerDaySpan | null {
  return null;
}

export function sdSchedulerDayBox(_span: Pick<SdSchedulerDaySpan, 'start' | 'end'>, _hourWidth: number): { left: number; width: number } {
  return { left: 0, width: 0 };
}

export function sdSchedulerColumnSpan(_placement: SdSchedulerPlacement, _columns: readonly string[]): SdSchedulerColumnSpan | null {
  return null;
}

export function sdSchedulerColumnBox(_span: Pick<SdSchedulerColumnSpan, 'from' | 'to'>, _count: number): { start: number; size: number } {
  return { start: 0, size: 0 };
}

export function sdSchedulerNextResource(
  _ids: readonly string[],
  _current: string,
  _direction: 1 | -1,
  _accept: (id: string) => boolean
): string | null {
  return null;
}

export function sdSchedulerResizeDays(_firstDay: string, lastDay: string, _days: number, _maxDay: string): string {
  return lastDay;
}

export function sdSchedulerGroups<R>(resources: readonly SdSchedulerResource<R>[]): {
  readonly ungrouped: readonly SdSchedulerResource<R>[];
  readonly groups: readonly { readonly name: string; readonly resources: readonly SdSchedulerResource<R>[] }[];
} {
  return { ungrouped: resources, groups: [] };
}

export function sdSchedulerRowAt(_rows: readonly SdSchedulerHitRow[], _y: number): SdSchedulerHitRow | null {
  return null;
}

export function sdSchedulerColumnAt(_edges: readonly number[], _x: number): number {
  return -1;
}
