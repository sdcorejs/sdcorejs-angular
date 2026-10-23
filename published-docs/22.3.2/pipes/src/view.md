# `sdView` pipe (`| sdView`)

**Type**: Pipe
**Pure**: yes (default)
**Class**: `SdViewPipe`
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes`

## One-line purpose

Display fallback pipe extracted from `<sd-view>` behavior. It converts empty display values to `--` and joins arrays with `, ` so table cells and detail pages render consistently.

## When to use

- Nullable values in table cells, detail views, read-only summaries, and export-preview UI.
- After formatting pipes such as `sdFormatNumber`, `sdFormatDate`, and `sdFormatDatetime`.
- Arrays of primitive display values that should show as `A, B, C`.
- Any place an AI agent would otherwise write `value ?? '--'` in the template.

## When NOT to use

- Editable form controls. Keep placeholders and validators inside the form component.
- Complex object arrays. Map objects to display strings first, then pipe the resulting string array.
- Business logic. `sdView` is only a display helper.

## Signature

```ts
transform(value: unknown): string
```

| Input                       | Output         |
| --------------------------- | -------------- |
| `null` / `undefined` / `''` | `--`           |
| `NaN`                       | `--`           |
| `[]`                        | `--`           |
| `['A', 'B', 'C']`           | `A, B, C`      |
| `['A', null, NaN, 'B']`     | `A, --, --, B` |
| `0`                         | `0`            |
| `false`                     | `false`        |

## Standalone import checklist

Every standalone component that uses `| sdView` in its template must import `SdViewPipe`.

```ts
import { Component } from '@angular/core';
import { SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [SdViewPipe],
  template: `
    <span>{{ customer.phone | sdView }}</span>
    <span>{{ tagNames | sdView }}</span>
  `,
})
export class CustomerSummaryComponent {
  customer = { phone: null };
  tagNames = ['VIP', 'Overdue'];
}
```

## Compose with format pipes

Format first, then apply `sdView`.

```ts
import { Component } from '@angular/core';
import { SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe, SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [SdFormatNumberPipe, SdFormatDatePipe, SdFormatDatetimePipe, SdViewPipe],
  template: `
    <span>{{ order.total | sdFormatNumber: 0 | sdView }}</span>
    <span>{{ order.issueDate | sdFormatDate | sdView }}</span>
    <span>{{ order.updatedAt | sdFormatDatetime: 'dd/MM/yyyy HH:mm' | sdView }}</span>
  `,
})
export class OrderSummaryComponent {
  order = {
    total: 1200000,
    issueDate: '2026-06-26',
    updatedAt: null,
  };
}
```

## Table cell example

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdFormatNumberPipe, SdViewPipe } from '@sdcorejs/angular/pipes';

interface Row {
  code: string;
  tags: string[];
  amount: number | null;
}

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdFormatNumberPipe, SdViewPipe],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="tags" let-row>
        {{ row.tags | sdView }}
      </ng-template>

      <ng-template sdTableCellDef="amount" let-row>
        {{ row.amount | sdFormatNumber: 0 | sdView }}
      </ng-template>
    </sd-table>
  `,
})
export class ListComponent {
  tableOption: SdTableOption<Row> = {
    type: 'local',
    items: () => [{ code: 'A001', tags: ['VIP', 'New'], amount: null }],
    columns: [
      { field: 'code', title: 'Code', type: 'string' },
      { field: 'tags', title: 'Tags', type: 'string' },
      { field: 'amount', title: 'Amount', type: 'number', align: 'right' },
    ],
  };
}
```

## Anti-patterns

- Writing `{{ value || '--' }}` because it hides valid values such as `0` or `false`.
- Creating a duplicate `ViewPipe`, `DisplayPipe`, or `FallbackPipe` in the app.
- Passing object arrays directly and accepting `[object Object]`; map to strings first.
- Forgetting `SdViewPipe` in `imports` of standalone components.

## Related

- `<sd-view>` - the read-only label/value component that uses this pipe internally.
- `sdEmpty` - legacy/simple empty-value fallback; does not handle arrays or `NaN`.
- `sdFormatNumber`, `sdFormatDate`, `sdFormatDatetime` - common pipes to compose before `sdView`.
