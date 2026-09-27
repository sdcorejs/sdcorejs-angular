---
artifact_id: architecture-angular-core-3-0-release-20260925-r2-draft
artifact_kind: architecture
contract_id: angular-core-3-0-release-20260925
change_ref: angular-core-3-0-release-20260925
owner: sdcorejs-architecture
owner_repository_id: sdcorejs-angular
owner_repository_role: library
owner_module_id: null
execution_host_repository_id: portal-onehub
integration_owner_repository_id: sdcorejs-angular
track: angular
stack_profile: core-ui-angular
source_spec: .sdcorejs/specs/angular/2026-09-25-18-10-core-3-0-release.md
source_plan: none
commit_policy: with-change
status: draft
approved: false
revision: 2
supersedes: .sdcorejs/architecture/angular/2026-09-25-16-40-core-3-0-release.md
---

# Architecture — Core UI release 3.0 (revision 2)

- **Nguồn:** spec đã duyệt `spec-angular-core-3-0-release-20260925-r3` (`sha256:v1:7282d623…`, supersede r2).
- **Revision 2** supersede kiến trúc r1: bỏ mọi thứ liên quan tới preset omeu; dark mode chỉ cho preset `default` (xem mục Change control).
- **Trạng thái:** bản nháp đã sửa theo review kiến trúc (1 BLOCKER, 16 REQUIRED, 3 ADVISORY).
- **Nội dung:** chỉ ghi những quyết định mà nhiều đơn vị làm độc lập phải hiểu giống nhau. Thứ tự file và task thuộc về plan.

## Trigger và owner

- Gate: **required**. Signals: `public-api-contract`, `security-trust-boundary`, `conflicting-independent-unit-decisions`.
- Owner: `sdcorejs-angular` (library). Integration owner là chính thư viện.
- Execution host: `portal-onehub`, chỉ điều phối.
- Không có tích hợp cross-repository.

## Invariants

| ID | Điều phải luôn đúng | Cách chứng minh |
|---|---|---|
| INV-001 | Không dùng input/mode opt-in mới thì giao diện và hành vi y như 2.15 | Mọi khai báo của 2.15 còn nguyên giá trị (chỉ thêm, không sửa); computed style mẫu không đổi; suite select/autocomplete/table/tooltip xanh với mặc định |
| INV-002 | Logic dùng chung chỉ viết ở v19, lan ra bằng `npm run sync` | `npm run check:sync` |
| INV-003 | Không thêm dependency npm | Diff các mục dependency, không có dòng thêm |
| INV-004 | Tên và giá trị light của `--sd-*` hiện có không đổi | Test so từng token của 2.15 |
| INV-005 | Chuỗi mới qua `I18nService`, đủ 5 catalog | Catalog có kiểu + `check:i18n-parity` |
| INV-006 | Guard URL/HTML fail closed: scheme, thẻ hay thuộc tính lạ đều bị bỏ hoặc chặn | Bảng cho phép/bị chặn + spec ở nơi gọi |
| INV-007 | Component chỉ tham chiếu màu qua `var(--sd-*)`; hex chỉ có ở theme và danh sách miễn trừ | Rule ESLint hex + `scripts/check-scss-hex.mjs` trong CI |
| INV-008 | Mọi khai báo `theme()` phát cho light, kể cả khai báo dẫn xuất từ `var(--sd-*)`, đều được phát lại với giá trị dark trong mọi scope dark | Test: tập khai báo dark ⊇ tập light |

## Theme và token

**D-020 — Tầng và cách đặt tên**

| Tầng | Tên | Ghi chú |
|---|---|---|
| Primitive | `--sd-{family}`, ramp `--sd-{family}-{50..950}` | 33 token public hiện có giữ nguyên |
| Semantic | `--sd-{role}` | status bg/fg, link, surface-inverse, text-on-solid, border-focus/danger, overlay-backdrop |
| Component | `--sd-{component}-{role}` | `{component}` = selector bỏ `sd-` (vd `preview-pdf`, `file-explorer`, `code-editor`); chỉ khai trong `themes/_component-tokens.scss` |
| Scale | `--sd-space-{n}`, `--sd-radius-{n}` (tên theo px); `--sd-z-{layer}`, `--sd-shadow-{xs..xl}`, `--sd-duration-{fast\|base\|slow}`, `--sd-ease-standard`; `--sd-font-size-{n}`, `--sd-font-weight-{name}`, `--sd-line-height-{n}` | |
| Focus | `--sd-focus-ring-{color\|width\|offset}` | |

**D-021 — Đơn vị phát và ngữ nghĩa `$mode`.** `theme()` phát **toàn bộ** khai báo trên `&`, không tự bọc selector nào:

| `$mode` | Phát ra |
|---|---|
| `light` (mặc định) | Khai báo của 2.15, giữ nguyên, cộng token mới |
| `dark` | Bộ dark đầy đủ + `color-scheme: dark` + token màu Material dark |
| `auto` | Light trên `&`, cộng `@media (prefers-color-scheme: dark) { &:not([data-sd-theme="light"]) { bộ dark } }` |

Các khai báo dẫn xuất từ `var(--sd-*)` được chuyển vào **bên trong** `theme()`, để scope nào cũng phát lại đủ. Ví dụ là `--mat-form-field-error-*-trailing-icon-color`, hiện đang khai trên `:root` ở `default.scss:48-52`.

**D-022 — Palette dark, chỉ cho preset `default`.**
- Chỉ có `$default-dark-theme`. 8 preset có tên sẵn có giữ nguyên dạng light, không có bản dark.
- Gọi `$preset` khác `default` cùng `$mode: dark|auto` thì Sass báo `@error`, hướng dẫn consumer tự truyền map dark qua `$theme`.
- Override `$theme` của consumer áp lên trên palette dark của default.
- Ở dark: `X-light` trộn với `--sd-surface`, `X-dark` trộn về phía trắng. Như vậy vẫn giữ vai trò "nền nhạt / chữ đậm".

**D-023 — Cách giao mode và giới hạn.**
- `sd-core.scss` giữ `html { theme(light) }` như cũ, và thêm:
  - `[data-sd-theme="dark"] { theme($mode: dark) }`
  - `[data-sd-theme="light"] { theme(light); color-scheme: light }`
- Hai block có sẵn này chỉ phủ **preset default, source core**.
- Consumer có màu riêng (`$theme`) hoặc `$source: 'material'` phải include lại `sd.theme(<cùng tham số>, $mode: 'dark')` dưới selector dark của mình. Preset có tên khác `default` không có bản dark (D-022). STYLE-GUIDE sẽ có ví dụ.
- Mode chỉ được bảo đảm khi attribute đặt trên `html`. Vùng lồng bên trong chỉ đổi phần nội dung inline; overlay (panel, dialog, tooltip, toast) đi theo mode của document.
- Thư viện không bao giờ tự ghi `data-sd-theme`.

**D-024 — Material dark.**
- Trong scope dark gọi đúng lệnh: `@include mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette)));`.
- Không truyền typography/density, vì Material 19 chỉ phát typography khi có khai báo.
- Palette giống `material-theme.scss`.
- Không dùng `theme-type: color-scheme` hay `light-dark()`.

**D-029 — Token component và alias trên `:host`.**
- Nếu có token semantic/ramp cùng giá trị thì map vào đó.
- Nếu không, thêm `--sd-{component}-{role}` vào `themes/_component-tokens.scss`: giá trị light = hex cũ, giá trị dark chọn tường minh và kiểm contrast.
- `:host` không được chứa hex nữa, chỉ được alias các tên cục bộ sẵn có (`--sd-pdf-*`, `--sd-fe-*`, `--sd-preview-*`) sang token global. Nhờ vậy hook của consumer vẫn chạy.

**D-031 — Luật áp focus ring.**
- Giá trị mặc định: `--sd-focus-ring-color: var(--sd-primary)`, width `2px`, offset `2px`.
- Chỉ sửa trong khai báo `outline`:
  - Hook component sẵn có vẫn được ưu tiên: `var(--sd-file-explorer-accent, var(--sd-focus-ring-color))`, tương tự với `--sd-tab-label-active-color`, `--sd-stepper-active-color`, `--sd-splitter-handle-active-color`.
  - Bề mặt luôn tối (viền trắng) dùng token component.
  - Width/offset khác 2px thì giữ số cục bộ.
  - `outline: none` kèm focus bằng box-shadow vẫn được phép.
- Không định nghĩa lại token riêng.

**Miễn trừ hex:**
- `assets/scss/themes/**`.
- `*.generated.ts`.
- Giá trị dữ liệu của `forms/input-color`.
- Fallback `var(--x, #hex)`.

**Quyết định đã duyệt ở spec được áp dụng:** D-014 đến D-017 (migrate theo giá trị, ramp bằng color-mix, tooling hex, entry `utilities/theme`).

## Ranh giới bảo mật

**D-025 — Vị trí và tên helper:** đặt ở `utilities/extensions`, gồm `sdIsSafeResourceUrl`, `sdSanitizeEditorHtml`, `sdNormalizeSearchText`, `sdFindHighlightRanges`.

**D-033 — `sdIsSafeResourceUrl` (S-001).**
- Dùng lại `sdParseUrl`/`sdResolveBaseOrigin`, an toàn khi chạy SSR.
- Cho phép:
  - http/https không chứa credential nhúng.
  - URL tương đối, resolve theo base origin.
  - `blob:`, `data:image/*`, `data:application/pdf`.
- Mọi thứ khác bị từ chối cho tải xuống, media và điều hướng, kể cả `mailto:`/`tel:`.

**D-032 — `sdSanitizeEditorHtml` (S-002), tách riêng khỏi chính sách URL.**

| Hạng mục | Chính sách |
|---|---|
| Thẻ | Allowlist theo output CKEditor. Bỏ luôn cả nội dung của `script`, `style`, `iframe`, `frame`, `object`, `embed`, `applet`, `base`, `meta`, `link`, các form control, `template`, và SVG `use`/`animate*`/`set`/`foreignObject` |
| Thuộc tính | Allowlist: class, style, id, title, lang, dir, align, width, height, colspan, rowspan, scope, headers, alt, href, src, srcset, target, rel, start, reversed, type (ol), cite, datetime, `data-*`, `aria-*`. Thuộc tính khác (kể cả `on*`, `srcdoc`, `formaction`, `xlink:href`, `poster`, `background`) bị bỏ |
| `href` | http, https, mailto, tel, tương đối, `#fragment` |
| `img src`, từng ứng viên trong `srcset` | http, https, tương đối, `data:image/*` |
| Không có gì bị bỏ | Trả **nguyên chuỗi đầu vào**, không serialize lại. Hàm idempotent |
| Không có DOMParser | Trả text đã escape HTML (fail closed) |
| Điểm áp dụng | Editor: `#onEditorUserInput`, `#getFromEditor`. Mini-editor: `#convertOutput` (cả luồng throttle lẫn `getContent()`) và `getHtmlContent()`. Chế độ Markdown: lọc HTML **trước** khi chuyển |
| Round-trip | Nội dung vào có phần bị lọc sẽ được ghi ngược một lần và đánh dấu dirty. Ghi rõ trong docs |

**S-003:** `sd-highlight` chỉ render text node và `<mark>`. **S-004:** HTML của toast vẫn opt-in như cũ.

## Tương tác component

**D-026 — Virtual scroll: component sở hữu value.** Khi `virtualScroll` bật:
- Vỏ `mat-select`/`mat-autocomplete` không bind `formControl`.
- Sự kiện chọn của người dùng được áp vào model của component; option đang render đồng bộ theo model.
- Nhãn trigger lấy từ `selectedItems`.
- Item dạng mảng không bị cắt bởi `limit`. Kết quả `SdSearch` render nguyên như server trả.
- Thứ tự ghim item đã chọn và thứ tự value phát ra giống nhánh không virtual.
- Component chặn phím điều hướng, giữ active index trên toàn bộ danh sách đã lọc, gọi `scrollToIndex` rồi mới activate, tự quản `aria-activedescendant` và typeahead.
- API private của Material chỉ được dùng trong một adapter duy nhất mỗi component, có spec phủ.
- Khi tắt: nhánh template cũ giữ nguyên.

**D-030 (hoãn) — Vỏ trình bày.** Có hai phương án:
- V1: giữ vỏ Material với **một** option sentinel ẩn để trigger render.
- V2: listbox do component tự dựng.

Spike chốt phương án trước mọi task rollout: phải qua probe AC-021/AC-022, gồm render có giới hạn sau khi select-all 10.000 item, End/PageDown/typeahead, và multi giữ giá trị. V1 fail thì chuyển V2. Không được hạ tiêu chí.

**D-027 — Toast.**
- Template container giữ 2 region ẩn cố định: `data-autoid="services-notify-live-polite"` và `services-notify-live-assertive`.
- Notify service thông báo qua container. Toast không mang `aria-live`.

**D-034 — Tooltip.**
- Focus hiện tooltip qua singleton `activeTooltip` sẵn có; blur thì ẩn.
- Khi tooltip đang hiện, một listener `keydown` pha capture trên document chỉ xử lý Escape: ẩn tooltip, và chỉ chặn lan sự kiện khi thực sự đã ẩn một tooltip. Listener được gỡ khi tooltip ẩn.
- Bubble có `role="tooltip"` và id riêng. Directive chỉ thêm/bỏ đúng id của mình trong `aria-describedby`.
- Mặc định của `sdTooltipColor` đổi thành `var(--sd-tooltip-bg)`.

## Release tooling

**D-028 — Cơ chế cho suffix x.0.**
- `releaseTargets(suffix, { baselineSuffix })`: patch = 0 bắt buộc baseline tường minh có minor nhỏ hơn; patch > 0 giữ quy tắc `patch - 1`.
- `loadReleaseContract` đọc `baselineSuffix` từ `scripts/release-contracts/<suffix>.json` rồi truyền cho `materializeValidatedBundle`/`validateReleaseBundle`.
- Invariant ở `release-package-contract.mjs:598` đổi sang so với `targets[].baselineVersion`. `deploy.ps1` thêm `-BaselineSuffix`.
- **Trong phạm vi lần này:** code tooling, và test cho case 3.0 ở release-package-contract, collect-release-docs, generate-showcase-changelog, và retention của build-published-page.
- **Thuộc bước cắt release:** pin của `publish-npm.yml` và assert retention trong file đó, cùng snapshot `3.0.json` đã duyệt. Snapshot này phủ exports, files, public surface và sources mới.

## Hợp đồng public

| ID | Hợp đồng | Tương thích |
|---|---|---|
| C-001 | `sd.theme($theme, $source, $preset, $mode)` theo D-021; dark chỉ cho preset `default` theo D-022; block `[data-sd-theme]` theo D-023; tên token theo D-020 | Chỉ thêm |
| C-003 | Entry `@sdcorejs/angular/utilities/theme` (re-export từ `utilities/index.ts`): `readSdTokens`, `SdColorToken`, `SD_COLOR_TOKENS` | Entry mới |
| C-004 | `I18nService.locale: Signal<string>` | Chỉ thêm |
| C-005 | Entry `@sdcorejs/angular/components/highlight`; `sdNormalizeSearchText`, `sdFindHighlightRanges` | Entry mới |
| C-006 | `sd-preview-video` trong `components/preview` | Thêm export |
| C-007 | `virtualScroll`, `itemSize` trên `sd-select`, `sd-autocomplete` | Chỉ thêm, mặc định `false` |
| C-008 | `sdIsSafeResourceUrl`, `sdSanitizeEditorHtml` | Thêm export |
| C-009 | `export.max` giờ chặn export vượt giới hạn | **BREAKING** hành vi |
| C-010 | HTML editor bị lọc theo D-032 (kể cả `getHtmlContent`); link mini-editor chỉ còn https, http, mailto, tel | **BREAKING** hành vi |
| C-011 | Tooltip theo D-034; region và `type` nút của toast; từ chối URL không an toàn theo D-033 | **BREAKING** DOM/luồng |
| C-012 | `releaseTargets(suffix, { baselineSuffix })`, `baselineSuffix` trong snapshot, `--baseline-suffix`/`-BaselineSuffix` bắt buộc cho x.0 | Lệnh 2.x giữ nguyên |

## Ranh giới, phụ thuộc, nơi sở hữu state

**Ranh giới:**
- B-001: chỉ viết code ở v19.
- B-002: entry point không import chéo bằng đường dẫn tương đối; helper dùng chung đặt ở `utilities/extensions`.
- B-003: màu chỉ khai trong `themes/**`; `:host` chỉ được alias.
- B-004: `showcase/` và `scripts/` không thuộc package.

**Hướng phụ thuộc:**
- `components/*`, `forms/*` → `utilities/extensions`.
- `highlight` → `sdFindHighlightRanges`.
- `sd-preview-video` → `sdIsSafeResourceUrl` + i18n.
- `file-explorer` → `components/preview` (import lười).
- `select`/`autocomplete` → `@angular/cdk/scrolling`.
- `utilities/theme` → danh sách token public (đồng bộ bằng test).

**Nơi sở hữu state:**

| State | Chủ sở hữu |
|---|---|
| Region thông báo toast | `ToastContainerComponent` |
| Id tooltip trong `aria-describedby` | `SdTooltipDirective` |
| Ref-count khoá scroll và bản chụp `overflow`/`padding-right` (theo từng Document) | `SdBodyScrollLockService` |
| Map ngôn ngữ → locale | `I18nService` |
| Attribute `data-sd-theme` | App consumer |
| Giá trị chọn khi virtual | Model của component; vỏ không bao giờ sở hữu value |

## Validation obligations

| ID | Bằng chứng mong đợi | Invariant | AC |
|---|---|---|---|
| VAL-001 | Không truyền `$mode`: mọi khai báo của 2.15 (33 `--sd-*`, Material, biến form-field) có mặt với giá trị y hệt; chỉ thêm `--sd-*` mới và block `[data-sd-theme]`; computed style mẫu không đổi | INV-001, INV-004 | AC-027, AC-028 |
| VAL-002 | Tập khai báo trong `[data-sd-theme="dark"]` và scope auto ⊇ tập light, kể cả khai báo dẫn xuất | INV-008 | AC-025, AC-028 |
| VAL-003 | Ma trận contrast (default và preset có sẵn ở light, default ở dark) chạy trong `test:scripts`, báo lỗi khi dưới ngưỡng; preset có tên dùng `$mode: dark` thì báo lỗi Sass như đã mô tả | INV-008 | AC-031 |
| VAL-004 | `check:sync` qua | INV-002 | AC-036 |
| VAL-005 | Không thêm dependency | INV-003 | AC-037 |
| VAL-006 | Catalog compile, `check:i18n-parity` qua | INV-005 | AC-001, AC-005, AC-015 |
| VAL-007 | Bảng cho phép/bị chặn của hai guard (thẻ, thuộc tính, scheme, credential, nhánh không có DOMParser, trả nguyên chuỗi khi sạch) + spec ở nơi gọi | INV-006 | AC-010, AC-011, AC-012, AC-019 |
| VAL-008 | Rule hex và `check-scss-hex` báo lỗi trên fixture, qua trên repo, chạy trong CI | INV-007 | AC-029, AC-030 |
| VAL-009 | Suite cũ xanh với mặc định; spike qua probe AC-021/AC-022 trước khi rollout | INV-001 | AC-020, AC-021, AC-022 |

## Profile frontend, giả định, quyết định hoãn

- `frontend_architecture_ref`: trỏ tới `plan_context.frontend_architecture`, conformance `INV-001`, `INV-003`, `INV-005`, `INV-006`, `INV-007`.
- Giả định được tham chiếu:
  - A-002: hành vi link của CKEditor.
  - A-003: tính khả thi của virtual scroll.
  - A-004: Material dark trên v19–v22. Đã xác nhận với Material 19.2.19; v20–v22 kiểm ở gate cắt release.
  - A-005: migrate theo giá trị không đổi giao diện.
- Quyết định hoãn: D-030, do spike chốt.

## Change control (revision 2)

| Chỗ sửa | r1 | r2 |
|---|---|---|
| Parent | spec r2 | spec r3 (bỏ R-012, AC-023, D-013) |
| D-022 | Mỗi preset phải có map dark | Dark chỉ cho `default`; preset có tên + dark/auto thì báo `@error`; consumer tự thêm qua `$theme` |
| INV-001 | "input/mode/preset opt-in" | "input/mode opt-in" |
| C-002 | Preset riêng | Bỏ |
| VAL-003 | Ma trận có preset riêng | Default + preset có sẵn (light), default (dark) |
| Decision-coverage | revision 3 | revision 6 (tombstone R-012, AC-023, D-013 từ revision 5) |

## Review kiến trúc

Lượt review riêng (chỉ đọc) đã tìm ra 20 điểm, và bản này đã xử lý hết:

| Nhóm phát hiện | Xử lý |
|---|---|
| F-01 | VAL-001/INV-001 hiểu là chỉ thêm, không sửa; AC-028 đã sửa ở spec r2 |
| F-02, F-03, F-04, F-05 | D-021, D-023 |
| F-06 | D-024 |
| F-07 | D-031, cộng R-013/AC-024 ở spec r2 |
| F-08 | D-029 |
| F-09, F-10, F-11 | D-026, D-030 |
| F-12 đến F-16 | D-032, D-033 |
| F-17, F-18, F-19 | D-028 |
| F-20 | C-003 |

Reviewer chưa kịp kiểm toast và tooltip. Hai phần này reviewer chính đã tự kiểm và đưa vào D-027, D-034.

## Appendix — architecture_context (machine-readable)

Đã kiểm bằng `validateArchitectureContext` với decision-coverage revision 6: hợp lệ, không blocker. Path và hash của snapshot đã duyệt sẽ được điền sau khi bạn duyệt.

<details><summary>architecture_context JSON</summary>

```json
{
 "schema_version": 1,
 "source": "sdcorejs-architecture",
 "contract_id": "angular-core-3-0-release-20260925",
 "requirement_id": "R-001",
 "approved_spec_reference": {
  "repository_id": "sdcorejs-angular",
  "artifact_id": "spec-angular-core-3-0-release-20260925-r3",
  "artifact_kind": "spec",
  "revision": "726df9964721a10740cb7bdd6e100a03307ef39a",
  "approval_hash": "sha256:v1:7282d6236f6e5f5c989e12d750120d1ee26604484d10d59873eb582084ef998a"
 },
 "approved_architecture_path": "(filled after approval)",
 "approved_architecture_hash": "(filled after approval)",
 "owner_repository_id": "sdcorejs-angular",
 "owner_module_id": null,
 "execution_host_repository_id": "portal-onehub",
 "integration_owner_repository_id": "sdcorejs-angular",
 "trigger": {
  "required": true,
  "signals": [
   "conflicting-independent-unit-decisions",
   "public-api-contract",
   "security-trust-boundary"
  ],
  "rationale": "New public entry points and inputs (utilities/theme, sd-highlight, sd-preview-video, virtualScroll, sd.theme $mode, I18nService.locale), security guards on editor HTML and download URLs, and token conventions shared by many independently implemented units."
 },
 "invariants": [
  {
   "id": "INV-001",
   "statement": "When no new opt-in input or mode is used, rendering and behaviour match 2.15.",
   "scope": "All changed components and the theme output",
   "owner": "sdcorejs-angular",
   "rationale": "Consumers upgrade to 3.0 without visual or behavioural regressions by default.",
   "verification_method": "Every 2.15 declaration present with identical values (additions only), sampled computed styles unchanged, and existing select/autocomplete/table/tooltip suites green with defaults.",
   "requirement_refs": [
    "R-010",
    "R-011",
    "R-017"
   ],
   "decision_refs": [
    "D-001",
    "D-023",
    "D-024",
    "D-026",
    "D-031"
   ]
  },
  {
   "id": "INV-002",
   "statement": "Shared library changes are authored in versions/v19 and propagated only with npm run sync; check:sync passes.",
   "scope": "Repository workspaces",
   "owner": "sdcorejs-angular",
   "rationale": "v20-v22 are derived artifacts.",
   "verification_method": "npm run check:sync before handoff.",
   "requirement_refs": [
    "R-024"
   ],
   "decision_refs": [
    "D-004"
   ]
  },
  {
   "id": "INV-003",
   "statement": "No new npm dependency is added; virtual scrolling uses the existing @angular/cdk peer.",
   "scope": "Package manifests",
   "owner": "sdcorejs-angular",
   "rationale": "Avoids supply-chain and install-policy changes in a release.",
   "verification_method": "Diff of all package.json dependency sections shows no additions.",
   "requirement_refs": [
    "R-004",
    "R-010",
    "R-018"
   ],
   "decision_refs": [
    "D-016",
    "D-026"
   ]
  },
  {
   "id": "INV-004",
   "statement": "Existing --sd-* token names and light-mode values, including -light/-dark/-contrast, remain available and unchanged.",
   "scope": "Theme token contract",
   "owner": "sdcorejs-angular",
   "rationale": "Consumer overrides and custom themes keep working.",
   "verification_method": "Theme test comparing every 2.15 token value with the baseline.",
   "requirement_refs": [
    "R-014",
    "R-015",
    "R-016",
    "R-019"
   ],
   "decision_refs": [
    "D-014",
    "D-015",
    "D-020"
   ]
  },
  {
   "id": "INV-005",
   "statement": "Every new user-facing string goes through I18nService with keys in all five catalogs.",
   "scope": "i18n catalogs and components",
   "owner": "sdcorejs-angular",
   "rationale": "The library ships five languages.",
   "verification_method": "Typed catalog parity (compile) plus check:i18n-parity.",
   "requirement_refs": [
    "R-001",
    "R-002",
    "R-008"
   ],
   "decision_refs": [
    "D-005",
    "D-006",
    "D-011"
   ]
  },
  {
   "id": "INV-006",
   "statement": "URL and HTML guards fail closed: an unrecognised scheme, tag or attribute is removed or blocked.",
   "scope": "sdIsSafeResourceUrl, sdSanitizeEditorHtml and their call sites",
   "owner": "sdcorejs-angular",
   "rationale": "Security boundary between untrusted content and navigation/rendering.",
   "verification_method": "Allowed/blocked tables for both guards plus call-site specs.",
   "requirement_refs": [
    "R-004",
    "R-005"
   ],
   "decision_refs": [
    "D-003",
    "D-008",
    "D-025",
    "D-032",
    "D-033"
   ]
  },
  {
   "id": "INV-007",
   "statement": "Library components reference colours only through var(--sd-*) tokens; hex literals exist only in themes and documented exemptions.",
   "scope": "Library SCSS and TS",
   "owner": "sdcorejs-angular",
   "rationale": "Theming and dark mode require a single colour source.",
   "verification_method": "ESLint hex rule and scripts/check-scss-hex.mjs in CI.",
   "requirement_refs": [
    "R-018",
    "R-019"
   ],
   "decision_refs": [
    "D-014",
    "D-016",
    "D-029"
   ]
  },
  {
   "id": "INV-008",
   "statement": "Every declaration emitted by theme() for light, including declarations derived from var(--sd-*), is emitted again with a dark value in every dark scope.",
   "scope": "Theme emission",
   "owner": "sdcorejs-angular",
   "rationale": "Prevents stale light values inside dark scopes.",
   "verification_method": "Theme test asserting the dark declaration set is a superset of the light set.",
   "requirement_refs": [
    "R-017"
   ],
   "decision_refs": [
    "D-021",
    "D-022"
   ]
  }
 ],
 "boundaries": [
  {
   "id": "B-001",
   "statement": "versions/v19/projects/sdcorejs-angular is the only authored library source; v20-v22 are generated by npm run sync.",
   "invariant_refs": [
    "INV-002"
   ]
  },
  {
   "id": "B-002",
   "statement": "Secondary entry points never import each other through relative paths; shared helpers go to utilities/extensions.",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ]
  },
  {
   "id": "B-003",
   "statement": "Colour and token values are declared only in assets/scss/themes/**; components consume var(--sd-*) and :host may only alias.",
   "invariant_refs": [
    "INV-004",
    "INV-007"
   ]
  },
  {
   "id": "B-004",
   "statement": "showcase/ and scripts/ are not part of the package and may not be imported by library code.",
   "invariant_refs": [
    "INV-002"
   ]
  }
 ],
 "dependency_directions": [
  {
   "from": "components/*, forms/*",
   "to": "utilities/extensions",
   "rationale": "Shared guards and text helpers; never the reverse.",
   "invariant_refs": [
    "INV-006"
   ]
  },
  {
   "from": "components/highlight",
   "to": "utilities/extensions (sdFindHighlightRanges)",
   "rationale": "Rendering component depends on pure utilities.",
   "invariant_refs": [
    "INV-006"
   ]
  },
  {
   "from": "components/preview (sd-preview-video)",
   "to": "utilities/extensions (sdIsSafeResourceUrl), i18n",
   "rationale": "Media source and download are guarded.",
   "invariant_refs": [
    "INV-005",
    "INV-006"
   ]
  },
  {
   "from": "components/file-explorer",
   "to": "components/preview (lazy import)",
   "rationale": "Follows the existing lazy pdf preview pattern.",
   "invariant_refs": [
    "INV-001"
   ]
  },
  {
   "from": "forms/select, forms/autocomplete",
   "to": "@angular/cdk/scrolling",
   "rationale": "Existing peer dependency only.",
   "invariant_refs": [
    "INV-003"
   ]
  },
  {
   "from": "utilities/theme",
   "to": "assets/scss/core/color.scss token list (constant kept in sync by test)",
   "rationale": "SdColorToken mirrors the public SCSS list.",
   "invariant_refs": [
    "INV-004"
   ]
  }
 ],
 "data_state_owners": [
  {
   "subject": "Toast announcements (live regions)",
   "owner_repository_id": "sdcorejs-angular",
   "owner_component": "ToastContainerComponent",
   "invariant_refs": [
    "INV-005"
   ]
  },
  {
   "subject": "Tooltip id inside the host aria-describedby",
   "owner_repository_id": "sdcorejs-angular",
   "owner_component": "SdTooltipDirective",
   "invariant_refs": [
    "INV-001"
   ]
  },
  {
   "subject": "Body scroll lock ref-count and overflow/padding-right snapshot per Document",
   "owner_repository_id": "sdcorejs-angular",
   "owner_component": "SdBodyScrollLockService",
   "invariant_refs": [
    "INV-001"
   ]
  },
  {
   "subject": "Language to BCP-47 locale mapping",
   "owner_repository_id": "sdcorejs-angular",
   "owner_component": "I18nService",
   "invariant_refs": [
    "INV-005"
   ]
  },
  {
   "subject": "Theme mode attribute data-sd-theme",
   "owner_repository_id": "sdcorejs-angular",
   "owner_component": "Consuming application (library never writes it)",
   "invariant_refs": [
    "INV-001",
    "INV-008"
   ]
  },
  {
   "subject": "Selected values under virtual scrolling",
   "owner_repository_id": "sdcorejs-angular",
   "owner_component": "Component value model (shell never owns the value)",
   "invariant_refs": [
    "INV-001"
   ]
  }
 ],
 "public_contracts": [
  {
   "id": "C-001",
   "kind": "api",
   "statement": "SCSS theme API: sd.theme($theme, $source, $preset, $mode) with $mode light|dark|auto per D-021; dark only for the default preset per D-022 (named presets are light-only and raise a Sass error with dark/auto); [data-sd-theme] blocks per D-023; token names per D-020.",
   "owner": "sdcorejs-angular",
   "compatibility": "Additive; omitted $mode keeps every 2.15 declaration unchanged.",
   "migration": "None required. Opt in with data-sd-theme=dark on html; custom colours re-include sd.theme($theme: (...), $mode: dark) under the dark selector; sd.theme($mode: auto) follows the OS; other presets are added by consumers through $theme.",
   "invariant_refs": [
    "INV-001",
    "INV-004",
    "INV-008"
   ]
  },
  {
   "id": "C-003",
   "kind": "api",
   "statement": "Entry @sdcorejs/angular/utilities/theme (re-exported by utilities/index.ts): readSdTokens(element?), SdColorToken, SD_COLOR_TOKENS.",
   "owner": "sdcorejs-angular",
   "compatibility": "New entry point; export map grows.",
   "migration": "None.",
   "invariant_refs": [
    "INV-004"
   ]
  },
  {
   "id": "C-004",
   "kind": "api",
   "statement": "I18nService.locale: Signal<string> (vi-VN, en-US, ja-JP, ko-KR, zh-CN).",
   "owner": "sdcorejs-angular",
   "compatibility": "Additive.",
   "migration": "None.",
   "invariant_refs": [
    "INV-005"
   ]
  },
  {
   "id": "C-005",
   "kind": "api",
   "statement": "Entry @sdcorejs/angular/components/highlight: sd-highlight [text] [term]; utilities sdNormalizeSearchText, sdFindHighlightRanges.",
   "owner": "sdcorejs-angular",
   "compatibility": "New entry point.",
   "migration": "None.",
   "invariant_refs": [
    "INV-006"
   ]
  },
  {
   "id": "C-006",
   "kind": "api",
   "statement": "sd-preview-video in @sdcorejs/angular/components/preview.",
   "owner": "sdcorejs-angular",
   "compatibility": "Additive export.",
   "migration": "None.",
   "invariant_refs": [
    "INV-005",
    "INV-006"
   ]
  },
  {
   "id": "C-007",
   "kind": "api",
   "statement": "virtualScroll and itemSize inputs on sd-select and sd-autocomplete.",
   "owner": "sdcorejs-angular",
   "compatibility": "Additive; default false keeps 2.15 behaviour.",
   "migration": "None.",
   "invariant_refs": [
    "INV-001"
   ]
  },
  {
   "id": "C-008",
   "kind": "api",
   "statement": "sdIsSafeResourceUrl and sdSanitizeEditorHtml in utilities/extensions.",
   "owner": "sdcorejs-angular",
   "compatibility": "Additive exports.",
   "migration": "None.",
   "invariant_refs": [
    "INV-006"
   ]
  },
  {
   "id": "C-009",
   "kind": "api",
   "statement": "Behaviour: export.max now blocks exports above the limit.",
   "owner": "sdcorejs-angular",
   "compatibility": "BREAKING behaviour for consumers that set max.",
   "migration": "Raise or remove max; changelog diff provided.",
   "invariant_refs": [
    "INV-005"
   ]
  },
  {
   "id": "C-010",
   "kind": "api",
   "statement": "Behaviour: editor and mini-editor emitted HTML (including getHtmlContent) is sanitized per D-032; mini-editor links limited to https, http, mailto, tel.",
   "owner": "sdcorejs-angular",
   "compatibility": "BREAKING behaviour for content relying on removed tags, attributes or URLs.",
   "migration": "Changelog lists removed constructs and the one-time write-back; sanitizing at render stays recommended.",
   "invariant_refs": [
    "INV-006"
   ]
  },
  {
   "id": "C-011",
   "kind": "api",
   "statement": "Behaviour and DOM: sd-tooltip focus/Escape/role/aria-describedby per D-034 with sdTooltipColor default var(--sd-tooltip-bg); toast container live regions and button types; unsafe download/media URLs refused per D-033.",
   "owner": "sdcorejs-angular",
   "compatibility": "BREAKING for e2e selectors or flows relying on previous DOM or unsafe URLs.",
   "migration": "Changelog lists DOM additions, new data-autoid values and blocked schemes.",
   "invariant_refs": [
    "INV-001",
    "INV-006"
   ]
  },
  {
   "id": "C-012",
   "kind": "api",
   "statement": "Release tooling: releaseTargets(suffix, { baselineSuffix }), baselineSuffix in release-contract snapshots, --baseline-suffix and -BaselineSuffix mandatory for x.0.",
   "owner": "sdcorejs-angular",
   "compatibility": "Existing 2.x calls unchanged.",
   "migration": "Pass --baseline-suffix 2.15 and add an approved 3.0.json when cutting 3.0.",
   "invariant_refs": [
    "INV-002"
   ]
  }
 ],
 "security_trust_boundaries": [
  {
   "id": "S-001",
   "statement": "Untrusted URLs reach anchors, media src or window navigation only after sdIsSafeResourceUrl (D-033).",
   "invariant_refs": [
    "INV-006"
   ]
  },
  {
   "id": "S-002",
   "statement": "Editor HTML leaves the editor (value, events, getContent, getHtmlContent, Markdown conversion) only through sdSanitizeEditorHtml with the allowlist policy of D-032.",
   "invariant_refs": [
    "INV-006"
   ]
  },
  {
   "id": "S-003",
   "statement": "sd-highlight renders text nodes and mark elements only; no innerHTML and no RegExp built from input.",
   "invariant_refs": [
    "INV-006"
   ]
  },
  {
   "id": "S-004",
   "statement": "Toast HTML stays opt-in through the existing html flag with explicit DomSanitizer sanitization.",
   "invariant_refs": [
    "INV-006"
   ]
  }
 ],
 "cross_repository_integration": [],
 "adopted_decision_refs": [
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "D-020",
  "D-021",
  "D-022",
  "D-023",
  "D-024",
  "D-025",
  "D-026",
  "D-027",
  "D-028",
  "D-029",
  "D-031",
  "D-032",
  "D-033",
  "D-034"
 ],
 "deferred_decision_refs": [
  "D-030"
 ],
 "assumption_refs": [
  "A-002",
  "A-003",
  "A-004",
  "A-005"
 ],
 "validation_obligations": [
  {
   "id": "VAL-001",
   "expected_proof": "Every 2.15 declaration (33 --sd-* tokens, Material, form-field variables) is present with identical values when $mode is omitted; only new --sd-* properties and [data-sd-theme] blocks are added; sampled computed styles are unchanged.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-001",
    "INV-004"
   ],
   "acceptance_criterion_refs": [
    "AC-027",
    "AC-028"
   ]
  },
  {
   "id": "VAL-002",
   "expected_proof": "Declaration set in [data-sd-theme=dark] and in the auto media scope is a superset of the light set, including derived declarations.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-008"
   ],
   "acceptance_criterion_refs": [
    "AC-025",
    "AC-028"
   ]
  },
  {
   "id": "VAL-003",
   "expected_proof": "Contrast matrix (default, existing presets in light, default in dark) runs in test:scripts and fails below threshold; a named preset with $mode dark raises the documented Sass error.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-008"
   ],
   "acceptance_criterion_refs": [
    "AC-031"
   ]
  },
  {
   "id": "VAL-004",
   "expected_proof": "npm run check:sync passes after npm run sync.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-002"
   ],
   "acceptance_criterion_refs": [
    "AC-036"
   ]
  },
  {
   "id": "VAL-005",
   "expected_proof": "package.json dependency sections show no additions across root, v19 and the library.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-003"
   ],
   "acceptance_criterion_refs": [
    "AC-037"
   ]
  },
  {
   "id": "VAL-006",
   "expected_proof": "Typed catalogs compile and check:i18n-parity passes with the new keys.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-005"
   ],
   "acceptance_criterion_refs": [
    "AC-001",
    "AC-005",
    "AC-015"
   ]
  },
  {
   "id": "VAL-007",
   "expected_proof": "Allowed/blocked tables for both guards (tags, attributes, schemes, credentials, no-DOMParser path, unchanged-input identity) plus call-site specs prove fail-closed behaviour.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-006"
   ],
   "acceptance_criterion_refs": [
    "AC-010",
    "AC-011",
    "AC-012",
    "AC-019"
   ]
  },
  {
   "id": "VAL-008",
   "expected_proof": "ESLint hex rule and check-scss-hex fail on fixtures and pass on the repository in CI.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-007"
   ],
   "acceptance_criterion_refs": [
    "AC-029",
    "AC-030"
   ]
  },
  {
   "id": "VAL-009",
   "expected_proof": "Existing select, autocomplete, tooltip and table suites stay green with defaults; the spike passes AC-021/AC-022 probes (bounded rendering after select-all of 10000, End/PageDown/typeahead, multi values kept) before rollout.",
   "owner": "sdcorejs-angular",
   "invariant_refs": [
    "INV-001"
   ],
   "acceptance_criterion_refs": [
    "AC-020",
    "AC-021",
    "AC-022"
   ]
  }
 ],
 "profile_sections": {
  "frontend_architecture_ref": {
   "reference": "plan_context.frontend_architecture",
   "conformance_invariant_refs": [
    "INV-001",
    "INV-003",
    "INV-005",
    "INV-006",
    "INV-007"
   ]
  },
  "agent_architecture_ref": null
 },
 "change_control": {
  "revision": 2,
  "supersedes": "architecture-angular-core-3-0-release-20260925-r1"
 }
}
```

</details>

<details><summary>decision_coverage revision 6 — records changed by this revision</summary>

```json
[
 {
  "id": "D-022",
  "type": "decision",
  "statement": "Dark palette source: Dark palette only for the default preset: $default-dark-theme; built-in named presets stay light-only; $preset other than default combined with $mode dark or auto raises a Sass @error that tells consumers to provide their own dark map through $theme; consumer $theme overrides apply on top of the default dark palette; in dark, X-light mixes with --sd-surface and X-dark mixes toward white",
  "question": "Dark palette source",
  "selected_value": "Dark palette only for the default preset: $default-dark-theme; built-in named presets stay light-only; $preset other than default combined with $mode dark or auto raises a Sass @error that tells consumers to provide their own dark map through $theme; consumer $theme overrides apply on top of the default dark palette; in dark, X-light mixes with --sd-surface and X-dark mixes toward white",
  "source": "approved-architecture",
  "status": "approved",
  "blocking": true,
  "scope": "public-contract",
  "owner_repository_id": "sdcorejs-angular",
  "rationale": "User instruction: keep the generic default preset only and let other presets be added separately; an explicit error prevents silently wrong dark colours.",
  "supersedes": null,
  "revisit_condition": null,
  "convention_impact": {
   "candidate": false,
   "category": null
  },
  "downstream_refs": [
   "R-017",
   "AC-028",
   "AC-031"
  ],
  "task_refs": [
   "TASK-013",
   "TASK-014"
  ]
 },
 {
  "id": "INV-001",
  "type": "invariant",
  "statement": "When no new opt-in input or mode is used, rendering and behaviour match 2.15.",
  "protected_refs": [
   "R-010",
   "R-011",
   "R-017",
   "AC-020",
   "AC-022",
   "AC-028"
  ],
  "task_refs": [
   "TASK-013",
   "TASK-017",
   "TASK-018",
   "TASK-019",
   "TASK-020",
   "TASK-021",
   "TASK-024",
   "TASK-025"
  ],
  "evidence_refs": [
   "EVIDENCE-013",
   "EVIDENCE-017",
   "EVIDENCE-018",
   "EVIDENCE-019",
   "EVIDENCE-020",
   "EVIDENCE-021",
   "EVIDENCE-024",
   "EVIDENCE-025"
  ]
 }
]
```

</details>
