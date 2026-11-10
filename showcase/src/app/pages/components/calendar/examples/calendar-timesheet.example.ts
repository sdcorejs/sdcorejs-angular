import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SdCalendar, SdCalendarDayCellTemplateDirective, type SdCalendarEvent, type SdCalendarOption } from '@sdcorejs/angular/components/calendar';

interface Attendance {
  readonly code: 'X' | 'P' | 'Ô' | '½';
}

const CODES: Attendance['code'][] = ['X', 'X', 'X', 'P', 'X', '½', 'X', 'Ô'];

/** One person's month: one all-day event per working day, the code in `data`. */
function attendance(): SdCalendarEvent<Attendance>[] {
  const events: SdCalendarEvent<Attendance>[] = [];
  for (let day = 1; day <= 31; day++) {
    const date = `2026/10/${String(day).padStart(2, '0')}`;
    const weekday = new Date(2026, 9, day).getDay();
    if (weekday === 0 || weekday === 6) continue;
    const code = CODES[day % CODES.length];
    events.push({ id: `att-${day}`, title: code, start: date, allDay: true, color: code === 'X' ? 'success' : code === 'P' ? 'info' : 'warning', data: { code } });
  }
  return events;
}

@Component({
  selector: 'app-calendar-timesheet-example',
  standalone: true,
  imports: [SdCalendar, SdCalendarDayCellTemplateDirective],
  templateUrl: './calendar-timesheet.example.html',
  styleUrl: './calendar-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarTimesheetExampleComponent {
  readonly option: SdCalendarOption<Attendance> = { dataSource: { onLoad: () => attendance() } };

  /** The template context is typed by the directive; reading `data` through a method keeps the template strict. */
  codeOf(events: readonly SdCalendarEvent<unknown>[]): Attendance['code'] | null {
    return (events[0]?.data as Attendance | undefined)?.code ?? null;
  }
}
