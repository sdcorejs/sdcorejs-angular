---
artifact_id: spec-angular-core-3-0-release-20260925-r2-draft
artifact_kind: spec
contract_id: angular-core-3-0-release-20260925
change_ref: angular-core-3-0-release-20260925
owner: sdcorejs-spec
owner_repository_id: sdcorejs-angular
owner_repository_role: library
owner_module_id: null
execution_host_repository_id: portal-onehub
track: angular
stack_profile: core-ui-angular
target_root_kind: target-project
source_spec: none
source_plan: none
commit_policy: with-change
status: draft
approved: false
revision: 2
supersedes: .sdcorejs/specs/angular/2026-09-25-15-54-core-3-0-release.md
change_reason: "Architecture review: additive theme output cannot be byte-identical (AC-028); focus colours keep documented component hooks and always-dark surfaces (R-013, AC-024); helper names follow the repository sd prefix (R-009)."
---

# Spec — Core UI release 3.0: a11y, bảo mật, P2 và hệ token/theme

Nguồn yêu cầu: backlog cải tiến Core UI (review ngày 2026-09-25) và các quyết định người dùng chốt trong brainstorming cùng ngày. Đây là bản dự thảo revision 2, supersede r1 (`.sdcorejs/specs/angular/2026-09-25-15-54-core-3-0-release.md`). Lý do: review kiến trúc phát hiện 4 chỗ câu chữ không thể thực hiện đúng nghĩa đen (xem mục Change control ở cuối).

```yaml
spec_context:
  source: sdcorejs-spec
  contract_id: angular-core-3-0-release-20260925
  requirement_id: R-001
  approved_spec_path: ""
  approved_spec_hash: ""
  supersedes: .sdcorejs/specs/angular/2026-09-25-15-54-core-3-0-release.md
  target_root: C:/wt/core-3.0
  target_root_kind: target-project
  owner_repository_id: sdcorejs-angular
  owner_repository_role: library
  owner_module_id: null
  execution_host_repository_id: portal-onehub
  track: angular
  stack_profile: core-ui-angular
  profile_confidence: high
  source_requirement_context: brainstorming 2026-09-25 (P1, P2 chọn lọc, T1-T11, release 3.0)
  acceptance_criteria_count: 38
  manual_criteria_count: 2
  deferred_criteria_count: 1
  architecture_gate:
    valid: true
    required: true
    status: required
    signals: [conflicting-independent-unit-decisions, public-api-contract, security-trust-boundary]
    bypass: null
    rationale: New public entry points and inputs (utilities/theme, sd-highlight, sd-preview-video, virtualScroll, sd.theme $mode, I18nService.locale), security guards on editor HTML and download URLs, and token conventions shared by many independently implemented units.
  decision_coverage: "see appendix (schema_version 1, revision 1, 94 records, validated at stage spec: 0 errors, 0 blockers, 74 future planning gaps)"
  goal_backward_review:
    schema_version: 1
    mode: "sdcorejs-plan:goal-backward"
    stage: spec
    future_gaps: "task_refs/evidence_refs for every R, AC and INV (owned by sdcorejs-plan)"
  redaction_applied: false
  approval:
    approved: false
    approved_at: null
    approval_source: explicit-user-choice
  change_control:
    revision: 2
    supersedes: .sdcorejs/specs/angular/2026-09-25-15-54-core-3-0-release.md
    change_reason: "Architecture review: additive theme output cannot be byte-identical (AC-028); focus colours keep documented component hooks and always-dark surfaces (R-013, AC-024); helper names follow the repository sd prefix (R-009)."
```

## Problem & Goals

Portal OneHub sẽ chuyển sang `@sdcorejs/angular`, nhưng review so sánh ngày 2026-09-25 cho thấy Core UI mới còn thiếu ở ba mảng:

1. **A11y và bảo mật (P1).** `export.max` đã khai báo nhưng không được áp dụng. Toast không có live region. `sd-tooltip` chỉ hoạt động bằng chuột. Editor không giới hạn protocol của link và phát HTML chưa lọc. Một số chỗ tải xuống click URL chưa kiểm tra scheme.
2. **Một số P2 được chọn:** khoá scroll không bù độ rộng scrollbar, `'vi-VN'` bị hardcode, chưa có preview video, chưa có highlight bỏ dấu tiếng Việt, chưa có virtual scroll.
3. **Hệ token/theme (T1–T11):**
   - Chưa có thang màu, và lớp semantic còn thiếu.
   - Spacing, radius, shadow, z-index, motion chưa có CSS variable.
   - Chưa có dark mode.
   - Còn khoảng 349 dòng hex thô trong SCSS và 46 khai báo focus outline tự viết.
   - Chưa có lint chặn hex, và test contrast chưa chạy trong CI.

Mục tiêu là ra release suffix `3.0` (`19.3.0` / `20.3.0` / `21.3.0` / `22.3.0`) với ba đảm bảo:
- Các lỗ a11y và bảo mật trên được đóng.
- Hệ token đủ để theme hoá, gồm preset OneHub và dark mode.
- Mọi tính năng mới ở trạng thái mặc định không làm thay đổi giao diện hay hành vi hiện có.

Chỉ tham khảo DS của portal cho phần token/theme (giá trị màu, ý tưởng ramp, trang contrast), không chép UI.

Người dùng: đội phát triển portal dùng Core UI; người dùng cuối dùng bàn phím hoặc screen reader; maintainer Core UI.

## Requirements

| ID | Yêu cầu | Nguồn / chủ sở hữu |
|---|---|---|
| R-001 | Khi số dòng cần xuất vượt `export.max`, `sd-table` không xuất và hiện cảnh báo i18n nêu giới hạn. | explicit-user; sdcorejs-angular (table) |
| R-002 | Toast được đọc qua 2 live region cố định trong container: polite cho info/success, assertive cho warning/error. Tự đóng tạm dừng khi hover và khi focus bàn phím nằm trong toast. Nút đóng và nút action có `type="button"`, nút đóng có `aria-label` i18n. | explicit-user; services/notify |
| R-003 | `sd-tooltip` đạt WCAG 1.4.13: hiện khi focus, ẩn khi blur, Escape đóng (chỉ chặn sự kiện khi tooltip đang mở), bubble hover được, `role="tooltip"`, `aria-describedby` giữ nguyên id sẵn có, màu lấy từ token. | explicit-user; directives |
| R-004 | Mini-editor thêm `link.allowedProtocols` = https, http, mailto, tel. Editor và mini-editor lọc HTML đầu ra: bỏ URL `javascript:`/`vbscript:`, bỏ `data:` trừ `data:image/*` trong `img`, bỏ thuộc tính `on*`. Giữ nguyên style, bảng, định dạng. | explicit-user; components/editor, mini-editor |
| R-005 | Có hàm kiểm scheme dùng chung trong `utilities/extensions`. Các chỗ phải dùng: `SdUtilities.download`, preview-image, preview-pdf (component và browser helper), upload-file (bỏ `href="javascript:;"`), preview-video. URL không an toàn thì không điều hướng. | explicit-user; utilities, preview, upload-file |
| R-006 | Service khoá scroll của side-drawer cộng `padding-right` bằng độ rộng scrollbar khi khoá, trả lại khi lần khoá cuối được giải phóng. Giữ nguyên ref-count. Chế độ `container` không đổi. Có spec riêng. | explicit-user; side-drawer |
| R-007 | `I18nService` có signal `locale()` trả thẻ BCP-47. 11 chỗ hardcode `'vi-VN'` trong code thư viện và 2 bảng locale trùng được thay bằng signal này. | explicit-user; i18n, forms, layout, file-explorer, query-bar |
| R-008 | Thêm component `sd-preview-video` trong entry `components/preview`: `<video>` native có controls, poster, trạng thái lỗi kèm retry (i18n), tải xuống qua R-005, autoId, không autoplay. File-explorer detail dùng component này cho file video. Kèm md và showcase demo. | explicit-user; components/preview, file-explorer |
| R-009 | Thêm `sdNormalizeSearchText` và `sdFindHighlightRanges` trong `utilities/extensions`: bỏ dấu, xử lý đ/Đ, không dựng RegExp từ input, map đúng index gốc. Thêm component `sd-highlight` render text và `<mark>`, không dùng innerHTML. Chưa gắn vào component khác. | explicit-user; utilities, components/highlight |
| R-010 | `sd-select` có virtual scroll bật qua input, mặc định tắt. Phải giữ được: điều hướng bàn phím, hiển thị giá trị đã chọn, giá trị multi nằm ngoài viewport, select-all. | explicit-user; forms/select |
| R-011 | `sd-autocomplete` có virtual scroll bật qua input, mặc định tắt. Phải giữ được điều hướng bàn phím và giá trị chọn. | explicit-user; forms/autocomplete |
| R-012 | Có preset `omeu` với giá trị brand đạt contrast, lấy từ palette OneHub. | explicit-user; assets/scss/themes |
| R-013 | Có token focus ring (`--sd-focus-ring-color` mặc định `var(--sd-primary)`, `-width`, `-offset`). Màu của mọi focus outline lấy từ token: token chung; hoặc hook component đã có (vd `--sd-file-explorer-accent`), hook này rơi về token chung; hoặc token component cho bề mặt luôn tối. Không còn hex hay fallback hex trong focus rule. | explicit-user; toàn thư viện |
| R-014 | Lớp semantic bổ sung: `--sd-status-{info,success,warning,error}-{bg,fg}`, `--sd-link`, `--sd-surface-inverse`, `--sd-text-on-solid`, `--sd-border-focus`, `--sd-border-danger`, `--sd-overlay-backdrop`. | explicit-user; themes |
| R-015 | Có CSS variable cho space, radius, shadow, z-index, motion, typography. Literal trong SCSS chỉ được thay khi giá trị khớp tuyệt đối. | explicit-user; themes + toàn thư viện |
| R-016 | Có thang màu 50–950 cho primary, secondary, info, success, warning, error, neutral, sinh bằng `color-mix` lúc runtime. `-light`/`-dark`/`-contrast` giữ nguyên giá trị. | explicit-user; themes |
| R-017 | Dark theme opt-in cho token Core và Material, bật bằng scope `[data-sd-theme="dark"]`. `$mode: 'auto'` áp dark theo `prefers-color-scheme` trừ khi có `[data-sd-theme="light"]`. | explicit-user; themes |
| R-018 | Hex bị chặn bởi rule ESLint cho TS/template và một script SCSS không cần dependency, mức error, chạy trong CI. | explicit-user; tooling |
| R-019 | Mọi hex thô trong SCSS/TS thư viện, ngoài danh sách miễn trừ, được thay bằng token có giá trị y hệt. | explicit-user; toàn thư viện |
| R-020 | Test contrast chạy trong CI, phủ default, mọi preset (kể cả omeu) và dark. | explicit-user; scripts, CI |
| R-021 | Entry mới `@sdcorejs/angular/utilities/theme` cung cấp `readSdTokens()` và type `SdColorToken`. | explicit-user; utilities |
| R-022 | Thêm trang showcase "Theme & tokens" và file `assets/THEME.md` được publish. Cập nhật STYLE-GUIDE. | explicit-user; showcase, assets |
| R-023 | Tooling release chấp nhận suffix `x.0` kèm baseline tường minh, để `3.0` ra 19/20/21/22.3.0 so với `*.2.15`. | explicit-user; scripts |
| R-024 | Bàn giao kèm docs, CHANGELOG (có mục BREAKING và migration), README npm đồng nhất, và bản rollout v20–v22. | explicit-user; repo |

## Decisions

| ID | Câu hỏi | Giá trị chọn | Nguồn / phạm vi | Lý do |
|---|---|---|---|---|
| D-001 | Virtual scroll làm tới đâu | `sd-select` + `sd-autocomplete`, input opt-in, mặc định tắt; table không đổi | explicit-user; public-contract | Giới hạn phạm vi ảnh hưởng |
| D-002 | Bật dark theme thế nào | Scope `[data-sd-theme="dark"]` cho Core và Material, cộng `$mode: 'auto'` | explicit-user; public-contract | Người dùng chọn |
| D-003 | Chính sách HTML của editor | `allowedProtocols` + lọc nhẹ, giữ định dạng | explicit-user; public-contract | Sanitizer đầy đủ sẽ xoá style |
| D-004 | Nhánh và điểm dừng release | Worktree `release/3.0` từ `origin/main`; dừng trước cắt release/tag/publish | explicit-user; repository | Người dùng chọn |
| D-005 | Ngữ nghĩa `export.max` | Chặn và cảnh báo khi vượt giới hạn | explicit-user; public-contract | An toàn hơn cắt bớt âm thầm |
| D-006 | Cách đọc toast | 2 live region cố định; tạm dừng khi hover và focus | explicit-user; public-contract | Screen reader hay bỏ qua live region tạo động |
| D-007 | Phạm vi tooltip | Chỉ sửa `sd-tooltip`; không đổi các chỗ dùng MatTooltip | explicit-user; public-contract | MatTooltip đã đạt 1.4.13 |
| D-008 | Danh sách URL cho phép | https, http, tương đối, blob, `data:image/*`, `data:application/pdf`; còn lại chặn | explicit-user; public-contract | Mặc định an toàn |
| D-009 | Bù scrollbar | `padding-right` bằng độ rộng scrollbar; bỏ qua chế độ container | explicit-user; public-contract | Người dùng chấp nhận mặc định |
| D-010 | Nguồn locale | `I18nService.locale()` với một bảng map duy nhất | explicit-user; public-contract | Xoá 2 bảng trùng |
| D-011 | Vị trí preview video | `sd-preview-video` trong entry `components/preview`, gắn vào file-explorer detail | explicit-user; public-contract | Không tạo entry mới |
| D-012 | Cách giao highlight | Util trong `utilities/extensions` + component `sd-highlight`; chưa gắn vào component khác | explicit-user; public-contract | Giữ phạm vi nhỏ |
| D-013 | Giá trị preset omeu | primary `#8C5926` (5,88:1), primary-dark `#70451C`, primary-light `#FAF5ED`, primary-contrast `#FFFFFF`, text `#171717`, text-secondary `#525252`, border `#E5E5E5`, border-strong `#737373`, surface `#FFFFFF`, surface-muted `#F5F5F5`; màu status giữ như default | explicit-user; public-contract | Chỉ lấy giá trị màu, đã kiểm contrast |
| D-014 | Quy tắc migrate literal | Chỉ thay bằng token có giá trị y hệt; chưa có thì thêm token | explicit-user; public-contract | Không đổi giao diện |
| D-015 | Cách sinh ramp | `color-mix` lúc runtime; `-light/-dark/-contrast` giữ giá trị cũ | explicit-user; public-contract | Override của app vẫn lan theo |
| D-016 | Tooling chặn hex | Rule ESLint + script SCSS không dependency, mức error; cho phép fallback `var(--x, #hex)` | explicit-user; repository | Không thêm dependency |
| D-017 | Entry xuất token | `@sdcorejs/angular/utilities/theme` | explicit-user; public-contract | Người dùng chấp nhận mặc định |
| D-018 | Cách phủ test | TDD cho component, service và script | explicit-user; repository | Luật repo |
| D-019 | Đánh số release | Suffix `3.0` → 19/20/21/22.3.0, baseline `*.2.15` | explicit-user; repository | Major khoá theo Angular line |

Mọi quyết định đều có trạng thái `approved`, mức `blocking`, và không supersede quyết định nào khác.

## Assumptions

| ID | Giả định | Nguồn / độ tin / trạng thái | Nếu sai | Cách kiểm | Người kiểm |
|---|---|---|---|---|---|
| A-001 | Không consumer nào phụ thuộc việc `export.max` bị bỏ qua, vì cả Legacy lẫn 2.15 đều chưa từng đọc giá trị này. | inferred / medium / confirmed | Consumer có đặt `max` sẽ không xuất được khi vượt giới hạn | Ghi BREAKING trong changelog, tìm các chỗ dùng `max` | release owner |
| A-002 | CKEditor 5 giữ `javascript:` href trong `getData()`, và plugin Link chấp nhận mọi protocol khi chưa khai `allowedProtocols`. | inferred / medium / proposed | Bộ lọc vẫn cần làm lớp phòng thủ, chỉ phải sửa fixture | Viết test RED trên editor thật trước khi làm | implementer |
| A-003 | Ghép được CDK virtual scroll với `mat-select`/`mat-autocomplete` mà vẫn giữ điều hướng bàn phím và giá trị multi. | inferred / medium / proposed | Phải sửa spec qua change control để dùng listbox tự viết | Task spike làm trước tiên, phải qua probe AC-021/AC-022 | implementer |
| A-004 | `mat.theme` của Material 19–22 hỗ trợ `theme-type: dark` trong selector có scope. | inferred / high / proposed | Cần shim theo từng line, hoặc ghi rõ consumer tự cấu hình | Test compile theme trên v19; build các line khi cắt release | implementer |
| A-005 | Thay literal/hex bằng token cùng giá trị thì giao diện không đổi. | defaulted / high / confirmed | Component đã migrate bị lỗi hiển thị | Snapshot theme, kiểm computed style mẫu, xem showcase | implementer |
| A-006 | Môi trường không có browser automation, nên kiểm giao diện showcase phải làm tay. | explicit / high / confirmed | Có thể tự động hoá phần kiểm này | Người dùng xem showcase | user |
| A-007 | Node 22.22.3 (qua fnm) và `npm ci --legacy-peer-deps` chạy được cho v19 và showcase trong worktree. | explicit / high / confirmed | Không chạy được verify | Task đầu tiên của plan chạy install | implementer |

Không có giả định nào ở mức blocking.

## Architecture gate classification

- Status: **required**.
- Signals: `public-api-contract`, `security-trust-boundary`, `conflicting-independent-unit-decisions`.
- Rationale:
  - Có entry point và input public mới: `utilities/theme`, `sd-highlight`, `sd-preview-video`, `virtualScroll`, `$mode` của `sd.theme`, `I18nService.locale`.
  - Có guard bảo mật cho HTML của editor và URL tải xuống.
  - Có quy ước token (tên, tầng, quy tắc migrate) mà nhiều đơn vị làm độc lập phải tuân theo giống nhau.
- Artifact kiến trúc sẽ do `sdcorejs-architecture` viết sau khi spec được duyệt.

## Non-goals

- Cursor pagination cho `sd-table`.
- Đổi `confirm()` sang resolve thay cho reject.
- Sticky cột phải, media (avatar/description/dot) cho option của select, filter ngày cho datepicker, dock/pill tác vụ, scanner mức áp dụng.
- Tách Material thành peer tuỳ chọn.
- Chép bất kỳ UI nào của DS portal. Chỉ tham khảo token/theme.
- Chuyển các chỗ dùng MatTooltip sang `sd-tooltip`.
- Gắn highlight vào select, autocomplete hoặc pipe `high-light-search` của layout.
- Hợp nhất scroll lock của sidebar-mobile v2/v3 và MatDialog.
- Cắt release: đưa CHANGELOG về `[3.0]`, pin workflow `v3.0`, snapshot `scripts/release-contracts/3.0.json`, tag, publish.

## Architecture

- **Nơi sửa:** mọi thay đổi logic dùng chung làm trong `versions/v19/projects/sdcorejs-angular` (gọi tắt `LIB`). Rollout sang v20/v21/v22 chỉ bằng `npm run sync`. Showcase nằm ở `showcase/`. Tooling nằm ở `scripts/`.
- **Tầng token:**
  - `default.scss` và `_presets.scss` định nghĩa màu gốc.
  - Mixin `theme()` phát ra các lớp: màu public hiện có (33 token), semantic mới, ramp dùng `color-mix`, và token không phải màu.
  - `$mode: 'light' | 'dark' | 'auto'` điều khiển dark theme. Khi dark, **mọi** token semantic được khai lại ngay trong scope dark, để không bị kẹt ở giá trị light đã resolve.
  - Material dark phát cùng scope qua `mat.theme`.
- **Guard bảo mật:**
  - Kiểm URL tập trung ở một hàm thuần trong `utilities/extensions`, mở rộng từ `url-safety.ts`.
  - Lọc HTML editor là một hàm thuần dựa trên DOM, dùng chung cho editor và mini-editor.
  - Cả hai fail closed.
- **Virtual scroll:** chỉ dùng `@angular/cdk/scrolling` (đã có trong peer `@angular/cdk`). Tắt thì template giữ nguyên nhánh cũ.
- **i18n:** chuỗi mới đi qua `I18nService` với key `core.component.<name>.*` / `core.notify.*`, đủ 5 catalog.
- **Docs:** mỗi thay đổi public cập nhật `sd-*.md` trong cùng commit. Component mới có showcase demo.

## Stack profile and technology assumptions

- Track: `angular`.
- Stack profile: `core-ui-angular`. Đây là chính thư viện `@sdcorejs/angular`.
- Profile evidence:
  - `LIB/package.json` có name `@sdcorejs/angular`, version `19.2.15`.
  - Các workspace `versions/v19..v22`.
  - Summary của repo khai `stack_profiles: [core-ui-angular]`.
- Technology assumptions:
  - Angular 19 standalone, signals, OnPush.
  - Angular Material và CDK là peer dependency sẵn có.
  - CKEditor 5 bản 48.
  - Sass lấy qua `versions/v19`.
  - Karma/Jasmine, ChromeHeadless.
  - Node 22.22.3 (fnm).
  - v19/showcase dùng `npm ci --legacy-peer-deps`; v22 dùng clean `npm ci`.

## File structure

`LIB` = `versions/v19/projects/sdcorejs-angular`. Danh sách chi tiết từng file và thứ tự làm thuộc về plan.

- **P1**
  - `LIB/components/table/src/services/table-export/table-export.service.ts` (+ spec) — sửa, áp dụng `max`.
  - `LIB/components/table/src/models/table-option-export.model.ts` — sửa doc comment.
  - `LIB/services/notify/src/components/{toast,toast-container}.component.*`, `notify.service.ts` (+ specs), `sd-notify.md` — sửa.
  - `LIB/directives/src/sd-tooltip.directive.ts` (+ spec), `sd-tooltip.md` — sửa.
  - `LIB/components/mini-editor/src/mini-editor.component.ts`, `LIB/components/editor/src/editor.component.ts` (+ specs, md) — sửa.
  - Hàm lọc HTML mới trong `LIB/components/editor` hoặc `LIB/utilities/extensions/src` — tạo mới (vị trí chốt ở architecture).
  - `LIB/utilities/extensions/src/url-safety.ts` (+ spec), `utility.extension.ts` — sửa.
  - `LIB/components/preview/src/preview-image/*`, `preview-pdf/{component,browser}.ts` — sửa.
  - `LIB/components/upload-file/src/upload-file.component.{ts,html}` — sửa.
  - `LIB/i18n/src/{en,vi,ja,ko,zh}.ts` — sửa (key mới).
- **P2**
  - `LIB/components/side-drawer/src/body-scroll-lock.service.ts` — sửa, và thêm `body-scroll-lock.service.spec.ts` mới.
  - `LIB/i18n/src/i18n.service.ts` (+ spec), `i18n.md` — sửa.
  - Các file có `'vi-VN'` phải sửa:
    - `forms/date`, `forms/datetime`
    - `modules/layout/modules/{forbidden,not-found,home}`
    - `components/query-bar/.../inline-value-chip`
    - `components/file-explorer/src/file-explorer.utils.ts`
  - Preview video:
    - Tạo `LIB/components/preview/src/preview-video/*`.
    - Sửa `LIB/components/preview/index.ts`, `sd-preview.md` (thêm mục video, bỏ mục pdf bị lặp).
    - Sửa `LIB/components/file-explorer/src/{file-explorer.utils.ts,file-explorer.view-model.ts,components/preview-panel.component.ts}`.
  - Highlight:
    - Tạo `LIB/utilities/extensions/src/text-search.ts` (+ spec).
    - Tạo entry mới `LIB/components/highlight/` gồm `ng-package.json`, `index.ts`, `src/`, `sd-highlight.md`.
  - Virtual scroll: sửa `LIB/forms/select/src/select.component.{ts,html,scss}` và `LIB/forms/autocomplete/src/autocomplete.component.{ts,html,scss}` (+ specs, md).
- **Token**
  - `LIB/assets/scss/themes/{default.scss,_presets.scss,material-theme.scss}`, `LIB/assets/scss/core/color.scss` — sửa.
  - Partial token mới trong `LIB/assets/scss/themes/` — tạo mới.
  - Khoảng 37 file SCSS có focus outline, khoảng 84 file SCSS có hex thô, các file TS có hex (avatar, api-contract-*, sidebar-v1, autoid-highlight, tooltip) — sửa theo quy tắc exact-value.
  - Entry mới `LIB/utilities/theme/` gồm `ng-package.json`, `index.ts`, `src/`, md — tạo mới; sửa `LIB/utilities/index.ts`.
  - `LIB/assets/THEME.md` — tạo mới; `LIB/assets/STYLE-GUIDE.md` — sửa.
  - Tooling:
    - Tạo `scripts/check-scss-hex.mjs` (+ test).
    - Sửa `scripts/core-theme.test.mjs`, root `package.json` (`test:scripts`), `versions/v19/eslint.config.js` hoặc `LIB/eslint.config.js`, `.github/workflows/ci.yml`.
  - Showcase:
    - Tạo `showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts`, `showcase/src/app/pages/components/highlight/highlight-demo.component.ts`.
    - Sửa preview demo, `showcase/src/app/docs/core/documentation.registry.ts` (+ spec counts), manifest sinh bởi `npm run generate:showcase-examples`.
- **Release và docs**
  - `scripts/release-package-contract.mjs` (+ test), `scripts/deploy.ps1` — sửa.
  - Rà các parser suffix khác: `scripts/collect-release-docs.mjs`, `generate-showcase-changelog.mjs`, `collect-docs.mjs`, `build-published-page.mjs`.
  - `AGENTS.md`, `CLAUDE.md` (mục release `x.0`), `CHANGELOG.md` (`[Unreleased]`), `README.npm.md` và 4 package README — sửa.
  - `versions/v20|v21|v22/**` — chỉ sinh bằng `npm run sync`.

Miễn trừ quy tắc hex:
- `LIB/assets/scss/themes/**` (nơi định nghĩa token).
- File `*.generated.ts` (icon file-explorer, pdf worker).
- Giá trị dữ liệu người dùng của `forms/input-color`.
- Fallback trong `var(--x, #hex)`.

## Acceptance criteria

| ID | Tình huống | Kết quả mong đợi | Kiểm | Yêu cầu |
|---|---|---|---|---|
| AC-001 | Export server hoặc local có số dòng vượt `max` | Không ghi file; hiện cảnh báo i18n có giới hạn; `exporting` về false | automated | R-001 |
| AC-002 | Export khi không đặt `max` hoặc chưa vượt | Hành vi như 2.15; spec export cũ vẫn xanh | automated | R-001 |
| AC-003 | Hiện toast info/success và warning/error | Region polite đọc info/success; region assertive đọc warning/error | automated | R-002 |
| AC-004 | Focus bàn phím đi vào rồi rời toast | Tạm dừng tự đóng khi focus ở trong, chạy lại khi blur; hover vẫn tạm dừng như cũ | automated | R-002 |
| AC-005 | Render nút của toast | Nút đóng và action có `type="button"`; nút đóng có `aria-label` i18n | automated | R-002 |
| AC-006 | Focus rồi blur host của tooltip | Hiện khi focus, ẩn khi blur; bubble có `role="tooltip"`; `aria-describedby` của host chứa id bubble chỉ khi đang hiện và giữ nguyên id cũ | automated | R-003 |
| AC-007 | Nhấn Escape khi tooltip đang hiện và đang ẩn | Đang hiện: ẩn và chặn lan sự kiện. Đang ẩn: sự kiện lan bình thường | automated | R-003 |
| AC-008 | Rê chuột từ host vào bubble; kiểm màu mặc định | Bubble vẫn hiện khi đang hover; màu nền lấy từ token; directive không còn literal hex | automated | R-003 |
| AC-009 | Kiểm config link của mini-editor | `link.allowedProtocols` = https, http, mailto, tel | automated | R-004 |
| AC-010 | Editor/mini-editor phát HTML có URL `javascript:`/`vbscript:`, `data:text`, thuộc tính `on*`, style, bảng, ảnh https/`data:image` | URL không an toàn và `on*` bị bỏ; style, bảng, ảnh an toàn được giữ; áp cho `valueChange`, `sdChange`, `contentChange` và giá trị form | automated | R-004 |
| AC-011 | Kiểm hàm URL guard với input cho phép và bị chặn | https, http, tương đối, blob, `data:image/*`, `data:application/pdf` qua; `javascript:`, `vbscript:`, `data:` khác, `file:` bị chặn | automated | R-005 |
| AC-012 | Gọi tải xuống bằng URL bị chặn ở `SdUtilities.download`, preview-image, preview-pdf, upload-file | Không có điều hướng anchor; upload-file không còn `href="javascript:;"` | automated | R-005 |
| AC-013 | Khoá/mở scroll khi có scrollbar; khoá chồng nhau; chế độ container | `padding-right` tăng đúng độ rộng scrollbar một lần, trả lại khi lần khoá cuối được giải phóng; container không đổi | automated | R-006 |
| AC-014 | Đổi ngôn ngữ; render message min/max của date/datetime, trang forbidden/not-found/home, chip query-bar | `locale()` trả thẻ BCP-47 đúng và định dạng theo thẻ đó; code thư viện không còn `'vi-VN'` ngoài bảng map duy nhất | automated | R-007 |
| AC-015 | Render `sd-preview-video` với URL, Blob, poster, lỗi media, tải xuống | Video native có controls; object URL từ Blob được revoke khi destroy; lỗi hiện message i18n và nút thử lại; tải xuống theo guard; có autoId | automated | R-008 |
| AC-016 | Mở file video trong file-explorer detail | Render `sd-preview-video` thay cho fallback "không xem trước được" | automated | R-008 |
| AC-017 | Xem `sd-preview.md` và trang showcase preview | Có mục video; mục pdf bị lặp đã bỏ; demo phát được video mẫu | manual | R-008 |
| AC-018 | Chạy util highlight với dấu tiếng Việt, đ/Đ, hoa/thường, ký tự đặc biệt regex, surrogate pair, term rỗng | Kết quả normalize và range khớp index gốc, không throw | automated | R-009 |
| AC-019 | Render `sd-highlight` với text chứa markup HTML | Phần khớp nằm trong `<mark>`; markup hiện dạng text, không được parse | automated | R-009 |
| AC-020 | `sd-select` với `virtualScroll` tắt | DOM và hành vi y như 2.15; không có viewport ảo; spec select cũ vẫn xanh | automated | R-010 |
| AC-021 | `sd-select` bật `virtualScroll` với 10.000 item local, single và multi | Số option render bị giới hạn; End/PageDown/typeahead tới được mọi item; multi giữ giá trị nằm ngoài viewport; trigger hiện đủ nhãn đã chọn; select-all phủ toàn bộ tập đã lọc | automated | R-010 |
| AC-022 | `sd-autocomplete` với `virtualScroll` tắt và bật (10.000 item) | Tắt thì như 2.15; bật thì render giới hạn, phím mũi tên tới mọi item, chọn phát đúng giá trị | automated | R-011 |
| AC-023 | Compile `sd.theme` với preset `omeu` | Giá trị phát ra đúng D-013; test contrast qua | automated | R-012 |
| AC-024 | Quét focus rule của thư viện; tính màu focus outline | Màu mọi focus outline lấy từ token (chung, hook component có fallback về token chung, hoặc token component); không còn hex; không đặt hook thì màu mặc định bằng primary; giao diện light không đổi | automated | R-013 |
| AC-025 | Compile theme default, từng preset, dark | Mọi token semantic mới được phát với công thức đã ghi | automated | R-014 |
| AC-026 | Compile theme; xem báo cáo migrate literal | Token không phải màu được phát; chỉ thay literal khớp tuyệt đối; utility class không đổi | automated | R-015 |
| AC-027 | So output theme với 2.15 | Có ramp cho 7 họ × 11 bậc; `-light`, `-dark`, `-contrast` không đổi ở default và các preset | automated | R-016 |
| AC-028 | Compile `sd.theme` khi không truyền mode, với `dark`, với `auto` | Không truyền mode thì mọi khai báo của 2.15 vẫn có mặt với giá trị y hệt; chỉ thêm custom property `--sd-*` mới và các block `[data-sd-theme]`; computed style mặc định không đổi. `dark` khai lại mọi token public và semantic cùng Material dark trong `[data-sd-theme="dark"]`, kèm `color-scheme: dark`. `auto` áp dark qua `prefers-color-scheme` trừ khi có `[data-sd-theme="light"]` | automated | R-017 |
| AC-029 | Chạy rule ESLint hex và script SCSS trên fixture và trên repo | Hex cài sẵn trong fixture bị báo; fallback `var()` và miễn trừ được qua; repo qua; cả hai chạy trong CI | automated | R-018 |
| AC-030 | Quét SCSS/TS thư viện sau khi migrate | Không còn hex thô ngoài miễn trừ; computed style mẫu không đổi | automated | R-019 |
| AC-031 | Chạy `test:scripts` trong CI với một cặp contrast bị hạ dưới ngưỡng | `test:theme` chạy trong `test:scripts`, phủ ma trận cặp màu cho default, preset, omeu, dark, và báo lỗi ở cặp bị hạ | automated | R-020 |
| AC-032 | Import `@sdcorejs/angular/utilities/theme` | Entry build được; `readSdTokens` trả giá trị đã resolve trong browser và `{}` khi không có `document`; `SdColorToken` khớp danh sách token public | automated | R-021 |
| AC-033 | Build showcase và published docs | Trang Theme & tokens và `THEME.md` đã đăng ký; số đếm trong registry spec được cập nhật; docs guard qua | automated | R-022 |
| AC-034 | Xem trang Theme & tokens | Swatch, ramp, token, bảng contrast và nút bật dark hiển thị đúng ở cả light và dark | manual | R-022 |
| AC-035 | Chạy test tooling release cho `3.0` baseline `2.15` và các case 2.x cũ | Target là 19.3.0, 20.3.0, 21.3.0, 22.3.0 với baseline `*.2.15`; `x.0` không kèm baseline tường minh bị từ chối; test cũ vẫn xanh | automated | R-023 |
| AC-036 | Xem CHANGELOG, README và workspace dẫn xuất sau `npm run sync` | `[Unreleased]` có mục BREAKING kèm migration diff; README đồng nhất; `check:sync` qua; mojibake scan sạch | automated | R-024 |
| AC-037 | Chạy Karma v19 có coverage, build thư viện, build showcase | Tất cả qua, đạt ngưỡng coverage | automated | R-024 |
| AC-038 | Cài và build v20, v21, v22 | Build được cả ba line; chạy ở gate cắt release | deferred | R-024 |

**Invariant bảo vệ:**
- INV-001: nếu không dùng input/mode/preset opt-in mới thì giao diện và hành vi y như 2.15.
- INV-002: logic dùng chung chỉ sửa ở v19, rồi lan ra bằng `npm run sync`.
- INV-003: không thêm dependency npm nào.
- INV-004: tên và giá trị light của `--sd-*` hiện có giữ nguyên.
- INV-005: chuỗi mới đi qua `I18nService`, đủ 5 catalog.
- INV-006: guard URL/HTML fail closed.

**Thay đổi hành vi sẽ ghi vào mục BREAKING:**
- `export.max` giờ có hiệu lực.
- HTML đầu ra của editor bị lọc.
- URL tải xuống không an toàn bị chặn.
- `sd-tooltip` hiện khi focus.
- DOM của toast có thêm live region.

## Risks & mitigations

- **Risk:** virtual scroll trên `mat-select` làm rơi giá trị multi nằm ngoài viewport, hoặc phá điều hướng bàn phím.
  - **Mitigation:** task spike làm đầu tiên kèm probe AC-021/AC-022, mặc định tắt (INV-001), nếu spike thất bại thì quay lại change control.
- **Risk:** migrate hex và literal ở khoảng 100 file gây lỗi hiển thị.
  - **Mitigation:** chỉ thay khi giá trị khớp tuyệt đối (D-014); có báo cáo migrate, snapshot theme, kiểm computed style mẫu, người dùng xem showcase.
- **Risk:** dark theme còn sót chỗ màu cứng (nền trắng của table, rgba shadow).
  - **Mitigation:** R-019 dọn hex trước, rồi mới làm dark; test contrast dark; xem showcase ở dark.
- **Risk:** Material dark khác nhau giữa v19 và v22.
  - **Mitigation:** A-004; build các line dẫn xuất ở gate cắt release (AC-038).
- **Risk:** tooltip hiện khi focus trong select/table gây nhiễu.
  - **Mitigation:** chỉ hiện với focus bàn phím hoặc focus thật trên host; Escape đóng được; ghi trong changelog.
- **Risk:** lọc HTML editor xoá nội dung hợp lệ.
  - **Mitigation:** allow-list rõ ràng; fixture có style, bảng, ảnh; ghi BREAKING kèm ví dụ.
- **Risk:** phạm vi lớn (24 yêu cầu) kéo dài thời gian.
  - **Mitigation:** plan chia đợt, đợt nào cũng test xanh mới qua đợt sau; có thể dừng giữa chừng mà vẫn ở trạng thái ổn định.
- **Risk:** tooling suffix `x.0` phá các release 2.x.
  - **Mitigation:** giữ nguyên toàn bộ test 2.x; `x.0` bắt buộc baseline tường minh.

## Out of scope (deferred)

- Cursor pagination cho `sd-table`: làm khi portal cần thay `ds-table` cursor mode.
- Gắn `sd-highlight` vào select/autocomplete và sửa pipe `high-light-search` (đang dựng RegExp từ keyword): làm ở release kế tiếp, sau khi util ổn định.
- Hợp nhất scroll lock của sidebar-mobile v2/v3: làm khi có bug layout-shift trên desktop.
- Chuyển MatTooltip sang `sd-tooltip`: làm khi cần bỏ phụ thuộc Material.
- Thay helper normalize riêng của file-explorer và tree bằng util chung: làm khi sửa hai component đó.
- Snapshot release contract `3.0.json`, pin workflow `v3.0`, tag và publish: làm ở bước cắt release, cần người dùng duyệt riêng.

## Change control (revision 2)

| Chỗ sửa | r1 | r2 |
|---|---|---|
| R-009 | `normalizeSearchText`, `findHighlightRanges` | `sdNormalizeSearchText`, `sdFindHighlightRanges` (quy ước tiền tố `sd` của `utilities/extensions`) |
| R-013, AC-024 | Mọi focus outline dùng token focus ring | Màu lấy từ token chung, hook component có fallback về token chung, hoặc token component cho bề mặt luôn tối; giao diện light không đổi |
| AC-028 | Không truyền mode thì output y như 2.15 | Mọi khai báo của 2.15 giữ nguyên giá trị; chỉ thêm token mới và block `[data-sd-theme]`; computed style không đổi |

Không đổi phạm vi, không thêm hay bỏ yêu cầu hoặc tiêu chí nào.

## Appendix — decision_coverage (machine-readable)

Dữ liệu được sinh và kiểm bằng `_refs/shared/decision-coverage.mjs` ở stage `spec` (revision 2): 0 lỗi, 0 blocker, 74 future gap (task/evidence do plan điền).

<details><summary>decision_coverage JSON</summary>

```json
{
 "schema_version": 1,
 "revision": 2,
 "records": [
  {
   "id": "R-001",
   "type": "requirement",
   "statement": "sd-table export honours export.max: when the rows to export exceed max, export does not start and an i18n warning names the limit.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-002",
   "type": "requirement",
   "statement": "Toast notifications are announced through persistent polite/assertive live regions, pause auto-dismiss on hover and keyboard focus, and expose typed, labelled buttons.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-003",
   "type": "requirement",
   "statement": "sd-tooltip meets WCAG 1.4.13: shows on focus, hides on blur, Escape dismisses, bubble is hoverable, role=tooltip with aria-describedby, token colour.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-004",
   "type": "requirement",
   "statement": "sd-mini-editor restricts link protocols and both editors emit HTML filtered of script URLs, non-image data URLs and on* attributes while keeping formatting.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-005",
   "type": "requirement",
   "statement": "A shared URL scheme guard blocks unsafe download/open URLs in SdUtilities.download, preview-image, preview-pdf, upload-file and preview-video.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-006",
   "type": "requirement",
   "statement": "The side-drawer body scroll lock compensates the scrollbar width with padding-right and restores it on final release, except in container mode.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-007",
   "type": "requirement",
   "statement": "I18nService exposes a BCP-47 locale signal; hard-coded vi-VN formatting in library code and the duplicate locale maps are replaced by it.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-008",
   "type": "requirement",
   "statement": "A new sd-preview-video component in the preview entry point plays video with error/retry state, is used by the file-explorer detail, and ships md docs plus a showcase demo.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-009",
   "type": "requirement",
   "statement": "Diacritic-insensitive helpers sdNormalizeSearchText and sdFindHighlightRanges plus an sd-highlight component render matches safely without innerHTML or regex built from input.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-010",
   "type": "requirement",
   "statement": "sd-select supports opt-in virtual scrolling (default off) preserving keyboard navigation, selected display, multi-select values and select-all.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-011",
   "type": "requirement",
   "statement": "sd-autocomplete supports opt-in virtual scrolling (default off) preserving keyboard navigation and selection.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-012",
   "type": "requirement",
   "statement": "Theme preset omeu is available with contrast-safe brand values taken from the OneHub palette.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-013",
   "type": "requirement",
   "statement": "Focus ring tokens exist (colour defaults to var(--sd-primary)); every focus outline colour comes from the shared token, a documented component hook falling back to it, or a component token for always-dark surfaces; no hex remains in focus rules.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-014",
   "type": "requirement",
   "statement": "The semantic token layer adds status bg/fg, link, surface-inverse, text-on-solid, border-focus, border-danger and overlay-backdrop tokens.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-015",
   "type": "requirement",
   "statement": "Non-colour tokens (space, radius, shadow, z-index, motion, typography) exist as CSS variables and exact-matching literals use them.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-016",
   "type": "requirement",
   "statement": "Colour ramps 50-950 are generated at runtime for the main colour families while existing -light/-dark/-contrast values stay unchanged.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-017",
   "type": "requirement",
   "statement": "An opt-in dark theme covers Core tokens and Material, scoped by [data-sd-theme=dark], with an auto mode following prefers-color-scheme.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-018",
   "type": "requirement",
   "statement": "Hex colour literals are rejected by lint in library TS/templates and by a dependency-free SCSS check, both enforced in CI.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-019",
   "type": "requirement",
   "statement": "Raw hex colours in library SCSS and TS outside documented exemptions are replaced by tokens with identical values.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-020",
   "type": "requirement",
   "statement": "Theme contrast tests run in CI and cover default, every preset including omeu, and dark mode.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-021",
   "type": "requirement",
   "statement": "A new entry point @sdcorejs/angular/utilities/theme exposes readSdTokens and the SdColorToken type.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-022",
   "type": "requirement",
   "statement": "A showcase Theme & tokens guide and a published THEME.md document tokens, ramps, contrast and dark mode; the STYLE-GUIDE is updated.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-023",
   "type": "requirement",
   "statement": "Release tooling accepts an x.0 suffix with an explicit baseline so 3.0 targets 19.3.0/20.3.0/21.3.0/22.3.0 against *.2.15.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "R-024",
   "type": "requirement",
   "statement": "Docs, changelog (with a BREAKING section and migration), npm README parity and v20-v22 rollout are delivered with the change.",
   "source": "explicit-user",
   "status": "active",
   "owner_repository_id": "sdcorejs-angular",
   "owner_module_id": null,
   "task_refs": []
  },
  {
   "id": "AC-001",
   "type": "acceptance-criterion",
   "statement": "Server or local export where the row count exceeds export.max -> No file is written, a warning notification with the i18n limit message is shown, exporting resets to false",
   "behavior": "Server or local export where the row count exceeds export.max",
   "expected_result": "No file is written, a warning notification with the i18n limit message is shown, exporting resets to false",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-001"
   ],
   "task_refs": []
  },
  {
   "id": "AC-002",
   "type": "acceptance-criterion",
   "statement": "Export with max unset or row count within max -> Export behaves exactly as in 2.15 and existing export specs stay green",
   "behavior": "Export with max unset or row count within max",
   "expected_result": "Export behaves exactly as in 2.15 and existing export specs stay green",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-001"
   ],
   "task_refs": []
  },
  {
   "id": "AC-003",
   "type": "acceptance-criterion",
   "statement": "Showing info/success and warning/error toasts -> The persistent polite region announces info/success and the assertive region announces warning/error",
   "behavior": "Showing info/success and warning/error toasts",
   "expected_result": "The persistent polite region announces info/success and the assertive region announces warning/error",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002"
   ],
   "task_refs": []
  },
  {
   "id": "AC-004",
   "type": "acceptance-criterion",
   "statement": "Keyboard focus enters and leaves a toast -> Auto-dismiss pauses while focus is inside and resumes on blur; hover pause still works",
   "behavior": "Keyboard focus enters and leaves a toast",
   "expected_result": "Auto-dismiss pauses while focus is inside and resumes on blur; hover pause still works",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002"
   ],
   "task_refs": []
  },
  {
   "id": "AC-005",
   "type": "acceptance-criterion",
   "statement": "Rendering toast buttons -> Close and action buttons are type=button and the close button has an i18n aria-label",
   "behavior": "Rendering toast buttons",
   "expected_result": "Close and action buttons are type=button and the close button has an i18n aria-label",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-002"
   ],
   "task_refs": []
  },
  {
   "id": "AC-006",
   "type": "acceptance-criterion",
   "statement": "Keyboard focus on and off a tooltip host -> The tooltip shows on focus and hides on blur; the bubble has role=tooltip; the host aria-describedby includes the bubble id only while visible and keeps existing ids",
   "behavior": "Keyboard focus on and off a tooltip host",
   "expected_result": "The tooltip shows on focus and hides on blur; the bubble has role=tooltip; the host aria-describedby includes the bubble id only while visible and keeps existing ids",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003"
   ],
   "task_refs": []
  },
  {
   "id": "AC-007",
   "type": "acceptance-criterion",
   "statement": "Pressing Escape with the tooltip visible and hidden -> Visible: tooltip hides and the event does not propagate; hidden: the event propagates unchanged",
   "behavior": "Pressing Escape with the tooltip visible and hidden",
   "expected_result": "Visible: tooltip hides and the event does not propagate; hidden: the event propagates unchanged",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003"
   ],
   "task_refs": []
  },
  {
   "id": "AC-008",
   "type": "acceptance-criterion",
   "statement": "Pointer moves from host into the bubble; default colour inspected -> The bubble stays visible while hovered; the default background comes from a token and the directive has no hex literal",
   "behavior": "Pointer moves from host into the bubble; default colour inspected",
   "expected_result": "The bubble stays visible while hovered; the default background comes from a token and the directive has no hex literal",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-003"
   ],
   "task_refs": []
  },
  {
   "id": "AC-009",
   "type": "acceptance-criterion",
   "statement": "Inspecting the mini-editor CKEditor link config -> link.allowedProtocols is https, http, mailto, tel",
   "behavior": "Inspecting the mini-editor CKEditor link config",
   "expected_result": "link.allowedProtocols is https, http, mailto, tel",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-004"
   ],
   "task_refs": []
  },
  {
   "id": "AC-010",
   "type": "acceptance-criterion",
   "statement": "Editor and mini-editor emit HTML containing javascript:/vbscript: URLs, data:text URLs, on* attributes, styles, tables and https/data:image images -> Unsafe URLs and on* attributes are removed; styles, tables and safe images are kept across valueChange, sdChange, contentChange and form value",
   "behavior": "Editor and mini-editor emit HTML containing javascript:/vbscript: URLs, data:text URLs, on* attributes, styles, tables and https/data:image images",
   "expected_result": "Unsafe URLs and on* attributes are removed; styles, tables and safe images are kept across valueChange, sdChange, contentChange and form value",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-004"
   ],
   "task_refs": []
  },
  {
   "id": "AC-011",
   "type": "acceptance-criterion",
   "statement": "Evaluating the URL guard against allowed and blocked inputs -> https, http, relative, blob, data:image/* and data:application/pdf pass; javascript:, vbscript:, other data: and file: are blocked",
   "behavior": "Evaluating the URL guard against allowed and blocked inputs",
   "expected_result": "https, http, relative, blob, data:image/* and data:application/pdf pass; javascript:, vbscript:, other data: and file: are blocked",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-005"
   ],
   "task_refs": []
  },
  {
   "id": "AC-012",
   "type": "acceptance-criterion",
   "statement": "Triggering downloads with blocked URLs in SdUtilities.download, preview-image, preview-pdf and upload-file -> No anchor navigation happens; upload-file no longer renders href=\"javascript:;\"",
   "behavior": "Triggering downloads with blocked URLs in SdUtilities.download, preview-image, preview-pdf and upload-file",
   "expected_result": "No anchor navigation happens; upload-file no longer renders href=\"javascript:;\"",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-005"
   ],
   "task_refs": []
  },
  {
   "id": "AC-013",
   "type": "acceptance-criterion",
   "statement": "Locking and releasing body scroll with a visible scrollbar, stacked locks and container mode -> padding-right grows by the scrollbar width once, is restored on final release, and container mode is untouched",
   "behavior": "Locking and releasing body scroll with a visible scrollbar, stacked locks and container mode",
   "expected_result": "padding-right grows by the scrollbar width once, is restored on final release, and container mode is untouched",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-006"
   ],
   "task_refs": []
  },
  {
   "id": "AC-014",
   "type": "acceptance-criterion",
   "statement": "Switching language and rendering date/datetime min/max messages, forbidden/not-found/home pages and query-bar chips -> locale() returns the mapped BCP-47 tag and formatting follows it; no vi-VN literal remains in library code except the single mapping table",
   "behavior": "Switching language and rendering date/datetime min/max messages, forbidden/not-found/home pages and query-bar chips",
   "expected_result": "locale() returns the mapped BCP-47 tag and formatting follows it; no vi-VN literal remains in library code except the single mapping table",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-007"
   ],
   "task_refs": []
  },
  {
   "id": "AC-015",
   "type": "acceptance-criterion",
   "statement": "Rendering sd-preview-video with URL, Blob, poster, media error and download -> A native video with controls plays; Blob URLs are revoked on destroy; errors show an i18n message with retry; downloads obey the URL guard; autoId attributes exist",
   "behavior": "Rendering sd-preview-video with URL, Blob, poster, media error and download",
   "expected_result": "A native video with controls plays; Blob URLs are revoked on destroy; errors show an i18n message with retry; downloads obey the URL guard; autoId attributes exist",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-008"
   ],
   "task_refs": []
  },
  {
   "id": "AC-016",
   "type": "acceptance-criterion",
   "statement": "Opening a video file in the file-explorer detail -> sd-preview-video renders instead of the unavailable fallback",
   "behavior": "Opening a video file in the file-explorer detail",
   "expected_result": "sd-preview-video renders instead of the unavailable fallback",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-008"
   ],
   "task_refs": []
  },
  {
   "id": "AC-017",
   "type": "acceptance-criterion",
   "statement": "Reviewing sd-preview.md and the showcase preview page -> The video section is documented, the duplicated pdf section is removed, and the demo plays a sample video",
   "behavior": "Reviewing sd-preview.md and the showcase preview page",
   "expected_result": "The video section is documented, the duplicated pdf section is removed, and the demo plays a sample video",
   "verification_kind": "manual",
   "blocking": true,
   "requirement_refs": [
    "R-008"
   ],
   "task_refs": []
  },
  {
   "id": "AC-018",
   "type": "acceptance-criterion",
   "statement": "Running highlight utilities on diacritics, đ/Đ, case, regex metacharacters, surrogate pairs and empty terms -> Normalization and ranges match expected original-index ranges without throwing",
   "behavior": "Running highlight utilities on diacritics, đ/Đ, case, regex metacharacters, surrogate pairs and empty terms",
   "expected_result": "Normalization and ranges match expected original-index ranges without throwing",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-009"
   ],
   "task_refs": []
  },
  {
   "id": "AC-019",
   "type": "acceptance-criterion",
   "statement": "Rendering sd-highlight with text containing HTML markup -> Matches render inside mark elements and markup is shown as text, never parsed",
   "behavior": "Rendering sd-highlight with text containing HTML markup",
   "expected_result": "Matches render inside mark elements and markup is shown as text, never parsed",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-009"
   ],
   "task_refs": []
  },
  {
   "id": "AC-020",
   "type": "acceptance-criterion",
   "statement": "Using sd-select with virtualScroll off -> DOM and behaviour are identical to 2.15; no virtual viewport exists; existing select specs stay green",
   "behavior": "Using sd-select with virtualScroll off",
   "expected_result": "DOM and behaviour are identical to 2.15; no virtual viewport exists; existing select specs stay green",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-010"
   ],
   "task_refs": []
  },
  {
   "id": "AC-021",
   "type": "acceptance-criterion",
   "statement": "Using sd-select with virtualScroll on and 10000 local items, single and multi -> Rendered options stay bounded; End/PageDown/typeahead reach every item; multi keeps selected values outside the viewport; trigger shows all selected labels; select-all covers the filtered set",
   "behavior": "Using sd-select with virtualScroll on and 10000 local items, single and multi",
   "expected_result": "Rendered options stay bounded; End/PageDown/typeahead reach every item; multi keeps selected values outside the viewport; trigger shows all selected labels; select-all covers the filtered set",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-010"
   ],
   "task_refs": []
  },
  {
   "id": "AC-022",
   "type": "acceptance-criterion",
   "statement": "Using sd-autocomplete with virtualScroll off and on with 10000 items -> Off is identical to 2.15; on keeps rendering bounded, arrow keys reach every item and selection emits the right value",
   "behavior": "Using sd-autocomplete with virtualScroll off and on with 10000 items",
   "expected_result": "Off is identical to 2.15; on keeps rendering bounded, arrow keys reach every item and selection emits the right value",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-011"
   ],
   "task_refs": []
  },
  {
   "id": "AC-023",
   "type": "acceptance-criterion",
   "statement": "Compiling sd.theme with preset omeu -> Emitted values equal the specified omeu values and contrast tests pass",
   "behavior": "Compiling sd.theme with preset omeu",
   "expected_result": "Emitted values equal the specified omeu values and contrast tests pass",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-012"
   ],
   "task_refs": []
  },
  {
   "id": "AC-024",
   "type": "acceptance-criterion",
   "statement": "Scanning library focus rules and computing a focus outline -> every focus outline colour comes from a token; no hex; default equals primary; light unchanged",
   "behavior": "Scanning library focus rules and computing a focus outline",
   "expected_result": "Every focus outline colour comes from a token (shared, hook with shared fallback, or component token); no hex remains; without hooks the default colour equals the primary colour; light appearance is unchanged",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-013"
   ],
   "task_refs": []
  },
  {
   "id": "AC-025",
   "type": "acceptance-criterion",
   "statement": "Compiling default, every preset and dark themes -> All new semantic tokens are emitted with the documented derivations",
   "behavior": "Compiling default, every preset and dark themes",
   "expected_result": "All new semantic tokens are emitted with the documented derivations",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-014"
   ],
   "task_refs": []
  },
  {
   "id": "AC-026",
   "type": "acceptance-criterion",
   "statement": "Compiling themes and reviewing the literal migration report -> Non-colour tokens are emitted; only exact-value literals were replaced; utility classes are unchanged",
   "behavior": "Compiling themes and reviewing the literal migration report",
   "expected_result": "Non-colour tokens are emitted; only exact-value literals were replaced; utility classes are unchanged",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-015"
   ],
   "task_refs": []
  },
  {
   "id": "AC-027",
   "type": "acceptance-criterion",
   "statement": "Comparing theme output with 2.15 -> Ramp tokens exist for 7 families x 11 steps; -light, -dark and -contrast values are unchanged for default and presets",
   "behavior": "Comparing theme output with 2.15",
   "expected_result": "Ramp tokens exist for 7 families x 11 steps; -light, -dark and -contrast values are unchanged for default and presets",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-016"
   ],
   "task_refs": []
  },
  {
   "id": "AC-028",
   "type": "acceptance-criterion",
   "statement": "Compiling sd.theme with mode omitted, dark and auto -> 2.15 declarations unchanged (additive only); complete dark scope; auto media scope",
   "behavior": "Compiling sd.theme with mode omitted, dark and auto",
   "expected_result": "Omitted mode keeps every 2.15 declaration with identical values and only adds new --sd-* properties and [data-sd-theme] blocks; dark redeclares every public and semantic token plus Material dark under [data-sd-theme=dark] with color-scheme dark; auto applies dark via prefers-color-scheme unless [data-sd-theme=light]",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-017"
   ],
   "task_refs": []
  },
  {
   "id": "AC-029",
   "type": "acceptance-criterion",
   "statement": "Running the ESLint hex rule and the SCSS hex check on fixtures and on the repository -> Planted hex fails, var() fallbacks and exemptions pass, the repository passes, and both run in CI",
   "behavior": "Running the ESLint hex rule and the SCSS hex check on fixtures and on the repository",
   "expected_result": "Planted hex fails, var() fallbacks and exemptions pass, the repository passes, and both run in CI",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-018"
   ],
   "task_refs": []
  },
  {
   "id": "AC-030",
   "type": "acceptance-criterion",
   "statement": "Scanning library SCSS and TS after migration -> Zero raw hex remains outside documented exemptions and sampled computed styles are unchanged",
   "behavior": "Scanning library SCSS and TS after migration",
   "expected_result": "Zero raw hex remains outside documented exemptions and sampled computed styles are unchanged",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-019"
   ],
   "task_refs": []
  },
  {
   "id": "AC-031",
   "type": "acceptance-criterion",
   "statement": "Running test:scripts in CI with a contrast pair lowered below threshold -> test:theme runs inside test:scripts, covers the pair matrix for default, presets, omeu and dark, and fails on the lowered pair",
   "behavior": "Running test:scripts in CI with a contrast pair lowered below threshold",
   "expected_result": "test:theme runs inside test:scripts, covers the pair matrix for default, presets, omeu and dark, and fails on the lowered pair",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-020"
   ],
   "task_refs": []
  },
  {
   "id": "AC-032",
   "type": "acceptance-criterion",
   "statement": "Importing @sdcorejs/angular/utilities/theme -> The entry builds; readSdTokens returns resolved values in a browser and an empty record without a document; SdColorToken matches the public token list",
   "behavior": "Importing @sdcorejs/angular/utilities/theme",
   "expected_result": "The entry builds; readSdTokens returns resolved values in a browser and an empty record without a document; SdColorToken matches the public token list",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-021"
   ],
   "task_refs": []
  },
  {
   "id": "AC-033",
   "type": "acceptance-criterion",
   "statement": "Building the showcase and published docs -> The Theme & tokens page and THEME.md are registered, registry counts are updated and the docs guard passes",
   "behavior": "Building the showcase and published docs",
   "expected_result": "The Theme & tokens page and THEME.md are registered, registry counts are updated and the docs guard passes",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-022"
   ],
   "task_refs": []
  },
  {
   "id": "AC-034",
   "type": "acceptance-criterion",
   "statement": "Viewing the Theme & tokens page -> Swatches, ramps, tokens, contrast tables and the dark toggle render correctly in light and dark",
   "behavior": "Viewing the Theme & tokens page",
   "expected_result": "Swatches, ramps, tokens, contrast tables and the dark toggle render correctly in light and dark",
   "verification_kind": "manual",
   "blocking": true,
   "requirement_refs": [
    "R-022"
   ],
   "task_refs": []
  },
  {
   "id": "AC-035",
   "type": "acceptance-criterion",
   "statement": "Running release tooling tests for 3.0 with baseline 2.15 and existing 2.x cases -> Targets are 19.3.0, 20.3.0, 21.3.0, 22.3.0 with *.2.15 baselines; x.0 without an explicit baseline is rejected; existing tests stay green",
   "behavior": "Running release tooling tests for 3.0 with baseline 2.15 and existing 2.x cases",
   "expected_result": "Targets are 19.3.0, 20.3.0, 21.3.0, 22.3.0 with *.2.15 baselines; x.0 without an explicit baseline is rejected; existing tests stay green",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-023"
   ],
   "task_refs": []
  },
  {
   "id": "AC-036",
   "type": "acceptance-criterion",
   "statement": "Reviewing CHANGELOG, READMEs and derived workspaces after npm run sync -> CHANGELOG [Unreleased] has a BREAKING section with migration diffs; README parity and check:sync pass; the mojibake scan is clean",
   "behavior": "Reviewing CHANGELOG, READMEs and derived workspaces after npm run sync",
   "expected_result": "CHANGELOG [Unreleased] has a BREAKING section with migration diffs; README parity and check:sync pass; the mojibake scan is clean",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-024"
   ],
   "task_refs": []
  },
  {
   "id": "AC-037",
   "type": "acceptance-criterion",
   "statement": "Running v19 Karma with coverage, the library build and the showcase build -> All pass with coverage thresholds met",
   "behavior": "Running v19 Karma with coverage, the library build and the showcase build",
   "expected_result": "All pass with coverage thresholds met",
   "verification_kind": "automated",
   "blocking": true,
   "requirement_refs": [
    "R-024"
   ],
   "task_refs": []
  },
  {
   "id": "AC-038",
   "type": "acceptance-criterion",
   "statement": "Installing and building v20, v21 and v22 -> All derived lines build; executed at the release-cut gate",
   "behavior": "Installing and building v20, v21 and v22",
   "expected_result": "All derived lines build; executed at the release-cut gate",
   "verification_kind": "deferred",
   "blocking": true,
   "requirement_refs": [
    "R-024"
   ],
   "task_refs": []
  },
  {
   "id": "A-001",
   "type": "assumption",
   "statement": "No consumer depends on export.max being ignored, because neither Legacy nor 2.15 ever enforced it.",
   "source": "inferred",
   "confidence": "medium",
   "status": "confirmed",
   "blocking": false,
   "evidence_refs": [
    "EVIDENCE-A001"
   ],
   "consequence_if_wrong": "Consumers with max set lose exports above the limit until they raise it.",
   "validation_method": "Changelog BREAKING entry and code search of max usage in known consumers.",
   "owner": "release owner",
   "rationale": "Legacy source and 2.15 never read export.max.",
   "impacted_refs": [
    "R-001"
   ]
  },
  {
   "id": "A-002",
   "type": "assumption",
   "statement": "CKEditor 5 data output keeps javascript: hrefs and the mini-editor Link plugin accepts any protocol without allowedProtocols.",
   "source": "inferred",
   "confidence": "medium",
   "status": "proposed",
   "blocking": false,
   "evidence_refs": [
    "EVIDENCE-A002"
   ],
   "consequence_if_wrong": "The output filter is still required as defence in depth; only test fixtures change.",
   "validation_method": "RED unit test against the real editor build before implementing the filter.",
   "owner": "implementer",
   "rationale": "Observed in ckeditor5-link data downcast during review.",
   "impacted_refs": [
    "R-004"
   ]
  },
  {
   "id": "A-003",
   "type": "assumption",
   "statement": "CDK virtual scrolling can be combined with mat-select and mat-autocomplete while keeping keyboard navigation and multi-select values.",
   "source": "inferred",
   "confidence": "medium",
   "status": "proposed",
   "blocking": false,
   "evidence_refs": [
    "EVIDENCE-A003"
   ],
   "consequence_if_wrong": "The spec must be revised through change control for a custom listbox.",
   "validation_method": "A spike task runs first and must pass AC-021/AC-022 probes before rollout.",
   "owner": "implementer",
   "rationale": "Known limitations exist; a spike isolates the risk.",
   "impacted_refs": [
    "R-010",
    "R-011"
   ]
  },
  {
   "id": "A-004",
   "type": "assumption",
   "statement": "Angular Material 19-22 mat.theme supports theme-type dark inside a scoped selector.",
   "source": "inferred",
   "confidence": "high",
   "status": "proposed",
   "blocking": false,
   "evidence_refs": [
    "EVIDENCE-A004"
   ],
   "consequence_if_wrong": "Material dark must use per-line shims or be documented as consumer-configured.",
   "validation_method": "Theme compile test on v19 and derived-line builds at release cut.",
   "owner": "implementer",
   "rationale": "Material M3 mat.theme exposes theme-type.",
   "impacted_refs": [
    "R-017"
   ]
  },
  {
   "id": "A-005",
   "type": "assumption",
   "statement": "Replacing literals and hex values only with tokens of identical value produces no visual change.",
   "source": "defaulted",
   "confidence": "high",
   "status": "confirmed",
   "blocking": false,
   "evidence_refs": [
    "EVIDENCE-A005"
   ],
   "consequence_if_wrong": "Visual regressions appear in migrated components.",
   "validation_method": "Theme snapshot tests, computed-style spot checks and manual showcase review.",
   "owner": "implementer",
   "rationale": "Exact-value mapping is the migration rule.",
   "impacted_refs": [
    "R-015",
    "R-019"
   ]
  },
  {
   "id": "A-006",
   "type": "assumption",
   "statement": "No browser automation is available, so visual verification of showcase pages is manual.",
   "source": "explicit",
   "confidence": "high",
   "status": "confirmed",
   "blocking": false,
   "evidence_refs": [
    "EVIDENCE-A006"
   ],
   "consequence_if_wrong": "Visual checks could be automated instead.",
   "validation_method": "Manual showcase review by the user.",
   "owner": "user",
   "rationale": "The Playwright integration failed to connect in this session.",
   "impacted_refs": [
    "R-008",
    "R-022"
   ]
  },
  {
   "id": "A-007",
   "type": "assumption",
   "statement": "Node 22.22.3 via fnm and npm ci --legacy-peer-deps work for v19 and the showcase in the worktree.",
   "source": "explicit",
   "confidence": "high",
   "status": "confirmed",
   "blocking": false,
   "evidence_refs": [
    "EVIDENCE-A007"
   ],
   "consequence_if_wrong": "Verification cannot run until the toolchain is fixed.",
   "validation_method": "fnm list shows v22.22.3; install runs in the first plan task.",
   "owner": "implementer",
   "rationale": "Repository requires the exact Node version.",
   "impacted_refs": [
    "R-024"
   ]
  },
  {
   "id": "D-001",
   "type": "decision",
   "statement": "Virtual scroll scope: sd-select and sd-autocomplete only, opt-in input, default off; sd-table unchanged",
   "question": "Virtual scroll scope",
   "selected_value": "sd-select and sd-autocomplete only, opt-in input, default off; sd-table unchanged",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User choice; limits blast radius.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-010",
    "R-011",
    "AC-020",
    "AC-021",
    "AC-022"
   ],
   "task_refs": []
  },
  {
   "id": "D-002",
   "type": "decision",
   "statement": "Dark theme activation: Opt-in scope [data-sd-theme=dark] for Core and Material, plus mode auto following prefers-color-scheme",
   "question": "Dark theme activation",
   "selected_value": "Opt-in scope [data-sd-theme=dark] for Core and Material, plus mode auto following prefers-color-scheme",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User choice.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-017",
    "AC-028"
   ],
   "task_refs": []
  },
  {
   "id": "D-003",
   "type": "decision",
   "statement": "Editor output policy: link.allowedProtocols https/http/mailto/tel plus a light output filter keeping formatting",
   "question": "Editor output policy",
   "selected_value": "link.allowedProtocols https/http/mailto/tel plus a light output filter keeping formatting",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User choice; full sanitizer would strip styles.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-004",
    "AC-009",
    "AC-010"
   ],
   "task_refs": []
  },
  {
   "id": "D-004",
   "type": "decision",
   "statement": "Branch and release boundary: Worktree branch release/3.0 from origin/main; stop before release cut, tag and publish",
   "question": "Branch and release boundary",
   "selected_value": "Worktree branch release/3.0 from origin/main; stop before release cut, tag and publish",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User choice.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-023",
    "R-024",
    "AC-035",
    "AC-038"
   ],
   "task_refs": []
  },
  {
   "id": "D-005",
   "type": "decision",
   "statement": "export.max semantics: Block the export and warn when rows exceed max",
   "question": "export.max semantics",
   "selected_value": "Block the export and warn when rows exceed max",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default; safer than silent truncation.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-001",
    "AC-001",
    "AC-002"
   ],
   "task_refs": []
  },
  {
   "id": "D-006",
   "type": "decision",
   "statement": "Toast announcement model: Persistent polite and assertive live regions in the container; pause on hover and focus",
   "question": "Toast announcement model",
   "selected_value": "Persistent polite and assertive live regions in the container; pause on hover and focus",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default; dynamic regions are often missed.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-002",
    "AC-003",
    "AC-004"
   ],
   "task_refs": []
  },
  {
   "id": "D-007",
   "type": "decision",
   "statement": "Tooltip scope: Fix sd-tooltip only; MatTooltip usages stay unchanged",
   "question": "Tooltip scope",
   "selected_value": "Fix sd-tooltip only; MatTooltip usages stay unchanged",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default; MatTooltip already meets 1.4.13.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-003",
    "AC-006"
   ],
   "task_refs": []
  },
  {
   "id": "D-008",
   "type": "decision",
   "statement": "URL allow-list: Allow https, http, relative, blob, data:image/*, data:application/pdf; block everything else",
   "question": "URL allow-list",
   "selected_value": "Allow https, http, relative, blob, data:image/*, data:application/pdf; block everything else",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-005",
    "AC-011",
    "AC-012"
   ],
   "task_refs": []
  },
  {
   "id": "D-009",
   "type": "decision",
   "statement": "Scroll-lock compensation: padding-right equal to scrollbar width on the side-drawer lock service; container mode skipped",
   "question": "Scroll-lock compensation",
   "selected_value": "padding-right equal to scrollbar width on the side-drawer lock service; container mode skipped",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-006",
    "AC-013"
   ],
   "task_refs": []
  },
  {
   "id": "D-010",
   "type": "decision",
   "statement": "Locale source: I18nService.locale() signal with a single language-to-BCP-47 map",
   "question": "Locale source",
   "selected_value": "I18nService.locale() signal with a single language-to-BCP-47 map",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-007",
    "AC-014"
   ],
   "task_refs": []
  },
  {
   "id": "D-011",
   "type": "decision",
   "statement": "Preview video placement: sd-preview-video inside the components/preview entry point, integrated into the file-explorer detail",
   "question": "Preview video placement",
   "selected_value": "sd-preview-video inside the components/preview entry point, integrated into the file-explorer detail",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-008",
    "AC-015",
    "AC-016"
   ],
   "task_refs": []
  },
  {
   "id": "D-012",
   "type": "decision",
   "statement": "Highlight delivery: Utilities in utilities/extensions plus a new sd-highlight component; no adoption in other components yet",
   "question": "Highlight delivery",
   "selected_value": "Utilities in utilities/extensions plus a new sd-highlight component; no adoption in other components yet",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-009",
    "AC-018",
    "AC-019"
   ],
   "task_refs": []
  },
  {
   "id": "D-013",
   "type": "decision",
   "statement": "omeu preset values: primary #8C5926, primary-dark #70451C, primary-light #FAF5ED, text #171717, text-secondary #525252, border #E5E5E5, border-strong #737373",
   "question": "omeu preset values",
   "selected_value": "primary #8C5926, primary-dark #70451C, primary-light #FAF5ED, text #171717, text-secondary #525252, border #E5E5E5, border-strong #737373",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default; contrast-checked, values only from DS.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-012",
    "AC-023"
   ],
   "task_refs": []
  },
  {
   "id": "D-014",
   "type": "decision",
   "statement": "Literal migration rule: Replace literals and hex only with tokens of identical value; add a token when none exists",
   "question": "Literal migration rule",
   "selected_value": "Replace literals and hex only with tokens of identical value; add a token when none exists",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default; guarantees no visual change.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-015",
    "R-019",
    "AC-026",
    "AC-030"
   ],
   "task_refs": []
  },
  {
   "id": "D-015",
   "type": "decision",
   "statement": "Ramp generation: color-mix at runtime from base tokens; -light/-dark/-contrast keep their current values",
   "question": "Ramp generation",
   "selected_value": "color-mix at runtime from base tokens; -light/-dark/-contrast keep their current values",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default; consumer overrides propagate.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-016",
    "AC-027"
   ],
   "task_refs": []
  },
  {
   "id": "D-016",
   "type": "decision",
   "statement": "Hex enforcement tooling: ESLint rule plus a dependency-free SCSS script at error level; var() fallbacks allowed",
   "question": "Hex enforcement tooling",
   "selected_value": "ESLint rule plus a dependency-free SCSS script at error level; var() fallbacks allowed",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default; no new dependency.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-018",
    "AC-029"
   ],
   "task_refs": []
  },
  {
   "id": "D-017",
   "type": "decision",
   "statement": "Token export entry point: New secondary entry @sdcorejs/angular/utilities/theme",
   "question": "Token export entry point",
   "selected_value": "New secondary entry @sdcorejs/angular/utilities/theme",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "public-contract",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User accepted default.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-021",
    "AC-032"
   ],
   "task_refs": []
  },
  {
   "id": "D-018",
   "type": "decision",
   "statement": "Coverage approach: TDD for library components, services and scripts",
   "question": "Coverage approach",
   "selected_value": "TDD for library components, services and scripts",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "Repository rule for components and forms.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-024",
    "AC-037"
   ],
   "task_refs": []
  },
  {
   "id": "D-019",
   "type": "decision",
   "statement": "Release numbering: Release suffix 3.0 publishing 19.3.0, 20.3.0, 21.3.0, 22.3.0 against *.2.15",
   "question": "Release numbering",
   "selected_value": "Release suffix 3.0 publishing 19.3.0, 20.3.0, 21.3.0, 22.3.0 against *.2.15",
   "source": "explicit-user",
   "status": "approved",
   "blocking": true,
   "scope": "repository",
   "owner_repository_id": "sdcorejs-angular",
   "rationale": "User asked for 3.0; major digit is locked to the Angular line.",
   "supersedes": null,
   "revisit_condition": null,
   "convention_impact": {
    "candidate": false,
    "category": null
   },
   "downstream_refs": [
    "R-023",
    "AC-035"
   ],
   "task_refs": []
  },
  {
   "id": "INV-001",
   "type": "invariant",
   "statement": "When no new opt-in input, mode or preset is used, rendering and behaviour match 2.15.",
   "protected_refs": [
    "R-010",
    "R-011",
    "R-012",
    "R-017",
    "AC-020",
    "AC-022",
    "AC-028"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-002",
   "type": "invariant",
   "statement": "Shared library changes are authored in versions/v19 and propagated only with npm run sync; check:sync passes.",
   "protected_refs": [
    "R-024",
    "AC-036"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-003",
   "type": "invariant",
   "statement": "No new npm dependency is added; virtual scrolling uses the existing @angular/cdk peer.",
   "protected_refs": [
    "R-004",
    "R-010",
    "R-018"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-004",
   "type": "invariant",
   "statement": "Existing --sd-* token names and light-mode values, including -light/-dark/-contrast, remain available and unchanged.",
   "protected_refs": [
    "R-014",
    "R-015",
    "R-016",
    "R-019",
    "AC-027",
    "AC-030"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-005",
   "type": "invariant",
   "statement": "Every new user-facing string goes through I18nService with keys in all five catalogs.",
   "protected_refs": [
    "R-001",
    "R-002",
    "R-008",
    "AC-001",
    "AC-005",
    "AC-015"
   ],
   "task_refs": [],
   "evidence_refs": []
  },
  {
   "id": "INV-006",
   "type": "invariant",
   "statement": "URL and HTML guards fail closed: an unrecognised scheme or attribute is removed or blocked.",
   "protected_refs": [
    "R-004",
    "R-005",
    "AC-010",
    "AC-012"
   ],
   "task_refs": [],
   "evidence_refs": []
  }
 ],
 "history": [
  {
   "revision": 1,
   "active": [
    {
     "id": "R-001",
     "type": "requirement"
    },
    {
     "id": "R-002",
     "type": "requirement"
    },
    {
     "id": "R-003",
     "type": "requirement"
    },
    {
     "id": "R-004",
     "type": "requirement"
    },
    {
     "id": "R-005",
     "type": "requirement"
    },
    {
     "id": "R-006",
     "type": "requirement"
    },
    {
     "id": "R-007",
     "type": "requirement"
    },
    {
     "id": "R-008",
     "type": "requirement"
    },
    {
     "id": "R-009",
     "type": "requirement"
    },
    {
     "id": "R-010",
     "type": "requirement"
    },
    {
     "id": "R-011",
     "type": "requirement"
    },
    {
     "id": "R-012",
     "type": "requirement"
    },
    {
     "id": "R-013",
     "type": "requirement"
    },
    {
     "id": "R-014",
     "type": "requirement"
    },
    {
     "id": "R-015",
     "type": "requirement"
    },
    {
     "id": "R-016",
     "type": "requirement"
    },
    {
     "id": "R-017",
     "type": "requirement"
    },
    {
     "id": "R-018",
     "type": "requirement"
    },
    {
     "id": "R-019",
     "type": "requirement"
    },
    {
     "id": "R-020",
     "type": "requirement"
    },
    {
     "id": "R-021",
     "type": "requirement"
    },
    {
     "id": "R-022",
     "type": "requirement"
    },
    {
     "id": "R-023",
     "type": "requirement"
    },
    {
     "id": "R-024",
     "type": "requirement"
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-009",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-010",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-011",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-012",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-013",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-014",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-015",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-016",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-017",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-018",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-019",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-020",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-021",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-022",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-023",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-024",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-025",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-026",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-027",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-028",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-029",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-030",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-031",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-032",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-033",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-034",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-035",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-036",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-037",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-038",
     "type": "acceptance-criterion"
    },
    {
     "id": "A-001",
     "type": "assumption"
    },
    {
     "id": "A-002",
     "type": "assumption"
    },
    {
     "id": "A-003",
     "type": "assumption"
    },
    {
     "id": "A-004",
     "type": "assumption"
    },
    {
     "id": "A-005",
     "type": "assumption"
    },
    {
     "id": "A-006",
     "type": "assumption"
    },
    {
     "id": "A-007",
     "type": "assumption"
    },
    {
     "id": "D-001",
     "type": "decision"
    },
    {
     "id": "D-002",
     "type": "decision"
    },
    {
     "id": "D-003",
     "type": "decision"
    },
    {
     "id": "D-004",
     "type": "decision"
    },
    {
     "id": "D-005",
     "type": "decision"
    },
    {
     "id": "D-006",
     "type": "decision"
    },
    {
     "id": "D-007",
     "type": "decision"
    },
    {
     "id": "D-008",
     "type": "decision"
    },
    {
     "id": "D-009",
     "type": "decision"
    },
    {
     "id": "D-010",
     "type": "decision"
    },
    {
     "id": "D-011",
     "type": "decision"
    },
    {
     "id": "D-012",
     "type": "decision"
    },
    {
     "id": "D-013",
     "type": "decision"
    },
    {
     "id": "D-014",
     "type": "decision"
    },
    {
     "id": "D-015",
     "type": "decision"
    },
    {
     "id": "D-016",
     "type": "decision"
    },
    {
     "id": "D-017",
     "type": "decision"
    },
    {
     "id": "D-018",
     "type": "decision"
    },
    {
     "id": "D-019",
     "type": "decision"
    },
    {
     "id": "INV-001",
     "type": "invariant"
    },
    {
     "id": "INV-002",
     "type": "invariant"
    },
    {
     "id": "INV-003",
     "type": "invariant"
    },
    {
     "id": "INV-004",
     "type": "invariant"
    },
    {
     "id": "INV-005",
     "type": "invariant"
    },
    {
     "id": "INV-006",
     "type": "invariant"
    }
   ],
   "tombstones": []
  },
  {
   "revision": 2,
   "active": [
    {
     "id": "R-001",
     "type": "requirement"
    },
    {
     "id": "R-002",
     "type": "requirement"
    },
    {
     "id": "R-003",
     "type": "requirement"
    },
    {
     "id": "R-004",
     "type": "requirement"
    },
    {
     "id": "R-005",
     "type": "requirement"
    },
    {
     "id": "R-006",
     "type": "requirement"
    },
    {
     "id": "R-007",
     "type": "requirement"
    },
    {
     "id": "R-008",
     "type": "requirement"
    },
    {
     "id": "R-009",
     "type": "requirement"
    },
    {
     "id": "R-010",
     "type": "requirement"
    },
    {
     "id": "R-011",
     "type": "requirement"
    },
    {
     "id": "R-012",
     "type": "requirement"
    },
    {
     "id": "R-013",
     "type": "requirement"
    },
    {
     "id": "R-014",
     "type": "requirement"
    },
    {
     "id": "R-015",
     "type": "requirement"
    },
    {
     "id": "R-016",
     "type": "requirement"
    },
    {
     "id": "R-017",
     "type": "requirement"
    },
    {
     "id": "R-018",
     "type": "requirement"
    },
    {
     "id": "R-019",
     "type": "requirement"
    },
    {
     "id": "R-020",
     "type": "requirement"
    },
    {
     "id": "R-021",
     "type": "requirement"
    },
    {
     "id": "R-022",
     "type": "requirement"
    },
    {
     "id": "R-023",
     "type": "requirement"
    },
    {
     "id": "R-024",
     "type": "requirement"
    },
    {
     "id": "AC-001",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-002",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-003",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-004",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-005",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-006",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-007",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-008",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-009",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-010",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-011",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-012",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-013",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-014",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-015",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-016",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-017",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-018",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-019",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-020",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-021",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-022",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-023",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-024",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-025",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-026",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-027",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-028",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-029",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-030",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-031",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-032",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-033",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-034",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-035",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-036",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-037",
     "type": "acceptance-criterion"
    },
    {
     "id": "AC-038",
     "type": "acceptance-criterion"
    },
    {
     "id": "A-001",
     "type": "assumption"
    },
    {
     "id": "A-002",
     "type": "assumption"
    },
    {
     "id": "A-003",
     "type": "assumption"
    },
    {
     "id": "A-004",
     "type": "assumption"
    },
    {
     "id": "A-005",
     "type": "assumption"
    },
    {
     "id": "A-006",
     "type": "assumption"
    },
    {
     "id": "A-007",
     "type": "assumption"
    },
    {
     "id": "D-001",
     "type": "decision"
    },
    {
     "id": "D-002",
     "type": "decision"
    },
    {
     "id": "D-003",
     "type": "decision"
    },
    {
     "id": "D-004",
     "type": "decision"
    },
    {
     "id": "D-005",
     "type": "decision"
    },
    {
     "id": "D-006",
     "type": "decision"
    },
    {
     "id": "D-007",
     "type": "decision"
    },
    {
     "id": "D-008",
     "type": "decision"
    },
    {
     "id": "D-009",
     "type": "decision"
    },
    {
     "id": "D-010",
     "type": "decision"
    },
    {
     "id": "D-011",
     "type": "decision"
    },
    {
     "id": "D-012",
     "type": "decision"
    },
    {
     "id": "D-013",
     "type": "decision"
    },
    {
     "id": "D-014",
     "type": "decision"
    },
    {
     "id": "D-015",
     "type": "decision"
    },
    {
     "id": "D-016",
     "type": "decision"
    },
    {
     "id": "D-017",
     "type": "decision"
    },
    {
     "id": "D-018",
     "type": "decision"
    },
    {
     "id": "D-019",
     "type": "decision"
    },
    {
     "id": "INV-001",
     "type": "invariant"
    },
    {
     "id": "INV-002",
     "type": "invariant"
    },
    {
     "id": "INV-003",
     "type": "invariant"
    },
    {
     "id": "INV-004",
     "type": "invariant"
    },
    {
     "id": "INV-005",
     "type": "invariant"
    },
    {
     "id": "INV-006",
     "type": "invariant"
    }
   ],
   "tombstones": []
  }
 ]
}
```

</details>
