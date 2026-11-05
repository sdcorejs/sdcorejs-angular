# `SdDateTimeService`

**Type:** root injectable date converter
**Import path:** `@sdcorejs/angular/services/date-time`
**Requires:** `@sdcorejs/utils` 1.3.0 or later

`SdDateTimeService` formats, parses and bounds model dates in the time zone of `ISdCoreConfiguration.timeZone`. Every Core UI surface that shows, filters or serializes a model date goes through it, so one setting keeps the whole app on the same calendar.

## Why a fixed zone

The offset of a zone changes over history. `Asia/Ho_Chi_Minh` was UTC+08 from 31/12/1959 to 13/06/1975, and UTC+07 before and after. A value saved in Vietnam as `20/05/1960 00:00` is the instant `1960-05-19T16:00:00Z`. A browser in Bangkok (UTC+07 in 1960) shows that instant as `19/05/1960 23:00`: the date moves back one day.

With `timeZone: 'Asia/Ho_Chi_Minh'`, every browser shows `20/05/1960`, whatever its own zone.

## Setup

```ts
// app.config.ts
import { SD_CORE_CONFIGURATION } from '@sdcorejs/angular/configurations';

export const appConfig: ApplicationConfig = {
  providers: [{ provide: SD_CORE_CONFIGURATION, useValue: { timeZone: 'Asia/Ho_Chi_Minh' } }],
};
```

- `'local'` (the default) keeps the browser zone. Every method then returns exactly what `DateUtilities` returns without options.
- Use an IANA id (`'Asia/Ho_Chi_Minh'`, `'UTC'`, `'Asia/Bangkok'`...). The typed list only drives autocomplete; any IANA id is accepted.
- A numeric offset such as `'+07:00'` is rejected: it has no offset history. An unknown id throws a clear error when the service is created.
- The service reads the setting once, from the root injector. Provide `SD_CORE_CONFIGURATION` in `ApplicationConfig`; a value provided on a lazy route is not read.
- Try it in the Showcase: add `?timeZone=Asia/Ho_Chi_Minh` to a Showcase URL and load the page; the Date Time page shows the active zone, the date controls and a server table in that zone.

## Value kinds

| Kind | Example | Meaning under a zone |
| --- | --- | --- |
| Instant | `'1960-05-19T16:00:00Z'`, `'...+08:00'`, `Date`, epoch ms | A point in time. It shows as the wall clock of the zone. |
| Zone-less date time | `'1960/05/20 08:00:00'`, `'1960-05-20T08:00:00'` | A wall clock in the zone. The digits never change. |
| Date only | `'1960/05/20'`, `'1960-05-20'` | A calendar day. The digits never change. |
| Carrier | a local `Date` whose fields are a wall clock | What Material pickers hold. Only `toWallClock` / `fromWallClock` cross between carriers and model values. |

## API

```ts
class SdDateTimeService {
  readonly timeZone: SdTimeZone;
  toFormat(value: unknown, format: string): string; // '' when invalid
  parse(value: unknown): Date | null; // instant
  parseFrom(value: unknown, format: string): Date | null; // text in `format`, wall clock in the zone
  begin(value: unknown): Date | null; // first instant of the calendar day
  end(value: unknown): Date | null; // last millisecond of the calendar day
  beginOfNextDay(value: unknown): Date | null; // exclusive upper bound of a day filter
  today(): Date; // carrier of today 00:00 in the zone
  now(): Date; // carrier of the current wall clock in the zone
  toWallClock(value: unknown): Date | null; // model value -> carrier
  fromWallClock(value: Date): Date; // carrier -> instant
}
```

```ts
const dateTime = inject(SdDateTimeService);
dateTime.toFormat('1960-05-19T16:00:00Z', 'dd/MM/yyyy HH:mm'); // '20/05/1960 00:00'
dateTime.begin('1975/06/12')?.toISOString(); // '1975-06-11T16:00:00.000Z'
dateTime.beginOfNextDay('1975/06/12')?.toISOString(); // '1975-06-12T17:00:00.000Z' (that day lasted 25 hours)
```

A day filter is `[begin(day), beginOfNextDay(day))`. Do not compute the upper bound as `begin + 24h`: a day can last 23 or 25 hours.

Outside Angular, `DateUtilities` of `@sdcorejs/utils` takes the same zone: `DateUtilities.toFormat(value, format, { timeZone })`, `DateUtilities.begin(value, { timeZone })`, `FilterUtilities.evaluate(filter, item, { timeZone })`.

## What follows the zone

- Pipes: `sdFormatDate`, `sdFormatDatetime`, `sdTimeDifferent` (pipes created with `new` outside an injection context keep the browser zone).
- Forms: `sd-date`, `sd-datetime`, `sd-date-range`. The calendar day, the `TODAY` limits, the picker's today and Now, and the `transform` outputs (`ISOString`, `UTCString`). `sd-time` and `sd-chip-calendar` have no zone and never shift.
- `sd-table`: cells, server filter payloads (`SdConvertToPagingReq`), client filter, local sort, aggregate MIN/MAX and Excel export.
- `sd-import-excel`, `sd-form-generic` (rules, validations, read-only display, `'today'` limits), `sd-history`, `sd-file-explorer` (`modifiedAt`, today/yesterday).

### `form.value` when a zone is set

A configured zone makes the date forms register their **model value** in the parent form, the same way a `transform` does:

| Control | `form.value` without a zone | `form.value` with a zone and no `transform` |
| --- | --- | --- |
| `sd-date` | `Date` | `'yyyy/MM/dd'` |
| `sd-datetime` | display string | `'yyyy/MM/dd HH:mm:ss'` |
| `sd-date-range` | `{ from: Date, to: Date }` | `{ from: 'yyyy/MM/dd', to: 'yyyy/MM/dd' }` |

With a `transform`, `form.value` is the transformed instant in both cases.

The parent form emits `valueChanges` once per user edit that changes the model, carrying the model value, with a zone or a `transform` as without them. A write from the parent `[(model)]` binding stays silent.

## Backend contract

- Zone-less values (`'1960/05/20'`, `'1960/05/20 08:00:00'`) are wall clock in the configured zone. A backend must read them in the same zone.
- `sd-query-bar` and `sd-query-builder` send zone-less values and the `TODAY` / relative tokens unchanged. The backend resolves them in the configured zone.
- `sd-table` server filters send instants (`toISOString()`) computed in the zone.

## Anti-patterns

- Do NOT format or parse model dates with `new Date(value)`, `Date.parse`, local getters or `DateUtilities` without `{ timeZone }` when a zone is configured. Use the service.
- Do NOT send a carrier (`dateTime.now()`, `dateTime.today()`, a picker `Date`) to the backend. Convert it with `fromWallClock` first.
- Do NOT add `timeZone` to existing data without checking how the backend stores zone-less values.
