import type { SdTemporalValueTransform } from '@sdcorejs/angular/forms/models';
import type { SdCalendarEvent, SdCalendarRange, SdCalendarView, SdCalendarVisibleRange, SdCalendarWorkingHours } from './calendar.model';

// RED stubs: signatures of checkpoint 1, bodies land in the next commit.

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

export interface SdCalendarRangeInput {
  readonly view: SdCalendarView;
  readonly date: string;
  readonly firstDayOfWeek: number;
  readonly hideWeekends: boolean;
  readonly agendaDays: number;
}

export interface SdCalendarSpan {
  readonly start: number;
  readonly end: number;
}

export interface SdCalendarStacked {
  readonly index: number;
  readonly column: number;
  readonly columns: number;
}

export interface SdCalendarDaySpan {
  readonly firstDay: string;
  readonly lastDay: string;
}

export interface SdCalendarBar {
  readonly index: number;
  readonly row: number;
  readonly from: number;
  readonly to: number;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
}

export interface SdCalendarAllDayLayout {
  readonly bars: readonly SdCalendarBar[];
  readonly rows: number;
  readonly more: readonly number[];
}

export interface SdCalendarPlacement {
  readonly allDay: boolean;
  readonly inGrid: boolean;
  readonly startDay: string;
  readonly startMinutes: number;
  readonly endDay: string;
  readonly endMinutes: number;
  readonly firstDay: string;
  readonly lastDay: string;
  readonly startInstant: number;
  readonly endInstant: number;
}

export const SD_CALENDAR_STEPS: readonly number[] = [];

export function sdCalendarDayParts(_day: string): SdCalendarDayParts | null {
  return null;
}
export function sdCalendarDay(_year: number, _month: number, _day: number): string {
  return '';
}
export function sdCalendarAddDays(_day: string, _days: number): string {
  return '';
}
export function sdCalendarAddMonths(_day: string, _months: number): string {
  return '';
}
export function sdCalendarWeekday(_day: string): number {
  return -1;
}
export function sdCalendarDayDiff(_from: string, _to: string): number {
  return 0;
}
export function sdCalendarStartOfWeek(_day: string, _firstDayOfWeek: number): string {
  return '';
}
export function sdCalendarIsWeekend(_day: string): boolean {
  return false;
}
export function sdCalendarClampAgendaDays(_days: number): number {
  return 0;
}
export function sdCalendarNormalizeStep(_step: number): number | null {
  return null;
}
export function sdCalendarMoveStep(_step: number): number {
  return 0;
}
export function sdCalendarVisibleRange(_input: SdCalendarRangeInput): SdCalendarVisibleRange {
  return { from: '', to: '', view: _input.view };
}
export function sdCalendarVisibleDays(_input: SdCalendarRangeInput): string[] {
  return [];
}
export function sdCalendarMonthWeeks(_input: SdCalendarRangeInput): string[][] {
  return [];
}
export function sdCalendarShiftDate(_input: SdCalendarRangeInput, _direction: 1 | -1): string {
  return '';
}
export function sdCalendarStack(_items: readonly SdCalendarSpan[]): SdCalendarStacked[] {
  return [];
}
export function sdCalendarAllDayLayout(
  _items: readonly SdCalendarDaySpan[],
  _days: readonly string[],
  _maxRows = 3
): SdCalendarAllDayLayout {
  return { bars: [], rows: 0, more: [] };
}
export function sdCalendarSlot(_minutes: number, _step: number): SdCalendarSpan {
  return { start: 0, end: 0 };
}
export function sdCalendarSweep(_anchor: number, _current: number, _step: number): SdCalendarSpan {
  return { start: 0, end: 0 };
}
export function sdCalendarSnapMove(_start: number, _delta: number, _duration: number, _moveStep: number): number {
  return 0;
}
export function sdCalendarResizeEnd(_start: number, _end: number, _delta: number, _step: number): number {
  return 0;
}
export function sdCalendarClockText(_minutes: number): string {
  return '';
}
export function sdCalendarTimeToMinutes(_value: unknown): number | null {
  return null;
}
export function sdCalendarWorkingRanges(_hours: SdCalendarWorkingHours | null, _weekday: number): SdCalendarSpan[] | null {
  return null;
}
export function sdCalendarOffSegments(_working: readonly SdCalendarSpan[] | null): SdCalendarSpan[] {
  return [];
}
export function sdCalendarInitialScroll(_minutes: number, _hourHeight: number): number {
  return -1;
}
export function sdCalendarReadDay(_value: unknown, _clock: SdCalendarClock): string | null {
  return null;
}
export function sdCalendarPlace(_event: SdCalendarEvent, _clock: SdCalendarClock): SdCalendarPlacement | null {
  return null;
}
export function sdCalendarSerialize(
  _day: string,
  _minutes: number | null,
  _clock: SdCalendarClock,
  _transform: SdTemporalValueTransform | null | undefined
): string {
  return '';
}
export function sdCalendarRangeOf(
  _placement: SdCalendarPlacement,
  _clock: SdCalendarClock,
  _transform: SdTemporalValueTransform | null | undefined
): SdCalendarRange {
  return { start: '', end: '', allDay: false };
}
