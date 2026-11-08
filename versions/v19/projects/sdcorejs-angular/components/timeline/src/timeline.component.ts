import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  NgZone,
  afterNextRender,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SdAvatar } from '@sdcorejs/angular/components/avatar';
import { SdBadge, type SdBadgeData } from '@sdcorejs/angular/components/badge';
import { SdButton } from '@sdcorejs/angular/components/button';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type { SdTimelineChange, SdTimelineItem, SdTimelineLoadResult, SdTimelineOption, SdTimelineValue } from './timeline.model';
import { SdTimelineEmptyDirective, SdTimelineItemActionsDirective, SdTimelineItemContentDirective } from './timeline.templates';
import {
  sdTimelineChangeRows,
  sdTimelineDayLabel,
  sdTimelineGroupByDay,
  sdTimelineIsRecent,
  sdTimelineTime,
  type SdTimelineTime,
} from './timeline.utils';

type SdTimelineValueView = { kind: 'empty' } | { kind: 'badge'; badge: SdBadgeData } | { kind: 'text'; text: string };

interface SdTimelineChangeView {
  readonly label: string;
  readonly from: SdTimelineValueView;
  readonly to: SdTimelineValueView;
  /** Both sides are badges: an arrow icon instead of the "→" character. */
  readonly badges: boolean;
}

interface SdTimelineItemView<T> {
  readonly item: SdTimelineItem<T>;
  /** 1-based position in the whole list (`aria-posinset` of a feed). */
  readonly position: number;
  readonly key: string;
  readonly labelId: string;
  readonly label: string;
  readonly action: string;
  readonly badge: SdBadgeData | undefined;
  readonly icon: string;
  readonly time: SdTimelineTime;
  readonly timeText: string;
  readonly timeTitle: string;
  readonly note: string | undefined;
  readonly changes: { readonly rows: readonly SdTimelineChangeView[]; readonly hidden: number } | null;
}

interface SdTimelineGroupView<T> {
  readonly key: string;
  readonly heading: string | null;
  readonly items: readonly SdTimelineItemView<T>[];
}

const LAYOUT_ICONS = { comment: 'chat_bubble', change: 'edit', event: 'circle' } as const;
const MINUTE = 60_000;
let nextTimelineId = 0;

@Component({
  selector: 'sd-timeline',
  standalone: true,
  imports: [NgTemplateOutlet, SdAvatar, SdBadge, SdButton, SdIcon, SdTranslatePipe],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** Activity history: comments, field changes and events, grouped by day, from `items` or a cursor data source. */
export class SdTimeline<T = unknown> {
  readonly #i18n = inject(I18nService);
  readonly #clock = inject(SdDateTimeService);
  readonly #zone = inject(NgZone);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #fallbackId = `sd-timeline-${nextTimelineId++}`;
  readonly #reported = new Set<string>();

  /** Entries to show. Ignored when `option` is set. */
  readonly items = input<readonly SdTimelineItem<T>[] | undefined>(undefined);
  /** Cursor-paged data source; the timeline manages loading and errors itself. */
  readonly option = input<SdTimelineOption<T> | undefined>(undefined);
  /** `'day'` adds a heading at every day change; `'none'` shows the full date on each entry. */
  readonly groupBy = input<'day' | 'none'>('day');
  readonly size = input<'md' | 'sm'>('md');
  /** Text of the empty state; defaults to the i18n `empty` text. */
  readonly emptyText = input<string | undefined>(undefined);
  /** Accessible name of the region; defaults to the i18n `label` text. */
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Stable suffix used by the Core UI inspector and end-to-end selectors. */
  readonly autoId = input<string | null | undefined>(undefined);
  /** Level of the day headings (`aria-level`), to fit the heading outline of the page. */
  readonly headingLevel = input<2 | 3 | 4>(3);

  /** `onLoad` threw, on the first load or on a later page. */
  readonly sdLoadError = output<unknown>();

  protected readonly contentTemplate = contentChild<SdTimelineItemContentDirective<T>>(SdTimelineItemContentDirective);
  protected readonly actionsTemplate = contentChild<SdTimelineItemActionsDirective<T>>(SdTimelineItemActionsDirective);
  protected readonly emptyTemplate = contentChild(SdTimelineEmptyDirective);

  /** Current instant for relative times; the instance timer moves it only when a label changes. */
  readonly #now = signal(Date.now());
  /** Expanded comment/note texts (`{id}:text`) and change lists (`{id}:changes`). */
  readonly #expanded = signal<ReadonlySet<string>>(new Set());
  /** Texts that are clamped right now (measured after render). */
  readonly #clamped = signal<ReadonlySet<string>>(new Set());

  protected readonly resolvedAutoId = computed(() => (this.autoId() ? `components-timeline-${this.autoId()}` : null));
  protected readonly baseId = computed(() => this.autoId() || this.#fallbackId);
  protected readonly regionLabel = computed(() => this.ariaLabel() || this.#i18n.t('core.component.timeline.label'));
  protected readonly emptyLabel = computed(() => this.emptyText() || this.#i18n.t('core.component.timeline.empty'));

  /** Pages loaded through `option`. */
  readonly #loaded = signal<readonly SdTimelineItem<T>[]>([]);
  readonly #nextCursor = signal<string | null>(null);
  /** `loading`: first page or reload; `more`: next page; `error` / `more-error`: the matching load failed. */
  readonly #phase = signal<'idle' | 'loading' | 'more' | 'error' | 'more-error'>('idle');
  #controller: AbortController | null = null;

  /** Entries currently shown. */
  protected readonly entries = computed<readonly SdTimelineItem<T>[]>(() => (this.option() ? this.#loaded() : (this.items() ?? [])));
  protected readonly phase = this.#phase.asReadonly();
  protected readonly hasMore = computed(() => !!this.option() && this.#nextCursor() !== null);
  protected readonly pageSize = computed(() => this.option()?.pageSize ?? 20);
  /** Feed semantics while pages load automatically on scroll. */
  protected readonly feed = computed(() => this.option()?.loadMore === 'auto');
  /** Bar widths (%) of the three skeleton rows. */
  protected readonly skeletonRows = [[70, 90], [55], [65]] as const;
  protected readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  protected readonly groups = computed<readonly SdTimelineGroupView<T>[]>(() => {
    const entries = this.entries();
    const groupBy = this.groupBy();
    const now = this.#now();
    const expanded = this.#expanded();
    let position = 0;
    const view = (item: SdTimelineItem<T>): SdTimelineItemView<T> => this.#view(item, ++position, groupBy, now, expanded);
    if (groupBy === 'none') return [{ key: 'all', heading: null, items: entries.map(view) }];
    return sdTimelineGroupByDay(entries, this.#clock).map((group, index) => ({
      key: `${group.key ?? 'unknown'}-${index}`,
      heading: group.key ? this.#dayHeading(group.key, now) : '—',
      items: group.items.map(view),
    }));
  });

  protected readonly expanded = this.#expanded.asReadonly();
  protected readonly clamped = this.#clamped.asReadonly();

  readonly #numberFormat = computed(() => new Intl.NumberFormat(this.#i18n.locale(), { maximumFractionDigits: 0 }));

  constructor() {
    const destroyRef = inject(DestroyRef);
    let timer: ReturnType<typeof setInterval> | null = null;
    const stopTimer = (): void => {
      if (timer !== null) clearInterval(timer);
      timer = null;
    };
    // why: one timer per instance, outside the zone; it writes `#now` only when a relative label changes.
    effect(() => {
      const recent = this.groupBy() === 'day' && this.entries().some(item => sdTimelineIsRecent(item.at, this.#now(), this.#clock));
      if (!recent) return stopTimer();
      if (timer !== null) return;
      timer = this.#zone.runOutsideAngular(() => setInterval(() => this.#tick(), MINUTE));
    });

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.#scheduleMeasure());
    let frame = 0;
    this.#scheduleMeasure = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        this.#measure();
      });
    };
    // why: one observer per instance watches every clamped text; re-observe after each render of the list.
    effect(() => {
      this.groups();
      afterNextRender(
        () => {
          observer?.disconnect();
          for (const element of this.#clampElements()) observer?.observe(element);
          this.#measure();
        },
        { injector: this.#injector }
      );
    });

    effect(() => this.#validate(this.entries()));

    // A new option starts over from the first page.
    effect(() => {
      const option = this.option();
      untracked(() => {
        this.#controller?.abort();
        this.#controller = null;
        this.#loaded.set([]);
        this.#nextCursor.set(null);
        this.#phase.set('idle');
        if (option) void this.#load(option, null);
      });
    });
    effect(() => {
      if (isDevMode() && this.option() && this.items()) {
        this.#report('warn', 'items-and-option', '`items` and `option` are both set; `items` is ignored.');
      }
    });

    // Auto mode: load the next page when the sentinel at the end of the list comes within 200px.
    let intersection: IntersectionObserver | null = null;
    effect(() => {
      intersection?.disconnect();
      intersection = null;
      const sentinel = this.sentinel()?.nativeElement;
      if (!sentinel || !this.feed() || typeof IntersectionObserver === 'undefined') return;
      intersection = new IntersectionObserver(
        entries => {
          if (entries.some(entry => entry.isIntersecting)) this.#zone.run(() => this.loadMore());
        },
        { rootMargin: '200px' }
      );
      intersection.observe(sentinel);
    });

    destroyRef.onDestroy(() => {
      this.#controller?.abort();
      intersection?.disconnect();
      stopTimer();
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
    });
  }

  /** Cancels a running load and reads the first page again; the shown entries stay until the result arrives. */
  reload(): void {
    const option = this.option();
    if (option) void this.#load(option, null);
  }

  /** Loads the next page; ignored while a load runs or when there is no next page. */
  loadMore(): void {
    const option = this.option();
    const cursor = this.#nextCursor();
    const phase = this.#phase();
    if (!option || cursor === null || phase === 'loading' || phase === 'more') return;
    void this.#load(option, cursor);
  }

  async #load(option: SdTimelineOption<T>, cursor: string | null): Promise<void> {
    this.#controller?.abort();
    const controller = new AbortController();
    this.#controller = controller;
    this.#phase.set(cursor === null ? 'loading' : 'more');
    let result: SdTimelineLoadResult<T>;
    try {
      result = await option.dataSource.onLoad({ cursor, pageSize: option.pageSize ?? 20, signal: controller.signal });
    } catch (error) {
      if (this.#controller !== controller || controller.signal.aborted) return;
      this.#controller = null;
      this.#phase.set(cursor === null ? 'error' : 'more-error');
      this.sdLoadError.emit(error);
      return;
    }
    // why: a reload or a newer page aborted this request; its late result must not replace newer data.
    if (this.#controller !== controller || controller.signal.aborted) return;
    this.#controller = null;
    this.#loaded.update(current => (cursor === null ? result.items : [...current, ...result.items]));
    this.#nextCursor.set(result.nextCursor);
    this.#phase.set('idle');
  }

  protected toggle(key: string): void {
    this.#expanded.update(current => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  #scheduleMeasure: () => void = () => undefined;

  #clampElements(): HTMLElement[] {
    return Array.from(this.#host.nativeElement.querySelectorAll<HTMLElement>('[data-clamp]'));
  }

  /** Marks texts whose content overflows the three-line clamp; expanded texts keep their toggle. */
  #measure(): void {
    const expanded = untracked(this.#expanded);
    const next = new Set<string>();
    for (const element of this.#clampElements()) {
      const key = element.dataset['clamp']!;
      if (expanded.has(key) || element.scrollHeight > element.clientHeight + 1) next.add(key);
    }
    const current = untracked(this.#clamped);
    if (next.size !== current.size || [...next].some(key => !current.has(key))) this.#zone.run(() => this.#clamped.set(next));
  }

  #tick(): void {
    const next = Date.now();
    const signature = (now: number): string =>
      untracked(this.entries)
        .map(item => {
          const time = sdTimelineTime(item.at, 'day', now, this.#clock);
          return `${time.kind}${time.minutes}`;
        })
        .join();
    if (signature(next) !== signature(untracked(this.#now))) this.#zone.run(() => this.#now.set(next));
  }

  #dayHeading(key: string, now: number): string {
    const label = sdTimelineDayLabel(key, now, this.#clock);
    if (label.kind === 'today') return this.#i18n.t('core.component.timeline.today');
    if (label.kind === 'yesterday') return this.#i18n.t('core.component.timeline.yesterday');
    return label.text;
  }

  #view(
    item: SdTimelineItem<T>,
    position: number,
    groupBy: 'day' | 'none',
    now: number,
    expanded: ReadonlySet<string>
  ): SdTimelineItemView<T> {
    const content = item.content;
    const time = sdTimelineTime(item.at, groupBy, now, this.#clock);
    const action = content.layout === 'comment' ? this.#i18n.t('core.component.timeline.comment-action') : content.data.title;
    const badge = content.layout === 'comment' ? undefined : content.data.badge;
    const full = time.kind === 'invalid' ? '—' : time.full;
    const label =
      content.layout === 'comment'
        ? joinLabel(this.#i18n.t('core.component.timeline.comment-aria', { name: item.actor?.name ?? '' }), full)
        : joinLabel(item.actor?.name, action, badgeText(badge), full);
    let changes: SdTimelineItemView<T>['changes'] = null;
    if (content.layout === 'change') {
      const folded = sdTimelineChangeRows(content.data.changes, expanded.has(`${item.id}:changes`));
      changes = { rows: folded.rows.map(change => this.#changeView(change)), hidden: folded.hidden };
    }
    return {
      item,
      position,
      key: item.id,
      labelId: `${this.baseId()}-item-${item.id}`,
      label,
      action,
      badge,
      icon: item.icon ?? LAYOUT_ICONS[content.layout],
      time,
      timeText: this.#timeText(time),
      timeTitle: time.kind === 'invalid' ? '' : `${time.full} (${this.#zoneLabel(time.iso)})`,
      note: content.layout === 'comment' ? undefined : content.data.note,
      changes,
    };
  }

  #timeText(time: SdTimelineTime): string {
    switch (time.kind) {
      case 'just-now':
        return this.#i18n.t('core.component.timeline.just-now');
      case 'minutes':
        return this.#i18n.t('core.component.timeline.minutes-ago', { count: time.minutes });
      case 'clock':
        return time.clock;
      case 'full':
        return time.full;
      default:
        return '—';
    }
  }

  /** "GMT+7" for the configured zone at that instant, like sd-calendar. */
  #zoneLabel(iso: string): string {
    const zone = this.#clock.timeZone;
    const format = new Intl.DateTimeFormat(this.#i18n.locale(), {
      timeZoneName: 'shortOffset',
      ...(zone && zone !== 'local' ? { timeZone: zone } : {}),
    });
    return format.formatToParts(new Date(iso)).find(part => part.type === 'timeZoneName')?.value ?? '';
  }

  #changeView(change: SdTimelineChange): SdTimelineChangeView {
    const from = this.#valueView(change.from);
    const to = this.#valueView(change.to);
    return { label: change.label, from, to, badges: from.kind === 'badge' && to.kind === 'badge' };
  }

  #valueView(value: SdTimelineValue | undefined): SdTimelineValueView {
    if (value === null || value === undefined || value === '') return { kind: 'empty' };
    if (typeof value === 'object') return { kind: 'badge', badge: value.badge };
    if (typeof value === 'number') return { kind: 'text', text: untracked(this.#numberFormat).format(value) };
    return { kind: 'text', text: value };
  }

  #validate(entries: readonly SdTimelineItem<T>[]): void {
    if (!isDevMode()) return;
    const seen = new Set<string>();
    for (const item of entries) {
      if (seen.has(item.id)) this.#report('error', `duplicate:${item.id}`, `duplicate item id "${item.id}".`);
      seen.add(item.id);
      if (!this.#clock.parse(item.at))
        this.#report('error', `date:${item.id}`, `item "${item.id}" has an unreadable \`at\`; its time shows "—".`);
      if (item.content.layout === 'change' && !item.content.data.changes.length) {
        this.#report('error', `changes:${item.id}`, `item "${item.id}" uses layout "change" with no changes.`);
      }
    }
  }

  /** Logs a dev-mode diagnostic once per instance and key. */
  #report(level: 'error' | 'warn', key: string, message: string): void {
    if (this.#reported.has(key)) return;
    this.#reported.add(key);
    console[level](`[sd-timeline] ${message}`);
  }
}

function badgeText(badge: SdBadgeData | undefined): string {
  if (!badge) return '';
  return [badge.label, badge.title].filter(part => part !== null && part !== undefined && part !== '').join(' ');
}

function joinLabel(...parts: (string | null | undefined)[]): string {
  return parts.filter(part => !!part?.trim()).join(', ');
}
