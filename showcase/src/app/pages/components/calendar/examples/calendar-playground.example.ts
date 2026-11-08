import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  SdCalendar,
  type SdCalendarCreateArgs,
  type SdCalendarDateInput,
  type SdCalendarMoveRequest,
  type SdCalendarOption,
  type SdCalendarView,
  type SdCalendarWorkingHours,
} from '@sdcorejs/angular/components/calendar';
import { SdButton } from '@sdcorejs/angular/components/button';
import type { SdTemporalValueTransform } from '@sdcorejs/angular/forms/models';
import { DEMO_HOLIDAYS, delay, demoEvents, type MeetingDto, type MeetingEvent } from './calendar-demo.data';

type MoveMode = 'accept' | 'reject' | 'throw' | 'slow' | 'reason';

const CUSTOM_HOURS: SdCalendarWorkingHours = {
  1: [{ from: '07:30', to: '16:30' }],
  2: [{ from: '07:30', to: '16:30' }],
  3: [{ from: '07:30', to: '16:30' }],
  4: [{ from: '07:30', to: '16:30' }],
  5: [{ from: '07:30', to: '16:30' }],
  6: [{ from: '08:00', to: '12:00' }],
};

@Component({
  selector: 'app-calendar-playground-example',
  standalone: true,
  imports: [SdButton, SdCalendar],
  templateUrl: './calendar-playground.example.html',
  styleUrl: './calendar-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarPlaygroundExampleComponent {
  readonly view = signal<SdCalendarView>('week');
  readonly date = signal<SdCalendarDateInput | null | undefined>('2026/10/22');
  readonly step = signal(30);
  readonly firstDayOfWeek = signal(1);
  readonly hideWeekends = signal(false);
  readonly hours = signal<'default' | 'custom' | 'none'>('default');
  readonly showHolidays = signal(true);
  readonly minToday = signal(false);
  readonly dimPast = signal(false);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  readonly transform = signal<SdTemporalValueTransform | undefined>(undefined);
  readonly withCreate = signal(true);
  readonly withMove = signal(true);
  readonly lockPast = signal(false);
  readonly moveMode = signal<MoveMode>('accept');

  /** The consumer's store: the calendar only reads it through onLoad. */
  readonly events = signal<MeetingEvent[]>(demoEvents());
  readonly selected = signal<MeetingEvent | null>(null);
  readonly log = signal<string[]>([]);
  /** The demo dialog of a create or of a move reason; the calendar waits on its promise. */
  readonly dialog = signal<{ kind: 'create'; args: SdCalendarCreateArgs; title: string } | { kind: 'reason'; title: string } | null>(null);
  #answer: ((value: unknown) => void) | null = null;

  readonly workingHours = computed(() => (this.hours() === 'none' ? null : this.hours() === 'custom' ? CUSTOM_HOURS : undefined));
  readonly holidays = computed(() => (this.showHolidays() ? DEMO_HOLIDAYS : []));

  readonly option = computed<SdCalendarOption<MeetingDto>>(() => ({
    dataSource: { onLoad: () => this.events() },
    ...(this.withCreate() ? { create: { onCreate: (args: SdCalendarCreateArgs) => this.#openCreate(args) } } : {}),
    ...(this.withMove()
      ? {
          move: {
            movable: (event: MeetingEvent) => !this.lockPast() || String(event.start) >= '2026/10/22',
            onMove: (request: SdCalendarMoveRequest<MeetingDto>) => this.#onMove(request),
          },
        }
      : {}),
  }));

  toggle(flag: { set(value: boolean): void; (): boolean }): void {
    flag.set(!flag());
  }

  cycleStep(): void {
    this.step.set(this.step() === 15 ? 30 : this.step() === 30 ? 60 : 15);
  }

  cycleHours(): void {
    this.hours.set(this.hours() === 'default' ? 'custom' : this.hours() === 'custom' ? 'none' : 'default');
  }

  cycleMode(): void {
    const modes: MoveMode[] = ['accept', 'reject', 'throw', 'slow', 'reason'];
    this.moveMode.set(modes[(modes.indexOf(this.moveMode()) + 1) % modes.length]);
  }

  record(name: string, value: unknown): void {
    this.log.update(lines => [`${name} ${JSON.stringify(value, (key, item) => (key === 'signal' || key === 'data' ? undefined : item))}`, ...lines].slice(0, 8));
  }

  answer(value: unknown): void {
    this.#answer?.(value);
    this.#answer = null;
    this.dialog.set(null);
  }

  #openCreate(args: SdCalendarCreateArgs): Promise<MeetingEvent | void> {
    this.dialog.set({ kind: 'create', args, title: 'Họp mới' });
    return new Promise<unknown>(resolve => (this.#answer = resolve)).then(saved => {
      if (!saved) return;
      const created: MeetingEvent = { id: `new-${Date.now()}`, title: String(saved), start: args.start, end: args.end, data: { room: 'Phòng Huế', owner: 'Bạn' } };
      this.events.update(events => [...events, created]);
      return created;
    });
  }

  async #onMove(request: SdCalendarMoveRequest<MeetingDto>): Promise<boolean | 'cancel'> {
    const mode = this.moveMode();
    if (mode === 'reject') return false;
    if (mode === 'throw') throw new Error('Máy chủ từ chối');
    if (mode === 'slow') await delay(2000, request.signal);
    if (mode === 'reason') {
      this.dialog.set({ kind: 'reason', title: request.event.title });
      const reason = await new Promise<unknown>(resolve => (this.#answer = resolve));
      if (!reason) return 'cancel';
    }
    this.events.update(events =>
      events.map(event => (event.id === request.event.id ? { ...event, start: request.to.start, end: request.to.end, allDay: request.to.allDay } : event))
    );
    return true;
  }
}
