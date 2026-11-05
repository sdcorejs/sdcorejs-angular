# `sdFormatNumber` pipe (`| sdFormatNumber`)

**Type**: Pipe
**Pure**: yes (default)
**Class**: `SdFormatNumberPipe` (also `@Injectable({ providedIn: 'root' })` - usable via DI)
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes`

## One-line purpose

Locale-aware number formatting. It uses Vietnamese style (`1.234.567,89`) when `SD_CORE_CONFIGURATION.format.number === '1.234.567,89'`; otherwise it uses ISO style (`1,234,567.89`).

## When to use

- Monetary amounts, quantities, totals, percentages, and numeric statistics.
- Table cells and detail panels that must share SDCoreJS number formatting.
- Custom `<ng-template sdTableCellDef>` cells when the default table number renderer is not enough.
- Services/components that need the same display formatting through DI.
- Anywhere an AI agent would otherwise create a local `FormatNumberPipe`, `AmountPipe`, or call `toLocaleString()` by hand.

## When NOT to use

- Already-formatted strings such as `"1.234,5"`; pass raw numeric values.
- Editable form values where caret position and parsing matter. Use `<sd-input-number>`.
- Appending currency, unit, or `%` by itself; format the number first, then render the label explicitly.
- Backend payload serialization. Keep payloads numeric and format only at the UI/export edge.

## Signature

```ts
transform(value: any, digits?: number): string | null
```

| Param    | Type     | Default | Notes                                                                                                                                   |
| -------- | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `value`  | `any`    | -       | Input must be coercible to number via `+value`. If `NumberUtilities.isNumber(value)` is false, the internal fixed value becomes `null`. |
| `digits` | `number` | `2`     | Number of decimal places. Forwarded to `Number.toFixed(digits)`.                                                                        |

## Standalone import checklist

Every standalone component that uses `| sdFormatNumber` in its template must import `SdFormatNumberPipe`. If the value can be empty, also import `SdViewPipe` and compose `sdFormatNumber` before `sdView`.

```ts
import { Component } from '@angular/core';
import { SdFormatNumberPipe, SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [SdFormatNumberPipe, SdViewPipe],
  template: `
    <span>{{ invoice.total | sdFormatNumber: 0 | sdView }}</span>
    <span>{{ invoice.vatRate | sdFormatNumber: 2 }}%</span>
  `,
})
export class InvoiceTotalComponent {
  invoice = { total: 1250000, vatRate: 8 };
}
```

## Examples

### 1. Currency in a list

```html
<td>{{ row.amount | sdFormatNumber }}</td>
<!-- VN config: 1.234.567,89 -->
<!-- ISO config: 1,234,567.89 -->
```

### 2. Whole number with 0 decimals

```html
<span>{{ stats.userCount | sdFormatNumber : 0 }}</span>
```

### 3. Nullable number display

```html
<span>{{ row.balance | sdFormatNumber : 0 | sdView }}</span>
```

### 4. Custom table cell

When overriding a table number cell, import `SdTableCellDefDirective`, `SdFormatNumberPipe`, and usually `SdViewPipe`. Do not create a local number pipe.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdFormatNumberPipe, SdViewPipe } from '@sdcorejs/angular/pipes';

interface InvoiceRow {
  code: string;
  total: number | null;
}

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdFormatNumberPipe, SdViewPipe],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="total" let-row>
        {{ row.total | sdFormatNumber: 0 | sdView }}
      </ng-template>
    </sd-table>
  `,
})
export class InvoiceListComponent {
  tableOption: SdTableOption<InvoiceRow> = {
    type: 'local',
    items: () => [{ code: 'INV-001', total: null }],
    columns: [
      { field: 'code', title: 'Code', type: 'string' },
      { field: 'total', title: 'Total', type: 'number', align: 'right' },
    ],
  };
}
```

### 5. DI usage

```ts
import { inject } from '@angular/core';
import { SdFormatNumberPipe } from '@sdcorejs/angular/pipes';

export class AmountMapper {
  readonly #formatNumber = inject(SdFormatNumberPipe);

  toView(row: { total?: number | null }) {
    return this.#formatNumber.transform(row.total, 0) ?? '--';
  }
}
```

## Edge cases / null behavior

- `null`, `undefined`, or a non-numeric string can result in `null`/empty output from the underlying number utility. Compose with `sdView` for a visible `--` placeholder.
- `0` is formatted normally and must not be treated as empty.
- Numeric strings such as `"42.5"` are coerced via `+value`.
- Locale selection comes from injected `SD_CORE_CONFIGURATION.format.number`. If the token is not provided, it falls back to ISO formatting.

## Anti-patterns

- Passing already-formatted strings with separators; `+value` will not parse `"1.234,5"` correctly.
- Creating duplicate app pipes such as `VnNumberPipe`, `CurrencyDisplayPipe`, or `AmountPipe`.
- Calling `toLocaleString()` in templates or `SdTableColumn.transform` when `SdFormatNumberPipe` already exists.
- Forgetting `SdFormatNumberPipe` in the `imports` array of a standalone component.
- Rendering nullable numbers directly without `sdView`, leaving a visually blank cell.
- Using `<sd-input type="number">` for money/quantity editing; use `<sd-input-number>`.

## Related

- `SD_CORE_CONFIGURATION` injection token from `@sdcorejs/angular/configurations`.
- `NumberUtilities.toVN` / `NumberUtilities.toISO` - underlying formatters.
- `sdView` - display placeholder for missing numeric values, arrays, and `NaN`.
- `sdFormatDate` / `sdFormatDatetime` - shared date/datetime display pipes.
- `<sd-input-number>` - editable numeric form control.
