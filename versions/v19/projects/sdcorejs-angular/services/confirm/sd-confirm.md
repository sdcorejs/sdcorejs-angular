# SdConfirmService

**Type**: Service (Angular `@Injectable`)
**Class**: `SdConfirmService`
**Provided in**: `'root'`
**Import path**: `@sdcorejs/angular/services/confirm`

## One-line purpose
Opens a Material dialog (`DialogConfirmComponent`) for confirm/input/radio/select/date/datetime prompts and returns a `Promise` that resolves on Accept and rejects on Cancel.

## When to use
- Confirming destructive actions ("Are you sure you want to delete?").
- Asking the user for a short reason/comment before submitting (use `withInput`).
- Picking one of a small number of options inline (use `withRadio`).
- Picking one or more values from a longer list (use `withSelect`).
- Asking for a date alongside a confirmation (use `withDate`).
- Asking for date and time alongside a confirmation (use `withDatetime`).

## Dismissal always settles the promise

Every method settles on every close path. Anything that is not an explicit Accept — the Cancel button, the ESC key, a backdrop click (when `disableBackdropClose: false`), or a programmatic `dialogRef.close()` — **rejects with the string `'CANCEL'`**.

This changed in release 1.7. Previously the result was only inspected via `if (result) { … }`, so any close that did not come from one of the two buttons produced `undefined` and the promise **never settled**: `await` hung forever and the caller's closure (plus everything it captured) stayed pinned for the rest of the session. If you were relying on that hang, you were relying on a leak.

```typescript
try {
  await confirmService.confirm('Delete this record?');
  // accepted
} catch {
  // cancelled, dismissed with ESC, or closed programmatically
}
```

## When NOT to use
- For richer forms — use a dedicated dialog component with `MatDialog.open(...)`.
- For non-blocking notifications — use `SdNotifyService` (toast/snackbar).
- For multi-step flows — use a wizard/stepper, not a confirm dialog.

## Public API

### `confirm(message, option?): Promise<unknown>`
Plain confirm dialog. Resolves with `result.value` on accept, rejects with the string `'CANCEL'` on cancel.

```typescript
confirm(
  message: string,
  option?: {
    title?: string;                  // default: 'Xác nhận'
    yesTitle?: string;               // default: 'Đồng ý'
    noTitle?: string;                // default: 'Hủy bỏ'
    yesButtonColor?: Color;        // default: 'primary'
    noButtonColor?: Color;         // default: 'secondary'
    width?: string;                  // default: '400px'
    disableBackdropClose?: boolean;  // default: true
  }
): Promise<unknown>;
```

### `withInput(message?, option?): Promise<string>`
Confirm dialog with a text input. Resolves with the entered string on accept; rejects with `'CANCEL'` on cancel.

```typescript
withInput(
  message?: string,
  option?: {
    title?: string;                  // default: 'Xác nhận'
    yesTitle?: string;               // default: 'Có'
    noTitle?: string;                // default: 'Không'
    required?: boolean;
    maxlength?: number;              // default: 255
    yesButtonColor?: Color;
    noButtonColor?: Color;
    defaultValue?: string;
    disableBackdropClose?: boolean;  // default: true
  }
): Promise<string>;
```

### `withRadio(message?, option?): Promise<string>`
Confirm dialog with a radio group.

```typescript
withRadio(
  message?: string,
  option?: {
    title?: string;
    yesTitle?: string;               // default: 'Có'
    noTitle?: string;                // default: 'Không'
    required?: boolean;
    yesButtonColor?: Color;
    noButtonColor?: Color;
    defaultValue?: string | number;
    items: any[];                    // required at runtime
    valueField: string;              // key in items used as value (default 'value')
    displayField: string;            // key in items used as label (default 'label')
    display?: 'row' | 'column';      // default: 'row'
    disableBackdropClose?: boolean;  // default: true
  }
): Promise<string>;
```

### `withDate(message?, option?): Promise<string>`
Confirm dialog with a date picker.

```typescript
withDate(
  message?: string,
  option?: {
    title?: string;
    yesTitle?: string;               // default: 'Có'
    noTitle?: string;                // default: 'Không'
    required?: boolean;
    yesButtonColor?: Color;
    noButtonColor?: Color;
    defaultValue?: string | Date;
    placeholder?: string;
    min?: string | Date;
    max?: string | Date;
    disableBackdropClose?: boolean;  // default: true
  }
): Promise<string | Date>;
```

### `withSelect(message?, option?): Promise<string | number | (string | number)[]>`
Confirm dialog with an `sd-select`.

```typescript
withSelect(
  message?: string,
  option?: {
    title?: string;
    yesTitle?: string;               // default: 'Có'
    noTitle?: string;                // default: 'Không'
    required?: boolean;
    yesButtonColor?: Color;
    noButtonColor?: Color;
    defaultValue?: string | number | (string | number)[];
    items: any[];
    valueField: string;              // default: 'value'
    displayField: string;            // default: 'label'
    placeholder?: string;
    multiple?: boolean;
    disableBackdropClose?: boolean;  // default: true
  }
): Promise<string | number | (string | number)[]>;
```

### `withDatetime(message?, option?): Promise<string | Date>`
Confirm dialog with an `sd-datetime` picker.

```typescript
withDatetime(
  message?: string,
  option?: {
    title?: string;
    yesTitle?: string;               // default: 'Có'
    noTitle?: string;                // default: 'Không'
    required?: boolean;
    yesButtonColor?: Color;
    noButtonColor?: Color;
    defaultValue?: string | Date;
    placeholder?: string;
    min?: string | Date;
    max?: string | Date;
    showSeconds?: boolean;
    disableBackdropClose?: boolean;  // default: true
  }
): Promise<string | Date>;
```

## Configuration / DI tokens
None. The service depends on `MatDialog` from `@angular/material/dialog`, so the host app must include Angular Material's animation and dialog modules in its bootstrap (typically already done by the SD shell).

## Behavior notes
- **Default labels are Vietnamese**: "Xác nhận", "Đồng ý", "Hủy bỏ", "Có", "Không". Override with `title` / `yesTitle` / `noTitle`.
- **Backdrop click**: disabled by default (`disableBackdropClose: true`). Pass `false` to allow clicking outside to dismiss.
- **Cancel rejects, not resolves**: every method returns a `Promise` that **rejects** (with the string `'CANCEL'`) when the user cancels — wrap calls in `try/catch` (or `.then(...).catch(...)`).
- **Width**: only `confirm()` exposes `width`. The other variants are fixed at `'400px'`.
- **`Color`** comes from `@sdcorejs/utils/models` (theme color tokens like `'primary'`, `'secondary'`, etc.).

## Examples

### 1. Plain delete confirmation
```typescript
import { SdConfirmService } from '@sdcorejs/angular/services/confirm';
import { inject } from '@angular/core';

const confirmSvc = inject(SdConfirmService);

try {
  await confirmSvc.confirm('Delete this record?', {
    title: 'Delete',
    yesTitle: 'Delete',
    yesButtonColor: 'warn',
  });
  await api.delete('/api/records/' + id);
} catch {
  // user clicked Cancel
}
```

### 2. Ask a reason before rejecting
```typescript
try {
  const reason = await confirmSvc.withInput('Reason for rejection', {
    title: 'Reject',
    required: true,
    maxlength: 500,
  });
  await api.post('/api/orders/reject', { id, reason });
} catch { /* canceled */ }
```

### 3. Pick one of several reasons
```typescript
const choice = await confirmSvc.withRadio('Select a reason', {
  items: [
    { value: 'PRICE',   label: 'Wrong price' },
    { value: 'STOCK',   label: 'Out of stock' },
    { value: 'OTHER',   label: 'Other' },
  ],
  valueField: 'value',
  displayField: 'label',
  required: true,
  display: 'column',
});
```

### 4. Pick a department
```typescript
const department = await confirmSvc.withSelect('Select department', {
  items: [
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'Human Resources' },
  ],
  valueField: 'value',
  displayField: 'label',
  required: true,
});
```

### 5. Pick a target date
```typescript
const dateIso = await confirmSvc.withDate('Schedule for', {
  title: 'Schedule',
  required: true,
  placeholder: 'dd/MM/yyyy',
});
```

### 6. Pick a target date and time
```typescript
const scheduledAt = await confirmSvc.withDatetime('Schedule at', {
  title: 'Schedule',
  required: true,
  placeholder: 'dd/MM/yyyy HH:mm',
});
```

## Testing

### In unit / integration tests

`SdConfirmService` delegates to `MatDialog.open(DialogConfirmComponent, ...)` and wraps `afterClosed()` in a `Promise`. No real component or DOM is needed — replace `MatDialog` with a spy:

```typescript
import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { SdConfirmService } from './confirm.service';

describe('SdConfirmService', () => {
  let service: SdConfirmService;
  let dialogOpenSpy: jasmine.Spy;
  let afterClosed$: Subject<any>;

  beforeEach(() => {
    afterClosed$ = new Subject();
    const fakeRef: Partial<MatDialogRef<any>> = {
      afterClosed: () => afterClosed$.asObservable(),
      close: jasmine.createSpy('close'),
    };
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(fakeRef as MatDialogRef<any>);
    dialogOpenSpy = dialogSpy.open;

    TestBed.configureTestingModule({
      providers: [{ provide: MatDialog, useValue: dialogSpy }],
    });
    service = TestBed.inject(SdConfirmService);
  });
});
```

Key points:
- **No `NoopAnimationsModule` needed** — `MatDialog` is fully mocked; no real dialog is opened.
- **`afterClosed$` subject** drives promise resolution: emit `{ action: 'ACCEPT', value: x }` to resolve, `{ action: 'CANCEL', value: null }` to reject.
- Test `Promise` outcomes with Jasmine's `expectAsync(...).toBeResolvedTo(...)` / `toBeRejectedWith('CANCEL')`.
- No `fakeAsync` / `tick` required — `Subject.next()` is synchronous.

### Spec file
`projects/sdcorejs-angular/services/confirm/src/lib/confirm.service.spec.ts`

Covers (15 specs total):
- Instantiation: service created
- `confirm()`: opens `MatDialog`; default title "Xác nhận"; custom title/yesTitle/noTitle; resolves on ACCEPT; rejects with `'CANCEL'` on CANCEL; custom width; `disableClose` defaults to `true`
- `withInput()`: opens dialog with `input` data + default `maxlength: 255`; resolves with entered value; rejects with `'CANCEL'`
- `withRadio()`: opens dialog with `radio` data + default `display: 'row'`; resolves with selected value
- `withSelect()`: opens dialog with `select` data; resolves with selected value
- `withDate()`: opens dialog with `date` data; resolves with selected date
- `withDatetime()`: opens dialog with `datetime` data; resolves with selected date/time

## Anti-patterns
- Do NOT use `await confirmSvc.confirm(...)` without a `try/catch` — Cancel is a rejection, not a resolved `false`.
- Do NOT pass UI-bound objects in `items` for `withRadio`/`withSelect` — only primitive value/display fields are read.
- Do NOT inject `MatDialog` separately to open `DialogConfirmComponent` directly — that component is internal; use the service.
- Do NOT use this for long-running async work inside the dialog — the dialog closes synchronously on user action.

## Related
- `SdNotifyService` (`@sdcorejs/angular/services/notify`) — for non-blocking confirmations / toasts.
- `MatDialog` (`@angular/material/dialog`) — underlying dialog driver.
- `Color` (`@sdcorejs/utils/models`) — color token type for the buttons.
