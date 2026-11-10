import type { SdTimeRangeValue } from '@sdcorejs/angular/forms/time-range';
import type { Color } from '@sdcorejs/utils/models';

/** Layout of `sd-calendar`. */
export type SdCalendarView = 'month' | 'week' | 'day' | 'agenda';

/** A date value read through `SdDateTimeService`: a `Date`, epoch milliseconds or a string. */
export type SdCalendarDateInput = Date | string | number;

/** What started a move: dragging the block, dragging its bottom edge, `Alt` + arrow keys, or `move()`. */
export type SdCalendarMoveSource = 'drag' | 'resize' | 'keyboard' | 'api';

/** Which occurrences of a recurring event a move applies to. */
export type SdCalendarMoveScope = 'this' | 'following' | 'all';

/** Static flag or predicate of a context. Evaluated while rendering and again right before the action runs. */
export type SdCalendarState<C> = boolean | ((context: C) => boolean);

/** One event shown by the calendar. Map your DTO into this shape inside `dataSource.onLoad`. */
export interface SdCalendarEvent<T = unknown> {
  /** Unique within the result of one `onLoad`. Every occurrence of a recurring event has its own id. */
  id: string;
  /** Not empty; the name read by screen readers. */
  title: string;
  start: SdCalendarDateInput;
  /** Timed: the exclusive end instant. All-day: the last day, inclusive; omitted means one day. */
  end?: SdCalendarDateInput | null;
  /** Defaults to `false`. */
  allDay?: boolean;
  /** A `Color` or any CSS colour. Defaults to `'primary'`. */
  color?: Color | string;
  /** Set when the event is one occurrence of a series already expanded by the server or the consumer. */
  occurrence?: SdCalendarOccurrence | null;
  /** Caller-owned DTO, kept by reference and never serialized. */
  data?: T;
}

/** Marks an event as one occurrence of a recurring series. */
export interface SdCalendarOccurrence {
  readonly seriesId: string;
  /** Start of this occurrence by the rule, before any exception. */
  readonly originalStart: SdCalendarDateInput;
}

/** A time span in the form the calendar emits (see "Date values" in `sd-calendar.md`). */
export interface SdCalendarRange {
  readonly start: string;
  readonly end: string;
  readonly allDay: boolean;
}

/** Days on screen, both ends included. Same shape as `SdDateRangeValue`, plus the view. */
export interface SdCalendarVisibleRange {
  /** `'yyyy/MM/dd'`. */
  readonly from: string;
  /** `'yyyy/MM/dd'`. */
  readonly to: string;
  readonly view: SdCalendarView;
}

/** Arguments of `dataSource.onLoad`. */
export interface SdCalendarLoadArgs extends SdCalendarVisibleRange {
  /** Aborted when the range changes, on `reload()`, when `option` changes or when the calendar is destroyed. */
  readonly signal: AbortSignal;
}

/** Arguments of `create.onCreate`: the span the user picked. */
export interface SdCalendarCreateArgs extends SdCalendarRange {
  /** Aborted when `option` changes or the calendar is destroyed. */
  readonly signal: AbortSignal;
}

/** Proposal passed to `move.onMove`. Nothing changes on screen until it is accepted. */
export interface SdCalendarMoveRequest<T = unknown> {
  readonly event: SdCalendarEvent<T>;
  readonly from: SdCalendarRange;
  readonly to: SdCalendarRange;
  readonly source: SdCalendarMoveSource;
  /** `null` when the event is not an occurrence of a recurring series. */
  readonly scope: SdCalendarMoveScope | null;
  /**
   * Aborted when the range changes, on `reload()`, when `option` changes, when `disabled` or `readonly` turns on, or
   * when the calendar is destroyed. Cooperative: it does not undo a backend change that already happened.
   */
  readonly signal: AbortSignal;
}

/** Payload of `sdMoveError`. A `'cancel'` result emits nothing. */
export interface SdCalendarMoveError<T = unknown> {
  readonly request: SdCalendarMoveRequest<T>;
  readonly reason: 'rejected' | 'error';
  readonly error?: unknown;
}

/** A public holiday or a named day. */
export interface SdCalendarHoliday {
  readonly date: SdCalendarDateInput;
  readonly label: string;
  /** `off`: a day off, the whole column is shaded and the label uses the error colour. `observance`: the name only. */
  readonly type: 'off' | 'observance';
}

/** Keys 0–6, 0 is Sunday. A weekday without a key, or with an empty list, is a day off. */
export type SdCalendarWorkingHours = Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, readonly SdTimeRangeValue[]>>;

/** Configuration of `<sd-calendar>`: the data source and the capabilities it switches on. */
export interface SdCalendarOption<T = unknown> {
  /** Required. */
  dataSource: {
    /**
     * Returns the events of the visible range. Called on init, whenever the range changes and on `reload()`.
     * Client data: return the whole array, the calendar keeps what falls in the range. Server data: query by
     * `from`/`to` and pass `signal` on. Throw or reject to show the load error with a retry button.
     */
    onLoad: (args: SdCalendarLoadArgs) => readonly SdCalendarEvent<T>[] | Promise<readonly SdCalendarEvent<T>[]>;
  };
  /** Turns on creating by click, sweep, tap and `Enter`. */
  create?: {
    /** Defaults to `true`. The context is the span about to be created. */
    creatable?: SdCalendarState<SdCalendarRange>;
    /**
     * Opens your form. Return the created event to insert it right away; return nothing when the user cancels.
     * Throw or reject to show the failure band. The dashed block stays while this runs.
     */
    onCreate: (args: SdCalendarCreateArgs) => SdCalendarEvent<T> | void | Promise<SdCalendarEvent<T> | void>;
  };
  /** Turns on dragging, resizing the end and `Alt` + arrow keys. */
  move?: {
    /** Defaults to `true`. `false`, or a predicate returning `false`, removes the handle and locks the event. */
    movable?: SdCalendarState<SdCalendarEvent<T>>;
    /**
     * `true` or nothing: accepted. `false`: rejected. `'cancel'`: the user cancelled inside your flow (for example
     * closed a reason dialog); the block goes back without an error. Throw or reject: error.
     */
    onMove: (request: SdCalendarMoveRequest<T>) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>;
  };
}
