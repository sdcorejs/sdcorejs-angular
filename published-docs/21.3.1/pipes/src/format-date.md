# `sdFormatDate` pipe (`| sdFormatDate`)

**Type**: Pipe
**Pure**: yes (default)
**Class**: `SdFormatDatePipe` (also `@Injectable({ providedIn: 'root' })` - usable via DI)
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes`

## One-line purpose

Display-safe date formatting for templates, table cells, detail views, and exports. Default output format is `dd/MM/yyyy`.

## When to use

- Date-only values such as birthday, effective date, issue date, due date, created date without time.
- Custom `<ng-template sdTableCellDef>` cells where the built-in table date column is not enough.
- Detail pages using `<sd-view>` or plain interpolation.
- Services that need the same date formatting as the UI, by injecting `SdFormatDatePipe`.

## When NOT to use

- Datetime values where time must be visible - use `sdFormatDatetime`.
- Editable date inputs - use `<sd-date>`.
- Backend payload serialization - keep payloads as ISO strings/Date values and format only at the UI edge.
- A custom one-off pipe that duplicates `DateUtilities.toFormat`; use this pipe instead.

## Signature

```ts
transform(value: unknown, format?: string): string | null
```

| Param    | Type      | Default        | Notes                                                                       |
| -------- | --------- | -------------- | --------------------------------------------------------------------------- |
| `value`  | `unknown` | -              | Date, ISO string, timestamp, or value accepted by `DateUtilities.toFormat`. |
| `format` | `string`  | `'dd/MM/yyyy'` | `date-fns` style format string.                                             |

Invalid or empty values return `null`; compose with `sdView` when the UI must show `--`.

## Standalone import checklist

Every standalone component that uses `| sdFormatDate` in its template must import `SdFormatDatePipe`.

```ts
import { Component } from '@angular/core';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdFormatDatePipe, SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [SdView, SdFormatDatePipe, SdViewPipe],
  template: `
    <sd-view label="Issue date" [display]="invoice.issueDate | sdFormatDate"></sd-view>
    <span>{{ invoice.dueDate | sdFormatDate: 'dd/MM/yyyy' | sdView }}</span>
  `,
})
export class InvoiceSummaryComponent {
  invoice = { issueDate: '2026-06-26', dueDate: null };
}
```

## Table cell example

When overriding a table date cell, import both `SdTableCellDefDirective` and the pipe.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdFormatDatePipe, SdViewPipe } from '@sdcorejs/angular/pipes';

interface Contract {
  id: number;
  code: string;
  signedDate: string | null;
}

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdFormatDatePipe, SdViewPipe],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="signedDate" let-row>
        {{ row.signedDate | sdFormatDate | sdView }}
      </ng-template>
    </sd-table>
  `,
})
export class ContractListComponent {
  tableOption: SdTableOption<Contract> = {
    type: 'local',
    items: () => [{ id: 1, code: 'HD-001', signedDate: '2026-06-26' }],
    columns: [
      { field: 'code', title: 'Code', type: 'string' },
      { field: 'signedDate', title: 'Signed date', type: 'date' },
    ],
  };
}
```

## DI example

Use DI when a service or component method needs to produce the same display string as templates.

```ts
import { inject } from '@angular/core';
import { SdFormatDatePipe } from '@sdcorejs/angular/pipes';

export class ExportMapper {
  readonly #formatDate = inject(SdFormatDatePipe);

  toRow(row: { signedDate?: string | null }) {
    return {
      signedDate: this.#formatDate.transform(row.signedDate) ?? '--',
    };
  }
}
```

## Anti-patterns

- Creating `FormatDatePipe` again in the app. Use `SdFormatDatePipe`.
- Using Angular's built-in `date` pipe in SDCoreJS tables when the project should share one formatting convention.
- Forgetting `SdFormatDatePipe` in `imports` of a standalone component.
- Rendering nullable dates directly without `sdView`, which leaves the cell visually blank.

## Related

- `sdFormatDatetime` - date + time formatting.
- `sdView` - `--` fallback for `null`, `undefined`, empty string, `NaN`, and empty arrays.
- `<sd-date>` - editable date form control.
