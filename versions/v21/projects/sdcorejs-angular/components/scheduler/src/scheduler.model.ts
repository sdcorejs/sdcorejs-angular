import type {
  SdCalendarEvent,
  SdCalendarMoveScope,
  SdCalendarMoveSource,
  SdCalendarRange,
  SdCalendarState,
  SdCalendarWorkingHours,
} from '@sdcorejs/angular/components/calendar';

/** Layout of `sd-scheduler`: one day on an hour axis, or a week or a month on a day axis. */
export type SdSchedulerView = 'day' | 'week' | 'month';

/** What a move may change: both the time and the resource, only the time, or only the resource. */
export type SdSchedulerMoveAxis = 'both' | 'time' | 'resource';

/** One row of the scheduler: a room, a vehicle, a person. */
export interface SdSchedulerResource<R = unknown> {
  /** Unique within `resources`. */
  id: string;
  /** Not empty; the name read by screen readers. */
  title: string;
  description?: string;
  /** Group label. The same string is the same group; groups keep the order of their first resource. */
  group?: string;
  /** Material Symbols name. Ignored when `avatar` is set. */
  icon?: string;
  /** Image URL shown with `sd-avatar` (initials of `title` when the image fails). */
  avatar?: string;
  /** Overrides the component's `workingHours` for this resource. `null`: no off-hours shading. */
  workingHours?: SdCalendarWorkingHours | null;
  /** Caller-owned DTO, kept by reference and never serialized. */
  data?: R;
}

/** One event of the scheduler: an `SdCalendarEvent` on one resource. */
export interface SdSchedulerEvent<T = unknown> extends SdCalendarEvent<T> {
  /** Exactly one resource. An id that is not in `resources` leaves the event out, with a dev-mode warning. */
  resourceId: string;
}

/** A span on one resource, in the form the scheduler emits. */
export interface SdSchedulerRange extends SdCalendarRange {
  readonly resourceId: string;
}

/** Days on screen, both ends included, and the view. A week with `hideWeekends` still spans the whole week. */
export interface SdSchedulerVisibleRange {
  /** `'yyyy/MM/dd'`. */
  readonly from: string;
  /** `'yyyy/MM/dd'`. */
  readonly to: string;
  readonly view: SdSchedulerView;
}

/** Arguments of `dataSource.onLoad`. */
export interface SdSchedulerLoadArgs extends SdSchedulerVisibleRange {
  /** Ids of `resources`, in their order, collapsed groups included. */
  readonly resourceIds: readonly string[];
  /** Aborted when the range, `resources` or `option` changes, on `reload()` and when the scheduler is destroyed. */
  readonly signal: AbortSignal;
}

/** Context of `create.creatable`: the span about to be created and its resource. */
export interface SdSchedulerCreateContext<R = unknown> extends SdSchedulerRange {
  readonly resource: SdSchedulerResource<R>;
}

/** Arguments of `create.onCreate`. */
export interface SdSchedulerCreateArgs<R = unknown> extends SdSchedulerCreateContext<R> {
  /** Aborted when `option` or `resources` changes or the scheduler is destroyed. */
  readonly signal: AbortSignal;
}

/** Context of `move.droppable`: where the event would land. */
export interface SdSchedulerDropContext<T = unknown, R = unknown> {
  readonly event: SdSchedulerEvent<T>;
  readonly to: SdSchedulerRange;
  readonly resource: SdSchedulerResource<R>;
}

/** Proposal passed to `move.onMove`. Nothing changes on screen until it is accepted. */
export interface SdSchedulerMoveRequest<T = unknown, R = unknown> {
  readonly event: SdSchedulerEvent<T>;
  readonly from: SdSchedulerRange;
  readonly to: SdSchedulerRange;
  /** Target resource; the event's own resource when only the time changes. */
  readonly resource: SdSchedulerResource<R>;
  readonly source: SdCalendarMoveSource;
  /** `null` when the event is not an occurrence of a recurring series. */
  readonly scope: SdCalendarMoveScope | null;
  /**
   * Aborted when the range, `resources` or `option` changes, on `reload()`, when `disabled` or `readonly` turns on,
   * or when the scheduler is destroyed. Cooperative: it does not undo a backend change that already happened.
   */
  readonly signal: AbortSignal;
}

/** Payload of `sdMoveError`. A `'cancel'` result emits nothing. */
export interface SdSchedulerMoveError<T = unknown, R = unknown> {
  readonly request: SdSchedulerMoveRequest<T, R>;
  readonly reason: 'rejected' | 'error';
  readonly error?: unknown;
}

/** Payload of `sdCellSelect` (cell template only): a cell that holds at least one event was activated. */
export interface SdSchedulerCellSelect<T = unknown, R = unknown> {
  readonly resource: SdSchedulerResource<R>;
  /** `'yyyy/MM/dd'`. */
  readonly date: string;
  readonly events: readonly SdSchedulerEvent<T>[];
}

/** Configuration of `<sd-scheduler>`: the data source and the capabilities it switches on. */
export interface SdSchedulerOption<T = unknown, R = unknown> {
  /** Required. */
  dataSource: {
    /**
     * Returns the events of the visible range for `resourceIds`. Called on init, whenever the range, `resources` or
     * `option` changes and on `reload()`. Throw or reject to show the load error with a retry button.
     */
    onLoad: (args: SdSchedulerLoadArgs) => readonly SdSchedulerEvent<T>[] | Promise<readonly SdSchedulerEvent<T>[]>;
  };
  /** Turns on creating by sweep, click, tap and `Enter` on one resource row. */
  create?: {
    /** Defaults to `true`. Evaluated while sweeping and again right before `onCreate`. */
    creatable?: SdCalendarState<SdSchedulerCreateContext<R>>;
    /** Opens your form. Return the created event to insert it; return nothing when the user cancels; throw to fail. */
    onCreate: (args: SdSchedulerCreateArgs<R>) => SdSchedulerEvent<T> | void | Promise<SdSchedulerEvent<T> | void>;
  };
  /** Turns on dragging on two axes, resizing the end and `Alt` + arrow keys. */
  move?: {
    /** Defaults to `true`. `false`, or a predicate returning `false`, locks the event. */
    movable?: SdCalendarState<SdSchedulerEvent<T>>;
    /** `'time'`: only the time changes. `'resource'`: only the resource changes (no horizontal drag, no resize). Defaults to `'both'`. */
    axis?: SdSchedulerMoveAxis;
    /**
     * Runs synchronously while dragging, whenever the target row or slot changes, and right before `onMove`. Do not
     * call an API here; `onMove` stays the final check.
     */
    droppable?: SdCalendarState<SdSchedulerDropContext<T, R>>;
    /** `true` or nothing: accepted. `false`: rejected. `'cancel'`: cancelled in your flow, no error. Throw or reject: error. */
    onMove: (request: SdSchedulerMoveRequest<T, R>) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>;
  };
}
