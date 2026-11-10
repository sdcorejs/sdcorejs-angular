import { ChangeDetectionStrategy, Component, computed, signal, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdCalendar, type SdCalendarOption } from '@sdcorejs/angular/components/calendar';
import { delay, demoEvents, type MeetingDto } from './calendar-demo.data';

@Component({
  selector: 'app-calendar-server-example',
  standalone: true,
  imports: [SdButton, SdCalendar],
  templateUrl: './calendar-server.example.html',
  styleUrl: './calendar-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarServerExampleComponent {
  readonly failing = signal(false);
  readonly calls = signal(0);
  readonly lastError = signal('');
  readonly calendar = viewChild.required(SdCalendar);

  // A server source: query the range, pass the signal on, let the calendar handle loading and errors.
  readonly option = computed<SdCalendarOption<MeetingDto>>(() => ({
    dataSource: {
      onLoad: async ({ from, to, signal }) => {
        this.calls.update(count => count + 1);
        await delay(600, signal);
        if (this.failing()) throw new Error('Máy chủ không phản hồi');
        return demoEvents().filter(event => String(event.start).slice(0, 10) <= to && String(event.end ?? event.start).slice(0, 10) >= from);
      },
    },
  }));
}
