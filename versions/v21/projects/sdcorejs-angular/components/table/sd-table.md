# `<sd-table>`

**Type**: Component (generic over `T`)
**Selector**: `sd-table`
**Import path**: `@sdcorejs/angular/components/table` (or barrel: `@sdcorejs/angular/components`)
**Class**: `SdTable<T = unknown> extends SdBaseSecureComponent`
**Standalone**: yes
**Change detection**: `OnPush`

## One-line purpose
The standard list/table component of SDCoreJS â€” renders tabular data with paging, sorting, inline column filters, external (toolbar) filters, multi-select with bulk actions, row commands, expansion, grouping, sticky columns, drag-and-drop row reorder, **drag-to-resize columns with persistence**, Excel/CSV export, and column-config persistence. Used on virtually every list page.

## When to use
- Any list page (master data, transactions, search results)
- Both **local** mode (`type: 'local'`, full client-side data) and **server** mode (`type: 'server'`, paged + filtered + sorted server-side)
- Multi-select operations on rows (approve, delete, export, â€¦)
- Per-row commands (edit, view detail, custom actions)
- Hierarchical / grouped views (with `option.group`) and parent-detail expansion (with `option.expand`)
- Pages that need user-customizable column visibility/order/width (config saved in storage when `option.key` is set)
- Pages that need drag-to-resize columns at runtime (set `option.config.resizable: true`; width persists into the same storage entry as the column-config dialog)

## When NOT to use
- For â‰¤ 5 simple cards / a small read-only list â†’ use a regular Angular `@for` with custom layout
- For "key-value detail" display â†’ use `<sd-view>`, not a 1-row table
- For tree-structured infinite-depth data â†’ this only supports header grouping (column-children) and one level of row expansion, not recursive trees
- For editable spreadsheets â€” cell editing is not first-class; use a different grid library if heavy in-place editing is required

## The contract: `[option]` is the only required input

Everything is configured via the `SdTableOption<T>` object passed to `[option]`. The option discriminates on `type: 'local' | 'server'`.

### `SdTableOption<T>` (top-level)

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `type` | `'local' \| 'server'` | yes | Discriminator. |
| `items` (local) | `() => T[] \| Promise<T[]>` | yes (local) | Returns the full dataset. Filtering/sorting/paging done client-side. |
| `items` (server) | `(filterReq, pagingReq) => Promise<{items: T[]; total: number}>` | yes (server) | Server fetches; both `SdTableFilterRequest` and `PagingReq` are passed. |
| `onFilter` (server) | `(filterReq, { externalFilterValid }) => void` | no | Called BEFORE each server fetch; useful to cancel / log / sync URL. |
| `columns` | `SdTableColumn<T>[]` | yes | Column definitions (see schema below). |
| `key` | `string` | no | Storage key for persisted user column-config (visibility/order/width). |
| `config` | `TableOptionConfig` | no | `{ visible?, resizable?, onResize? }` â€” gear button, drag-to-resize, resize callback. See **Column resize** section. |
| `selector` | `SdTableOptionSelector<T>` | no | Multi-select + bulk actions. |
| `expand` | `SdTableOptionExpand<T>` | no | Per-row expansion (master-detail). |
| `sort` | `{ enable?: boolean }` | no | Master switch for sortable headers. |
| `paginate` | `SdTableOptionPaginate` | no | `{ pageSize?, pages?, showFirstLastButtons?, hidePageSize?, hidden? }`. |
| `reload` | `{ visible?, onReload? }` | no | Show reload button + callback when data refreshes. |
| `export` | `SdTableOptionExportDefault \| SdTableOptionExportCustom` | no | Excel/CSV/Custom export config. |
| `group` | `{ fields: string[]; htmlTemplate: (rows) => string }` | no | Group rows by `fields` and render an HTML group header. |
| `filter` | `SdTableOptionFilter` | no | `{ hideInlineFilter?, externalFilterPerRow?, manualFilter?, hideExternalFilterToolbar?, externalFilters?, operatorChange? }`. |
| `commands` | `SdTableCommand<T>[]` | no | Per-row action buttons. |
| `command` | `{ align?: 'left' \| 'right'; commands?: SdTableCommand<T>[] }` | no | Newer per-row commands API with alignment. |
| `style` | `{ shadow?, maxHeight?, minHeight?, rowCss? }` | no | Shadow toggle, scroll bounds, per-row CSS. |
| `rowReorder` | `{ enabled?, onChange?, icon?, disabled?(row,i) }` | no | Drag-and-drop row reordering. Respects groups. |

### Column schema (`SdTableColumn<T>`)

A discriminated union over `type`. All variants share `SdTableColumnBase`:

| Field | Type | Notes |
| --- | --- | --- |
| `field` | `NestedKeyOf<T>` (or `string` for `'children'`) | Nested key supported (e.g. `'user.name'`). |
| `type` | `'string' \| 'number' \| 'boolean' \| 'date' \| 'datetime' \| 'time' \| 'values' \| 'lazy-values' \| 'children'` | Determines cell renderer + filter UI + sort comparator. |
| `title` | `string \| { title: string; templateRef?: TemplateRef<any> }` | Header text or templated header. |
| `cell` | `{ templateRef?, copiable?, truncate?: { enable?, type?: 'more' \| 'tooltip' } }` | Custom cell renderer / copy-on-hover / truncation behavior. |
| `width` / `minWidth` / `maxWidth` | `string` | CSS sizes. |
| `hidden` | `boolean` | Always hidden (not even in column-config). |
| `invisible` | `boolean` | Hidden by default but toggleable in column-config. |
| `fixed` | `boolean` | Sticky column. |
| `align` | `'right'` | Right-align (numbers, currency). |
| `htmlTemplate` | `(value, row) => string` | HTML string renderer (sanitized via `sdSafeHtml`). |
| `transform` | `(value, row, { isExport? }) => string \| Promise<string>` | Format the value (display + export). |
| `tooltip` | `(value, row) => string` | Hover tooltip on the cell. |
| `click` | `(value, row) => void` | Cell click handler â€” turns cell into a link. |
| `sortable` | `boolean` | Enable sort on this column (also requires `option.sort.enable`). |
| `filter` | `{ disabled?, default?, operator?, filterDef? }` | Inline column filter. `operator: { default?, enable?, list? }` controls the operator dropdown. `filterDef` is a custom `TemplateRef`. |
| `export` | `{ disabled?, description? }` | Export-specific overrides. |

#### Type-specific column variants

| `type` | Extra fields |
| --- | --- |
| `'string'` | `useBadge?: (value, row) => Badge` |
| `'number'` | `useBadge?`, `filter?: { type?: 'split-number' }` |
| `'boolean'` | `useBadge?`, `option?: { displayOnTrue?, displayOnFalse? }` |
| `'date' \| 'datetime' \| 'time'` | `useBadge?`, `filter?: { type?: 'daterange' \| 'date' \| 'split-date' }` |
| `'values'` | `option: { items: K[] \| Signal<K[]> \| () => Promise<K[]>; valueField; displayField; selection?: 'MULTIPLE' }`, `useBadge?: (value, row, items) => Badge` |
| `'lazy-values'` | `option: { items: SdSearch<K>; valueField; displayField; views?(values) => Promise<K[]>; selection?: 'MULTIPLE' }` |
| `'children'` | `children: SdTableColumnNormal<T>[]` â€” produces a multi-row header with this group on top of its children. |

`Badge` shape: `{ type?, color?, icon?, title? }` â€” maps to a `<sd-badge>` rendered in the cell.

### Config option (`TableOptionConfig`) â€” gear button + column resize

```ts
export interface TableOptionConfig {
  visible?: boolean;       // show the gear (column-config) button in the toolbar
  resizable?: boolean;     // enable drag-to-resize on data column headers
  onResize?: (field: string, width: string, columnWidth: Record<string, string>) => void;
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `visible` | `boolean` | Shows the column-config (âš™) button in the toolbar. The dialog lets users toggle visibility, drag-reorder columns, and rename headers. |
| `resizable` | `boolean` | When `true`, a 6px drag handle appears on the right edge of every **data** column header. Cursor switches to `col-resize` on hover; dragging updates the width live (mousemove updates inline style outside Angular zone for smoothness) and persists on mouseup. **Excluded from resize:** the special columns `sdSelection`, `sdCommand`, `sdGroup`, `sdSubInformation`, `reorder`, and `type: 'children'` parent header cells. |
| `onResize` | `(field, width, columnWidth) => void` | Fires once per `mouseup`. `field` = column resized, `width` = new width (e.g. `'220px'`), `columnWidth` = snapshot `Record<field, width>` of **all** data columns that currently have a width set (including ones not resized this time). Useful for syncing width state to a remote profile or analytics. |

**Persistence:** When `option.key` is provided, resize writes to the same storage entry used by the column-config dialog (under the prefix `TABLE_CONFIG`). Without a key it falls back to session storage keyed by `Utilities.hash(option)`.

**Reload semantics:** Resizing does **NOT** trigger a data reload, value cache refresh, or filter re-register â€” it only updates the configuration signal locally and writes storage silently (via the new `SdStorage.setSilent`). Safe to use on heavy server-mode tables.

**Width clamp:** During drag, width is clamped to `[column.minWidth, column.maxWidth]`. If either is unset or not a `'NNpx'` string, defaults apply: `minWidth = 40px`, `maxWidth = âˆž`. Other units (`%`, `rem`, â€¦) are ignored by the clamp parser.

### Selector option (`SdTableOptionSelector<T>`)

| Field | Type | Notes |
| --- | --- | --- |
| `visible` | `boolean` | Show the checkbox column. |
| `single` | `boolean` | Radio-style single-select (default is multi-select). |
| `actions` | `SdTableAction<T>[]` | Bulk-action buttons shown when â‰¥ 1 row selected. Each action: `{ icon?, fontSet?, tooltip?, title?, color?, type?, hidden?, isGrouped?, click(selectedItems) }` (or grouped via `children`). |
| `message` | `string \| (selected) => string` | Selection summary text in the action bar. |
| `onSelect` | `(rowData, selectedItems) => void` | Row toggle callback. |
| `onSelectAll` | `(selectedItems) => void` | Header checkbox callback. |
| `disabled` | `(rowData, selectedItems) => boolean` | Per-row disable predicate. |
| `defaultSelected` | `(rowData) => boolean` | Pre-select after each load. |

### Expand option (`SdTableOptionExpand<T>`)
`{ disabled?(row), onExpand?(row) => any \| Promise<any>, multiple?, always? }` â€” `always: true` keeps every row expanded; `multiple` allows multiple expanded simultaneously.

### Filter option (`SdTableOptionFilter`)
`externalFilters?: { field, type: 'string' \| 'boolean' \| 'date' \| 'datetime' \| 'daterange' \| 'select' \| ...; defaultOperator?: Operator; required? }[]` controls the toolbar filter form.

### Commands (`SdTableCommandNormal<T>`)
`{ color?, icon?: string \| (row)=>string, fontSet?, title?: string \| (row)=>string, disabled?: boolean \| (row)=>boolean, hidden?: boolean \| (row)=>boolean \| Promise<boolean>, click(row), htmlTemplate?(row)=>string }`. Group via `{ ... children: SdTableCommandNormal<T>[] }`.

## Inputs (the host element)

| Name | Type | Default | Notes |
| --- | --- | --- | --- |
| `autoId` | `string \| null \| undefined` | `undefined` | Generates `data-autoId="components-table-<value>"` for E2E selectors. |
| `option` | `SdTableOption<T>` (REQUIRED) | â€” | The whole table configuration (see schema above). |

## Outputs
None. All callbacks live inside the `option` object (`onSelect`, `onReload`, `commands[].click`, `expand.onExpand`, `rowReorder.onChange`, `selector.actions[].click`, â€¦). Use a `@ViewChild(SdTable)` ref for imperative API.

## Public API (via template ref)
```ts
@ViewChild(SdTable) tableRef!: SdTable<MyEntity>;
```
- `tableRef.reload(force = true, scrollTop = true)` â€” re-fetch (server) or re-filter (local)
- `tableRef.dataItems: T[]` â€” current rendered rows (data only)
- `tableRef.selectedItems: T[]` â€” current selection
- `tableRef.clearFilter()` â€” clears column + external filters
- `tableRef.setFilter({ columnFilter?, externalFilter? })` â€” programmatically set filter values
- `tableRef.exportExcel(columns?)` / `exportCSV(columns?)` / `exportCustom()` â€” trigger export
- `tableRef.onClearSelection(items?)` â€” clear selected rows (defaults to all)
- `tableRef.detectChanges()` â€” force CD

## Content projection (slots / directive children)
- `[sdTableCellDef]="'<field>'"` â€” custom cell template per column. Inside `<ng-template sdTableCellDef="fieldName" let-row>...</ng-template>`.
- `[sdTableTitleDef]="'<field>'"` â€” custom header template per column.
- `[sdTableFooterDef]="'<field>'"` â€” custom footer cell (totals row). Presence of any footer def turns on the footer row.
- `[sdTableFilterDef]="'<field>'"` â€” custom inline-filter template per column.
- `[sdTableExpandDef]` â€” custom row-expansion (sub-information) template.

## Visual cues (helps agent map screenshots â†’ component)
- **Toolbar** (top): external-filter form (collapsible), reload button, column-config gear, export menu, selection-action bar (when rows selected).
- **Header row**: column titles, sort arrows on sortable columns, inline filter row beneath header (input/select/daterange depending on column `type`). Sticky on scroll.
- **Body rows**: standard row height, hover highlight, per-row commands cell on the **right** (default) or `command.align='left'`. Expand caret on the leftmost column when `expand` configured.
- **Selection column**: leftmost checkbox column when `selector.visible`. Header checkbox toggles select-all.
- **Sticky columns**: any column with `fixed: true` stays pinned while horizontal scroll happens; rendered with a subtle box-shadow on the boundary (via `StickyShadowDirective`).
- **Group rows**: spanning row with HTML rendered from `group.htmlTemplate`, separating sub-sections.
- **Empty state**: shows blank body; loading state shows centered Material spinner.
- **Pagination bar** (bottom): "Äang hiá»ƒn thá»‹ 1-50/1.234" + page-size selector + first/prev/next/last buttons. Vietnamese labels via `MatPaginatorIntlCro`.
- **Drag handle** (when `rowReorder.enabled`): leftmost icon column with the configured icon (default `drag_indicator`); rows can be reordered within the same group.
- **Column resize handle** (when `config.resizable`): a 6px transparent strip at the right edge of each data-column header. Cursor changes to `col-resize` on hover; a subtle dark overlay appears on hover for affordance. The handle does not show on `sdSelection`/`sdCommand`/`sdGroup`/expand/reorder columns or on `type: 'children'` parent headers.

## Configuration provider
```ts
provide: SD_TABLE_CONFIGURATION,
useValue: {
  paginate: { pageSize: 50, pages: [10, 25, 50, 100], showFirstLastButtons: true },
  filter: { hideInlineFilter: false, operator: { default: { string: 'CONTAIN', ... }, list: { ... } } },
} satisfies ISdTableConfiguration
```
Per-table options always override these defaults.

## Permission gating
The component extends `SdBaseSecureComponent`. Bulk actions (`selector.actions`) and per-row `commands` are usually gated at the application level (hide via `hidden(row)` predicate or before composing the option). For full row visibility wrap the host with `*sdPermission`.

## Examples

### 1. Server-paginated list with filters, selection, commands, export â€” typical CRUD list page
```html
<sd-page title="Quáº£n lÃ½ nhÃ¢n viÃªn">
  <ng-container headerRight>
    <sd-button
      *sdPermission="'HR_C_EMPLOYEE_CREATE'; sdPermissionKey: 'hr'"
      title="Táº¡o má»›i" type="fill" color="primary" prefixIcon="add"
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
    { field: 'code', title: 'MÃ£ NV', type: 'string', width: '120px', fixed: true,
      sortable: true, filter: { operator: { enable: true, default: 'CONTAIN' } } },

    { field: 'fullName', title: 'Há» vÃ  tÃªn', type: 'string', sortable: true,
      cell: { copiable: true, truncate: { enable: true, type: 'tooltip' } },
      click: (_, row) => this.onView(row) },

    { field: 'department.name', title: 'PhÃ²ng ban', type: 'lazy-values',
      option: {
        items: this.api.searchDepartments,
        valueField: 'id',
        displayField: 'name',
        selection: 'MULTIPLE',
      } },

    { field: 'status', title: 'Tráº¡ng thÃ¡i', type: 'values',
      option: { items: STATUS_LIST, valueField: 'value', displayField: 'label' },
      useBadge: (val) => ({ color: val === 'ACTIVE' ? 'success' : 'warn',
                            title: val === 'ACTIVE' ? 'Hoáº¡t Ä‘á»™ng' : 'NgÆ°ng' }) },

    { field: 'salary', title: 'LÆ°Æ¡ng', type: 'number', align: 'right', sortable: true,
      transform: (v) => (v ?? 0).toLocaleString('vi-VN') },

    { field: 'hiredAt', title: 'NgÃ y vÃ o', type: 'date', sortable: true,
      filter: { type: 'daterange' } },
  ],

  filter: {
    externalFilters: [
      { field: 'q', type: 'string', defaultOperator: 'CONTAIN' },
      { field: 'status', type: 'select', defaultOperator: 'EQUAL' },
    ],
  },

  selector: {
    visible: true,
    actions: [
      { icon: 'check_circle', title: 'KÃ­ch hoáº¡t', color: 'success', type: 'fill',
        click: (rows) => this.onActivate(rows) },
      { icon: 'block', title: 'KhÃ³a', color: 'warn', type: 'outline',
        click: (rows) => this.onDeactivate(rows) },
    ],
    message: (rows) => `ÄÃ£ chá»n ${rows?.length ?? 0} nhÃ¢n viÃªn`,
  },

  command: {
    align: 'right',
    commands: [
      { icon: 'visibility', title: 'Xem', click: (row) => this.onView(row) },
      { icon: 'edit', title: 'Sá»­a', color: 'primary',
        hidden: (row) => !row.canEdit, click: (row) => this.onEdit(row) },
      { icon: 'delete', title: 'XÃ³a', color: 'warn',
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
    { field: 'orderNo', title: 'Sá»‘ Ä‘Æ¡n', type: 'string', fixed: true },
    { field: 'customerName', title: 'KhÃ¡ch hÃ ng', type: 'string' },
    { field: 'total', title: 'Tá»•ng tiá»n', type: 'number', align: 'right' },
  ],
  group: {
    fields: ['status'],
    htmlTemplate: (rows) =>
      `<strong>${rows[0].status}</strong> &nbsp; (${rows.length} Ä‘Æ¡n)`,
  },
  expand: {
    multiple: false,
    onExpand: (row) => this.api.getOrderDetails(row.id), // returns Promise
  },
};
```
```html
<sd-table [option]="tableOption">
  <ng-template sdTableExpandDef let-row>
    <div class="p-3">
      <div>MÃ£ KH: {{ row.customerCode }}</div>
      <div>Ghi chÃº: {{ row.note }}</div>
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
    <sd-input [(model)]="filter.customField" (modelChange)="update()"></sd-input>
  </ng-template>
</sd-table>
```

### 5. Resizable columns with min/max constraints and remote profile sync
```ts
tableOption: SdTableOption<Employee> = {
  type: 'server',
  key: 'hr.employee.list',          // required for resize to persist across reloads
  items: (req, paging) => this.api.search(paging),

  columns: [
    // Constrained: user cannot shrink below 80px or grow above 300px
    { field: 'code',    title: 'MÃ£',       type: 'string', width: '120px',
      minWidth: '80px', maxWidth: '300px' },
    // Unconstrained: free resize (clamped only to default min 40px)
    { field: 'name',    title: 'Há» tÃªn',   type: 'string', width: '220px' },
    { field: 'salary',  title: 'LÆ°Æ¡ng',    type: 'number', width: '140px',
      align: 'right' },
  ],

  config: {
    visible: true,         // also show the gear button so user can reset
    resizable: true,       // enable drag handle on data columns
    onResize: (field, width, columnWidth) => {
      // Optional: sync to a remote user profile so widths follow the user
      // across browsers/devices. Fires once per mouseup.
      console.log(`User resized '${field}' â†’ ${width}`);
      console.log('Current column widths:', columnWidth);
      // e.g. { code: '120px', name: '320px', salary: '140px' }
      this.userPrefs.saveTableLayout('hr.employee.list', columnWidth);
    },
  },
};
```
The drag handle hides automatically for columns excluded from resize. Widths reload from localStorage on next page visit; calling `tableRef.detectChanges()` is not necessary â€” the component's storage subscriber updates the live configuration signal in place without re-fetching data.

## Anti-patterns
- âŒ Recreating `tableOption` on every change-detection cycle (e.g. computing it inside the template) â€” every new reference triggers a full re-init via the `effect`. Keep it as a class property.
- âŒ Using `type: 'local'` for â‰¥ 1k rows that come from the server â€” paging happens client-side, so all rows are fetched and held in memory. Switch to `type: 'server'`.
- âŒ Skipping `option.key` on a customer-facing list â€” without it, user column-config is not persisted across page reloads.
- âŒ Wiring per-row navigation via the cell `click` callback when the user expects right-click "open in new tab" â€” use a column with `htmlTemplate` rendering an `<a [sdHref]>` instead.
- âŒ Defining `commands` AND `command.commands` simultaneously â€” `command` is the newer API; pick one to avoid confusion.
- âŒ Putting a heavy server-side `items()` in front of a daterange filter without honoring the `BETWEEN` / `GREATER_OR_EQUAL` operators emitted in `pagingReq.filters` â€” the table builds the request correctly; your backend must accept that operator vocabulary.
- âŒ Using `'lazy-values'` with `selection: 'MULTIPLE'` and forgetting to provide `views` â€” bulk-display of saved values needs `views(values) => K[]` to render labels for already-stored ids.
- âŒ Mutating row data in-place after a server fetch and expecting the table to redraw â€” call `tableRef.reload()` or replace the dataset reference.
- âŒ Setting `expand.always: true` AND `expand.onExpand` â€” `always` keeps every row expanded; `onExpand` is bypassed for toggling but still called once for each row's data on first render. Decide which mode you want.
- âŒ Relying on `output` events â€” there are none. Use `option`-level callbacks or `@ViewChild` API.
- âŒ Setting `config.resizable: true` without `option.key` and expecting widths to survive reload â€” without `key` the storage falls back to session storage hashed from the option object; safe for prototypes, not for persistent UX.
- âŒ Using `column.minWidth: '30%'` (or any non-`px` unit) and expecting the resize clamp to honor it â€” the directive's parser only accepts `'NNpx'`. Other units render fine for static width but are treated as "no clamp" by the resize logic (falls back to default `min = 40px`).
- âŒ Writing to `column.width` programmatically while `config.resizable: true` on a table that already has `option.key` â€” the persisted user width takes precedence over `column.width` in `option`. Reset via the gear dialog â†’ "ÄÆ°a vá» máº·c Ä‘á»‹nh" if you want option-defined widths back.
- âŒ Mutating `columnWidth` object inside `onResize` callback expecting it to affect rendering â€” the snapshot is read-only intent; to push new widths back into the table, set them via `option.columns[i].width` AND clear the user storage (or write your own keyed storage).

## Related
- `<sd-button>`, `<sd-quick-action>` â€” used in toolbar / per-row commands
- `<sd-badge>` â€” used inside cells via `useBadge` or custom cell templates
- `<sd-page>`, `<sd-section>` â€” typical wrappers for a list page
- `*sdPermission` â€” for permission-gated rows / commands
- `SD_TABLE_CONFIGURATION` â€” global default config provider
- `SdSearch<T>` (forms autocomplete pattern) â€” used by `'lazy-values'` columns
- `PagingReq`, `Operator` â€” request payload contract for server-mode tables
- Skill ref `30-list-page.md` (if present) â€” the recommended page-level scaffold using `<sd-table>`

