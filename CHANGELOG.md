# Changelog — `@sdcorejs/angular`

Changelog **độc lập** cho npm package `@sdcorejs/angular`. Repo này deploy theo nhịp riêng. Các release đến `0.9` truy vết legacy source `vn-angular`; sau mốc final sync ngày 2026-06-24, `@sdcorejs/angular` phát triển độc lập trong repo này.

- **Đơn vị release = patch tag** (`v0.0`, `v0.1`, …). Mỗi tag publish đồng thời 3 major: `19.<patch>` / `20.<patch>` / `21.<patch>` — **cùng nội dung feature**, chỉ khác Angular major shim. Vì vậy mỗi patch = **một entry duy nhất** ở đây.
- Entry trước final sync ghi rõ **synced from `vn-angular@<commit>`** để truy vết source. Entry sau final sync ghi rõ thay đổi repo-owned trong `sdcorejs-angular`.
- Major digit khoá theo Angular line → **không** dùng để báo breaking. Breaking change PHẢI ghi rõ ở mục `Changed (BREAKING for consumers)` + migration. Consumer luôn pin major: `npm i @sdcorejs/angular@^19.0.0`.

Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- **Repo ownership** — confirmed the final legacy sync at `vn-angular@d12478a1` (`release/0.0.1`); future `@sdcorejs/angular` changes are owned directly in this repo and roll out from `versions/v19` to `v20` / `v21`.

## [0.9] - 2026-06-22

Published: `@sdcorejs/angular@19.0.9` / `@20.0.9` / `@21.0.9` (npm dist-tag `latest`).
Synced from `vn-angular@26a54976`.

### Fixed

- **`sd-table` inline column filter defaults** — table option replacement now recreates the table/filter state so default inline filter values are applied on first load and stale state is not carried across option instances. Synced from `vn-angular@81c6e4fe`.
- **Date-range and operator autoId stability** — cleaned up generated selectors for `sd-date-range` and table column operators so automation targets remain deterministic. Synced from `vn-angular@25a812b6`.

### Changed

- **`sd-table` internals** — extracted paging/filter mapping, local filtering, row reorder, tree render state, and selection preservation helpers behind focused unit coverage. Public table APIs remain unchanged. Synced from `vn-angular@81c6e4fe`, `ea23b017`, `4c56a158`, and `df63de49`.

## [0.8] - 2026-06-16

Published: `@sdcorejs/angular@19.0.8` / `@20.0.8` / `@21.0.8` (npm dist-tag `latest`).
Synced from `vn-angular@076d38e2`; includes the prior untagged sync from `vn-angular@31d97772`.

### Added

- **`components/autoid-inspector` — Forge E2E export** — inspector export tab can call a configured backend host to generate Playwright / Robot Framework E2E ZIPs from the current autoid scan payload, while API keys stay server-side. Synced from `vn-angular@31d97772`.
- **Core UI source-of-truth docs for AI rendering** — expanded component/form/service/module/pipe markdown so downstream agents can choose existing Core UI primitives before writing local CSS or custom markup. Notable docs cover `sd-operator`, `sd-tree`, `sd-query-bar`, `sd-query-builder`, `sd-inline-text`, `sd-input-color`, module `When NOT to use` guidance, pipe misuse guidance, and concrete copyable examples. Synced from `vn-angular@076d38e2`.
- **`STYLE-GUIDE.md` AI rendering guardrails** — added rules for 4px-based spacing, Core UI utilities/components first, `sd-view` for label/value display, `sd-badge` for status rendering, and `size="sm"` for dense/table form controls. Synced from `vn-angular@076d38e2`.

### Changed

- **`sd-modal` and `sd-side-drawer` close buttons** — close affordances now render as accessible icon buttons with a stable hit area, neutral hover/active states, focus-visible ring, and theme CSS variables. Synced from `vn-angular@076d38e2`.
- **`sd-table` and form docs** — table docs now call out `useBadge` / `sd-badge` for status columns and `size="sm"` for filters or inline editors in dense table contexts; form docs mirror the same compact-size convention. Synced from `vn-angular@076d38e2`.
- **`sd-query-bar` docs** — clarified that `SdQuery.filters` is already the canonical `Filter[]` payload and must not be copied into `sd-table.filter.externalFilters`, which describes built-in toolbar controls. Synced from `vn-angular@076d38e2`.

### Fixed

- **Docs copy-paste safety** — replaced placeholder snippets in public examples with concrete column definitions so AI-generated code does not inherit non-compiling skeletons. Synced from `vn-angular@076d38e2`.

## [0.7] - 2026-06-11

Published: `@sdcorejs/angular@19.0.7` / `@20.0.7` / `@21.0.7` (npm dist-tag `latest`).
Synced from `vn-angular@56549bd9`.

### Added

- **`modules/keycloak` — `silentRenewUrl` + `authErrorUrl`** — `SdKeycloakTenantConfig` nhận thêm 2 tùy chọn (mặc định `'silent-renew'` / `'auth-keycloak-error'`), là basename của 2 file tĩnh consumer đặt trong `public/`. Khi `keycloak.init()` ném lỗi, app tự redirect full-page tới trang lỗi tĩnh (`${origin}/<authErrorUrl>.html`) — render được kể cả khi bundle chưa boot — kèm guard chống vòng lặp. Package ship sẵn template tại `modules/keycloak/htmls/` (`silent-renew.html` cố định; `auth-keycloak-error.html` bản tổng quát dùng-được-ngay, không logo/email/phụ-thuộc-ngoài, chỉ placeholder). Log dev đổi sang tiếng Anh (thư viện global). Synced từ `vn-angular@05ef3e0b`.
- **`components/inform` — export từ barrel** — `<sd-inform>` giờ được re-export từ `@sdcorejs/angular/components` (trước đây thiếu trong index, phải import sâu). Synced từ `vn-angular@b12dd0e2`.

### Changed

- **`components/upload-file` — ưu tiên hàm `download`** — khi consumer cấu hình `download` handler (input `[download]` hoặc `SD_UPLOAD_FILE_CONFIGURATION`), click vào file đã lưu (có `idOrKey`) LUÔN gọi handler thay vì mở URL `src` lấy từ `details()` — phục vụ tải file qua endpoint có xác thực/proxy. File local chưa upload (chưa có `idOrKey`) vẫn tải trực tiếp từ blob. Synced từ `vn-angular@dd89ae4b`.

### Fixed

- **`components/org-chart` — tài liệu** — sửa mojibake (UTF-8 bị double-encode kiểu CP1252) trong `sd-org-chart.md`; toàn bộ chuỗi tiếng Việt bị hỏng nay hiển thị đúng. Synced từ `vn-angular@c8a71d56`.

## [0.6] - 2026-06-10

Published: `@sdcorejs/angular@19.0.6` / `@20.0.6` / `@21.0.6` (npm dist-tag `latest`).
Synced from `vn-angular@62048fed`.

### Added

- **`forms/select` — footer actions** — hỗ trợ project custom action vào sticky footer của panel qua `ng-template[sdSelectFooterAction]`. Template nhận context `{ searchText }`, giữ đúng thứ tự khai báo, và event binding của consumer như `(click)="addNew(searchText)"` hoạt động bình thường. Synced từ `vn-angular@62048fed`.
- **`forms/select` — footer visibility modes** — thêm `when="always" | "empty" | "has-result"`: luôn hiện, chỉ hiện khi có search text nhưng không có option khớp, hoặc chỉ hiện khi filter còn kết quả. Synced từ `vn-angular@62048fed`.
- **Showcase `/forms/select`** — bổ sung ví dụ đầy đủ cho footer actions: add button theo search text, nhiều action cùng lúc, consumer tự thêm padding, và ví dụ dùng `div role="button"` + custom CSS để action nhìn như một dropdown item không viền button.

### Changed

- **`forms/select` — footer shell** — `.sd-select-footer-actions` chỉ giữ sticky positioning, border, background và `gap: 4px`; không áp padding mặc định để consumer tự can thiệp theo nhu cầu. Container và đường gạch ngang chỉ render khi thật sự có footer action đang visible, tránh khoảng trắng/border thừa khi footer chưa hiện.

## [0.5] - 2026-06-10

Published: `@sdcorejs/angular@19.0.5` / `@20.0.5` / `@21.0.5` (npm dist-tag `latest`).
Synced from `vn-angular@a5250948`.

### Added

- **`components/tree`** — component `<sd-tree>` mới (secondary entry point `@sdcorejs/angular/components/tree`, class `SdTree`, standalone): cây phân cấp cho folder / category / đơn vị tổ chức / dữ liệu cha-con. Bind theo style `sd-table` qua `[option]` (`SdTreeComponentOption`); hỗ trợ static/lazy loading + loading state, multi-select, row command, custom item template, reload thủ công, và **lọc không dấu tiếng Việt** (accent-insensitive). Synced từ `vn-angular@a5250948`.
- **`components/org-chart`** — new `<sd-org-chart>` organization tree component with default item cards, collapse/expand support, projected `sdOrgChartItemDef`, `[itemTemplate]` customization, and stable autoId selectors for node parts. Includes secondary entry points and showcase wiring for Angular 19/20/21. Synced from `vn-angular@c744efa0`.
- **`forms/select` — template `#sdSelected`** — custom render giá trị đã chọn ngay trong trigger edit-mode (`<mat-select-trigger>`), tách biệt với `#sdValue` / `sdViewDef` (chỉ tác động face read-only `viewed`/`inline`). Context `{ $implicit, item, items, display, multiple }`; fallback về `display` text khi không project nên usage cũ không đổi. Synced từ `vn-angular@b9a3dc54`.
- **`components/query-builder` — so sánh field-to-field** — operator một toán hạng giờ chọn được **một field khác** làm vế phải thay vì literal (emit operand `dataType: 'field'`). Field ứng viên lọc theo đúng `type`, loại field trái, tôn trọng `allowFieldCompare: false` + guard `compareGroup`. `BETWEEN` / `IN` / `NOT_IN` / `NULL` / `NOT_NULL` vẫn literal/no-value. Synced từ `vn-angular@473d4a61`.

### Changed

- **`components/query-builder` — relative date dùng model chuẩn `@sdcorejs/utils`** — bỏ model local, reuse `DateRelative` từ `@sdcorejs/utils` (≥ 1.1.3); `Filter` emit kèm discriminator `dataType`. Types/helpers re-export từ `@sdcorejs/angular/components/query-builder`. Synced từ `vn-angular@824c6ae3`.

### Fixed

- **`forms/select` (multiple)** — khi số lượng đã chọn chạm `[limit]`, panel giờ vẫn hiển thị các option mới/đang chọn thay vì cắt mất. Synced từ `vn-angular@33ec23a0`.

## [0.4] - 2026-06-05

Published: `@sdcorejs/angular@19.0.4` / `@20.0.4` / `@21.0.4` (npm dist-tag `latest`).
Synced from `vn-angular@69f56d6a`.

### Security

- **Toast XSS hardening** (`notify`) — toast `message` giờ render dạng **TEXT** (auto-escape) mặc định thay vì `[innerHTML]` (bỏ DOM-XSS sink ở path thường). Thêm opt-in `html?: boolean` trên `SdNotifyOption`; khi `true` mới render HTML qua `DomSanitizer.sanitize(SecurityContext.HTML)` tường minh (strip `<script>`/`on*`/`javascript:`) — chỉ dùng cho markup tin cậy. `onAction` là callback app-authored (không phải input không tin cậy). Synced từ `vn-angular@8a2c68a1`.

### Changed

- **Bỏ license-gate `SdBaseSecureComponent` khỏi mọi component** — 9 component không còn `extends SdBaseSecureComponent` (không enforce license khi khởi tạo). Class base + `SdLicenseService` **vẫn giữ lại** (dormant) để gắn lại license sau khi cần. Cho phép dùng/publish thư viện công khai mà không bị chặn license. Synced từ `vn-angular@d2a58656`.

## [0.3] - 2026-06-04

Published: `@sdcorejs/angular@19.0.3` / `@20.0.3` / `@21.0.3` (npm dist-tag `latest`).
Synced from `vn-angular@9f41cc60`.

> **Đổi scheme version:** bỏ hậu tố `-beta`. Từ bản này version đánh **đồng bộ** giữa `@sd-angular/core` (vn-angular) ↔ `@sdcorejs/angular` theo `<angular-major>.0.<release>` — release này = `.3`.

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

Published: `@sdcorejs/angular@19.0.1` / `@20.0.1` / `@21.0.1` (npm dist-tag `latest`).
Synced from `vn-angular@00b9a21f` (chỉ thay đổi doc; lib code KHÔNG đổi so với `0.0`).

Bản metadata/docs — không thay đổi API hay code runtime so với `0.0`.

### Fixed

- **`license`** — thêm field `"license": "MIT"` vào `package.json` (bản `0.0` publish thiếu → npm hiển thị UNLICENSED).
- **README npm-facing** — giờ là bản public do repo sinh ra (`docs/npm-README.md`): bỏ wording "internal use only", thêm link **Showcase** (`https://sdcorejs.github.io/sdcorejs-angular`) + **Storybook** (`https://sdcorejs.github.io/portal-template`), bỏ import `SdSearch` không tồn tại, sửa ví dụ form `[(ngModel)]` → `[(model)]`, bỏ version badge cũ.

### Internal

- Sync chỉ đồng bộ CODE; README + CHANGELOG do repo tự sở hữu/sinh ra (xem `CLAUDE.md`).

## [0.0] - 2026-06-01

Published: `@sdcorejs/angular@19.0.0` / `@20.0.0` / `@21.0.0` (npm dist-tag `latest`).
Pre-release: `0.0-rc.1`, `0.0-rc.2` (dist-tag `beta`).
Synced from `vn-angular@50540baf`.

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

Để tra origin chi tiết theo từng version, xem `SYNC-STATUS.md` trong mỗi `versions/v<N>/`. Các bản sau final sync dùng repo này làm source trực tiếp.
