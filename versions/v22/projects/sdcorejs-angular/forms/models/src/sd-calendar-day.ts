import { DateUtilities } from '@sdcorejs/utils/fns';

import { sdParseTransformedTemporal, ɵsdParseTransformedInstant } from './sd-temporal-transform';

/**
 * The part of `SdDateTimeService` the calendar-day reading needs. Structural, so `forms/models` does not depend on
 * `services/date-time`; pass the service itself.
 */
export interface ɵSdCalendarDayZone {
  readonly timeZone: string;
  toFormat(value: unknown, format: string): string;
}

/**
 * Reads one date-like value as a calendar day `yyyy/MM/dd`, the way `<sd-date>` reads its model. Shared by
 * `<sd-date>` and `<sd-chip-calendar>` so both read the same values the same way.
 *
 * - Without a zone (or `timeZone: 'local'`): `DateUtilities.isDate` accepts a `Date`, a timestamp, canonical
 *   `yyyy/MM/dd` and ISO; an RFC-1123 `toUTCString()` falls back to `sdParseTransformedTemporal`.
 * - With a configured zone: an instant takes its calendar day in that zone (`SdDateTimeService.toFormat`), and a
 *   transformed instant (zoned ISO, RFC-1123) is read through `ɵsdParseTransformedInstant`.
 *
 * Returns `null` for `null`, `undefined`, `''` and anything it cannot read.
 *
 * Internal (`ɵ`): not covered by SemVer.
 */
export function ɵsdNormalizeCalendarDay(value: unknown, zone?: ɵSdCalendarDayZone | null): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (!zone || zone.timeZone === 'local') {
    if (DateUtilities.isDate(value)) return DateUtilities.toFormat(value, 'yyyy/MM/dd') || null;
    // why: only after the existing parser declined. `DateUtilities.isDate` takes Date, timestamp, canonical
    // `yyyy/MM/dd` and ISO, but not the RFC-1123 string of `toUTCString()`, so without this branch a
    // `transform="UTCString"` value could not be read back.
    const parsed = sdParseTransformedTemporal(value);
    return parsed ? DateUtilities.toFormat(parsed, 'yyyy/MM/dd') || null : null;
  }
  const day = zone.toFormat(value, 'yyyy/MM/dd');
  if (day) return day;
  const instant = ɵsdParseTransformedInstant(value);
  return instant ? zone.toFormat(instant, 'yyyy/MM/dd') || null : null;
}
