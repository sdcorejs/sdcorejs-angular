import { Directive, TemplateRef, inject } from '@angular/core';
import type { SdCalendarEvent, SdCalendarHoliday, SdCalendarRange, SdCalendarView, SdCalendarVisibleRange } from './calendar.model';

/** Context of `sdCalendarEventTemplate`. */
export interface SdCalendarEventTemplateContext<T = unknown> {
  $implicit: SdCalendarEvent<T>;
  event: SdCalendarEvent<T>;
  /** Where the block is drawn: the proposed span while a move waits, otherwise the event's own span. */
  range: SdCalendarRange;
  view: SdCalendarView;
  /** The block is shorter than 34px and shows one line. */
  compact: boolean;
  /** A move or a create of this event is waiting for your callback. */
  pending: boolean;
}

/** Context of `sdCalendarAgendaItemTemplate`. */
export type SdCalendarAgendaItemTemplateContext<T = unknown> = Omit<SdCalendarEventTemplateContext<T>, 'compact'>;

/** Context of `sdCalendarDayCellTemplate` (month view). */
export interface SdCalendarDayCellTemplateContext<T = unknown> {
  /** `'yyyy/MM/dd'`. */
  $implicit: string;
  date: string;
  events: readonly SdCalendarEvent<T>[];
  holiday: SdCalendarHoliday | null;
  today: boolean;
  /** The day belongs to the month on screen. */
  inMonth: boolean;
  /** Day off: weekend without working hours or an `off` holiday. */
  off: boolean;
}

/** Context of `sdCalendarEmptyTemplate` (agenda view). */
export interface SdCalendarEmptyTemplateContext {
  $implicit: SdCalendarVisibleRange;
}

/** Replaces the content of an event block; frame, colour, handle and states stay. `let-event`. */
@Directive({ selector: 'ng-template[sdCalendarEventTemplate]', standalone: true })
export class SdCalendarEventTemplateDirective<T = unknown> {
  readonly template = inject<TemplateRef<SdCalendarEventTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _directive: SdCalendarEventTemplateDirective<T>,
    _context: unknown
  ): _context is SdCalendarEventTemplateContext<T> {
    return true;
  }
}

/** Replaces the part of a month cell under the day number (for example a timesheet code). `let-date`. */
@Directive({ selector: 'ng-template[sdCalendarDayCellTemplate]', standalone: true })
export class SdCalendarDayCellTemplateDirective<T = unknown> {
  readonly template = inject<TemplateRef<SdCalendarDayCellTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _directive: SdCalendarDayCellTemplateDirective<T>,
    _context: unknown
  ): _context is SdCalendarDayCellTemplateContext<T> {
    return true;
  }
}

/**
 * Content of the place column of an agenda row, shown when the host is at least 720px wide (§11). Below that width
 * the column, and the template, are left out. `let-event`.
 */
@Directive({ selector: 'ng-template[sdCalendarAgendaItemTemplate]', standalone: true })
export class SdCalendarAgendaItemTemplateDirective<T = unknown> {
  readonly template = inject<TemplateRef<SdCalendarAgendaItemTemplateContext<T>>>(TemplateRef);
  static ngTemplateContextGuard<T>(
    _directive: SdCalendarAgendaItemTemplateDirective<T>,
    _context: unknown
  ): _context is SdCalendarAgendaItemTemplateContext<T> {
    return true;
  }
}

/** Replaces the empty state of the agenda view. `let-range`. */
@Directive({ selector: 'ng-template[sdCalendarEmptyTemplate]', standalone: true })
export class SdCalendarEmptyTemplateDirective {
  readonly template = inject<TemplateRef<SdCalendarEmptyTemplateContext>>(TemplateRef);
  static ngTemplateContextGuard(
    _directive: SdCalendarEmptyTemplateDirective,
    _context: unknown
  ): _context is SdCalendarEmptyTemplateContext {
    return true;
  }
}
