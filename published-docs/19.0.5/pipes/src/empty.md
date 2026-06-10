# `sdEmpty` pipe (`| sdEmpty`)

**Type**: Pipe
**Pure**: yes (default; no explicit `pure: false`)
**Class**: `SdEmptyPipe`
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes` (or direct: `@sdcorejs/angular/pipes/empty`)

## One-line purpose
Replaces `null`, `undefined`, or empty-string values with the project-wide "empty" placeholder constant `EMPTY_STR` (typically `"-"` or `"--"` depending on configuration).

## When to use
- Display values in tables / detail panels where a missing field should render a consistent placeholder
- Anywhere you'd otherwise write `{{ value || '-' }}` — unifies the placeholder across the app

## Signature
```ts
transform(value: any): string
```

| Param | Type | Notes |
| --- | --- | --- |
| `value` | `any` | Any input. Returns `EMPTY_STR` when value is `undefined`, `null`, or `''`. Otherwise returns `value` as-is (note: not coerced to string for non-empty inputs — pipe return type is declared `string` but TypeScript allows pass-through). |

## Examples

### 1. Table cell fallback
```html
<td>{{ row.note | sdEmpty }}</td>
```

### 2. Detail-panel value
```html
<span class="val">{{ user.phone | sdEmpty }}</span>
```

### 3. Combined with another pipe
```html
<span>{{ (record.amount | sdFormatNumber) | sdEmpty }}</span>
```

## Edge cases / null behavior
- `undefined` → `EMPTY_STR`
- `null` → `EMPTY_STR`
- `''` (empty string) → `EMPTY_STR`
- `0`, `false`, `[]`, `{}` → returned as-is (these are NOT considered empty by this pipe)
- Non-string non-empty values (e.g. a number or Date) are returned untransformed

## Anti-patterns
- Treating `0` or `false` as empty — this pipe does not. Use a custom expression if you need that.
- Using in tight loops over very large lists with frequent reference changes — pipe is pure, but verify referential stability of inputs.
- Relying on pipe to coerce non-strings to string — only the empty-replacement path returns the constant; pass-through values keep their original type.

## Related
- `EMPTY_STR` constant from `@sdcorejs/angular/utilities/models` — the placeholder string itself.
- `| sdFormatNumber` — pair with `| sdEmpty` for "missing number" cells.
