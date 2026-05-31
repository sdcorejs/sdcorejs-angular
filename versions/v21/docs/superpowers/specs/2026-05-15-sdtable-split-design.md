�# SdTable Split � Design Spec (Conservative)

**Date:** 2026-05-15
**Component:** `@sd-angular/components/table` (SdTable)
**Status:** Approved (awaiting implementation plan)

## 1. Goal

Tách những phần của `SdTable` template có thỒ tách an toàn thành sub-components �Ồ giảm kích thư�:c file, làm rõ trách nhi�!m và m�x �ường cho test coverage. **KH�NG �ụng �ến** các phần kỹ thuật b�9 chặn b�xi Angular CDK Table contract.

**KH�NG thay ��"i public API:** `<sd-table>` selector, `SdTable` class, `SdTableOption`/`SdTableColumn` interfaces, content-projection directives, và toàn b�" method qua `@ViewChild` � tất cả giữ nguyên 100%.

## 2. Vấn �ề kỹ thuật & quyết ��9nh scope

**B�9 chặn (không tách):**
- Cell column definitions inside `<table mat-table>` (selection/command/group/expand/reorder + data column loop)
- Header rows (`<tr matHeaderRowDef>`) and data rows (`<tr matRowDef>`)

**Lý do:** `CdkTable` (`mat-table`) dùng `@ContentChildren(CdkColumnDef, { descendants: true })` �Ồ register column definitions. ContentChildren ch�0 thấy content projection (`<ng-content>`), không thấy children trong view của sub-component. Nếu �ặt `<table-header>` bên trong `<table mat-table>`, các `<ng-container matColumnDef>` trong template của nó KH�NG �ược mat-table pick up �  header và rows tr�ng.

**Workaround manual `_table.addColumnDef(...)`** phụ thu�"c CDK internal API, rủi ro break khi update version �  loại khỏi scope này.

**Tách an toàn (trong scope):**
- Toolbar region (paginator + reload/export/config buttons) � nằm NGOìI `<table mat-table>`
- Empty state region � nằm NGOìI `<table mat-table>`
- Cell render component (�ã tách sẵn dư�:i tên `desktop-cell` � ch�0 rename)
- Internal directive `SdColumnResizeDirective` (rename)

## 3. Naming rule

Theo nguyên tắc của user:

| Loại | Public (dev sử dụng) | Internal (ch�0 n�"i b�" lib) |
|---|---|---|
| Selector | `sd-table` | `table-toolbar`, `table-empty-state`, `table-cell` |
| Class | `SdTable`, `SdTableOption`, ... | `TableToolbar`, `TableEmptyState`, `TableCell` |
| Directives | `SdTabelCellDefDirective`, `SdTableTitleDefDirective`, `SdMaterialFooterDefDirective`, `SdMaterialSubInformationDefDirective`, `SdTableFilterDefDirective`, `SdTableColumnFilterDefDirective` (consumer dùng qua `<ng-template>`) | `ColumnResizeDirective` (rename từ `SdColumnResizeDirective`), `StickyShadowDirective` (�ã không có Sd �S) |

**Tech debt out of scope:** Tên class `SdMaterialFooterDefDirective` và `SdMaterialSubInformationDefDirective` (dùng "Material" thay vì "Table") legacy, KH�NG ��"i vì sẽ break import của consumer.

## 4. Sub-components to extract

### 4.1 `<table-toolbar>` (NEW)

**File:** `projects/sdcorejs-angular/components/table/src/components/table-toolbar/table-toolbar.component.{ts,html,scss}`

**Trách nhi�!m:** Render hàng dư�:i table � paginator + reload/export/config buttons.

**Inputs:**
```typescript
option = input.required<SdTableOption>();
total = input<number | undefined>();
items = input.required<SdTableItem[]>();
exporting = input.required<boolean>();
exportTitle = input.required<string>();
tableConfiguration = input<ISdTableConfiguration | null>();
configComponentRef = input<ConfigComponent | undefined>();
```

**Outputs:**
```typescript
reload = output<void>();
exportExcel = output<void>();
exportCSV = output<void>();
exportCustom = output<void>();
paginatorRef = output<MatPaginator>();   // emit khi viewInit �Ồ SdTable subscribe page event
```

**Template:** Block hi�!n tại từ `table.component.html` line 326-385 (paginator + actions).

### 4.2 `<table-empty-state>` (NEW)

**File:** `projects/sdcorejs-angular/components/table/src/components/table-empty-state/table-empty-state.component.{ts,html,scss}`

**Trách nhi�!m:** Render block "Chưa có dữ li�!u" / "Không có kết quả phù hợp" / "Vui lòng chọn b�" lọc".

**Inputs:**
```typescript
total = input<number | undefined>();
loading = input.required<boolean>();
isFiltered = input.required<boolean>();
requireFiltered = input.required<boolean>();
tableConfiguration = input<ISdTableConfiguration | null>();
```

**Outputs:** none � pure presentation.

**Template:** Block hi�!n tại từ `table.component.html` line 296-324.

### 4.3 `<table-cell>` (RENAME từ `desktop-cell`)

**Thay ��"i:**
- Folder rename: `components/desktop-cell/` �  `components/table-cell/`
- File rename: `desktop-cell.component.{ts,html,scss}` �  `table-cell.component.{ts,html,scss}`
- Selector: `desktop-cell` �  `table-cell`
- Class: `DesktopCellComponent` �  `TableCellComponent`
- Sub-folder `view/` (chứa `ViewComponent`) �x trong: giữ nguyên tên (internal sub-helper)
- Update import trong `table.component.ts`
- Update `components/index.ts` re-export

### 4.4 `ColumnResizeDirective` (RENAME từ `SdColumnResizeDirective`)

**Thay ��"i:**
- File rename: `directives/sd-column-resize.directive.ts` �  `directives/column-resize.directive.ts`
- Test file rename: `sd-column-resize.directive.spec.ts` �  `column-resize.directive.spec.ts`
- Selector: `[sdColumnResize]` �  `[columnResize]`
- Class: `SdColumnResizeDirective` �  `ColumnResizeDirective`
- Input rename: `sdColumnResize` �  `columnResize`
- Update `directives/index.ts` re-export
- Update `table.component.html` (binding `[columnResize]` thay `[sdColumnResize]`)
- Update `table.component.ts` import
- Update test imports

## 5. SdTable orchestrator (gần như không ��"i)

SdTable giữ nguyên:
- Tất cả signals, effects, subscriptions, public methods
- Toàn b�" `<table mat-table>` block và các `<ng-container matColumnDef>` bên trong (selection/command/group/expand/reorder/data columns)
- Header rows + data rows + footer row
- External-filter, config, selector-action component mounts (�ã tách sẵn từ trư�:c)

**Thay ��"i duy nhất:**
- Thay 2 block trong template bằng `<table-toolbar>` và `<table-empty-state>` mount
- Đ�"i `<desktop-cell>` thành `<table-cell>`
- Đ�"i `[sdColumnResize]` thành `[columnResize]`
- Lấy `MatPaginator` instance từ output `(paginatorRef)` của `<table-toolbar>` thay vì `viewChild(MatPaginator)` (vì paginator giờ �x trong sub-component)

**Code change cho paginator:**

Hi�!n tại (line 167 `table.component.ts`):
```typescript
paginator = viewChild(MatPaginator);
```

Effect subscribe paginator (line 292-298):
```typescript
effect(() => {
  const paginator = this.paginator();
  if (paginator) {
    untracked(() => {
      this.#subscription.add(paginator.page.subscribe(() => this.#reload.next({ force: false })));
    });
  }
});
```

Sau refactor: thay `viewChild(MatPaginator)` bằng signal `paginatorInstance = signal<MatPaginator | undefined>(undefined)`. `onPaginatorReady(p)` setter �ược gọi từ output của `<table-toolbar>`. Effect subscribe vẫn dùng tương tự.

## 6. File map

| File | Action | Notes |
|---|---|---|
| `components/table-toolbar/table-toolbar.component.ts` | NEW | Component class |
| `components/table-toolbar/table-toolbar.component.html` | NEW | Cut từ table.component.html L326-385 |
| `components/table-toolbar/table-toolbar.component.scss` | NEW | Cut style liên quan từ table.component.scss |
| `components/table-toolbar/index.ts` | NEW | Re-export |
| `components/table-toolbar/ng-package.json` | NEW (optional) | Nếu mu�n entry point riêng � KH�NG cần, internal-only |
| `components/table-empty-state/table-empty-state.component.ts` | NEW | |
| `components/table-empty-state/table-empty-state.component.html` | NEW | Cut từ L296-324 |
| `components/table-empty-state/table-empty-state.component.scss` | NEW | Cut style |
| `components/desktop-cell/` | RENAME �  `components/table-cell/` | git mv folder |
| `components/desktop-cell/desktop-cell.component.{ts,html,scss}` | RENAME �  `table-cell.component.{ts,html,scss}` | + class + selector rename |
| `components/index.ts` | UPDATE | Re-exports update |
| `directives/sd-column-resize.directive.ts` | RENAME �  `column-resize.directive.ts` | + class + selector + input rename |
| `directives/sd-column-resize.directive.spec.ts` | RENAME �  `column-resize.directive.spec.ts` | + update imports |
| `directives/index.ts` | UPDATE | Re-export |
| `table.component.ts` | MODIFY | Import sub-components; thay viewChild(MatPaginator) bằng signal + setter; method `onPaginatorReady` |
| `table.component.html` | MODIFY | Giảm từ ~390 LOC �  ~290 LOC. Thay 2 blocks bằng sub-components. Đ�"i cell selector + directive selector. |
| `table.component.scss` | MODIFY | Cut style của toolbar + empty-state xu�ng file SCSS riêng |

## 7. Internal sub-components reference (n�"i b�", không export công khai)

Internal sub-components KH�NG cần `ng-package.json` riêng � chúng ch�0 �ược dùng trong template của SdTable, không export ra public API của package. Re-export qua `components/table/src/components/index.ts` ch�0 phục vụ import n�"i b�".

## 8. Comment & doc convention

Theo yêu cầu user (full comment + di�&n giải chặt chẽ):

1. **JSDoc class:** mô tả trách nhi�!m sub-component (2-3 câu) � context: nó nằm trong sd-table như thế nào, dùng �Ồ làm gì.
2. **JSDoc cho m�i `input()`/`output()` public:** giải thích ý nghĩa nghi�!p vụ, không ch�0 kiỒu dữ li�!u.
3. **Inline comment Vietnamese cho logic không hiỒn nhiên** (theo memory user). KH�NG comment cho code self-explanatory (per default rule).
4. **M�i file `.html`/`.scss`** không cần comment trừ khi có magic value/CSS hack.

Ví dụ class doc:
```typescript
/**
 * Render toolbar nằm DƯ�aI table � g�m các nút reload/export/config và Material
 * paginator. Component này t�n tại �Ồ tách logic trình bày khỏi SdTable
 * orchestrator (ch�0 pass state qua input và emit user action qua output).
 *
 * @internal Sub-component ch�0 dùng trong template của `<sd-table>`.
 */
@Component({ selector: 'table-toolbar', ... })
export class TableToolbar { ... }
```

## 9. Migration & backward compatibility

- **Public API:** không ��"i 100%
- **Internal rename:** `desktop-cell` �  `table-cell` và `[sdColumnResize]` �  `[columnResize]` ch�0 ảnh hư�xng n�"i b�" lib, không break consumer
- **Version bump:** `19.0.0-beta.94` (internal refactor only)
- **CHANGELOG:** ghi rõ "Internal: extract table-toolbar + table-empty-state from SdTable template; rename desktop-cell �  table-cell; rename SdColumnResizeDirective �  ColumnResizeDirective. No public API change."

## 10. Testing strategy (sau refactor)

**Per sub-component:**
- `table-toolbar.spec.ts`: render v�:i options khác nhau (visible flags), click �  emit �úng output
- `table-empty-state.spec.ts`: render �úng image/text theo state (loading/filtered/required-filter/empty)
- `table-cell.spec.ts`: render �úng theo column.type + cell template

**Note:** Test cho `SdTable` orchestrator (god component) vẫn khó vì giữ nguyên kích thư�:c. Sẽ làm sau, có thỒ qua TestBed + stub providers + ViewChild API.

## 11. Risk mitigation

1. **M�i sub-component extract = 1 commit:** build + existing 214 tests pass sau m�i commit
2. **Manual smoke test** trên demo app sau khi xong tất cả: render table, filter, sort, paginate, select, expand, resize, export, paginator chuyỒn trang
3. **Template diff trư�:c/sau** qua git diff �Ồ verify không miss block nào

## 12. Out of scope

- Tách `<table-header>` / `<table-body>` (b�9 chặn b�xi CDK contentChildren � �ã giải thích section 2)
- Refactor state management ra service (sau)
- Test coverage cho services (`ConfigService`, `TableFormatService`, ...) � task riêng
- Rename `SdMaterialFooterDefDirective` / `SdMaterialSubInformationDefDirective` (breaking change)

