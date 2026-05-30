�# `<sd-import-excel>`

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
- Pair with a `<sd-button>` toolbar action labeled "Nhập Excel" / "Import"

## When NOT to use
- For arbitrary CSV / TSV files �  build a custom uploader using `SdExcelService` directly
- For very large files (> a few thousand rows) �  server-side import job with progress tracking
- For free-form file uploads (PDF, images) �  use a generic file uploader / `<sd-input type="file">`
- For data exports only �  use `SdExcelService.export()` directly without this UI

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdImportExcelOption<T>` | � | **Required.** Drives columns, validation, accept handler, optional template sheets, etc. See type below. |

### `SdImportExcelOption<T>` (key fields)
```ts
interface SdImportExcelOption<T = any> {
  columns: SdUploadExcelColumn<T>[];                      // schema + per-cell validation
  accept: (items: T[], args: { file: File })              // called when user clicks "Xác nhận & Lưu"
    => SdImportExcelValidation[] | Promise<...>;
  title?: string;                                         // modal title; default "Nhập dữ li�!u Excel"
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
- `open()` � resets state and shows the modal.
- `close()` � closes the modal.
- `upload()` � programmatically triggers the file picker (also wired to the "Tải lên" footer button).
- `accept()` � invokes `option.accept` with current valid rows and the source `File`.
- `setValidation(validations: SdImportExcelValidation[])` � apply server-side validation results back onto rows (for delayed/asynchronous re-validation).
- `view('ALL' | 'SUCCESS' | 'WARNING' | 'ERROR')` � filter the preview table.
- `downloadTemplate()` � generates and downloads the Excel template based on `columns` (and `sheets`).
- `export()` � downloads the current filtered rows as Excel with a "Thông báo" column containing the error/warning message.

## Content projection
None � UI is fully driven by `option`. The component already wraps its own `<sd-modal>`.

## Visual cues
- A modal titled "Nhập dữ li�!u Excel" (or `option.title`)
- Top toolbar: 4 small buttons � "Xem tất cả" (refresh icon), success count (green), warning count (yellow), error count (red); each clickable to filter
- Body: striped/bordered HTML table; first column is a sticky `#` row index showing an `<sd-badge>` whose color reflects row state, second column is the validation message ("Dữ li�!u hợp l�!" in green, or red error HTML), then one column per `option.columns[]`
- Cells are tinted yellow (warning) or red (error) when that field has an issue, with the message in a tooltip
- Empty state: a centered cloud-download icon + "Chưa có dữ li�!u tải lên � Nhấn vào �ây �Ồ tải t�!p mẫu" � clicking generates the template file
- Footer-left: "Tải lên" (file_upload icon, info color) � opens file picker
- Footer-right: "Tải về" (export of current rows) + "Xác nhận & Lưu" (primary, disabled until at least one valid row and zero errors)
- Pagination at the bottom (no page-size selector, with first/last buttons)

## Examples

### 1. Basic customer import
```ts
option: SdImportExcelOption<Customer> = {
  title: 'Nhập danh sách khách hàng',
  fileName: 'Mau_Khach_Hang',
  limit: 2000,
  columns: [
    { field: 'code', title: 'Mã KH', type: 'string', required: true, maxlength: 20 },
    { field: 'name', title: 'Tên KH', type: 'string', required: true, maxlength: 200 },
    { field: 'phone', title: 'SĐT', type: 'string', required: false, pattern: '^\\d{10,11}$' },
    { field: 'birthday', title: 'Ngày sinh', type: 'date', format: 'dd/MM/yyyy' },
    { field: 'tier', title: 'Hạng', type: 'values', values: ['SILVER', 'GOLD', 'VIP'], checkValueInArray: true },
  ],
  validateItems: async (items) => this.api.checkDuplicates(items),
  accept: async (items, { file }) => {
    const res = await this.api.bulkCreate(items, file);
    return res.errors;
  },
};
```
```html
<sd-button title="Nhập Excel" prefixIcon="upload_file" type="outline" (click)="importer.open()"></sd-button>
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
    { name: 'Đơn v�9', items: () => this.api.getUnits(), headers: [
      { value: 'code', display: 'Mã' }, { value: 'name', display: 'Tên' },
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
- DON'T forget `accept` returning validation errors � if the server rejects rows, return them so users can fix and resubmit
- DON'T set `limit` to a huge value (>10k) � browser will struggle; do server-side import with progress instead
- DON'T mix display and validation logic in `transform` � keep `transform` pure mapping; put validation in `validateItem` / `validateItems`
- DON'T re-`open()` while the modal is already open � call `close()` first
- DON'T forget `(sdClosed)` to refresh the parent list after a successful import
- DON'T use `type: 'date'` without a `format` � date validation only runs when format is supplied

## Related
- `<sd-modal>` � wrapped internally; do not nest manually
- `<sd-button>` � used for toolbar buttons and footer actions
- `<sd-badge>` � used for row-status pills
- `SdExcelService` � the underlying upload/template/export engine

