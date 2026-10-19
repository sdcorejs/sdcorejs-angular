import { Injectable } from '@angular/core';
import { ɵsdInjectDateTime } from '@sdcorejs/angular/services/date-time';
import { SdNativeDateAdapter } from '@sdcorejs/angular-material-datetime';

/**
 * `SdNativeDateAdapter` whose `today()` follows `ISdCoreConfiguration.timeZone`.
 *
 * The picker's Now button and the calendar's today marker both come from `today()`, and Now uses it
 * as date AND time, so this returns the current wall clock in the zone (not 00:00). Without a zone it
 * is the base adapter unchanged.
 */
@Injectable()
export class SdDatetimeTimeZoneAdapter extends SdNativeDateAdapter {
  readonly #dateTime = ɵsdInjectDateTime();

  override today(): Date {
    return this.#dateTime && this.#dateTime.timeZone !== 'local' ? this.#dateTime.now() : super.today();
  }
}
