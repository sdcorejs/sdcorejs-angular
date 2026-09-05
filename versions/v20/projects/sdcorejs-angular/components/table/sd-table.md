# `<sd-table>`

**Type**: Component (generic over `T`)
**Selector**: `sd-table`
**Import path**: `@sdcorejs/angular/components/table` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdTable<T = unknown>` (implements `AfterViewInit`, `OnDestroy`)
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose

The standard list/table component of SDCoreJS — renders tabular data with paging, sorting, inline column filters, external (toolbar) filters, multi-select with bulk actions, row commands, expansion, grouping, sticky columns, drag-and-drop row reorder, **drag-to-resize columns with persistence**, Excel/CSV export, and column-config persistence. Used on virtually every list page.

## When to use

- Any list page (master data, transactions, search results)
- Both **local** mode (`type: 'local'`, full client-side data) and **server** mode (`type: 'server'`, paged + filtered + sorted server-side)
- Multi-select operations on rows (approve, delete, export, …)
- Per-row commands (edit, view detail, custom actions)
- Hierarchical / grouped views (with `option.group`) and parent-detail expansion (with `option.expand`)
- Pages that need user-customizable column visibility/order/width (config saved in storage when `option.key` is set)
- Pages that need drag-to-resize columns at runtime (set `option.config.resizable: true`; width persists into the same storage entry as the column-config dialog)

## When NOT to use

- For ≤ 5 simple cards / a small read-only list → use a regular Angular `@for` with custom layout
- For "key-value detail" display → use `<sd-view>`, not a 1-row table
- For tree-structured data with inline child rows → use `option.tree` (configurable depth via `maxDepth`)
- For master-detail panel below a row → use `option.expand` + `[sdTableExpandDef]`
- For editable spreadsheets — cell editing is not first-class; use a different grid library if heavy in-place editing is required

## The contract: `[option]` is the only required input

Everything is configured via the `SdTableOption<T>` object passed to `[option]`. The option discriminates on `type: 'local' | 'server'`.

### `SdTableOption<T>` (top-level)

| Field               | Type                                                             | Required     | Notes                                                                                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`              | `'local' \| 'server'`                                            | yes          | Discriminator.                                                                                                                                                                                                                               |
| `items` (local)     | `() => T[] \| Promise<T[]>`                                      | yes (local)  | Returns the full dataset. Filtering/sorting/paging done client-side.                                                                                                                                                                         |
| `items` (server)    | `(filterReq, pagingReq) => Promise<{items: T[]; total: number}>` | yes (server) | Server fetches; both `SdTableFilterRequest` and `PagingReq` are passed.                                                                                                                                                                      |
| `onFilter` (server) | `(filterReq, { externalFilterValid }) => void`                   | no           | Called BEFORE each server fetch; useful to cancel / log / sync URL.                                                                                                                                                                          |
| `columns`           | `SdTableColumn<T>[]`                                             | yes          | Column definitions (see schema below).                                                                                                                                                                                                       |
| `key`               | `string`                                                         | no           | Storage key for persisted user column-config (visibility/order/width).                                                                                                                                                                       |
| `rowKey`            | `string`                                                         | no           | Field that identifies a row (dot-notation supported, e.g. `'id'` / `'user.id'`). Becomes `SdTableItem.meta.id` — the mat-table `trackBy` key, the `preserveSelection` key, the tree expand-state key and the per-row `data-autoid` suffix. See **Row identity** below. |
| `config`            | `TableOptionConfig`                                              | no           | `{ visible?, resizable?, onResize? }` — gear button, drag-to-resize, resize callback. See **Column resize** section.                                                                                                                         |
| `selector`          | `SdTableOptionSelector<T>`                                       | no           | Multi-select + bulk actions.                                                                                                                                                                                                                 |
| `expand`            | `SdTableOptionExpand<T>`                                         | no           | Per-row expansion (master-detail).                                                                                                                                                                                                           |
| `tree`              | `SdTableOptionTree<T>`                                           | no           | Tree rows — inline child rows with expand/collapse.                                                                                                                                                                                          |
| `sort`              | `{ enable?: boolean }`                                           | no           | Master switch for sortable headers. Omitted and `enable: false` create no sort control, sort focus target, `aria-sort`, or sort icon.                                                                                                                                                                        |
| `paginate`          | `SdTableOptionPaginate`                                          | no           | `{ pageSize?, pages?, showFirstLastButtons?, hidePageSize?, hidden? }`.                                                                                                                                                                      |
| `reload`            | `{ visible?, onReload? }`                                        | no           | Show the reload button and run `onReload` after refresh. When visible, the reload action stays enabled for empty results (`items.length === 0` or `total === 0`) so users can retry.                                                          |
| `export`            | `SdTableOptionExportDefault \| SdTableOptionExportCustom`        | no           | Excel/CSV/Custom export config.                                                                                                                                                                                                              |
| `group`             | `{ fields: string[]; htmlTemplate: (rows) => string }`           | no           | Group rows by `fields` and render an HTML group header.                                                                                                                                                                                      |
| `filter`            | `SdTableOptionFilter`                                            | no           | `{ hideInlineFilter?, externalFilterPerRow?, manualFilter?, collapsible?, hideExternalFilterToolbar?, externalFilters?, operatorChange? }`.                                                                                                  |
| `commands`          | `SdTableCommand<T>[]`                                            | no           | Per-row action buttons.                                                                                                                                                                                                                      |
| `command`           | `{ align?: 'left' \| 'right'; commands?: SdTableCommand<T>[] }`  | no           | Newer per-row commands API with alignment.                                                                                                                                                                                                   |
| `style`             | `{ shadow?, maxHeight?, minHeight?, rowCss? }`                   | no           | Shadow toggle, scroll bounds, per-row CSS.                                                                                                                                                                                                   |
| `rowReorder`        | `{ enabled?, onChange?, icon?, disabled?(row,i) }`               | no           | Drag-and-drop row reordering. Respects groups.                                                                                                                                                                                               |
| `index`             | `{ enabled?, title?, width? }`                                   | no           | Adds a leading STT (row-number) column. Default `title: '#'`, `width: '50px'`. Numbering is global across pages — `pageIndex * pageSize + i + 1`. Placed after selector/tree/command(left)/group, before data columns. Hidden on group rows. |

| `mobile` | `{ rowLabel?: (row: T) => string }` | no | Accessible label and command-bar title for mobile cards; falls back to `rowKey`, then row ordinal. |

### Row identity (`rowKey` → `SdTableItem.meta.id`)

See also [Mobile row cards](#mobile-row-cards-sdtablerowmobiledef) for the template and accessible row-label API.

Every row the table renders is wrapped in an `SdTableItem` whose `meta.id` is the row's identity. It is used for:

- the mat-table `trackBy` (which DOM row view is reused for which data row),
- `selector.preserveSelection` (the key of the internal selected-items map),
- the tree expand/collapse state map,
- the per-row `data-autoid` suffixes (`…-expand-<rowId>`, `…-tree-toggle-<rowId>`).

**How the id is derived:**

| `option.rowKey` | Resulting `meta.id`                                                                  | Survives a server re-fetch? |
| --------------- | ------------------------------------------------------------------------------------ | --------------------------- |
| set (e.g. `'id'`) | `String(row.id)` — readable and deterministic                                       | yes                         |
| unset           | generated `sd-row-<n>`, pinned to the row data object's **identity** (via a `WeakMap`) | no                          |

Without `rowKey`, the same data object always maps back to the same id (so local filtering, sorting, paging and tree child re-formatting all keep their ids), but a **new** object — which is what a server fetch produces — gets a new id.

> **Changed (BREAKING for consumers who relied on the old behaviour).** `meta.id` used to be a **content hash** (`Utilities.hash({ data })`). That made two rows with equal content share one id — which corrupted row-view recycling, made `flattenTree` drop the duplicate, and collided in the expand-state / preserved-selection maps. It also made *every* group header share a single id. Ids are no longer derived from content.
>
> **Migration:** add `rowKey: '<your id field>'` to `option` if you use any of:
>
> - `selector.preserveSelection` on a `type: 'server'` table (selection must survive a re-fetch),
> - `tree` on a `type: 'server'` table (expand state must survive a re-fetch),
> - per-row `data-autoid` values as E2E selectors (they must be stable across page loads).
>
> Everything else works unchanged with no option edit. A side effect of the fix: two rows with identical content are now rendered as two distinct rows (previously the second one could be swallowed by the tree flattener).

### Column schema (`SdTableColumn<T>`)

A discriminated union over `type`. All variants share `SdTableColumnBase`:

| Field                             | Type                                                                                                             | Notes                                                                                                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `field`                           | `NestedKeyOf<T>` (or `string` for `'children'`)                                                                  | Nested key supported (e.g. `'user.name'`).                                                                                                                                                                                                                          |
| `type`                            | `'string' \| 'number' \| 'boolean' \| 'date' \| 'datetime' \| 'time' \| 'values' \| 'lazy-values' \| 'children'` | Determines cell renderer + filter UI + sort comparator.                                                                                                                                                                                                             |
| `title`                           | `string \| { title: string; templateRef?: TemplateRef<any> }`                                                    | Header text or templated header.                                                                                                                                                                                                                                    |
| `cell`                            | `{ templateRef?, copiable?, truncate?: { enable?, type?: 'more' \| 'tooltip' } }`                                | Custom cell renderer / copy-on-hover / truncation behavior.                                                                                                                                                                                                         |
| `width` / `minWidth` / `maxWidth` | `string`                                                                                                         | CSS sizes.                                                                                                                                                                                                                                                          |
| `hidden`                          | `boolean`                                                                                                        | Always hidden (not even in column-config).                                                                                                                                                                                                                          |
| `invisible`                       | `boolean`                                                                                                        | Hidden by default but toggleable in column-config.                                                                                                                                                                                                                  |
| `fixed`                           | `boolean`                                                                                                        | Sticky column.                                                                                                                                                                                                                                                      |
| `align`                           | `'right'`                                                                                                        | Right-align (numbers, currency).                                                                                                                                                                                                                                    |
| `htmlTemplate`                    | `(value, row) => string`                                                                                         | HTML string renderer (sanitized via `sdSafeHtml`).                                                                                                                                                                                                                  |
| `transform`                       | `(value, row, { isExport? }) => string \| Promise<string>`                                                       | Format the value (display + export).                                                                                                                                                                                                                                |
| `tooltip`                         | `(value, row) => string`                                                                                         | Hover tooltip on the cell.                                                                                                                                                                                                                                          |
| `click`                           | `(value, row) => void`                                                                                           | Cell click handler — turns cell into a link.                                                                                                                                                                                                                        |
| `sortable`                        | `boolean`                                                                                                        | Enable sort on this column (also requires `option.sort.enable`).                                                                                                                                                                                                    |
| `filter`                          | `{ disabled?, default?, onChange?, operator?, filterDef? }`                                                      | Inline column filter. `onChange(value, column, columnFilter)` fires when the committed value changes; for text/number inputs this is Enter or blur. `operator: { default?, enable?, list? }` controls the operator dropdown. `filterDef` is a custom `TemplateRef`. |
| `export`                          | `{ disabled?, description? }`                                                                                    | Export-specific overrides.                                                                                                                                                                                                                                          |

#### Type-specific column variants

| `type`                           | Extra fields                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'string'`                       | `useBadge?: (value, row) => Badge`                                                                                                                         |
| `'number'`                       | `useBadge?`, `filter?: { type?: 'split-number' }`                                                                                                          |
| `'boolean'`                      | `useBadge?`, `option?: { displayOnTrue?, displayOnFalse? }`                                                                                                |
| `'date' \| 'datetime' \| 'time'` | `useBadge?`, `filter?: { type?: 'daterange' \| 'date' \| 'split-date' }`                                                                                   |
| `'values'`                       | `option: { items: K[] \| Signal<K[]> \| () => Promise<K[]>; valueField; displayField; selection?: 'MULTIPLE' }`, `useBadge?: (value, row, items) => Badge` |
| `'lazy-values'`                  | `option: { items: SdSearch<K>; valueField; displayField; views?(values) => Promise<K[]>; selection?: 'MULTIPLE' }`                                         |
| `'children'`                     | `children: SdTableColumnNormal<T>[]` — produces a multi-row header with this group on top of its children.                                                 |

`Badge` shape: `{ type?, color?, icon?, title? }` — maps to a `<sd-badge>` rendered in the cell.

**Rendering convention:** status/state columns should use `useBadge` or a projected `<sd-badge>`. Do not hand-roll `.status-*`, `.pill-*`, or badge-like CSS classes for plain state display.

### Config option (`TableOptionConfig`) — gear button + column resize

```ts
export interface TableOptionConfig {
  visible?: boolean; // show the gear (column-config) button in the toolbar
  resizable?: boolean; // enable drag-to-resize on data column headers
  onResize?: (field: string, width: string, columnWidth: Record<string, string>) => void;
}
```

| Field       | Type                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visible`   | `boolean`                             | Shows the column-config (⚙) button in the toolbar. The dialog lets users toggle visibility, drag-reorder columns, and rename headers.                                                                                                                                                                                                                                                                                                          |
| `resizable` | `boolean`                             | When `true`, a 6px drag handle appears on the right edge of every **data** column header. Cursor switches to `col-resize` on hover; dragging updates the width live (mousemove updates inline style outside Angular zone for smoothness) and persists on mouseup. **Excluded from resize:** the special columns `sdSelection`, `sdCommand`, `sdGroup`, `sdSubInformation`, `sdReorder`, `sdIndex`, and `type: 'children'` parent header cells. |
| `onResize`  | `(field, width, columnWidth) => void` | Fires once per `mouseup`. `field` = column resized, `width` = new width (e.g. `'220px'`), `columnWidth` = snapshot `Record<field, width>` of **all** data columns that currently have a width set (including ones not resized this time). Useful for syncing width state to a remote profile or analytics.                                                                                                                                     |

**Column-config dialog layout:** one row per configurable column, in display order. Each row carries a drag handle (`⠿`, reorders the column), a **Hiển thị** checkbox, the header title and width inputs (`size="sm"`), and **Cố định** / **Giới hạn ký tự** checkboxes. A localized hint above the table (`core.component.table.config.drag-hint`) advertises the drag affordance, which is otherwise invisible. Turning **Hiển thị** off dims the row and disables its title/width/fixed/truncate editors — those settings are meaningless for a hidden column — while the display checkbox itself stays enabled so the column can be brought back.

**Persistence:** When `option.key` is provided, resize writes to the same storage entry used by the column-config dialog (under the prefix `TABLE_CONFIG`). Without a key it falls back to session storage keyed by `Utilities.hash(option)`.

**Reload semantics:** Resizing does **NOT** trigger a data reload, value cache refresh, or filter re-register — it only updates the configuration signal locally and writes storage silently (via the new `SdStorage.setSilent`). Safe to use on heavy server-mode tables.

**Width clamp:** During drag, width is clamped to `[column.minWidth, column.maxWidth]`. If either is unset or not a `'NNpx'` string, defaults apply: `minWidth = 40px`, `maxWidth = ∞`. Other units (`%`, `rem`, …) are ignored by the clamp parser.

### Reserved column names (internal `matColumnDef`)

The table adds these special columns conditionally — **do not** define a data column with the same `field`:

| Name                     | When rendered                   | Position                                                    |
| ------------------------ | ------------------------------- | ----------------------------------------------------------- |
| `sdReorder`              | `rowReorder.enabled`            | very first (unshifted)                                      |
| `sdSelection`            | `selector.visible`              | left, sticky                                                |
| `sdCommand`              | `commands` / `command.commands` | left if `command.align !== 'right'`, else right (stickyEnd) |
| `sdGroup`                | `group.fields.length`           | left                                                        |
| `sdIndex`                | `index.enabled`                 | after group, before data columns (sticky)                   |
| `sdSubInformation`       | `expand` configured             | render under each row                                       |
| `sdSubInformationAction` | `expand` configured             | right (stickyEnd)                                           |

### Selector option (`SdTableOptionSelector<T>`)

| Field             | Type                                  | Notes                                                                                                                                                                                        |
| ----------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `visible`         | `boolean`                             | Show the checkbox column.                                                                                                                                                                    |
| `single`          | `boolean`                             | Radio-style single-select (default is multi-select).                                                                                                                                         |
| `actions`         | `SdTableAction<T>[]`                  | Bulk-action buttons shown when ≥ 1 row selected. Each action: `{ icon?, fontSet?, tooltip?, title?, color?, type?, hidden?, isGrouped?, click(selectedItems) }` (or grouped via `children`). |
| `message`         | `string \| (selected) => string`      | Selection summary text in the action bar.                                                                                                                                                    |
| `onSelect`        | `(rowData, selectedItems) => void`    | Row toggle callback.                                                                                                                                                                         |
| `onSelectAll`     | `(selectedItems) => void`             | Header checkbox callback.                                                                                                                                                                    |
| `disabled`        | `(rowData, selectedItems) => boolean` | Per-row disable predicate.                                                                                                                                                                   |
| `defaultSelected` | `(rowData) => boolean`                | Pre-select after each load.                                                                                                                                                                  |
| `preserveSelection` | `boolean`                           | Keep the selection across paging / filtering / sorting / reload; `selectedTableItems()` then returns every selected row including off-page ones. Matching is by `meta.id` — **set `option.rowKey`** when the table is `type: 'server'`, otherwise a re-fetch produces new row objects with new ids and the selection is not restored. See **Row identity**. |

Header select-all operates only on visible rows that are selectable. Rows disabled by `disabled` or incompatible with the currently available `actions` are skipped. The header is checked only when every selectable visible row is selected; when no visible row is selectable, it stays unchecked. A row that is already selected remains enabled so the user can deselect it.

### Expand option (`SdTableOptionExpand<T>`)

`{ disabled?(row), onExpand?(row) => any \| Promise<any>, multiple?, always? }` — `always: true` keeps every row expanded; `multiple` allows multiple expanded simultaneously.

### Tree option (`SdTableOptionTree<T>`)

Inline child rows rendered beneath parent rows (tree table). **Discriminated union on `loadType`** — pick `'static'` (children embedded) or `'lazy'` (loaded on demand). `loadType` is required.

```typescript
// loadType: 'static' — children embedded in each row
tree?: {
  loadType: 'static';
  childrenKey?: NestedKeyOf<T> | 'children';  // default 'children'
  maxDepth?: number;                           // undefined = unlimited
  defaultExpanded?: boolean | number;          // false | true | open to depth N
  indentSize?: number;                         // default 20px per level
}

// loadType: 'lazy' — children fetched on first expand
tree?: {
  loadType: 'lazy';
  maxDepth?: number;                           // undefined = unlimited
  onExpandChildren: (row: T) => Promise<T[]>;  // required; result cached under 'children'
  hasChildren?: (row: T) => boolean;           // optional; gate the expand icon (see below)
  indentSize?: number;                         // default 20px per level
}
```

- **`static`:** each row may contain a nested array at `childrenKey`. No async call on expand.
- **`lazy`:** no `childrenKey`/`defaultExpanded` (always stores under `'children'`, can't pre-expand un-loaded branches). On expand, `onExpandChildren(row)` is called once and the result cached on the row.
  - **`hasChildren?`** — without it, **every** lazy node shows an expand icon (you can't know until you load). Provide it to gate the icon: it shows only when `hasChildren(row)` returns `true` (a `false` row is a leaf — no icon, `onExpandChildren` never called). A row that already has embedded children always shows the icon regardless.
- **Toggle placement:** there is **no separate toggle column**. The expand icon (`chevron_right` collapsed / `expand_more` expanded, light hover bg) sits in the **first column** — the `sdIndex` cell when `index.enabled` (indent + chevron + hierarchical STT), otherwise the first data column (indent + chevron + cell), indented `level * indentSize`.
- **Pagination (server):** only root rows are paginated; `total` = root count.
- **Coexist** with `expand` (master-detail). **Cannot combine** with `group`.
- **Row reorder:** only root rows (level 0) are draggable.
- **Child-level search** (`type: 'local'` + `loadType: 'static'` only): when an inline column filter is active, the table searches the **whole subtree**, not just root rows — a branch is kept if the node itself **or any descendant** matches. Matching branches are **pruned** (non-matching siblings hidden) and **auto-expanded** so the matched descendants are revealed. Clearing the filter restores the full tree at its default expand state. (Lazy trees and `type: 'server'` tables filter on the server / root only.)

Example (static):

```typescript
tree: { loadType: 'static', maxDepth: 3, defaultExpanded: 1 },
items: () => [
  { id: 1, name: 'Parent', children: [{ id: 2, name: 'Child' }] },
],
```

Example (lazy):

```typescript
tree: {
  loadType: 'lazy',
  hasChildren: row => row.type === 'Folder',   // only folders get an expand icon
  onExpandChildren: row => api.getChildren(row.id),
},
```

### Filter option (`SdTableOptionFilter`)

`externalFilters?: { field, type: 'string' \| 'boolean' \| 'date' \| 'datetime' \| 'daterange' \| 'select' \| ...; defaultOperator?: Operator; required? }[]` controls the toolbar filter form.

**Filter placement rule for generated pages:** treat inline column filters and `filter.externalFilters` as mutually exclusive per field. If a field already has an enabled column filter, do not repeat that same field in `externalFilters`. Use `externalFilters` only for global search, fields that are not rendered as columns, or fields whose column filter is disabled/hidden intentionally.

#### Inline column filter — commit semantics

- **Enter** trên `sd-input` / `sd-input-number` → commit value vào `filterRegister` **và** trigger reload (debounce 500ms + 200ms).
- **Blur** (focus rời input) → commit value vào `filterRegister` với `notReload: true` — **không** gọi API. Đảm bảo giá trị typed-but-not-entered không bị mất nếu user chuyển sang filter khác hoặc bấm Reload.
- **Click nút Reload** (`reload()`) → table tự commit `this.columnFilter` snapshot vào `filterRegister` (notReload:true) trước khi build filter request — đảm bảo giá trị input vẫn còn focus cũng được gửi lên.
- **Empty result:** khi `reload.visible` là `true`, nút Reload vẫn enabled với `items.length === 0` hoặc `total === 0`; export và paginator vẫn giữ điều kiện hiển thị hiện tại.
- **`sd-select` / `sd-date-range` / `sd-date`** vẫn dùng `(sdChange)` → commit + reload tức thì.
- **Dense controls:** custom `sdTableFilterDef` templates, editable table-cell controls, external-filter custom templates, and dashboard/table toolbar controls must use `size="sm"` where supported and `hideInlineError` on SD form components (`sd-input`, `sd-select`, `sd-autocomplete`, `sd-date`, `sd-date-range`, `sd-datetime`, `sd-input-number`, `sd-textarea`, `sd-chip`, `sd-chip-calendar`, `sd-input-color`) so inputs do not inflate row/header/toolbar height or inject inline error text into dense surfaces.

#### Inline column filter — local matching semantics (`type: 'local'`)

Client-side matching sống ở `matchesColumnFilter` (`services/table-local/table-local.util.ts`) và bám theo đúng operator mà `SdConvertToPagingReq` gửi lên server ở `type: 'server'`:

| Column `type`                      | Luật khớp                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `'string'`                         | `CONTAIN`, không phân biệt hoa thường                                                                  |
| `'number'`                         | `=`, hoặc prefix `>` / `>=` / `<` / `<=` gõ trong ô filter                                             |
| `'boolean'`                        | `'1'`/`'true'` vs `'0'`/`'false'`                                                                      |
| `'date'` / `'datetime'` / `'time'` | range `{ from, to }`, thiếu một đầu thì biên đó mở                                                     |
| `'values'` / `'lazy-values'`       | chọn nhiều giá trị = **OR** (tương đương `IN`); dữ liệu hàng dạng mảng thì khớp khi **giao khác rỗng** |

`'values'` / `'lazy-values'` **không** đọc `option.selection` lúc so khớp — nhánh được chọn theo hình dạng giá trị thực tế. Nhờ vậy cột `selection: 'MULTIPLE'` lọc đúng cho cả dữ liệu hàng scalar (`status: 'ACTIVE'`) và dữ liệu hàng mảng (`statuses: [{ id, name }]`), và `filter.default` dạng string trên cột MULTIPLE cũng là input hợp lệ.
### Commands (`SdTableCommandNormal<T>`)

`{ color?, icon?: string \| (row)=>string, fontSet?, title?: string \| (row)=>string, disabled?: boolean \| (row)=>boolean, hidden?: boolean \| (row)=>boolean \| Promise<boolean>, click(row), htmlTemplate?(row)=>string }`. Group via `{ ... children: SdTableCommandNormal<T>[] }`.

Command icons default to Material Symbols Outlined (`material-icons-outlined`). Child command menu items use the same default unless `child.fontSet` is provided. Use icon + title for child commands so menu rows align consistently.

```ts
command: {
  align: 'right',
  commands: [
    { icon: 'visibility', title: 'View', click: row => this.onView(row) },
    { icon: 'edit', title: 'Edit', color: 'primary', click: row => this.onEdit(row) },
    {
      icon: 'more_vert',
      title: 'More',
      children: [
        { icon: 'content_copy', title: 'Duplicate', click: row => this.onDuplicate(row) },
        { icon: 'delete', title: 'Delete', color: 'error', click: row => this.onDelete(row) },
      ],
    },
  ],
}
```

## Inputs (the host element)

| Name     | Type                          | Default     | Notes                                                                 |
| -------- | ----------------------------- | ----------- | --------------------------------------------------------------------- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="components-table-<value>"` for E2E selectors. |
| `option` | `SdTableOption<T>` (REQUIRED) | —           | The whole table configuration (see schema above).                     |

## Outputs

None. All callbacks live inside the `option` object (`onSelect`, `onReload`, `commands[].click`, `expand.onExpand`, `rowReorder.onChange`, `selector.actions[].click`, …). Use a `@ViewChild(SdTable)` ref for imperative API.

## Public API (via template ref)

```ts
@ViewChild(SdTable) tableRef!: SdTable<MyEntity>;
```

- `tableRef.reload(force = true, scrollTop = true)` — re-fetch (server) or re-filter (local)
- `tableRef.dataItems: T[]` — current rendered rows (data only)
- `tableRef.selectedItems: T[]` — current selection
- `tableRef.clearFilter()` — clears column + external filters
- `tableRef.setFilter({ columnFilter?, externalFilter? })` — programmatically set filter values
- `tableRef.exportExcel(columns?)` / `exportCSV(columns?)` / `exportCustom()` — trigger export
- `tableRef.onClearSelection(items?)` — clear selected rows (defaults to all)
- `tableRef.detectChanges()` — force CD

## Content projection (slots / directive children)

- `[sdTableCellDef]="'<field>'"` — custom cell template per column. Inside `<ng-template sdTableCellDef="fieldName" let-row>...</ng-template>`.
- `[sdTableTitleDef]="'<field>'"` — custom header template per column.
- `[sdTableFooterDef]="'<field>'"` — custom footer cell (totals row). Presence of any footer def turns on the footer row.
- `[sdTableFilterDef]="'<field>'"` — custom inline-filter template per column.
- `[sdTableExpandDef]` — custom row-expansion (sub-information) template.
- `[sdTableCommandHeaderDef]` — content for the **header cell of the command column**, which is otherwise empty. No field argument (there is only one command column). Use it for a table-level action — typically "add row" — so it sits directly above the per-row command buttons instead of needing its own strip below the table. Rendered centered; the cell stays 50px wide, so keep it to one icon button. Nothing is rendered (no wrapper element) when the template is absent.

```html
<sd-table [option]="option">
  <ng-template sdTableCommandHeaderDef>
    <sd-button prefixIcon="add" type="text" color="primary" tooltip="Thêm dòng" (click)="addRow()"></sd-button>
  </ng-template>
</sd-table>
```

### Standalone imports for projected table templates

`<sd-table>` is standalone, but Angular still requires every directive and pipe used by projected templates to be imported by the host standalone component. This is the most common source of AI-generated compile errors.

```ts
import { Component } from '@angular/core';
import {
  SdTable,
  SdTableCellDefDirective,
  SdTableExpandDefDirective,
  SdTableFilterDefDirective,
  SdTableFooterDefDirective,
  SdTableOption,
  SdTableTitleDefDirective,
} from '@sdcorejs/angular/components/table';
import { SdInput, SdInputNumber, SdSelect } from '@sdcorejs/angular/forms';
import { SdFormatDatePipe, SdFormatDatetimePipe, SdFormatNumberPipe, SdViewPipe } from '@sdcorejs/angular/pipes';

@Component({
  standalone: true,
  imports: [
    SdTable,
    SdTableCellDefDirective,
    SdTableFilterDefDirective,
    SdTableTitleDefDirective,
    SdTableFooterDefDirective,
    SdTableExpandDefDirective,
    SdInput,
    SdInputNumber,
    SdSelect,
    SdFormatNumberPipe,
    SdFormatDatePipe,
    SdFormatDatetimePipe,
    SdViewPipe,
  ],
  template: `
    <sd-table [option]="tableOption">
      <ng-template sdTableCellDef="amount" let-row>
        {{ row.amount | sdFormatNumber: 0 | sdView }}
      </ng-template>

      <ng-template sdTableCellDef="createdAt" let-row>
        {{ row.createdAt | sdFormatDatetime: 'dd/MM/yyyy HH:mm' | sdView }}
      </ng-template>

      <ng-template sdTableFilterDef="keyword" let-filter let-update="update">
        <sd-input size="sm" hideInlineError [(model)]="filter.keyword" (keyupEnter)="update()"></sd-input>
      </ng-template>
    </sd-table>
  `,
})
export class InvoiceListComponent {
  tableOption!: SdTableOption<unknown>;
}
```

| Template usage                           | Required import             |
| ---------------------------------------- | --------------------------- | ---------------------- |
| `<ng-template sdTableCellDef="field">`   | `SdTableCellDefDirective`   |
| `<ng-template sdTableFilterDef="field">` | `SdTableFilterDefDirective` |
| `<ng-template sdTableTitleDef="field">`  | `SdTableTitleDefDirective`  |
| `<ng-template sdTableFooterDef="field">` | `SdTableFooterDefDirective` |
| `<ng-template sdTableExpandDef>`         | `SdTableExpandDefDirective` |
| `                                        | sdFormatNumber`             | `SdFormatNumberPipe`   |
| `                                        | sdFormatDate`               | `SdFormatDatePipe`     |
| `                                        | sdFormatDatetime`           | `SdFormatDatetimePipe` |
| `                                        | sdView`                     | `SdViewPipe`           |

### Dense editable controls inside table cells

When rendering form controls inside cells, custom inline filters, external-filter templates, dashboard filter bars, or table toolbars, always use `size="sm"` where supported and `hideInlineError`. `size="sm"` keeps dense surfaces compact; `hideInlineError` prevents `<mat-error>` text from expanding the row, header, or toolbar and instead uses the compact error icon/tooltip.

```html
<sd-table [option]="tableOption">
  <ng-template sdTableCellDef="quantity" let-row>
    <sd-input-number size="sm" hideInlineError type="positive" [precision]="0" [(model)]="row.quantity"> </sd-input-number>
  </ng-template>

  <ng-template sdTableCellDef="status" let-row>
    <sd-select size="sm" hideInlineError [items]="statusList" valueField="code" displayField="name" [(model)]="row.status"> </sd-select>
  </ng-template>

  <ng-template sdTableCellDef="note" let-row>
    <sd-input size="sm" hideInlineError [(model)]="row.note"> </sd-input>
  </ng-template>
</sd-table>
```

### Display pipes in custom cells

Prefer shared pipes instead of app-local formatting pipes or ad-hoc template expressions.

```html
<ng-template sdTableCellDef="amount" let-row> {{ row.amount | sdFormatNumber : 0 | sdView }} </ng-template>

<ng-template sdTableCellDef="issueDate" let-row> {{ row.issueDate | sdFormatDate | sdView }} </ng-template>

<ng-template sdTableCellDef="updatedAt" let-row> {{ row.updatedAt | sdFormatDatetime : 'dd/MM/yyyy HH:mm' | sdView }} </ng-template>

<ng-template sdTableCellDef="tags" let-row> {{ row.tags | sdView }} </ng-template>
```

### Dense filter/cell controls

When rendering SD form controls in `sdTableFilterDef`, editable cells, external-filter custom templates, dashboard filter bars, or compact table toolbars, use `size="sm"` where supported and `hideInlineError`. This prevents Material's inline error/subscript row from increasing header, row, or toolbar height; validation remains available through the compact error icon/tooltip.

```html
<ng-template sdTableFilterDef="keyword" let-filter let-update="update">
  <sd-input size="sm" hideInlineError [(model)]="filter.keyword" (keyupEnter)="update()"></sd-input>
</ng-template>
```

## Visual cues (helps agent map screenshots → component)

- **Toolbar** (top): external-filter form (collapsible), reload button, column-config gear, export menu, selection-action bar (when rows selected).
- **Header row**: column titles, sort arrows on sortable columns, inline filter row beneath header (input/select/daterange depending on column `type`). Sticky on scroll.
- **Body rows**: standard row height, hover highlight, per-row commands cell on the **right** (default) or `command.align='left'`. Tree expand toggle (`chevron_right` collapsed / `expand_more` expanded, light hover bg) is **embedded in the first column** — the `sdIndex` cell when `index.enabled`, otherwise the first data column — indented per depth (no separate toggle column). Expand caret for master-detail when `expand` configured.
- **Selection column**: leftmost checkbox column when `selector.visible`. Header checkbox toggles select-all.
- **Selection-action bar** (`<selector-action>`, floating): opens only when rows are selected **and** `selector.actions` resolves to at least one action the selection is allowed to run. A table with `selector.visible` but no `actions` never floats the bar — it would restate the checkbox state with `×` as its only control; deselect through the checkboxes instead. The per-row allow-list still applies, so a selection mixing rows with different permitted actions can resolve to zero and keep the bar closed.
- **Sticky columns**: any column with `fixed: true` stays pinned while horizontal scroll happens; rendered with a subtle box-shadow on the boundary (via `StickyShadowDirective`).
- **Group rows**: spanning row with HTML rendered from `group.htmlTemplate`, separating sub-sections.
- **Empty state**: shows blank body; loading state shows centered Material spinner.
- **Pagination bar** (bottom): "Đang hiển thị 1-50/1.234" + page-size selector + first/prev/next/last buttons. Vietnamese labels via `SdTablePaginatorIntl`.
- **Drag handle** (when `rowReorder.enabled`): leftmost icon column `sdReorder` with the configured icon (default `drag_indicator`); rows can be reordered within the same group.
- **Row-number (STT) column** (when `index.enabled`): sticky `sdIndex` column rendering the global row number (`pageIndex * pageSize + i + 1`). Sits after selector/tree/command(left)/group, before data columns. Title defaults to `'#'`, width `'50px'`. Hidden on group spanning rows.
- **Column resize handle** (when `config.resizable`): a 6px transparent strip at the right edge of each data-column header. Cursor changes to `col-resize` on hover; a subtle dark overlay appears on hover for affordance. The handle does not show on `sdSelection`/`sdCommand`/`sdGroup`/`sdSubInformation`/`sdReorder`/`sdIndex` columns or on `type: 'children'` parent headers.

## Configuration provider

```ts
provide: SD_TABLE_CONFIGURATION,
useValue: {
  paginate: { pageSize: 50, pages: [10, 25, 50, 100], showFirstLastButtons: true },
  filter: { hideInlineFilter: false, operator: { default: { string: 'CONTAIN', ... }, list: { ... } } },
} satisfies ISdTableConfiguration
```

Per-table options always override these defaults.

## Export button label (i18n)

The export button's label comes from the i18n catalog, so it follows the app language — it used to be the hard-coded English string `Export`, which showed up untranslated for Vietnamese users.

| Key | vi | en |
|---|---|---|
| `core.component.table.export` | Xuất dữ liệu | Export |
| `core.component.table.exporting` | Đang xuất...{percent}% | Exporting...{percent}% |
| `core.component.table.export-excel` | Xuất excel | Export Excel |
| `core.component.table.export-csv` | Xuất CSV | Export CSV |

`TableExportService.exportTitle` is a `computed()` over the current language plus the export progress; drive progress with `setExportProgress(percent | null)` (`null` restores the idle label). Do not assign to `exportTitle` — it is no longer writable.

## Permission gating

None built in. The package ships no license or permission gate of its own. Bulk actions (`selector.actions`) and per-row `commands` are gated at the application level (hide via the `hidden(row)` predicate, or omit the option when composing it). To gate the whole table, wrap the host with `*sdPermission`.

## Examples

### 1. Server-paginated list with filters, selection, commands, export — typical CRUD list page

```html
<sd-page title="Quản lý nhân viên">
  <ng-container headerRight>
    <sd-button
      *sdPermission="'HR_C_EMPLOYEE_CREATE'; sdPermissionKey: 'hr'"
      title="Tạo mới"
      type="fill"
      color="primary"
      prefixIcon="add"
      (click)="onCreate()">
    </sd-button>
  </ng-container>

  <sd-table #tableRef autoId="employee" [option]="tableOption"></sd-table>
</sd-page>
```

```ts
import { SdTable, SdTableOption } from '@sdcorejs/angular/components/table';

@ViewChild(SdTable) tableRef!: SdTable<Employee>;

tableOption: SdTableOption<Employee> = {
  type: 'server',
  key: 'hr.employee.list', // persists user column-config

  items: async (filterReq, pagingReq) => this.api.searchEmployees(pagingReq),

  columns: [
    { field: 'code', title: 'Mã NV', type: 'string', width: '120px', fixed: true,
      sortable: true, filter: { operator: { enable: true, default: 'CONTAIN' } } },

    { field: 'fullName', title: 'Họ và tên', type: 'string', sortable: true,
      cell: { copiable: true, truncate: { enable: true, type: 'tooltip' } },
      click: (_, row) => this.onView(row) },

    { field: 'department.name', title: 'Phòng ban', type: 'lazy-values',
      option: {
        items: this.api.searchDepartments,
        valueField: 'id',
        displayField: 'name',
        selection: 'MULTIPLE',
      } },

    { field: 'status', title: 'Trạng thái', type: 'values',
      option: { items: STATUS_LIST, valueField: 'value', displayField: 'label' },
      useBadge: (val) => ({ color: val === 'ACTIVE' ? 'success' : 'warn',
                            title: val === 'ACTIVE' ? 'Hoạt động' : 'Ngưng' }) },

    { field: 'salary', title: 'Lương', type: 'number', align: 'right', sortable: true },

    { field: 'hiredAt', title: 'Ngày vào', type: 'date', sortable: true,
      filter: { type: 'daterange' } },
  ],

  filter: {
    externalFilters: [
      // Global search only. Do not repeat `status` here because it already has an inline column filter.
      { field: 'q', type: 'string', defaultOperator: 'CONTAIN' },
    ],
  },

  selector: {
    visible: true,
    actions: [
      { icon: 'check_circle', title: 'Kích hoạt', color: 'success', type: 'fill',
        click: (rows) => this.onActivate(rows) },
      { icon: 'block', title: 'Khóa', color: 'warn', type: 'outline',
        click: (rows) => this.onDeactivate(rows) },
    ],
    message: (rows) => `Đã chọn ${rows?.length ?? 0} nhân viên`,
  },

  command: {
    align: 'right',
    commands: [
      { icon: 'visibility', title: 'Xem', click: (row) => this.onView(row) },
      { icon: 'edit', title: 'Sửa', color: 'primary',
        hidden: (row) => !row.canEdit, click: (row) => this.onEdit(row) },
      { icon: 'delete', title: 'Xóa', color: 'warn',
        click: (row) => this.onDelete(row) },
    ],
  },

  paginate: { pageSize: 50, pages: [25, 50, 100, 200] },

  export: {
    type: 'default',
    fileName: 'danh-sach-nhan-vien',
    visible: 'ALL',
    items: (filterReq) => this.api.exportEmployees(filterReq),
  },

  reload: { visible: true },
  config:  { visible: true },
  sort:    { enable: true },
  style:   { shadow: true, maxHeight: 'calc(100vh - 280px)' },
};
```

### 2. Local-mode table with row expansion and grouping

```ts
tableOption: SdTableOption<Order> = {
  type: 'local',
  items: () => this.cachedOrders, // sync array
  columns: [
    { field: 'orderNo', title: 'Số đơn', type: 'string', fixed: true },
    { field: 'customerName', title: 'Khách hàng', type: 'string' },
    { field: 'total', title: 'Tổng tiền', type: 'number', align: 'right' },
  ],
  group: {
    fields: ['status'],
    htmlTemplate: rows => `<strong>${rows[0].status}</strong> &nbsp; (${rows.length} đơn)`,
  },
  expand: {
    multiple: false,
    onExpand: row => this.api.getOrderDetails(row.id), // returns Promise
  },
};
```

```html
<sd-table [option]="tableOption">
  <ng-template sdTableExpandDef let-row>
    <div class="p-3">
      <div>Mã KH: {{ row.customerCode }}</div>
      <div>Ghi chú: {{ row.note }}</div>
      <!-- row.meta.expand.data is the resolved Promise -->
    </div>
  </ng-template>
</sd-table>
```

### 3. Custom cell template with badge + commands

```html
<sd-table [option]="tableOption">
  <ng-template sdTableCellDef="status" let-row>
    <sd-badge
      [title]="row.statusLabel"
      [color]="row.status === 'APPROVED' ? 'success' : 'warn'"
      [icon]="row.status === 'APPROVED' ? 'check' : 'hourglass_empty'">
    </sd-badge>
  </ng-template>
</sd-table>
```

### 4. Custom inline filter for a column

```html
<sd-table [option]="tableOption">
  <ng-template sdTableFilterDef="customField" let-filter let-update="update">
    <sd-input size="sm" hideInlineError [(model)]="filter.customField" (modelChange)="update()"></sd-input>
  </ng-template>
</sd-table>
```

### 5. Resizable columns with min/max constraints and remote profile sync

```ts
tableOption: SdTableOption<Employee> = {
  type: 'server',
  key: 'hr.employee.list', // required for resize to persist across reloads
  items: (req, paging) => this.api.search(paging),

  columns: [
    // Constrained: user cannot shrink below 80px or grow above 300px
    { field: 'code', title: 'Mã', type: 'string', width: '120px', minWidth: '80px', maxWidth: '300px' },
    // Unconstrained: free resize (clamped only to default min 40px)
    { field: 'name', title: 'Họ tên', type: 'string', width: '220px' },
    { field: 'salary', title: 'Lương', type: 'number', width: '140px', align: 'right' },
  ],

  config: {
    visible: true, // also show the gear button so user can reset
    resizable: true, // enable drag handle on data columns
    onResize: (field, width, columnWidth) => {
      // Optional: sync to a remote user profile so widths follow the user
      // across browsers/devices. Fires once per mouseup.
      console.log(`User resized '${field}' → ${width}`);
      console.log('Current column widths:', columnWidth);
      // e.g. { code: '120px', name: '320px', salary: '140px' }
      this.userPrefs.saveTableLayout('hr.employee.list', columnWidth);
    },
  },
};
```

The drag handle hides automatically for columns excluded from resize. Widths reload from localStorage on next page visit; calling `tableRef.detectChanges()` is not necessary — the component's storage subscriber updates the live configuration signal in place without re-fetching data.

## Anti-patterns

- ❌ Recreating `tableOption` on every change-detection cycle (e.g. computing it inside the template) — every new reference triggers a full re-init via the `effect`. Keep it as a class property.
- ❌ Using `type: 'local'` for ≥ 1k rows that come from the server — paging happens client-side, so all rows are fetched and held in memory. Switch to `type: 'server'`.
- ❌ Skipping `option.key` on a customer-facing list — without it, user column-config is not persisted across page reloads.
- ❌ Turning on `selector.preserveSelection` (or `tree`) on a `type: 'server'` table without `option.rowKey` — a re-fetch produces new row objects, so the ids change and the selection / expand state is not restored. See **Row identity**.
- ❌ Returning a fresh object from `style.rowCss` that encodes state the table cannot see — `rowCss` is resolved **once per render** (and after a tree expand), not on every change-detection pass. Trigger a `reload()` when the styling inputs change.
- ❌ Wiring per-row navigation via the cell `click` callback when the user expects right-click "open in new tab" — use a column with `htmlTemplate` rendering an `<a [sdHref]>` instead.
- ❌ Defining `commands` AND `command.commands` simultaneously — `command` is the newer API; pick one to avoid confusion.
- ❌ Putting a heavy server-side `items()` in front of a daterange filter without honoring the `BETWEEN` / `GREATER_OR_EQUAL` operators emitted in `pagingReq.filters` — the table builds the request correctly; your backend must accept that operator vocabulary.
- ❌ Using `'lazy-values'` with `selection: 'MULTIPLE'` and forgetting to provide `views` — bulk-display of saved values needs `views(values) => K[]` to render labels for already-stored ids.
- ❌ Mutating row data in-place after a server fetch and expecting the table to redraw — call `tableRef.reload()` or replace the dataset reference.
- ❌ Setting `expand.always: true` AND `expand.onExpand` — `always` keeps every row expanded; `onExpand` is bypassed for toggling but still called once for each row's data on first render. Decide which mode you want.
- ❌ Relying on `output` events — there are none. Use `option`-level callbacks or `@ViewChild` API.
- ❌ Setting `config.resizable: true` without `option.key` and expecting widths to survive reload — without `key` the storage falls back to session storage hashed from the option object; safe for prototypes, not for persistent UX.
- ❌ Using `column.minWidth: '30%'` (or any non-`px` unit) and expecting the resize clamp to honor it — the directive's parser only accepts `'NNpx'`. Other units render fine for static width but are treated as "no clamp" by the resize logic (falls back to default `min = 40px`).
- ❌ Writing to `column.width` programmatically while `config.resizable: true` on a table that already has `option.key` — the persisted user width takes precedence over `column.width` in `option`. Reset via the gear dialog → "Đưa về mặc định" if you want option-defined widths back.
- ❌ Mutating `columnWidth` object inside `onResize` callback expecting it to affect rendering — the snapshot is read-only intent; to push new widths back into the table, set them via `option.columns[i].width` AND clear the user storage (or write your own keyed storage).
- ❌ Rendering statuses with custom pill CSS inside cells — use `useBadge` or a projected `<sd-badge>`.
- ❌ Placing default `md`/`lg` form controls inside table filters or editable cells — use `size="sm"` for dense table UI.
- Built-in inline column filters and external filters opt their input/number/date/datetime controls into `clearable`, so users can clear an active filter even though those controls default `clearable` to `false` elsewhere.

- ❌ Forgetting to import projected-template directives (`SdTableCellDefDirective`, `SdTableFilterDefDirective`, `SdTableTitleDefDirective`, `SdTableFooterDefDirective`, `SdTableExpandDefDirective`) in a standalone host component.
- ❌ Rendering SD form controls inside table cells without `hideInlineError`; inline `<mat-error>` text expands rows and makes table density unstable.
- ❌ Creating custom number/date/datetime pipes for table cells; use `sdFormatNumber`, `sdFormatDate`, `sdFormatDatetime`, then `sdView`.
- ❌ Writing `{{ value || '--' }}` in cells; it hides valid `0`/`false` values. Use `sdView`.

- Avoid duplicating the same field in both `columns[].filter` and `filter.externalFilters`; generated list pages should choose one filter surface per field. Prefer the column filter when the field is already visible as a column; reserve external filters for global search or non-column criteria.

## E2E test attributes

Rendered directly on the `<sd-table>` host element:

| Attribute      | Value                       | Source                                                        |
| -------------- | --------------------------- | ------------------------------------------------------------- |
| `data-autoid`  | `components-table-<autoId>` | input `autoId`                                                |
| `data-loading` | `"true"` / `"false"`        | `loading` signal (toggled by paging + external-filter submit) |

Selector example:

```ts
await expect(page.locator('sd-table[data-autoid="components-table-employees"]')).toHaveAttribute('data-loading', 'false');
```

### Inner elements (derived autoIds)

All interactive children derive their autoId from the table base `components-table-<autoId>` and are emitted by `<sd-button>` as `components-button-<base>-<suffix>`. **They render only when the table `autoId` input is set** — otherwise the attribute is omitted (no `undefined…` ids). Let `B = components-table-<autoId>`:

| Element                                               | autoId (`data-autoid`)                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Reload button                                         | `components-button-<B>-reload`                                                                               |
| Export button (custom / menu / excel-only / csv-only) | `components-button-<B>-export` / `-export-excel` / `-export-csv`                                             |
| Export menu items (Excel / CSV)                       | `<B>-export-excel` / `<B>-export-csv`                                                                        |
| Config (settings) button                              | `components-button-<B>-config`                                                                               |
| Mobile filter open button                             | `components-button-<B>-mobile-filter-open`                                                                   |
| Tree expand toggle (per row)                          | `components-button-<B>-tree-toggle-<rowId>` (native `button`, `data-autoid`; embedded in first/index column) |
| Detail expand toggle (per row)                        | `components-button-<B>-expand-<rowId>`                                                                       |
| Group collapse toggle (per group)                     | `components-button-<B>-group-toggle-<groupKey>`                                                              |
| Per-row command                                       | `<B>-command-<rowKey>-<commandKey>` (see `desktop-command`)                                                  |
| Selector-action: action buttons                       | `components-button-<B>-action-<index>`                                                                       |
| Selector-action: clear-selection (×)                  | `components-button-<B>-clear-selection`                                                                      |
| Config modal: skip / reset / apply                    | `components-button-<B>-config-skip` / `-config-reset` / `-config-apply`                                      |
| External filter: clear / setting / submit             | `components-button-<B>clear` / `…setting` / `…submit`                                                        |

`<rowId>` / `groupKey` come from `SdTableItem.meta.id` / `meta.group.key`, guaranteeing uniqueness per row/group. **Set `option.rowKey` if you want `<rowId>` to be a readable, deterministic value** (e.g. `…-expand-42`) — without it the id is an internally generated `sd-row-<n>` that changes between page loads and is unusable as a stable E2E selector. See **Row identity** above. Group toggles use `meta.group.key` (a hash of the group field values) and stay deterministic regardless. The base autoId is passed down to `external-filter`, `mobile-filter`, `column-filter`, `desktop-command`, `selector-action`, and `config` via their `[autoId]` input.

> Not yet covered: `popup-export` (export-template modal) — its buttons have no autoId (follow-up).

## Accessibility

- **Sort state belongs to the semantic header cell.** For an enabled sortable leaf, `aria-sort` is emitted only on the native `<th>` and the title-only control supplies the accessible name plus mouse/Enter/Space activation. Inline filters and resize handles remain siblings outside that control, so they cannot become nested interactive content or trigger sorting. Disabled, omitted and non-sortable paths emit no sort control, focus target, `aria-sort`, or icon. The Material arrow is not instantiated; the existing SdTable background indicator is the single visible icon in unsorted, ascending and descending states.
- **Loading is announced.** The spinner overlay is `role="status" aria-live="polite"` with an i18n `aria-label`, and the scroll container gets `aria-busy="true"` while `loading()` is set. Previously an async fetch produced no announcement whatsoever.
- **Empty state is announced.** The `no-results` / `choose-filter` / `no-data` block is `role="status" aria-live="polite"`, so a fetch that returns zero rows is reported instead of leaving the user waiting silently.
- **Row commands are named.** The per-row command buttons (`desktop-command`) dropped `aria-hidden="true"` — they are real `<button>`s that still took tab focus while announcing nothing, because they render an icon with no text. They now expose `aria-label` from the command title, plus `aria-haspopup="menu"` on the submenu trigger.
- **Clickable HTML cells are keyboard reachable.** A cell whose display config supplies `click` renders as `role="button"` + `tabindex="0"` with Enter/Space mirroring the click (it previously carried `aria-hidden="true"`). The handler ignores key events bubbling from consumer-supplied markup inside the cell, so nested controls do not double-fire.

## Related

- `<sd-button>`, `<sd-quick-action>` — used in toolbar / per-row commands
- `<sd-badge>` — used inside cells via `useBadge` or custom cell templates
- `<sd-page>`, `<sd-section>` — typical wrappers for a list page
- `*sdPermission` — for permission-gated rows / commands
- `SD_TABLE_CONFIGURATION` — global default config provider
- `SdSearch<T>` (forms autocomplete pattern) — used by `'lazy-values'` columns
- `PagingReq`, `Operator` — request payload contract for server-mode tables
- Skill ref `30-list-page.md` (if present) — the recommended page-level scaffold using `<sd-table>`


## Mobile row cards (`sdTableRowMobileDef`)

Import `SdTableRowMobileDefDirective` with `SdTable` from `@sdcorejs/angular/components/table` (both are also exported by the components barrel). Project **one** mobile template directly into each table. No provider or additional mobile flag is required. Nested tables own their templates and selection independently.

With a template, `SdViewportService.isMobile()` selects the card renderer; its configured Core breakpoint is shared with the rest of the application (default: width below 768px). Without a template, the existing table renderer remains in use at every width. Only one renderer exists at a time. `MatSort`, paginator, filters, data, selection and expanded rows belong to the same table instance: resizing neither fetches data nor reapplies `defaultSelected`.

### Complete standalone consumer

```ts
import { DecimalPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  SdTable,
  SdTableOption,
  SdTableRowMobileDefDirective,
} from '@sdcorejs/angular/components/table';

interface Order {
  id: string;
  customerName: string;
  total: number | null;
  locked: boolean;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DecimalPipe, SdTable, SdTableRowMobileDefDirective],
  template: `
    <sd-table autoId="orders" [option]="tableOption">
      <ng-template
        [sdTableRowMobileDef]="tableOption"
        let-row="item"
        let-index="index"
        let-selected="selected"
        let-selectionDisabled="selectionDisabled"
        let-autoId="autoId">
        <strong>{{ row.id }} · {{ row.customerName }}</strong>
        <p>{{ row.total == null ? '—' : (row.total | number) }} ₫</p>
        <small>{{ index + 1 }} · {{ selected ? 'Đã chọn' : 'Chưa chọn' }}</small>
        @if (selectionDisabled) { <p>Không thể chọn đơn này</p> }
        <button type="button" (click)="message.set('Ghi chú: ' + row.id)">Ghi chú</button>
      </ng-template>
    </sd-table>
    <p role="status">{{ message() }}</p>
  `,
})
export class OrdersComponent {
  readonly message = signal('');
  readonly orders: Order[] = [
    { id: 'DH-001', customerName: 'An', total: 250000, locked: false },
    { id: 'DH-002', customerName: 'Bình', total: null, locked: true },
  ];
  readonly tableOption: SdTableOption<Order> = {
    type: 'local',
    rowKey: 'id',
    items: () => this.orders,
    mobile: { rowLabel: row => `${row.id} · ${row.customerName}` },
    columns: [
      { field: 'id', type: 'string', title: 'Mã đơn', sortable: true },
      { field: 'customerName', type: 'string', title: 'Khách hàng' },
      { field: 'total', type: 'number', title: 'Tổng tiền' },
    ],
    sort: { enable: true },
    paginate: { pageSize: 10 },
    selector: {
      visible: true,
      preserveSelection: true,
      disabled: row => !!row?.locked,
      actions: [{ title: 'Xử lý', click: (rows = []) => this.process(rows) }],
    },
    command: {
      commands: [{ title: 'Xem', click: row => this.message.set(`Xem ${row.id}`) }],
    },
  };

  async process(rows: Order[]): Promise<void> {
    // Replace this demonstration with the application's request and outcome handling.
    await new Promise<void>(resolve => setTimeout(resolve, 300));
    this.message.set(`Đã xử lý: ${rows.map(row => row.id).join(', ')}`);
  }
}
```

The bare attribute `sdTableRowMobileDef` is supported, including under `strictTemplates`, but its `item` type defaults to **`any`**: Angular cannot infer a projected directive's generic from the parent's `[option]`. Bind `[sdTableRowMobileDef]="tableOption"` as above to infer `Order` and reject nonexistent properties at compilation. The binding is a type witness, not a separate source of rows. Always pass the owning table's option. Other context properties retain their declared types in both forms.

### Template context

The exported `SdTableRowMobileDefContext<T>` contains:

| Property | Type | Meaning |
| --- | --- | --- |
| `item` | `T` | Business data, not `SdTableItem<T>`. |
| `index` | `number` | Zero-based position among rendered data rows in this page, excluding group headers and expanded-detail blocks. Visible tree children count as data rows. |
| `selected` | `boolean` | Current table selection. |
| `selectionDisabled` | `boolean` | Whether this row can currently be selected. A selected row remains removable even if its eligibility later changes. |
| `autoId` | `string \| undefined` | Table auto-id prefix plus `-mobile-row-<rowId>`; also assigned to the card's `data-autoid`. Absent when table `autoId` is absent. |

Core renders the card frame, selector, command trigger, tree/group/expand controls and action bar. The compact 16px checkbox/radio sits at the absolute top-left corner with a 44px touch target; the command trigger occupies the top-right corner. The body reserves space for these controls without a separate selector row. Browsing starts directly with cards, without a toolbar or zero-selection banner above them. Do not duplicate selection state or add a wrapping button. Links, buttons, inputs, labels, selects, contenteditable controls and nested tables work independently, without consumer `stopPropagation()`. Enter/Space on a focused card matches body activation; pointer scrolling, drag handles and text selection do not activate it.

`mobile.rowLabel(row)` supplies the command title and accessible selector/command labels. Empty/nullish labels fall back to a primitive `rowKey` value and then a one-based row ordinal across pages. Internal generated identities and guessed business fields are never used as visible labels.

### Browsing, selection and actions

With commands configured and no selection, tapping non-interactive card content or `⋯` opens that row's commands without selecting it. Ticking a selector closes row commands and enters selection mode, even for one selected row. Body taps then toggle selection; `⋯` is hidden. Clearing the final row returns to browsing without reopening an old command.

Without row commands, body taps select immediately. `selector.single` uses radio controls and replaces the old selection; selecting the active radio again leaves it selected. Use **Clear selection** to clear it. A hidden selector has no selection control or body-selection behavior. `defaultSelected` is reflected on the first mobile render.

**Select this page** is in the footer while browsing. Once rows are selected, it moves into the contained `SdQuickAction` alongside the selected count and the labelled clear icon; no duplicate selection header is rendered above the list. This selection bar remains available even without bulk actions. It uses the existing eligible page scope: group members on this page and visible, loaded tree rows. It does not select server results outside the page or unopened/unloaded tree children. Group toggles retain their own group scope. Empty eligibility is unchecked; partial selection is indeterminate. Deselecting this page retains off-page selection. **Clear selection** (`table.onClearSelection()`) clears the complete selection, including preserved rows and cached tree children.

For `preserveSelection`, provide a stable `rowKey` with server data. The summary reports the total selected count and the count on this page when they differ. Callbacks receive the complete selection, including preserved rows. Bulk eligibility is intersected over all selected rows; a bulk callback never silently receives a filtered subset. Incompatible grouped actions do not become compatible merely because they share a parent title. A row with disabled selection can still expose eligible row commands.

Each table owns one contained `SdQuickAction`: either the active row's commands or the selected rows' actions. At most two short actions fit directly; the rest remain in declaration order under **More**, with group headings, disabled state, labels, icons, font sets, semantic colors and HTML commands. Long labels wrap in the Material bottom sheet. The bar header has an icon button labelled **Close** for row commands or **Clear selection** for selection. Optional `selector.message` appears below the count and page selector. Closing More/Escape closes the sheet and preserves selection. Focus returns to the trigger, or to the table if that trigger was removed.

Changing data, filtering, paging or calling `table.detectChanges()` after an in-place edit invalidates row commands. Async `hidden` results are tied to their row and render revision. Renderer changes, owner destruction and enclosing Core modal/drawer closure dismiss owned sheets. Tables keep independent state even when Material replaces a previously open sheet.

### Async results belong to the consumer

Row callbacks still receive `row`; bulk callbacks receive `selectedRows`. Existing `void` callbacks remain supported. If a callback returns a Promise, duplicate actions are disabled until it settles; rejection shows an error and retains selection. Core does not interpret success or clear selection automatically, even after a resolved Promise.

After successful processing, update your business data and `await table.reload()`; use `table.detectChanges()` if only in-place display/eligibility values changed. Call `table.onClearSelection()` only when the application intends to clear everything. For partial success with preservation, remove only confirmed successes using the existing selection API before reloading:

```ts
const succeededIds = new Set(result.succeededIds); // authoritative server outcome
for (const row of table.selectedTableItems()) {
  if (succeededIds.has(row.data.id)) {
    row.meta.selector!.isSelected = false;
    table.onSelect(row); // updates the preserved map, including rows outside this page
  }
}
await table.reload(); // failed rows remain selected when preserveSelection is enabled
```

The consumer owns error reporting, retries and `defaultSelected` predicates; update a default predicate too if it would otherwise reselect a processed row on a new load.

### Desktop-to-mobile mapping

| Feature / slot | Card view |
| --- | --- |
| Columns, `sdTableCellDef`, `sdTableTitleDef` | Columns continue to define filters, sort, configuration and export. The mobile row template supplies the body instead of desktop cell templates. Custom titles remain in footer/configuration; the sort menu uses column title text. |
| `sdTableFilterDef`, inline filters | Existing mobile filter drawer, sharing the same filter register and operators. External filters also move into this drawer; there is no separate filter form above the card list. |
| Sort | Footer menu cycles ascending → descending → clear through the same `MatSort` and request fields. Only configured sortable leaf columns are listed. |
| Pagination, reload, configuration, export | Shared controls below the list; export uses business rows and configured columns, never card DOM. |
| `sdTableCommandHeaderDef` | Shared footer beside filter, sort and other table tools. |
| `sdTableFooterDef` | Labelled summary below cards; the original `{ items, column }` scope is unchanged (`items` are current-page `SdTableItem` wrappers). |
| `sdTableExpandDef` | Dedicated Details button and inline detail block; keeps its existing `{ item: SdTableItem }` context, `always`, `multiple`, disabled and async behavior. |
| `sdTableGroupDef` | Separate group header using the existing group context and selection/expand controls. |
| Tree | Indentation, level labels and separate expand/collapse controls; lazy children are fetched only on expansion. |
| Reorder | Dedicated CDK drag handle; respects existing disabled/group/tree scope and callbacks. |
| `[sdTableTop]` | Remains above the table content. |

The action bar keeps a layout footprint inside the owning scroll container, so the final card and paginator remain reachable. It follows Core theme tokens and safe-area insets. Applications with their own bottom navigation may set `--sd-table-mobile-bottom-offset` on the table to the occupied height. Template authors should allow wrapping and provide their own null-value presentation, as in the example.
