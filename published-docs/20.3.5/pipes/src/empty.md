# `sdEmpty` pipe (`| sdEmpty`)

**Type**: Pipe
**Pure**: yes (default)
**Class**: `SdEmptyPipe`
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes`

## One-line purpose

Legacy/simple empty-value fallback. It replaces `null`, `undefined`, or empty-string values with `EMPTY_STR` (currently `--`).

## Prefer `sdView` for new display code

For new table cells, detail views, and AI-generated templates, prefer `sdView` because it handles the wider display contract:

| Value                       | `sdEmpty`                 | `sdView`                   |
| --------------------------- | ------------------------- | -------------------------- |
| `null` / `undefined` / `''` | `--`                      | `--`                       |
| `NaN`                       | `NaN`                     | `--`                       |
| `[]`                        | array object/pass-through | `--`                       |
| `['A', 'B']`                | array object/pass-through | `A, B`                     |
| `0` / `false`               | preserved                 | preserved as `0` / `false` |

Use `sdEmpty` only when you intentionally want the old narrow behavior.

## When to use

- Existing templates that already rely on the narrow empty-only behavior.
- Simple text values where only `null`, `undefined`, and `''` need fallback.
- Backward-compatible code where changing array/`NaN` behavior would be risky.

## When NOT to use

- New table cells or detail pages with unknown data shape - use `sdView`.
- Arrays that should display as comma-separated labels.
- Number/date formatting. Format first with `sdFormatNumber`, `sdFormatDate`, or `sdFormatDatetime`, then apply `sdView`.
- Editable inputs; placeholders and validation belong in the form component.

## Signature

```ts
transform(value: any): string
```

| Param   | Type  | Notes                                                                                    |
| ------- | ----- | ---------------------------------------------------------------------------------------- |
| `value` | `any` | Returns `EMPTY_STR` for `undefined`, `null`, or `''`. Otherwise returns the value as-is. |

## Standalone import checklist

Every standalone component that uses `| sdEmpty` must import `SdEmptyPipe`.

```ts
import { Component } from '@angular/core';
import { SdEmptyPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [SdEmptyPipe],
  template: `<span>{{ user.phone | sdEmpty }}</span>`,
})
export class UserSummaryComponent {
  user = { phone: null };
}
```

## Examples

### 1. Legacy table cell fallback

```html
<td>{{ row.note | sdEmpty }}</td>
```

### 2. Prefer this for new code

```html
<td>{{ row.note | sdView }}</td>
<td>{{ row.tags | sdView }}</td>
<td>{{ row.amount | sdFormatNumber : 0 | sdView }}</td>
```

## Edge cases / null behavior

- `undefined` -> `--`
- `null` -> `--`
- `''` -> `--`
- `0`, `false`, `[]`, `{}` -> returned as-is
- `NaN` -> returned as-is

## Anti-patterns

- Treating `sdEmpty` as the default display pipe for all data. Use `sdView` for new UI.
- Expecting arrays to be joined. `sdEmpty` does not join arrays.
- Expecting `NaN` to become `--`. `sdEmpty` preserves `NaN`; `sdView` handles it.
- Relying on the pipe to coerce non-strings to string; pass-through values keep their original type.

## Related

- `EMPTY_STR` constant from `@sdcorejs/utils/constants`.
- `sdView` - preferred display fallback pipe for new table/detail templates.
- `sdFormatNumber`, `sdFormatDate`, `sdFormatDatetime` - format first, then apply `sdView`.
