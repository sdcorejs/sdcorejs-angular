# SdTable Split — Design Spec (Conservative)

**Date:** 2026-05-15
**Component:** `@sd-angular/components/table` (SdTable)
**Status:** Approved (awaiting implementation plan)

## 1. Goal

Tách những phần của `SdTable` template có thể tách an toàn thành sub-components để giảm kích thước file, làm rõ trách nhiệm và mở đường cho test coverage. **KHÔNG đụng đến** các phần kỹ thuật bị chặn bởi Angular CDK Table contract.

**KHÔNG thay đổi public API:** `<sd-table>` selector, `SdTable` class, `SdTableOption`/`SdTableColumn` interfaces, content-projection directives, và toàn bộ method qua `@ViewChild` — tất cả giữ nguyên 100%.

## 2. Vấn đề kỹ thuật & quyết định scope

**Bị chặn (không tách):**
- Cell column definitions inside `<table mat-table>` (selection/command/group/expand/reorder + data column loop)
- Header rows (`<tr matHeaderRowDef>`) and data rows (`<tr matRowDef>`)

**Lý do:** `CdkTable` (`mat-table`) dùng `@ContentChildren(CdkColumnDef, { descendants: true })` để register column definitions. ContentChildren chỉ thấy content projection (`<ng-content>`), không thấy children trong view của sub-component. Nếu đặt `<table-header>` bên trong `<table mat-table>`, các `<ng-container matColumnDef>` trong template của nó KHÔNG được mat-table pick up → header và rows trống.

**Workaround manual `_table.addColumnDef(...)`** phụ thuộc CDK internal API, rủi ro break khi update version → loại khỏi scope này.

**Tách an toàn (trong scope):**
- Toolbar region (paginator + reload/export/config buttons) — nằm NGOÀI `<table mat-table>`
- Empty state region — nằm NGOÀI `<table mat-table>`
- Cell render component (đã tách sẵn dưới tên `desktop-cell` — chỉ rename)
- Internal directive `SdColumnResizeDirective` (rename)

## 3. Naming rule

Theo nguyên tắc của user:

| Loại | Public (dev sử dụng) | Internal (chỉ nội bộ lib) |
|---|---|---|
| Selector | `sd-table` | `table-toolbar`, `table-empty-state`, `table-cell` |
| Class | `SdTable`, `SdTableOption`, ... | `TableToolbar`, `TableEmptyState`, `TableCell` |
| Directives | `SdTabelCellDefDirective`, `SdTableTitleDefDirective`, `SdMaterialFooterDefDirective`, `SdMaterialSubInformationDefDirective`, `SdTableFilterDefDirective`, `SdTableColumnFilterDefDirective` (consumer dùng qua `<ng-template>`) | `ColumnResizeDirective` (rename từ `SdColumnResizeDirective`), `StickyShadowDirective` (đã không có Sd ✓) |

**Tech debt out of scope:** Tên class `SdMaterialFooterDefDirective` và `SdMaterialSubInformationDefDirective` (dùng "Material" thay vì "Table") legacy, KHÔNG đổi vì sẽ break import của consumer.

## 4. Sub-components to extract

### 4.1 `<table-toolbar>` (NEW)

**File:** `projects/sdcorejs-angular/components/table/src/components/table-toolbar/table-toolbar.component.{ts,html,scss}`

**Trách nhiệm:** Render hàng dưới table — paginator + reload/export/config buttons.

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
paginatorRef = output<MatPaginator>();   // emit khi viewInit để SdTable subscribe page event
```

**Template:** Block hiện tại từ `table.component.html` line 326-385 (paginator + actions).

### 4.2 `<table-empty-state>` (NEW)

**File:** `projects/sdcorejs-angular/components/table/src/components/table-empty-state/table-empty-state.component.{ts,html,scss}`

**Trách nhiệm:** Render block "Chưa có dữ liệu" / "Không có kết quả phù hợp" / "Vui lòng chọn bộ lọc".

**Inputs:**
```typescript
total = input<number | undefined>();
loading = input.required<boolean>();
isFiltered = input.required<boolean>();
requireFiltered = input.required<boolean>();
tableConfiguration = input<ISdTableConfiguration | null>();
```

**Outputs:** none — pure presentation.

**Template:** Block hiện tại từ `table.component.html` line 296-324.

### 4.3 `<table-cell>` (RENAME từ `desktop-cell`)

**Thay đổi:**
- Folder rename: `components/desktop-cell/` → `components/table-cell/`
- File rename: `desktop-cell.component.{ts,html,scss}` → `table-cell.component.{ts,html,scss}`
- Selector: `desktop-cell` → `table-cell`
- Class: `DesktopCellComponent` → `TableCellComponent`
- Sub-folder `view/` (chứa `ViewComponent`) ở trong: giữ nguyên tên (internal sub-helper)
- Update import trong `table.component.ts`
- Update `components/index.ts` re-export

### 4.4 `ColumnResizeDirective` (RENAME từ `SdColumnResizeDirective`)

**Thay đổi:**
- File rename: `directives/sd-column-resize.directive.ts` → `directives/column-resize.directive.ts`
- Test file rename: `sd-column-resize.directive.spec.ts` → `column-resize.directive.spec.ts`
- Selector: `[sdColumnResize]` → `[columnResize]`
- Class: `SdColumnResizeDirective` → `ColumnResizeDirective`
- Input rename: `sdColumnResize` → `columnResize`
- Update `directives/index.ts` re-export
- Update `table.component.html` (binding `[columnResize]` thay `[sdColumnResize]`)
- Update `table.component.ts` import
- Update test imports

## 5. SdTable orchestrator (gần như không đổi)

SdTable giữ nguyên:
- Tất cả signals, effects, subscriptions, public methods
- Toàn bộ `<table mat-table>` block và các `<ng-container matColumnDef>` bên trong (selection/command/group/expand/reorder/data columns)
- Header rows + data rows + footer row
- External-filter, config, selector-action component mounts (đã tách sẵn từ trước)

**Thay đổi duy nhất:**
- Thay 2 block trong template bằng `<table-toolbar>` và `<table-empty-state>` mount
- Đổi `<desktop-cell>` thành `<table-cell>`
- Đổi `[sdColumnResize]` thành `[columnResize]`
- Lấy `MatPaginator` instance từ output `(paginatorRef)` của `<table-toolbar>` thay vì `viewChild(MatPaginator)` (vì paginator giờ ở trong sub-component)

**Code change cho paginator:**

Hiện tại (line 167 `table.component.ts`):
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

Sau refactor: thay `viewChild(MatPaginator)` bằng signal `paginatorInstance = signal<MatPaginator | undefined>(undefined)`. `onPaginatorReady(p)` setter được gọi từ output của `<table-toolbar>`. Effect subscribe vẫn dùng tương tự.

## 6. File map

| File | Action | Notes |
|---|---|---|
| `components/table-toolbar/table-toolbar.component.ts` | NEW | Component class |
| `components/table-toolbar/table-toolbar.component.html` | NEW | Cut từ table.component.html L326-385 |
| `components/table-toolbar/table-toolbar.component.scss` | NEW | Cut style liên quan từ table.component.scss |
| `components/table-toolbar/index.ts` | NEW | Re-export |
| `components/table-toolbar/ng-package.json` | NEW (optional) | Nếu muốn entry point riêng — KHÔNG cần, internal-only |
| `components/table-empty-state/table-empty-state.component.ts` | NEW | |
| `components/table-empty-state/table-empty-state.component.html` | NEW | Cut từ L296-324 |
| `components/table-empty-state/table-empty-state.component.scss` | NEW | Cut style |
| `components/desktop-cell/` | RENAME → `components/table-cell/` | git mv folder |
| `components/desktop-cell/desktop-cell.component.{ts,html,scss}` | RENAME → `table-cell.component.{ts,html,scss}` | + class + selector rename |
| `components/index.ts` | UPDATE | Re-exports update |
| `directives/sd-column-resize.directive.ts` | RENAME → `column-resize.directive.ts` | + class + selector + input rename |
| `directives/sd-column-resize.directive.spec.ts` | RENAME → `column-resize.directive.spec.ts` | + update imports |
| `directives/index.ts` | UPDATE | Re-export |
| `table.component.ts` | MODIFY | Import sub-components; thay viewChild(MatPaginator) bằng signal + setter; method `onPaginatorReady` |
| `table.component.html` | MODIFY | Giảm từ ~390 LOC → ~290 LOC. Thay 2 blocks bằng sub-components. Đổi cell selector + directive selector. |
| `table.component.scss` | MODIFY | Cut style của toolbar + empty-state xuống file SCSS riêng |

## 7. Internal sub-components reference (nội bộ, không export công khai)

Internal sub-components KHÔNG cần `ng-package.json` riêng — chúng chỉ được dùng trong template của SdTable, không export ra public API của package. Re-export qua `components/table/src/components/index.ts` chỉ phục vụ import nội bộ.

## 8. Comment & doc convention

Theo yêu cầu user (full comment + diễn giải chặt chẽ):

1. **JSDoc class:** mô tả trách nhiệm sub-component (2-3 câu) — context: nó nằm trong sd-table như thế nào, dùng để làm gì.
2. **JSDoc cho mỗi `input()`/`output()` public:** giải thích ý nghĩa nghiệp vụ, không chỉ kiểu dữ liệu.
3. **Inline comment Vietnamese cho logic không hiển nhiên** (theo memory user). KHÔNG comment cho code self-explanatory (per default rule).
4. **Mỗi file `.html`/`.scss`** không cần comment trừ khi có magic value/CSS hack.

Ví dụ class doc:
```typescript
/**
 * Render toolbar nằm DƯỚI table — gồm các nút reload/export/config và Material
 * paginator. Component này tồn tại để tách logic trình bày khỏi SdTable
 * orchestrator (chỉ pass state qua input và emit user action qua output).
 *
 * @internal Sub-component chỉ dùng trong template của `<sd-table>`.
 */
@Component({ selector: 'table-toolbar', ... })
export class TableToolbar { ... }
```

## 9. Migration & backward compatibility

- **Public API:** không đổi 100%
- **Internal rename:** `desktop-cell` → `table-cell` và `[sdColumnResize]` → `[columnResize]` chỉ ảnh hưởng nội bộ lib, không break consumer
- **Version bump:** `19.0.0-beta.94` (internal refactor only)
- **CHANGELOG:** ghi rõ "Internal: extract table-toolbar + table-empty-state from SdTable template; rename desktop-cell → table-cell; rename SdColumnResizeDirective → ColumnResizeDirective. No public API change."

## 10. Testing strategy (sau refactor)

**Per sub-component:**
- `table-toolbar.spec.ts`: render với options khác nhau (visible flags), click → emit đúng output
- `table-empty-state.spec.ts`: render đúng image/text theo state (loading/filtered/required-filter/empty)
- `table-cell.spec.ts`: render đúng theo column.type + cell template

**Note:** Test cho `SdTable` orchestrator (god component) vẫn khó vì giữ nguyên kích thước. Sẽ làm sau, có thể qua TestBed + stub providers + ViewChild API.

## 11. Risk mitigation

1. **Mỗi sub-component extract = 1 commit:** build + existing 214 tests pass sau mỗi commit
2. **Manual smoke test** trên demo app sau khi xong tất cả: render table, filter, sort, paginate, select, expand, resize, export, paginator chuyển trang
3. **Template diff trước/sau** qua git diff để verify không miss block nào

## 12. Out of scope

- Tách `<table-header>` / `<table-body>` (bị chặn bởi CDK contentChildren — đã giải thích section 2)
- Refactor state management ra service (sau)
- Test coverage cho services (`ConfigService`, `TableFormatService`, ...) — task riêng
- Rename `SdMaterialFooterDefDirective` / `SdMaterialSubInformationDefDirective` (breaking change)
