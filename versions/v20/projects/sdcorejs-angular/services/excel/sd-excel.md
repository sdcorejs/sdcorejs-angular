�# SdExcelService

**Type**: Service (Angular `@Injectable`)
**Class**: `SdExcelService`
**Provided in**: `'root'`
**Import path**: `@sdcorejs/angular/services/excel`

## One-line purpose
Browser-side Excel/CSV utilities � generate a styled `.xlsx` import-template, export tabular data to `.xlsx` or `.csv`, and parse a user-uploaded `.xlsx` back to plain JS objects.

## When to use
- Producing an "Import template" file with column headers, descriptions, required/highlight styling, and ancillary lookup sheets.
- Exporting a grid/table to `.xlsx` with the same styled header layout.
- Exporting to `.csv` (UTF-8 with BOM) for spreadsheet-friendly downloads.
- Parsing a user-uploaded `.xlsx` (selected via file picker) into `Record<string, any>[]` keyed by the first row's header values.

## When NOT to use
- For server-generated reports � use a backend Excel pipeline; the service runs entirely in the browser via `exceljs`.
- For huge files (>~50k rows) � `exceljs` + the deep-clone-style writes here are memory-heavy.
- For non-tabular workbooks (charts, pivot tables, complex formulas) � the service writes plain values only.

## Public API

### `generateTemplate(template): Promise<void>`
Builds an `.xlsx` import template with a `template` sheet (row 1 = `field` codes, row 2 = `title`s, optional row 3 = `description`s) plus optional lookup sheets, then triggers a browser download.

```typescript
generateTemplate(template: SdExcelTemplate): Promise<void>;

interface SdExcelTemplate {
  fileName?: string;
  columns: SdExcelTemplateColumn[];
  sheets?: SdExcelSheet[];
}

interface SdExcelColumn {
  field: string;       // required � used as header row 1 (technical key)
  title: string;       // required � used as header row 2 (display label)
  description?: string;
  width?: string;      // e.g. '120px' (converted to ~width/7 chars; falls back to 20)
}

interface SdExcelTemplateColumn extends SdExcelColumn {
  required?: boolean;  // styles the field cell red+italic
  color?: string;
  fontColor?: string;  // ARGB hex string (no '#'), applied to title font
  fill?: string;       // ARGB hex string (no '#'), applied to title fill
}

interface SdExcelSheet<T = any> {
  name: string;
  items: T[];
  headers: { value: Extract<keyof T, string>; display: string }[];
}
```

**Throws**: `'Excel template columns must be an array'`, `'Column N: Field is required'`, `'Column N: Title is required'`.

### `export(option): Promise<void>`
Exports tabular data as `.xlsx`. Same column header layout as `generateTemplate`; data rows are appended starting at row 3 (or 4 if any column has `description`).

```typescript
export(option: SdExcelExportOption): Promise<void>;

interface SdExcelExportOption<T = any> {
  columns: SdExcelTemplateColumn[];
  items: T[];
  fileName?: string;
  sheets?: SdExcelSheet[];
}
```

**Numeric handling**: cell values that are JS `number` are written with `numFmt = '#'`.

**Throws**: `'Column N: Field is required'`, `'Column N: Title is required'` (same validation as `generateTemplate`).

### `exportCSV(option): Promise<void>`
Exports as CSV (UTF-8 with BOM, `,` separator, `"` quote, RFC 4180-style escaping, CRLF line endings) via a self-written generator. Filename suffixed with `_yyyy-MM-dd-HH-mm-ss.csv`.

```typescript
exportCSV(option: SdExcelExportOption): Promise<void>;
```

### `upload(): Promise<{ items: Record<string, any>[]; file: File | null }>`
Opens the SD file picker (extensions: `['xlsx']`, max 10 MB), then parses the chosen file via `parse(file)`. Returns `{ items: [], file: null }` if the user cancels. Re-throws any error from `parse()` (e.g. corrupt/empty buffer, no sheets).

```typescript
upload(): Promise<{ items: Record<string, any>[]; file: File | null }>;
```

### `parse(file): Promise<{ items: Record<string, any>[]; file: File | null }>`
Reads a `.xlsx` `File` via `FileReader` and converts the first sheet to JS objects keyed by row-1 headers.

```typescript
parse(file: File): Promise<{ items: Record<string, any>[]; file: File | null }>;
```

**Cell value normalization**:
- RichText / hyperlink / formula cells are unwrapped to plain text via `richText.map(t => t.text).join('')` / `value.text` / `value.result`.
- Strings are trimmed.
- `''` and `undefined` become `null`.
- Sentinel values `'SET_NULL'` �  `null`, `'SET_EMPTY'` �  `''`.

**Throws**: `'Không �ọc �ược n�"i dung file'` if the buffer is empty; `'File Excel không có sheet dữ li�!u'` if the workbook has no sheets.

## Configuration / DI tokens
None.

## Behavior notes
- **Download mechanism**: generated workbooks go through `BrowserUtilities.downloadBlob(blob, fileName)` (`.xlsx` MIME type). CSV path uses a self-written RFC 4180 generator (UTF-8 BOM + CRLF + double-quote escaping) and the same `BrowserUtilities.downloadBlob` helper (`text/csv;charset=utf-8;`).
- **Header styling** is fixed (border `thin`, dark-blue fill `#143180` with white font for titles, `#FAFAFA` light fill for field row, `#FF1744` red highlight for required, `#CFD8DC` light grey for descriptions). Override via `column.fill` / `column.fontColor`.
- **Column width**: `width: '120px'` is converted to `120 / 7 �0� 17` Excel character units; missing/invalid �  20.
- **Header layout**: row 1 = field code, row 2 = title, row 3 = description (only if any column has `description`), then data rows.
- **Lookup sheets**: each `SdExcelSheet` becomes a separate worksheet, headers in rows 1+2, items from row 3 down.
- **CSV header row**: `column.title` values are written as the first CSV row (human-readable labels). Subsequent rows are built by reading `column.field` keys from each item.

## Examples

### 1. Import-template download
```typescript
import { SdExcelService } from '@sdcorejs/angular/services/excel';
import { inject } from '@angular/core';

const excel = inject(SdExcelService);
await excel.generateTemplate({
  fileName: 'users-template.xlsx',
  columns: [
    { field: 'code',   title: 'User code', required: true, width: '120px' },
    { field: 'name',   title: 'Full name', required: true },
    { field: 'email',  title: 'Email', description: 'lowercase' },
  ],
  sheets: [{
    name: 'Departments',
    items: departments,
    headers: [{ value: 'id', display: 'ID' }, { value: 'name', display: 'Name' }],
  }],
});
```

### 2. Export a grid as `.xlsx`
```typescript
await excel.export({
  fileName: 'orders.xlsx',
  columns: [
    { field: 'id',     title: 'Order ID' },
    { field: 'total',  title: 'Total' },
    { field: 'status', title: 'Status' },
  ],
  items: orders,
});
```

### 3. Export the same grid as CSV
```typescript
await excel.exportCSV({
  fileName: 'orders',  // �  orders_2026-05-10-14-23-04.csv
  columns: [...],
  items: orders,
});
```

### 4. User-driven import
```typescript
const { items, file } = await excel.upload();
if (file && items.length) {
  await api.post('/api/users/import', { items });
}
```

## Anti-patterns
- Do NOT pass styled `Cell` objects in `items` � the service expects plain JS values keyed by `column.field`.
- Do NOT use this for very large exports � accumulate batches server-side instead.
- Do NOT assume the parsed `items` keys come from `column.title` � they come from row-1 cell values, which by template design are `column.field` codes.
- Do NOT include `#` in `fill` / `fontColor` � these are passed as raw ARGB hex strings to ExcelJS (e.g., `'FF1744'`, not `'#FF1744'`).

## Related
- `exceljs` (peer dep) � workbook driver. Loaded dynamically via `await import('exceljs')` inside `generateTemplate` / `export` / `parse` to keep it out of the main bundle.
- `BrowserUtilities.upload` / `BrowserUtilities.downloadBlob` (`@sdcorejs/utils/fns`) � file picker + download trigger.
- `DateUtilities.toFormat` � used to suffix CSV filenames.

