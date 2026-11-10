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
import {
  SD_CALENDAR_CONFIGURATION,
  ɵSD_CALENDAR_DEFAULTS,
  ɵSdCalendarAnnouncer,
  ɵSdCalendarHostWidth,
  ɵSdCalendarLoader,
  ɵSdCalendarMinuteTimer,
  ɵSdCalendarOperation,
  ɵSdCalendarReporter,
  ɵsdCalendarAllows,
  ɵsdCalendarBoundDay,
  ɵsdCalendarBrokenWeekdays,
  ɵsdCalendarCarrierDay,
  ɵsdCalendarColor,
  ɵsdCalendarInvalidItems,
  ɵsdCalendarIsOffDay,
  ɵsdCalendarIsRtl,
  ɵsdCalendarSelectionGone,
  ɵsdCalendarClockText,
  ɵsdCalendarDateText,
  ɵsdCalendarDayParts,
  ɵsdCalendarFormats,
  ɵsdCalendarHolidayMap,
  ɵsdCalendarNormalizeStep,
  ɵsdCalendarOffSegments,
  ɵsdCalendarPlace,
  ɵsdCalendarPointOf,
  ɵsdCalendarRangeKey,
  ɵsdCalendarRangeOf,
  ɵsdCalendarReadDay,
  ɵsdCalendarResolveFirstDayOfWeek,
  ɵsdCalendarResolveStep,
  ɵsdCalendarResolveWorkingHours,
  ɵsdCalendarSameList,
  ɵsdCalendarShiftDate,
  ɵsdCalendarSlot,
  ɵsdCalendarSweep,
  ɵsdCalendarTimeToMinutes,
  ɵsdCalendarTitle,
  ɵsdCalendarWeekday,
  ɵsdCalendarWeekdayLong,
  ɵsdCalendarWorkingRanges,
  type SdCalendarDateInput,
  type SdCalendarHoliday,
  type SdCalendarWorkingHours,
  type ɵSdCalendarPlacement,
  type ɵSdCalendarSpan,
  type ɵSdCalendarTarget,
} from '@sdcorejs/angular/components/calendar';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import type { SdTemporalValueTransform } from '@sdcorejs/angular/forms/models';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type {
  SdSchedulerCellSelect,
  SdSchedulerCreateContext,
  SdSchedulerEvent,
  SdSchedulerMoveError,
  SdSchedulerMoveRequest,
  SdSchedulerOption,
  SdSchedulerRange,
  SdSchedulerResource,
  SdSchedulerView,
  SdSchedulerVisibleRange,
} from './scheduler.model';
import {
  SdSchedulerCellTemplateDirective,
  SdSchedulerEmptyTemplateDirective,
  SdSchedulerEventTemplateDirective,
  SdSchedulerResourceTemplateDirective,
  type SdSchedulerEventTemplateContext,
  type SdSchedulerResourceTemplateContext,
} from './scheduler.templates';
import {
  sdSchedulerColumnBox,
  sdSchedulerColumns,
  sdSchedulerColumnSpan,
  sdSchedulerDayBox,
  sdSchedulerDaySpan,
  sdSchedulerGroups,
  sdSchedulerLanes,
  sdSchedulerLaneTop,
  sdSchedulerRowHeight,
  sdSchedulerVisibleDays,
  sdSchedulerVisibleRange,
  type SdSchedulerLaneItem,
} from './scheduler.utils';

const ALL_VIEWS: readonly SdSchedulerView[] = ['day', 'week', 'month'];
const MINUTE = 60_000;
/** Pointer travel (px) under which a press is a click (§9.1). */
const CLICK_SLOP = 5;
/** Sizes of §7 and §11, used until the real ones are measured on the rendered element. */
const SIZES = { hour: 80, resource: 240, day: 120, month: 28 } as const;
const COMPACT_SIZES = { hour: 64, resource: 120, day: 96, month: 28 } as const;
/** Gaps around a block (px): before and after on the hour axis, before and after on the day axis (§7). */
const DAY_GAP = { before: 1, after: 2 } as const;
const COLUMN_GAP = { before: 2, after: 3 } as const;
/** Where the first-load skeleton draws its blocks on the first three rows: [inline start, size] as fractions (§12). */
const SKELETON: readonly (readonly [number, number])[] = [
  [0.08, 0.22],
  [0.3, 0.16],
  [0.14, 0.3],
];
let nextSchedulerId = 0;

/** An event of a resource on screen, with where it sits. */
interface SdSchedulerPlaced<T> {
  readonly event: SdSchedulerEvent<T>;
  readonly placement: ɵSdCalendarPlacement;
  /** Drawn at a proposed position while `onMove` (or the scope bar) waits. */
  readonly pending: boolean;
  /** `onMove` runs: the block shows the sync icon. */
  readonly saving: boolean;
}

/** @internal A day of the axis. */
interface SdSchedulerDayView {
  readonly day: string;
  readonly dayNumber: number;
  readonly weekdayShort: string;
  readonly label: string;
  readonly openLabel: string;
  readonly today: boolean;
  readonly holiday: SdCalendarHoliday | null;
}

/** @internal An event block. */
interface SdSchedulerBlockView<T, R> {
  readonly key: string;
  readonly event: SdSchedulerEvent<T>;
  readonly placement: ɵSdCalendarPlacement;
  readonly range: SdSchedulerRange;
  readonly label: string;
  readonly title: string;
  readonly autoId: string | null;
  readonly color: string;
  readonly customColor: string | null;
  readonly recurring: boolean;
  readonly past: boolean;
  readonly pending: boolean;
  readonly saving: boolean;
  readonly movable: boolean;
  readonly start: string;
  readonly size: string;
  readonly top: string;
  /** `lg` ≥ 120px: dot, title and time; `md` 48–119px: dot and title; `sm` < 48px: dot only (§8.2). */
  readonly tier: 'lg' | 'md' | 'sm';
  /** Week and month: the start time leads the title on timed blocks of at least 96px (§8.2). */
  readonly leadTime: string | null;
  readonly timeText: string;
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
  readonly context: SdSchedulerEventTemplateContext<T, R>;
}

/** @internal A shaded span of one row: off hours or days off. */
interface SdSchedulerShade {
  readonly key: string;
  readonly start: string;
  readonly size: string;
}

/** @internal A resource row. */
interface SdSchedulerResourceRow<T, R> {
  readonly kind: 'resource';
  readonly key: string;
  readonly resource: SdSchedulerResource<R>;
  readonly group: string | null;
  readonly height: number;
  readonly headerId: string;
  readonly autoId: string | null;
  readonly token: string;
  readonly blocks: readonly SdSchedulerBlockView<T, R>[];
  readonly shades: readonly SdSchedulerShade[];
  readonly context: SdSchedulerResourceTemplateContext<R>;
}

/** @internal A group row. */
interface SdSchedulerGroupRow {
  readonly kind: 'group';
  readonly key: string;
  readonly name: string;
  readonly count: number;
  readonly collapsed: boolean;
  readonly label: string;
  readonly hint: string;
  readonly countText: string;
}

type SdSchedulerRowView<T, R> = SdSchedulerResourceRow<T, R> | SdSchedulerGroupRow;

/** @internal The dashed block of a create: `[start, end)` minutes on the day view, `[start, end]` columns otherwise. */
interface SdSchedulerGhost {
  readonly resourceId: string;
  readonly start: number;
  readonly end: number;
  readonly pending: boolean;
  readonly blocked: boolean;
}

@Component({
  selector: 'sd-scheduler',
  standalone: true,
  imports: [NgTemplateOutlet, SdAvatar, SdDataState, SdIcon, SdTranslatePipe],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** Resource scheduler: one row per resource, day / week / month on the inline axis (see `sd-scheduler.md`). */
export class SdScheduler<T = unknown, R = unknown> {
  readonly #clock = inject(SdDateTimeService);
  readonly #i18n = inject(I18nService);
  readonly #configuration = inject(SD_CALENDAR_CONFIGURATION, { optional: true });
  readonly #zone = inject(NgZone);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #reporter = new ɵSdCalendarReporter('[sd-scheduler]');
  protected readonly baseId = `sd-scheduler-${nextSchedulerId++}`;

  /** Data source and capabilities. A new object is the signal to load again. */
  readonly option = input.required<SdSchedulerOption<T, R>>();
  /** Rows, in this order (grouped by `group`). A new array loads again; an empty one shows the empty state. */
  readonly resources = input.required<readonly SdSchedulerResource<R>[]>();
  /** Layout on screen; one of `views`, otherwise the first of `views`. */
  readonly view = model<SdSchedulerView>('day');
  /** Anchor day; the scheduler writes back `'yyyy/MM/dd'`. Defaults to today in the zone. */
  readonly date = model<SdCalendarDateInput | null | undefined>(undefined);
  /** Id of the selected event; back to `null` when the event is no longer loaded. */
  readonly selectedId = model<string | null>(null);
  /** Views offered by the switcher, in this order. */
  readonly views = input<readonly SdSchedulerView[]>(ALL_VIEWS);
  /** Text of the corner cell; defaults to the translated "Resources". */
  readonly resourceLabel = input<string | null | undefined>(undefined);
  /** Minutes of one slot of the day view, a divisor of 60. Configuration, then 30. */
  readonly step = input<number | undefined>(undefined);
  /** 0–6, 0 is Sunday. Configuration, then 1. */
  readonly firstDayOfWeek = input<number | undefined>(undefined);
  /** Hides Saturday and Sunday in the week and month views; `from`/`to` still span the whole week or month. */
  readonly hideWeekends = input(false, { transform: booleanAttribute });
  /** `null` turns the off-hours shading off. Configuration, then Monday–Friday. A resource can override it. */
  readonly workingHours = input<SdCalendarWorkingHours | null | undefined>(undefined);
  /** Configuration, then none. */
  readonly holidays = input<readonly SdCalendarHoliday[] | undefined>(undefined);
  /** First day that can be shown and edited, compared as a calendar day in the zone. */
  readonly minDate = input<SdCalendarDateInput | 'TODAY' | null | undefined>(undefined);
  /** Last day that can be shown and edited, compared as a calendar day in the zone. */
  readonly maxDate = input<SdCalendarDateInput | 'TODAY' | null | undefined>(undefined);
  /** `'HH:mm'` the day view scrolls to. Configuration, then the earliest working hour, then 08:00. */
  readonly scrollTime = input<string | undefined>(undefined);
  /** Fades events that have ended. */
  readonly dimPast = input(false, { transform: booleanAttribute });
  /** Serialization of the values the scheduler emits; see "Date values" in `sd-calendar.md`. */
  readonly transform = input<SdTemporalValueTransform | undefined>(undefined);
  /** No create, move or selection; events leave the tab order. Navigation still works. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** No create or move. Selection and navigation still work. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /** Accessible name of the region and of the scroll area; defaults to the translated "Resource schedule". */
  readonly ariaLabel = input<string | null | undefined>(undefined);
  /** E2E scope: `data-autoid="components-scheduler-{autoId}"` and derived child ids. */
  readonly autoId = input<string | null | undefined>(undefined);

  /** An event was clicked, tapped or activated with Enter/Space. */
  readonly sdSelect = output<SdSchedulerEvent<T>>();
  /** Once on init, then whenever `from`, `to` or the view changes (not when only `resources` change). */
  readonly sdRangeChange = output<SdSchedulerVisibleRange>();
  /** `onMove` accepted and the data changed. */
  readonly sdMove = output<SdSchedulerMoveRequest<T, R>>();
  /** `onMove` rejected or failed. */
  readonly sdMoveError = output<SdSchedulerMoveError<T, R>>();
  /** `onLoad` threw or rejected (never for an aborted load). */
  readonly sdLoadError = output<unknown>();
  /** Cell template only: a cell with at least one event was clicked, tapped or activated with Enter. */
  readonly sdCellSelect = output<SdSchedulerCellSelect<T, R>>();

  protected readonly eventTemplate = contentChild<SdSchedulerEventTemplateDirective<T, R>>(SdSchedulerEventTemplateDirective);
  protected readonly resourceTemplate = contentChild<SdSchedulerResourceTemplateDirective<R>>(SdSchedulerResourceTemplateDirective);
  protected readonly cellTemplate = contentChild<SdSchedulerCellTemplateDirective<T, R>>(SdSchedulerCellTemplateDirective);
  protected readonly emptyTemplate = contentChild(SdSchedulerEmptyTemplateDirective);
  protected readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  protected readonly gridElement = viewChild<ElementRef<HTMLElement>>('grid');
  protected readonly root = viewChild<ElementRef<HTMLElement>>('root');

  readonly #loader = new ɵSdCalendarLoader<SdSchedulerEvent<T>>();
  readonly #operation = new ɵSdCalendarOperation<'create' | 'move'>();
  readonly #announcer = new ɵSdCalendarAnnouncer();
  readonly #now = signal<Date>(this.#clock.now());
  readonly #hostWidth = new ɵSdCalendarHostWidth(this.#host.nativeElement, this.#zone);
  readonly #width = this.#hostWidth.width;
  readonly #timer = new ɵSdCalendarMinuteTimer(this.#zone, () => this.#now.set(this.#clock.now()));
  readonly #sizes = signal<{ readonly hour: number; readonly resource: number; readonly day: number; readonly month: number }>(SIZES);
  /** Collapsed groups (§10): kept across ranges and views, pruned when `resources` drops a group. */
  readonly #collapsed = signal<ReadonlySet<string>>(new Set());
  /** Move waiting for `onMove`: the event is drawn at its target. */
  readonly #moving = signal<{ readonly id: string; readonly event: SdSchedulerEvent<T>; readonly saving: boolean } | null>(null);
  readonly #failure = signal<{ readonly id: string | null; readonly message: string } | null>(null);
  /** Dashed block of a create (§9.2): minutes (day view) or column indexes, both inclusive (week, month). */
  readonly #ghost = signal<SdSchedulerGhost | null>(null);
  /** A drag just ended: the click that follows its mouseup must not select. Reset on the next press. */
  #justDragged = false;
  /** Where the press that may start a drag happened (CDK's start event is the move that crossed the threshold). */
  #pickup: { readonly x: number; readonly y: number } | null = null;
  #press: {
    readonly resourceId: string;
    readonly anchor: number;
    readonly x: number;
    readonly y: number;
    readonly touch: boolean;
    readonly track: HTMLElement;
    moved: boolean;
  } | null = null;
  #emittedKey: string | null = null;
  #lastOption: SdSchedulerOption<T, R> | null = null;
  #lastResources: readonly SdSchedulerResource<R>[] | null = null;
  /** Bumped by every new `resources` array: part of the load key, so the grid clears until the new events arrive. */
  #generation = 0;
  #lastView: SdSchedulerView | null = null;

  /** Host narrower than 600px (§11): measured on the host, not the viewport. */
  protected readonly compact = computed(() => {
    const width = this.#width();
    return width !== null && width < 600;
  });
  protected readonly phase = this.#loader.phase.asReadonly();
  protected readonly announcement = this.#announcer.text;
  protected readonly failure = this.#failure.asReadonly();
  protected readonly busy = computed(() => this.#loader.phase() === 'loading' || this.#loader.phase() === 'reloading');
  protected readonly skeleton = computed(() => this.#loader.phase() === 'loading' && !this.#loader.everLoaded());
  protected readonly rootAutoId = computed(() => (this.autoId() ? `components-scheduler-${this.autoId()}` : null));
  protected readonly regionLabel = computed(() => this.ariaLabel() || this.#i18n.t('core.component.scheduler.label'));
  protected readonly cornerLabel = computed(() => this.resourceLabel() || this.#i18n.t('core.component.scheduler.resources'));

  protected readonly stepValue = computed(() => ɵsdCalendarResolveStep(this.step(), this.#configuration));
  readonly #firstDayOfWeek = computed(() => ɵsdCalendarResolveFirstDayOfWeek(this.firstDayOfWeek(), this.#configuration));
  readonly #workingHours = computed<SdCalendarWorkingHours | null>(() =>
    ɵsdCalendarResolveWorkingHours(this.workingHours(), this.#configuration)
  );
  readonly #holidays = computed(() => ɵsdCalendarHolidayMap(this.holidays(), this.#configuration, this.#clock));
  protected readonly today = computed(() => ɵsdCalendarCarrierDay(this.#now()));
  readonly #nowMinutes = computed(() => this.#now().getHours() * 60 + this.#now().getMinutes());
  readonly #nowInstant = computed(() => this.#clock.fromWallClock(this.#now()).getTime());
  readonly #anchor = computed(() => {
    const value = this.date();
    return (value === null || value === undefined ? null : ɵsdCalendarReadDay(value, this.#clock)) ?? this.today();
  });
  readonly #minDay = computed(() => ɵsdCalendarBoundDay(this.minDate(), this.today(), this.#clock));
  readonly #maxDay = computed(() => ɵsdCalendarBoundDay(this.maxDate(), this.today(), this.#clock));

  protected readonly viewOptions = computed(() => (this.views().length ? this.views() : ALL_VIEWS));
  protected readonly activeView = computed<SdSchedulerView>(() => {
    const views = this.viewOptions();
    return views.includes(this.view()) ? this.view() : views[0];
  });
  protected readonly visible = computed(() => sdSchedulerVisibleRange(this.activeView(), this.#anchor(), this.#firstDayOfWeek()), {
    equal: (a, b) => ɵsdCalendarRangeKey(a) === ɵsdCalendarRangeKey(b),
  });
  /** Days drawn on the axis: the visible days without the weekend when `hideWeekends` (week, month). */
  protected readonly columns = computed(
    () =>
      sdSchedulerColumns(
        sdSchedulerVisibleDays(this.activeView(), this.#anchor(), this.#firstDayOfWeek()),
        this.activeView(),
        this.hideWeekends()
      ),
    { equal: ɵsdCalendarSameList }
  );

  readonly #formats = computed(() => ɵsdCalendarFormats(this.#i18n.locale(), this.#i18n.language()));
  protected readonly title = computed(() => {
    const { from, to } = this.visible();
    const view = this.activeView();
    return ɵsdCalendarTitle(view, { anchor: this.#anchor(), from, to }, this.#formats(), (key, params) => this.#i18n.t(key, params));
  });
  protected readonly prevLabel = computed(() => this.#i18n.t(`core.component.calendar.prev-${this.activeView()}`));
  protected readonly nextLabel = computed(() => this.#i18n.t(`core.component.calendar.next-${this.activeView()}`));
  protected readonly prevDisabled = computed(() => {
    const min = this.#minDay();
    return !!min && this.#shiftedRange(-1).to < min;
  });
  protected readonly nextDisabled = computed(() => {
    const max = this.#maxDay();
    return !!max && this.#shiftedRange(1).from > max;
  });

  /** Duplicate or empty ids, or an empty title, in `resources` or in the loaded events: nothing is shown (§12). */
  protected readonly invalid = computed(() => ɵsdCalendarInvalidItems(this.resources()) || ɵsdCalendarInvalidItems(this.#loader.items()));
  protected readonly empty = computed(() => !this.resources().length);
  /** No create and no move: disabled, readonly, loading, load error, invalid data or no resources (§4.1). */
  protected readonly locked = computed(
    () => this.disabled() || this.readonly() || this.busy() || this.#loader.phase() === 'error' || this.invalid() || this.empty()
  );

  /** A cell template applies to the view on screen: cells instead of blocks, no drag (§8.5). */
  protected readonly cellTemplateActive = computed(() => {
    const template = this.cellTemplate();
    const view = this.activeView();
    return !!template && view !== 'day' && template.views().includes(view);
  });
  /** Create is on: `option.create` and not locked. */
  protected readonly canCreate = computed(() => !!this.option().create && !this.locked());
  protected readonly ghost = this.#ghost.asReadonly();

  readonly #resourceById = computed(() => new Map(this.resources().map(resource => [resource.id, resource])));
  /** Effective working hours of a resource: its own (even `null`) when it declares them, otherwise the component's. */
  readonly #hoursOf = (resource: SdSchedulerResource<R>): SdCalendarWorkingHours | null =>
    resource.workingHours !== undefined ? resource.workingHours : this.#workingHours();

  readonly #reading = computed(() => {
    const placed: SdSchedulerPlaced<T>[] = [];
    const unknown: string[] = [];
    const unreadable: string[] = [];
    const resources = this.#resourceById();
    const moving = this.#moving();
    for (const loaded of this.#loader.items()) {
      const event = moving?.id === loaded.id ? moving.event : loaded;
      if (!resources.has(event.resourceId)) {
        unknown.push(event.id);
        continue;
      }
      const placement = ɵsdCalendarPlace(event, this.#clock);
      if (!placement) {
        unreadable.push(event.id);
        continue;
      }
      const pending = moving?.id === loaded.id;
      placed.push({ event, placement, pending, saving: pending && moving.saving });
    }
    return { placed, unknown, unreadable };
  });
  readonly #byResource = computed(() => {
    const { from, to } = this.visible();
    const map = new Map<string, SdSchedulerPlaced<T>[]>();
    for (const item of this.#reading().placed) {
      if (item.placement.lastDay < from || item.placement.firstDay > to) continue;
      const list = map.get(item.event.resourceId);
      if (list) list.push(item);
      else map.set(item.event.resourceId, [item]);
    }
    return map;
  });

  protected readonly dayViews = computed<readonly SdSchedulerDayView[]>(() => this.columns().map(day => this.#dayView(day)));
  protected readonly hours = Array.from({ length: 24 }, (_, hour) => ({ hour, label: `${hour < 10 ? '0' : ''}${hour}:00` }));

  protected readonly rows = computed<readonly SdSchedulerRowView<T, R>[]>(() => {
    const { ungrouped, groups } = sdSchedulerGroups(this.resources());
    const collapsed = this.#collapsed();
    const rows: SdSchedulerRowView<T, R>[] = ungrouped.map(resource => this.#resourceRow(resource, null));
    for (const group of groups) {
      const closed = collapsed.has(group.name);
      const countText = this.#i18n.t('core.component.scheduler.group-count', { count: group.resources.length });
      rows.push({
        kind: 'group',
        key: `g:${group.name}`,
        name: group.name,
        count: group.resources.length,
        collapsed: closed,
        label: `${group.name}, ${countText}`,
        hint: this.#i18n.t(`core.component.scheduler.group-${closed ? 'expand' : 'collapse'}`, { group: group.name }),
        countText,
      });
      if (!closed) rows.push(...group.resources.map(resource => this.#resourceRow(resource, group.name)));
    }
    return rows;
  });
  /** First three resource rows: where the skeleton draws (§12). */
  protected readonly skeletonRows = computed(() => {
    const keys = new Map<string, number>();
    for (const row of this.rows()) {
      if (row.kind === 'resource' && keys.size < SKELETON.length) keys.set(row.key, keys.size);
    }
    return keys;
  });
  protected readonly skeletonShapes = SKELETON;

  /** Inline offset of the now line from the start of the time area, day view on today only (§7). */
  protected readonly nowOffset = computed(() => {
    if (this.activeView() !== 'day' || this.#anchor() !== this.today()) return null;
    return `calc(var(--sd-scheduler-hour-width) * ${this.#nowMinutes() / 60})`;
  });
  protected readonly gridHelpId = `${this.baseId}-grid-help`;
  protected readonly eventHelpId = `${this.baseId}-event-help`;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // why: one effect owns loading and the range output, so a range emits once and only together with its load.
    effect(() => {
      untracked(() => this.#hostWidth.measureOnce());
      const option = this.option();
      const resources = this.resources();
      const range = this.visible();
      untracked(() => {
        const key = ɵsdCalendarRangeKey(range);
        if (key !== this.#emittedKey) {
          this.#emittedKey = key;
          this.sdRangeChange.emit(range);
        }
        const changedSource =
          (this.#lastOption !== null && this.#lastOption !== option) || (this.#lastResources !== null && this.#lastResources !== resources);
        if (this.#lastResources !== resources) {
          this.#generation++;
          this.#pruneGroups(resources);
        }
        // SC-15: a new source also aborts a waiting create; a range change or a reload aborts a waiting move only.
        if (changedSource && this.#operation.abort(['create'])) this.#ghost.set(null);
        this.#lastOption = option;
        this.#lastResources = resources;
        this.#startLoad(option, resources, range);
      });
    });

    effect(() => {
      const { unknown, unreadable } = this.#reading();
      for (const id of unknown)
        this.#report('warn', `resource:${id}`, `event "${id}" has a resourceId that is not in resources; it is not shown.`);
      for (const id of unreadable)
        this.#report('warn', `date:${id}`, `event "${id}" has an unreadable date or does not end after it starts; it is not shown.`);
    });

    effect(() => {
      const step = this.step() ?? this.#configuration?.step;
      if (step !== undefined && ɵsdCalendarNormalizeStep(step) === null) {
        this.#report('warn', `step:${step}`, `step ${step} is not one of 5, 10, 15, 20, 30, 60; 30 is used.`);
      }
    });

    // The working hours of the component, then those of each resource that has its own.
    effect(() => {
      const scopes: [string, SdCalendarWorkingHours | null | undefined][] = [['', this.#workingHours()]];
      for (const resource of this.resources()) scopes.push([resource.id, resource.workingHours]);
      for (const [resourceId, hours] of scopes) {
        for (const weekday of ɵsdCalendarBrokenWeekdays(hours)) {
          this.#report(
            'warn',
            `hours:${resourceId}:${weekday}`,
            `workingHours[${weekday}]${resourceId ? ` of resource "${resourceId}"` : ''} has a range without both ends or that does not end after it starts; it is ignored.`
          );
        }
      }
    });

    // SC-15: turning disabled or readonly on aborts a waiting move.
    effect(() => {
      if (this.disabled() || this.readonly()) untracked(() => this.#abortMove());
    });

    // why: the timer only runs while today is on the day view, and outside the zone so it does not tick change detection.
    effect(() => this.#timer.run(this.nowOffset() !== null));

    // §6: the day view scrolls to scrollTime when it opens (init or from another view), not when only the day changes;
    // the week and month views bring today's column into view when it is hidden. The vertical scroll is kept.
    effect(() => {
      const view = this.activeView();
      this.visible();
      untracked(() => {
        const entered = view !== this.#lastView;
        this.#lastView = view;
        afterNextRender(
          () => {
            if (view === 'day') {
              if (entered) this.#scrollToTime();
              return;
            }
            // A week or a month opens at its first column, then brings today into view (§6).
            if (entered && this.scroller()) this.scroller()!.nativeElement.scrollLeft = 0;
            this.#revealToday();
          },
          { injector: this.#injector }
        );
      });
    });

    // Sizes of the rendered layout (§7, §11): the block content tiers are measured in pixels.
    effect(() => {
      this.compact();
      untracked(() => afterNextRender(() => this.#measureSizes(), { injector: this.#injector }));
    });

    effect(() => {
      if (ɵsdCalendarSelectionGone(this.selectedId(), this.#loader.phase(), this.#loader.items()))
        untracked(() => this.selectedId.set(null));
    });

    destroyRef.onDestroy(() => {
      this.#loader.abort();
      this.#operation.abort();
      this.#hostWidth.disconnect();
      this.#timer.stop();
      document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    });
  }

  /** Aborts a running load and a waiting move, then calls `onLoad` again for the range on screen. */
  reload(): void {
    this.#startLoad(untracked(this.option), untracked(this.resources), untracked(this.visible));
  }

  /** RED stub of checkpoint 4: the move pipeline is not there yet. */
  move(
    _eventId: string,
    _to: { start: SdCalendarDateInput; end?: SdCalendarDateInput | null; allDay?: boolean; resourceId?: string },
    _source: 'drag' | 'resize' | 'keyboard' | 'api' = 'api'
  ): Promise<boolean> {
    return Promise.resolve(false);
  }

  // ---- toolbar ----

  protected setView(view: SdSchedulerView): void {
    this.view.set(view);
    this.#announceTitle();
  }

  protected shift(direction: 1 | -1): void {
    if (direction < 0 ? this.prevDisabled() : this.nextDisabled()) return;
    this.date.set(ɵsdCalendarShiftDate(this.#rangeInput(), direction));
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

  protected toggleGroup(name: string): void {
    this.#collapsed.update(groups => {
      const next = new Set(groups);
      if (!next.delete(name)) next.add(name);
      return next;
    });
  }

  protected viewLabel(view: SdSchedulerView): string {
    return this.#i18n.t(`core.component.calendar.view-${view}`);
  }

  protected childAutoId(kind: string): string | null {
    const root = this.rootAutoId();
    return root ? `${root}-${kind}` : null;
  }

  protected isFailed(id: string): boolean {
    return this.#failure()?.id === id;
  }

  // ---- selection (§9.1) ----

  protected selectItem(event: SdSchedulerEvent<T>, domEvent?: Event): void {
    domEvent?.stopPropagation();
    if (this.#justDragged) {
      this.#justDragged = false;
      return;
    }
    if (this.disabled()) return;
    this.selectedId.set(event.id);
    this.sdSelect.emit(event);
  }

  /** Press inside a row: on a block it starts a new gesture and records the pickup point of a possible drag. */
  protected onTrackPress(domEvent: MouseEvent | TouchEvent): void {
    if (!(domEvent.target as Element | null)?.closest?.('[data-event-id]')) return;
    this.#justDragged = false;
    this.#pickup = ɵsdCalendarPointOf(domEvent);
  }

  protected onTrackClick(domEvent: MouseEvent, row: SdSchedulerResourceRow<T, R>): void {
    const block = this.#blockAt(domEvent.target, row);
    if (block) this.selectItem(block.event, domEvent);
  }

  protected onTrackKeydown(domEvent: KeyboardEvent, row: SdSchedulerResourceRow<T, R>): void {
    const block = this.#blockAt(domEvent.target, row);
    if (block) this.onItemKeydown(domEvent, block);
  }

  /** Keys on a block (§9.7): Enter and Space select, Esc clears the selection and goes back to the grid. */
  protected onItemKeydown(domEvent: KeyboardEvent, block: SdSchedulerBlockView<T, R>): void {
    const key = domEvent.key;
    if (key === 'Enter' || key === ' ') {
      domEvent.preventDefault();
      this.selectItem(block.event, domEvent);
      return;
    }
    if (key === 'Escape') {
      domEvent.preventDefault();
      domEvent.stopPropagation();
      this.selectedId.set(null);
      this.gridElement()?.nativeElement.focus();
    }
  }

  #blockAt(target: EventTarget | null, row: SdSchedulerResourceRow<T, R>): SdSchedulerBlockView<T, R> | null {
    const element = (target as Element | null)?.closest?.('[data-event-id]');
    const id = element?.getAttribute('data-event-id');
    return id ? (row.blocks.find(block => block.key === id) ?? null) : null;
  }

  // ---- create (§9.2) ----

  protected onTrackPointerDown(domEvent: PointerEvent, resourceId: string): void {
    if (!domEvent.isPrimary || domEvent.button !== 0) return;
    const target = domEvent.target as Element;
    if (target.closest('[data-event-id], [data-resize-handle]')) return;
    const track = domEvent.currentTarget as HTMLElement;
    this.#press = {
      resourceId,
      anchor: this.#valueAt(domEvent.clientX, track),
      x: domEvent.clientX,
      y: domEvent.clientY,
      touch: domEvent.pointerType === 'touch',
      track,
      moved: false,
    };
    // why: on touch the browser scrolls the grid; capturing would keep the pointer from the scroll.
    if (!this.#press.touch) {
      try {
        track.setPointerCapture(domEvent.pointerId);
      } catch {
        // why: a synthetic or already released pointer cannot be captured; the press still works without capture.
      }
    }
    document.addEventListener('keydown', this.#onDocumentKeydown, true);
  }

  protected onTrackPointerMove(domEvent: PointerEvent): void {
    const press = this.#press;
    if (!press) return;
    if (!press.moved && Math.hypot(domEvent.clientX - press.x, domEvent.clientY - press.y) < CLICK_SLOP) return;
    press.moved = true;
    // §11: on touch a move scrolls; there is no sweep.
    if (press.touch || !this.canCreate() || this.#operation.busy()) return;
    // §9.2: the sweep follows the inline axis only; the row stays the one pressed.
    const span = this.#sweep(press.anchor, this.#valueAt(domEvent.clientX, press.track));
    const blocked = this.#outOfRangeSpan(span) || !this.#creatable(press.resourceId, span);
    this.#ghost.set({ resourceId: press.resourceId, ...span, pending: false, blocked });
  }

  protected onTrackPointerUp(): void {
    const press = this.#press;
    if (!press) return;
    this.#press = null;
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    const ghost = this.#ghost();
    if (!this.#operation.busy()) this.#ghost.set(null);
    // §9.1: a press on an empty slot clears the selection; with option.create it also creates there.
    this.selectedId.set(null);
    if (press.moved && (press.touch || !ghost)) return;
    void this.#create(press.resourceId, press.moved && ghost ? { start: ghost.start, end: ghost.end } : this.#slot(press.anchor));
  }

  protected onTrackPointerCancel(): void {
    this.#press = null;
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
    if (!this.#operation.busy()) this.#ghost.set(null);
  }

  /** Esc cancels a sweep. */
  readonly #onDocumentKeydown = (domEvent: KeyboardEvent): void => {
    if (domEvent.key !== 'Escape') return;
    this.#zone.run(() => {
      if (this.#press) {
        this.#press = null;
        if (!this.#operation.busy()) this.#ghost.set(null);
      }
    });
    document.removeEventListener('keydown', this.#onDocumentKeydown, true);
  };

  /** Inline start and size of the dashed block (as the blocks of §8.2). */
  protected ghostBox(ghost: SdSchedulerGhost): { start: string; size: string; time: string } {
    if (this.activeView() === 'day') {
      return {
        start: `calc(var(--sd-scheduler-hour-width) * ${ghost.start / 60} + ${DAY_GAP.before}px)`,
        size: `max(12px, calc(var(--sd-scheduler-hour-width) * ${(ghost.end - ghost.start) / 60} - ${DAY_GAP.before + DAY_GAP.after}px))`,
        time: `${ɵsdCalendarClockText(ghost.start)}–${ɵsdCalendarClockText(ghost.end)}`,
      };
    }
    const box = sdSchedulerColumnBox({ from: ghost.start, to: ghost.end }, this.columns().length);
    return {
      start: `calc(${box.start * 100}% + ${COLUMN_GAP.before}px)`,
      size: `calc(${box.size * 100}% - ${COLUMN_GAP.before + COLUMN_GAP.after}px)`,
      time: '',
    };
  }

  /** Minutes (day view) or the column index (week, month) under `clientX` on a track. */
  #valueAt(clientX: number, track: HTMLElement): number {
    const rect = track.getBoundingClientRect();
    const offset = this.#rtl() ? rect.right - clientX : clientX - rect.left;
    if (this.activeView() === 'day') return Math.min(1439, Math.max(0, (offset / this.#sizes().hour) * 60));
    const count = this.columns().length;
    return Math.min(count - 1, Math.max(0, Math.floor((offset / (rect.width || 1)) * count)));
  }

  /** One slot of `step` minutes, or one day. */
  #slot(value: number): { start: number; end: number } {
    if (this.activeView() === 'day') return ɵsdCalendarSlot(value, this.stepValue());
    return { start: value, end: value };
  }

  #sweep(anchor: number, current: number): { start: number; end: number } {
    if (this.activeView() === 'day') return ɵsdCalendarSweep(anchor, current, this.stepValue());
    return { start: Math.min(anchor, current), end: Math.max(anchor, current) };
  }

  /** Wall clock of a create span: a timed span of the day on screen, or all-day columns (§9.2). */
  #createTarget(span: { start: number; end: number }): ɵSdCalendarTarget {
    const columns = this.columns();
    if (this.activeView() === 'day') {
      return { allDay: false, startDay: columns[0], startMinutes: span.start, endDay: columns[0], endMinutes: span.end };
    }
    return { allDay: true, startDay: columns[span.start], startMinutes: 0, endDay: columns[span.end], endMinutes: 1440 };
  }

  #createContext(resource: SdSchedulerResource<R>, target: ɵSdCalendarTarget): SdSchedulerCreateContext<R> {
    const range = ɵsdCalendarRangeOf(target, this.#clock, untracked(this.transform));
    return { ...range, resourceId: resource.id, resource };
  }

  #creatable(resourceId: string, span: { start: number; end: number }): boolean {
    const resource = untracked(this.#resourceById).get(resourceId);
    if (!resource) return false;
    return ɵsdCalendarAllows(untracked(this.option).create?.creatable, this.#createContext(resource, this.#createTarget(span)));
  }

  #outOfRangeSpan(span: { start: number; end: number }): boolean {
    const target = this.#createTarget(span);
    return this.#outOfRange(target.startDay) || this.#outOfRange(target.endDay);
  }

  async #create(resourceId: string, span: { start: number; end: number }): Promise<void> {
    const create = untracked(this.option).create;
    const resource = untracked(this.#resourceById).get(resourceId);
    if (!create || !resource || untracked(this.locked) || untracked(this.#operation.busy)) return;
    if (this.#outOfRangeSpan(span)) {
      this.#announcer.announce(this.#i18n.t('core.component.calendar.out-of-range'));
      return;
    }
    const context = this.#createContext(resource, this.#createTarget(span));
    if (!ɵsdCalendarAllows(create.creatable, context)) return;
    const signal = this.#operation.begin('create');
    if (!signal) return;
    this.#failure.set(null);
    this.#ghost.set({ resourceId, ...span, pending: true, blocked: false });
    let created: SdSchedulerEvent<T> | void;
    try {
      created = await create.onCreate({ ...context, signal });
    } catch {
      if (signal.aborted) return;
      this.#operation.end(signal);
      this.#ghost.set(null);
      const message = this.#i18n.t('core.component.calendar.create-error');
      this.#failure.set({ id: null, message });
      this.#announcer.announce(message);
      return;
    }
    if (signal.aborted) return;
    this.#operation.end(signal);
    this.#ghost.set(null);
    if (!created) return;
    const event = created;
    this.#loader.items.update(items => [...items, event]);
    this.selectedId.set(event.id);
  }

  #outOfRange(day: string): boolean {
    const min = untracked(this.#minDay);
    const max = untracked(this.#maxDay);
    return (!!min && day < min) || (!!max && day > max);
  }

  // ---- loading ----

  #startLoad(option: SdSchedulerOption<T, R>, resources: readonly SdSchedulerResource<R>[], range: SdSchedulerVisibleRange): void {
    this.#abortMove();
    this.#now.set(this.#clock.now());
    if (!resources.length) {
      // §4.1, §12: no resources, no load.
      this.#loader.abort();
      this.#loader.items.set([]);
      this.#loader.phase.set('idle');
      return;
    }
    const resourceIds = resources.map(resource => resource.id);
    void this.#loader.load(
      `${ɵsdCalendarRangeKey(range)}|${this.#generation}`,
      signal => option.dataSource.onLoad({ from: range.from, to: range.to, view: range.view, resourceIds, signal }),
      error => {
        this.#announcer.announce(this.#i18n.t('core.component.calendar.load-error'));
        this.sdLoadError.emit(error);
      }
    );
  }

  #abortMove(): void {
    if (this.#operation.abort(['move'])) this.#moving.set(null);
  }

  #pruneGroups(resources: readonly SdSchedulerResource<R>[]): void {
    const groups = new Set(resources.map(resource => resource.group).filter((group): group is string => !!group));
    const collapsed = untracked(this.#collapsed);
    if ([...collapsed].every(group => groups.has(group))) return;
    this.#collapsed.set(new Set([...collapsed].filter(group => groups.has(group))));
  }

  // ---- views ----

  #rangeInput(): { view: SdSchedulerView; date: string; firstDayOfWeek: number; hideWeekends: boolean; agendaDays: number } {
    return { view: this.activeView(), date: this.#anchor(), firstDayOfWeek: this.#firstDayOfWeek(), hideWeekends: false, agendaDays: 14 };
  }

  #shiftedRange(direction: 1 | -1): SdSchedulerVisibleRange {
    return sdSchedulerVisibleRange(this.activeView(), ɵsdCalendarShiftDate(this.#rangeInput(), direction), this.#firstDayOfWeek());
  }

  #dayView(day: string): SdSchedulerDayView {
    const weekday = ɵsdCalendarWeekday(day);
    const label = `${ɵsdCalendarWeekdayLong(this.#formats(), day)} ${ɵsdCalendarDateText(this.#formats(), day, false)}`;
    return {
      day,
      dayNumber: ɵsdCalendarDayParts(day)!.day,
      weekdayShort: this.#i18n.t(`core.component.calendar.weekday-short-${weekday}`),
      label,
      openLabel: this.#i18n.t('core.component.scheduler.open-day', {
        weekday: ɵsdCalendarWeekdayLong(this.#formats(), day),
        date: ɵsdCalendarDateText(this.#formats(), day, false),
      }),
      today: day === this.today(),
      holiday: this.#holidays().get(day) ?? null,
    };
  }

  /** A day is off for a resource: an `off` holiday, or a weekday without working hours (not with `null` hours). */
  #offDay(day: string, hours: SdCalendarWorkingHours | null): boolean {
    return ɵsdCalendarIsOffDay(day, this.#holidays().get(day), hours);
  }

  #resourceRow(resource: SdSchedulerResource<R>, group: string | null): SdSchedulerResourceRow<T, R> {
    const view = this.activeView();
    const columns = this.columns();
    const placed = this.#byResource().get(resource.id) ?? [];
    // §8.4 step 5: a pending block is left out of the lanes and drawn in lane 0, on top.
    const laid: {
      item: SdSchedulerPlaced<T>;
      lane: SdSchedulerLaneItem;
      start: number;
      end: number;
      clippedStart: boolean;
      clippedEnd: boolean;
    }[] = [];
    for (const item of placed) {
      if (view === 'day') {
        const span = sdSchedulerDaySpan(item.placement, columns[0]);
        if (span) laid.push({ item, lane: { start: span.start, end: span.end, allDay: item.placement.allDay }, ...span });
      } else {
        const span = sdSchedulerColumnSpan(item.placement, columns);
        if (span) {
          laid.push({
            item,
            lane: { start: span.from, end: span.to + 1, allDay: item.placement.allDay },
            start: span.from,
            end: span.to,
            clippedStart: span.clippedStart,
            clippedEnd: span.clippedEnd,
          });
        }
      }
    }
    const stacking = laid.filter(entry => !entry.item.pending);
    const layout = sdSchedulerLanes(stacking.map(entry => entry.lane));
    const blocks = layout.order.map(({ index, lane }) => this.#blockView(stacking[index], resource, lane, layout.count));
    for (const entry of laid) if (entry.item.pending) blocks.push(this.#blockView(entry, resource, 0, layout.count));
    const token = encodeURIComponent(resource.id);
    const root = this.rootAutoId();
    return {
      kind: 'resource',
      key: `r:${resource.id}`,
      resource,
      group,
      height: sdSchedulerRowHeight(layout.count),
      headerId: `${this.baseId}-resource-${token}`,
      autoId: root ? `${root}-resource-${token}` : null,
      token,
      blocks,
      shades: this.#shades(resource),
      context: { $implicit: resource, resource, group, compact: this.compact() },
    };
  }

  /** Off hours (day view) or days off (week, month) of a resource, merged into spans (§7). */
  #shades(resource: SdSchedulerResource<R>): readonly SdSchedulerShade[] {
    const hours = this.#hoursOf(resource);
    const columns = this.columns();
    if (this.activeView() === 'day') {
      const day = columns[0];
      const off: ɵSdCalendarSpan[] = this.#offDay(day, hours)
        ? [{ start: 0, end: 1440 }]
        : ɵsdCalendarOffSegments(ɵsdCalendarWorkingRanges(hours, ɵsdCalendarWeekday(day)));
      return off.map(span => ({
        key: `${span.start}`,
        start: `calc(var(--sd-scheduler-hour-width) * ${span.start / 60})`,
        size: `calc(var(--sd-scheduler-hour-width) * ${(span.end - span.start) / 60})`,
      }));
    }
    const shades: SdSchedulerShade[] = [];
    let from = -1;
    const close = (to: number): void => {
      if (from < 0) return;
      const box = sdSchedulerColumnBox({ from, to }, columns.length);
      shades.push({ key: `${from}`, start: `${box.start * 100}%`, size: `${box.size * 100}%` });
      from = -1;
    };
    columns.forEach((day, column) => {
      if (this.#offDay(day, hours)) {
        if (from < 0) from = column;
      } else close(column - 1);
    });
    close(columns.length - 1);
    return shades;
  }

  #blockView(
    entry: { item: SdSchedulerPlaced<T>; start: number; end: number; clippedStart: boolean; clippedEnd: boolean },
    resource: SdSchedulerResource<R>,
    lane: number,
    lanes: number
  ): SdSchedulerBlockView<T, R> {
    const { item } = entry;
    const { event, placement } = item;
    const view = this.activeView();
    const sizes = this.#sizes();
    const { color, customColor } = ɵsdCalendarColor(event.color);
    const recurring = !!event.occurrence;
    const startText = ɵsdCalendarClockText(placement.startMinutes);
    const endText = ɵsdCalendarClockText(placement.endMinutes);
    let start: string;
    let size: string;
    let pixels: number;
    if (view === 'day') {
      const box = sdSchedulerDayBox(entry, sizes.hour);
      start = `calc(var(--sd-scheduler-hour-width) * ${entry.start / 60} + ${DAY_GAP.before}px)`;
      size = `max(12px, calc(var(--sd-scheduler-hour-width) * ${(entry.end - entry.start) / 60} - ${DAY_GAP.before + DAY_GAP.after}px))`;
      pixels = box.width;
    } else {
      const box = sdSchedulerColumnBox({ from: entry.start, to: entry.end }, this.columns().length);
      start = `calc(${box.start * 100}% + ${COLUMN_GAP.before}px)`;
      size = `calc(${box.size * 100}% - ${COLUMN_GAP.before + COLUMN_GAP.after}px)`;
      pixels = box.size * this.#trackWidth() - COLUMN_GAP.before - COLUMN_GAP.after;
    }
    const tier = pixels >= 120 ? 'lg' : pixels >= 48 ? 'md' : 'sm';
    const timed = !placement.allDay;
    const range: SdSchedulerRange = { ...ɵsdCalendarRangeOf(placement, this.#clock, this.transform()), resourceId: event.resourceId };
    const root = this.rootAutoId();
    const move = this.option().move;
    const label = this.#eventLabel(event, placement, resource);
    return {
      key: event.id,
      event,
      placement,
      range,
      label,
      title: label,
      autoId: root ? `${root}-event-${encodeURIComponent(event.id)}` : null,
      color,
      customColor,
      recurring,
      past: this.dimPast() && placement.endInstant <= this.#nowInstant(),
      pending: item.pending,
      saving: item.saving,
      movable: !!move && !this.locked() && ɵsdCalendarAllows(move.movable, event),
      start,
      size,
      top: `${sdSchedulerLaneTop(item.pending ? 0 : lane, lanes)}px`,
      tier,
      leadTime: view !== 'day' && timed && pixels >= 96 ? startText : null,
      timeText: placement.allDay ? this.#i18n.t('core.component.calendar.all-day') : `${startText}–${endText}`,
      clippedStart: entry.clippedStart,
      clippedEnd: entry.clippedEnd,
      context: {
        $implicit: event,
        event,
        range,
        resource,
        view,
        compact: pixels < 48,
        pending: item.pending,
      },
    };
  }

  #eventLabel(event: SdSchedulerEvent<T>, placement: ɵSdCalendarPlacement, resource: SdSchedulerResource<R>): string {
    const formats = this.#formats();
    let label: string;
    if (placement.allDay) {
      label = this.#i18n.t('core.component.scheduler.event-label-all-day', {
        title: event.title,
        resource: resource.title,
        from: ɵsdCalendarDateText(formats, placement.firstDay, false),
        to: ɵsdCalendarDateText(formats, placement.lastDay, false),
      });
    } else {
      const end = ɵsdCalendarClockText(placement.endMinutes);
      label = this.#i18n.t('core.component.scheduler.event-label', {
        title: event.title,
        resource: resource.title,
        weekday: ɵsdCalendarWeekdayLong(formats, placement.startDay),
        date: ɵsdCalendarDateText(formats, placement.startDay, false),
        start: ɵsdCalendarClockText(placement.startMinutes),
        end: placement.inGrid ? end : `${ɵsdCalendarDateText(formats, placement.endDay, false)} ${end}`,
      });
    }
    return event.occurrence ? `${label}, ${this.#i18n.t('core.component.calendar.recurring')}` : label;
  }

  /** Width (px) of the time area of a row in the week and month views. */
  #trackWidth(): number {
    const sizes = this.#sizes();
    const count = this.columns().length;
    const minimum = count * (this.activeView() === 'month' ? sizes.month : sizes.day);
    return Math.max(minimum, (this.#width() ?? 0) - sizes.resource - 2);
  }

  // ---- scrolling and measuring ----

  #scrollToTime(): void {
    const scroller = this.scroller()?.nativeElement;
    if (!scroller) return;
    const minutes = ɵsdCalendarTimeToMinutes(this.scrollTime() ?? this.#configuration?.scrollTime) ?? this.#earliestWorkingMinute();
    const offset = (minutes / 60) * this.#sizes().hour;
    scroller.scrollLeft = this.#rtl() ? -offset : offset;
  }

  /** Week and month: when today is on screen but its column is hidden, it is brought next to the resource column (§6). */
  #revealToday(): void {
    const scroller = this.scroller()?.nativeElement;
    const cell = scroller?.querySelector<HTMLElement>('[data-axis-day][data-today]');
    if (!scroller || !cell) return;
    const area = scroller.getBoundingClientRect();
    const box = cell.getBoundingClientRect();
    const sticky = this.#sizes().resource;
    if (this.#rtl()) {
      const right = area.right - sticky;
      if (box.right > right || box.left < area.left) scroller.scrollLeft += box.right - right;
    } else {
      const left = area.left + sticky;
      if (box.left < left || box.right > area.right) scroller.scrollLeft += box.left - left;
    }
  }

  #earliestWorkingMinute(): number {
    const starts = this.resources()
      .map(resource => ɵsdCalendarWorkingRanges(this.#hoursOf(resource), ɵsdCalendarWeekday(this.columns()[0]))?.[0]?.start)
      .filter((start): start is number => start !== undefined);
    return starts.length ? Math.min(...starts) : ɵsdCalendarTimeToMinutes(ɵSD_CALENDAR_DEFAULTS.scrollTime)!;
  }

  /** Width of the host before the first ResizeObserver callback, so the first render already fits a narrow host. */

  #measureSizes(): void {
    const element = this.root()?.nativeElement;
    if (!element) return;
    const style = getComputedStyle(element);
    const read = (name: string, fallback: number): number => parseFloat(style.getPropertyValue(name)) || fallback;
    const fallback = this.compact() ? COMPACT_SIZES : SIZES;
    const sizes = {
      hour: read('--sd-scheduler-hour-width', fallback.hour),
      resource: read('--sd-scheduler-resource-width', fallback.resource),
      day: read('--sd-scheduler-day-min-width', fallback.day),
      month: read('--sd-scheduler-month-day-min-width', fallback.month),
    };
    const current = untracked(this.#sizes);
    if (Object.entries(sizes).some(([name, value]) => current[name as keyof typeof sizes] !== value)) this.#sizes.set(sizes);
  }

  #rtl(): boolean {
    return ɵsdCalendarIsRtl(this.#host.nativeElement);
  }

  #announceTitle(): void {
    this.#announcer.announce(untracked(this.title));
  }

  /** Logs a dev-mode diagnostic once per instance and key. */
  #report(level: 'error' | 'warn', key: string, message: string): void {
    this.#reporter.report(level, key, message);
  }
}
