# `sdFormatDatetime` pipe (`| sdFormatDatetime`)

**Type**: Pipe
**Pure**: yes (default)
**Class**: `SdFormatDatetimePipe` (also `@Injectable({ providedIn: 'root' })` - usable via DI)
**Standalone**: yes
**Import path**: `@sdcorejs/angular/pipes`

## One-line purpose

Display-safe datetime formatting for UI templates, table cells, detail pages, audit logs, and exports. Default output format is `dd/MM/yyyy HH:mm:ss`.

## When to use

- Created/updated timestamps.
- Approval, submission, sign-in, sync, import/export timestamps.
- Custom `<ng-template sdTableCellDef>` cells where the table's default datetime rendering is not enough.
- DI usage in services that map export rows or activity history.

## When NOT to use

- Date-only values where showing time would be noisy - use `sdFormatDate`.
- Editable datetime fields - use `<sd-datetime>`.
- Backend payload serialization - format only for display/export.
- A custom datetime pipe in the application; use this shared pipe instead.

## Signature

```ts
transform(value: unknown, format?: string): string | null
```

| Param    | Type      | Default                 | Notes                                                                       |
| -------- | --------- | ----------------------- | --------------------------------------------------------------------------- |
| `value`  | `unknown` | -                       | Date, ISO string, timestamp, or value accepted by `DateUtilities.toFormat`. |
| `format` | `string`  | `'dd/MM/yyyy HH:mm:ss'` | `date-fns` style format string.                                             |

Invalid or empty values return `null`; compose with `sdView` when the UI must show `--`.

## Standalone import checklist

Every standalone component that uses `| sdFormatDatetime` in its template must import `SdFormatDatetimePipe`.

```ts
import { Component } from '@angular/core';
import { SdView } from '@sdcorejs/angular/components/view';
import { SdFormatDatetimePipe, SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [SdView, SdFormatDatetimePipe, SdViewPipe],
  template: `
    <sd-view label="Updated at" [display]="record.updatedAt | sdFormatDatetime"></sd-view>
    <span>{{ record.approvedAt | sdFormatDatetime: 'dd/MM/yyyy HH:mm' | sdView }}</span>
  `,
})
export class AuditSummaryComponent {
  record = { updatedAt: '2026-06-26T10:15:30+07:00', approvedAt: null };
}
```

## Table cell example

When overriding a table datetime cell, import `SdTableCellDefDirective`, `SdFormatDatetimePipe`, and usually `SdViewPipe`.

```ts
import { Component } from '@angular/core';
import { SdTable, SdTableCellDefDirective, SdTableOption } from '@sdcorejs/angular/components/table';
import { SdFormatDatetimePipe, SdViewPipe } from '@sdcorejs/angular/pipes';

interface ImportJob {
  id: number;
  fileName: string;
  finishedAt: string | null;
}

@Component({
  standalone: true,
  imports: [SdTable, SdTableCellDefDirective, SdFormatDatetimePipe, SdViewPipe],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="finishedAt" let-row>
        {{ row.finishedAt | sdFormatDatetime: 'dd/MM/yyyy HH:mm' | sdView }}
      </ng-template>
    </sd-table>
  `,
})
export class ImportJobListComponent {
  tableOption: SdTableOption<ImportJob> = {
    type: 'local',
    items: () => [{ id: 1, fileName: 'employees.xlsx', finishedAt: null }],
    columns: [
      { field: 'fileName', title: 'File', type: 'string' },
      { field: 'finishedAt', title: 'Finished at', type: 'datetime' },
    ],
  };
}
```

## DI example

```ts
import { inject } from '@angular/core';
import { SdFormatDatetimePipe } from '@sdcorejs/angular/pipes';

export class ActivityMapper {
  readonly #formatDatetime = inject(SdFormatDatetimePipe);

  toView(row: { createdAt?: string | null }) {
    return this.#formatDatetime.transform(row.createdAt, 'dd/MM/yyyy HH:mm') ?? '--';
  }
}
```

## Anti-patterns

- Creating a local `FormatDatetimePipe` in the app.
- Calling `new Date(...).toLocaleString(...)` in templates or table transforms.
- Forgetting `SdFormatDatetimePipe` in standalone `imports`.
- Showing nullable timestamps without `sdView` or an explicit fallback.

## Related

- `sdFormatDate` - date-only formatting.
- `sdView` - display fallback and array join pipe.
- `<sd-datetime>` - editable datetime form control.
