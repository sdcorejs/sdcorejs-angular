import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdScheduler,
  type SdSchedulerCreateArgs,
  type SdSchedulerMoveRequest,
  type SdSchedulerOption,
  type SdSchedulerView,
} from '@sdcorejs/angular/components/scheduler';
import {
  DEMO_DAY,
  DEMO_HOLIDAYS,
  delay,
  demoBookings,
  demoRooms,
  perfEvents,
  perfResources,
  type BookingDto,
  type BookingEvent,
  type RoomDto,
  type RoomResource,
} from './scheduler-demo.data';

type MoveMode = 'accept' | 'reject' | 'cancel' | 'throw' | 'slow';
const VIEWS: readonly SdSchedulerView[] = ['day', 'week', 'month'];
const MODES: readonly MoveMode[] = ['accept', 'reject', 'cancel', 'throw', 'slow'];

@Component({
  selector: 'app-scheduler-booking-example',
  standalone: true,
  imports: [SdButton, SdScheduler],
  templateUrl: './scheduler-booking.example.html',
  styleUrl: './scheduler-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerBookingExampleComponent {
  readonly view = signal<SdSchedulerView>('day');
  readonly date = signal<string | null | undefined>(DEMO_DAY);
  readonly step = signal(30);
  readonly hideWeekends = signal(false);
  readonly withHours = signal(true);
  readonly showHolidays = signal(true);
  readonly dimPast = signal(false);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  readonly server = signal(false);
  /** The next load throws once: the error band, then Retry loads again. */
  readonly failNext = signal(false);
  readonly moveMode = signal<MoveMode>('accept');
  readonly noResources = signal(false);
  /** 150 resources × 31 days × 3 events (TESTING §10). */
  readonly perf = signal(false);

  /** The consumer's store: the scheduler only reads it through onLoad. */
  readonly events = signal<BookingEvent[]>(demoBookings());
  readonly scheduler = viewChild.required(SdScheduler);
  readonly selected = signal<BookingEvent | null>(null);
  readonly log = signal<string[]>([]);
  /** The demo dialog of a create; the scheduler keeps its dashed block until the promise settles. */
  readonly dialog = signal<{ args: SdSchedulerCreateArgs<RoomDto>; title: string } | null>(null);
  #answer: ((title: string | null) => void) | null = null;

  readonly resources = computed<readonly RoomResource[]>(() => (this.noResources() ? [] : this.perf() ? perfResources() : demoRooms()));
  readonly workingHours = computed(() => (this.withHours() ? undefined : null));
  readonly holidays = computed(() => (this.showHolidays() ? DEMO_HOLIDAYS : []));

  readonly option = computed<SdSchedulerOption<BookingDto, RoomDto>>(() => {
    const server = this.server();
    const perf = this.perf();
    return {
      dataSource: {
        onLoad: async ({ signal }) => {
          if (server) await delay(600, signal);
          if (this.failNext()) {
            this.failNext.set(false);
            throw new Error('Máy chủ không phản hồi');
          }
          return perf ? perfEvents() : this.events();
        },
      },
      create: { onCreate: args => this.#openCreate(args) },
      move: {
        // A room smaller than the meeting refuses the drop (§17).
        droppable: ({ event, resource }) => (resource.data?.seats ?? 0) >= (event.data?.people ?? 0),
        onMove: request => this.#onMove(request),
      },
    };
  });

  toggle(flag: { set(value: boolean): void; (): boolean }): void {
    flag.set(!flag());
  }

  cycleView(): void {
    this.view.set(VIEWS[(VIEWS.indexOf(this.view()) + 1) % VIEWS.length]);
  }

  cycleStep(): void {
    this.step.set(this.step() === 15 ? 30 : this.step() === 30 ? 60 : 15);
  }

  failOnce(): void {
    this.failNext.set(true);
    this.scheduler().reload();
  }

  cycleMode(): void {
    this.moveMode.set(MODES[(MODES.indexOf(this.moveMode()) + 1) % MODES.length]);
  }

  togglePerf(): void {
    const next = !this.perf();
    this.perf.set(next);
    this.view.set(next ? 'month' : 'day');
    this.date.set(next ? '2026/12/01' : DEMO_DAY);
  }

  record(name: string, value: unknown): void {
    this.log.update(lines => [`${name} ${JSON.stringify(value, (key, item) => (key === 'signal' || key === 'data' ? undefined : item))}`, ...lines].slice(0, 8));
  }

  answer(title: string | null): void {
    this.#answer?.(title);
    this.#answer = null;
    this.dialog.set(null);
  }

  #openCreate(args: SdSchedulerCreateArgs<RoomDto>): Promise<BookingEvent | void> {
    this.dialog.set({ args, title: `Họp tại ${args.resource.title}` });
    return new Promise<string | null>(resolve => (this.#answer = resolve)).then(title => {
      if (!title) return;
      const created: BookingEvent = {
        id: `new-${Date.now()}`,
        title,
        resourceId: args.resourceId,
        start: args.start,
        end: args.end,
        allDay: args.allDay,
        data: { people: 2, host: 'Bạn' },
      };
      this.events.update(events => [...events, created]);
      return created;
    });
  }

  async #onMove(request: SdSchedulerMoveRequest<BookingDto, RoomDto>): Promise<boolean | 'cancel'> {
    const mode = this.moveMode();
    if (mode === 'reject') return false;
    if (mode === 'cancel') return 'cancel';
    if (mode === 'throw') throw new Error('Máy chủ từ chối');
    if (mode === 'slow') await delay(2000, request.signal);
    const { to } = request;
    this.events.update(events =>
      events.map(event =>
        event.id === request.event.id ? { ...event, start: to.start, end: to.end, allDay: to.allDay, resourceId: to.resourceId } : event
      )
    );
    return true;
  }
}
