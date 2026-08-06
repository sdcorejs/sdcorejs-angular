# Changelog — `@sdcorejs/angular`

Changelog cho npm package `@sdcorejs/angular`, tập trung vào thay đổi public API, hành vi runtime, tài liệu sử dụng, tooling release, và các migration cần consumer chú ý.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Major digit khoá theo Angular line, nên breaking change luôn được ghi rõ trong mục `Changed (BREAKING for consumers)` kèm hướng dẫn migration.

## [Unreleased]

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
