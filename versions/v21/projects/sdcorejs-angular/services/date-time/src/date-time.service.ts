import { assertInInjectionContext, inject, Injectable } from '@angular/core';
import { SD_CORE_CONFIGURATION, type SdTimeZone } from '@sdcorejs/angular/configurations';
import { DateUtilities, type TimeZoneOptions, type ZonedDateTimeParts } from '@sdcorejs/utils/fns';

/** Local Date whose fields equal `parts`: the wall-clock carrier pickers and controls work with. */
const carrierOf = (parts: ZonedDateTimeParts): Date => {
  const carrier = new Date(0);
  carrier.setFullYear(parts.year, parts.month - 1, parts.day);
  carrier.setHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  return carrier;
};

/**
 * Converts and parses model dates in the zone of `ISdCoreConfiguration.timeZone`.
 *
 * - An instant (`Z`/offset, `Date`, epoch) shows as the wall clock of the zone.
 * - A zone-less or date-only string keeps its digits and is read as wall clock in the zone.
 * - A carrier is a local `Date` whose fields are a wall clock (what Material pickers hold);
 *   `toWallClock` / `fromWallClock` are the only crossings between carriers and model values.
 *
 * With `'local'` (the default) every method returns exactly what `DateUtilities` returns
 * without options.
 */
@Injectable({ providedIn: 'root' })
export class SdDateTimeService {
  /** The configured zone, resolved once from the root injector. */
  readonly timeZone: SdTimeZone;
  readonly #options: TimeZoneOptions | undefined;

  constructor() {
    const timeZone = inject(SD_CORE_CONFIGURATION, { optional: true })?.timeZone ?? 'local';
    if (timeZone !== 'local' && !DateUtilities.isValidTimeZone(timeZone)) {
      throw new Error(
        `[@sdcorejs/angular] Invalid ISdCoreConfiguration.timeZone "${String(timeZone)}": use an IANA time zone id such as "Asia/Ho_Chi_Minh", or "local".`
      );
    }
    this.timeZone = timeZone;
    this.#options = timeZone === 'local' ? undefined : { timeZone };
  }

  /** Formats a model value; `''` when invalid. */
  toFormat(value: unknown, format: string): string {
    return DateUtilities.toFormat(value, format, this.#options);
  }

  /** Parses a model value to an instant; `null` when invalid. */
  parse(value: unknown): Date | null {
    return DateUtilities.parse(value, this.#options);
  }

  /** Parses text in `format` as wall clock in the zone; `null` when invalid. */
  parseFrom(value: unknown, format: string): Date | null {
    return DateUtilities.parseFrom(value, format, this.#options);
  }

  /** First instant of the value's calendar day. */
  begin(value: unknown): Date | null {
    return DateUtilities.begin(value, this.#options);
  }

  /** Last millisecond of the value's calendar day. */
  end(value: unknown): Date | null {
    return DateUtilities.end(value, this.#options);
  }

  /** First instant of the next calendar day: the exclusive upper bound of a day filter. */
  beginOfNextDay(value: unknown): Date | null {
    const options = this.#options;
    // why: local mode stays byte-identical to the bound the table filter used before time zones.
    if (!options?.timeZone) return DateUtilities.begin(DateUtilities.addDays(value, 1));
    const day = DateUtilities.toZonedParts(value, options.timeZone);
    if (!day) return null;
    return DateUtilities.fromZonedParts({ year: day.year, month: day.month, day: day.day + 1 }, options.timeZone);
  }

  /** Carrier of today 00:00 in the zone. */
  today(): Date {
    const now = this.now();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  /** Carrier of the current wall clock in the zone. */
  now(): Date {
    const options = this.#options;
    if (!options?.timeZone) return new Date();
    return carrierOf(DateUtilities.toZonedParts(Date.now(), options.timeZone)!);
  }

  /** Carrier of a model value's wall clock in the zone; `null` when invalid. */
  toWallClock(value: unknown): Date | null {
    const options = this.#options;
    if (!options?.timeZone) return DateUtilities.parse(value);
    const parts = DateUtilities.toZonedParts(value, options.timeZone);
    return parts ? carrierOf(parts) : null;
  }

  /** Instant of a carrier's wall clock in the zone. */
  fromWallClock(value: Date): Date {
    const options = this.#options;
    if (!options?.timeZone || !Number.isFinite(value.getTime())) return new Date(value.getTime());
    return DateUtilities.fromZonedParts(
      {
        year: value.getFullYear(),
        month: value.getMonth() + 1,
        day: value.getDate(),
        hour: value.getHours(),
        minute: value.getMinutes(),
        second: value.getSeconds(),
        millisecond: value.getMilliseconds(),
      },
      options.timeZone
    );
  }
}

/**
 * @internal `SdDateTimeService` with `'local'`, for pure helpers that run without an injector (public
 * helpers called directly by consumers, unit tests). Every method equals the service in local mode.
 */
export const ɵSD_LOCAL_DATE_TIME: Pick<SdDateTimeService, 'timeZone' | 'toFormat' | 'parse' | 'begin' | 'end' | 'beginOfNextDay'> = {
  timeZone: 'local',
  toFormat: (value, format) => DateUtilities.toFormat(value, format),
  parse: value => DateUtilities.parse(value),
  begin: value => DateUtilities.begin(value),
  end: value => DateUtilities.end(value),
  beginOfNextDay: value => DateUtilities.begin(DateUtilities.addDays(value, 1)),
};

/**
 * @internal The service inside an injection context, `null` outside one.
 *
 * Pipes call it from a field initializer: created by DI or a template they follow the zone, while
 * `new SdFormatDatePipe()` outside an injection context keeps the local behavior. Only the
 * "no injection context" error (NG0203) is swallowed; an invalid zone still throws.
 */
export function ɵsdInjectDateTime(): SdDateTimeService | null {
  try {
    assertInInjectionContext(ɵsdInjectDateTime);
  } catch {
    return null;
  }
  return inject(SdDateTimeService);
}
