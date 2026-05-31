# `sdFormatNumber` pipe (`| sdFormatNumber`)

**Type**: Pipe
**Pure**: yes (default)
**Class**: `SdFormatNumberPipe` (also `@Injectable({ providedIn: 'root' })` — usable via DI)
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes` (or direct: `@sdcorejs/angular/pipes/format-number`)

## One-line purpose
Locale-aware number formatting — uses Vietnamese style (`1.234.567,89`) when `SD_CORE_CONFIGURATION.format.number === '1.234.567,89'`, otherwise ISO style (`1,234,567.89`).

## When to use
- Display monetary amounts, quantities, percentages in tables and detail panels
- Anywhere consistent locale-aware decimal/thousand separators are required
- Pair with `| sdEmpty` to handle missing values gracefully

## Signature
```ts
transform(value: any, digits?: number): string | null
```

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `any` | — | Input. Must be coercible to number via `+value`. If `NumberUtilities.isNumber(value)` is false, the inner `fixedValue` becomes `null`. |
| `digits` | `number` | `2` | Number of decimal places. Forwarded to `Number.toFixed(digits)`. |

## Examples

### 1. Currency in a list (default 2 digits)
```html
<td>{{ row.amount | sdFormatNumber }}</td>
<!-- VN config: 1.234.567,89 — ISO config: 1,234,567.89 -->
```

### 2. Whole number with 0 decimals
```html
<span>{{ stats.userCount | sdFormatNumber : 0 }}</span>
```

### 3. Combined with `| sdEmpty`
```html
<span>{{ (row.balance | sdFormatNumber) | sdEmpty }}</span>
```

## Edge cases / null behavior
- `null` / `undefined` / non-numeric string → `NumberUtilities.isNumber` returns false → `fixedValue = null` → result is whatever `NumberUtilities.toVN(null)` / `toISO(null)` returns (typically `null` or empty). Combine with `| sdEmpty` for a visible placeholder.
- `0` → formatted normally (`'0,00'` VN or `'0.00'` ISO with default `digits=2`).
- Numeric strings (e.g. `"42.5"`) — coerced via `+value`, formatted as numbers.
- Locale selection comes from injected `SD_CORE_CONFIGURATION.format.number`. If the token is not provided, falls back to ISO formatting.

## Anti-patterns
- Passing already-formatted strings (with separators) — `+value` won't parse `"1.234,5"` correctly; format raw numeric values only.
- Hard-coding locale in templates — the pipe is the single source of truth; configure via `SD_CORE_CONFIGURATION` provider, don't bypass.
- Using to render percentages — pipe doesn't append `%`; format the number then concatenate.

## Related
- `SD_CORE_CONFIGURATION` injection token from `@sdcorejs/angular/configurations`.
- `NumberUtilities.toVN` / `toISO` — underlying formatters.
- `| sdEmpty` — placeholder for missing numeric values.
