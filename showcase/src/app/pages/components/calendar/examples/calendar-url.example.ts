import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { SdCalendar, type SdCalendarDateInput, type SdCalendarOption, type SdCalendarView } from '@sdcorejs/angular/components/calendar';
import { demoEvents, type MeetingDto } from './calendar-demo.data';

const VIEWS: readonly SdCalendarView[] = ['month', 'week', 'day', 'agenda'];

@Component({
  selector: 'app-calendar-url-example',
  standalone: true,
  imports: [SdCalendar],
  templateUrl: './calendar-url.example.html',
  styleUrl: './calendar-example.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarUrlExampleComponent {
  readonly #router = inject(Router);
  readonly #query = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  readonly option: SdCalendarOption<MeetingDto> = { dataSource: { onLoad: () => demoEvents() } };

  // ?view= follows the view model and ?date= the date model; sdRangeChange is not used for the URL (it reports 'day'
  // for a compact week).
  view(): SdCalendarView {
    const view = this.#query().get('view') as SdCalendarView | null;
    return view && VIEWS.includes(view) ? view : 'week';
  }

  date(): string {
    return this.#query().get('date')?.replace(/-/g, '/') ?? '2026/10/22';
  }

  write(params: { view?: SdCalendarView; date?: SdCalendarDateInput | null }): void {
    const query = { ...params, ...(typeof params.date === 'string' ? { date: params.date.replace(/\//g, '-') } : {}) };
    void this.#router.navigate([], { queryParams: query, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
