# Changelog — `@sdcorejs/angular`

Changelog cho npm package `@sdcorejs/angular`, tập trung vào thay đổi public API, hành vi runtime, tài liệu sử dụng, tooling release, và các migration cần consumer chú ý.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Major digit khoá theo Angular line, nên breaking change luôn được ghi rõ trong mục `Changed (BREAKING for consumers)` kèm hướng dẫn migration.

## [Unreleased]

### Changed

- **The `<sd-table>` column-setup dialog was rebuilt around its own density.** Every row is a list of on/off values, so the three `sd-switch` controls became `sd-checkbox` — a switch reads as a heavyweight, standalone setting and seven stacked pairs of them dominated the dialog. The title and width fields drop to `size="sm"` and every cell gains vertical padding, so text no longer sits flush against the row edge. The grid lines move from Material's default (`on-surface` at ~12%) to `outline-variant`, keep only horizontal rules, and sit inside a single rounded border, so the eye follows rows instead of a heavy lattice. The width and toggle columns are width-capped to give the header-title field the remaining space, the drag handle became a real `<button>` (keyboard/AT reachable, `grab` cursor, no button chrome) and rows highlight on hover. **New:** a localized hint above the table (`core.component.table.config.drag-hint`) advertises drag-to-reorder, which had no affordance beyond an unlabelled handle; turning **Hiển thị** off now dims the row and disables its title/width/fixed/truncate editors — those settings do nothing for a hidden column — while leaving the display checkbox itself enabled so the column can be restored. Footer buttons lose their `mr-8`; the modal footer already lays them out with `gap: 8px`, so the margin only widened the gaps unevenly. Two new i18n keys across all five locales; first specs for the dialog (6).

- **`form-generic`'s table field used slots that do not exist.** Its side-drawer projected `<div sdTitle>` and `<div sdBody>`, but `sd-side-drawer` only accepts `sdHeaderLeft` / `sdHeaderRight` / `sdFooterLeft` / `sdFooterRight` plus a default `ng-content` — so both blocks fell into the drawer body, putting "Tạo mới/cập nhật" inside the content while the header stayed stuck on "Chi tiết". The drawer title is now driven by the actual task (add row / update row / detail, two new i18n keys), and the content sits in the default slot.
- **The same drawer was indented and scrolled sideways.** Its content carried `margin: -16px`, which existed to cancel padding the drawer no longer applies (`.sd-side-drawer-content` is deliberately `padding: 0` so each consumer decides). The negative margin therefore dragged the content past the edge. Dropped, along with a `height: calc(100vh - 97px)` whose magic number no longer matched the header/footer. Fields stack with a declared `gap` instead of a hard `mt-16` on every one of them, including the first.
- **Fields in a `group` sat flush against the section frame** — `.sd-section-body` is also `padding: 0` by design, and the fields only carried their own `px-8`, so the group now declares its own inset.
- **The expression pill lost all of its styling inside the validation dialog.** `.fb-expr` was styled from `form-builder.component.scss` under `:host ::ng-deep`, which only reaches `expression-builder` while it sits inside the builder's DOM; the validation dialog renders through an overlay on `document.body`, so the rules never applied and the control collapsed into bare text ("FEEL / Thiết lập biểu thức / functions"). The styles moved to the component that owns the markup, so they hold in any host.
- **Deleting a nested condition removed the wrong row.** The level-2 delete button passed `idxLv1` — the index of the *parent group* — into the child condition list, so removing the second child deleted the first, and removing anything from a group positioned beyond the child count did nothing at all.

### Changed

- **The form-builder's JSON, variable and validation dialogs were reworked.** JSON moves from a bare `sd-textarea` to `sd-code-editor` with `language="json"` and is pretty-printed on open — it used to be a single unreadable line that could not realistically be hand-edited. The variable rows become bordered cards on a fixed `key / label / delete` grid (they were a flex row where both inputs stretched and the delete button rendered as large as a primary action), the add control changes from `<a href="javascript:;">` to a real button, and both dialogs gain an empty state. In the validation dialog the delete control was an `<sd-icon (click)>` — not a button, so it could not be reached or activated from the keyboard — and each rule was a `mat-elevation-z2` block with inline styles; rules are bordered cards now and the `function` branch finally labels its select. The toolbar buttons for variables and validations carry a count badge, so the form's configuration is visible without opening either dialog. Three new i18n keys across all five locales.

### Fixed

- **The `<sd-table>` footer showed two different backgrounds.** Material paints the paginator itself with `--mat-paginator-container-background-color`, whose default is `--mat-sys-surface` — not white — so the pager half of the footer sat on a different colour than the action half. The paginator is part of the footer rather than a surface of its own, so it is transparent now and takes the footer background.

### Changed

- **The `<sd-table>` paginator is more compact.** Its row kept Material's default `--mat-paginator-container-size` (56px min-height) and the previous/next buttons their 40px hover state layer, which is a lot of footer for a table whose rows are 36px. Both come down through Material's own tokens (40px row, 32px state layer, 20px icon) instead of overriding sizes on the elements.

### Added

- **`<sd-table>` can render content in the command column's header** through a new `sdTableCommandHeaderDef` template (exported as `SdTableCommandHeaderDefDirective`). That header cell has always been empty — it only reserves width for the per-row command buttons — so it is the natural home for a table-level action. It takes no field argument, unlike `sdTableCellDef`/`sdTableTitleDef`, because there is only one command column, and it renders no wrapper at all when no template is projected. `form-generic`'s table field now puts its "add row" button there instead of below the table, which removes a full strip of vertical space and places "add" directly above the edit/delete buttons it belongs with.

- **`<sd-select multiple>` can offer a "Tất cả" row** — new opt-in input `showSelectAll` (default `false`) renders a checkbox row at the top of the panel, but only when `items` is a static array or `Signal` (it stays hidden for `SdSearch` lazy items, where the full dataset is unknown so "all" has no meaning). Ticking selects every enabled item matching the current search text and **adds** to the existing selection, so entries selected outside the active filter survive; unticking removes only that scope. The scope is computed from the source array rather than the rendered list, so `limit` paging cannot silently leave items out, and items disabled through `disabledField` are never touched in either direction. The checkbox carries the usual checked/indeterminate/unchecked states. `sdChange`/`sdSelection` still fire only on panel close. New public method `toggleSelectAll()`, new i18n key `core.form.select.selectAll` across all five locales, and the row exposes `data-autoid="<autoId>-select-all"`. The row reuses the option's own `<mat-pseudo-checkbox>` markup so it inherits option sizing, spacing and theme colour instead of restyling a real `mat-checkbox`; because that element is `aria-hidden`, the row itself carries `role="checkbox"`, `aria-checked`, `tabindex` and Enter/Space.
- **`SdToastData` + `SdToastType` are now exported** from `@sdcorejs/angular/services/notify`. Both already sat on the public surface of `SdNotifyService` (`toasts: WritableSignal<ToastData[]>`, `clearByType(type: ToastType)`) but were not exported, so a consumer could not annotate either. Aliased with the `Sd` prefix like the existing `NotifyOption as SdNotifyOption`. The toast container/toast components stay internal — they are not exported and `…/services/notify/components` is not an entry point, contrary to what `sd-notify.md` used to claim.
- **Docs for three previously undocumented entry points** — `components/form-generic` (form builder, form renderer, `sd-feel-expression`, the schema model and the configuration token), `components/ckeditor-styles`, and `forms/directives` (`sdSuffixDef` / `sdLabelDef` / `sdViewDef` / `sdItemDef`, with a table of which control reads which).
- **CI actually runs the tests.** A `test` job now gates every npm publish, and a new `ci.yml` runs `check:sync`, lint, build, the unit suite and the repo script tests on every push and pull request. Previously nothing ran the ~4,600 specs at all, and `npm run lint:release` — a documented pre-release step — was red on a clean `main`.
- **64 new i18n keys across all five locales** (vi, en, ja, ko, zh; 525 → 589, parity verified) covering `query-bar`, `query-builder`, `tree`, `sd-hover-copy` and `modules/layout`, which previously shipped hardcoded Vietnamese and English.
- **Coverage đo trên mẫu số đầy đủ, và threshold siết lại đúng số đo** — `coverage-includes.spec.ts` dùng `import.meta.webpackContext` kéo mọi file source vào test bundle, nên file không spec nào import vẫn được instrument (trước đó nó không nằm ở cả tử số lẫn mẫu số, khiến việc thêm test đầu tiên vào một vùng chưa có test có thể làm % TỤT). `tsconfig.spec.json` mở `include` sang `**/*.ts` — hệ quả phụ đáng giá: `ng test` giờ type-check cả source dưới path mapping source (không phải `dist`). Threshold 72/62/71/72 → **78/67/75/78**, sát số đo thật 79.01/68.00/76.48/79.83 (trước đây gate thấp hơn thực tế ~7pp nên gần như không chặn gì).
- **Karma không còn báo xanh cho một run RỖNG** — bundle nặng hơn làm Chrome bị coi là chết trước khi chạy spec đầu tiên (`Disconnected … ping timeout`), 0 spec chạy mà exit code vẫn 0. `browserNoActivityTimeout` / `browserDisconnectTimeout` / `captureTimeout` / `pingTimeout` được nâng để chờ đúng page load nặng (không phải để che spec chậm).
- **32 i18n key mới (mỗi key × 5 locale, parity 599)** — nhóm `query-bar` (popover: swap-field, placeholder chọn/nhập giá trị, loading lazy-values; field-picker empty; toàn bộ menu saved-filters), nhóm `modules/layout/sidebar` (v2 rail + mobile v2: brand, nhóm menu, đóng menu, placeholder tìm kiếm, primary-nav, "Thêm"), và `core.component.form-builder.select-item`. Đây là các chuỗi tiếng Việt hardcode nằm DƯỚI ngưỡng budget nên checker cũ không báo.
- **Đặt tên bộ lọc đã lưu dùng dialog thật** — `SdQuerySavedFiltersMenu.promptSave()` chuyển từ `window.prompt` sang `SdConfirmService.withInput` (nay là `async`). `window.prompt` chặn UI thread, không style/dịch được và bị vô hiệu trong một số ngữ cảnh nhúng.
- **Ô số trong file Excel xuất ra giờ THẬT SỰ có number format** — `SdExcelService.export` từng set `numFmt = '#'` rồi gán đè cả object `style` ngay sau (exceljs thay thế toàn bộ style khi gán), nên format chưa từng được áp. Nay numFmt nằm trong cùng object style: số nguyên mang `'0'`, số thập phân giữ General (format '#' cũ nếu được áp sẽ hiển thị 0 thành ô trống và làm tròn phần hiển thị của số lẻ — nên không giữ). Diện mạo file xuất đổi nhẹ: ô số nguyên hiển thị theo format '0'.
- **`SdFormGenericValidation` + 3 symbol liên quan import được bằng tên** — `form-generic-validation.model` giờ nằm trong models barrel của `components/form-generic`; trước đây `SdFormGeneric.validations` dùng các type này nhưng consumer không annotate được biến bằng chúng.
- **`npm run check:i18n` xanh lần đầu và đáng tin** — stripper hiểu regex literal (một regex chứa quote/backtick từng đẩy máy trạng thái vào string vĩnh viễn, đếm nhầm comment là code — `excel.service.ts` bị đếm 22 chỗ toàn comment); checker giờ đọc marker `// @i18n-ignore` (dòng đó hoặc dòng ngay dưới) đúng như i18n.md đã hứa; budget per-file tính lại theo số thực. +9 test (`npm run test:check-i18n`, gộp vào `test:scripts`).

### Security

- **Bearer token could be sent to any host.** `SdKeycloakInterceptor` gated the `Authorization` header on `config.secureRoutes?.some(route => req.url.includes(route))` — an unanchored substring test with no host check. With the documented example `secureRoutes: ['/api/v1']`, a request to `https://analytics.thirdparty.com/api/v1/collect` received the access token. It now matches on parsed origin plus a segment-aware path prefix.
- **`sdSafeHtml` was an unconditional sanitizer bypass.** It called `bypassSecurityTrustHtml()` on every value with no sanitize step, and `<sd-table>` pipes server-supplied cell data through it — a stored-XSS sink inside the library. It now **sanitizes by default**; the bypass is an explicit `| sdSafeHtml: true`. **BREAKING** for call sites relying on markup the sanitizer strips (inline `<svg>`, custom elements): add `: true` there.
- **`javascript:` URLs could execute in the app origin.** Six sidebars gated `window.open` on `path.includes('http')`, which `javascript:fetch(...)//http` satisfies. One passed no `noopener`, leaving the opened page with `window.opener`. All now parse the URL and always pass `noopener,noreferrer`.
- **Lookalike hosts inherited auth hooks.** `SdApiService` and its interceptor selected a handler with `url.startsWith(host)`, so `https://api.example.com.attacker.tld/x` matched a handler configured for `https://api.example.com`.
- **Every optional config degraded to permissive.** `SdAuthGuard`/`SdPortalGuard` returned `true` when their callback was unset; `hasPermission('')` returned `true` while the permission guard fed it route data unchecked, so a misspelled `data` key was granted; `*sdPermission` rendered on an empty binding without consulting the service; `SdLayoutService` fell back to a mock `demo@example.com` signed-in user; `SdLicenseService` approved any hostname merely *containing* `localhost`. All now fail closed, with "no restriction" declared explicitly via the new `SD_PERMISSION_PUBLIC`.
- **Root singletons cached identity with no way to clear it**, so state survived signout into the next user in the same tab. `SdPermissionService` gains `reset()`/`invalidate()`, the 401 latch became a time window instead of a permanent boolean, and `SdLayoutStorageService` gains a namespace resolver plus `clear()`. Permission codes are no longer mirrored into `sessionStorage` under a fixed UUID — readable *and writable* by any script on the origin; persistence is opt-in via `persistCache` and documented as not an authorization boundary.
- `decodeToken` renamed **`readUnverifiedTokenClaims`**: it performs no signature or `exp` check and must never drive an authorization decision.
- **Third-party network calls removed.** The offline interceptor pinged `jsonplaceholder.typicode.com` every 3 s through the app's full interceptor chain, leaking any unconditionally-attached auth header off-origin; it is now a same-origin probe behind `SD_NO_INTERNET_PROBE_URL`, issued via `HttpBackend`. `SdUtilities.getClientPublicIp()` called `api.ipify.org`; the endpoint is now a **required argument**.
- API cache and in-flight dedupe keys came from a 32-bit rolling hash collapsed to 31 bits; a collision made two unrelated requests share one response body. Now SHA-256.

### Fixed

- **Accessibility.** Four a11y lint rules were switched **off**, and `aria-hidden="true"` had been used to silence tooling rather than fix markup — including on 10 real `<input>` elements and on wrappers containing an entire `mat-form-field`, an entire `<mat-calendar>`, the whole form-builder canvas, a whole sidebar menu branch, and three `mat-sort-header` divs, which made table sorting unusable with assistive tech. The rules are back on as `error`. Click-only controls are keyboard-operable, async states carry `role="status"`/`aria-live`, the `role="tablist"`/`treeitem` patterns are complete, and every `outline: none` has a `:focus-visible` replacement — notably `sd-button`, and `sd-modal`, which leaked a global focus-ring reset through `ViewEncapsulation.None`.
- **Chế độ `hideInlineError` giờ có tiếng cho screen reader.** Ở chế độ này thông báo lỗi chỉ sống trong tooltip của icon — không có text node nào để `aria-describedby` trỏ tới, nên trình đọc màn hình không đọc gì cả. Nay message được render thêm vào một phần tử chỉ-dành-cho-screen-reader (`span.sd-visually-hidden`, class utility mới trong `assets/scss`) và `aria-describedby` trỏ vào đó. Áp cho 12 control: input, input-number, textarea, select, autocomplete, date, date-range, datetime, chip, chip-calendar, time, editor.
- **Hai wrapper `role="button"` bọc phần tử tương tác đã được tái cấu trúc** — AT gộp cả cụm thành MỘT nút và bỏ phần tử bên trong khỏi accessibility tree. (a) Hàng menu sidebar v1: `role` / `tabindex` / `aria-current` / Enter-Space chuyển xuống phần tiêu đề, nút ghim thành sibling độc lập, row giữ `(click)` cho chuột. (b) Card trên canvas của form-builder (group / break / component — bọc cả nút hành động lẫn preview control có `<input>` thật): card bỏ hẳn `role="button"`, affordance bàn phím/AT thành một `<button>` thật ở đầu thanh action (`aria-pressed` + `aria-label`), và thanh action hiện cả khi `:focus-within` để focus không rơi vào nút vô hình.
- **Form error messages that never rendered.** Writing to the validation control with `setValue(v, { emitEvent: false })` suppresses the async validator's completion, so the state signal never ticks and OnPush shows a red outline with no message. Fixed in `clear()` on input / input-number / autocomplete, in every write in date-range, and in `<sd-select>`'s primary selection path.
- **Validators a consumer attached to the public `formControl` were silently wiped** by destructive `clearValidators()`/`setValidators()` blocks in select, autocomplete, textarea, chip, chip-calendar and date-range.
- **`<sd-date-range>` `[required]` could never fail** — `Validators.required` was applied to a control whose value is always an object.
- **`<sd-date-range>` and `<sd-time-range>` no longer inject their internal endpoint controls into the consumer's FormGroup under random UUID keys**, which broke the value shape and `form.reset(obj)`.
- **The shared form connector silently dropped the control** when the parent FormGroup already declared one at the same `name`: the user typed, `form.value` never changed, the form submitted empty, and nothing warned.
- **`<sd-chip>` / `<sd-chip-calendar>` mutated the caller's array in place** and re-set the same reference, so `[(model)]` never emitted.
- **A live OOM reproduction** in `query-builder` — `[items]="field.values || []"` allocated a fresh array every change-detection pass and `sd-select`'s `toObservable(items)` loop froze the page. Fixed, along with the same allocation shape in query-bar, table, org-chart and tab-router.
- **Table row identity was a content hash**, so `flattenTree`'s `visited` Set **silently dropped the second of two content-equal rows from the rendered output**. Identity now comes from the new `option.rowKey`, falling back to per-object identity. **BREAKING** for tables using `preserveSelection` across a server re-fetch, or asserting on `data-autoid="…-tree-toggle-<id>"` in E2E.
- **A pure pipe mutated its own input** (`selection-visible`), appending duplicates without bound; a sibling pipe slept 500 ms inside an `async` pure pipe to paper over a change-detection ordering problem.
- **Promises that never settled on the cancel path.** All six `SdConfirmService` methods, `SdDocxService.open()` and `SdUtilities.upload()` left the caller's `await` pending forever when the user backed out. `upload()` additionally resolved inside its loop, so validation failures after the first file were swallowed.
- **Resources outliving their owner.** `<sd-modal>` had no destroy hook at all and orphaned its overlay; `sd-upload-file` left four drag listeners on a consumer-supplied element; `SdNotifyService` never destroyed the `<body>` node it created; `<sd-side-drawer>`'s scroll lock could leave the page permanently unscrollable with two stacked drawers; `<sd-modal-resizable>` rewrote inline styles on every `.modal-resizable` element in the document; and 13 `setTimeout` sites across `forms/**` stored no handle, two of which called `detectChanges()` after destroy. `SdCacheService` kept every cached URL forever — now a bounded LRU via `maxMemoryEntries` (default 500).
- **`SdLoadingService` leaked its overlay and stylesheet into the document permanently** under `provideAnimations()`: `Renderer2` from `AnimationRendererFactory` defers `removeChild` to the animation engine's next flush, which never happens on teardown.
- SSR-unsafe global `document`/`window` access in `preview-image`, `SdLicenseService`, `global-error.handler` and a sidebar.
- **The published package was not consumable.** The primary entry point exported **nothing** — `src/public-api.ts` was ten bare `import` statements, so `import { SdButton } from '@sdcorejs/angular'` resolved to nothing in every published version. `@angular/router` and `@angular/animations` were used but declared as neither dependency nor peer. `"sideEffects": false` was factually wrong (`Chart.register(...)` at module scope, five bare `prismjs` grammar imports), letting bundlers legally drop them with a silent production-only failure. `@omer-go/docx-parser-converter-ts` was a hard runtime dependency with zero imports.

### Removed (BREAKING for consumers)

- **Xoá hẳn entry point `@sdcorejs/angular/services/docx`** (`SdDocxService` — chuyển DOCX sang HTML qua pandoc). Đây là entry point duy nhất chứa code vendored GPL-2.0-or-later (bản copy pandoc-wasm core) trong một package khai MIT; xoá nó loại bỏ xung đột giấy phép thay vì phải relicense hay tách package. Không có thay thế trong thư viện — consumer cần chức năng này tự tích hợp [pandoc-wasm](https://github.com/pandoc/pandoc-wasm) (GPL) ở tầng app của mình. Dependency `@bjorn3/browser_wasi_shim` (chỉ docx dùng) và 3 key i18n `core.docx.*` đi theo. File `NOTICE` (thêm trong chính chu kỳ Unreleased này) cũng gỡ vì không còn code vendored nào để ghi nhận.
- **Bỏ TOÀN BỘ re-export từ `@sdcorejs/utils`** — nguyên tắc: cái gì `@sdcorejs/utils` sở hữu thì import và đọc doc ở `@sdcorejs/utils`, thư viện này không làm mặt tiền trung gian nữa. Package đó đã là dependency runtime của thư viện nên có sẵn trong tree; thêm nó vào `package.json` của app khi import trực tiếp. Cụ thể:
  - `utilities/extensions` bỏ re-export `ArrayUtilities` / `ColorUtilities` / `DateUtilities` / `NumberUtilities` / `StringUtilities` / `ValidationUtilities` / `Utilities` / `BrowserUtilities` → import từ `@sdcorejs/utils/fns`. Entry point còn lại `ObjectUtilities`, `SdUtilities` (14 hàm cài đặt cục bộ) và nhóm url-safety (`sdParseUrl`, `sdOpenExternal`, …) — code local.
  - `utilities/models` bỏ re-export `Color`, `Size`, `Order`, `NestedKeyOf`, `Filter*`, `Operator*`, `QueryReq` / `PagingReq` / `PagingRes`, `MaybeAsync` / `resolveMaybeAsync` / `normalizeAsync`, `ValidationPatternType` / `ValidationPattern` → `@sdcorejs/utils/models`; `VALIDATION_PATTERNS`, `EMPTY_STR` → `@sdcorejs/utils/constants`. Entry point còn lại `icon.model` + `unwrap-signal.model` (local). Bảng "ở đâu bây giờ" đầy đủ trong `utilities/models/models.md`.
  - **Xoá hẳn entry point `@sdcorejs/angular/models`** — nó chỉ re-export `Language` + `SUPPORTED_LANGUAGES`; import từ `@sdcorejs/utils/models` / `@sdcorejs/utils/constants`. `@sdcorejs/angular/i18n` cũng thôi re-export hai tên này.
  - Spec của các file re-export thuần (array/color/date/number/string extension, pattern.model) xoá theo — chúng test hành vi của `@sdcorejs/utils`, thuộc repo đó.
- **Xoá hẳn entry point `@sdcorejs/angular/components/document-builder`** (`<sd-document-builder>` — trình dựng tài liệu CKEditor cho mẫu hợp đồng, legacy từ hệ cũ). Không có thay thế; soạn thảo rich-text vẫn còn `<sd-editor>` / `<sd-mini-editor>`. 6 key i18n `core.component.document-builder.*` đi theo. `<sd-ckeditor-styles>` giữ nguyên (editor/mini-editor vẫn nhúng).

### Changed (BREAKING for consumers)

Đợt đổi tên public API có chủ đích, **xoá hẳn tên cũ, không giữ alias `@deprecated`**. Lý do gộp một lần: tag format `^\d+\.\d+$` khoá major theo Angular line, nên semver KHÔNG thể phát tín hiệu breaking — mỗi lần hoãn thì chi phí migration về sau lại tăng.

- **Pipe `translate` → `sdTranslate`** (class `TranslatePipe` → `SdTranslatePipe`). Tên cũ đụng trực diện pipe cùng tên của `@ngx-translate/core`; cả hai đều standalone nên app dùng song song KHÔNG import chung vào một component được. Migration: find/replace `| translate` → `| sdTranslate` và `TranslatePipe` → `SdTranslatePipe`.
- **`MatPaginatorIntlCro` → `SdTablePaginatorIntl`** (`@sdcorejs/angular/components/table`). Tên cũ là vết copy-paste từ ví dụ locale Croatia, lại mang tiền tố `Mat` gây hiểu nhầm là API của Angular Material.
- **Sidebar bỏ tên không tiền tố** — `SidebarV2Component` → `SdSidebarV2` (`sidebar-v2` → `sd-sidebar-v2`), tương tự `V3`, `MobileV1/V2/V3`; `SidebarMobileOverlayComponent` → `SdSidebarMobileOverlay`. Nội bộ: `SidebarV1Component` → `SdSidebarV1`, `SidebarComponent` (selector `sidebar` — tên element toàn cục cực dễ đụng) → `SdSidebarV1Panel` (`sd-sidebar-v1-panel`).
- **Helper PascalCase của `form-generic` chuyển sang `sd` + camelCase** — `GenerateId` / `GenerateKey` / `GetAttributes` / `GetComponentAttributes` / `GetDatetimeValue` / `GetVariableAttributes` / `EvaluateExpression` / `ExpressionToJavascriptExpression` / `TemplateToCondition` / `SdFormatComponent` → `sdGenerateId` / `sdGenerateKey` / `sdGetAttributes` / … Chúng là hàm thuần nhưng đọc như class (`new GenerateId()` nhìn vẫn hợp lệ). Const đi kèm: `DayInfoTypes` / `DayInfoPreviouses` / `AttributeOperators` / `TableColumnTypes` / `FormBuilderComponents` / `COMPONENT_ICONS` → `SD_DAY_INFO_TYPES` / `SD_DAY_INFO_PREVIOUSES` / `SD_ATTRIBUTE_OPERATORS` / `SD_TABLE_COLUMN_TYPES` / `SD_FORM_BUILDER_COMPONENTS` / `SD_COMPONENT_ICONS`.
- **Namespace `qb*` / `QB_*` / `Qb*` của `query-builder` → `sdQb*` / `SD_QB_*` / `SdQb*`** — ví dụ `qbNewRule` → `sdQbNewRule`, `isQbGroup` → `sdIsQbGroup`, `QB_OPERATORS_BY_TYPE` → `SD_QB_OPERATORS_BY_TYPE`, `QbGroup` / `QbRule` / `QbToken` → `SdQbGroup` / `SdQbRule` / `SdQbToken`. Các type đã đúng tiền tố (`SdQbRelativeUnit`, …) giữ nguyên.
- **`sdLoadError` → `loadError` trên `<sd-tree-select>` và `<sd-entity-picker>`** — hai component này là chỗ duy nhất dùng tiền tố `sd` cho sự kiện load-error, trong khi `<sd-tree>` và `<sd-preview-pdf>` (cùng sự kiện, cùng `SdTreeLoadErrorEvent` ở nhóm tree) đã publish tên `loadError` từ trước. Gộp về `loadError`. Migration: find/replace `(sdLoadError)` → `(loadError)` trên hai element đó.
- **Xoá toàn bộ alias `@deprecated` dưới `utilities/**`** — `SdColor`, `SdSize`, `SdNestedKeyOf`, `SdOrder`, `SdFilter*`, `SdQueryReq` / `SdPagingReq` / `SdPagingRes`, `SdMaybeAsync` / `SdResolveMaybeAsync` / `SdNormalizeAsync`, `SD_EMPTY_STR`, `hslToHex` / `rgbToHex`, `SdPatternType` / `SdPatternCommon` / `SdPatternCommons`, và các member lỗi thời trên `StringUtilities` (`REGEX_PHONE_VN`, `REGEX_IDVN`, `REGEX_IDVN_OR_PASSPORT`, `isValidEmail`, `isValidPhone`, `isValidCode`). Bảng ánh xạ đầy đủ ở `utilities/models/models.md`. ⚠️ Riêng nhóm pattern KHÔNG phải đổi tên thuần: field `regex` nay là `pattern`, và 3 member đổi tên kèm i18n key (`PHONE_VN` → `VN_PHONE`, `IDVN` → `VN_ID`, `IDVN_OR_PASSPORT` → `VN_ID_OR_PASSPORT`). `<sd-input [pattern]>` vẫn nhận 3 chuỗi cũ qua bảng alias nội bộ nên template không vỡ.

### Changed

- **Siết default generic `any` → `unknown` trên 19 file model** (82 khai báo), gồm `components/tree/src/tree.model.ts` (toàn bộ type export), `components/table/src/services/table-filter/table-filter.model.ts`, `components/table/src/models/table-column.model.ts`, `components/query-bar/src/query-bar.model.ts`, `forms/models/**`, … Consumer viết `SdTableColumn<User>` hay `SdTreeOption<User>` từ nay được suy luận kiểu thật và báo lỗi khi dùng sai, thay vì im lặng như với `any`. Thêm `SdTableColumnAnyRow` cho vài vị trí tham số nội bộ row-agnostic (giải thích trong `table-column.model.ts`).
- **`SdUtilities` KHÔNG bị xoá** — marker `@deprecated` cũ mô tả sai: đây không phải alias mà là 14 hàm cài đặt cục bộ. Marker đã được gỡ, implementation giữ nguyên.

### Không đổi (có chủ đích)

- **Tên output KHÔNG đổi hàng loạt.** Đợt này từng thêm tiền tố `sd` cho ~73 output (`close` → `sdClose`, `search` → `sdSearch`, …) nhưng đã đảo lại trước khi release: tên không tiền tố là tên đã publish tới 1.6, quen thuộc, và khớp thông lệ Angular Material (output không mang prefix). Hệ quả chấp nhận: surface output vẫn **mixed** — 16 tên `sd*` đã publish từ 1.4/1.6 (`sdChanges`, `sdBlur`, `sdFocus`, `sdClosed`, `sdCloseError` trên modal/side-drawer/inform/import-excel, `sdCancel` trên job-progress, `sdAction`, `sdKeydown`, …) giữ nguyên vì đổi chúng mới là breaking. Muốn thống nhất toàn bộ thì cần một đợt riêng kèm codemod.
- `click` của `<sd-button>` giữ nguyên tên. Đổi sang `sdClick` sẽ khiến mọi `(click)` sẵn có của consumer im lặng rơi về DOM event gốc — vẫn chạy nhưng đổi payload và bỏ qua gate `disabled`. Đây là kiểu breaking "âm thầm" nguy hiểm nhất, cần một đợt riêng kèm codemod.
- Một số vùng vẫn giữ default generic `any` vì `unknown` gây lan quá rộng (`import-excel`, `services/excel`, phần lớn `components/table/src/models/**`, `form-generic-component.model.ts`) — chi tiết trong ghi chú review của đợt này.

## [1.6] - 2026-08-07

Release suffix `1.6` publishes `19.1.6`, `20.1.6`, and `21.1.6` as a stable release across the maintained Angular lines.

### Added

- **`sd-date` auto-formats a typed date** - separators appear while you type (`22081991` becomes `22/08/1991`); non-digits are dropped and the input is capped at eight digits. Deleting never re-adds the separator you just removed.
- **Sidebar menu search matches routes and initials** - the menu filter now also matches a menu's route path (`product`) and the ordered initials of its label (`sp` finds `San pham`), on top of the existing accent-insensitive title match. `HighlightSearchPipe` marks each matched initial when there is no contiguous substring to highlight.
- **Tabs for the built-in `forbidden` and `not-found` pages** - both register a `@SdTabComponent` (icons `block` and `search_off`), so opening them in a tabbed shell shows a real icon and a translated label instead of an empty tab. New i18n keys `core.module.layout.{forbidden,not-found}.tab-name` in all five locales, plus a shared `resolveTabName()` helper that `home` now uses as well.

### Fixed

- **`sd-date` and `sd-date-range` accepted a half-typed date as a value** - typing `11/12/2` produced year 0002, `11/12/20` produced year 0020, and deleting back to `11` produced year 1100, with the error flag cleared so the field looked valid. Both inputs are bound to Angular Material date inputs, which re-parse the text after every keystroke; the stock date-fns adapter accepts a short year and falls back to `parseISO`, which reads `11` as a century. The new `SdStrictDateFnsAdapter` skips that fallback and requires the text to round-trip through the configured format, so a control only ever receives a date the user finished typing. `sd-datetime` is unaffected - its input is not `[matDatepicker]`-bound.
- **PDFs failed to open in production builds** - `<sd-preview-pdf>` pointed pdf.js at a worker file that esbuild never emitted, so every document ended in the "Setting up fake worker failed" network-error state after an AOT deploy while `ng serve` was fine. The worker bundle is now inlined and handed to pdf.js as a `blob:` URL, so consumer apps need no `angular.json` assets entry and no manual file copy. Requires a deployment CSP that allows `worker-src blob:`; `sd-preview.md` documents the manual `workerSrc` escape hatch.
- **`sd-table` export button label was hard-coded English** - the main Export button now goes through `I18nService` like the export-excel and export-csv menu items already did, so a Vietnamese user sees "Xuat du lieu". New keys `core.component.table.export` and `core.component.table.exporting` in all five locales.

### Changed (BREAKING for consumers)

- **`TableExportService.exportTitle` is no longer a `WritableSignal`** - it became a `computed()` over the current language plus export progress. Drive progress through the new `setExportProgress(percent | null)` instead of assigning to `exportTitle`. Nothing in the library assigned to it; only consumers that did need to migrate.

## [1.5] - 2026-07-28

Release suffix `1.5` publishes `19.1.5`, `20.1.5`, and `21.1.5` as a stable release across the maintained Angular lines.

### Changed

- **Layout V2/V3 navigation polish** - centered compact account and drawer controls, removed the collapsed V3 fallback brand icon, and unified desktop/mobile menu search behind an internal Soft-pill presentation without changing public APIs or filtering behavior.
- **Layout account menu** - added optional profile, settings and notification actions plus role metadata to the shared V1/V2/V3 account presentation; consumers continue to own navigation, authorization and notification data.

### Fixed

- **Showcase published-doc versions** - derive every supported `1.2+` documentation release from `published-docs/versions.json`, so the version selector exposes the existing 1.3/1.4 archives and automatically accepts the 1.5 archives after publishing instead of canonicalizing every route to 1.2.
- **Layout mobile containment** - render the Layout, Mobile V2 and Mobile V3 custom-element hosts as blocks so full-height shells and the V3 topbar start inside consumer and Showcase containers instead of aligning below an inline baseline.

## [1.4] - 2026-07-23

Release suffix `1.4` publishes `19.1.4`, `20.1.4`, and `21.1.4` as a stable release across the maintained Angular lines.

### Added

- **Time controls and input masks** - added timezone-free `SdTime` / `SdTimeRange`, reusable raw/display input-mask adapters and common business presets, all integrated with the shared form lifecycle contract.
- **Responsive navigation and state UI** - added the signal-based `SdViewportService`, router/manual `SdBreadcrumb`, and accessible loading/empty/error/forbidden/success `SdDataState` presentation.
- **Typed business selection** - added generic server-backed `SdEntityPicker` and static/lazy `SdTreeSelect` controls with stable-key selection, hydration, templates, responsive layout, keyboard behavior and form integration.
- **Safe workflow and operations primitives** - added scoped `SdUnsavedChangesService` guards/adapters, shared poll/SSE `SdTaskService`, `SdJobProgress`, and normalized/redacted `SdAuditDiff`.
- **Graph persistence foundation** - added the public `SdGraphSerializer` plus identity/envelope/storage-adapter entrypoint used by cache and storage to preserve `Date`, `Map`, `Set`, shared references and cycles with bounded validation.
- **Complete PDF workflows** - added continuous scroll, printing adapters, outline navigation, bounded thumbnails/search, browser capability tokens and consumer-facing PDF state/event types.

### Changed (BREAKING for consumers)

- **Angular signal input/output contracts** - migrated compatible component inputs and outputs to `input()` and `output()` across Angular 19/20/21 while preserving template binding names and behavior. Direct class consumers and tests must read migrated inputs as signals (for example `component.value()`), set them through Angular's `ComponentRef.setInput(...)`, and use the output `emit()`/`subscribe()` contract instead of RxJS-only `EventEmitter` APIs.

### Changed

- **Angular dependency injection internals** - migrated compatible constructor-injected dependencies to field-level `inject()` with compatibility constructors where public inheritance may depend on the existing class shape. Runtime constructor arguments and classes instantiated directly outside Angular injection context remain constructor-based.
- **Signal migration safety** - retained setter/aliased inputs and outputs whose listener/type semantics cannot be migrated safely yet, including outputs that rely on `EventEmitter.observed`; these exceptions preserve current runtime behavior.
- **Form lifecycle foundation** - consolidated registration, dynamic parent/name changes, model/control synchronization, validation state and destroy cleanup behind `ɵsdFormControlConnector` while retaining existing template bindings.
- **API request safety** - GET requests deduplicate by default; mutations deduplicate/retry only through explicit opt-in. Added typed PATCH, per-caller `AbortSignal`, bounded backoff and deterministic in-flight cleanup; response generics now default to `unknown`.
- **Loading ownership** - `start()` now returns an idempotent ref, overlapping owners are reference-counted, `run()` scopes async work, and browser DOM/style state is shared and cleaned up safely.
- **Cache and storage persistence** - activated `SD_CACHE_CONFIG`, added namespace/version/custom serializers, exact cached-absence snapshots, load coalescing, typed handle teardown, legacy JSON migration and SSR/quota/corruption containment.
- **Responsive layout behavior** - layout responds live to viewport signals while legacy responsive services/tokens remain supported as adapters.
- **Release documentation rollout** - the multi-version sync now treats the canonical npm README and i18n quality scripts as managed release inputs, while the sync guard fails closed on README, package-version, script or generated-workspace drift.

### Fixed

- **`sd-table` empty-result reload** - kept a configured reload action enabled when the current items or total are zero, allowing users to retry without changing export or paginator behavior.
- **Showcase loading documentation manifest** - aligned the generated loading-service example count with the current showcase source so documentation generation no longer reports a stale manifest expectation. (#15)
- **Published no-op and lifecycle paths** - implemented the previously inert PDF print/outline/continuous APIs and hardened modal/drawer/tab close hooks, task cancellation, picker races and tree cascade/error behavior.
- **Accessibility and resource cleanup** - added semantic breadcrumb/data-state/progress/audit markup, focus/keyboard handling, bounded PDF work, SSR guards and deterministic listeners/timers/subscriptions/EventSource teardown across the new surfaces.
- **Form expression evaluation** - corrected `NextDay` handling so relative expressions remove the `NextDay` token instead of the unrelated `LastDay` token before evaluation.
- **Showcase release and layout demos** - preserved repeated populated changelog groups such as breaking and non-breaking `Changed` sections, and made the Layout Desktop/Mobile controls switch the actual rendered sidebar through the scoped viewport adapter.

### Deprecated

- **API compatibility aliases** - deprecated `SdApiOption.autoCache` in favor of `dedupe` and `SD_API_CONFIGURATION` in favor of `SD_API_CONFIG`.
- **Generic cache callback providers** - deprecated directly typed legacy callbacks; migrate to globally safe `unknown` callbacks or use `adaptLegacySdCacheCallbacks()` temporarily with a runtime guard.

## [1.3] - 2026-07-18

Release suffix `1.3` publishes `19.1.3`, `20.1.3`, and `21.1.3` as a stable release across the maintained Angular lines.

### Added

- **Opt-in clearable controls** - added `clearable` support to text, number, color, date, and datetime controls, and enabled clear actions for inline-column and external table filters. Existing behavior remains unchanged unless the option is enabled. (1176664)
- **Shared datetime picker integration** - replaced the remaining vendored datetime picker implementation with `@sdcorejs/angular-material-datetime@1.0.3`, synchronized the integration across Angular 19/20/21, and preserved model refresh behavior with focused regression coverage. (f66de9c)
- **Showcase release discovery** - added SDCoreJS branding, social metadata, indexable GitHub Pages route shells, and a version-aware documentation experience across the maintained workspaces. (#8, 8f334f6)

### Changed (BREAKING for consumers)

- **Removed the AuthOM integration** - deleted `@sdcorejs/angular/modules/authom` and all related Showcase and published-document references, with no compatibility stub. **Migration:** remove AuthOM imports and migrate each use case to the supported `auth`, `keycloak`, `permission`, `layout`, or `icon` entry point as appropriate. (dfced07)

### Changed

- **Type-only barrel exports** - marked 46 type-only wildcard re-exports explicitly with `export type *` while preserving all public type names and runtime value exports across Angular 19/20/21. (#12)
- **Showcase documentation navigation** - refreshed maintainer attribution and navigation while preserving legacy routes and stable fragment IDs. (#9)

### Fixed

- **Loading overlays on duplicate hosts** - loading start, stop, and state checks now update every matching host, including duplicated router-tab hosts. (#11)
- **Table selection and tab reload behavior** - select-all skips disabled rows and keeps header state synchronized; forced tab reload recreates existing tabs even for same-URL navigation. (43dfed1)
- **Form-builder drag/drop feedback** - stabilized palette previews and live placeholder movement so only one preview is rendered and drops follow the active CDK position. (2b7d644, 7b774f5, 2468118)

## [1.2] - 2026-07-11

Release suffix `1.2` publishes `19.1.2`, `20.1.2`, and `21.1.2` as a stable patch across the maintained Angular lines.

### Fixed

- **`sd-table` hidden-paginator height** - contained Material's 48px footer-action touch targets without forcing extra height when no action is rendered, preventing the table host from gaining a redundant outer vertical scrollbar for short data sets. The fix is synchronized across Angular 19/20/21 and avoids relational selectors for compatibility with the supported browser baseline. (#6)

## [1.1] - 2026-07-10

Release suffix `1.1` publishes `19.1.1`, `20.1.1`, and `21.1.1` as a hotfix across the maintained Angular lines.

### Added

- **Release sync guard** - added `npm run check:sync` and wired it into the publish workflow plus local deploy script so release fails before npm publish if `v20` or `v21` drifts from the `v19` source workspace.

### Fixed

- **Footer right projection alignment** - restored the v19 `margin-left: auto` behavior in v20/v21 for `sd-section`, `sd-side-drawer`, and `sd-modal` right-only footers, with matching regression assertions.

## [1.0] - 2026-07-10

Release suffix `1.0` publishes `19.1.0`, `20.1.0`, and `21.1.0` with the same Core UI surface across the maintained Angular lines.

### Added

- **Core UI confirm/section controls** - expanded dialog and confirmation flows with section-level controls, then rolled the same surface through v20 and v21.

### Changed

- **Material M3 theme alignment** - aligned Core UI theme tokens with Angular Material M3 system variables across v19/v20/v21.
- **Release docs** - documented the shared `v1.0` release suffix flow for publishing `19.1.0`, `20.1.0`, and `21.1.0`.

### Fixed

- **`form-generic` builder stability** - stabilized builder drop handling and modal footer behavior.
- **`sd-confirm` docs encoding** - repaired mojibake in the confirm service default button label examples before release docs collection.

## [0.10] - 2026-06-30

### Added

- **Shared display pipes** — added `sdFormatDate`, `sdFormatDatetime`, and `sdView` display pipes with tests and npm-facing docs.
- **`sd-table` column filter callback** — column filters can notify committed value changes through `onChange`, with regression coverage and showcase wiring.
- **Phased lint workflow** — added release-oriented lint entry points and a phase runner for targeted Angular workspace cleanup.

### Changed

- **Core UI docs and API docs** — expanded standalone import, table-cell control, shared pipe, and AI-facing usage guidance, then regenerated docs for the maintained Angular lines.
- **`form-generic` builder UX** — refined drag/drop, resize, preview, row feedback, palette placement, row-level resize state, and Material-style mode controls while keeping render behavior covered by regression tests.
- **Table and view display rendering** — reused shared display pipes in table/view flows and aligned command icon rendering for more consistent UI output.
- **Release hardening across v19/v20/v21** — modernized safe Angular metadata and dependency injection usage, reduced runtime/Sass warnings, and strengthened fragile test assertions.

### Fixed

- **`tab-router` lifecycle handling** — ported `beforeClose` handling and `SD_TAB` injection fixes across all maintained versions.
- **`sd-table` selection and filter stability** — added table filter `onChange` support, selector disabled fixes, preserved selected-row behavior, docs, and showcase updates.
- **`form-generic` preview render safety** — only registered controls are patched before dynamic form fields finish registering, preventing preview render instability.
- **`form-generic` drop feedback** — made drag previews text-free, centered drop rails, and row enter predicates match the actual form layout placement.
- **`notify` toast formatting** — applied toast formatting fixes and kept preview regressions covered across maintained Angular lines.
- **Sass grid utilities** — replaced deprecated Sass percentage calls in grid utilities to reduce build warnings.

## [0.9] - 2026-06-22

### Fixed

- **`sd-table` inline column filter defaults** — table option replacement now recreates the table/filter state so default inline filter values are applied on first load and stale state is not carried across option instances.
- **Date-range and operator autoId stability** — cleaned up generated selectors for `sd-date-range` and table column operators so automation targets remain deterministic.

### Changed

- **`sd-table` internals** — extracted paging/filter mapping, local filtering, row reorder, tree render state, and selection preservation helpers behind focused unit coverage. Public table APIs remain unchanged.

## [0.8] - 2026-06-16

### Added

- **`components/autoid-inspector` — Forge E2E export** — inspector export tab can call a configured backend host to generate Playwright / Robot Framework E2E ZIPs from the current autoid scan payload, while API keys stay server-side.
- **Core UI source-of-truth docs for AI rendering** — expanded component/form/service/module/pipe markdown so downstream agents can choose existing Core UI primitives before writing local CSS or custom markup. Notable docs cover `sd-operator`, `sd-tree`, `sd-query-bar`, `sd-query-builder`, `sd-inline-text`, `sd-input-color`, module `When NOT to use` guidance, pipe misuse guidance, and concrete copyable examples.
- **`STYLE-GUIDE.md` AI rendering guardrails** — added rules for 4px-based spacing, Core UI utilities/components first, `sd-view` for label/value display, `sd-badge` for status rendering, and `size="sm"` for dense/table form controls.

### Changed

- **`sd-modal` and `sd-side-drawer` close buttons** — close affordances now render as accessible icon buttons with a stable hit area, neutral hover/active states, focus-visible ring, and theme CSS variables.
- **`sd-table` and form docs** — table docs now call out `useBadge` / `sd-badge` for status columns and `size="sm"` for filters or inline editors in dense table contexts; form docs mirror the same compact-size convention.
- **`sd-query-bar` docs** — clarified that `SdQuery.filters` is already the canonical `Filter[]` payload and must not be copied into `sd-table.filter.externalFilters`, which describes built-in toolbar controls.

### Fixed

- **Docs copy-paste safety** — replaced placeholder snippets in public examples with concrete column definitions so AI-generated code does not inherit non-compiling skeletons.

## [0.7] - 2026-06-11

### Added

- **`modules/keycloak` — `silentRenewUrl` + `authErrorUrl`** — `SdKeycloakTenantConfig` nhận thêm 2 tùy chọn (mặc định `'silent-renew'` / `'auth-keycloak-error'`), là basename của 2 file tĩnh consumer đặt trong `public/`. Khi `keycloak.init()` ném lỗi, app tự redirect full-page tới trang lỗi tĩnh (`${origin}/<authErrorUrl>.html`) — render được kể cả khi bundle chưa boot — kèm guard chống vòng lặp. Package ship sẵn template tại `modules/keycloak/htmls/` (`silent-renew.html` cố định; `auth-keycloak-error.html` bản tổng quát dùng-được-ngay, không logo/email/phụ-thuộc-ngoài, chỉ placeholder). Log dev đổi sang tiếng Anh (thư viện global).
- **`components/inform` — export từ barrel** — `<sd-inform>` giờ được re-export từ `@sdcorejs/angular/components` (trước đây thiếu trong index, phải import sâu).

### Changed

- **`components/upload-file` — ưu tiên hàm `download`** — khi consumer cấu hình `download` handler (input `[download]` hoặc `SD_UPLOAD_FILE_CONFIGURATION`), click vào file đã lưu (có `idOrKey`) LUÔN gọi handler thay vì mở URL `src` lấy từ `details()` — phục vụ tải file qua endpoint có xác thực/proxy. File local chưa upload (chưa có `idOrKey`) vẫn tải trực tiếp từ blob.

### Fixed

- **`components/org-chart` — tài liệu** — sửa mojibake (UTF-8 bị double-encode kiểu CP1252) trong `sd-org-chart.md`; toàn bộ chuỗi tiếng Việt bị hỏng nay hiển thị đúng.

## [0.6] - 2026-06-10

### Added

- **`forms/select` — footer actions** — hỗ trợ project custom action vào sticky footer của panel qua `ng-template[sdSelectFooterAction]`. Template nhận context `{ searchText }`, giữ đúng thứ tự khai báo, và event binding của consumer như `(click)="addNew(searchText)"` hoạt động bình thường.
- **`forms/select` — footer visibility modes** — thêm `when="always" | "empty" | "has-result"`: luôn hiện, chỉ hiện khi có search text nhưng không có option khớp, hoặc chỉ hiện khi filter còn kết quả.
- **Showcase `/forms/select`** — bổ sung ví dụ đầy đủ cho footer actions: add button theo search text, nhiều action cùng lúc, consumer tự thêm padding, và ví dụ dùng `div role="button"` + custom CSS để action nhìn như một dropdown item không viền button.

### Changed

- **`forms/select` — footer shell** — `.sd-select-footer-actions` chỉ giữ sticky positioning, border, background và `gap: 4px`; không áp padding mặc định để consumer tự can thiệp theo nhu cầu. Container và đường gạch ngang chỉ render khi thật sự có footer action đang visible, tránh khoảng trắng/border thừa khi footer chưa hiện.

## [0.5] - 2026-06-10

### Added

- **`components/tree`** — component `<sd-tree>` mới (secondary entry point `@sdcorejs/angular/components/tree`, class `SdTree`, standalone): cây phân cấp cho folder / category / đơn vị tổ chức / dữ liệu cha-con. Bind theo style `sd-table` qua `[option]` (`SdTreeComponentOption`); hỗ trợ static/lazy loading + loading state, multi-select, row command, custom item template, reload thủ công, và **lọc không dấu tiếng Việt** (accent-insensitive).
- **`components/org-chart`** — new `<sd-org-chart>` organization tree component with default item cards, collapse/expand support, projected `sdOrgChartItemDef`, `[itemTemplate]` customization, and stable autoId selectors for node parts. Includes secondary entry points and showcase wiring for Angular 19/20/21.
- **`forms/select` — template `#sdSelected`** — custom render giá trị đã chọn ngay trong trigger edit-mode (`<mat-select-trigger>`), tách biệt với `#sdValue` / `sdViewDef` (chỉ tác động face read-only `viewed`/`inline`). Context `{ $implicit, item, items, display, multiple }`; fallback về `display` text khi không project nên usage cũ không đổi.
- **`components/query-builder` — so sánh field-to-field** — operator một toán hạng giờ chọn được **một field khác** làm vế phải thay vì literal (emit operand `dataType: 'field'`). Field ứng viên lọc theo đúng `type`, loại field trái, tôn trọng `allowFieldCompare: false` + guard `compareGroup`. `BETWEEN` / `IN` / `NOT_IN` / `NULL` / `NOT_NULL` vẫn literal/no-value.

### Changed

- **`components/query-builder` — relative date dùng model chuẩn `@sdcorejs/utils`** — bỏ model local, reuse `DateRelative` từ `@sdcorejs/utils` (≥ 1.1.3); `Filter` emit kèm discriminator `dataType`. Types/helpers re-export từ `@sdcorejs/angular/components/query-builder`.

### Fixed

- **`forms/select` (multiple)** — khi số lượng đã chọn chạm `[limit]`, panel giờ vẫn hiển thị các option mới/đang chọn thay vì cắt mất.

## [0.4] - 2026-06-05

### Security

- **Toast XSS hardening** (`notify`) — toast `message` giờ render dạng **TEXT** (auto-escape) mặc định thay vì `[innerHTML]` (bỏ DOM-XSS sink ở path thường). Thêm opt-in `html?: boolean` trên `SdNotifyOption`; khi `true` mới render HTML qua `DomSanitizer.sanitize(SecurityContext.HTML)` tường minh (strip `<script>`/`on*`/`javascript:`) — chỉ dùng cho markup tin cậy. `onAction` là callback app-authored (không phải input không tin cậy).

### Changed

- **Bỏ license-gate `SdBaseSecureComponent` khỏi mọi component** — 9 component không còn `extends SdBaseSecureComponent` (không enforce license khi khởi tạo). Class base + `SdLicenseService` **vẫn giữ lại** (dormant) để gắn lại license sau khi cần. Cho phép dùng/publish thư viện công khai mà không bị chặn license.

## [0.3] - 2026-06-04

> **Đổi scheme version:** bỏ hậu tố `-beta`. Từ bản này version dùng dạng `<angular-major>.0.<release>` — release này = `.3`.

### Added

- **`SdTable` tree lazy — `hasChildren`** — lazy tree (`loadType: 'lazy'`) nạp con theo yêu cầu qua `onExpandChildren(row) => Promise<T[]>`; thêm tuỳ chọn `hasChildren?: (row) => boolean` để chỉ hiện icon expand ở dòng thực sự có con (không truyền = mọi lazy node đều hiện icon). Spinner loading hiện trong ô chevron khi đang nạp.
- **`SdTable` tree — search ở cấp con** (table `type: 'local'` + `loadType: 'static'`): khi lọc inline, một nhánh được giữ nếu chính nó HOẶC bất kỳ hậu duệ nào khớp từ khoá; sibling không khớp bị ẩn (prune) + nhánh khớp **tự bung** để lộ node khớp. Clear filter khôi phục cây về trạng thái mặc định.

### Changed (BREAKING for consumers)

- **`SdTableOptionTree` giờ là discriminated union theo `loadType`** — `loadType: 'static' | 'lazy'` là **bắt buộc**.

  **Migration:** thêm `loadType` vào mọi cấu hình `tree`:

  ```diff
  // Static (children embedded sẵn trong row)
   tree: {
  +  loadType: 'static',
     childrenKey: 'children',
     defaultExpanded: 1,
   }

  // Lazy (nạp theo yêu cầu)
   tree: {
  +  loadType: 'lazy',
     onExpandChildren: row => api.getChildren(row.id),
   }
  ```

  Lazy **không còn** `childrenKey` / `defaultExpanded`; `onExpandChildren` phải trả `Promise<T[]>` (trước nhận cả `T[]`).

- **Bỏ cột tree-toggle riêng (`sdTreeToggle`)** — icon expand (đổi sang `chevron_right` / `expand_more`, hover nền tròn nhỏ) giờ nhúng vào **cột đầu**: cột STT khi bật `index`, ngược lại cột data đầu tiên — thụt lề theo cấp. Không cần đổi cấu hình; chỉ là thay đổi layout/DOM. **E2E:** không còn cột `sdTreeToggle`; nút toggle giữ `data-autoid="<base>-tree-toggle-<rowId>"` (giờ là `<button>` trong cột đầu).

### Internal

- 212 table specs xanh; lib + showcase build sạch. Showcase `/components/table` có 3 demo tree: static + child-search, lazy + loading + `hasChildren`, và no-index (toggle trong cột data đầu).

## [0.1] - 2026-06-01

Bản metadata/docs — không thay đổi API hay code runtime so với `0.0`.

### Fixed

- **`license`** — thêm field `"license": "MIT"` vào `package.json` (bản `0.0` publish thiếu → npm hiển thị UNLICENSED).
- **README npm-facing** — giờ là bản public do repo sinh ra (`docs/npm-README.md`): bỏ wording "internal use only", thêm link **Showcase** (`https://sdcorejs.github.io/sdcorejs-angular`) + **Storybook** (`https://sdcorejs.github.io/portal-template`), bỏ import `SdSearch` không tồn tại, sửa ví dụ form `[(ngModel)]` → `[(model)]`, bỏ version badge cũ.

## [0.0] - 2026-06-01

### Added

- **`components/tab`** — `<sd-tab-group>` + `<sd-tab>` declarative tabs wrapping `mat-tab-group`. Inputs: `selectedIndex` (model), `variant` (`'line' | 'pills' | 'segmented'`), `color` (SdColor), `stretchTabs`, `alignTabs`, `headerPosition`, `animationDuration`, `disableRipple`, `dynamicHeight`, `autoId`. Per-tab: `label` (required), `icon`, `badge`, `disabled`, `closable`. Lazy content via `matTabContent` + viewChild template ref. 58 specs.
- **`components/stepper`** — `<sd-stepper>` + `<sd-step>` wrapping `mat-stepper` / `CdkStepper`. Inputs: `selectedIndex` (model), `linear`, `orientation`, `labelPosition`, `headerPosition`, `animationDuration`, `disableRipple`, `color`, `autoId`. Per-step: `label` (required), `icon`, `optional`, `editable`, `stepControl`, `state`, `errorMessage`. Methods `next` / `previous` / `reset` / `goTo`. Doc tại `projects/sdcorejs-angular/components/stepper/sd-stepper.md`. 26 specs.
- **`components/ckeditor-styles`** — `<sd-ckeditor-styles>` empty-render component sở hữu global CKEditor 5 CSS qua `ViewEncapsulation.None`. Nhúng tự động trong `<sd-editor>`, `<sd-mini-editor>`, `<sd-document-builder>`; consumer không cần load CSS thủ công nữa.
- **`forms/input-color`** — `<sd-input-color>` hex color field gồm `<sd-input>` + suffix swatch + native `<input type="color">` ẩn. Hex pattern validator built-in; export `SD_INPUT_COLOR_HEX_PATTERN`. Nút Clear (X) khi có giá trị + editable + không required. 30 specs.

### Changed (BREAKING for consumers)

- **CKEditor global CSS no longer required** — `<sd-editor>`, `<sd-mini-editor>`, `<sd-document-builder>` giờ nhúng `<sd-ckeditor-styles>` nội bộ. CSS nằm trong lazy chunk của từng editor thay vì initial bundle của consumer.

  **Migration:** xoá dòng sau khỏi `angular.json` `styles[]` ở mọi consumer app:

  ```diff
   "styles": [
     "src/styles.scss",
  -  "@sdcorejs/angular/assets/scss/ckeditor5.scss",
     "@sdcorejs/angular/assets/scss/sd-core.scss"
   ],
  ```

  Không cần thao tác khác. Verify:
  1. `<sd-editor>` / `<sd-mini-editor>` / `<sd-document-builder>` vẫn render đúng (toolbar, dialog, balloon đều có style).
  2. Initial bundle giảm ~100 KB khi CSS không còn bundle global.
  3. Editor lazy chunk (khi route tới) tăng ~100 KB chứa cùng CSS dạng JS-injected styles.

  Asset `@sdcorejs/angular/assets/scss/ckeditor5.scss` vẫn ship trong package — chỉ bỏ yêu cầu import global. App cũ giữ global import vẫn chạy (`ViewEncapsulation.None` dedupe `<style>` theo component identity).

### Internal

- Showcase project tại `projects/showcase/` — catalog trực quan mọi component trong `@sdcorejs/angular`, 47 lazy demo page (Components / Forms / Services). Deploy lên GitHub Pages qua `.github/workflows/deploy-pages.yml`.

---
