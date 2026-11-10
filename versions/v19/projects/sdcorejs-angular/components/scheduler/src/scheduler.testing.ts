import { TestBed, flushMicrotasks, type ComponentFixture } from '@angular/core/testing';
import { SD_CALENDAR_CONFIGURATION, type ISdCalendarConfiguration } from '@sdcorejs/angular/components/calendar';
import type { SdDateTimeService } from '@sdcorejs/angular/services/date-time';
import type { Language } from '@sdcorejs/utils/models';
import { configureScheduleTesting, createWith, deferred, type Deferred } from '../../../testing/schedule-testing';
import { SdScheduler } from './scheduler.component';
import type { SdSchedulerEvent, SdSchedulerLoadArgs, SdSchedulerOption, SdSchedulerResource, SdSchedulerVisibleRange } from './scheduler.model';

// Fixtures of the sd-scheduler component specs (rooms of the design file, Monday 09/11/2026). Spec-only.

export interface Booking {
  readonly people: number;
}

export interface Room {
  readonly seats: number;
}

export type Events = readonly SdSchedulerEvent<Booking>[];

export function rooms(): SdSchedulerResource<Room>[] {
  return [
    { id: 'hall', title: 'Hội trường', description: '120 chỗ', icon: 'groups', data: { seats: 120 } },
    { id: 'hue', title: 'Phòng Huế', description: '8 chỗ · Máy chiếu', icon: 'meeting_room', group: 'Tầng 3', data: { seats: 8 } },
    { id: 'hoi-an', title: 'Phòng Hội An', description: '6 chỗ', icon: 'meeting_room', group: 'Tầng 3', data: { seats: 6 } },
    { id: 'can-tho', title: 'Phòng Cần Thơ', description: '4 chỗ', icon: 'meeting_room', group: 'Tầng 5', data: { seats: 4 } },
    { id: 'da-lat', title: 'Phòng Đà Lạt', description: '10 chỗ', avatar: 'data:,', group: 'Tầng 5', data: { seats: 10 } },
  ];
}

export function bookings(): SdSchedulerEvent<Booking>[] {
  return [
    { id: 'standup', title: 'Giao ban', resourceId: 'hue', start: '2026/11/09 08:00:00', end: '2026/11/09 08:30:00', data: { people: 6 } },
    {
      id: 'review',
      title: 'Review ngân sách Q4',
      resourceId: 'hue',
      start: '2026/11/09 09:00:00',
      end: '2026/11/09 10:30:00',
      color: 'warning',
      data: { people: 6 },
    },
    { id: 'overlap', title: 'Phỏng vấn', resourceId: 'hue', start: '2026/11/09 10:00:00', end: '2026/11/09 11:00:00', data: { people: 2 } },
    {
      id: 'client',
      title: 'Hẹn khách: An Phát',
      resourceId: 'hoi-an',
      start: '2026/11/09 10:00:00',
      end: '2026/11/09 11:30:00',
      color: 'success',
      data: { people: 4 },
    },
    { id: 'training', title: 'Đào tạo', resourceId: 'da-lat', start: '2026/11/09 13:00:00', end: '2026/11/09 17:00:00', data: { people: 9 } },
    { id: 'workshop', title: 'Hội thảo', resourceId: 'hall', start: '2026/11/09', end: '2026/11/10', allDay: true, data: { people: 80 } },
    { id: 'tuesday', title: 'Họp thứ Ba', resourceId: 'can-tho', start: '2026/11/10 09:00:00', end: '2026/11/10 10:00:00', data: { people: 3 } },
  ];
}

export function clientOption(events: () => Events = bookings): SdSchedulerOption<Booking, Room> {
  return { dataSource: { onLoad: () => events() } };
}

/** An option whose `onLoad` records its arguments and answers with a deferred per call. */
export function deferredOption(): { option: SdSchedulerOption<Booking, Room>; calls: SdSchedulerLoadArgs[]; pending: Deferred<Events>[] } {
  const calls: SdSchedulerLoadArgs[] = [];
  const pending: Deferred<Events>[] = [];
  const option: SdSchedulerOption<Booking, Room> = {
    dataSource: {
      onLoad: args => {
        calls.push(args);
        const next = deferred<Events>();
        pending.push(next);
        return next.promise;
      },
    },
  };
  return { option, calls, pending };
}

export interface SchedulerSetup {
  readonly zone?: string;
  readonly now?: string;
  readonly configuration?: ISdCalendarConfiguration;
  readonly language?: Language;
}

export function configureScheduler(setup: SchedulerSetup = {}): { clock: SdDateTimeService; setNow: (next: string) => void } {
  return configureScheduleTesting({
    zone: setup.zone,
    now: setup.now,
    language: setup.language,
    providers: setup.configuration ? [{ provide: SD_CALENDAR_CONFIGURATION, useValue: setup.configuration }] : [],
  });
}

export interface Rendered {
  readonly fixture: ComponentFixture<SdScheduler<Booking, Room>>;
  readonly scheduler: SdScheduler<Booking, Room>;
  readonly host: HTMLElement;
  readonly ranges: SdSchedulerVisibleRange[];
  readonly loadErrors: unknown[];
  readonly setNow: (next: string) => void;
  /** Change detection, then pending microtasks (resolved `onLoad` promises), then change detection again. */
  settle(): void;
}

/** Renders `<sd-scheduler>` on Monday 09/11/2026 with the rooms; call inside `fakeAsync`. */
export function renderScheduler(inputs: Record<string, unknown> = {}, setup: SchedulerSetup = {}, size = { width: 1122, height: 640 }): Rendered {
  const { setNow } = configureScheduler(setup);
  const fixture = createWith(SdScheduler<Booking, Room>, { option: clientOption(), resources: rooms(), date: '2026/11/09', ...inputs });
  const host = fixture.nativeElement as HTMLElement;
  host.style.display = 'block';
  host.style.width = `${size.width}px`;
  host.style.height = `${size.height}px`;
  const ranges: SdSchedulerVisibleRange[] = [];
  const loadErrors: unknown[] = [];
  fixture.componentInstance.sdRangeChange.subscribe(range => ranges.push(range));
  fixture.componentInstance.sdLoadError.subscribe(error => loadErrors.push(error));
  const settle = (): void => {
    fixture.detectChanges();
    flushMicrotasks();
    fixture.detectChanges();
  };
  settle();
  return { fixture, scheduler: fixture.componentInstance, host, ranges, loadErrors, setNow, settle };
}

export function resetScheduler(): void {
  TestBed.resetTestingModule();
}
