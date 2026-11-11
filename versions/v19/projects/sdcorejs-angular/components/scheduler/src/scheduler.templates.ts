import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { SdCalendarHoliday } from '@sdcorejs/angular/components/calendar';
import type { SdSchedulerEvent, SdSchedulerRange, SdSchedulerResource, SdSchedulerView, SdSchedulerVisibleRange } from './scheduler.model';

/** Context of `sdSchedulerEventTemplate`. */
export interface SdSchedulerEventTemplateContext<T = unknown, R = unknown> {
  $implicit: SdSchedulerEvent<T>;
  event: SdSchedulerEvent<T>;
  /** Where the block is drawn: the proposed span while a move waits, otherwise the event's own span. */
  range: SdSchedulerRange;
  resource: SdSchedulerResource<R>;
  view: SdSchedulerView;
  /** The block is narrower than 48px and shows its colour dot only. */
  compact: boolean;
  /** A move of this event is waiting for your callback. */
  pending: boolean;
}

/** Context of `sdSchedulerResourceTemplate`. */
export interface SdSchedulerResourceTemplateContext<R = unknown> {
  $implicit: SdSchedulerResource<R>;
  resource: SdSchedulerResource<R>;
  group: string | null;
  /** The host is narrower than 600px. */
  compact: boolean;
}

/** Context of `sdSchedulerCellTemplate` (week and month views, one cell per resource and day). */
export interface SdSchedulerCellTemplateContext<T = unknown, R = unknown> {
  /** `'yyyy/MM/dd'`. */
  $implicit: string;
  date: string;
  resource: SdSchedulerResource<R>;
  events: readonly SdSchedulerEvent<T>[];
  holiday: SdCalendarHoliday | null;
  today: boolean;
  /** Day off for this resource: no working hours that weekday, or an `off` holiday. */
  off: boolean;
}

/** Context of `sdSchedulerEmptyTemplate` (no resources). */
export interface SdSchedulerEmptyTemplateContext {
  $implicit: SdSchedulerVisibleRange;
}

/** Views a cell template applies to. */
export type SdSchedulerCellView = Exclude<SdSchedulerView, 'day'>;

/** Replaces the content of an event block; frame, colour, handle and states stay. `let-event`. */
@Directive({ selector: 'ng-template[sdSchedulerEventTemplate]', standalone: true })
export class SdSchedulerEventTemplateDirective<T = unknown, R = unknown> {
  readonly template = inject<TemplateRef<SdSchedulerEventTemplateContext<T, R>>>(TemplateRef);
  static ngTemplateContextGuard<T, R>(
    _directive: SdSchedulerEventTemplateDirective<T, R>,
    _context: unknown
  ): _context is SdSchedulerEventTemplateContext<T, R> {
    return true;
  }
}

/** Replaces the content of a resource cell; its frame, width and sticky position stay. `let-resource`. */
@Directive({ selector: 'ng-template[sdSchedulerResourceTemplate]', standalone: true })
export class SdSchedulerResourceTemplateDirective<R = unknown> {
  readonly template = inject<TemplateRef<SdSchedulerResourceTemplateContext<R>>>(TemplateRef);
  static ngTemplateContextGuard<R>(
    _directive: SdSchedulerResourceTemplateDirective<R>,
    _context: unknown
  ): _context is SdSchedulerResourceTemplateContext<R> {
    return true;
  }
}

/**
 * Draws one cell per resource and day instead of event blocks (a timesheet). In the views it applies to there are
 * no blocks, no drag and no resize: a cell with events emits `sdCellSelect`, an empty one creates. `let-date`.
 */
@Directive({ selector: 'ng-template[sdSchedulerCellTemplate]', standalone: true })
export class SdSchedulerCellTemplateDirective<T = unknown, R = unknown> {
  readonly template = inject<TemplateRef<SdSchedulerCellTemplateContext<T, R>>>(TemplateRef);
  /** Views the template applies to. Defaults to week and month; the day view always draws blocks. */
  readonly views = input<readonly SdSchedulerCellView[]>(['week', 'month']);
  static ngTemplateContextGuard<T, R>(
    _directive: SdSchedulerCellTemplateDirective<T, R>,
    _context: unknown
  ): _context is SdSchedulerCellTemplateContext<T, R> {
    return true;
  }
}

/** Replaces the "No resources" state. `let-range`. */
@Directive({ selector: 'ng-template[sdSchedulerEmptyTemplate]', standalone: true })
export class SdSchedulerEmptyTemplateDirective {
  readonly template = inject<TemplateRef<SdSchedulerEmptyTemplateContext>>(TemplateRef);
  static ngTemplateContextGuard(
    _directive: SdSchedulerEmptyTemplateDirective,
    _context: unknown
  ): _context is SdSchedulerEmptyTemplateContext {
    return true;
  }
}
