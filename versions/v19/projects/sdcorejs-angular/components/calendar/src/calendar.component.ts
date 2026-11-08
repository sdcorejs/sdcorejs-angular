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
  isDevMode,
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
import { SD_CALENDAR_CONFIGURATION, ɵSD_CALENDAR_DEFAULTS } from './calendar.configuration';
import type {
  SdCalendarDateInput,
  SdCalendarEvent,
  SdCalendarHoliday,
  SdCalendarMoveError,
  SdCalendarMoveRequest,
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
  sdCalendarAllDayLayout,
  sdCalendarClampAgendaDays,
  sdCalendarClockText,
  sdCalendarDay,
  sdCalendarDayParts,
  sdCalendarInitialScroll,
  sdCalendarMonthWeeks,
  sdCalendarNormalizeStep,
  sdCalendarOffSegments,
  sdCalendarPlace,
  sdCalendarRangeOf,
  sdCalendarReadDay,
  sdCalendarShiftDate,
  sdCalendarStack,
  sdCalendarTimeToMinutes,
  sdCalendarVisibleDays,
  sdCalendarVisibleRange,
  sdCalendarWeekday,
  sdCalendarWorkingRanges,
  type SdCalendarPlacement,
  type SdCalendarRangeInput,
  type SdCalendarSpan,
} from './calendar.utils';

const ALL_VIEWS: readonly SdCalendarView[] = ['month', 'week', 'day', 'agenda'];
const PALETTE = new Set(['primary', 'secondary', 'info', 'success', 'warning', 'error']);
/** Baseline hour height (px) the content tiers of a block are measured against (§8.2). */
const HOUR_HEIGHT = 48;
const MINUTE = 60_000;
/** Where the first-load skeleton draws its blocks: [day index, start minute, minutes]. */
const SKELETON: readonly (readonly [number, number, number])[] = [
  [0, 540, 60],
  [1, 600, 90],
  [2, 480, 45],
  [3, 780, 120],
  [4, 570, 60],
];
let nextCalendarId = 0;

type SdCalendarPhase = 'idle' | 'loading' | 'reloading' | 'error';

interface SdCalendarPlaced<T> {
  readonly event: SdCalendarEvent<T>;
  readonly placement: SdCalendarPlacement;
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
  readonly selected: boolean;
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

/** @internal A bar of the all-day row. */
interface SdCalendarBarView<T> extends SdCalendarItemView<T> {
  readonly row: number;
  readonly from: number;
  readonly to: number;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
  readonly text: string;
  readonly spanText: string;
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
  readonly context: SdCalendarDayCellTemplateContext<T>;
}

/** @internal A day group of the agenda. */
interface SdCalendarAgendaDay<T> {
  readonly day: SdCalendarDayView;
  readonly heading: string;
  readonly rows: readonly (SdCalendarItemView<T> & { readonly context: SdCalendarAgendaItemTemplateContext<T> })[];
}

@Component({
  selector: 'sd-calendar',
  standalone: true,
  imports: [NgTemplateOutlet, SdDataState, SdIcon, SdTranslatePipe],
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
  readonly #reported = new Set<string>();
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

  readonly #now = signal<Date>(this.#clock.now());
  readonly #width = signal<number | null>(null);
  readonly #loaded = signal<readonly SdCalendarEvent<T>[]>([]);
  readonly #phase = signal<SdCalendarPhase>('idle');
  readonly #everLoaded = signal(false);
  readonly #announcement = signal('');
  #controller: AbortController | null = null;
  #loadedKey: string | null = null;
  #emittedKey: string | null = null;

  /** Host narrower than 600px (§12): measured on the host, not the viewport. */
  protected readonly compact = computed(() => {
    const width = this.#width();
    return width !== null && width < 600;
  });
  /** Host at least 720px wide: the agenda shows the place column. */
  protected readonly wide = computed(() => (this.#width() ?? 0) >= 720);
  protected readonly phase = this.#phase.asReadonly();
  protected readonly announcement = this.#announcement.asReadonly();
  protected readonly busy = computed(() => this.#phase() === 'loading' || this.#phase() === 'reloading');
  protected readonly skeleton = computed(() => this.#phase() === 'loading' && !this.#everLoaded());
  protected readonly rootAutoId = computed(() => (this.autoId() ? `components-calendar-${this.autoId()}` : null));
  protected readonly regionLabel = computed(() => this.ariaLabel() || this.#i18n.t('core.component.calendar.label'));

  protected readonly stepValue = computed(
    () => sdCalendarNormalizeStep(this.step() ?? this.#configuration?.step ?? ɵSD_CALENDAR_DEFAULTS.step) ?? 30
  );
  readonly #firstDayOfWeek = computed(() => {
    const value = this.firstDayOfWeek() ?? this.#configuration?.firstDayOfWeek ?? ɵSD_CALENDAR_DEFAULTS.firstDayOfWeek;
    return Number.isInteger(value) && value >= 0 && value <= 6 ? value : ɵSD_CALENDAR_DEFAULTS.firstDayOfWeek;
  });
  readonly #workingHours = computed<SdCalendarWorkingHours | null>(() => {
    const value = this.workingHours();
    if (value !== undefined) return value;
    const configured = this.#configuration?.workingHours;
    return configured !== undefined ? configured : ɵSD_CALENDAR_DEFAULTS.workingHours;
  });
  readonly #holidays = computed(() => {
    const map = new Map<string, SdCalendarHoliday>();
    for (const holiday of this.holidays() ?? this.#configuration?.holidays ?? []) {
      const day = sdCalendarReadDay(holiday.date, this.#clock);
      if (day && !map.has(day)) map.set(day, holiday);
    }
    return map;
  });

  protected readonly today = computed(() => carrierDay(this.#now()));
  readonly #nowMinutes = computed(() => this.#now().getHours() * 60 + this.#now().getMinutes());
  readonly #nowInstant = computed(() => this.#clock.fromWallClock(this.#now()).getTime());
  readonly #anchor = computed(() => {
    const value = this.date();
    return (value === null || value === undefined ? null : sdCalendarReadDay(value, this.#clock)) ?? this.today();
  });
  readonly #minDay = computed(() => this.#boundDay(this.minDate()));
  readonly #maxDay = computed(() => this.#boundDay(this.maxDate()));

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
  protected readonly visible = computed(() => sdCalendarVisibleRange(this.#rangeInput()), { equal: sameRange });
  protected readonly days = computed(() => sdCalendarVisibleDays(this.#rangeInput()), { equal: sameList });

  readonly #formats = computed(() => {
    const locale = this.#i18n.locale();
    const named = this.#i18n.language() === 'en';
    const format = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat =>
      new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    return {
      named,
      weekday: format({ weekday: 'long' }),
      monthShort: format({ month: 'short' }),
      monthLong: format({ month: 'long' }),
      date: format(named ? { month: 'short', day: 'numeric' } : { day: '2-digit', month: '2-digit' }),
      dateYear: format(named ? { month: 'short', day: 'numeric', year: 'numeric' } : { day: '2-digit', month: '2-digit', year: 'numeric' }),
    };
  });

  protected readonly title = computed(() => {
    const view = this.displayView();
    const { from, to } = this.visible();
    const anchor = sdCalendarDayParts(this.#anchor())!;
    const formats = this.#formats();
    const month = (parts: { year: number; month: number }): string =>
      this.#i18n.t('core.component.calendar.title-month', {
        month: parts.month,
        monthName: formats.monthLong.format(utcDay(sdCalendarDay(parts.year, parts.month, 1))),
        year: parts.year,
      });
    if (view === 'month' || (this.compact() && view === 'day')) return month(anchor);
    if (view === 'day') {
      return this.#i18n.t('core.component.calendar.title-day', {
        weekday: this.#weekdayLong(from),
        day: anchor.day,
        month: anchor.month,
        monthName: formats.monthLong.format(utcDay(from)),
        year: anchor.year,
      });
    }
    const a = sdCalendarDayParts(from)!;
    const b = sdCalendarDayParts(to)!;
    if (view === 'week' && a.year === b.year && a.month === b.month) {
      return this.#i18n.t('core.component.calendar.title-week', {
        from: a.day,
        to: b.day,
        month: a.month,
        monthName: formats.monthShort.format(utcDay(from)),
        year: a.year,
      });
    }
    return this.#i18n.t('core.component.calendar.title-range', {
      from: this.#dateText(from, a.year !== b.year),
      to: this.#dateText(to, true),
    });
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

  /** Duplicate or empty id, or an empty title: the whole data set is refused (§5). */
  protected readonly invalid = computed(() => {
    const seen = new Set<string>();
    for (const event of this.#loaded()) {
      if (typeof event.id !== 'string' || !event.id || seen.has(event.id) || typeof event.title !== 'string' || !event.title.trim())
        return true;
      seen.add(event.id);
    }
    return false;
  });
  readonly #reading = computed(() => {
    const placed: SdCalendarPlaced<T>[] = [];
    const unreadable: string[] = [];
    for (const event of this.#loaded()) {
      const placement = sdCalendarPlace(event, this.#clock);
      if (placement) placed.push({ event, placement });
      else unreadable.push(event.id);
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
      const stacked = sdCalendarStack(list.map(({ placement }) => ({ start: placement.startMinutes, end: placement.endMinutes })));
      byDay.set(
        day,
        stacked.map(({ index, column, columns }) => this.#blockView(list[index], column, columns))
      );
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
          return { ...row, context: { $implicit: item.event, event: item.event, range: row.range, view: 'agenda', pending: false } };
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
  protected readonly gridInstructionsId = `${this.baseId}-grid-help`;
  protected readonly eventInstructionsId = `${this.baseId}-event-help`;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // why: one effect owns loading and the range output, so a range emits once and only together with its load.
    effect(() => {
      const option = this.option();
      const range = this.visible();
      untracked(() => {
        const key = rangeKey(range);
        if (key !== this.#emittedKey) {
          this.#emittedKey = key;
          this.sdRangeChange.emit(range);
        }
        void this.#load(option, range);
      });
    });

    effect(() => {
      for (const id of this.#reading().unreadable) {
        this.#report('warn', `date:${id}`, `event "${id}" has an unreadable date or does not end after it starts; it is not shown.`);
      }
    });

    effect(() => {
      const step = this.step() ?? this.#configuration?.step;
      if (isDevMode() && step !== undefined && sdCalendarNormalizeStep(step) === null) {
        this.#report('warn', `step:${step}`, `step ${step} is not one of 5, 10, 15, 20, 30, 60; 30 is used.`);
      }
    });

    // why: the timer only runs while today is on a time grid, and outside the zone so it does not tick change detection.
    let timer: ReturnType<typeof setInterval> | null = null;
    const stopTimer = (): void => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    const ticking = computed(() => this.timeView() && this.days().includes(this.today()));
    effect(() => {
      if (!ticking()) return stopTimer();
      if (timer !== null) return;
      timer = this.#zone.runOutsideAngular(() => setInterval(() => this.#zone.run(() => this.#now.set(this.#clock.now())), MINUTE));
    });

    // Scroll to the working day when the week or day view opens; not when the week only changes.
    effect(() => {
      if (!this.timeView()) return;
      untracked(() => afterNextRender(() => this.#scrollToStart(), { injector: this.#injector }));
    });

    effect(() => {
      const selected = this.selectedId();
      if (selected === null || this.#phase() !== 'idle') return;
      if (!this.#loaded().some(event => event.id === selected)) untracked(() => this.selectedId.set(null));
    });

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(entries => {
            const width = entries[entries.length - 1]?.contentRect.width;
            if (width !== undefined && width !== untracked(this.#width)) this.#zone.run(() => this.#width.set(width));
          });
    observer?.observe(this.#host.nativeElement);

    destroyRef.onDestroy(() => {
      this.#controller?.abort();
      this.#controller = null;
      observer?.disconnect();
      stopTimer();
    });
  }

  /** Aborts a running load and calls `onLoad` again for the range on screen; the events stay until the result arrives. */
  reload(): void {
    void this.#load(untracked(this.option), untracked(this.visible));
  }

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
    this.date.set(this.today());
    this.#announceTitle();
  }

  protected openDay(day: string): void {
    this.date.set(day);
    this.view.set('day');
    this.#announceTitle();
  }

  /** Month cell: Enter/Space opens the day (the roving arrow keys come with the keyboard checkpoint). */
  protected onCellKeydown(event: KeyboardEvent, day: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.openDay(day);
  }

  protected viewLabel(view: SdCalendarView): string {
    return this.#i18n.t(`core.component.calendar.view-${view}`);
  }

  protected childAutoId(kind: string): string | null {
    const root = this.rootAutoId();
    return root ? `${root}-${kind}` : null;
  }

  protected blocksOf(day: string): readonly SdCalendarBlockView<T>[] {
    return this.blocksByDay().get(day) ?? [];
  }

  protected skeletonTop(minutes: number): string {
    return offsetTop(minutes);
  }

  protected skeletonHeight(minutes: number): string {
    return blockHeight(minutes);
  }

  async #load(option: SdCalendarOption<T>, range: SdCalendarVisibleRange): Promise<void> {
    const key = rangeKey(range);
    const keep = key === this.#loadedKey;
    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;
    this.#loadedKey = key;
    if (!keep) this.#loaded.set([]);
    this.#phase.set(keep && this.#everLoaded() ? 'reloading' : 'loading');
    let events: readonly SdCalendarEvent<T>[];
    try {
      events = await option.dataSource.onLoad({ from: range.from, to: range.to, view: range.view, signal: controller.signal });
    } catch (error) {
      if (this.#controller !== controller || controller.signal.aborted) return;
      this.#controller = null;
      // §13: after a failed load the grid shows no events, also when a reload kept the previous ones until now.
      this.#loaded.set([]);
      this.#phase.set('error');
      this.#announce(this.#i18n.t('core.component.calendar.load-error'));
      this.sdLoadError.emit(error);
      return;
    }
    // why: a newer range, option or reload aborted this request; its late result must not replace newer data.
    if (this.#controller !== controller || controller.signal.aborted) return;
    this.#controller = null;
    this.#loaded.set(Array.isArray(events) ? events : []);
    this.#everLoaded.set(true);
    this.#phase.set('idle');
  }

  #scrollToStart(): void {
    const element = this.scroller()?.nativeElement;
    if (!element) return;
    const minutes = sdCalendarTimeToMinutes(this.scrollTime() ?? this.#configuration?.scrollTime) ?? this.#earliestWorkingMinute();
    const hourHeight = parseFloat(getComputedStyle(this.#host.nativeElement).getPropertyValue('--sd-calendar-hour-height')) || HOUR_HEIGHT;
    element.scrollTop = sdCalendarInitialScroll(minutes, hourHeight);
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
    this.#announcement.set(message);
  }

  #boundDay(value: SdCalendarDateInput | 'TODAY' | null | undefined): string | null {
    if (value === null || value === undefined || value === '') return null;
    return value === 'TODAY' ? this.today() : sdCalendarReadDay(value, this.#clock);
  }

  #navLabel(direction: 'prev' | 'next'): string {
    const view = this.displayView();
    if (view === 'agenda') {
      return this.#i18n.t(`core.component.calendar.${direction}-agenda`, { count: sdCalendarClampAgendaDays(this.agendaDays()) });
    }
    return this.#i18n.t(`core.component.calendar.${direction}-${view}`);
  }

  #weekdayLong(day: string): string {
    return this.#formats().weekday.format(utcDay(day));
  }

  /**
   * Short date of a day: "Oct 22" / "Oct 22, 2026" in English, otherwise the numeric parts in the order of the
   * locale joined by "/" ("22/10/2026", "2026/10/22").
   *
   * why: `Intl` writes vi-VN numeric dates with "-" in current Chromium, while the design shows "22/10".
   */
  #dateText(day: string, withYear: boolean): string {
    const formats = this.#formats();
    const format = withYear ? formats.dateYear : formats.date;
    if (formats.named) return format.format(utcDay(day));
    return format
      .formatToParts(utcDay(day))
      .filter(part => part.type === 'day' || part.type === 'month' || part.type === 'year')
      .map(part => part.value)
      .join('/');
  }

  #dayView(day: string): SdCalendarDayView {
    const weekday = sdCalendarWeekday(day);
    const holiday = this.#holidays().get(day) ?? null;
    const working = sdCalendarWorkingRanges(this.#workingHours(), weekday);
    const off = holiday?.type === 'off' || (working !== null && working.length === 0);
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
    const color = event.color ?? 'primary';
    const palette = PALETTE.has(color);
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
    return {
      key: event.id,
      event,
      placement,
      range: sdCalendarRangeOf(placement, this.#clock, this.transform()),
      label,
      autoId: root ? `${root}-event-${encodeURIComponent(event.id)}` : null,
      color: palette ? color : 'custom',
      customColor: palette ? null : color,
      recurring,
      past: this.dimPast() && placement.endInstant <= this.#nowInstant(),
      selected: this.selectedId() === event.id,
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
        pending: false,
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
      const off = view.off;
      return {
        day: view,
        inMonth,
        label,
        lines: shown,
        more,
        context: { $implicit: day, date: day, events, holiday: view.holiday, today: view.today, inMonth, off },
      };
    });
  }

  /** Logs a dev-mode diagnostic once per instance and key. */
  #report(level: 'error' | 'warn', key: string, message: string): void {
    if (!isDevMode() || this.#reported.has(key)) return;
    this.#reported.add(key);
    console[level](`[sd-calendar] ${message}`);
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

function rangeKey(range: SdCalendarVisibleRange): string {
  return `${range.view}|${range.from}|${range.to}`;
}

function sameRange(a: SdCalendarVisibleRange, b: SdCalendarVisibleRange): boolean {
  return rangeKey(a) === rangeKey(b);
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/** `'yyyy/MM/dd'` of a carrier (a local `Date` whose fields are a wall clock of the zone). */
function carrierDay(carrier: Date): string {
  return sdCalendarDay(carrier.getFullYear(), carrier.getMonth() + 1, carrier.getDate());
}

/** Noon UTC of a calendar day, only to name it with `Intl` in `timeZone: 'UTC'`. */
function utcDay(day: string): Date {
  const { year, month, day: date } = sdCalendarDayParts(day)!;
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, date);
  value.setUTCHours(12);
  return value;
}

function offsetTop(minutes: number): string {
  return `calc(var(--sd-calendar-hour-height) * ${minutes / 60})`;
}

function blockHeight(minutes: number): string {
  return `max(calc(var(--sd-calendar-hour-height) * ${minutes / 60} - 2px), 16px)`;
}
