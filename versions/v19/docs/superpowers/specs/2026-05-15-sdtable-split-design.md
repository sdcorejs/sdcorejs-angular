# SdTable Split â€” Design Spec (Conservative)

**Date:** 2026-05-15
**Component:** `@sd-angular/components/table` (SdTable)
**Status:** Approved (awaiting implementation plan)

## 1. Goal

TÃ¡ch nhá»¯ng pháº§n cá»§a `SdTable` template cÃ³ thá»ƒ tÃ¡ch an toÃ n thÃ nh sub-components Ä‘á»ƒ giáº£m kÃ­ch thÆ°á»›c file, lÃ m rÃµ trÃ¡ch nhiá»‡m vÃ  má»Ÿ Ä‘Æ°á»ng cho test coverage. **KHÃ”NG Ä‘á»¥ng Ä‘áº¿n** cÃ¡c pháº§n ká»¹ thuáº­t bá»‹ cháº·n bá»Ÿi Angular CDK Table contract.

**KHÃ”NG thay Ä‘á»•i public API:** `<sd-table>` selector, `SdTable` class, `SdTableOption`/`SdTableColumn` interfaces, content-projection directives, vÃ  toÃ n bá»™ method qua `@ViewChild` â€” táº¥t cáº£ giá»¯ nguyÃªn 100%.

## 2. Váº¥n Ä‘á» ká»¹ thuáº­t & quyáº¿t Ä‘á»‹nh scope

**Bá»‹ cháº·n (khÃ´ng tÃ¡ch):**
- Cell column definitions inside `<table mat-table>` (selection/command/group/expand/reorder + data column loop)
- Header rows (`<tr matHeaderRowDef>`) and data rows (`<tr matRowDef>`)

**LÃ½ do:** `CdkTable` (`mat-table`) dÃ¹ng `@ContentChildren(CdkColumnDef, { descendants: true })` Ä‘á»ƒ register column definitions. ContentChildren chá»‰ tháº¥y content projection (`<ng-content>`), khÃ´ng tháº¥y children trong view cá»§a sub-component. Náº¿u Ä‘áº·t `<table-header>` bÃªn trong `<table mat-table>`, cÃ¡c `<ng-container matColumnDef>` trong template cá»§a nÃ³ KHÃ”NG Ä‘Æ°á»£c mat-table pick up â†’ header vÃ  rows trá»‘ng.

**Workaround manual `_table.addColumnDef(...)`** phá»¥ thuá»™c CDK internal API, rá»§i ro break khi update version â†’ loáº¡i khá»i scope nÃ y.

**TÃ¡ch an toÃ n (trong scope):**
- Toolbar region (paginator + reload/export/config buttons) â€” náº±m NGOÃ€I `<table mat-table>`
- Empty state region â€” náº±m NGOÃ€I `<table mat-table>`
- Cell render component (Ä‘Ã£ tÃ¡ch sáºµn dÆ°á»›i tÃªn `desktop-cell` â€” chá»‰ rename)
- Internal directive `SdColumnResizeDirective` (rename)

## 3. Naming rule

Theo nguyÃªn táº¯c cá»§a user:

| Loáº¡i | Public (dev sá»­ dá»¥ng) | Internal (chá»‰ ná»™i bá»™ lib) |
|---|---|---|
| Selector | `sd-table` | `table-toolbar`, `table-empty-state`, `table-cell` |
| Class | `SdTable`, `SdTableOption`, ... | `TableToolbar`, `TableEmptyState`, `TableCell` |
| Directives | `SdTabelCellDefDirective`, `SdTableTitleDefDirective`, `SdMaterialFooterDefDirective`, `SdMaterialSubInformationDefDirective`, `SdTableFilterDefDirective`, `SdTableColumnFilterDefDirective` (consumer dÃ¹ng qua `<ng-template>`) | `ColumnResizeDirective` (rename tá»« `SdColumnResizeDirective`), `StickyShadowDirective` (Ä‘Ã£ khÃ´ng cÃ³ Sd âœ“) |

**Tech debt out of scope:** TÃªn class `SdMaterialFooterDefDirective` vÃ  `SdMaterialSubInformationDefDirective` (dÃ¹ng "Material" thay vÃ¬ "Table") legacy, KHÃ”NG Ä‘á»•i vÃ¬ sáº½ break import cá»§a consumer.

## 4. Sub-components to extract

### 4.1 `<table-toolbar>` (NEW)

**File:** `projects/sdcorejs-angular/components/table/src/components/table-toolbar/table-toolbar.component.{ts,html,scss}`

**TrÃ¡ch nhiá»‡m:** Render hÃ ng dÆ°á»›i table â€” paginator + reload/export/config buttons.

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
paginatorRef = output<MatPaginator>();   // emit khi viewInit Ä‘á»ƒ SdTable subscribe page event
```

**Template:** Block hiá»‡n táº¡i tá»« `table.component.html` line 326-385 (paginator + actions).

### 4.2 `<table-empty-state>` (NEW)

**File:** `projects/sdcorejs-angular/components/table/src/components/table-empty-state/table-empty-state.component.{ts,html,scss}`

**TrÃ¡ch nhiá»‡m:** Render block "ChÆ°a cÃ³ dá»¯ liá»‡u" / "KhÃ´ng cÃ³ káº¿t quáº£ phÃ¹ há»£p" / "Vui lÃ²ng chá»n bá»™ lá»c".

**Inputs:**
```typescript
total = input<number | undefined>();
loading = input.required<boolean>();
isFiltered = input.required<boolean>();
requireFiltered = input.required<boolean>();
tableConfiguration = input<ISdTableConfiguration | null>();
```

**Outputs:** none â€” pure presentation.

**Template:** Block hiá»‡n táº¡i tá»« `table.component.html` line 296-324.

### 4.3 `<table-cell>` (RENAME tá»« `desktop-cell`)

**Thay Ä‘á»•i:**
- Folder rename: `components/desktop-cell/` â†’ `components/table-cell/`
- File rename: `desktop-cell.component.{ts,html,scss}` â†’ `table-cell.component.{ts,html,scss}`
- Selector: `desktop-cell` â†’ `table-cell`
- Class: `DesktopCellComponent` â†’ `TableCellComponent`
- Sub-folder `view/` (chá»©a `ViewComponent`) á»Ÿ trong: giá»¯ nguyÃªn tÃªn (internal sub-helper)
- Update import trong `table.component.ts`
- Update `components/index.ts` re-export

### 4.4 `ColumnResizeDirective` (RENAME tá»« `SdColumnResizeDirective`)

**Thay Ä‘á»•i:**
- File rename: `directives/sd-column-resize.directive.ts` â†’ `directives/column-resize.directive.ts`
- Test file rename: `sd-column-resize.directive.spec.ts` â†’ `column-resize.directive.spec.ts`
- Selector: `[sdColumnResize]` â†’ `[columnResize]`
- Class: `SdColumnResizeDirective` â†’ `ColumnResizeDirective`
- Input rename: `sdColumnResize` â†’ `columnResize`
- Update `directives/index.ts` re-export
- Update `table.component.html` (binding `[columnResize]` thay `[sdColumnResize]`)
- Update `table.component.ts` import
- Update test imports

## 5. SdTable orchestrator (gáº§n nhÆ° khÃ´ng Ä‘á»•i)

SdTable giá»¯ nguyÃªn:
- Táº¥t cáº£ signals, effects, subscriptions, public methods
- ToÃ n bá»™ `<table mat-table>` block vÃ  cÃ¡c `<ng-container matColumnDef>` bÃªn trong (selection/command/group/expand/reorder/data columns)
- Header rows + data rows + footer row
- External-filter, config, selector-action component mounts (Ä‘Ã£ tÃ¡ch sáºµn tá»« trÆ°á»›c)

**Thay Ä‘á»•i duy nháº¥t:**
- Thay 2 block trong template báº±ng `<table-toolbar>` vÃ  `<table-empty-state>` mount
- Äá»•i `<desktop-cell>` thÃ nh `<table-cell>`
- Äá»•i `[sdColumnResize]` thÃ nh `[columnResize]`
- Láº¥y `MatPaginator` instance tá»« output `(paginatorRef)` cá»§a `<table-toolbar>` thay vÃ¬ `viewChild(MatPaginator)` (vÃ¬ paginator giá» á»Ÿ trong sub-component)

**Code change cho paginator:**

Hiá»‡n táº¡i (line 167 `table.component.ts`):
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

Sau refactor: thay `viewChild(MatPaginator)` báº±ng signal `paginatorInstance = signal<MatPaginator | undefined>(undefined)`. `onPaginatorReady(p)` setter Ä‘Æ°á»£c gá»i tá»« output cá»§a `<table-toolbar>`. Effect subscribe váº«n dÃ¹ng tÆ°Æ¡ng tá»±.

## 6. File map

| File | Action | Notes |
|---|---|---|
| `components/table-toolbar/table-toolbar.component.ts` | NEW | Component class |
| `components/table-toolbar/table-toolbar.component.html` | NEW | Cut tá»« table.component.html L326-385 |
| `components/table-toolbar/table-toolbar.component.scss` | NEW | Cut style liÃªn quan tá»« table.component.scss |
| `components/table-toolbar/index.ts` | NEW | Re-export |
| `components/table-toolbar/ng-package.json` | NEW (optional) | Náº¿u muá»‘n entry point riÃªng â€” KHÃ”NG cáº§n, internal-only |
| `components/table-empty-state/table-empty-state.component.ts` | NEW | |
| `components/table-empty-state/table-empty-state.component.html` | NEW | Cut tá»« L296-324 |
| `components/table-empty-state/table-empty-state.component.scss` | NEW | Cut style |
| `components/desktop-cell/` | RENAME â†’ `components/table-cell/` | git mv folder |
| `components/desktop-cell/desktop-cell.component.{ts,html,scss}` | RENAME â†’ `table-cell.component.{ts,html,scss}` | + class + selector rename |
| `components/index.ts` | UPDATE | Re-exports update |
| `directives/sd-column-resize.directive.ts` | RENAME â†’ `column-resize.directive.ts` | + class + selector + input rename |
| `directives/sd-column-resize.directive.spec.ts` | RENAME â†’ `column-resize.directive.spec.ts` | + update imports |
| `directives/index.ts` | UPDATE | Re-export |
| `table.component.ts` | MODIFY | Import sub-components; thay viewChild(MatPaginator) báº±ng signal + setter; method `onPaginatorReady` |
| `table.component.html` | MODIFY | Giáº£m tá»« ~390 LOC â†’ ~290 LOC. Thay 2 blocks báº±ng sub-components. Äá»•i cell selector + directive selector. |
| `table.component.scss` | MODIFY | Cut style cá»§a toolbar + empty-state xuá»‘ng file SCSS riÃªng |

## 7. Internal sub-components reference (ná»™i bá»™, khÃ´ng export cÃ´ng khai)

Internal sub-components KHÃ”NG cáº§n `ng-package.json` riÃªng â€” chÃºng chá»‰ Ä‘Æ°á»£c dÃ¹ng trong template cá»§a SdTable, khÃ´ng export ra public API cá»§a package. Re-export qua `components/table/src/components/index.ts` chá»‰ phá»¥c vá»¥ import ná»™i bá»™.

## 8. Comment & doc convention

Theo yÃªu cáº§u user (full comment + diá»…n giáº£i cháº·t cháº½):

1. **JSDoc class:** mÃ´ táº£ trÃ¡ch nhiá»‡m sub-component (2-3 cÃ¢u) â€” context: nÃ³ náº±m trong sd-table nhÆ° tháº¿ nÃ o, dÃ¹ng Ä‘á»ƒ lÃ m gÃ¬.
2. **JSDoc cho má»—i `input()`/`output()` public:** giáº£i thÃ­ch Ã½ nghÄ©a nghiá»‡p vá»¥, khÃ´ng chá»‰ kiá»ƒu dá»¯ liá»‡u.
3. **Inline comment Vietnamese cho logic khÃ´ng hiá»ƒn nhiÃªn** (theo memory user). KHÃ”NG comment cho code self-explanatory (per default rule).
4. **Má»—i file `.html`/`.scss`** khÃ´ng cáº§n comment trá»« khi cÃ³ magic value/CSS hack.

VÃ­ dá»¥ class doc:
```typescript
/**
 * Render toolbar náº±m DÆ¯á»šI table â€” gá»“m cÃ¡c nÃºt reload/export/config vÃ  Material
 * paginator. Component nÃ y tá»“n táº¡i Ä‘á»ƒ tÃ¡ch logic trÃ¬nh bÃ y khá»i SdTable
 * orchestrator (chá»‰ pass state qua input vÃ  emit user action qua output).
 *
 * @internal Sub-component chá»‰ dÃ¹ng trong template cá»§a `<sd-table>`.
 */
@Component({ selector: 'table-toolbar', ... })
export class TableToolbar { ... }
```

## 9. Migration & backward compatibility

- **Public API:** khÃ´ng Ä‘á»•i 100%
- **Internal rename:** `desktop-cell` â†’ `table-cell` vÃ  `[sdColumnResize]` â†’ `[columnResize]` chá»‰ áº£nh hÆ°á»Ÿng ná»™i bá»™ lib, khÃ´ng break consumer
- **Version bump:** `19.0.0-beta.94` (internal refactor only)
- **CHANGELOG:** ghi rÃµ "Internal: extract table-toolbar + table-empty-state from SdTable template; rename desktop-cell â†’ table-cell; rename SdColumnResizeDirective â†’ ColumnResizeDirective. No public API change."

## 10. Testing strategy (sau refactor)

**Per sub-component:**
- `table-toolbar.spec.ts`: render vá»›i options khÃ¡c nhau (visible flags), click â†’ emit Ä‘Ãºng output
- `table-empty-state.spec.ts`: render Ä‘Ãºng image/text theo state (loading/filtered/required-filter/empty)
- `table-cell.spec.ts`: render Ä‘Ãºng theo column.type + cell template

**Note:** Test cho `SdTable` orchestrator (god component) váº«n khÃ³ vÃ¬ giá»¯ nguyÃªn kÃ­ch thÆ°á»›c. Sáº½ lÃ m sau, cÃ³ thá»ƒ qua TestBed + stub providers + ViewChild API.

## 11. Risk mitigation

1. **Má»—i sub-component extract = 1 commit:** build + existing 214 tests pass sau má»—i commit
2. **Manual smoke test** trÃªn demo app sau khi xong táº¥t cáº£: render table, filter, sort, paginate, select, expand, resize, export, paginator chuyá»ƒn trang
3. **Template diff trÆ°á»›c/sau** qua git diff Ä‘á»ƒ verify khÃ´ng miss block nÃ o

## 12. Out of scope

- TÃ¡ch `<table-header>` / `<table-body>` (bá»‹ cháº·n bá»Ÿi CDK contentChildren â€” Ä‘Ã£ giáº£i thÃ­ch section 2)
- Refactor state management ra service (sau)
- Test coverage cho services (`ConfigService`, `TableFormatService`, ...) â€” task riÃªng
- Rename `SdMaterialFooterDefDirective` / `SdMaterialSubInformationDefDirective` (breaking change)

