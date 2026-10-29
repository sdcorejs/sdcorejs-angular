# @sdcorejs/angular 22.3.3

Release tag `v3.3`, published 2026-10-29.

Packages `19.3.3` · `20.3.3` · `21.3.3` · `22.3.3`, validated against `*.3.2`.

> [!IMPORTANT]
> **Before upgrading:** `SdChip` drops its unused autocomplete path (`onSelect()`, `selectable`, `separatorKeysCodes`), stops exporting `SdRemovableChipPipe`, and `isFocused` becomes a signal. Upload file `upload()` now rejects unless the handler returns one non-empty string ID per file, in order. Defaults that change: chips are added on blur, one-line table rows are 36px, upload previews are 72px, and `<sd-table>` no longer covers itself with a dark overlay while loading (skeleton rows, or a progress bar after 300 ms); apps that styled `.c-loading` or `.lds-ring` inside the table must drop those overrides.

**Highlights**

- Pattern screens in `@sdcorejs/angular/modules/pattern`
- `<sd-page-list>`, `<sd-page-detail>` and `<sd-page-form>`, with a page table of contents and a leave guard
- Chip limits, paste, validation and clear-all
- Tab router keyboard support, context menu and unsaved-tab dot
- Upload file dark viewer and `variant="inline"`
- Table loading without an overlay: skeleton rows, a delayed progress bar over dimmed rows, and an announced result

### Changed (BREAKING for consumers)

#### Chip

- The unused autocomplete path is gone — `onSelect()`, `selectable`, `separatorKeysCodes` and the `MatAutocompleteModule` / `MatProgressSpinnerModule` imports.
  - The template never rendered an autocomplete, so only code that called `onSelect()` itself is affected; add the value through `[(model)]`.
- `SdRemovableChipPipe` (`sdRemovableChip`) is no longer exported from `@sdcorejs/angular/forms/chip`; `<sd-chip>` stopped using it. Apply the `removable` value yourself.
- `isFocused` is a signal (read `isFocused()`), and `SdChip` no longer has `ngAfterViewInit()` / `ngOnDestroy()`.

  ```diff
  - chip.onSelect(event);
  + model = [...model, event.option.value];

  - @let canRemove = item | sdRemovableChip: removable;
  + @let canRemove = typeof removable === 'function' ? removable(item) : removable;

  - if (chip.isFocused) { … }
  + if (chip.isFocused()) { … }
  ```

#### Upload file

- `upload()` rejects with an `Error` when the `upload` handler does not return exactly one non-empty string ID per file it received, in the same order (a non-array, too few or too many IDs, an empty or non-string ID).
  - It used to drop from `model`, without an error, the local files it got no ID for. `model` and the cache keep the local files, so the call can be retried. The handler also receives each distinct local file once: a file that appears twice in `model` is uploaded once and both positions get its ID.

  ```diff
    upload: async files => {
      const res = await api.upload(files);
  -   return res.ids.filter(Boolean);
  +   if (res.ids.length !== files.length) throw new Error('Upload returned no ID for some files');
  +   return res.ids.map(String); // one ID per file, in the order of `files`
    },
  ```

### Added

#### Badge

- `SdBadgeData` (`{ title, type, color, icon, label, tooltip }`) is exported from `@sdcorejs/angular/components/badge`.
  - `useBadge` of `<sd-table>` columns returns it, so a cell badge can show the `label` of `type: 'pair'` and a `tooltip`. The column `tooltip` still wins when both are set. Objects of the old `{ type, color, icon, title }` shape still type-check.

#### Chip

- `minCount` / `maxCount` replace `min` / `max`. `maxCount` also stops adding once reached: an `n/max` counter shows under the field, the placeholder says “Đã đủ {max} giá trị”, and typing or pasting more is announced instead of added.
- `addOnBlur` (default `true`) turns the typed text into a chip when the field loses focus.
- `separators` (default `['Enter', ',']`) sets the keys that commit the typed text, compared with `KeyboardEvent.key`.
  - Pasting a list that holds a separator, a new line or a tab adds every value in one change, skips duplicates, keeps refused values in the input and announces the result (“Đã thêm 3 · bỏ 1 trùng”).
- `chipTransform(raw)` normalises typed and pasted text before it is compared and stored (default trim; `null` drops it).
  - `chipValidator(value)` refuses a value with an i18n key or a message: the value does not become a chip, its text stays in the input and the message shows under the field.
- `clearable` (default `false`) shows a clear-all button like `<sd-date>`, reachable by keyboard and always visible on touch screens. It removes every chip `removable` allows in one change and keeps the locked ones.
- `maxVisible` folds the chips past that number into a “+N” button while the field is not focused; `2` suits `<sd-table>` cells. Chip text stops at 240px with an ellipsis and a tooltip.
- A duplicate highlights the chip it repeats for 1.4s and is announced, and Backspace / Delete on a locked chip announces “Không xoá được”, through a polite live region.
  - New keys `core.form.chip.placeholder`, `locked`, `duplicate`, `full`, `added`, `skipped`, `more`, `clear` in the five locales, and the component token `--sd-chip-duplicate-bg`.

#### Page

- `<sd-page-detail>` and `<sd-page-form>` are selectors of the same `SdPageComponent`; only the default `width` changes (`wide` and `medium`; `sd-page` stays `full`).
  - `aside="start"` puts the aside column before the body (the default `end` keeps it after). `toc` on a page lists the titled top-level `<sd-section>`s of the body, including those of child components, in DOM order as a table of contents in the aside column, scrolls to a section on click and marks the current one; it is hidden below 1200px of viewport. `sdPageFormLeaveGuard` (a `CanDeactivateFn`) asks with the Core confirm dialog before leaving a page with unsaved changes. New keys `core.module.layout.page.toc` and `core.module.layout.page.leave.{title,message,stay,leave}`.
- `<sd-page>` gains `backLink` (a ← link before the title, URL or router commands), `[badges]` (at most two `SdBadgeData` next to the title, `round` by default) and `width` (`full` · `wide` 1200px · `medium` 960px · `narrow` 720px).
  - New slots: `[sdSubheader]` under the header row, `[sdAside]` as a 320px sticky column that moves under the body below 1200px, and `[sdFooterLeft]` / `[sdFooterRight]` in a footer pinned to the bottom and hidden while empty. `[sdHeaderLeft]` / `[sdHeaderRight]` are aliases of `[headerLeft]` / `[headerRight]`. New keys `core.common.back` and `core.module.layout.page.actions`, new component tokens `--sd-page-divider`, `--sd-page-back-fg` and `--sd-page-back-hover-bg`, and a new doc `sd-page.md` with its showcase page. A page that uses none of these renders the same header and body as before.

#### Page list

- `<sd-page-list>` (`SdPageList`, `@sdcorejs/angular/modules/layout`) for list screens with an `sd-table`.
  - The body fits the viewport, the main table (the last direct `sd-table`, or an `[sdPageListMain]` wrapper) takes the space left, and the paginator stays visible and still while rows, page size and read states change; the data area keeps room for the header and 5 rows, and only then does the page body scroll. On a viewport lower than 720px `compact()` is on (turn it off with `[autoCompact]="false"`): the main table's external filter starts collapsed and features can fold their summary. The detail is a child route rendered by the list: `detail="page"` hides the list and restores its scroll and focus on the way back, also when one child route replaces another (detail → update); `detail="drawer"` keeps it on screen; `detail="none"` renders no outlet, for a screen that places the child route itself (list and detail side by side). `SD_PAGE_LIST` gives the content `compact`, `childActive` and `detail`. Live screen `/pattern/order` and Playwright suite `showcase/e2e/page-list.e2e.ts` (E1 at 1440×960, 1440×800, 1280×768, 1440×650).

#### Pattern

- New entry point `@sdcorejs/angular/modules/pattern` with sample screens by entity that a host app mounts: `SD_PATTERN_ROUTES` (`product`, `customer`, `order`, `approval`, `category`, `import`, `partner/create`, `settings` and an index page) and `provideSdPatterns({ mockApi, apiBaseUrl, latencyMs, storage, forbiddenUrl })`.
  - The routes get their own `HttpClient` with a mock API over seeded data kept in `sessionStorage` (the blueprint list request, field errors on 400/409, bulk actions with a result per record), sample roles over `PATTERN_<ENTITY>_<R|C|U|D>_<ACTION>` permission codes, and a toolbar that switches the role, the latency and a simulated failure (500, timeout, 404, 403), resets the data and shows the source of the screen. Each pattern has a doc in `modules/pattern/docs/` — list, detail, form, flow, drawer, split, select, relation, header actions, states — whose code blocks are extracted from `features/` by `npm run pattern:docs`, and `modules/pattern/README.md` picks the pattern for a screen. The package ships the `features/` source, the docs and the README, so an app reads them under `node_modules/@sdcorejs/angular/modules/pattern/`. The showcase mounts it at `/pattern`; Playwright suites in `showcase/e2e/pattern/`.

#### Section

- `SD_SECTION_REGISTRY` and `SdSectionRegistry` (`@sdcorejs/angular/components/section`). A top-level `<sd-section>` registers with the nearest registry, so a page's table of contents also lists the sections that child components render.

#### Splitter

- The `SdSplitterOption` type is exported from `@sdcorejs/angular/components/splitter`.

#### Tab router

- The tab bar works from the keyboard as a WAI-ARIA tablist with one tab stop (roving tabindex): ←/→ move focus (wrapping), Home/End go to the first/last tab, Enter/Space open the focused tab, Delete closes it.
  - Focus coming back into the bar lands on the open tab, and when the focused tab closes, focus moves to the tab on its right (on its left at the end).
- A right-click menu on a tab, also opened with Shift+F10 or the Menu key, with “Đóng tab” and “Đóng các tab khác”.
  - New `SdTabRouterService.closeOthers(tab?)` closes every other tab after asking each `beforeClose` in turn; tabs that refuse stay, and the kept tab opens when the open tab was closed. New key `core.component.tab-router.close-others` in the five locales.
- While a tab is dragged it floats with a shadow and four 8px corners over a `--sd-primary` 12% drop spot, and the other tabs slide aside (no motion under `prefers-reduced-motion`).
- `SdTabInfo.dirty` shows an 8px dot where the close button of the tab is; on hover or keyboard focus it turns into the close button, and the open tab keeps the dot until hover.
  - Screen readers hear “Chưa lưu” (new key `core.component.tab-router.unsaved` in the five locales). Send it through `tabInfoChanges`, from the same state as `beforeClose`.
- `syncBrowserTitle` on `<sd-tab-router-outlet>` (default `false`) sets the browser title to “{tab name} – {app name}”, with “● ” in front while the tab is dirty.
  - The app name is the title when the outlet starts; turning the input off, `disabled` or destroying the outlet gives it back.

#### Table

- `reloadFirstPage()` reads the first page again with the current filters, for a condition outside the table (a status tab, a score card); `reload()` keeps the current page.
- `SD_TABLE_LAYOUT` lets a page frame put one table in fill mode (`sd-table--fill`): it takes the height left in a flex column, keeps the header and five rows, and gives the footer at least 48px.
  - `filter.externalFilterCollapsed` sets the initial collapsed state of the external filter.
- `option.loading` and `SD_TABLE_CONFIGURATION.loading` (`SdTableOptionLoading`, merged field by field, option first) tune the loading layer: `skeleton` (default `true`), `skeletonRows` (5, or enough to fill a fixed-height table; 1–20), `showDelay` (300 ms), `minDuration` (400 ms) and `dim` (`true`).
  - The host attribute `data-loading-view` is `none`, `skeleton` or `refresh`; `data-loading` keeps following `loading()` at once.
  - New i18n keys `core.component.table.loaded` (“Đã tải xong {count} dòng”), `core.component.table.loaded-one` and `core.component.table.tree-toggle` (“Mở/đóng dòng con”) in the five locales.

#### Theme

- The component tokens `--sd-chip-locked-bg` and `--sd-chip-more-hover-bg`, shared by `<sd-chip>` and `<sd-chip-calendar>`. `--sd-chip-calendar-chip-locked-bg` and `--sd-chip-calendar-more-hover-bg` keep their names and now default to them.
- Component tokens `--sd-table-skeleton-bg`, `--sd-table-skeleton-highlight` and `--sd-table-progress-track` for the table loading layer, one `color-mix()` expression for light and dark.
- Component tokens `--sd-upload-file-viewer-*` (bg, fg, fg-muted, divider, control-bg, thumb-bg, accent, on-accent, error, ext-pdf / -word / -excel) for the dark viewer, and `--sd-upload-file-scrim` / `--sd-upload-file-empty-text` for the field.
  - New i18n keys `core.component.upload-file.viewer.*`, `retry`, `add-image`, `upload-tile`, `drop-hint`, `choose-file`, `drop-to-upload`, `remove-named` and `no-files` in the five locales.

#### Unsaved changes

- `registerSdUnsavedChangesForm(..., { dirty: 'value' })` counts the form as changed only while its value differs from the last saved value, also for fields that write a user edit without marking their control dirty (`<sd-input-number>`, `<sd-date>`, pickers).
  - A control added later, such as a Core field registering itself, starts from the value it holds once its model is in. The saved value is taken again on `save()`, `reset()`, `discard()`, when the form or a control is marked pristine, and on `markPristine()`, which in this mode keeps reporting later edits. The default `'control'` keeps the form's `dirty` flag. `confirmLeave({ adapter })` asks with that adapter for one prompt instead of `SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER`.

#### Upload file

- `variant="inline"` — one 32px line for `<sd-table>` cells and dense lists: a 32px upload tile, 32px images, document chips (at most 140px) and `+N` for the rest (`maxOfImage` items show), “Chưa có tệp” when empty, 16px remove badges, a primary tint while files are dragged over, and the required error as an error border around the tile.
  - No label, description, counter or reordering. `variant` defaults to `default`.

### Changed

#### Chip

- Leaving the field now adds the typed text as a chip (`addOnBlur` defaults to `true`). It used to drop the text, and so did focusing the input again. For the old behaviour set `[addOnBlur]="false"`.
- The placeholder no longer repeats the label; without `placeholder` it is “Nhập rồi nhấn Enter”.
- With `[addable]="false"` the input is read-only and out of the Tab order instead of accepting text that was then thrown away.
- `onClear()` keeps the chips `removable` keeps and emits nothing when no chip goes.
- Chips look like those of `<sd-chip-calendar>`, through one SCSS mixin (`sd-chip-row()` in `core/form.scss`): 20 / 24 / 28px chips centred in a 32 / 40 / 48px field at `sm` / `md` / `lg` (`size="lg"` had no style), a 6px radius, a 1px `--sd-border` outline on `--sd-surface`, tabular digits, 4px between chips, and a square clear-all button of 24 / 28 / 32px.
  - The `md` field is no longer taller than other controls (its chips sat 10px lower). The typing area wraps to a new line only when less than 80px is left (Material kept 150px), and while chips are folded into “+N” it only fills the rest of the line and shows no placeholder, so a table cell stays one line.
- A chip that `removable` keeps has the locked background (`--sd-chip-locked-bg`), a lock icon whose tooltip says “Không xoá được”, and an accessible name that ends with “, Không xoá được”. It used to differ only by the missing ✕.

#### Chip calendar

- The field and chip styles moved to the shared mixin, with no visible change except the clear-button icon below.

#### Form generic

- Chip fields pass `validation.maxItems` as `maxCount`.

#### Page

- The header of `<sd-page>` is a `<header class="c-page-header bg-white">` instead of a `<div>`, and its `title` renders in an `<h1 class="T20M">` instead of a `<div class="T20M">`, with its margin reset, so the page has one main heading.
  - Pages that project `[headerLeft]` are not affected. `SdPageComponent` now uses `OnPush`.

#### Tab router

- A tab is a `role="tab"` element without `href` instead of an `<a href>` (selector `.tab-router__item` is unchanged), with `aria-selected` and `aria-controls`; panes are `role="tabpanel"`.
  - With the link, CDK drag cancelled the mouse-down of the natively draggable anchor, so clicking a tab did not focus it. The browser no longer offers “Open link in new tab” on a tab; the bar menu takes its place. The close button is out of the Tab order (`tabindex="-1"`); the keyboard closes a tab with Delete.
- `tabs` of `<sd-tab-router-nav>` is a `model`. Dropping a dragged tab emits a reordered copy through `tabsChange`, which the outlet binds two-way, instead of reordering the outlet array in place; a tab dropped where it started emits nothing.

#### Table

- The page-size dropdown of the paginator looks like `<sd-select>`: 14px text and a `keyboard_arrow_down` chevron instead of Material's 12px text and triangle, centred in a 32px field, and its list opens in the `<sd-select>` panel (rounded, bordered, 36px options). Same for the pager of `paginate.total: 'unknown'`.
- A one-line row is 36px high instead of Material's 52px (`--mat-table-row-item-container-height: 36px` on `<sd-table>`), as the table's dense design intended.
  - Rows with longer text or buttons still grow. A screen that relied on 52px rows can set the token back with a selector more specific than the component's own, for example `.orders sd-table { --mat-table-row-item-container-height: 52px; }`.
- Loading no longer covers the table with a dark overlay and a 100px spinner (which also blocked the header, filters and scrollbars, and stopped 56px above the bottom whatever the footer). The header, filters, sort, paginator and scrolling stay usable, and the keyboard is never blocked.
  - No rows yet (first read, after an empty result or an error, before the configuration is ready): skeleton rows under the real header at once, aligned with the columns; mobile cards show up to 3 skeleton cards.
  - Rows on screen: they stay; a read longer than 300 ms dims the table body to 55% (pointer input off, buttons in cells included) and shows a 2px progress bar under the last header row, kept at least 400 ms. Faster reads show nothing.
  - A hidden status region (`.sd-table-live`) reads “Đang tải dữ liệu bảng” when that layer shows for a running read and “Đã tải xong {count} dòng” (rows on screen, expanded tree rows included) when the read ends; the overlay's own status role is gone.
  - The same region reads the title of the empty block (“Không có kết quả phù hợp”, “Vui lòng chọn bộ lọc để bắt đầu” or “Chưa có dữ liệu”) when a read ends without rows, fast reads included, also under a custom `sdDataStateTemplate`. The empty block itself loses `role="status"` / `aria-live`: its text was inserted together with the role, which screen readers often skip.
  - A tree toggle or expand button that is loading stays in place, so keyboard focus no longer falls back to the page and the row keeps its height: the tree chevron becomes a 16px spinner (`aria-busy`, `aria-disabled`), the expand `sd-button` shows its own loading spinner (`aria-busy` on `<sd-button>`). Mobile tree and expand buttons swap `hourglass_empty` for the 16px spinner.
- A failed local read shows the same `sd-data-state` error block as a server table (title, message, “Thử lại” calling `reload()`, `sdDataStateTemplate`) instead of a line of text and a “Tải lại” button. The warning toast stays.

#### Upload file

- File sizes read `{n} KB` below 1 MB (whole kilobytes, rounded up) and `{n} MB` with one decimal from 1 MB, in the number format of the current language (`2,4 MB`); a document row shows `{EXT} · {size}`. Sizes used to be always `fileSize / 1024` KB.
- File-type icons cover the 51 SVGs of the set (pdf, doc/docx, xls/xlsx, ppt/pptx, csv, zip, txt, mp4, …, `jpeg` → jpg, `tif` → tiff), the generic file icon for the rest, through one internal icon component shared by the field and the popup; the bundle no longer inlines the SVGs three times.
- The preview popup is a dark viewer (CDK `Dialog`, `min(1200px, 100vw − 48px)` × `100vh − 48px`, full screen at ≤ 600px): a top bar with the file name, `{EXT} · {size}` and the position (`3 / 7`), zoom (fit, 50–400%), rotate, download and open in a new tab for images, download and open in a new tab for other files; a stage that shows a PDF inline in an `<iframe>`, a loading state after 150ms and an error state with Retry; previous / next buttons that stop at the ends instead of wrapping; and an 88px filmstrip. ←/→, `+`/`=`/`-`/`0` and Esc work from the keyboard; focus moves to the stage and back to the opener.
  - It used to be an `sd-modal` with a fixed “Xem ảnh” title, a vertical thumbnail rail and no toolbar.
- `previewWidth` / `previewHeight` default to `72px` (they were `50px`). Bind `previewWidth="50px" previewHeight="50px"` to keep the old size, or use `variant="inline"` in table cells.
- The field follows the new design (variant `default`): the label with a `{n} / {max}` counter right after it; a wrapping image grid whose first tile is the upload tile (“Thêm ảnh” / “Tải lên”, dashed `--sd-border-strong`, tinted while files are dragged over the field); image tiles that open the popup at that image (no zoom icon or dark overlay) with a scrim and a 20px remove badge on hover or focus (always under `pointer: coarse`); a full-width drop zone for `type="document"`; 52px document rows (icon, name, `{EXT} · {size}`, download) whose click opens the popup at that file instead of downloading it; a read-only grid whose last tile is covered by `+N`; and the required error as an icon and 12px text like other fields.
- A file refused when picked or dropped (wrong extension, too large, not an image, image size) stays in the list with its reason, outside the value, until removed; the valid files of the same pick are still added (one invalid file used to drop the whole pick).
  - Only “too many files” still uses a toast. The file dialog filters by `extensions` (`accept`) and no longer refuses files itself.
- While `upload()` runs, its files show as uploading (spinner on an image, “Đang tải tệp lên…”, a cancel button and an indeterminate bar on a row); when it fails they show as failed with Retry, which calls `upload()` again. `upload()` still rejects.
- Drag listeners are host listeners that Angular removes on destroy, and react only while files are dragged.

### Deprecated

#### Chip

- `min` / `max`; use `minCount` / `maxCount`. Both still work, the new name wins when both are set, and each instance warns once in dev mode.

#### Upload file

- `selectedFile`, `onSelect()` and `onSelectKeydown()` — a tap on a tile opens the popup and the remove badge is always shown on touch screens. They are no longer used.

### Removed

#### Tab router

- The component token `--sd-tab-router-badge-bg`, deprecated in 3.2.
  - Its only reader filled the icon of the old tab, which had not been rendered since the tabs moved to `sd-badge`, so no tab used it. Code that set or read it can drop it. `--sd-tab-router-item-muted-bg` stays deprecated.

#### Table

- The internal loading markup and its styles: the `.c-loading` overlay with its `<mat-spinner>`, `.lds-ring`, `@keyframes lds-ring` and `.sd-tree-spinner`.
  - They were never public API, but an app may have restyled them with `::ng-deep`; those rules now match nothing. Use `option.loading`, `--sd-table-loading-dim` and the `--sd-table-skeleton-*` / `--sd-table-progress-track` tokens instead.

#### Upload file

- The unused `thumbnailPosition` and `title` fields of the internal preview component (`<preview>`), and its `modal` reference.

### Fixed

#### Badge

- The title of an `md` round, solid or tag badge, counters included, sits 1px lower, in the middle of the badge.
  - With Roboto at 13px the baseline of the 18px line falls on a half pixel, so digits and capitals were drawn 0.5–1.6px above the middle, depending on the badge's position and the screen scale. `sm`, `lg`, `pair` and a tag with a description are unchanged.

#### Chip

- `removable` now applies on every removal path.
  - A predicate used to reach `mat-chip-row` as a function, which is always truthy, so Backspace / Delete on a chip (or Backspace twice from the empty input) removed a chip the predicate kept; each chip now gets its own boolean and `onRemove` checks it again.
- Every model item except `null`, `undefined` and `''` is a chip, so `0` shows (it was counted but hidden). Chips are tracked by value, so removing one no longer rebuilds the chips after it and moves focus.
- A typed value that equals an existing chip as a string is a duplicate: a model `[1, 2]` plus a typed “1” stays `[1, 2]`.
- Setting `model` to `null` or `undefined` clears the chips and sets `formControl` to `[]`. The control used to keep the old array and send it on submit.
- One rule decides when the error shows — invalid, and touched or the parent `NgForm` / `FormGroupDirective` submitted — for the red outline, `<mat-error>`, the `hideInlineError` icon and `aria-invalid`.
  - A submit without touching the field used to show a red outline without a message, a field that was only dirty turned red, and the input carried `aria-invalid="true"` before any interaction.
- The ✕ button of a chip is named “Xoá {value}” (`core.form.chip.remove`, in the five locales) and uses the `close` icon; it was hidden from assistive technology.
- The wrapper around the field is layout only.
  - It used to sit in the Tab order with no role or name, disabled included; with `sdViewDef` the face itself is now a `role="button"` that Enter or Space opens, and it leaves the Tab order when disabled.
- With `hideInlineError`, the hidden error text has an id and the input points `aria-describedby` at it.
- Leaving the field no longer rewrites its value.
  - `mat-chip-grid`, bound to the control as its value accessor, wrote the text of the rendered chips into the control after every blur: number items became strings without a `modelChange`, and a form reset made while the input had focus was undone. The grid now has a control of its own, and the field is marked touched when focus leaves it (moving between the input and its chips does not count).
- In a field narrower than a chip, the chip text is cut with “…” and the ✕ or the lock stays inside the chip.
  - The text used to keep its width (up to 240px) while the chip shrank to the field, so the ✕ or the lock was pushed past the chip's edge, and past the field's edge in a narrow one. Chips that fit are unchanged.

#### Chip calendar

- The clear button icon is 18 / 20px at `md` / `lg`, as designed. A shared `.sd-clear-btn sd-icon` rule forced 16px.

#### Forms

- A user edit now marks the control of the parent form dirty before writing its value, as Angular's value accessors do, so `form.dirty` and the default `'control'` mode of `registerSdUnsavedChangesForm` see it.
  - Before, the control stayed pristine for a number typed into `<sd-input-number>`, the clear button of `<sd-input>`, `<sd-select>`, `<sd-date>`, `<sd-datetime>` and `<sd-autocomplete>`, a masked `<sd-input>`, select-all and the virtual list of `<sd-select>`, a day picked in `<sd-date>` or `<sd-datetime>`, an option chosen in `<sd-autocomplete>`, chips added or removed in `<sd-chip>` and `<sd-chip-calendar>`, and `<sd-date-range>`; leaving a page after such an edit did not ask. Blurring an empty `<sd-input-number>` still leaves it pristine.

#### Input number, Textarea

- An `[inlineError]` set while the field is already touched — the field error of a save the API rejected — shows its message, `data-invalid` and `aria-invalid` (and the red outline of `<sd-input-number>`) at once.
  - It stayed hidden until the value changed, because the validator was installed without a control event.

#### Section

- Clicking the header of a collapsible `<sd-section>` placed inside a focusable element collapses it again.
  - The click was ignored whenever any ancestor had a `tabindex`, so the external filter header of `<sd-table>` (whose host has `tabindex="0"`) only toggled from its chevron button. Clicks on actions inside the header still do not toggle.

#### Select

- With an async `items` loader, the selected value shows its label once a `SEARCH` result contains it, also when the `VALUE` request returned nothing or failed: `selectedItems`, the trigger, custom selected templates, the read-only and inline views and the tooltip update together, also with `virtualScroll`, without `modelChange`, `sdChange` or `sdSelection`.
  - A retry updates them the same way. A response for a replaced loader, `cacheChecksum`, field mapping, search text or selection — such as the ward list after the province changed — no longer sets the label.

#### Select, Autocomplete

- The `sdItemDef` template context has `$implicit` as well as `item`, so `<ng-template sdItemDef let-option>` gets the item; it used to be `undefined` and the template threw. `let-item="item"` keeps working.

#### Side drawer

- Opening a drawer focuses its close button (X) also when `[sdHeaderRight]` holds actions, which come before X in the tab order. It used to focus the first of them, such as a Delete icon, where an Enter started the deletion prompt.

#### Tab router

- Navigations that finish one after another while an earlier tab is still being activated (for example while the outlet loads an NgModule lazy route) each open their own tab.
  - The outlet read the router state when the queued activation ran, so the tab of an earlier URL got the component, route and name of the later one; it now captures the route when `NavigationEnd` is emitted.
- The tab being dragged keeps its rounded shadow on all four corners.
  - CDK opens the drag preview as a popover, whose default style has `overflow: auto`, so the shadow was clipped to the square host and showed only as grey patches outside the rounded corners. The preview host now has `overflow: visible`.

#### Table

- The desktop tree toggle has an accessible name (“Mở/đóng dòng con”) and `aria-expanded`, like the mobile one; screen readers announced it as an unnamed button.

#### Upload file

- A `details` response that arrives after `model` changed no longer replaces the preview or emits `filesChanged`, and the `FileReader`s of a replaced preview are aborted.
  - `upload()` reads the local files from `model` instead of the preview, so a file whose preview is still loading is uploaded, server IDs and URLs without metadata stay in `model`, and a missing handler keeps the local files. The returned IDs replace the local keys in the latest `model`: files removed, reordered or added while the upload ran keep that change. Concurrent calls share one upload. Each control keeps its own picked files, so uploading the same file from another control no longer loses this control's pending file. A pick that finishes its checks (resize, image validation) after `model` changed adds its files to the current value and checks `max` again; it used to write back the value from before, which replaced the IDs of an upload that finished meanwhile with stale keys. After destruction, no callback updates `model`.
- Ppt and pptx files show their own icons (they showed the xls / xlsx ones). `SdUploadFileDetail.size` is documented in bytes, as the component always read it (the JSDoc said MB).
- The download button of the popup is labelled “Tải xuống”; it used the upload key (“Tải file”). The thumbnail rail followed the current file only by looking up ids that were never set; the filmstrip now scrolls to it.
- Dragging an image to reorder moves it among the image positions of `model` only; the index of the image group used to be applied to the mixed array of images and documents. Documents can be reordered too.
- The remove badge is no longer clipped (the field had `overflow-y: hidden` and the badge sat at −8px of a 3px margin).

## Compare with the previous release

- Previous documented release: [22.3.2](https://sdcorejs.github.io/sdcorejs-angular/docs/22.3.2/index.json)
- Source diff: https://github.com/sdcorejs/sdcorejs-angular/compare/v3.2...v3.3
