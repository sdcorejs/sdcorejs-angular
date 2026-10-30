# @sdcorejs/angular 20.3.4

Release tag `v3.4`, published 2026-10-30.

Packages `19.3.4` · `20.3.4` · `21.3.4` · `22.3.4`, validated against `*.3.3`.

> [!IMPORTANT]
> **Before upgrading:** no public API is removed or renamed. Defaults that change: the table settings modal is a list, and its **Khôi phục mặc định** (was **Mặc định**) also restores the inline external filters; a click on a column resize grip that does not change the width no longer stores a width or calls `config.onResize`. `SD_API_CONFIG`, `SD_CACHE_CONFIG` and `SD_STORAGE_CONFIG` are deprecated: use `SD_API_CONFIGURATION`, `SD_CACHE_CONFIGURATION` and `SD_STORAGE_CONFIGURATION`.

**Highlights**

- Table `filter.mode: 'query-bar'`: one query bar for quick search, external and column filters, with a filter icon in each column header
- Table settings modal: an expandable column list with a find box, keyboard reorder, and a dot on the settings button while custom settings are in use
- Query bar: pinned, required and grouped fields, `applyOn`, `openField()` and a field-picker find box
- Pattern order form: order lines built with `<sd-table>` as well as `<table>`

### Added

#### Pattern

- The order lines can also be built with `<sd-table>`: `/pattern/order/create?lines=sd-table` (and `/pattern/order/:id/update?lines=sd-table`) renders `lines-table-form`, next to the `<table>` of `lines-form`, so the two can be compared.
  - The add button sits in the header of the command column (`sdTableCommandHeaderDef`), deleting a line is a row command, and the line count and total are under the table. Both components share `orderLines()` for the `form.lines` FormArray, the line totals and the unit price of the picked product. The catalog lists the new route and `docs/form.md` shows both.
- `product-select` passes `size`, `hideInlineError` and `inlineError` to `<sd-select>`.

#### Query bar

- Options for a host that owns the chip list (used by the table's query-bar mode); a bar that sets none of them behaves as before.
  - Fields: `pinned` (always on the bar, no remove button, out of the field picker, an empty chip reads “Tất cả”), `required` (empty chip marked invalid with `aria-invalid`, Search disabled, listed by `invalidFields()`), `group` (field-picker headings) and `option.views` on `lazy-values`. A `disabled` field's chip is read-only: it no longer opens its popover, and in inline mode it is not an editable chip.
  - `SdQueryBarOption`: `applyOn: 'search' | 'commit'` (`'commit'` applies every committed chip edit with the search text applied last, and hides the Search button; Enter waits for the required fields), `appearance: 'flush'`, `onClearAll`, `clearDisabled`, `searchPlaceholder`, `invalidHintId`; `showOperatorOnChip` (option and input) also takes `'auto'`.
  - `openField(key, returnFocusTo?)` opens a field's editor from outside the bar; `[sdQueryBarEnd]` projects content after the toolbar.
  - The field picker gets a find box above eight fields (accent-insensitive).
  - Chips show dates as `dd/MM/yyyy` (`dd/MM/yyyy HH:mm`), a range in one year as `01/10 – 31/10/2026`, an open range as “Từ …” / “Đến …”, and the labels of restored `lazy-values` values (looked up once) and of `values` whose `items` is a function.
  - i18n: `core.component.query-bar.all`, `.required`, `.find-field`, `.range.from`, `.range.to`, `.clear`.

#### Table

- `filter.mode: 'query-bar'` (also `SD_TABLE_CONFIGURATION.filter.mode`): one `sd-query-bar` at the top of the table replaces quick search, the external filter section and the column filter row. The filter state, cache, `pagingReq`, `required`, `manualFilter`, `onFilter` and the filter callbacks are unchanged — the same edit sends the same request as the default mode.
  - Visible quick filters and external filters shown inline or `required` are pinned chips; the rest is under `+`, grouped “Bộ lọc” / “Cột”. `filter.queryBar` sets `editor` (`'popover'` / `'inline'`), `pinned` and `exclude`.
  - Each filterable column header gets a filter icon that opens its chip; it stays visible in the primary colour while the column filters.
  - Mobile keeps the default controls. Filters the bar cannot edit (custom templates, `time` columns, date external filters without `GREATER_OR_EQUAL` / `LESS_OR_EQUAL`, …) keep their values and are listed by a dev-mode console warning.
  - The host gets `data-filter-mode="default" | "query-bar"` in both modes.
  - i18n: `core.component.table.query-bar.filters`, `.query-bar.columns`, `core.component.table.filter-by`, `core.component.table.filtering-by`.
  - See `sd-table.md`, “Query bar mode”.
- `TableFilterRegister.value.default()` (optional): the value `remove()` stores, read without writing it.
- The settings button carries a primary dot while the table uses custom settings: stored columns that differ from the option (settings modal or a width dragged on the table) or inline external filters that differ from `defaultShowing`. Columns added to or removed from the option do not count; Restore defaults turns it off; mobile shows none.
  - Uses the `sd-button` indicator with `indicatorLabel` “Đang dùng thiết lập riêng” (`core.component.table.config.customized`).
- Settings modal: columns can be reordered from the keyboard. Focus the handle ⠿, press Space or Enter to pick the row up, ↑ ↓ to move it, Space or Enter to drop it, Escape to cancel. A live region inside the modal reads each step.

### Changed

#### Pattern

- Order form: the fields of an order line use `size="sm"` and `hideInlineError`, and the product, quantity, unit price, line total and delete button share one middle line. An API error on a line, the product included, is an icon with a tooltip on its cell, so the row keeps its height. Required columns get a red `*` after the title.
- The form sections of the order, product and settings screens use `row px-16 pt-16 pb-8`, so fields line up with the 16px section title instead of sitting 8px from the edge.
- The order create page saves with “Tạo đơn hàng” and the update page with “Lưu”, both with the `save` icon.
- The other form screens follow the same save button: product, customer and category create save with “Tạo sản phẩm”, “Tạo khách hàng” and “Tạo danh mục”; their update screens and settings keep “Lưu”. Every save button has the `save` icon.
- Order detail: “Trạng thái” in the drawer and “Trạng thái duyệt” on the page show badges instead of plain text.

#### Query bar

- The number in the clear-all label counts the chips that hold a value, not every chip; with none, the label has no number. The button also gets an `aria-label`.

#### Table

- The columns tab of the settings modal is a list instead of a five-column table. Each row has the handle, the **Hiện** checkbox and a summary (title, fixed and shortened flags, width); the row opens to edit the title (with “Gốc: … · Khôi phục”), the width and the **Cố định khi cuộn ngang** / **Rút gọn nội dung dài** checkboxes. The **Hiện** checkbox is never locked; a hidden column locks its details.
  - Above eight columns, a find box matches the current or original title without accents; reordering is off while searching. “Hiện {shown}/{total} cột” and **Hiện tất cả** sit next to it.
  - Width: a number is stored as `${n}px` and an empty field as `undefined`; a value in another unit is kept as written. It is rounded and kept within the column's px `minWidth` / `maxWidth` on blur and on Apply.
  - Footer: **Khôi phục mặc định** (was **Mặc định**) moves to the left as a text button; **Bỏ qua** is outlined and **Áp dụng** filled, all small. Footer autoIds are unchanged; the find box and **Hiện tất cả** get `-config-find` and `-config-show-all`.
  - Restore defaults also puts the inline external filters back to `defaultShowing`.
  - i18n: new `core.component.table.config.*` keys (`reset`, `find-column`, `shown-count`, `show-all`, `drag-disabled-search`, `width-auto`, `hidden`, `origin`, `restore`, `fixed-label`, `truncate-label`, `truncate-hint`, `customized`, `reorder-*`); `config.drag-hint` has new text. `core.component.table.fixed`, `char-limit` and `core.component.form-builder.default` are kept but no longer used by the modal.
  - See `sd-table.md`, “Settings modal”.
- A click on the column resize grip that does not change the width no longer stores a width or calls `config.onResize`.

### Deprecated

#### API

- `SD_API_CONFIG`; use `SD_API_CONFIGURATION`. This reverses the 1.4 aliasing: `SD_API_CONFIGURATION` is now the name to use and `SD_API_CONFIG` the deprecated one.
  - Both names are the same injection token, so existing `{ provide: SD_API_CONFIG, multi: true }` providers, including those in lazy routes and `loadChildren` modules, keep working unchanged.

  ```diff
  - { provide: SD_API_CONFIG, useClass: OrdersApiConfiguration, multi: true }
  + { provide: SD_API_CONFIGURATION, useClass: OrdersApiConfiguration, multi: true }
  ```

#### Cache

- `SD_CACHE_CONFIG`; use `SD_CACHE_CONFIGURATION`. Both names are the same injection token.

#### Storage

- `SD_STORAGE_CONFIG`; use `SD_STORAGE_CONFIGURATION`. Both names are the same injection token.

### Fixed

#### Page

- The table of contents (`toc`) no longer flickers through the entries in between when you click an entry: the clicked entry stays current while the page scrolls to its section.
  - When the scroll stops, the clicked entry stays current as long as its section is in view, also a section too near the end of the page to reach the top. If you scrolled elsewhere in the meantime, the current entry follows the scroll position again.
  - The end of the scroll is detected without `scrollend` as well, so the table of contents keeps following the scroll in browsers without that event.
- The current entry of the table of contents follows sections that are added, removed or change height without a scroll. Before, it kept its old position in the list: it could mark the wrong entry, or none at all, until the next scroll.

#### Query bar

- A `BETWEEN` chip with both ends empty counts as empty: no “ — ” value, and it no longer counts as active.

#### Table

- The filter of a column under a grouped header (`type: 'children'`) is sent, matched and restored. Before, only top-level `columns` were read: the value was left out of `pagingReq`, ignored by local filtering and sorting, and the column's `filter.default`, cached value and `SD_TABLE_CONFIGURATION.filter.operator` were never applied.
  - `SdConvertToPagingReq` reads leaf columns, so passing `option.columns` by hand now sends child columns too; a grouped header itself sends nothing (it used to send its own field when `rawColumnFilter` held one).
- A `values` column under a grouped header shows the display text of its values and offers its list in the column filter. Before, the table loaded the lists of top-level columns only: the cells (and the export) showed the raw codes, and with `items` as a function the filter list was empty.
- Clearing the filters of a table with a `split-number` or `split-date` column no longer throws `Cannot read properties of undefined (reading 'from')`. Both ends show empty, and typing one end recreates `{ from, to }`.

## Compare with the previous release

- Previous documented release: [20.3.3](https://sdcorejs.github.io/sdcorejs-angular/docs/20.3.3/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v3.3...v3.4
