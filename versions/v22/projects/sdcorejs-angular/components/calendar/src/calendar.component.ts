import { CdkDrag, type CdkDragEnd, type CdkDragStart, type DragRef, type Point } from '@angular/cdk/drag-drop';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  NgZone,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import type { SdTemporalValueTransform } from '@sdcorejs/angular/forms/models';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import { SdCalendarEdgeScroller } from './calendar-edge-scroll';
import { sdCalendarDateText, sdCalendarFormats, sdCalendarMovedText, sdCalendarTitle, sdCalendarWeekdayLong } from './calendar-format';
import { SdCalendarHostWidth, SdCalendarMinuteTimer, SdCalendarReporter, sdCalendarIsRtl } from './calendar-host';
import { SdCalendarLoader } from './calendar-loader';
import {
  SdCalendarAnnouncer,
  SdCalendarCreateRunner,
  SdCalendarFocusKeeper,
  SdCalendarMoveRunner,
  SdCalendarOperation,
  SdCalendarScopeBar,
  sdCalendarAllows,
} from './calendar-move';
import { SD_CALENDAR_CONFIGURATION, ɵSD_CALENDAR_DEFAULTS } from './calendar.configuration';
import type {
  SdCalendarDateInput,
  SdCalendarEvent,
  SdCalendarHoliday,
  SdCalendarMoveError,
  SdCalendarMoveRequest,
  SdCalendarMoveSource,
  SdCalendarOption,
  SdCalendarRange,
  SdCalendarView,
  SdCalendarVisibleRange,
  SdCalendarWorkingHours,
} from './calendar.model';
import {
  SdCalendarAgendaItemTemplateDirective,
  SdCalendarDayCellTemplateDirective,
  SdCalendarEmptyTemplateDirective,
  SdCalendarEventTemplateDirective,
  type SdCalendarAgendaItemTemplateContext,
  type SdCalendarDayCellTemplateContext,
  type SdCalendarEventTemplateContext,
} from './calendar.templates';
import {
  sdCalendarAddDays,
  sdCalendarAddMonthsKeepDay,
  sdCalendarAllDayLayout,
  sdCalendarBoundDay,
  sdCalendarBrokenWeekdays,
  sdCalendarCarrierDay,
  sdCalendarColor,
  sdCalendarClampAgendaDays,
  sdCalendarClockText,
  sdCalendarCssEscape,
  sdCalendarDayParts,
  sdCalendarHolidayMap,
  sdCalendarInitialScroll,
  sdCalendarInvalidItems,
  sdCalendarIsOffDay,
  sdCalendarLastDayOf,
  sdCalendarMonthWeeks,
  sdCalendarMoveStep,
  sdCalendarNormalizeStep,
  sdCalendarOffSegments,
  sdCalendarPlace,
  sdCalendarPointOf,
  sdCalendarRangeKey,
  sdCalendarRangeOf,
  sdCalendarReadDay,
  sdCalendarResizeEnd,
  sdCalendarResolveFirstDayOfWeek,
  sdCalendarResolveStep,
  sdCalendarResolveWorkingHours,
  sdCalendarSameList,
  sdCalendarMoveTarget,
  sdCalendarOutOfRange,
  sdCalendarSelectionGone,
  sdCalendarShiftDate,
  sdCalendarShiftDays,
  sdCalendarSlot,
  sdCalendarSnapMove,
  sdCalendarStack,
  sdCalendarSweep,
  sdCalendarTargetOf,
  sdCalendarTimeToMinutes,
  sdCalendarVisibleDays,
  sdCalendarVisibleRange,
  sdCalendarWeekday,
  sdCalendarWorkingRanges,
  type SdCalendarPlacement,
  type SdCalendarRangeInput,
  type SdCalendarSpan,
  type SdCalendarTarget,
} from './calendar.utils';

const ALL_VIEWS: readonly SdCalendarView[] = ['month', 'week', 'day', 'agenda'];
/** Baseline hour height (px) the content tiers of a block are measured against (§8.2). */
const HOUR_HEIGHT = 48;
const MINUTE = 60_000;
/** Pointer travel (px) under which a press is a click (§9.1). */
const CLICK_SLOP = 5;
/** Horizontal travel (px) of a swipe that changes the day or week (§12). */
const SWIPE = 60;
/** Where the first-load skeleton draws its blocks: [day index, start minute, minutes]. */
const SKELETON: readonly (readonly [number, number, number])[] = [
  [0, 540, 60],
  [1, 600, 90],
  [2, 480, 45],
  [3, 780, 120],
  [4, 570, 60],
];
let nextCalendarId = 0;

interface SdCalendarPlaced<T> {
  readonly event: SdCalendarEvent<T>;
  readonly placement: SdCalendarPlacement;
  /** Drawn at a proposed position while `onMove` (or the scope bar) waits. */
  readonly pending: boolean;
  /** `onMove` runs (not only the scope bar): the block shows the sync icon. */
  readonly saving: boolean;
}

/** @internal View model of one day column / header. */
interface SdCalendarDayView {
  readonly day: string;
  readonly dayNumber: number;
  readonly weekdayShort: string;
  readonly label: string;
  readonly today: boolean;
  readonly off: boolean;
  readonly outOfRange: boolean;
  readonly holiday: SdCalendarHoliday | null;
  readonly offSegments: readonly SdCalendarSpan[];
}

/** @internal Shared view model of a block, a bar, a month line and an agenda row. */
interface SdCalendarItemView<T> {
  readonly key: string;
  readonly event: SdCalendarEvent<T>;
  readonly placement: SdCalendarPlacement;
  readonly range: SdCalendarRange;
  readonly label: string;
  readonly autoId: string | null;
  readonly color: string;
  readonly customColor: string | null;
  readonly recurring: boolean;
  readonly past: boolean;
  readonly pending: boolean;
  readonly saving: boolean;
  readonly movable: boolean;
  readonly timeText: string;
}

/** @internal A timed block of the grid. */
interface SdCalendarBlockView<T> extends SdCalendarItemView<T> {
  readonly top: string;
  readonly height: string;
  readonly column: number;
  readonly columns: number;
  /** `lg` ≥ 62px, `md` 34–61px, `sm` < 34px, `xs` < 20px (§8.2). */
  readonly size: 'lg' | 'md' | 'sm' | 'xs';
  readonly context: SdCalendarEventTemplateContext<T>;
}

/** @internal One line of a month cell. */
interface SdCalendarMonthLine<T> {
  readonly key: string;
  readonly item: SdCalendarItemView<T> | null;
  readonly bar: boolean;
  readonly showTitle: boolean;
  readonly joinStart: boolean;
  readonly joinEnd: boolean;
  readonly text: string;
}

/** @internal A month cell. */
interface SdCalendarMonthCell<T> {
  readonly day: SdCalendarDayView;
  readonly inMonth: boolean;
  readonly label: string;
  readonly lines: readonly SdCalendarMonthLine<T>[];
  readonly more: number;
  /** Compact month: up to three dots, one per colour (§12). */
  readonly dots: readonly { readonly color: string; readonly customColor: string | null }[];
  readonly context: SdCalendarDayCellTemplateContext<T>;
}

/** @internal A day group of the agenda. */
interface SdCalendarAgendaDay<T> {
  readonly day: SdCalendarDayView;
  readonly heading: string;
  readonly rows: readonly (SdCalendarItemView<T> & { readonly context: SdCalendarAgendaItemTemplateContext<T> })[];
}

/** @internal The dashed block of a create (§9.2). */
interface SdCalendarGhost {
  readonly day: string;
  readonly start: number;
  readonly end: number;
  readonly pending: boolean;
  readonly blocked: boolean;
}

/** @internal Where a dragged block would land (§9.3). */
interface SdCalendarDragProposal {
  readonly id: string;
  readonly day: string;
  readonly start: number;
  readonly end: number;
  readonly title: string;
  readonly outside: boolean;
  readonly color: string;
  readonly customColor: string | null;
}

@Component({
  selector: 'sd-calendar',
  standalone: true,
  imports: [CdkDrag, NgTemplateOutlet, SdDataState, SdIcon, SdTranslatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** Month, week, day and agenda calendar with grouped capabilities: `dataSource`, `create` and `move` (see `sd-calendar.md`). */
export class SdCalendar<T = unknown> {
  readonly #clock = inject(SdDateTimeService);
  readonly #i18n = inject(I18nService);
  readonly #configuration = inject(SD_CALENDAR_CONFIGURATION, { optional: true });
  readonly #zone = inject(NgZone);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #reporter = new SdCalendarReporter('[sd-calendar]');
  readonly #t = (key: string, params?: Record<string, string | number>): string => this.#i18n.t(key, params);
  protected readonly baseId = `sd-calendar-${nextCalendarId++}`;

  /** Data source and capabilities. A new object is the signal to load again. */
  readonly option = input.required<SdCalendarOption<T>>();
  /** Layout on screen; one of `views`, otherwise the first of `views`. */
  readonly view = model<SdCalendarView>('week');
  /** Anchor day; the calendar writes back `'yyyy/MM/dd'` (no `transform`). Defaults to today in the zone. */
  readonly date = model<SdCalendarDateInput | null | undefined>(undefined);
  /** Id of the selected event; back to `null` when the event is no longer loaded. */
  readonly selectedId = model<string | null>(null);
  /** Views offered by the switcher, in this order. */
  readonly views = input<readonly SdCalendarView[]>(ALL_VIEWS);
  /** Minutes of one slot, a divisor of 60. Configuration, then 30. */
  readonly step = input<number | undefined>(undefined);
  /** 0–6, 0 is Sunday. Configuration, then 1. */
  readonly firstDayOfWeek = input<number | undefined>(undefined);
  /** Hides Saturday and Sunday in the week and month views. */
  readonly hideWeekends = input(false, { transform: booleanAttribute });
  /** `null` turns the off-hours shading and days off by weekday off. Configuration, then Monday–Friday. */
  readonly workingHours = input<SdCalendarWorkingHours | null | undefined>(undefined);
  /** Configuration, then none. */
  readonly holidays = input<readonly SdCalendarHoliday[] | undefined>(undefined);
  /** First day that can be shown and edited, compared as a calendar day in the zone. */
  readonly minDate = input<SdCalendarDateInput | 'TODAY' | null | undefined>(undefined);
  /** Last day that can be shown and edited, compared as a calendar day in the zone. */
  readonly maxDate = input<SdCalendarDateInput | 'TODAY' | null | undefined>(undefined);
  /** `'HH:mm'` the week and day views open at. Configuration, then the earliest working hour, then 08:00. */
  readonly scrollTime = input<string | undefined>(undefined);
  /** Days of the agenda view, 1–62. */
  readonly agendaDays = input<number>(14);
  /** Fades events that have ended. */
  readonly dimPast = input(false, { transform: booleanAttribute });
  /** Serialization of the values the calendar emits; see "Date values" in `sd-calendar.md`. */
  readonly transform = input<SdTemporalValueTransform | undefined>(undefined);
  /** No create, move or selection; events leave the tab order. Navigation still works. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** No create or move. Selection and navigation still work. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Accessible name of the region; defaults to the translated "Calendar". */
  readonly ariaLabel = input<string | null | undefined>(undefined);
  /** E2E scope: `data-autoid="components-calendar-{autoId}"` and derived child ids. */
  readonly autoId = input<string | null | undefined>(undefined);

  /** An event was clicked, tapped or activated with Enter/Space. */
  readonly sdSelect = output<SdCalendarEvent<T>>();
  /** Once on init, then whenever `from`, `to` or the view on screen changes. */
  readonly sdRangeChange = output<SdCalendarVisibleRange>();
  /** `onMove` accepted and the data changed. */
  readonly sdMove = output<SdCalendarMoveRequest<T>>();
  /** `onMove` rejected or failed. */
  readonly sdMoveError = output<SdCalendarMoveError<T>>();
  /** `onLoad` threw or rejected (never for an aborted load). */
  readonly sdLoadError = output<unknown>();

  protected readonly eventTemplate = contentChild<SdCalendarEventTemplateDirective<T>>(SdCalendarEventTemplateDirective);
  protected readonly dayCellTemplate = contentChild<SdCalendarDayCellTemplateDirective<T>>(SdCalendarDayCellTemplateDirective);
  protected readonly agendaItemTemplate = contentChild<SdCalendarAgendaItemTemplateDirective<T>>(SdCalendarAgendaItemTemplateDirective);
  protected readonly emptyTemplate = contentChild(SdCalendarEmptyTemplateDirective);
  protected readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  protected readonly gridElement = viewChild<ElementRef<HTMLElement>>('grid');

  readonly #loader = new SdCalendarLoader<SdCalendarEvent<T>>();
  readonly #operation = new SdCalendarOperation<'create' | 'move'>();
  readonly #now = signal<Date>(this.#clock.now());
  readonly #hostWidth = new SdCalendarHostWidth(this.#host.nativeElement, this.#zone);
  readonly #width = this.#hostWidth.width;
  readonly #timer = new SdCalendarMinuteTimer(this.#zone, () => this.#now.set(this.#clock.now()));
  readonly #announcer = new SdCalendarAnnouncer();
  readonly #focus = new SdCalendarFocusKeeper(
    this.#host.nativeElement,
    this.#injector,
    id => `[data-event-id="${sdCalendarCssEscape(id)}"][tabindex]`,
    '.sd-calendar__scope'
  );
  readonly #edge = new SdCalendarEdgeScroller(this.#zone);
  /** Move waiting for `onMove`: the event is drawn at `target` (§8.3, saving). */
  readonly #moving = signal<{ readonly id: string; readonly target: SdCalendarTarget; readonly saving: boolean } | null>(null);
  /** Scope bar of a recurring event (§9.6); it holds the one waiting operation until answered. */
  protected readonly scopeBar = new SdCalendarScopeBar(this.#host.nativeElement, this.#injector);
  readonly #ghost = signal<SdCalendarGhost | null>(null);
  readonly #failure = signal<{ readonly id: string | null; readonly message: string } | null>(null);
  readonly #drag = signal<SdCalendarDragProposal | null>(null);
  readonly #resize = signal<{ readonly id: string; readonly end: number } | null>(null);
  readonly #cursor = signal<{ readonly day: string; readonly minutes: number } | null>(null);
  readonly #monthFocus = signal<string | null>(null);
  readonly #runner = new SdCalendarMoveRunner({
    operation: this.#operation,
    announcer: this.#announcer,
    focus: this.#focus,
    t: this.#t,
    ask: (title, signal) => this.scopeBar.ask(title, signal),
    band: failure => this.#failure.set(failure),
    reload: () => this.reload(),
  });
  readonly #creator = new SdCalendarCreateRunner({
    operation: this.#operation,
    announcer: this.#announcer,
    t: this.#t,
    band: failure => this.#failure.set(failure),
  });
  #emittedKey: string | null = null;
  #lastOption: SdCalendarOption<T> | null = null;
  /** A drag just ended: the click that follows its mouseup must not select. Reset on the next press. */
  #justDragged = false;
  #press: {
    readonly day: string;
    readonly anchor: number;
    readonly x: number;
    readonly y: number;
    readonly touch: boolean;
    readonly column: HTMLElement;
    moved: boolean;
  } | null = null;
  #dragSession: {
    readonly id: string;
    readonly placement: SdCalendarPlacement;
    readonly title: string;
    readonly color: string;
    readonly customColor: string | null;
    readonly start: Point;
    readonly scrollTop: number;
    readonly columns: readonly { readonly day: string; readonly left: number; readonly right: number }[];
    cancelled: boolean;
  } | null = null;
  #dragPointer: Point | null = null;
  /** Where the press that may start a drag happened (CDK's start event is the move that crossed the threshold). */
  #pickup: Point | null = null;
  #resizeSession: { readonly id: string; readonly placement: SdCalendarPlacement; readonly y: number } | null = null;
  #stripPress: { readonly x: number; readonly y: number } | null = null;

  /** Host narrower than 600px (§12): measured on the host, not the viewport. */
  protected readonly compact = computed(() => {
    const width = this.#width();
    return width !== null && width < 600;
  });
  /** Host at least 720px wide: the agenda shows the place column. */
  protected readonly wide = computed(() => (this.#width() ?? 0) >= 720);
  protected readonly phase = this.#loader.phase.asReadonly();
  protected readonly announcement = this.#announcer.text;
  protected readonly failure = this.#failure.asReadonly();
  protected readonly ghost = this.#ghost.asReadonly();
  protected readonly dragProposal = this.#drag.asReadonly();
  protected readonly cursor = this.#cursor.asReadonly();
  protected readonly scopeMessageId = `${this.baseId}-scope`;
  protected readonly busy = computed(() => this.#loader.phase() === 'loading' || this.#loader.phase() === 'reloading');
  protected readonly skeleton = computed(() => this.#loader.phase() === 'loading' && !this.#loader.everLoaded());
  protected readonly rootAutoId = computed(() => (this.autoId() ? `components-calendar-${this.autoId()}` : null));
  protected readonly regionLabel = computed(() => this.ariaLabel() || this.#i18n.t('core.component.calendar.label'));

  protected readonly stepValue = computed(() => sdCalendarResolveStep(this.step(), this.#configuration));
  readonly #firstDayOfWeek = computed(() => sdCalendarResolveFirstDayOfWeek(this.firstDayOfWeek(), this.#configuration));
  readonly #workingHours = computed<SdCalendarWorkingHours | null>(() =>
    sdCalendarResolveWorkingHours(this.workingHours(), this.#configuration)
  );
  readonly #holidays = computed(() => sdCalendarHolidayMap(this.holidays(), this.#configuration, this.#clock));

  protected readonly today = computed(() => sdCalendarCarrierDay(this.#now()));
  readonly #nowMinutes = computed(() => this.#now().getHours() * 60 + this.#now().getMinutes());
  readonly #nowInstant = computed(() => this.#clock.fromWallClock(this.#now()).getTime());
  readonly #anchor = computed(() => {
    const value = this.date();
    return (value === null || value === undefined ? null : sdCalendarReadDay(value, this.#clock)) ?? this.today();
  });
  readonly #minDay = computed(() => sdCalendarBoundDay(this.minDate(), this.today(), this.#clock));
  readonly #maxDay = computed(() => sdCalendarBoundDay(this.maxDate(), this.today(), this.#clock));

  /** Views of the switcher; the week button is hidden while compact (§12). */
  protected readonly viewOptions = computed(() => {
    const views = this.views().length ? this.views() : ALL_VIEWS;
    return this.compact() ? views.filter(view => view !== 'week') : views;
  });
  protected readonly activeView = computed<SdCalendarView>(() => {
    const views = this.views().length ? this.views() : ALL_VIEWS;
    return views.includes(this.view()) ? this.view() : views[0];
  });
  /** What is drawn: a compact week is drawn as a day. */
  protected readonly displayView = computed<SdCalendarView>(() =>
    this.compact() && this.activeView() === 'week' ? 'day' : this.activeView()
  );
  protected readonly timeView = computed(() => this.displayView() === 'week' || this.displayView() === 'day');
  readonly #rangeInput = computed<SdCalendarRangeInput>(() => ({
    view: this.displayView(),
    date: this.#anchor(),
    firstDayOfWeek: this.#firstDayOfWeek(),
    hideWeekends: this.hideWeekends(),
    agendaDays: sdCalendarClampAgendaDays(this.agendaDays()),
  }));
  protected readonly visible = computed(() => sdCalendarVisibleRange(this.#rangeInput()), {
    equal: (a, b) => sdCalendarRangeKey(a) === sdCalendarRangeKey(b),
  });
  protected readonly days = computed(() => sdCalendarVisibleDays(this.#rangeInput()), { equal: sdCalendarSameList });

  /** Duplicate or empty id, or an empty title: the whole data set is refused (§5). */
  protected readonly invalid = computed(() => sdCalendarInvalidItems(this.#loader.items()));
  /** No create and no move (§4.1, §13): disabled, readonly, loading, load error or invalid data. */
  protected readonly locked = computed(
    () => this.disabled() || this.readonly() || this.busy() || this.#loader.phase() === 'error' || this.invalid()
  );
  /** Create is on: `option.create` and not locked. */
  protected readonly canCreate = computed(() => !!this.option().create && !this.locked());

  readonly #formats = computed(() => sdCalendarFormats(this.#i18n.locale(), this.#i18n.language()));

  protected readonly title = computed(() => {
    const view = this.displayView();
    const { from, to } = this.visible();
    const kind = view === 'month' || (this.compact() && view === 'day') ? 'month' : view === 'agenda' ? 'range' : view;
    return sdCalendarTitle(kind, { anchor: this.#anchor(), from, to }, this.#formats(), (key, params) => this.#i18n.t(key, params));
  });

  protected readonly prevLabel = computed(() => this.#navLabel('prev'));
  protected readonly nextLabel = computed(() => this.#navLabel('next'));
  protected readonly prevDisabled = computed(() => {
    const min = this.#minDay();
    return !!min && sdCalendarVisibleRange({ ...this.#rangeInput(), date: sdCalendarShiftDate(this.#rangeInput(), -1) }).to < min;
  });
  protected readonly nextDisabled = computed(() => {
    const max = this.#maxDay();
    return !!max && sdCalendarVisibleRange({ ...this.#rangeInput(), date: sdCalendarShiftDate(this.#rangeInput(), 1) }).from > max;
  });

  readonly #reading = computed(() => {
    const placed: SdCalendarPlaced<T>[] = [];
    const unreadable: string[] = [];
    const moving = this.#moving();
    for (const event of this.#loader.items()) {
      const placement = sdCalendarPlace(event, this.#clock);
      if (!placement) {
        unreadable.push(event.id);
        continue;
      }
      if (moving?.id === event.id) {
        const range = sdCalendarRangeOf(moving.target, this.#clock, null);
        const proposed = sdCalendarPlace({ ...event, start: range.start, end: range.end, allDay: range.allDay }, this.#clock);
        if (proposed) {
          placed.push({ event, placement: proposed, pending: true, saving: moving.saving });
          continue;
        }
      }
      placed.push({ event, placement, pending: false, saving: false });
    }
    return { placed, unreadable };
  });
  readonly #placed = computed<readonly SdCalendarPlaced<T>[]>(() => this.#reading().placed);
  readonly #inRange = computed(() => {
    const { from, to } = this.visible();
    return this.#placed().filter(({ placement }) => placement.lastDay >= from && placement.firstDay <= to);
  });

  protected readonly dayViews = computed(() => this.days().map(day => this.#dayView(day)));

  protected readonly blocksByDay = computed(() => {
    const byDay = new Map<string, SdCalendarBlockView<T>[]>();
    const days = new Set(this.days());
    const grouped = new Map<string, SdCalendarPlaced<T>[]>();
    for (const placed of this.#inRange()) {
      if (!placed.placement.inGrid || !days.has(placed.placement.startDay)) continue;
      const list = grouped.get(placed.placement.startDay) ?? [];
      list.push(placed);
      grouped.set(placed.placement.startDay, list);
    }
    for (const [day, list] of grouped) {
      // §8.4 step 5: a pending block is left out of the columns and drawn full width on top.
      const stacking = list.filter(item => !item.pending);
      const stacked = sdCalendarStack(stacking.map(({ placement }) => ({ start: placement.startMinutes, end: placement.endMinutes })));
      const views = stacked.map(({ index, column, columns }) => this.#blockView(stacking[index], column, columns));
      for (const item of list) if (item.pending) views.push(this.#blockView(item, 0, 1));
      byDay.set(day, views);
    }
    return byDay;
  });

  protected readonly allDay = computed(() => {
    const days = this.days();
    const items = this.#inRange().filter(({ placement }) => !placement.inGrid);
    const layout = sdCalendarAllDayLayout(
      items.map(({ placement }) => placement),
      days
    );
    const bars = layout.bars.map(bar => {
      const placed = items[bar.index];
      const item = this.#itemView(placed);
      const { placement } = placed;
      const text = placement.allDay ? placed.event.title : `${sdCalendarClockText(placement.startMinutes)} ${placed.event.title}`;
      const spanText =
        placement.firstDay === placement.lastDay
          ? ''
          : `${this.#dateText(placement.firstDay, false)} – ${this.#dateText(placement.lastDay, false)}`;
      return {
        ...item,
        row: bar.row,
        from: bar.from,
        to: bar.to,
        clippedStart: bar.clippedStart,
        clippedEnd: bar.clippedEnd,
        text,
        spanText,
      };
    });
    return { bars, rows: layout.rows, more: layout.more };
  });

  protected readonly monthWeeks = computed(() => {
    if (this.displayView() !== 'month') return [];
    const input = this.#rangeInput();
    const anchor = sdCalendarDayParts(input.date)!;
    const seen = new Set<string>();
    return sdCalendarMonthWeeks(input).map(week => this.#monthWeek(week, anchor.month, seen));
  });
  protected readonly monthHeaders = computed(() => (this.monthWeeks()[0] ?? []).map(cell => cell.day.weekdayShort));
  /** The month cell in the tab order (roving tabindex, §9.7). */
  protected readonly monthFocusDay = computed(() => {
    const days = this.days();
    const focus = this.#monthFocus();
    if (focus && days.includes(focus)) return focus;
    return days.includes(this.#anchor()) ? this.#anchor() : days[0];
  });

  protected readonly agenda = computed<readonly SdCalendarAgendaDay<T>[]>(() => {
    if (this.displayView() !== 'agenda') return [];
    const groups: SdCalendarAgendaDay<T>[] = [];
    const seen = new Set<string>();
    for (const day of this.days()) {
      const placed = this.#inRange()
        .filter(({ placement }) => placement.firstDay <= day && placement.lastDay >= day)
        .sort((a, b) => Number(b.placement.allDay) - Number(a.placement.allDay) || a.placement.startInstant - b.placement.startInstant);
      const view = this.#dayView(day);
      if (!placed.length && !view.holiday) continue;
      groups.push({
        day: view,
        heading: `${this.#weekdayLong(day)}, ${this.#dateText(day, false)}`,
        rows: placed.map(item => {
          const row = firstSegment(this.#itemView(item), seen);
          return { ...row, context: { $implicit: item.event, event: item.event, range: row.range, view: 'agenda', pending: item.pending } };
        }),
      });
    }
    return groups;
  });
  protected readonly agendaCount = computed(() => this.days().length);

  protected readonly skeletonBlocks = SKELETON;
  protected readonly hours = Array.from({ length: 23 }, (_, index) => index + 1);
  protected readonly zoneLabel = computed(() => {
    const zone = this.#clock.timeZone;
    const format = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'shortOffset',
      ...(zone && zone !== 'local' ? { timeZone: zone } : {}),
    });
    return format.formatToParts(this.#clock.fromWallClock(this.#now())).find(part => part.type === 'timeZoneName')?.value ?? '';
  });
  protected readonly nowTop = computed(() => offsetTop(this.#nowMinutes()));
  protected readonly cursorId = `${this.baseId}-cursor`;
  protected readonly cursorLabel = computed(() => {
    const cursor = this.#cursor();
    return cursor ? this.#slotLabel(cursor.day, cursor.minutes) : '';
  });
  protected readonly gridInstructionsId = `${this.baseId}-grid-help`;
  protected readonly eventInstructionsId = `${this.baseId}-event-help`;
  protected readonly dragDelay = { touch: 400, mouse: 0 };

  constructor() {
    const destroyRef = inject(DestroyRef);

    // why: one effect owns loading and the range output, so a range emits once and only together with its load.
    effect(() => {
      untracked(() => this.#hostWidth.measureOnce());
      const option = this.option();
      const range = this.visible();
      untracked(() => {
        const key = sdCalendarRangeKey(range);
        if (key !== this.#emittedKey) {
          this.#emittedKey = key;
          this.sdRangeChange.emit(range);
        }
        // SC-15: a new source also aborts a waiting create; a range change or a reload aborts a waiting move only.
        if (this.#lastOption !== null && this.#lastOption !== option) this.#abortCreate();
        this.#lastOption = option;
        this.#startLoad(option, range);
      });
    });

    effect(() => {
      for (const id of this.#reading().unreadable) {
        this.#reporter.report(
          'warn',
          `date:${id}`,
          `event "${id}" has an unreadable date or does not end after it starts; it is not shown.`
        );
      }
    });

    effect(() => {
      const step = this.step() ?? this.#configuration?.step;
      if (step !== undefined && sdCalendarNormalizeStep(step) === null) {
        this.#reporter.report('warn', `step:${step}`, `step ${step} is not one of 5, 10, 15, 20, 30, 60; 30 is used.`);
      }
    });

    effect(() => {
      for (const weekday of sdCalendarBrokenWeekdays(this.#workingHours())) {
        this.#reporter.report(
          'warn',
          `hours:${weekday}`,
          `workingHours[${weekday}] has a range without both ends or that does not end after it starts; it is ignored.`
        );
      }
    });

    // SC-15: turning disabled or readonly on aborts a waiting move.
    effect(() => {
      if (this.disabled() || this.readonly()) untracked(() => this.#abortMove());
    });

    // why: the timer only runs while today is on a time grid, and outside the zone so it does not tick change detection.
    const ticking = computed(() => this.timeView() && this.days().includes(this.today()));
    effect(() => this.#timer.run(ticking()));

    // Scroll to the working day when the week or day view opens; not when the week only changes.
    effect(() => {
      if (!this.timeView()) return;
      untracked(() => afterNextRender(() => this.#scrollToStart(), { injector: this.#injector }));
    });

    effect(() => {
      if (sdCalendarSelectionGone(this.selectedId(), this.#loader.phase(), this.#loader.items()))
        untracked(() => this.selectedId.set(null));
    });

    destroyRef.onDestroy(() => {
      this.#loader.abort();
      this.#operation.abort();
      this.#hostWidth.disconnect();
      this.#timer.stop();
      this.#stopEdgeScroll();
      document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    });
  }

  /** The 7-day strip of a compact week (§12). */
  protected readonly strip = computed(() => {
    if (!this.compact() || this.activeView() !== 'week') return [];
    const anchor = this.#anchor();
    const placed = this.#placed();
    return sdCalendarVisibleDays({ ...this.#rangeInput(), view: 'week' }).map(day => {
      const view = this.#dayView(day);
      return {
        day,
        weekdayShort: view.weekdayShort,
        dayNumber: view.dayNumber,
        label: view.label,
        today: view.today,
        current: day === anchor,
        events: placed.some(({ placement }) => placement.firstDay <= day && placement.lastDay >= day),
      };
    });
  });

  /** Hours printed (§16): from the earliest working hour to the latest one of the days on screen. */
  protected readonly printHours = computed(() => {
    const hours = this.#workingHours();
    let start = 1440;
    let end = 0;
    for (const day of this.days()) {
      for (const span of sdCalendarWorkingRanges(hours, sdCalendarWeekday(day)) ?? []) {
        start = Math.min(start, span.start);
        end = Math.max(end, span.end);
      }
    }
    return end > start ? { start: start / 60, hours: (end - start) / 60 } : { start: 0, hours: 24 };
  });

  /** Aborts a running load and a waiting move, then calls `onLoad` again for the range on screen. */
  reload(): void {
    this.#startLoad(untracked(this.option), untracked(this.visible));
  }

  /**
   * Moves an event through the pipeline of `sd-calendar.md` ("Moving"): `onMove` decides. Resolves `true` only when
   * accepted; `false` without `option.move`, while locked or another operation waits, for an unknown id, a refused
   * `movable`, the same position, a position outside `minDate`/`maxDate`, a rejection, `'cancel'` or an error.
   * With `source: 'api'` (the default) an occurrence of a series is moved with `scope: 'this'` and focus stays put.
   */
  move(
    eventId: string,
    to: { start: SdCalendarDateInput; end?: SdCalendarDateInput | null; allDay?: boolean },
    source: SdCalendarMoveSource = 'api'
  ): Promise<boolean> {
    const placed = untracked(this.#placed).find(item => item.event.id === eventId);
    const target = placed ? this.#targetOf(placed, to) : null;
    if (!placed || !target) return Promise.resolve(false);
    return this.#runMove(eventId, target, source, false);
  }

  // ---- toolbar ----

  protected setView(view: SdCalendarView): void {
    this.view.set(view);
    this.#announceTitle();
  }

  protected shift(direction: 1 | -1): void {
    if (direction < 0 ? this.prevDisabled() : this.nextDisabled()) return;
    this.date.set(sdCalendarShiftDate(this.#rangeInput(), direction));
    this.#announceTitle();
  }

  protected goToday(): void {
    this.#now.set(this.#clock.now());
    this.date.set(this.today());
    this.#announceTitle();
  }

  protected openDay(day: string): void {
    this.date.set(day);
    this.view.set('day');
    this.#announceTitle();
  }

  protected dismissFailure(): void {
    this.#failure.set(null);
  }

  // ---- selection (§9.1) ----

  protected selectItem(event: SdCalendarEvent<T>, domEvent?: Event): void {
    domEvent?.stopPropagation();
    if (this.#justDragged) {
      this.#justDragged = false;
      return;
    }
    if (this.disabled()) return;
    this.selectedId.set(event.id);
    this.sdSelect.emit(event);
  }

  /** Press on an item: a new gesture, and the pickup point of a possible drag. */
  protected onPressItem(domEvent: MouseEvent | TouchEvent): void {
    this.#justDragged = false;
    this.#pickup = sdCalendarPointOf(domEvent);
  }

  protected onItemKeydown(domEvent: KeyboardEvent, item: SdCalendarItemView<T>): void {
    const key = domEvent.key;
    if (key === 'Enter' || key === ' ') {
      domEvent.preventDefault();
      this.selectItem(item.event, domEvent);
      return;
    }
    if (key === 'Escape') {
      domEvent.preventDefault();
      domEvent.stopPropagation();
      this.selectedId.set(null);
      this.gridElement()?.nativeElement.focus();
      return;
    }
    if (!domEvent.altKey || !key.startsWith('Arrow')) return;
    domEvent.preventDefault();
    domEvent.stopPropagation();
    const placement = item.placement;
    let target: SdCalendarTarget | null = null;
    let resize = false;
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      target = this.#shifted(placement, (key === 'ArrowRight') !== this.#rtl() ? 1 : -1, 0);
    } else if (placement.inGrid) {
      const delta = sdCalendarMoveStep(this.stepValue()) * (key === 'ArrowDown' ? 1 : -1);
      resize = domEvent.shiftKey;
      target = resize
        ? {
            ...sdCalendarTargetOf(placement),
            endMinutes: sdCalendarResizeEnd(placement.startMinutes, placement.endMinutes, delta, this.stepValue()),
          }
        : this.#shifted(placement, 0, delta);
    }
    // why: a change of the end is a 'resize' whichever input made it, as in sd-scheduler (review RX #2).
    if (target) void this.#runMove(item.event.id, target, resize ? 'resize' : 'keyboard', true);
  }

  // ---- create (§9.2) ----

  protected onGridPointerDown(domEvent: PointerEvent): void {
    if (!domEvent.isPrimary || domEvent.button !== 0) return;
    const target = domEvent.target as Element;
    const column = target.closest<HTMLElement>('[data-day-column]');
    if (!column || target.closest('[data-event-id], [data-resize-handle]')) return;
    this.#press = {
      day: column.dataset['date']!,
      anchor: this.#minutesAt(domEvent.clientY, column),
      x: domEvent.clientX,
      y: domEvent.clientY,
      touch: domEvent.pointerType === 'touch',
      column,
      moved: false,
    };
    try {
      column.setPointerCapture(domEvent.pointerId);
    } catch {
      // why: a synthetic or already released pointer cannot be captured; the press still works without capture.
    }
    document.addEventListener('keydown', this.#onDocumentKeydown, true);
  }

  protected onGridPointerMove(domEvent: PointerEvent): void {
    const press = this.#press;
    if (!press) return;
    if (!press.moved && Math.hypot(domEvent.clientX - press.x, domEvent.clientY - press.y) < CLICK_SLOP) return;
    press.moved = true;
    // §12: on touch a vertical move scrolls; there is no sweep.
    if (press.touch || !this.canCreate() || this.#operation.busy() || this.#outOfRange(press.day)) return;
    const span = sdCalendarSweep(press.anchor, this.#minutesAt(domEvent.clientY, press.column), this.stepValue());
    this.#ghost.set({ ...span, day: press.day, pending: false, blocked: !this.#creatable(press.day, span) });
  }

  protected onGridPointerUp(domEvent?: PointerEvent): void {
    const press = this.#press;
    if (!press) return;
    this.#press = null;
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    // §12: a horizontal touch swipe of at least 60px on the day grid moves one day.
    if (press.touch && domEvent && this.displayView() === 'day' && this.#swipe(press, domEvent)) return;
    const ghost = this.#ghost();
    if (!this.#operation.busy()) this.#ghost.set(null);
    // §9.1: a press on an empty slot clears the selection; with option.create it also creates there.
    this.selectedId.set(null);
    if (this.canCreate() && this.#outOfRange(press.day)) {
      this.#announce(this.#i18n.t('core.component.calendar.out-of-range'));
      return;
    }
    if (press.moved && (press.touch || !ghost)) return;
    const span = press.moved && ghost ? { start: ghost.start, end: ghost.end } : sdCalendarSlot(press.anchor, this.stepValue());
    void this.#create(press.day, span);
  }

  protected pickDay(day: string): void {
    this.date.set(day);
    this.#announceTitle();
  }

  protected onStripPointerDown(domEvent: PointerEvent): void {
    this.#stripPress = { x: domEvent.clientX, y: domEvent.clientY };
  }

  /** §12: a horizontal swipe of the strip moves one week. */
  protected onStripPointerUp(domEvent: PointerEvent): void {
    const press = this.#stripPress;
    this.#stripPress = null;
    const dx = press ? domEvent.clientX - press.x : 0;
    if (!press || Math.abs(dx) < SWIPE || Math.abs(dx) <= Math.abs(domEvent.clientY - press.y)) return;
    this.date.set(sdCalendarAddDays(this.#anchor(), dx < 0 ? 7 : -7));
    this.#announceTitle();
  }

  protected onGridPointerCancel(): void {
    this.#press = null;
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    if (!this.#operation.busy()) this.#ghost.set(null);
  }

  // ---- grid keyboard (§9.7) ----

  protected onGridFocus(): void {
    if (this.#cursor()) return;
    const days = this.days();
    const day = days.includes(this.#anchor()) ? this.#anchor() : days[0];
    const start =
      sdCalendarWorkingRanges(this.#workingHours(), sdCalendarWeekday(day))?.[0]?.start ??
      sdCalendarTimeToMinutes(ɵSD_CALENDAR_DEFAULTS.scrollTime)!;
    this.#cursor.set({ day, minutes: sdCalendarSlot(start, this.stepValue()).start });
  }

  protected onGridKeydown(domEvent: KeyboardEvent): void {
    if (domEvent.target !== domEvent.currentTarget) return;
    this.onGridFocus();
    const cursor = this.#cursor()!;
    const step = this.stepValue();
    const key = domEvent.key;
    let next: { day: string; minutes: number };
    switch (key) {
      case 'ArrowUp':
      case 'ArrowDown':
        next = { day: cursor.day, minutes: Math.min(1440 - step, Math.max(0, cursor.minutes + (key === 'ArrowDown' ? step : -step))) };
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        next = { day: this.#neighbourDay(cursor.day, (key === 'ArrowRight') !== this.#rtl() ? 1 : -1), minutes: cursor.minutes };
        break;
      case 'Home':
      case 'End': {
        const working = sdCalendarWorkingRanges(this.#workingHours(), sdCalendarWeekday(cursor.day)) ?? [];
        const minutes = key === 'Home' ? (working[0]?.start ?? 0) : (working[working.length - 1]?.end ?? 1440) - step;
        next = { day: cursor.day, minutes: sdCalendarSlot(minutes, step).start };
        break;
      }
      case 'PageUp':
      case 'PageDown': {
        const direction = key === 'PageDown' ? 1 : -1;
        this.shift(direction);
        next = { day: sdCalendarAddDays(cursor.day, direction * (this.displayView() === 'week' ? 7 : 1)), minutes: cursor.minutes };
        break;
      }
      case 't':
      case 'T':
        this.goToday();
        next = { day: this.today(), minutes: cursor.minutes };
        break;
      case 'Enter':
      case ' ':
        domEvent.preventDefault();
        void this.#create(cursor.day, { start: cursor.minutes, end: Math.min(1440, cursor.minutes + step) });
        return;
      default:
        return;
    }
    domEvent.preventDefault();
    this.#cursor.set(next);
    this.#announce(this.#slotLabel(next.day, next.minutes));
    afterNextRender(() => this.#revealCursor(), { injector: this.#injector });
  }

  // ---- month keyboard (§9.7) ----

  protected onCellKeydown(domEvent: KeyboardEvent, day: string): void {
    const key = domEvent.key;
    if (key === 'Enter' || key === ' ') {
      domEvent.preventDefault();
      this.openDay(day);
      return;
    }
    const week = this.monthWeeks()
      .find(row => row.some(cell => cell.day.day === day))
      ?.map(cell => cell.day.day) ?? [day];
    let next: string | null = null;
    if (key === 'ArrowLeft' || key === 'ArrowRight') next = sdCalendarAddDays(day, (key === 'ArrowRight') !== this.#rtl() ? 1 : -1);
    else if (key === 'ArrowUp' || key === 'ArrowDown') next = sdCalendarAddDays(day, key === 'ArrowDown' ? 7 : -7);
    else if (key === 'Home') next = week[0];
    else if (key === 'End') next = week[week.length - 1];
    else if (key === 'PageUp' || key === 'PageDown')
      next = sdCalendarAddMonthsKeepDay(day, (key === 'PageDown' ? 1 : -1) * (domEvent.shiftKey ? 12 : 1));
    if (!next) return;
    domEvent.preventDefault();
    const focus = next;
    this.#monthFocus.set(focus);
    if (!this.days().includes(focus)) this.date.set(focus);
    afterNextRender(() => this.#host.nativeElement.querySelector<HTMLElement>(`[role="gridcell"][data-date="${focus}"]`)?.focus(), {
      injector: this.#injector,
    });
  }

  // ---- drag (§9.3) ----

  /** Keeps the dragged element in place (the proposal is drawn instead) and records the real pointer. */
  protected readonly constrainDrag = (point: Point, _ref: DragRef, rect: DOMRect): Point => {
    // why: CDK 19 reports the constrained point in cdkDragMoved, so the real pointer is kept from here.
    this.#dragPointer = point;
    return { x: rect.left, y: rect.top };
  };

  protected onDragStarted(start: CdkDragStart, item: SdCalendarItemView<T>): void {
    const columns = Array.from(this.#host.nativeElement.querySelectorAll<HTMLElement>('[data-day-column]')).map(column => {
      const rect = column.getBoundingClientRect();
      return { day: column.dataset['date']!, left: rect.left, right: rect.right };
    });
    this.#dragSession = {
      id: item.event.id,
      placement: item.placement,
      title: item.event.title,
      color: item.color,
      customColor: item.customColor,
      start: this.#pickup ?? sdCalendarPointOf(start.event) ?? { x: 0, y: 0 },
      scrollTop: this.scroller()?.nativeElement.scrollTop ?? 0,
      columns,
      cancelled: false,
    };
    this.#failure.set(null);
    if (typeof TouchEvent !== 'undefined' && start.event instanceof TouchEvent) navigator.vibrate?.(10);
    document.addEventListener('keydown', this.#onDocumentKeydown, true);
  }

  protected onDragMoved(): void {
    this.#updateDragProposal();
    this.#edgeScroll();
  }

  protected onDragEnded(end: CdkDragEnd): void {
    end.source.reset();
    this.#stopEdgeScroll();
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    const session = this.#dragSession;
    const proposal = this.#drag();
    this.#dragSession = null;
    this.#dragPointer = null;
    this.#drag.set(null);
    this.#justDragged = true;
    if (!session || !proposal || session.cancelled || proposal.outside) return;
    const target: SdCalendarTarget = {
      allDay: false,
      startDay: proposal.day,
      startMinutes: proposal.start,
      endDay: proposal.day,
      endMinutes: proposal.end,
    };
    void this.#runMove(session.id, target, 'drag', false);
  }

  // ---- resize (§9.4) ----

  protected onResizeDown(domEvent: PointerEvent, item: SdCalendarItemView<T>): void {
    domEvent.stopPropagation();
    if (!domEvent.isPrimary || !item.movable) return;
    this.#resizeSession = { id: item.event.id, placement: item.placement, y: domEvent.clientY };
    this.#failure.set(null);
    try {
      (domEvent.currentTarget as Element).setPointerCapture(domEvent.pointerId);
    } catch {
      // why: see onGridPointerDown.
    }
    document.addEventListener('keydown', this.#onDocumentKeydown, true);
  }

  protected onResizeMove(domEvent: PointerEvent): void {
    const session = this.#resizeSession;
    if (!session) return;
    const delta = ((domEvent.clientY - session.y) / this.#hourHeight()) * 60;
    const end = sdCalendarResizeEnd(session.placement.startMinutes, session.placement.endMinutes, delta, this.stepValue());
    this.#resize.set({ id: session.id, end });
  }

  protected onResizeUp(domEvent: PointerEvent): void {
    domEvent.stopPropagation();
    const session = this.#resizeSession;
    const resize = this.#resize();
    this.#resizeSession = null;
    this.#resize.set(null);
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    if (!session || !resize) return;
    void this.#runMove(session.id, { ...sdCalendarTargetOf(session.placement), endMinutes: resize.end }, 'resize', false);
  }

  /** The browser took the pointer away (a scroll or a system gesture): the live resize is dropped. */
  protected onResizeCancel(): void {
    this.#resizeSession = null;
    this.#resize.set(null);
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
  }

  /** Height of a block, following a live resize. */
  protected blockHeight(block: SdCalendarBlockView<T>): string {
    const resize = this.#resize();
    return resize?.id === block.key ? blockHeight(resize.end - block.placement.startMinutes) : block.height;
  }

  /** Time line of a block, following a live resize. */
  protected blockTime(block: SdCalendarBlockView<T>): string {
    const resize = this.#resize();
    if (resize?.id !== block.key) return block.timeText;
    return `${sdCalendarClockText(block.placement.startMinutes)} – ${sdCalendarClockText(resize.end)}`;
  }

  protected isDragging(id: string): boolean {
    return this.#drag()?.id === id;
  }

  protected isFailed(id: string): boolean {
    return this.#failure()?.id === id;
  }

  protected spanTop(minutes: number): string {
    return offsetTop(minutes);
  }

  protected spanHeight(minutes: number): string {
    return blockHeight(minutes);
  }

  protected clockText(minutes: number): string {
    return sdCalendarClockText(minutes);
  }

  protected viewLabel(view: SdCalendarView): string {
    return this.#i18n.t(`core.component.calendar.view-${view}`);
  }

  protected childAutoId(kind: string): string | null {
    const root = this.rootAutoId();
    return root ? `${root}-${kind}` : null;
  }

  /** Name of the "+N" button of the all-day row: the visible "+2" leads it in every language (WCAG 2.5.3). */
  protected allDayMoreLabel(count: number, day: SdCalendarDayView): string {
    const visible = this.#i18n.t('core.component.calendar.more-short', { count });
    const more = this.#i18n.t('core.component.calendar.more', { count });
    return `${more.startsWith(visible) ? more : `${visible}, ${more}`}, ${day.label}`;
  }

  protected blocksOf(day: string): readonly SdCalendarBlockView<T>[] {
    return this.blocksByDay().get(day) ?? [];
  }

  // ---- pipeline (§9.5) ----

  async #runMove(id: string, target: SdCalendarTarget, source: SdCalendarMoveSource, keyboard: boolean): Promise<boolean> {
    const move = untracked(this.option).move;
    if (!move || untracked(this.locked) || untracked(this.#operation.busy)) return false;
    const placed = untracked(this.#placed).find(item => item.event.id === id);
    if (!placed || !sdCalendarAllows(move.movable, placed.event)) return false;
    const transform = untracked(this.transform);
    const from = sdCalendarRangeOf(placed.placement, this.#clock, transform);
    const to = sdCalendarRangeOf(target, this.#clock, transform);
    if (from.start === to.start && from.end === to.end && from.allDay === to.allDay) return false;
    if (this.#outOfRange(target.startDay) || this.#outOfRange(sdCalendarLastDayOf(target))) {
      this.#announce(this.#i18n.t('core.component.calendar.out-of-range'));
      return false;
    }
    const { event } = placed;
    return this.#runner.run<SdCalendarMoveRequest<T>>({
      id,
      title: event.title,
      recurring: !!event.occurrence,
      source,
      keyboard,
      // SC-06: the flag is evaluated once more right before the callback.
      allowed: () => sdCalendarAllows(move.movable, event),
      request: (scope, signal) => ({ event, from, to, source, scope, signal }),
      onMove: move.onMove,
      show: saving => this.#moving.set(saving === null ? null : { id, target, saving }),
      accept: request => {
        const moved: SdCalendarEvent<T> = { ...event, start: to.start, end: to.end, allDay: to.allDay };
        this.#loader.items.update(items => items.map(item => (item.id === event.id ? moved : item)));
        const visible = untracked(this.visible);
        if (target.startDay < visible.from || target.startDay > visible.to) this.date.set(target.startDay);
        this.sdMove.emit(request);
        return sdCalendarMovedText(event.title, target, from, to, source, this.#formats(), this.#t);
      },
      fail: (request, outcome) =>
        this.sdMoveError.emit(
          outcome.kind === 'error' ? { request, reason: 'error', error: outcome.error } : { request, reason: 'rejected' }
        ),
    });
  }

  async #create(day: string, span: SdCalendarSpan): Promise<void> {
    const create = untracked(this.option).create;
    if (!create || untracked(this.locked) || untracked(this.#operation.busy)) return;
    if (this.#outOfRange(day)) {
      this.#announce(this.#i18n.t('core.component.calendar.out-of-range'));
      return;
    }
    const range = this.#createRange(day, span);
    if (!sdCalendarAllows(create.creatable, range)) return;
    await this.#creator.run<SdCalendarRange, SdCalendarEvent<T>>({
      args: range,
      onCreate: create.onCreate,
      show: waiting => this.#ghost.set(waiting ? { day, start: span.start, end: span.end, pending: true, blocked: false } : null),
      accept: event => {
        this.#loader.items.update(items => [...items, event]);
        this.selectedId.set(event.id);
      },
    });
  }

  #createRange(day: string, span: SdCalendarSpan): SdCalendarRange {
    return sdCalendarRangeOf(
      { allDay: false, startDay: day, startMinutes: span.start, endDay: day, endMinutes: span.end },
      this.#clock,
      untracked(this.transform)
    );
  }

  #creatable(day: string, span: SdCalendarSpan): boolean {
    return sdCalendarAllows(untracked(this.option).create?.creatable, this.#createRange(day, span));
  }

  #startLoad(option: SdCalendarOption<T>, range: SdCalendarVisibleRange): void {
    this.#abortMove();
    // R1-G8: "now" may be stale when the minute timer is off (month, agenda); refresh it with every load.
    this.#now.set(this.#clock.now());
    void this.#loader
      .load(
        sdCalendarRangeKey(range),
        signal => option.dataSource.onLoad({ from: range.from, to: range.to, view: range.view, signal }),
        error => {
          this.#announce(this.#i18n.t('core.component.calendar.load-error'));
          this.sdLoadError.emit(error);
        }
      )
      .then(() => this.#focus.pending());
  }

  #abortMove(): void {
    if (!this.#operation.abort(['move'])) return;
    this.#moving.set(null);
    this.scopeBar.answer(null);
  }

  #abortCreate(): void {
    if (this.#operation.abort(['create'])) this.#ghost.set(null);
  }

  #targetOf(
    placed: SdCalendarPlaced<T>,
    to: { start: SdCalendarDateInput; end?: SdCalendarDateInput | null; allDay?: boolean }
  ): SdCalendarTarget | null {
    return sdCalendarMoveTarget(placed.placement, to, !!placed.event.allDay, this.#clock);
  }

  #shifted(placement: SdCalendarPlacement, days: number, minutes: number): SdCalendarTarget {
    if (placement.inGrid) {
      const duration = placement.endMinutes - placement.startMinutes;
      const start = minutes
        ? sdCalendarSnapMove(placement.startMinutes, minutes, duration, sdCalendarMoveStep(this.stepValue()))
        : placement.startMinutes;
      const day = sdCalendarAddDays(placement.startDay, days);
      return { allDay: false, startDay: day, startMinutes: start, endDay: day, endMinutes: start + duration };
    }
    return sdCalendarShiftDays(placement, days);
  }

  #updateDragProposal(): void {
    const session = this.#dragSession;
    const pointer = this.#dragPointer;
    if (!session || !pointer || session.cancelled) return;
    const { columns, placement } = session;
    const grid = this.gridElement()?.nativeElement.getBoundingClientRect();
    const outside = !grid || pointer.x < grid.left || pointer.x > grid.right || pointer.y < grid.top || pointer.y > grid.bottom;
    let column = columns.findIndex(item => pointer.x >= item.left && pointer.x < item.right);
    if (column < 0) column = pointer.x < (columns[0]?.left ?? 0) ? 0 : columns.length - 1;
    const scrolled = (this.scroller()?.nativeElement.scrollTop ?? 0) - session.scrollTop;
    const delta = ((pointer.y - session.start.y + scrolled) / this.#hourHeight()) * 60;
    const duration = placement.endMinutes - placement.startMinutes;
    const start = sdCalendarSnapMove(placement.startMinutes, delta, duration, sdCalendarMoveStep(this.stepValue()));
    const day = columns[column]?.day ?? placement.startDay;
    const { title, color, customColor } = session;
    this.#drag.set({ id: session.id, day, start, end: start + duration, title, outside, color, customColor });
  }

  /** Scrolls while the pointer is within 40px of the top or bottom of the scroll area, faster closer to it (§9.3). */
  #edgeScroll(): void {
    const scroller = this.scroller()?.nativeElement;
    this.#edge.update(scroller, scroller?.getBoundingClientRect() ?? null, this.#dragPointer, { x: false, y: true }, () => {
      if (!this.#dragSession) return;
      this.#updateDragProposal();
      this.#edgeScroll();
    });
  }

  #stopEdgeScroll(): void {
    this.#edge.stop();
  }

  /** Esc cancels a sweep, a drag or a resize. */
  readonly #onDocumentKeydown = (domEvent: KeyboardEvent): void => {
    if (domEvent.key !== 'Escape') return;
    this.#zone.run(() => {
      if (this.#press) {
        this.#press = null;
        if (!this.#operation.busy()) this.#ghost.set(null);
      }
      if (this.#dragSession) {
        this.#dragSession.cancelled = true;
        this.#drag.set(null);
      }
      if (this.#resizeSession) {
        this.#resizeSession = null;
        this.#resize.set(null);
      }
    });
    // A cancelled sweep or resize has nothing left to end it, so the listener goes now; a drag ends on its drop.
    if (!this.#press && !this.#dragSession && !this.#resizeSession) {
      document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    }
  };

  #restoreFocus(id: string, origin: Element | null): void {
    this.#focus.restore(id, origin);
  }

  #revealCursor(): void {
    const scroller = this.scroller()?.nativeElement;
    const cursor = this.#cursor();
    if (!scroller || !cursor) return;
    const hour = this.#hourHeight();
    const head = scroller.querySelector<HTMLElement>('[data-head]')?.offsetHeight ?? 0;
    const top = (cursor.minutes / 60) * hour;
    const bottom = top + (this.stepValue() / 60) * hour;
    if (top < scroller.scrollTop) scroller.scrollTop = top;
    else if (head + bottom > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = head + bottom - scroller.clientHeight;
  }

  #neighbourDay(day: string, direction: 1 | -1): string {
    const days = this.days();
    const next = days[days.indexOf(day) + direction];
    if (next) return next;
    this.shift(direction);
    const shifted = this.days();
    return direction > 0 ? shifted[0] : shifted[shifted.length - 1];
  }

  /** Moves one day for a horizontal swipe; returns whether the press was one. */
  #swipe(press: { readonly x: number; readonly y: number }, domEvent: PointerEvent): boolean {
    const dx = domEvent.clientX - press.x;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) <= Math.abs(domEvent.clientY - press.y)) return false;
    this.date.set(sdCalendarAddDays(this.#anchor(), dx < 0 ? 1 : -1));
    this.#announceTitle();
    return true;
  }

  #minutesAt(clientY: number, column: HTMLElement): number {
    const rect = column.getBoundingClientRect();
    return Math.min(1439, Math.max(0, ((clientY - rect.top) / this.#hourHeight()) * 60));
  }

  #hourHeight(): number {
    return parseFloat(getComputedStyle(this.#host.nativeElement).getPropertyValue('--sd-calendar-hour-height')) || HOUR_HEIGHT;
  }

  #rtl(): boolean {
    return sdCalendarIsRtl(this.#host.nativeElement);
  }

  #outOfRange(day: string): boolean {
    return sdCalendarOutOfRange(day, untracked(this.#minDay), untracked(this.#maxDay));
  }

  #slotLabel(day: string, minutes: number): string {
    return this.#i18n.t('core.component.calendar.slot-label', {
      weekday: this.#weekdayLong(day),
      date: this.#dateText(day, false),
      time: sdCalendarClockText(minutes),
    });
  }

  #scrollToStart(): void {
    const element = this.scroller()?.nativeElement;
    if (!element) return;
    const minutes = sdCalendarTimeToMinutes(this.scrollTime() ?? this.#configuration?.scrollTime) ?? this.#earliestWorkingMinute();
    element.scrollTop = sdCalendarInitialScroll(minutes, this.#hourHeight());
  }

  #earliestWorkingMinute(): number {
    const hours = this.#workingHours();
    const starts = this.days()
      .map(day => sdCalendarWorkingRanges(hours, sdCalendarWeekday(day))?.[0]?.start)
      .filter((start): start is number => start !== undefined);
    return starts.length ? Math.min(...starts) : sdCalendarTimeToMinutes(ɵSD_CALENDAR_DEFAULTS.scrollTime)!;
  }

  #announceTitle(): void {
    this.#announce(untracked(this.title));
  }

  #announce(message: string): void {
    this.#announcer.announce(message);
  }

  #navLabel(direction: 'prev' | 'next'): string {
    const view = this.displayView();
    if (view === 'agenda') {
      return this.#i18n.t(`core.component.calendar.${direction}-agenda`, { count: sdCalendarClampAgendaDays(this.agendaDays()) });
    }
    return this.#i18n.t(`core.component.calendar.${direction}-${view}`);
  }

  #weekdayLong(day: string): string {
    return sdCalendarWeekdayLong(this.#formats(), day);
  }

  #dateText(day: string, withYear: boolean): string {
    return sdCalendarDateText(this.#formats(), day, withYear);
  }

  #dayView(day: string): SdCalendarDayView {
    const weekday = sdCalendarWeekday(day);
    const holiday = this.#holidays().get(day) ?? null;
    const working = sdCalendarWorkingRanges(this.#workingHours(), weekday);
    const off = sdCalendarIsOffDay(day, holiday, this.#workingHours());
    const min = this.#minDay();
    const max = this.#maxDay();
    return {
      day,
      dayNumber: sdCalendarDayParts(day)!.day,
      weekdayShort: this.#i18n.t(`core.component.calendar.weekday-short-${weekday}`),
      label: `${this.#weekdayLong(day)} ${this.#dateText(day, false)}`,
      today: day === this.today(),
      off,
      outOfRange: (!!min && day < min) || (!!max && day > max),
      holiday,
      offSegments: off ? [] : sdCalendarOffSegments(working),
    };
  }

  #itemView(placed: SdCalendarPlaced<T>): SdCalendarItemView<T> {
    const { event, placement } = placed;
    const { color, customColor } = sdCalendarColor(event.color);
    const start = sdCalendarClockText(placement.startMinutes);
    const end = sdCalendarClockText(placement.endMinutes);
    const recurring = !!event.occurrence;
    let label: string;
    if (placement.allDay) {
      label = this.#i18n.t('core.component.calendar.event-label-all-day', {
        title: event.title,
        from: this.#dateText(placement.firstDay, false),
        to: this.#dateText(placement.lastDay, false),
      });
    } else {
      label = this.#i18n.t('core.component.calendar.event-label', {
        title: event.title,
        weekday: this.#weekdayLong(placement.startDay),
        date: this.#dateText(placement.startDay, false),
        start,
        end: placement.inGrid ? end : `${this.#dateText(placement.endDay, false)} ${end}`,
      });
    }
    if (recurring) label = `${label}, ${this.#i18n.t('core.component.calendar.recurring')}`;
    const root = this.rootAutoId();
    const move = this.option().move;
    return {
      key: event.id,
      event,
      placement,
      range: sdCalendarRangeOf(placement, this.#clock, this.transform()),
      label,
      autoId: root ? `${root}-event-${encodeURIComponent(event.id)}` : null,
      color,
      customColor,
      recurring,
      past: this.dimPast() && placement.endInstant <= this.#nowInstant(),
      pending: placed.pending,
      saving: placed.saving,
      movable: !!move && !this.locked() && sdCalendarAllows(move.movable, event),
      timeText: placement.allDay ? this.#i18n.t('core.component.calendar.all-day') : `${start} – ${end}`,
    };
  }

  #blockView(placed: SdCalendarPlaced<T>, column: number, columns: number): SdCalendarBlockView<T> {
    const item = this.#itemView(placed);
    const { startMinutes, endMinutes } = placed.placement;
    const pixels = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT - 2, 16);
    const size = pixels >= 62 ? 'lg' : pixels >= 34 ? 'md' : pixels >= 20 ? 'sm' : 'xs';
    return {
      ...item,
      top: `calc(${offsetTop(startMinutes)} + 1px)`,
      height: blockHeight(endMinutes - startMinutes),
      column,
      columns,
      size,
      context: {
        $implicit: placed.event,
        event: placed.event,
        range: item.range,
        view: this.displayView(),
        compact: pixels < 34,
        pending: placed.pending,
      },
    };
  }

  /** Cells of one month row; `seen` carries the events that already have their `data-autoid` (first segment only). */
  #monthWeek(week: readonly string[], month: number, seen: Set<string>): readonly SdCalendarMonthCell<T>[] {
    const placed = this.#inRange().filter(({ placement }) => placement.lastDay >= week[0] && placement.firstDay <= week[week.length - 1]);
    const spanning = placed.filter(({ placement }) => !placement.inGrid);
    const layout = sdCalendarAllDayLayout(
      spanning.map(({ placement }) => placement),
      week,
      Number.POSITIVE_INFINITY
    );
    return week.map((day, column) => {
      const view = this.#dayView(day);
      const slots: (SdCalendarMonthLine<T> | null)[] = [];
      for (const bar of layout.bars) {
        if (bar.from > column || bar.to < column) continue;
        const item = firstSegment(this.#itemView(spanning[bar.index]), seen);
        const { placement, event } = spanning[bar.index];
        slots[bar.row] = {
          key: `${event.id}`,
          item,
          bar: true,
          showTitle: column === bar.from,
          joinStart: placement.firstDay < day,
          joinEnd: placement.lastDay > day,
          text: placement.allDay ? event.title : `${sdCalendarClockText(placement.startMinutes)} ${event.title}`,
        };
      }
      const lines: SdCalendarMonthLine<T>[] = Array.from(
        slots,
        (slot, row) => slot ?? { key: `gap-${row}`, item: null, bar: false, showTitle: false, joinStart: false, joinEnd: false, text: '' }
      );
      const timed = placed
        .filter(({ placement }) => placement.inGrid && placement.startDay === day)
        .sort((a, b) => a.placement.startMinutes - b.placement.startMinutes);
      for (const entry of timed) {
        lines.push({
          key: entry.event.id,
          item: firstSegment(this.#itemView(entry), seen),
          bar: false,
          showTitle: true,
          joinStart: false,
          joinEnd: false,
          text: `${sdCalendarClockText(entry.placement.startMinutes)} ${entry.event.title}`,
        });
      }
      const limit = view.holiday ? 2 : 3;
      const real = lines.filter(line => line.item).length;
      const shown = lines.length > limit ? lines.slice(0, limit - 1) : lines;
      const more = real - shown.filter(line => line.item).length;
      const events = placed.filter(({ placement }) => placement.firstDay <= day && placement.lastDay >= day).map(({ event }) => event);
      const label = view.holiday
        ? this.#i18n.t('core.component.calendar.day-label-holiday', {
            weekday: this.#weekdayLong(day),
            date: this.#dateText(day, false),
            holiday: view.holiday.label,
            count: events.length,
          })
        : this.#i18n.t('core.component.calendar.day-label', {
            weekday: this.#weekdayLong(day),
            date: this.#dateText(day, false),
            count: events.length,
          });
      const inMonth = sdCalendarDayParts(day)!.month === month;
      const dots = new Map<string, { color: string; customColor: string | null }>();
      for (const event of events) {
        const color = event.color ?? 'primary';
        if (dots.size < 3 && !dots.has(color)) dots.set(color, sdCalendarColor(color));
      }
      return {
        day: view,
        inMonth,
        label,
        lines: shown,
        more,
        dots: [...dots.values()],
        context: { $implicit: day, date: day, events, holiday: view.holiday, today: view.today, inMonth, off: view.off },
      };
    });
  }
}

/**
 * Keeps `data-autoid` on the first segment of an event only: a multi-day event repeats in month cells and agenda days,
 * and an E2E selector must stay unique (R1-G5).
 */
function firstSegment<V extends { readonly key: string; readonly autoId: string | null }>(item: V, seen: Set<string>): V {
  if (!item.autoId) return item;
  if (seen.has(item.key)) return { ...item, autoId: null };
  seen.add(item.key);
  return item;
}

function offsetTop(minutes: number): string {
  return `calc(var(--sd-calendar-hour-height) * ${minutes / 60})`;
}

function blockHeight(minutes: number): string {
  return `max(calc(var(--sd-calendar-hour-height) * ${minutes / 60} - 2px), 16px)`;
}
