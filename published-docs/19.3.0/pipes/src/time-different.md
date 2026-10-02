# `sdTimeDifferent` pipe (`| sdTimeDifferent`)

**Type**: Pipe
**Pure**: yes (default) — but returns an `Observable<string>`, so use with `| async`
**Class**: `SdTimeDifferentPipe`
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes` (or direct: `@sdcorejs/angular/pipes/time-different`)

## One-line purpose
Streams a relative time string ("2 phút trước") that updates every second while within the chosen threshold, then emits the absolute formatted date once and **completes**; a value already past the threshold (or in the future) emits once with no timer at all.

## When to use
- Activity feeds, comment lists, audit logs — recency display that auto-ticks
- "Last seen" / "updated N ago" badges
- Anywhere you want the current relative time to stay accurate without manual change-detection

## When NOT to use

- Do not use it without `| async`; the pipe returns an `Observable<string>`.
- Do not use it for thousands of rows of *fresh* data in a large table; each instance still owns a 1-second interval until its value ages past the threshold.
- Do not use it for strict audit/legal timestamps where absolute time must always be visible.

## Signature
```ts
transform(
  value: any,
  format: string,
  different: 'second' | 'minute' | 'hour' | 'day' | 'month'
): Observable<string>
```

| Param | Type | Notes |
| --- | --- | --- |
| `value` | `any` | A date-like input. If `DateUtilities.isDate(value)` is false, returns `of('')`. |
| `format` | `string` | Date format pattern used by `DateUtilities.toFormat` for the absolute fallback (after threshold). |
| `different` | `'second' \| 'minute' \| 'hour' \| 'day' \| 'month'` | Threshold. While `now - value` is below the threshold (60s / 60min / 24h / 30d / 365h respectively per source — note `month` constant is `maxHour * 365` in the implementation), shows the relative `DateUtilities.timeDifference`. Past the threshold, shows absolute `format`. |

## Examples

### 1. Minute-fresh comment timestamp
```html
<small>{{ comment.createdAt | sdTimeDifferent : 'dd/MM/yyyy HH:mm' : 'minute' | async }}</small>
```

### 2. "Updated N ago" up to a day, then absolute date
```html
<span>Cập nhật {{ row.updatedAt | sdTimeDifferent : 'dd/MM/yyyy' : 'day' | async }}</span>
```

### 3. Within last hour only
```html
<span>{{ alert.firedAt | sdTimeDifferent : 'HH:mm:ss' : 'hour' | async }}</span>
```

## Edge cases / null behavior
- Non-date / `null` / `undefined` input → emits `''`.
- `different` falsy → emits a single absolute formatted value (no interval).
- Future date (`now - value < 0`) → emits a single absolute formatted value.
- **Value already older than the threshold → emits the absolute formatted value once and completes; no interval is created at all.**
- **Value inside the threshold → `interval(1000)` ticks the relative string, then the first tick past the threshold emits the absolute formatted value and the observable completes.** The stream is finite: once the output can no longer change, the timer and the per-tick `async`-pipe change detection stop for good. Still combine with `| async` so Angular auto-subscribes/unsubscribes.

## Anti-patterns
- Forgetting `| async` — you'd render `[object Object]` (an `Observable`).
- Assuming the stream never ends — it completes once the value ages out of the relative window. Do not chain operators that depend on an infinite source.
- Using thousands of instances on a long list of *recent* rows — each still spins up its own `interval(1000)` until it ages out. For very large lists, consider a single ticker service that fans out updates.
- Confusing the `month` threshold — in source, `maxMonth = maxHour * 365` (i.e. ~365 hours, not 365 days). If you need a true month boundary, verify against `DateUtilities.timeDifference`'s output.

## Related
- `DateUtilities.timeDifference` / `DateUtilities.toFormat` — underlying helpers from `@sdcorejs/angular/utilities/extensions`.
- Angular `| async` — required consumer for the emitted `Observable<string>`.
