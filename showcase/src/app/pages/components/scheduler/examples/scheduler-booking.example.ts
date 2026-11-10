import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SdScheduler, type SdSchedulerOption, type SdSchedulerView } from '@sdcorejs/angular/components/scheduler';
import { DEMO_DAY, demoBookings, demoRooms, perfEvents, perfResources, type BookingDto, type BookingEvent, type RoomDto } from './scheduler-demo.data';

@Component({
  selector: 'app-scheduler-booking-example',
  standalone: true,
  imports: [SdScheduler],
  templateUrl: './scheduler-booking.example.html',
  styleUrl: './scheduler-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerBookingExampleComponent {
  readonly view = signal<SdSchedulerView>('day');
  readonly date = signal<string | null | undefined>(DEMO_DAY);
  /** 150 resources × 31 days × 3 events (TESTING §10). */
  readonly perf = signal(false);
  readonly events = signal<BookingEvent[]>(demoBookings());

  readonly resources = computed(() => (this.perf() ? perfResources() : demoRooms()));
  readonly option = computed<SdSchedulerOption<BookingDto, RoomDto>>(() => {
    const events = this.perf() ? perfEvents() : this.events();
    return { dataSource: { onLoad: () => events } };
  });

  togglePerf(): void {
    const next = !this.perf();
    this.perf.set(next);
    this.view.set(next ? 'month' : 'day');
    this.date.set(next ? '2026/12/01' : DEMO_DAY);
  }
}
