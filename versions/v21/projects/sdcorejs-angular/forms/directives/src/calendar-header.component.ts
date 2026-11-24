import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DateRange, MatCalendarHeader } from '@angular/material/datepicker';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { differenceInCalendarDays, format } from 'date-fns';

/**
 * Header for the date, date-range, datetime and chip-calendar pickers. Material handles view changes,
 * min/max paging and accessible button labels. Only a range calendar has a selection summary.
 *
 * Internal (`ɵ`): not covered by SemVer.
 */
@Component({
  selector: 'sd-calendar-header',
  templateUrl: './calendar-header.component.html',
  styleUrl: './calendar-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdTranslatePipe],
})
export class ɵSdCalendarHeader extends MatCalendarHeader<Date> {
  readonly #i18n = inject(I18nService);
  readonly #monthFormat = computed(() => new Intl.DateTimeFormat(this.#i18n.locale(), { month: 'long', year: 'numeric' }));

  /** Visible period text: "Tháng 10 năm 2026" in month view, Material's text in the other views. */
  get periodText(): string {
    if (this.calendar.currentView !== 'month') return this.periodButtonText;
    const text = this.#monthFormat().format(this.calendar.activeDate);
    return text.charAt(0).toLocaleUpperCase(this.#i18n.locale()) + text.slice(1);
  }

  protected get range(): DateRange<Date> | null {
    const selection = this.calendar.selected;
    return selection instanceof DateRange ? selection : null;
  }

  protected rangeSummary(start: Date, end: Date) {
    // Material holds the wall-clock dates displayed by the picker, including when the model uses zoned ISO instants.
    // Count calendar boundaries so both endpoints count even across 23- or 25-hour days.
    const count = differenceInCalendarDays(end, start) + 1;
    return {
      dates: `${format(start, 'dd/MM')} – ${format(end, 'dd/MM/yyyy')}`,
      days: this.#i18n.t(count === 1 ? 'core.form.date-range.summary-day' : 'core.form.date-range.summary-days', { count }),
    };
  }
}
