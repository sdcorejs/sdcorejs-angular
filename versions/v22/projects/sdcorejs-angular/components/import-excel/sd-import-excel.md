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
- Pair with a `<sd-button>` toolbar action labeled "Nhập Excel" / "Import"

## When NOT to use
- For arbitrary CSV / TSV files → build a custom uploader using `SdExcelService` directly
- For very large files (> a few thousand rows) → server-side import job with progress tracking
- For free-form file uploads (PDF, images) → use a generic file uploader / `<sd-input type="file">`
- For data exports only → use `SdExcelService.export()` directly without this UI

## Inputs
| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `option` | `SdImportExcelOption<T>` | — | **Required.** Drives columns, validation, accept handler, optional template sheets, etc. See type below. |

### `SdImportExcelOption<T>` (key fields)
```ts
interface SdImportExcelOption<T = any> {
  columns: SdUploadExcelColumn<T>[];                      // schema + per-cell validation
  accept: (items: T[], args: { file: File })              // called when user clicks "Xác nhận & Lưu"
    => SdImportExcelValidation[] | Promise<...>;
  title?: string;                                         // modal title; default "Nhập dữ liệu Excel"
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
- `open()` — resets state and shows the modal.
- `close()` — closes the modal.
- `upload()` — programmatically triggers the file picker (also wired to the "Chọn tệp Excel" and "Đổi tệp" buttons).
- `accept()` — invokes `option.accept` with current valid rows and the source `File`.
- `setValidation(validations: SdImportExcelValidation[])` — apply server-side validation results back onto rows (for delayed/asynchronous re-validation).
- `view('ALL' | 'SUCCESS' | 'WARNING' | 'ERROR')` — filter the preview table.
- `downloadTemplate()` — generates and downloads the Excel template based on `columns` (and `sheets`).
- `export()` — downloads the current filtered rows as Excel with a "Thông báo" column containing the error/warning message.

## Content projection
None — UI is fully driven by `option`. The component already wraps its own `<sd-modal>`.

## Visual cues
- Before a file is read, a compact `sd-data-state` introduces the Excel template and row limit. "Chọn tệp Excel" opens the picker; the separate "Tải mẫu" button downloads the template. No empty grid or paginator is rendered.
- After reading, the filename and row count appear above labelled All / Valid / Warnings / Errors filters. The active filter has a visible selected style and `aria-pressed`.
- The preview retains sticky headers, row index badges, field formatting and validation highlights. Each row's expandable status lists all error and warning messages, including cross-row validation. Native details/summary supports touch and keyboard.
- A filter with no matching rows shows a separate empty state and "Xem tất cả" action; it does not ask the user to upload again.
- Pagination uses 10 rows per page with previous/next controls. The initial view is computed before the paginator is created.
- The footer explains how many erroneous rows must be fixed. Warning-only rows remain importable. After submitting, the UI says data was submitted for processing, without claiming the caller's asynchronous operation succeeded.
- On narrow screens filters use two columns, controls wrap, and only the preview grid scrolls horizontally. The initial guidance stays outside that scroll area. This is local Import Excel layout; shared modal/drawer styling is unchanged.

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
  columns: [
    { field: 'unitCode', title: 'Mã đơn vị', type: 'values', values: ['PCS', 'BOX'], required: true },
    { field: 'quantity', title: 'Số lượng', type: 'number', min: 1 },
  ],
  accept: async (items) => this.api.importUnits(items),
  sheets: [
    { name: 'Đơn vị', items: () => this.api.getUnits(), headers: [
      { value: 'code', display: 'Mã' }, { value: 'name', display: 'Tên' },
    ]},
  ],
};
```

### 4. With pre-validation transform (e.g. trim & uppercase)
```ts
option: SdImportExcelOption = {
  columns: [
    { field: 'code', title: 'Mã', type: 'string', required: true },
    { field: 'name', title: 'Tên', type: 'string', required: true },
  ],
  transform: items => items.map(i => ({ ...i, data: { ...i.data, code: i.data.code?.trim().toUpperCase() } })),
  accept: async (items) => this.api.importItems(items),
};
```

## Anti-patterns
- DON'T forget `accept` returning validation errors — if the server rejects rows, return them so users can fix and resubmit
- DON'T set `limit` to a huge value (>10k) — browser will struggle; do server-side import with progress instead
- DON'T mix display and validation logic in `transform` — keep `transform` pure mapping; put validation in `validateItem` / `validateItems`
- DON'T re-`open()` while the modal is already open — call `close()` first
- DON'T forget `(sdClosed)` to refresh the parent list after a successful import
- DON'T use `type: 'date'` without a `format` — date validation only runs when format is supplied

## Related
- `<sd-modal>` — wrapped internally; do not nest manually
- `<sd-button>` — used for toolbar buttons and footer actions
- `<sd-badge>` — used for row-status pills
- `SdExcelService` — the underlying upload/template/export engine
