import { A11yModule } from '@angular/cdk/a11y';
import { ChangeDetectionStrategy, Component, Directive, forwardRef, inject } from '@angular/core';
import { MatCalendar } from '@angular/material/datepicker';
import { SdButton } from '@sdcorejs/angular/components/button';
import { ɵSdCalendarHeader } from '@sdcorejs/angular/forms/directives';
import { I18nService } from '@sdcorejs/angular/i18n';
import {
  SdDatetimePicker,
  SdDatetimePickerApply,
  SdDatetimePickerCancel,
  SdDatetimePickerNow,
  SdTimeSpinner,
} from '@sdcorejs/angular-material-datetime';

// The package actions target native buttons. Compose them onto sd-button so its
// single native button remains the keyboard/focus target and uses the same picker state.
@Directive({ selector: 'sd-button[sdDatetimePickerNow]', hostDirectives: [SdDatetimePickerNow] })
class NowButtonDirective {}

@Directive({ selector: 'sd-button[sdDatetimePickerCancel]', hostDirectives: [SdDatetimePickerCancel] })
class CancelButtonDirective {}

@Directive({ selector: 'sd-button[sdDatetimePickerApply]', hostDirectives: [SdDatetimePickerApply] })
class ApplyButtonDirective {}

/**
 * The package opens its public panelTemplate in the CDK overlay. Supply that
 * template here to skin the calendar without duplicating draft/commit, limits,
 * focus restoration or the date adapter's time-zone handling.
 */
@Component({
  selector: 'sd-datetime-panel-picker',
  templateUrl: './datetime-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: SdDatetimePicker, useExisting: forwardRef(() => SdDatetimePanelPicker) }],
  imports: [A11yModule, MatCalendar, SdTimeSpinner, SdButton, NowButtonDirective, CancelButtonDirective, ApplyButtonDirective],
})
export class SdDatetimePanelPicker extends SdDatetimePicker<Date> {
  protected readonly i18n = inject(I18nService);
  protected readonly calendarHeader = ɵSdCalendarHeader;
}
