import { booleanAttribute, ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import type { SdTemporalValueTransform } from '@sdcorejs/angular/forms/models';
import type {
  SdCalendarDateInput,
  SdCalendarEvent,
  SdCalendarHoliday,
  SdCalendarMoveError,
  SdCalendarMoveRequest,
  SdCalendarOption,
  SdCalendarView,
  SdCalendarVisibleRange,
  SdCalendarWorkingHours,
} from './calendar.model';

// RED stub of checkpoint 2: inputs and outputs only; rendering lands in the next commit.

@Component({
  selector: 'sd-calendar',
  standalone: true,
  template: '<section></section>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdCalendar<T = unknown> {
  readonly option = input.required<SdCalendarOption<T>>();
  readonly view = model<SdCalendarView>('week');
  readonly date = model<SdCalendarDateInput | null | undefined>(undefined);
  readonly selectedId = model<string | null>(null);
  readonly views = input<readonly SdCalendarView[]>(['month', 'week', 'day', 'agenda']);
  readonly step = input<number | undefined>(undefined);
  readonly firstDayOfWeek = input<number | undefined>(undefined);
  readonly hideWeekends = input(false, { transform: booleanAttribute });
  readonly workingHours = input<SdCalendarWorkingHours | null | undefined>(undefined);
  readonly holidays = input<readonly SdCalendarHoliday[] | undefined>(undefined);
  readonly minDate = input<SdCalendarDateInput | 'TODAY' | null | undefined>(undefined);
  readonly maxDate = input<SdCalendarDateInput | 'TODAY' | null | undefined>(undefined);
  readonly scrollTime = input<string | undefined>(undefined);
  readonly agendaDays = input<number>(14);
  readonly dimPast = input(false, { transform: booleanAttribute });
  readonly transform = input<SdTemporalValueTransform | undefined>(undefined);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null | undefined>(undefined);
  readonly autoId = input<string | null | undefined>(undefined);

  readonly sdSelect = output<SdCalendarEvent<T>>();
  readonly sdRangeChange = output<SdCalendarVisibleRange>();
  readonly sdMove = output<SdCalendarMoveRequest<T>>();
  readonly sdMoveError = output<SdCalendarMoveError<T>>();
  readonly sdLoadError = output<unknown>();

  reload(): void {
    return;
  }
}
