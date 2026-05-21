# `<sd-import-excel>`

**Type**: Component
**Selector**: `sd-import-excel`
**Import path**: `@sdcorejs/angular/components/import-excel` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdImportExcel`
**Standalone**: yes
**Change detection**: default

## One-line purpose
End-to-end Excel import workflow: download template, upload `.xlsx`, validate per row + cross-row, preview success/warning/error rows, export an annotated error file, and finally hand validated data back to the caller via `accept`.

## When to use
- Bulk-create entities from spreadsheets (customers, products, employees, GLs, etc.)
- Bulk-update master data with a known schema
- Any time the business team prefers an Excel UI over individual forms
- Pair with a `<sd-button>` toolbar action labeled "Nháº­p Excel" / "Import"

## When NOT to use
- For arbitrary CSV / TSV files â†’ build a custom uploader using `SdExcelService` directly
- For very large files (> a few thousand rows) â†’ server-side import job with progress tracking
- For free-form file uploads (PDF, images) â†’ use a generic file uploader / `<sd-input type="file">`
- For data exports only â†’ use `SdExcelService.export()` directly without this UI

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdImportExcelOption<T>` | â€” | **Required.** Drives columns, validation, accept handler, optional template sheets, etc. See type below. |

### `SdImportExcelOption<T>` (key fields)
```ts
interface SdImportExcelOption<T = any> {
  columns: SdUploadExcelColumn<T>[];                      // schema + per-cell validation
  accept: (items: T[], args: { file: File })              // called when user clicks "XÃ¡c nháº­n & LÆ°u"
    => SdImportExcelValidation[] | Promise<...>;
  title?: string;                                         // modal title; default "Nháº­p dá»¯ liá»‡u Excel"
  fileName?: string;                                      // template filename; default "Template"
  limit?: number;                                         // max rows; default 1000
  sheets?: SdImportExcelSheet[];                          // extra reference sheets for the template
  transform?: (items) => items | Promise<items>;          // map rows BEFORE validation
  validateItem?: (item, idx, all) => SdImportExcelValidation | Promise<...>;
  validateItems?: (items) => SdImportExcelValidation[] | Promise<...>; // cross-row pass
}
```

Column types: `'string' | 'number' | 'bool' | 'date' | 'time' | 'datetime' | 'values' | 'radio' | 'array'`. Each subtype has its own constraints (`min`, `max`, `minlength`, `maxlength`, `format`, `values`, `defaultValue`, `divideString`, ...).

## Outputs
| Name | Type | Notes |
| --- | --- | --- |
| `sdClosed` | `void` | Fires when the underlying `<sd-modal>` finishes closing. Use to refresh parent list. |

## Public methods
- `open()` â€” resets state and shows the modal.
- `close()` â€” closes the modal.
- `upload()` â€” programmatically triggers the file picker (also wired to the "Táº£i lÃªn" footer button).
- `accept()` â€” invokes `option.accept` with current valid rows and the source `File`.
- `setValidation(validations: SdImportExcelValidation[])` â€” apply server-side validation results back onto rows (for delayed/asynchronous re-validation).
- `view('ALL' | 'SUCCESS' | 'WARNING' | 'ERROR')` â€” filter the preview table.
- `downloadTemplate()` â€” generates and downloads the Excel template based on `columns` (and `sheets`).
- `export()` â€” downloads the current filtered rows as Excel with a "ThÃ´ng bÃ¡o" column containing the error/warning message.

## Content projection
None â€” UI is fully driven by `option`. The component already wraps its own `<sd-modal>`.

## Visual cues
- A modal titled "Nháº­p dá»¯ liá»‡u Excel" (or `option.title`)
- Top toolbar: 4 small buttons â€” "Xem táº¥t cáº£" (refresh icon), success count (green), warning count (yellow), error count (red); each clickable to filter
- Body: striped/bordered HTML table; first column is a sticky `#` row index showing an `<sd-badge>` whose color reflects row state, second column is the validation message ("Dá»¯ liá»‡u há»£p lá»‡" in green, or red error HTML), then one column per `option.columns[]`
- Cells are tinted yellow (warning) or red (error) when that field has an issue, with the message in a tooltip
- Empty state: a centered cloud-download icon + "ChÆ°a cÃ³ dá»¯ liá»‡u táº£i lÃªn â€” Nháº¥n vÃ o Ä‘Ã¢y Ä‘á»ƒ táº£i tá»‡p máº«u" â€” clicking generates the template file
- Footer-left: "Táº£i lÃªn" (file_upload icon, info color) â€” opens file picker
- Footer-right: "Táº£i vá»" (export of current rows) + "XÃ¡c nháº­n & LÆ°u" (primary, disabled until at least one valid row and zero errors)
- Pagination at the bottom (no page-size selector, with first/last buttons)

## Examples

### 1. Basic customer import
```ts
option: SdImportExcelOption<Customer> = {
  title: 'Nháº­p danh sÃ¡ch khÃ¡ch hÃ ng',
  fileName: 'Mau_Khach_Hang',
  limit: 2000,
  columns: [
    { field: 'code', title: 'MÃ£ KH', type: 'string', required: true, maxlength: 20 },
    { field: 'name', title: 'TÃªn KH', type: 'string', required: true, maxlength: 200 },
    { field: 'phone', title: 'SÄT', type: 'string', required: false, pattern: '^\\d{10,11}$' },
    { field: 'birthday', title: 'NgÃ y sinh', type: 'date', format: 'dd/MM/yyyy' },
    { field: 'tier', title: 'Háº¡ng', type: 'values', values: ['SILVER', 'GOLD', 'VIP'], checkValueInArray: true },
  ],
  validateItems: async (items) => this.api.checkDuplicates(items),
  accept: async (items, { file }) => {
    const res = await this.api.bulkCreate(items, file);
    return res.errors;
  },
};
```
```html
<sd-button title="Nháº­p Excel" prefixIcon="upload_file" type="outline" (click)="importer.open()"></sd-button>
<sd-import-excel #importer [option]="option" (sdClosed)="reload()"></sd-import-excel>
```

### 2. Async server-side validation after submit
```ts
async onAccept() {
  const errors = await this.api.bulkCreate(this.items, this.file);
  if (errors.length) this.importer.setValidation(errors); // shows red rows again
  else this.importer.close();
}
```

### 3. With reference sheets in template
```ts
option: SdImportExcelOption = {
  columns: [...],
  accept: ...,
  sheets: [
    { name: 'ÄÆ¡n vá»‹', items: () => this.api.getUnits(), headers: [
      { value: 'code', display: 'MÃ£' }, { value: 'name', display: 'TÃªn' },
    ]},
  ],
};
```

### 4. With pre-validation transform (e.g. trim & uppercase)
```ts
option: SdImportExcelOption = {
  columns: [...],
  transform: items => items.map(i => ({ ...i, data: { ...i.data, code: i.data.code?.trim().toUpperCase() } })),
  accept: ...,
};
```

## Anti-patterns
- DON'T forget `accept` returning validation errors â€” if the server rejects rows, return them so users can fix and resubmit
- DON'T set `limit` to a huge value (>10k) â€” browser will struggle; do server-side import with progress instead
- DON'T mix display and validation logic in `transform` â€” keep `transform` pure mapping; put validation in `validateItem` / `validateItems`
- DON'T re-`open()` while the modal is already open â€” call `close()` first
- DON'T forget `(sdClosed)` to refresh the parent list after a successful import
- DON'T use `type: 'date'` without a `format` â€” date validation only runs when format is supplied

## Related
- `<sd-modal>` â€” wrapped internally; do not nest manually
- `<sd-button>` â€” used for toolbar buttons and footer actions
- `<sd-badge>` â€” used for row-status pills
- `SdExcelService` â€” the underlying upload/template/export engine

