import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatCalendarHeader } from '@angular/material/datepicker';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

/**
 * Header of the `<sd-chip-calendar>` popup (design handoff 3 · 2): previous button, period label, next button, in that
 * tab order. Extends Material's header for the paging rules, the min/max limits and the `MatDatepickerIntl` labels;
 * only the markup and the month label change. The month label is the current locale's long month and year
 * (`Intl.DateTimeFormat`), capitalised; the year and multi-year views keep Material's labels.
 *
 * Internal (`ɵ`): not covered by SemVer.
 */
@Component({
  selector: 'sd-chip-calendar-header',
  templateUrl: './chip-calendar-header.component.html',
  styleUrl: './chip-calendar-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon],
})
export class ɵSdChipCalendarHeader extends MatCalendarHeader<Date> {
  readonly #i18n = inject(I18nService);

  /** Visible period text: "Tháng 10 năm 2026" in month view, Material's text in the other views. */
  get periodText(): string {
    if (this.calendar.currentView !== 'month') return this.periodButtonText;
    const text = new Intl.DateTimeFormat(this.#i18n.locale(), { month: 'long', year: 'numeric' }).format(this.calendar.activeDate);
    return text.charAt(0).toLocaleUpperCase(this.#i18n.locale()) + text.slice(1);
  }
}
