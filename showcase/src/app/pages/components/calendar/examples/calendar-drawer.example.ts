import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import {
  SdCalendar,
  type SdCalendarCreateArgs,
  type SdCalendarMoveRequest,
  type SdCalendarOption,
} from '@sdcorejs/angular/components/calendar';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { demoEvents, type MeetingDto, type MeetingEvent } from './calendar-demo.data';

@Component({
  selector: 'app-calendar-drawer-example',
  standalone: true,
  imports: [SdButton, SdCalendar],
  templateUrl: './calendar-drawer.example.html',
  styleUrl: './calendar-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDrawerExampleComponent {
  readonly #notify = inject(SdNotifyService);
  readonly calendar = viewChild.required(SdCalendar);
  readonly events = signal<MeetingEvent[]>(demoEvents());
  /** The create drawer (pattern P2): rendered with @if, no route. The calendar keeps its dashed block meanwhile. */
  readonly drawer = signal<{ args: SdCalendarCreateArgs; resolve: (event: MeetingEvent | void) => void } | null>(null);

  readonly option: SdCalendarOption<MeetingDto> = {
    dataSource: { onLoad: () => this.events() },
    create: { onCreate: args => new Promise<MeetingEvent | void>(resolve => this.drawer.set({ args, resolve })) },
    move: { onMove: request => this.#save(request) },
  };

  save(): void {
    const drawer = this.drawer();
    if (!drawer) return;
    const created: MeetingEvent = { id: `drawer-${Date.now()}`, title: 'Họp với khách', start: drawer.args.start, end: drawer.args.end, color: 'success', data: { room: 'Phòng Huế', owner: 'Bạn' } };
    this.events.update(events => [...events, created]);
    this.drawer.set(null);
    drawer.resolve(created);
  }

  close(): void {
    this.drawer()?.resolve();
    this.drawer.set(null);
  }

  // Move right away, with an undo toast (pattern S1): Undo calls move(id, request.from, 'api').
  #save(request: SdCalendarMoveRequest<MeetingDto>): true {
    this.#apply(request.event.id, request.to);
    if (request.source !== 'api') {
      this.#notify.success(`Đã dời “${request.event.title}”`, {
        actionLabel: 'Hoàn tác',
        onAction: () => void this.calendar().move(request.event.id, request.from, 'api'),
      });
    }
    return true;
  }

  #apply(id: string, to: SdCalendarMoveRequest['to']): void {
    this.events.update(events => events.map(event => (event.id === id ? { ...event, start: to.start, end: to.end, allDay: to.allDay } : event)));
  }
}
