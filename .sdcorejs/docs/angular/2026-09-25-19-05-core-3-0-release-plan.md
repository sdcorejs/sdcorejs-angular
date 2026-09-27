---
artifact_id: plan-angular-core-3-0-release-20260925-r3-draft
artifact_kind: plan
contract_id: angular-core-3-0-release-20260925
change_ref: angular-core-3-0-release-20260925
owner: sdcorejs-plan
owner_repository_id: sdcorejs-angular
owner_repository_role: library
owner_module_id: null
execution_host_repository_id: portal-onehub
integration_owner_repository_id: sdcorejs-angular
track: angular
stack_profile: core-ui-angular
target_root_kind: target-project
source_spec: .sdcorejs/specs/angular/2026-09-25-18-10-core-3-0-release.md
source_architecture: .sdcorejs/architecture/angular/2026-09-25-18-30-core-3-0-release.md
source_plan: none
commit_policy: with-change
status: draft
approved: false
revision: 3
supersedes: .sdcorejs/plans/angular/2026-09-25-18-45-core-3-0-release.md
---

# Plan — Core UI release 3.0 (revision 3)

> Revision 3 supersede plan r2, chỉ sửa write-scope để khớp execution contract: TASK-001 có action ghi, danh sách cấm cấp plan chỉ còn pattern sạch (mỗi bước trừ TASK-030 cấm thêm `versions/v20-22/**`), TASK-030 có glob cho output sync và `SYNC-STATUS.md`, TASK-028 sở hữu cả hai file generator, repository có cờ available/writable. Nội dung task không đổi.

> Revision 2 supersede plan r1, theo yêu cầu của người dùng: bỏ toàn bộ phần liên quan tới preset omeu (R-012, AC-023, D-013 là tombstone từ decision-coverage revision 5); dark mode chỉ cho preset `default` theo kiến trúc r2. Plan dùng decision-coverage revision 6.

- **Spec đã duyệt:** `.sdcorejs/specs/angular/2026-09-25-18-10-core-3-0-release.md` (`sha256:v1:7282d6236f6e…`).
- **Kiến trúc đã duyệt:** `.sdcorejs/architecture/angular/2026-09-25-18-30-core-3-0-release.md` (`sha256:v1:fc9451fe1391…`).
- **Vai trò của plan:** mô tả cách làm, thứ tự và lệnh chạy. Còn cái gì, vì sao và tiêu chí nghiệm thu nằm ở spec và kiến trúc.

## Scope

Ra release suffix 3.0 (19/20/21/22.3.0) cho `@sdcorejs/angular`, gồm:
- **P1:** export.max, toast, tooltip, bộ lọc HTML editor, guard URL.
- **P2 đã chọn:** bù scrollbar khi khoá scroll, `locale()`, preview video, highlight, virtual scroll opt-in.
- **Hệ token/theme T2–T11:** token chung, dark mode, contrast chạy trong CI, lint chặn hex, migrate hex sang token. Không có preset hay giá trị màu nào liên quan tới omeu.
- **Tooling release:** hỗ trợ suffix `x.0`.

Dừng trước bước cắt release.

## Execution context

- Track: `angular` · Stack profile: `core-ui-angular` · Target root: `C:/wt/core-3.0` (nhánh `release/3.0`, target-project).
- Owner: `sdcorejs-angular` (library). Execution host: `portal-onehub`. Không cập nhật gitlink.
- Coverage: **TDD**. Mỗi task viết spec RED trước, rồi GREEN, rồi refactor.
- Quy mô: 30 task, 9 phase.
- Parallel: **không**. Làm tuần tự theo từng đợt, mỗi đợt xanh mới qua đợt sau. Cùng một worktree dùng chung trạng thái build (`dist` được showcase và một số spec dùng lại). Mỗi file chỉ thuộc một task.
- Toolchain: npm, Node `22.22.3` qua fnm (`fnm use 22.22.3`). v19 và showcase dùng `npm ci --legacy-peer-deps`.
- Không đổi dependency, env hay migration. Không sửa `package-lock.json`.

### Preflight bắt buộc trước khi sửa

1. `git status --short`, staged diffstat, unstaged diffstat, file untracked, branch hiện tại, HEAD.
2. Đối chiếu với `allowed_paths` / `prohibited_paths`. Nếu có file dirty không liên quan thì hỏi: 1) tiếp tục nhưng chỉ sửa file trong plan, 2) cho phép sửa một số file dirty đã chọn, 3) dừng để người dùng dọn trước.
3. Target root là repo đích (không phải authoring repo), nên không có guard cho authoring repo.

### Ghi chú diễn giải

- **INV-001** chỉ áp cho tính năng opt-in (virtual scroll, dark/auto) và các đợt migrate token/literal/hex (không đổi giao diện).
- Các thay đổi hành vi có chủ đích là ngoại lệ đã ghi trong spec và changelog BREAKING: R-001 export.max, R-002 DOM toast, R-003 tooltip khi focus, R-004 bộ lọc editor, R-005 guard URL, R-006 bù scrollbar.
- **Preset:** chỉ preset `default` có dark mode. 8 preset có tên giữ nguyên light; dùng cùng `$mode: dark|auto` thì báo lỗi Sass. Không có preset hay giá trị màu riêng của omeu/OneHub, và tài liệu public không nhắc tới.
- **Coverage approval:** decision-coverage revision 6 được ký duyệt cùng lúc với plan. Bản nháp chỉ gắn một approval tạm trong bộ nhớ để tự kiểm validation map.

## Tasks

### P0 Baseline

**TASK-001 · VERIFY · Preflight, toolchain và baseline**

- Phụ thuộc: không. Bản ghi: R-024, D-004, D-018. Evidence: `EVIDENCE-001`.
- Chạy preflight (git status, staged/unstaged diffstat, untracked, branch, HEAD) trong C:/wt/core-3.0; đối chiếu allowed/prohibited paths.
- fnm use 22.22.3; `npm ci` ở root; `npm ci --legacy-peer-deps` ở versions/v19 và showcase.
- Baseline, ghi lỗi có sẵn vào biên bản baseline, không sửa: v19 `npm run lint`, `npm run build`, `npm run test:ci`; root `npm run test:scripts`, `npm run test:theme`, `npm run check:sync`; showcase `npm run build`.
- Path:
  - CREATE .sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-baseline.md

### P1 A11y và bảo mật

**TASK-002 · EDIT · Key i18n mới cho cả 5 catalog**

- Phụ thuộc: TASK-001. Bản ghi: R-001, R-002, R-008, D-005, D-006, D-011, INV-005. Evidence: `EVIDENCE-002`.
- Thêm key cho cả 5 catalog: `core.component.table.export-max-exceeded` ({max}, {total}); `core.notify.close`; `core.component.preview-video.{error,retry,download,unsupported}`.
- Kiểm: catalog có kiểu compile được; `npm run check:i18n-parity` (v19) qua.
- Path:
  - EDIT LIB/i18n/src/en.ts
  - EDIT LIB/i18n/src/vi.ts
  - EDIT LIB/i18n/src/ja.ts
  - EDIT LIB/i18n/src/ko.ts
  - EDIT LIB/i18n/src/zh.ts

**TASK-003 · CREATE+EDIT · Helper dùng chung trong utilities/extensions**

- Phụ thuộc: TASK-001. Bản ghi: R-004, R-005, R-009, AC-010, AC-011, AC-012, AC-018, D-008, D-025, D-032, D-033, INV-006, INV-003. Evidence: `EVIDENCE-003`.
- RED: bảng cho phép/bị chặn của `sdIsSafeResourceUrl` (D-033); bảng allowlist của `sdSanitizeEditorHtml` (D-032: thẻ, thuộc tính, href/img src/srcset, trả nguyên chuỗi khi sạch, idempotent, không có DOMParser thì escape); bảng của `sdNormalizeSearchText`/`sdFindHighlightRanges` (dấu, đ/Đ, hoa/thường, ký tự đặc biệt regex, surrogate pair, term rỗng); `SdUtilities.download` từ chối URL bị chặn.
- GREEN: hiện thực trong url-safety.ts, editor-html-sanitizer.ts, text-search.ts; guard `SdUtilities.download`; export qua index.ts.
- Docs: extensions.md.
- Path:
  - CREATE LIB/utilities/extensions/src/editor-html-sanitizer.ts
  - CREATE LIB/utilities/extensions/src/editor-html-sanitizer.spec.ts
  - CREATE LIB/utilities/extensions/src/text-search.ts
  - CREATE LIB/utilities/extensions/src/text-search.spec.ts
  - EDIT LIB/utilities/extensions/src/url-safety.ts
  - EDIT LIB/utilities/extensions/src/url-safety.spec.ts
  - EDIT LIB/utilities/extensions/src/utility.extension.ts
  - EDIT LIB/utilities/extensions/src/utility.extension.spec.ts
  - EDIT LIB/utilities/extensions/index.ts
  - EDIT LIB/utilities/extensions/extensions.md

**TASK-004 · EDIT · Áp dụng export.max**

- Phụ thuộc: TASK-002. Bản ghi: R-001, AC-001, AC-002, D-005, INV-005. Evidence: `EVIDENCE-004`.
- RED: số dòng vượt max (tổng server và số dòng local đã lọc) → không ghi file, cảnh báo i18n kèm giới hạn, `exporting` về false; không đặt max hoặc chưa vượt → như cũ.
- GREEN: kiểm max trước khi dựng items.
- Docs: sd-table.md, doc comment của model.
- Path:
  - EDIT LIB/components/table/src/services/table-export/table-export.service.ts
  - EDIT LIB/components/table/src/services/table-export/table-export.service.spec.ts
  - EDIT LIB/components/table/src/models/table-option-export.model.ts
  - EDIT LIB/components/table/sd-table.md

**TASK-005 · EDIT · Live region, tạm dừng khi focus, ngữ nghĩa nút của toast**

- Phụ thuộc: TASK-002, TASK-013. Bản ghi: R-002, AC-003, AC-004, AC-005, D-006, D-027, INV-005. Evidence: `EVIDENCE-005`.
- RED: 2 region cố định (`data-autoid` services-notify-live-polite|assertive); thông báo theo loại; focusin tạm dừng, focusout chạy lại; nút `type="button"`, nút đóng có aria-label i18n.
- GREEN: D-027; sửa selector chết `sd-toast`; migrate toast.component.scss theo token (focus/literal/hex, D-014/D-029/D-031).
- Docs: thêm mục accessibility vào sd-notify.md.
- Path:
  - EDIT LIB/services/notify/src/components/toast-container.component.ts
  - EDIT LIB/services/notify/src/components/toast-container.component.spec.ts
  - EDIT LIB/services/notify/src/components/toast/toast.component.ts
  - EDIT LIB/services/notify/src/components/toast/toast.component.html
  - EDIT LIB/services/notify/src/components/toast/toast.component.scss
  - EDIT LIB/services/notify/src/components/toast/toast.component.spec.ts
  - EDIT LIB/services/notify/src/notify.service.ts
  - EDIT LIB/services/notify/src/notify.service.spec.ts
  - EDIT LIB/services/notify/sd-notify.md

**TASK-006 · EDIT · sd-tooltip đạt WCAG 1.4.13**

- Phụ thuộc: TASK-001. Bản ghi: R-003, AC-006, AC-007, AC-008, D-007, D-034. Evidence: `EVIDENCE-006`.
- RED: focus hiện, blur ẩn; role=tooltip kèm id; describedby chỉ thêm/bỏ id của mình; Escape chỉ chặn lan khi đang hiện; bubble hover được; màu mặc định `var(--sd-tooltip-bg, #616161)`; shadow không còn hex thô.
- GREEN: D-034.
- Docs: sd-tooltip.md (bỏ ghi chú chỉ hover).
- Path:
  - EDIT LIB/directives/src/sd-tooltip.directive.ts
  - EDIT LIB/directives/src/sd-tooltip.directive.spec.ts
  - EDIT LIB/directives/src/sd-tooltip.md

**TASK-007 · EDIT · Guard URL tại các chỗ tải xuống/mở file**

- Phụ thuộc: TASK-003. Bản ghi: R-005, AC-012, D-008, D-033, INV-006. Evidence: `EVIDENCE-007`.
- RED: URL bị chặn không kích hoạt anchor ở preview-image, preview-pdf (component và browser helper), upload-file.
- GREEN: gọi `sdIsSafeResourceUrl` trước khi điều hướng; thay `href="javascript:;"` của upload-file bằng button.
- Docs: sd-upload-file.md (phần docs của preview do TASK-012 đảm nhận).
- Path:
  - EDIT LIB/components/preview/src/preview-image/preview-image.component.ts
  - EDIT LIB/components/preview/src/preview-image/preview-image.component.spec.ts
  - EDIT LIB/components/preview/src/preview-pdf/preview-pdf.component.ts
  - EDIT LIB/components/preview/src/preview-pdf/preview-pdf.browser.ts
  - EDIT LIB/components/preview/src/preview-pdf/preview-pdf.component.spec.ts
  - EDIT LIB/components/upload-file/src/upload-file.component.ts
  - EDIT LIB/components/upload-file/src/upload-file.component.html
  - EDIT LIB/components/upload-file/src/upload-file.component.spec.ts
  - EDIT LIB/components/upload-file/sd-upload-file.md

**TASK-008 · EDIT · Lọc HTML đầu ra của editor/mini-editor**

- Phụ thuộc: TASK-003. Bản ghi: R-004, AC-009, AC-010, D-003, D-032, INV-006. Evidence: `EVIDENCE-008`.
- RED: `link.allowedProtocols` của mini-editor; nội dung không an toàn bị bỏ ở valueChange/sdChange/contentChange/giá trị form/getContent/getHtmlContent; Markdown được lọc trước khi chuyển; ghi ngược một lần kèm dirty.
- GREEN: áp `sdSanitizeEditorHtml` tại đúng các điểm phát theo D-032.
- Docs: sd-editor.md, sd-mini-editor.md.
- Path:
  - EDIT LIB/components/editor/src/editor.component.ts
  - EDIT LIB/components/editor/src/editor.component.spec.ts
  - EDIT LIB/components/editor/sd-editor.md
  - EDIT LIB/components/mini-editor/src/mini-editor.component.ts
  - EDIT LIB/components/mini-editor/src/mini-editor.component.spec.ts
  - EDIT LIB/components/mini-editor/sd-mini-editor.md

### P2 Chọn lọc

**TASK-009 · CREATE+EDIT · Bù độ rộng scrollbar khi khoá scroll**

- Phụ thuộc: TASK-001. Bản ghi: R-006, AC-013, D-009. Evidence: `EVIDENCE-009`.
- RED: padding-right tăng đúng độ rộng scrollbar một lần; trả lại khi lần khoá cuối giải phóng; khoá chồng nhau; scrollbar rộng 0; chế độ container không đổi.
- GREEN: chụp và trả lại padding-right inline.
- Docs: sd-side-drawer.md.
- Path:
  - CREATE LIB/components/side-drawer/src/body-scroll-lock.service.spec.ts
  - EDIT LIB/components/side-drawer/src/body-scroll-lock.service.ts
  - EDIT LIB/components/side-drawer/sd-side-drawer.md

**TASK-010 · EDIT · I18nService.locale và bỏ vi-VN**

- Phụ thuộc: TASK-001. Bản ghi: R-007, AC-014, D-010, INV-005. Evidence: `EVIDENCE-010`.
- RED: `locale()` đúng theo từng ngôn ngữ (kể cả custom catalog); message min/max của date/datetime định dạng theo locale.
- GREEN: signal `locale` với một bảng map duy nhất; thay vi-VN hardcode (riêng file-explorer utils do TASK-012 làm).
- Docs: i18n.md, sd-query-bar.md, sd-inline-text.md.

<details><summary>14 path (repo sdcorejs-angular)</summary>

- EDIT LIB/i18n/src/i18n.service.ts
- EDIT LIB/i18n/src/i18n.service.spec.ts
- EDIT LIB/i18n/i18n.md
- EDIT LIB/forms/date/src/date.component.ts
- EDIT LIB/forms/date/src/date.component.spec.ts
- EDIT LIB/forms/datetime/src/datetime.component.ts
- EDIT LIB/forms/datetime/src/datetime.component.spec.ts
- EDIT LIB/modules/layout/modules/forbidden/pages/root/root.component.ts
- EDIT LIB/modules/layout/modules/not-found/pages/root/root.component.ts
- EDIT LIB/modules/layout/modules/home/components/home-page/home-page.component.ts
- EDIT LIB/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.ts
- EDIT LIB/components/query-bar/sd-query-bar.md
- EDIT LIB/forms/inline-text/src/inline-text.component.ts
- EDIT LIB/forms/inline-text/sd-inline-text.md

</details>

**TASK-011 · CREATE+EDIT · Entry point sd-highlight**

- Phụ thuộc: TASK-003. Bản ghi: R-009, AC-019, D-012, D-025, INV-006. Evidence: `EVIDENCE-011`.
- RED: render `<mark>` qua text node; markup HTML hiện dạng text, không được parse.
- GREEN: entry `components/highlight` (standalone, OnPush); export qua components/index.ts.
- Showcase: trang demo highlight (đăng ký do TASK-028).
- Path:
  - CREATE LIB/components/highlight/ng-package.json
  - CREATE LIB/components/highlight/index.ts
  - CREATE LIB/components/highlight/sd-highlight.md
  - CREATE LIB/components/highlight/src/highlight.component.ts
  - CREATE LIB/components/highlight/src/highlight.component.spec.ts
  - CREATE showcase/src/app/pages/components/highlight/highlight-demo.component.ts
  - EDIT LIB/components/index.ts

**TASK-012 · CREATE+EDIT · sd-preview-video và tích hợp file-explorer**

- Phụ thuộc: TASK-002, TASK-003, TASK-007, TASK-010. Bản ghi: R-008, R-007, AC-015, AC-016, AC-017, AC-014, D-011, D-010, INV-005, INV-006. Evidence: `EVIDENCE-012`.
- RED: spec component video (URL, Blob, poster, revoke object URL khi destroy, lỗi media có i18n và nút thử lại, tải xuống qua guard, autoId, không autoplay); file-explorer render video bằng component; locale của file-explorer lấy từ `I18nService.locale`.
- GREEN: component preview-video; export từ index.ts; PreviewKind video trong utils/view-model/preview-panel (import lười).
- Docs và showcase: mục video trong sd-preview.md (kèm ghi chú guard tải xuống, bỏ mục pdf bị lặp); thêm mục video vào preview demo.

<details><summary>13 path (repo sdcorejs-angular)</summary>

- CREATE LIB/components/preview/src/preview-video/preview-video.component.ts
- CREATE LIB/components/preview/src/preview-video/preview-video.component.html
- CREATE LIB/components/preview/src/preview-video/preview-video.component.scss
- CREATE LIB/components/preview/src/preview-video/preview-video.component.spec.ts
- EDIT LIB/components/preview/index.ts
- EDIT LIB/components/preview/sd-preview.md
- EDIT LIB/components/file-explorer/src/file-explorer.utils.ts
- EDIT LIB/components/file-explorer/src/file-explorer.utils.spec.ts
- EDIT LIB/components/file-explorer/src/file-explorer.view-model.ts
- EDIT LIB/components/file-explorer/src/components/preview-panel.component.ts
- EDIT LIB/components/file-explorer/src/file-explorer.component.spec.ts
- EDIT LIB/components/file-explorer/sd-file-explorer.md
- EDIT showcase/src/app/pages/components/preview/preview-demo.component.ts

</details>

### T Nền token

**TASK-013 · CREATE+EDIT · Engine theme và catalog token (light, dark)**

- Phụ thuộc: TASK-001. Bản ghi: R-013, R-014, R-015, R-016, R-017, R-019, AC-025, AC-027, AC-028, D-002, D-015, D-020, D-021, D-022, D-023, D-024, D-029, INV-001, INV-004, INV-008. Evidence: `EVIDENCE-013`.
- RED (core-theme.test.mjs): mọi khai báo của 2.15 giữ nguyên, chỉ thêm (VAL-001); tier mới được phát; ramp 7×11; `-light/-dark/-contrast` không đổi; biến form-field nằm trong `theme()`; dark ⊇ light (VAL-002); selector auto; color-scheme theo scope; preset có tên dùng `$mode: dark|auto` thì báo `@error` hướng dẫn truyền map dark qua `$theme`; override `$theme` áp lên palette dark của default; token component đủ cả light lẫn dark.
- GREEN: tạo các partial; `theme($mode)`; block `[data-sd-theme]` trong sd-core; Material dark chỉ gọi phần color (D-024); catalog token component dựng từ báo cáo hex quét được (light = hex cũ, dark tường minh).
- Path:
  - CREATE LIB/assets/scss/themes/_scales.scss
  - CREATE LIB/assets/scss/themes/_semantic.scss
  - CREATE LIB/assets/scss/themes/_ramps.scss
  - CREATE LIB/assets/scss/themes/_component-tokens.scss
  - EDIT LIB/assets/scss/themes/default.scss
  - EDIT LIB/assets/scss/themes/_presets.scss
  - EDIT LIB/assets/scss/themes/material-theme.scss
  - EDIT LIB/assets/scss/sd-core.scss
  - EDIT LIB/assets/scss/core/color.scss
  - EDIT scripts/core-theme.test.mjs

**TASK-014 · CREATE · Test ma trận contrast**

- Phụ thuộc: TASK-013. Bản ghi: R-020, AC-031, D-022, INV-008. Evidence: `EVIDENCE-014`.
- RED/GREEN: cặp contrast cho default và preset có sẵn (light), default (dark) (text, text-secondary, border-strong, focus ring ≥ 3:1, status fg/bg, link); cặp bị hạ dưới ngưỡng thì fail (fixture).
- Path:
  - CREATE scripts/theme-contrast.test.mjs

**TASK-015 · CREATE+EDIT · Entry @sdcorejs/angular/utilities/theme**

- Phụ thuộc: TASK-013. Bản ghi: R-021, AC-032, D-017, INV-004. Evidence: `EVIDENCE-015`.
- RED: `readSdTokens` trả giá trị trong browser và `{}` khi không có document; `SD_COLOR_TOKENS` khớp danh sách SCSS (node test).
- GREEN: entry utilities/theme; re-export từ utilities/index.ts.
- Path:
  - CREATE LIB/utilities/theme/ng-package.json
  - CREATE LIB/utilities/theme/index.ts
  - CREATE LIB/utilities/theme/theme.md
  - CREATE LIB/utilities/theme/src/theme-tokens.ts
  - CREATE LIB/utilities/theme/src/theme-tokens.spec.ts
  - CREATE scripts/theme-token-list.test.mjs
  - EDIT LIB/utilities/index.ts

**TASK-016 · CREATE · Script quét token (report mode)**

- Phụ thuộc: TASK-013. Bản ghi: R-018, AC-029, D-016, INV-007, INV-003. Evidence: `EVIDENCE-016`.
- RED/GREEN: fixture: hex cài sẵn trong fixture bị báo; fallback var(), themes/**, *.generated.ts và input-color được miễn; focus outline không dùng token bị báo; heuristic hex màu trong TS giống rule ESLint; có `--report --path <khu vực>` để các task migrate làm RED/GREEN. Chưa nối vào CI.
- Path:
  - CREATE scripts/check-scss-hex.mjs
  - CREATE scripts/check-scss-hex.test.mjs

### T Migrate

**TASK-017 · EDIT · Migrate token: components a–i**

- Phụ thuộc: TASK-013, TASK-016. Bản ghi: R-013, R-015, R-019, AC-024, AC-026, AC-030, D-014, D-029, D-031, INV-001, INV-004, INV-007. Evidence: `EVIDENCE-017`.
- RED: `node scripts/check-scss-hex.mjs --report --path components (a–i)` liệt kê vi phạm (hex thô, focus outline không dùng token, literal khớp scale).
- GREEN: D-031 cho focus outline; D-014 thay literal khớp tuyệt đối (radius, z-index, motion, chữ; spacing để sau); D-014/D-029 đổi hex sang token semantic/ramp hoặc token component đã có trong catalog; `:host` chỉ còn alias.
- Kiểm: report của khu vực không còn vi phạm; `npm run test:theme` xanh; spec của component trong khu vực xanh.

<details><summary>45 path (repo sdcorejs-angular)</summary>

- EDIT LIB/components/anchor/src/components/anchor-nav/anchor-nav.component.scss
- EDIT LIB/components/api-contract-builder/src/api-contract-builder.component.scss
- EDIT LIB/components/api-contract-builder/src/components/api-contract-node-editor.component.scss
- EDIT LIB/components/audit-diff/src/audit-diff.component.scss
- EDIT LIB/components/autoid-inspector/src/autoid-inspector.component.scss
- EDIT LIB/components/avatar/src/avatar.component.scss
- EDIT LIB/components/avatar/src/avatar.component.ts
- EDIT LIB/components/badge/src/badge.component.scss
- EDIT LIB/components/breadcrumb/src/breadcrumb.component.scss
- EDIT LIB/components/button/src/action-popover.scss
- EDIT LIB/components/button/src/button.component.scss
- EDIT LIB/components/card/src/card.component.scss
- EDIT LIB/components/code-editor/src/code-editor.component.scss
- EDIT LIB/components/data-state/src/data-state.component.scss
- EDIT LIB/components/editor/src/editor.component.scss
- EDIT LIB/components/editor/src/plugins/image-upload/image-upload.plugin.scss
- EDIT LIB/components/file-explorer/src/components/folder-tree.component.scss
- EDIT LIB/components/file-explorer/src/components/item-list.component.scss
- EDIT LIB/components/file-explorer/src/components/preview-panel.component.scss
- EDIT LIB/components/file-explorer/src/components/transfer-panel.component.scss
- EDIT LIB/components/file-explorer/src/file-explorer.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/checkbox/control/checkbox-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/chip-calendar/control/chip-calendar-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/chip-string/control/chip-string-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/datetime/control/datetime-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/group/attribute/group-attribute.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/html/control/html-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/number/control/number-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/radio/control/radio-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/select/control/select-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/table/control/table-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/textarea/control/textarea-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/textfield/control/textfield-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/components/upload/control/upload-control.component.scss
- EDIT LIB/components/form-generic/src/components/form-builder/form-builder.component.scss
- EDIT LIB/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss
- EDIT LIB/components/form-generic/src/pipes/expression-view.pipe.ts
- EDIT LIB/components/history/src/history.component.scss

</details>

**TASK-018 · EDIT · Migrate token: components j–z (trừ table)**

- Phụ thuộc: TASK-013, TASK-016. Bản ghi: R-013, R-015, R-019, AC-024, AC-026, AC-030, D-014, D-029, D-031, INV-001, INV-004, INV-007. Evidence: `EVIDENCE-018`.
- RED: `node scripts/check-scss-hex.mjs --report --path components (j–z)` liệt kê vi phạm (hex thô, focus outline không dùng token, literal khớp scale).
- GREEN: D-031 cho focus outline; D-014 thay literal khớp tuyệt đối (radius, z-index, motion, chữ; spacing để sau); D-014/D-029 đổi hex sang token semantic/ramp hoặc token component đã có trong catalog; `:host` chỉ còn alias.
- Kiểm: report của khu vực không còn vi phạm; `npm run test:theme` xanh; spec của component trong khu vực xanh.

<details><summary>34 path (repo sdcorejs-angular)</summary>

- EDIT LIB/components/import-excel/src/import-excel.component.scss
- EDIT LIB/components/inform/src/inform.component.scss
- EDIT LIB/components/job-progress/src/job-progress.component.scss
- EDIT LIB/components/mini-editor/src/mini-editor.component.scss
- EDIT LIB/components/modal-resizable/src/modal-resizable.component.scss
- EDIT LIB/components/modal/src/modal.component.scss
- EDIT LIB/components/operator/src/operator.component.scss
- EDIT LIB/components/org-chart/src/org-chart.component.scss
- EDIT LIB/components/preview/src/preview-image/preview-image.component.scss
- EDIT LIB/components/preview/src/preview-pdf/preview-pdf.component.scss
- EDIT LIB/components/query-bar/src/components/actions-bar/actions-bar.component.scss
- EDIT LIB/components/query-bar/src/components/build-chip/build-chip.component.scss
- EDIT LIB/components/query-bar/src/components/chip-popover/chip-popover.component.scss
- EDIT LIB/components/query-bar/src/components/field-picker/field-picker.component.scss
- EDIT LIB/components/query-bar/src/components/inline-chip/inline-chip.component.scss
- EDIT LIB/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.scss
- EDIT LIB/components/query-bar/src/components/popover-chip/popover-chip.component.scss
- EDIT LIB/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.scss
- EDIT LIB/components/query-bar/src/query-bar.component.scss
- EDIT LIB/components/query-bar/src/query-bar.controls.scss
- EDIT LIB/components/query-builder/src/query-builder.component.scss
- EDIT LIB/components/quick-action/src/quick-action.component.scss
- EDIT LIB/components/section/src/section-item/section-item.component.scss
- EDIT LIB/components/section/src/section.component.scss
- EDIT LIB/components/side-drawer/src/side-drawer.component.scss
- EDIT LIB/components/splitter/src/splitter-handle/splitter-handle.component.scss
- EDIT LIB/components/splitter/src/splitter-panel/splitter-panel.component.scss
- EDIT LIB/components/stepper/src/stepper.component.scss
- EDIT LIB/components/tab-router/src/components/tab-router-item/tab-router-item.component.scss
- EDIT LIB/components/tab-router/src/components/tab-router-nav/tab-router-nav.component.scss
- EDIT LIB/components/tab/src/tab-group.component.scss
- EDIT LIB/components/tree/src/tree.component.scss
- EDIT LIB/components/upload-file/src/components/preview/preview.component.scss
- EDIT LIB/components/upload-file/src/upload-file.component.scss

</details>

**TASK-019 · EDIT · Migrate token: components/table**

- Phụ thuộc: TASK-013, TASK-016. Bản ghi: R-013, R-015, R-019, AC-024, AC-026, AC-030, D-014, D-029, D-031, INV-001, INV-004, INV-007. Evidence: `EVIDENCE-019`.
- RED: `node scripts/check-scss-hex.mjs --report --path components/table` liệt kê vi phạm (hex thô, focus outline không dùng token, literal khớp scale).
- GREEN: D-031 cho focus outline; D-014 thay literal khớp tuyệt đối (radius, z-index, motion, chữ; spacing để sau); D-014/D-029 đổi hex sang token semantic/ramp hoặc token component đã có trong catalog; `:host` chỉ còn alias.
- Kiểm: report của khu vực không còn vi phạm; `npm run test:theme` xanh; spec của component trong khu vực xanh.
- Path:
  - EDIT LIB/components/table/src/components/command/desktop-command.component.scss
  - EDIT LIB/components/table/src/components/config/config.component.scss
  - EDIT LIB/components/table/src/components/desktop-cell/desktop-cell.component.scss
  - EDIT LIB/components/table/src/components/desktop-cell/view/view.component.scss
  - EDIT LIB/components/table/src/components/filter/column-filter/column-filter.component.scss
  - EDIT LIB/components/table/src/components/filter/quick-search/quick-search.component.scss
  - EDIT LIB/components/table/src/components/mobile-cards/mobile-actions.component.scss
  - EDIT LIB/components/table/src/components/mobile-cards/mobile-cards.component.scss
  - EDIT LIB/components/table/src/components/popup-export/popup-export.component.scss
  - EDIT LIB/components/table/src/components/selector-action/selector-action.component.scss
  - EDIT LIB/components/table/src/table.component.scss

**TASK-020 · EDIT · Migrate token: forms (trừ select/autocomplete)**

- Phụ thuộc: TASK-013, TASK-016. Bản ghi: R-013, R-015, R-019, AC-024, AC-026, AC-030, D-014, D-029, D-031, INV-001, INV-004, INV-007. Evidence: `EVIDENCE-020`.
- RED: `node scripts/check-scss-hex.mjs --report --path forms` liệt kê vi phạm (hex thô, focus outline không dùng token, literal khớp scale).
- GREEN: D-031 cho focus outline; D-014 thay literal khớp tuyệt đối (radius, z-index, motion, chữ; spacing để sau); D-014/D-029 đổi hex sang token semantic/ramp hoặc token component đã có trong catalog; `:host` chỉ còn alias.
- Kiểm: report của khu vực không còn vi phạm; `npm run test:theme` xanh; spec của component trong khu vực xanh.
- Path:
  - EDIT LIB/forms/chip-calendar/src/chip-calendar.component.scss
  - EDIT LIB/forms/chip/src/chip.component.scss
  - EDIT LIB/forms/date-range/src/date-range.component.scss
  - EDIT LIB/forms/entity-picker/src/entity-picker.component.scss
  - EDIT LIB/forms/inline-text/src/inline-text.component.scss
  - EDIT LIB/forms/input-color/src/input-color.component.scss
  - EDIT LIB/forms/input-number/src/input-number.component.scss
  - EDIT LIB/forms/input/src/input.component.scss
  - EDIT LIB/forms/textarea/src/textarea.component.scss
  - EDIT LIB/forms/time-range/src/time-range.component.scss

**TASK-021 · EDIT · Migrate token: modules, services, directives, assets/core**

- Phụ thuộc: TASK-013, TASK-016. Bản ghi: R-013, R-015, R-019, AC-024, AC-026, AC-030, D-014, D-029, D-031, INV-001, INV-004, INV-007. Evidence: `EVIDENCE-021`.
- RED: `node scripts/check-scss-hex.mjs --report --path modules|services|directives|assets/scss/core` liệt kê vi phạm (hex thô, focus outline không dùng token, literal khớp scale).
- GREEN: D-031 cho focus outline; D-014 thay literal khớp tuyệt đối (radius, z-index, motion, chữ; spacing để sau); D-014/D-029 đổi hex sang token semantic/ramp hoặc token component đã có trong catalog; `:host` chỉ còn alias.
- Kiểm: report của khu vực không còn vi phạm; `npm run test:theme` xanh; spec của component trong khu vực xanh.

<details><summary>29 path (repo sdcorejs-angular)</summary>

- EDIT LIB/assets/fonts/fonts.scss
- EDIT LIB/assets/scss/ckeditor5.scss
- EDIT LIB/assets/scss/core/_inline-edit.scss
- EDIT LIB/assets/scss/core/_read-state-panel.scss
- EDIT LIB/assets/scss/core/form.scss
- EDIT LIB/assets/scss/core/scrollbar.scss
- EDIT LIB/assets/scss/core/utilities/_base.scss
- EDIT LIB/assets/scss/core/utilities/_border.scss
- EDIT LIB/assets/scss/core/utilities/_typography.scss
- EDIT LIB/directives/src/sd-hover-copy.directive.ts
- EDIT LIB/modules/layout/components/page/page.component.scss
- EDIT LIB/modules/layout/components/shared/menu-tree/menu-tree.component.scss
- EDIT LIB/modules/layout/components/shared/search-field/search-field.component.scss
- EDIT LIB/modules/layout/components/shared/user-menu/user-menu.component.scss
- EDIT LIB/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss
- EDIT LIB/modules/layout/components/sidebar-mobile-v1/components/user/user.component.scss
- EDIT LIB/modules/layout/components/sidebar-mobile-v1/main.component.scss
- EDIT LIB/modules/layout/components/sidebar-mobile-v2/main.component.scss
- EDIT LIB/modules/layout/components/sidebar-mobile-v3/main.component.scss
- EDIT LIB/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss
- EDIT LIB/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts
- EDIT LIB/modules/layout/components/sidebar-v1/components/user/user.component.scss
- EDIT LIB/modules/layout/components/sidebar-v1/main.component.scss
- EDIT LIB/modules/layout/components/sidebar-v2/main.component.scss
- EDIT LIB/modules/layout/components/sidebar-v3/main.component.scss
- EDIT LIB/modules/layout/modules/home/components/home-page/home-page.component.scss
- EDIT LIB/modules/layout/pipes/high-light-search.pipe.ts
- EDIT LIB/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss
- EDIT LIB/services/loading/src/loading.service.ts

</details>

**TASK-022 · EDIT · Rule ESLint hex cho TS/template**

- Phụ thuộc: TASK-006, TASK-017, TASK-018, TASK-019, TASK-020, TASK-021. Bản ghi: R-018, AC-029, D-016, INV-007. Evidence: `EVIDENCE-022`.
- RED: fixture lint (chạy trong check-scss-hex.test.mjs qua ESLint của v19) báo hex màu trong TS/template, miễn var() fallback, *.generated.ts, input-color.
- GREEN: thêm rule `no-restricted-syntax` với heuristic giống scanner; `npm run lint` (v19) qua trên repo.
- Path:
  - EDIT versions/v19/eslint.config.js

**TASK-023 · EDIT · Nối CI (scripts, workflow)**

- Phụ thuộc: TASK-014, TASK-015, TASK-016, TASK-022. Bản ghi: R-018, R-020, AC-029, AC-031, D-016, INV-003, INV-007, INV-008. Evidence: `EVIDENCE-023`.
- package.json: `test:theme` chạy core-theme + theme-contrast; thêm `check:scss-hex`, `test:check-scss-hex`, `test:theme-token-list`; `test:scripts` bao gồm test:theme và các test mới.
- ci.yml: job scripts dùng Node 22.22.3, cài versions/v19 (`npm ci --legacy-peer-deps`) trước `npm run test:scripts`, chạy `npm run check:scss-hex`. Không thêm dependency.
- Path:
  - EDIT package.json
  - EDIT .github/workflows/ci.yml

### V Virtual scroll

**TASK-024 · CREATE+EDIT · Virtual scroll cho sd-select (spike + rollout)**

- Phụ thuộc: TASK-013. Bản ghi: R-010, R-011, AC-020, AC-021, D-001, D-026, D-030, INV-001, INV-003. Evidence: `EVIDENCE-024`.
- Spike RED (10.000 item): render có giới hạn cả sau select-all; End/PageDown/typeahead tới item cuối; multi giữ giá trị ngoài viewport; trigger đủ nhãn. Probe cho autocomplete: phím mũi tên tới mọi item, chọn đúng giá trị.
- Cổng D-030: làm V1 (vỏ Material + sentinel + value do component sở hữu). Nếu probe fail thì chuyển V2 (listbox tự viết). Ghi phương án đã chọn vào evidence. Cả hai đều fail thì dừng và quay lại change control.
- Rollout: mặc định tắt thì y như cũ; không cắt theo `limit`; kết quả SdSearch; thứ tự giữ nguyên; migrate select.component.scss theo token; docs sd-select.md; mục demo virtual trong select demo.
- Path:
  - CREATE LIB/forms/select/src/select.virtual-scroll.spec.ts
  - CREATE LIB/forms/autocomplete/src/autocomplete.virtual-scroll.spec.ts
  - EDIT LIB/forms/select/src/select.component.ts
  - EDIT LIB/forms/select/src/select.component.html
  - EDIT LIB/forms/select/src/select.component.scss
  - EDIT LIB/forms/select/src/select.component.spec.ts
  - EDIT LIB/forms/select/sd-select.md
  - EDIT showcase/src/app/pages/forms/select/select-demo.component.ts

**TASK-025 · EDIT · Virtual scroll cho sd-autocomplete**

- Phụ thuộc: TASK-024. Bản ghi: R-011, AC-022, D-001, D-026, INV-001. Evidence: `EVIDENCE-025`.
- RED: mặc định tắt thì y như cũ; khi virtual thì bàn phím, typeahead, chọn giá trị đúng; probe của TASK-024 cho autocomplete chuyển xanh.
- GREEN: D-026 theo phương án D-030 đã chọn; migrate autocomplete.component.scss theo token; docs sd-autocomplete.md; mục demo.
- Path:
  - EDIT LIB/forms/autocomplete/src/autocomplete.component.ts
  - EDIT LIB/forms/autocomplete/src/autocomplete.component.html
  - EDIT LIB/forms/autocomplete/src/autocomplete.component.scss
  - EDIT LIB/forms/autocomplete/src/autocomplete.component.spec.ts
  - EDIT LIB/forms/autocomplete/sd-autocomplete.md
  - EDIT showcase/src/app/pages/forms/autocomplete/autocomplete-demo.component.ts

### R Release tooling

**TASK-026 · EDIT · Suffix x.0 với baseline tường minh**

- Phụ thuộc: TASK-001. Bản ghi: R-023, AC-035, D-019, D-028, INV-002. Evidence: `EVIDENCE-026`.
- RED: `releaseTargets("3.0", { baselineSuffix: "2.15" })` ra 19/20/21/22.3.0 với baseline `*.2.15`; x.0 không kèm baseline bị từ chối; `loadReleaseContract` đọc `baselineSuffix`; test 2.x giữ nguyên; case 3.0 cho showcase-changelog, retention của published-page, collect-docs.
- GREEN: D-028 trong release-package-contract.mjs và `deploy.ps1 -BaselineSuffix`; ghi chú x.0 vào AGENTS.md/CLAUDE.md. Không sửa `publish-npm.yml`, không tạo `3.0.json`.
- Path:
  - EDIT scripts/release-package-contract.mjs
  - EDIT scripts/release-package-contract.test.mjs
  - EDIT scripts/deploy.ps1
  - EDIT scripts/generate-showcase-changelog.test.mjs
  - EDIT scripts/build-published-page.test.mjs
  - EDIT scripts/collect-docs.test.mjs
  - EDIT AGENTS.md
  - EDIT CLAUDE.md

### D Docs và showcase

**TASK-027 · CREATE+EDIT · Hướng dẫn Theme & tokens và STYLE-GUIDE**

- Phụ thuộc: TASK-013, TASK-015, TASK-021. Bản ghi: R-022, AC-034, D-020, D-023. Evidence: `EVIDENCE-027`.
- THEME.md: các tier, cách đặt tên, mode, cách consumer include lại theme riêng ở dark, cách tự thêm preset hoặc bản dark qua `$theme` (preset có tên chỉ có light), contrast, miễn trừ, hook focus. Tài liệu public không nhắc tới omeu/OneHub.
- Trang showcase dạng guide: swatch, ramp, scale, bảng contrast theo preset/dark, nút bật dark; cập nhật STYLE-GUIDE §3/§14.
- Path:
  - CREATE LIB/assets/THEME.md
  - CREATE showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts
  - EDIT LIB/assets/STYLE-GUIDE.md

**TASK-028 · EDIT · Đăng ký trang showcase và manifest**

- Phụ thuộc: TASK-011, TASK-012, TASK-024, TASK-025, TASK-027. Bản ghi: R-022, R-008, R-009, AC-033, D-012. Evidence: `EVIDENCE-028`.
- Đăng ký trang highlight (components) và theme-tokens (guides); cập nhật số đếm page/section trong registry spec; chạy `npm run generate:showcase-examples` (root) để sinh lại manifest.
- Kiểm: `npm run test -- --include=src/app/docs/core/documentation.registry.spec.ts` (showcase), `npm run test:showcase-examples` (root).
- Path:
  - EDIT showcase/src/app/docs/core/documentation.registry.ts
  - EDIT showcase/src/app/docs/core/documentation.registry.spec.ts
  - EDIT showcase/src/app/docs/generated/example-manifest.generated.ts
  - EDIT showcase/src/app/docs/generated/example-sources.generated.ts

**TASK-029 · EDIT · CHANGELOG và npm README**

- Phụ thuộc: TASK-004, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-010, TASK-012, TASK-023, TASK-025, TASK-026, TASK-028. Bản ghi: R-024, AC-036, D-004, INV-002. Evidence: `EVIDENCE-029`.
- CHANGELOG `[Unreleased]`: Added/Changed/Fixed và mục `Changed (BREAKING for consumers)` kèm migration diff (export.max, bộ lọc HTML editor, guard URL, DOM tooltip/toast).
- README.npm.md: phần theme và i18n; chép byte-identical sang README package của v19.
- Path:
  - EDIT CHANGELOG.md
  - EDIT README.npm.md
  - EDIT LIB/README.md

### Z Sync và kiểm chứng

**TASK-030 · VERIFY+GENERATE · Sync rollout và kiểm chứng toàn bộ**

- Phụ thuộc: TASK-029. Bản ghi: R-024, AC-036, AC-037, AC-038, D-004, D-018, D-035, INV-002, INV-003, INV-005. Evidence: `EVIDENCE-030`.
- `npm run sync` → review diff sinh ra ở v20/v21/v22; `npm run check:sync`.
- v19: `npm run lint`, `npm run build`, `npm run test:ci`, `npm run check:i18n-parity`, `npm run check:i18n`. Root: `npm run test:scripts`, `npm run test:theme`, `npm run check:scss-hex`. Showcase: `npm run build`, `npm run test`. Quét mojibake trên text đã sửa; diff dependency (không có dòng thêm).
- Ghi biên bản kiểm chứng; dừng trước bước cắt release (không đổi CHANGELOG sang [3.0], không pin workflow, không tag).
- Path:
  - CREATE .sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-verification.md
  - EDIT versions/v20/projects/sdcorejs-angular
  - EDIT versions/v21/projects/sdcorejs-angular
  - EDIT versions/v22/projects/sdcorejs-angular
  - EDIT versions/v20/SYNC-STATUS.md
  - EDIT versions/v21/SYNC-STATUS.md
  - EDIT versions/v22/SYNC-STATUS.md

## Acceptance mapping

| AC | Task | Lệnh kiểm (validation map) | cwd |
|---|---|---|---|
| AC-001 | TASK-004 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/components/table/src/services/table-export/table-export.service.spec.ts` | versions/v19 |
| AC-002 | TASK-004 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/components/table/src/services/table-export/table-export.service.spec.ts --include=…/components/table/src/table.component.spec.ts` | versions/v19 |
| AC-003 | TASK-005 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/services/notify/src/components/toast-container.component.spec.ts --include=…/services/notify/src/notify.service.spec.ts` | versions/v19 |
| AC-004 | TASK-005 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/services/notify/src/components/toast/toast.component.spec.ts` | versions/v19 |
| AC-005 | TASK-005 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/services/notify/src/components/toast/toast.component.spec.ts` | versions/v19 |
| AC-006 | TASK-006 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/directives/src/sd-tooltip.directive.spec.ts` | versions/v19 |
| AC-007 | TASK-006 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/directives/src/sd-tooltip.directive.spec.ts` | versions/v19 |
| AC-008 | TASK-006 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/directives/src/sd-tooltip.directive.spec.ts` | versions/v19 |
| AC-009 | TASK-008 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/components/mini-editor/src/mini-editor.component.spec.ts` | versions/v19 |
| AC-010 | TASK-003, TASK-008 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/utilities/extensions/src/editor-html-sanitizer.spec.ts --include=…/components/editor/src/editor.component.spec.ts --include=…/components/mini-editor/src/mini-editor.component.spec.ts` | versions/v19 |
| AC-011 | TASK-003 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/utilities/extensions/src/url-safety.spec.ts` | versions/v19 |
| AC-012 | TASK-003, TASK-007 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/utilities/extensions/src/utility.extension.spec.ts --include=…/components/preview/src/preview-image/preview-image.component.spec.ts --include=…/components/preview/src/preview-pdf/preview-pdf.component.spec.ts --include=…/components/upload-file/src/upload-file.component.spec.ts` | versions/v19 |
| AC-013 | TASK-009 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/components/side-drawer/src/body-scroll-lock.service.spec.ts --include=…/components/side-drawer/src/side-drawer.component.spec.ts` | versions/v19 |
| AC-014 | TASK-010, TASK-012 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/i18n/src/i18n.service.spec.ts --include=…/forms/date/src/date.component.spec.ts --include=…/forms/datetime/src/datetime.component.spec.ts --include=…/components/file-explorer/src/file-explorer.utils.spec.ts` | versions/v19 |
| AC-015 | TASK-012 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/components/preview/src/preview-video/preview-video.component.spec.ts` | versions/v19 |
| AC-016 | TASK-012 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/components/file-explorer/src/file-explorer.component.spec.ts` | versions/v19 |
| AC-017 | TASK-012 | manual (user) | showcase |
| AC-018 | TASK-003 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/utilities/extensions/src/text-search.spec.ts` | versions/v19 |
| AC-019 | TASK-011 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/components/highlight/src/highlight.component.spec.ts` | versions/v19 |
| AC-020 | TASK-024 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/forms/select/src/select.component.spec.ts` | versions/v19 |
| AC-021 | TASK-024 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/forms/select/src/select.virtual-scroll.spec.ts` | versions/v19 |
| AC-022 | TASK-025 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/forms/autocomplete/src/autocomplete.component.spec.ts --include=…/forms/autocomplete/src/autocomplete.virtual-scroll.spec.ts` | versions/v19 |
| AC-024 | TASK-017, TASK-018, TASK-019, TASK-020, TASK-021 | `npm run check:scss-hex` | . |
| AC-025 | TASK-013 | `npm run test:theme` | . |
| AC-026 | TASK-017, TASK-018, TASK-019, TASK-020, TASK-021 | `npm run test:theme` | . |
| AC-027 | TASK-013 | `npm run test:theme` | . |
| AC-028 | TASK-013 | `npm run test:theme` | . |
| AC-029 | TASK-016, TASK-022, TASK-023 | `npm run test:scripts` | . |
| AC-030 | TASK-017, TASK-018, TASK-019, TASK-020, TASK-021 | `npm run check:scss-hex` | . |
| AC-031 | TASK-014, TASK-023 | `npm run test:scripts` | . |
| AC-032 | TASK-015 | `npm test -- --watch=false --browsers=ChromeHeadless --include=…/utilities/theme/src/theme-tokens.spec.ts` | versions/v19 |
| AC-033 | TASK-028 | `npm run test -- --include=src/app/docs/core/documentation.registry.spec.ts` | showcase |
| AC-034 | TASK-027 | manual (user) | showcase |
| AC-035 | TASK-026 | `npm run test:release-package-contract` | . |
| AC-036 | TASK-029, TASK-030 | `npm run check:sync` | . |
| AC-037 | TASK-030 | `npm run test:ci` | versions/v19 |
| AC-038 | TASK-030 | deferred (release owner) | . |

## Verification

- **Sau mỗi task:** chạy spec liên quan theo dạng `npm test -- --watch=false --browsers=ChromeHeadless --include=<spec>` (cwd `versions/v19`), hoặc script node tương ứng ở root.
- **Cuối mỗi đợt:** v19 `npm run test:ci`, `npm run build`, `npm run lint`.
- **Cuối cùng (TASK-030):**
  - `npm run sync`, `npm run check:sync`
  - v19: `npm run lint`, `npm run build`, `npm run test:ci`, `npm run check:i18n-parity`, `npm run check:i18n`
  - Root: `npm run test:scripts`, `npm run test:theme`, `npm run check:scss-hex`
  - Showcase: `npm run build`, `npm run test`
  - Quét mojibake, diff dependency.
- **Kiểm tay:** AC-017 (preview video trong showcase) và AC-034 (trang Theme & tokens ở light và dark), người kiểm là bạn.
- **Để tới bước cắt release:** AC-038 (cài và build v20/v21/v22), `deploy.ps1 -DryRun`, pin `publish-npm.yml`, snapshot `3.0.json`, tag.

## Frontend architecture plan

- Conformance: INV-001, INV-003, INV-005, INV-006, INV-007 (khớp `frontend_architecture_ref` trong kiến trúc đã duyệt).
- Quy ước đang dùng:
  - component_style: Standalone, signals (input/model/output/computed), OnPush, native control flow with @let caching.
  - folder_convention: Each component is a secondary entry point: components/<name>/{ng-package.json,index.ts,src/,sd-<name>.md}.
  - state_convention: Component-local signals; root services for cross-cutting state (I18nService, NotifyService, SdBodyScrollLockService).
  - service_data_access_convention: No data access in this change; pure helpers in utilities/extensions.
  - registration_provider_convention: providedIn root services; no NgModules; standalone imports.
  - public_api_barrel_convention: Entry index.ts plus components/index.ts and utilities/index.ts barrels re-exported by src/public-api.ts.
  - test_convention: Karma/Jasmine colocated *.spec.ts; node:test for scripts; TDD required for components/forms.
- Cây component:
  - sd-highlight (components/highlight) — leaf; renders text and mark segments from sdFindHighlightRanges
  - sd-preview-video (components/preview/src/preview-video) — leaf media viewer; hosted lazily by file-explorer preview-panel
  - toast-container (services/notify) — owns live regions; renders toast children
  - sd-select / sd-autocomplete — existing components gain an opt-in virtual branch (viewport + shell per D-026/D-030)
- Quyết định reuse:
  - URL parsing: extend sdParseUrl/sdResolveBaseOrigin in utilities/extensions/src/url-safety.ts
  - Lazy preview hosting: extend the preview-panel lazy pdf pattern in file-explorer
  - Virtual list: reuse @angular/cdk/scrolling (existing peer)
  - Scroll lock: extend SdBodyScrollLockService (side-drawer)
  - Normalization: shared sdNormalizeSearchText; private helpers in file-explorer/tree stay (deferred)
- Nơi sở hữu state:
  - ToastContainerComponent: Toast announcements (live regions)
  - SdTooltipDirective: Tooltip id inside the host aria-describedby
  - SdBodyScrollLockService: Body scroll lock ref-count and overflow/padding-right snapshot per Document
  - I18nService: Language to BCP-47 locale mapping
  - Consuming application (library never writes it): Theme mode attribute data-sd-theme
  - Component value model (shell never owns the value): Selected values under virtual scrolling
- Ranh giới service:
  - sdIsSafeResourceUrl (pure_function)
  - sdSanitizeEditorHtml (pure_function)
  - sdNormalizeSearchText (pure_function)
  - sdFindHighlightRanges (pure_function)
  - readSdTokens (pure_function)
  - I18nService (app)
  - NotifyService (app)
  - SdBodyScrollLockService (app)
- Luồng dữ liệu:
  - editor data → sdSanitizeEditorHtml → value/events/form
  - file-explorer item → PreviewKind video → sd-preview-video (src guarded by sdIsSafeResourceUrl)
  - NotifyService.show → ToastContainer live region announcement
  - select items → virtual viewport rendering; selection events → component value model
- Đăng ký và export:
  - sd-highlight: standalone, exported from components/highlight/index.ts and components/index.ts
  - sd-preview-video: standalone, exported from components/preview/index.ts
  - utilities/theme: exported from utilities/theme/index.ts and utilities/index.ts
- Export public: SdHighlight, SdPreviewVideo, sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges, readSdTokens, SdColorToken, SD_COLOR_TOKENS, I18nService.locale.
- New components are leaf presentational units with colocated specs, md docs and showcase demos; no facade/store is introduced; virtual scroll stays inside the existing components.

## Write scope

- Allowed: 275 path cụ thể (xem từng task; mỗi path thuộc đúng một task).
- Prohibited: `published-docs/**`, `published-pages/**`, `.github/workflows/publish-npm.yml`, `scripts/release-contracts/**`, `**/package-lock.json`, `**/.env*`, `**/node_modules/**`, `**/dist/**`.
- Generated: `versions/v20/**`, `versions/v21/**`, `versions/v22/**`, `showcase/src/app/docs/generated/example-manifest.generated.ts`.
- Tail: docs xong trước branch-ready; verify-before-done; branch-ready là gate cuối; không ghi file sau branch-ready.

## Self-review

| Kiểm tra | Kết quả |
|---|---|
| `validateDecisionCoverage` (stage plan) | Hợp lệ, 0 gap |
| `validateGoalBackwardPlan` | Sẵn sàng duyệt. Vòng 1 không còn blocker, sau khi sửa: mỗi path một task, bỏ path không có trên origin/main, task baseline có path |
| `validateValidationMap` | Hợp lệ, sẵn sàng duyệt (38 row, boundary `none` qua D-035) |
| `validateArchitectureDraftPlanHandoff` | Hợp lệ; khối `frontend_architecture` khớp conformance |
| `validateRepositoryPlan` | Không lỗi; mọi bước ghi chỉ có một git root |
| Path | Mọi EDIT đều có sẵn, mọi CREATE đều chưa có (kiểm trên worktree) |

## Appendix — plan_context (machine-readable)

<details><summary>plan_context JSON</summary>

```json
{
 "schema_version": 2,
 "source": "sdcorejs-plan",
 "architecture_gate": {
  "valid": true,
  "required": true,
  "status": "required",
  "signals": [
   "conflicting-independent-unit-decisions",
   "public-api-contract",
   "security-trust-boundary"
  ],
  "bypass": null,
  "rationale": "New public entry points and inputs (utilities/theme, sd-highlight, sd-preview-video, virtualScroll, sd.theme $mode, I18nService.locale), security guards on editor HTML and download URLs, and token conventions shared by many independently implemented units."
 },
 "architecture_context": {
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
  "approved_architecture_path": ".sdcorejs/architecture/angular/2026-09-25-18-30-core-3-0-release.md",
  "approved_architecture_hash": "sha256:v1:fc9451fe139114d0439b7ef4468ca650503fb63976003d1209250e8448874f5c",
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
 },
 "decision_coverage": {
  "schema_version": 1,
  "revision": 6,
  "records": [
   {
    "id": "R-001",
    "type": "requirement",
    "statement": "sd-table export honours export.max: when the rows to export exceed max, export does not start and an i18n warning names the limit.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-002",
     "TASK-004"
    ]
   },
   {
    "id": "R-002",
    "type": "requirement",
    "statement": "Toast notifications are announced through persistent polite/assertive live regions, pause auto-dismiss on hover and keyboard focus, and expose typed, labelled buttons.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-002",
     "TASK-005"
    ]
   },
   {
    "id": "R-003",
    "type": "requirement",
    "statement": "sd-tooltip meets WCAG 1.4.13: shows on focus, hides on blur, Escape dismisses, bubble is hoverable, role=tooltip with aria-describedby, token colour.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-006"
    ]
   },
   {
    "id": "R-004",
    "type": "requirement",
    "statement": "sd-mini-editor restricts link protocols and both editors emit HTML filtered of script URLs, non-image data URLs and on* attributes while keeping formatting.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-003",
     "TASK-008"
    ]
   },
   {
    "id": "R-005",
    "type": "requirement",
    "statement": "A shared URL scheme guard blocks unsafe download/open URLs in SdUtilities.download, preview-image, preview-pdf, upload-file and preview-video.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-003",
     "TASK-007"
    ]
   },
   {
    "id": "R-006",
    "type": "requirement",
    "statement": "The side-drawer body scroll lock compensates the scrollbar width with padding-right and restores it on final release, except in container mode.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-009"
    ]
   },
   {
    "id": "R-007",
    "type": "requirement",
    "statement": "I18nService exposes a BCP-47 locale signal; hard-coded vi-VN formatting in library code and the duplicate locale maps are replaced by it.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-010",
     "TASK-012"
    ]
   },
   {
    "id": "R-008",
    "type": "requirement",
    "statement": "A new sd-preview-video component in the preview entry point plays video with error/retry state, is used by the file-explorer detail, and ships md docs plus a showcase demo.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-002",
     "TASK-012",
     "TASK-028"
    ]
   },
   {
    "id": "R-009",
    "type": "requirement",
    "statement": "Diacritic-insensitive helpers sdNormalizeSearchText and sdFindHighlightRanges plus an sd-highlight component render matches safely without innerHTML or regex built from input.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-003",
     "TASK-011",
     "TASK-028"
    ]
   },
   {
    "id": "R-010",
    "type": "requirement",
    "statement": "sd-select supports opt-in virtual scrolling (default off) preserving keyboard navigation, selected display, multi-select values and select-all.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-024"
    ]
   },
   {
    "id": "R-011",
    "type": "requirement",
    "statement": "sd-autocomplete supports opt-in virtual scrolling (default off) preserving keyboard navigation and selection.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-024",
     "TASK-025"
    ]
   },
   {
    "id": "R-013",
    "type": "requirement",
    "statement": "Focus ring tokens exist (colour defaults to var(--sd-primary)); every focus outline colour comes from the shared token, a documented component hook falling back to it, or a component token for always-dark surfaces; no hex remains in focus rules.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-013",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
   },
   {
    "id": "R-014",
    "type": "requirement",
    "statement": "The semantic token layer adds status bg/fg, link, surface-inverse, text-on-solid, border-focus, border-danger and overlay-backdrop tokens.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-013"
    ]
   },
   {
    "id": "R-015",
    "type": "requirement",
    "statement": "Non-colour tokens (space, radius, shadow, z-index, motion, typography) exist as CSS variables and exact-matching literals use them.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-013",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
   },
   {
    "id": "R-016",
    "type": "requirement",
    "statement": "Colour ramps 50-950 are generated at runtime for the main colour families while existing -light/-dark/-contrast values stay unchanged.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-013"
    ]
   },
   {
    "id": "R-017",
    "type": "requirement",
    "statement": "An opt-in dark theme covers Core tokens and Material, scoped by [data-sd-theme=dark], with an auto mode following prefers-color-scheme.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-013"
    ]
   },
   {
    "id": "R-018",
    "type": "requirement",
    "statement": "Hex colour literals are rejected by lint in library TS/templates and by a dependency-free SCSS check, both enforced in CI.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-016",
     "TASK-022",
     "TASK-023"
    ]
   },
   {
    "id": "R-019",
    "type": "requirement",
    "statement": "Raw hex colours in library SCSS and TS outside documented exemptions are replaced by tokens with identical values.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-013",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
   },
   {
    "id": "R-020",
    "type": "requirement",
    "statement": "Theme contrast tests run in CI and cover default, every existing preset and dark mode.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-014",
     "TASK-023"
    ]
   },
   {
    "id": "R-021",
    "type": "requirement",
    "statement": "A new entry point @sdcorejs/angular/utilities/theme exposes readSdTokens and the SdColorToken type.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-015"
    ]
   },
   {
    "id": "R-022",
    "type": "requirement",
    "statement": "A showcase Theme & tokens guide and a published THEME.md document tokens, ramps, contrast and dark mode; the STYLE-GUIDE is updated.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-027",
     "TASK-028"
    ]
   },
   {
    "id": "R-023",
    "type": "requirement",
    "statement": "Release tooling accepts an x.0 suffix with an explicit baseline so 3.0 targets 19.3.0/20.3.0/21.3.0/22.3.0 against *.2.15.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-026"
    ]
   },
   {
    "id": "R-024",
    "type": "requirement",
    "statement": "Docs, changelog (with a BREAKING section and migration), npm README parity and v20-v22 rollout are delivered with the change.",
    "source": "explicit-user",
    "status": "active",
    "owner_repository_id": "sdcorejs-angular",
    "owner_module_id": null,
    "task_refs": [
     "TASK-001",
     "TASK-029",
     "TASK-030"
    ]
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
    "task_refs": [
     "TASK-004"
    ]
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
    "task_refs": [
     "TASK-004"
    ]
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
    "task_refs": [
     "TASK-005"
    ]
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
    "task_refs": [
     "TASK-005"
    ]
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
    "task_refs": [
     "TASK-005"
    ]
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
    "task_refs": [
     "TASK-006"
    ]
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
    "task_refs": [
     "TASK-006"
    ]
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
    "task_refs": [
     "TASK-006"
    ]
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
    "task_refs": [
     "TASK-008"
    ]
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
    "task_refs": [
     "TASK-003",
     "TASK-008"
    ]
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
    "task_refs": [
     "TASK-003"
    ]
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
    "task_refs": [
     "TASK-003",
     "TASK-007"
    ]
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
    "task_refs": [
     "TASK-009"
    ]
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
    "task_refs": [
     "TASK-010",
     "TASK-012"
    ]
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
    "task_refs": [
     "TASK-012"
    ]
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
    "task_refs": [
     "TASK-012"
    ]
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
    "task_refs": [
     "TASK-012"
    ]
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
    "task_refs": [
     "TASK-003"
    ]
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
    "task_refs": [
     "TASK-011"
    ]
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
    "task_refs": [
     "TASK-024"
    ]
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
    "task_refs": [
     "TASK-024"
    ]
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
    "task_refs": [
     "TASK-025"
    ]
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
    "task_refs": [
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
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
    "task_refs": [
     "TASK-013"
    ]
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
    "task_refs": [
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
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
    "task_refs": [
     "TASK-013"
    ]
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
    "task_refs": [
     "TASK-013"
    ]
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
    "task_refs": [
     "TASK-016",
     "TASK-022",
     "TASK-023"
    ]
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
    "task_refs": [
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
   },
   {
    "id": "AC-031",
    "type": "acceptance-criterion",
    "statement": "Running test:scripts in CI with a contrast pair lowered below threshold -> contrast matrix for default, presets and dark fails on the lowered pair",
    "behavior": "Running test:scripts in CI with a contrast pair lowered below threshold",
    "expected_result": "test:theme runs inside test:scripts, covers the pair matrix for default, existing presets and dark, and fails on the lowered pair",
    "verification_kind": "automated",
    "blocking": true,
    "requirement_refs": [
     "R-020"
    ],
    "task_refs": [
     "TASK-014",
     "TASK-023"
    ]
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
    "task_refs": [
     "TASK-015"
    ]
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
    "task_refs": [
     "TASK-028"
    ]
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
    "task_refs": [
     "TASK-027"
    ]
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
    "task_refs": [
     "TASK-026"
    ]
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
    "task_refs": [
     "TASK-029",
     "TASK-030"
    ]
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
    "task_refs": [
     "TASK-030"
    ]
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
    "task_refs": [
     "TASK-030"
    ]
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
     "EVIDENCE-004"
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
     "EVIDENCE-003",
     "EVIDENCE-008"
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
     "EVIDENCE-024"
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
     "EVIDENCE-013"
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
     "EVIDENCE-017",
     "EVIDENCE-018",
     "EVIDENCE-019",
     "EVIDENCE-020",
     "EVIDENCE-021"
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
     "EVIDENCE-012",
     "EVIDENCE-027"
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
     "EVIDENCE-001"
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
    "task_refs": [
     "TASK-024",
     "TASK-025"
    ]
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
    "task_refs": [
     "TASK-013"
    ]
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
    "task_refs": [
     "TASK-008"
    ]
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
    "task_refs": [
     "TASK-001",
     "TASK-029",
     "TASK-030"
    ]
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
    "task_refs": [
     "TASK-002",
     "TASK-004"
    ]
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
    "task_refs": [
     "TASK-002",
     "TASK-005"
    ]
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
    "task_refs": [
     "TASK-006"
    ]
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
    "task_refs": [
     "TASK-003",
     "TASK-007"
    ]
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
    "task_refs": [
     "TASK-009"
    ]
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
    "task_refs": [
     "TASK-010",
     "TASK-012"
    ]
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
    "task_refs": [
     "TASK-002",
     "TASK-012"
    ]
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
    "task_refs": [
     "TASK-011",
     "TASK-028"
    ]
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
    "task_refs": [
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
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
    "task_refs": [
     "TASK-013"
    ]
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
    "task_refs": [
     "TASK-016",
     "TASK-022",
     "TASK-023"
    ]
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
    "task_refs": [
     "TASK-015"
    ]
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
    "task_refs": [
     "TASK-001",
     "TASK-030"
    ]
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
    "task_refs": [
     "TASK-026"
    ]
   },
   {
    "id": "D-020",
    "type": "decision",
    "statement": "Token tiers and naming: Primitive --sd-{family} and ramps --sd-{family}-{50..950}; semantic --sd-{role}; component tier --sd-{component}-{role} where {component} is the selector without sd- (preview-pdf, file-explorer, code-editor), declared only in themes/_component-tokens.scss; px-named --sd-space-{n} and --sd-radius-{n}; role-named --sd-z-{layer}, --sd-shadow-{xs..xl}, --sd-duration-{fast|base|slow}, --sd-ease-standard; --sd-font-size-{n}, --sd-font-weight-{name}, --sd-line-height-{n}; --sd-focus-ring-{color|width|offset}",
    "question": "Token tiers and naming",
    "selected_value": "Primitive --sd-{family} and ramps --sd-{family}-{50..950}; semantic --sd-{role}; component tier --sd-{component}-{role} where {component} is the selector without sd- (preview-pdf, file-explorer, code-editor), declared only in themes/_component-tokens.scss; px-named --sd-space-{n} and --sd-radius-{n}; role-named --sd-z-{layer}, --sd-shadow-{xs..xl}, --sd-duration-{fast|base|slow}, --sd-ease-standard; --sd-font-size-{n}, --sd-font-weight-{name}, --sd-line-height-{n}; --sd-focus-ring-{color|width|offset}",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Independent migration units must pick identical names.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-019",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027"
    ],
    "task_refs": [
     "TASK-013",
     "TASK-027"
    ]
   },
   {
    "id": "D-021",
    "type": "decision",
    "statement": "Emission unit and mode semantics: theme() emits the complete declaration set on & only: light keeps the 2.15 declarations and adds new tokens; dark emits the dark set plus color-scheme dark and Material dark colour tokens; auto emits light on & plus @media (prefers-color-scheme: dark) { &:not([data-sd-theme=light]) { dark set } }; every declaration derived from var(--sd-*), including the Material form-field error icon variables, moves inside the emission",
    "question": "Emission unit and mode semantics",
    "selected_value": "theme() emits the complete declaration set on & only: light keeps the 2.15 declarations and adds new tokens; dark emits the dark set plus color-scheme dark and Material dark colour tokens; auto emits light on & plus @media (prefers-color-scheme: dark) { &:not([data-sd-theme=light]) { dark set } }; every declaration derived from var(--sd-*), including the Material form-field error icon variables, moves inside the emission",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Custom properties holding var() resolve where declared; a partial or root-only emission leaves stale light values.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-017",
     "AC-028",
     "INV-008"
    ],
    "task_refs": [
     "TASK-013"
    ]
   },
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
    "id": "D-023",
    "type": "decision",
    "statement": "Mode delivery and scope limits: sd-core.scss keeps html light unchanged and adds [data-sd-theme=dark] (dark) and [data-sd-theme=light] (light, color-scheme light); these built-in blocks cover the default preset with core source only; consumers with a custom theme, preset or material source re-include sd.theme(<same arguments>, $mode: dark) under their dark selector; modes are guaranteed when the attribute is on html; nested islands theme inline content only and overlays follow the document mode; the library never writes data-sd-theme",
    "question": "Mode delivery and scope limits",
    "selected_value": "sd-core.scss keeps html light unchanged and adds [data-sd-theme=dark] (dark) and [data-sd-theme=light] (light, color-scheme light); these built-in blocks cover the default preset with core source only; consumers with a custom theme, preset or material source re-include sd.theme(<same arguments>, $mode: dark) under their dark selector; modes are guaranteed when the attribute is on html; nested islands theme inline content only and overlays follow the document mode; the library never writes data-sd-theme",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Specificity makes attribute blocks override html-level custom themes, and overlays render outside nested islands.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-017",
     "AC-028",
     "INV-001"
    ],
    "task_refs": [
     "TASK-013",
     "TASK-027"
    ]
   },
   {
    "id": "D-024",
    "type": "decision",
    "statement": "Material dark call: Inside dark scopes call exactly mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette))) with no typography or density; set color-scheme dark in dark scopes and light in light islands; no theme-type color-scheme or light-dark()",
    "question": "Material dark call",
    "selected_value": "Inside dark scopes call exactly mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette))) with no typography or density; set color-scheme dark in dark scopes and light in light islands; no theme-type color-scheme or light-dark()",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Material 19 mat.theme emits typography only when configured; light Material CSS stays identical and browser support stays broad.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-017",
     "AC-028",
     "INV-001"
    ],
    "task_refs": [
     "TASK-013"
    ]
   },
   {
    "id": "D-025",
    "type": "decision",
    "statement": "Shared helper placement and naming: Cross-entry helpers live in utilities/extensions with the sd prefix: sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges",
    "question": "Shared helper placement and naming",
    "selected_value": "Cross-entry helpers live in utilities/extensions with the sd prefix: sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Entry points cannot import each other; utilities/extensions is the shared public entry and already uses the sd prefix.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-004",
     "R-005",
     "R-009",
     "AC-010",
     "AC-011",
     "AC-018"
    ],
    "task_refs": [
     "TASK-003",
     "TASK-011"
    ]
   },
   {
    "id": "D-026",
    "type": "decision",
    "statement": "Virtual scroll value ownership: With virtualScroll on, the component owns the value: the mat-select/mat-autocomplete shell is not bound to the formControl; user selection events are applied to the component model; rendered options are synced from the model; trigger labels come from selectedItems; array items are not paged by limit; function (SdSearch) results render as returned; pinned-selected ordering and emitted value order match the non-virtual branch; the component intercepts navigation keys, keeps an active index over the full filtered list, calls scrollToIndex before activating, owns aria-activedescendant and runs its own typeahead; Material private APIs are allowed only in one adapter per component covered by specs; default-off branch unchanged",
    "question": "Virtual scroll value ownership",
    "selected_value": "With virtualScroll on, the component owns the value: the mat-select/mat-autocomplete shell is not bound to the formControl; user selection events are applied to the component model; rendered options are synced from the model; trigger labels come from selectedItems; array items are not paged by limit; function (SdSearch) results render as returned; pinned-selected ordering and emitted value order match the non-virtual branch; the component intercepts navigation keys, keeps an active index over the full filtered list, calls scrollToIndex before activating, owns aria-activedescendant and runs its own typeahead; Material private APIs are allowed only in one adapter per component covered by specs; default-off branch unchanged",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Material key managers only see rendered options and multi-select would drop unrendered values; hidden options for every selected value would render up to 10000 options after select-all.",
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
     "AC-022",
     "INV-001"
    ],
    "task_refs": [
     "TASK-024",
     "TASK-025"
    ]
   },
   {
    "id": "D-027",
    "type": "decision",
    "statement": "Toast announcement ownership: The toast container template owns two persistent visually hidden regions (polite with data-autoid services-notify-live-polite, assertive with services-notify-live-assertive); the notify service announces through the container; toast elements carry no aria-live",
    "question": "Toast announcement ownership",
    "selected_value": "The toast container template owns two persistent visually hidden regions (polite with data-autoid services-notify-live-polite, assertive with services-notify-live-assertive); the notify service announces through the container; toast elements carry no aria-live",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "One owner prevents double announcements and survives toast removal.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-002",
     "AC-003"
    ],
    "task_refs": [
     "TASK-005"
    ]
   },
   {
    "id": "D-028",
    "type": "decision",
    "statement": "Release x.0 mechanism: releaseTargets(suffix, { baselineSuffix }); patch 0 requires an explicit baseline with a lower minor, patch > 0 keeps patch - 1; loadReleaseContract reads baselineSuffix from scripts/release-contracts/<suffix>.json and passes it to materializeValidatedBundle/validateReleaseBundle; the baseline invariant compares with targets[].baselineVersion; deploy.ps1 gains -BaselineSuffix; tests cover 3.0 in release-package-contract, collect-release-docs, generate-showcase-changelog and build-published-page retention; publish-npm.yml pins, its retention assertion and the approved 3.0.json snapshot belong to the release cut",
    "question": "Release x.0 mechanism",
    "selected_value": "releaseTargets(suffix, { baselineSuffix }); patch 0 requires an explicit baseline with a lower minor, patch > 0 keeps patch - 1; loadReleaseContract reads baselineSuffix from scripts/release-contracts/<suffix>.json and passes it to materializeValidatedBundle/validateReleaseBundle; the baseline invariant compares with targets[].baselineVersion; deploy.ps1 gains -BaselineSuffix; tests cover 3.0 in release-package-contract, collect-release-docs, generate-showcase-changelog and build-published-page retention; publish-npm.yml pins, its retention assertion and the approved 3.0.json snapshot belong to the release cut",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Keeps every 2.x rule, makes 3.0 expressible, and leaves release-cut artifacts to the approved release step.",
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
    "task_refs": [
     "TASK-026"
    ]
   },
   {
    "id": "D-029",
    "type": "decision",
    "statement": "Component token and host alias rule: Map a hex to a semantic or ramp token when values are identical; otherwise add --sd-{component}-{role} in themes/_component-tokens.scss with light value equal to the old hex and an explicit contrast-checked dark value; :host blocks may no longer hold hex and may only alias existing local names (--sd-pdf-*, --sd-fe-*, --sd-preview-*) to global tokens so consumer hooks keep working",
    "question": "Component token and host alias rule",
    "selected_value": "Map a hex to a semantic or ramp token when values are identical; otherwise add --sd-{component}-{role} in themes/_component-tokens.scss with light value equal to the old hex and an explicit contrast-checked dark value; :host blocks may no longer hold hex and may only alias existing local names (--sd-pdf-*, --sd-fe-*, --sd-preview-*) to global tokens so consumer hooks keep working",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "A :host declaration would override the global dark value; aliases keep existing hooks.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-017",
     "R-019",
     "AC-030",
     "AC-031"
    ],
    "task_refs": [
     "TASK-013",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
   },
   {
    "id": "D-030",
    "type": "decision",
    "statement": "Virtual scroll shell strategy: V1: keep the Material shell with a single hidden sentinel option so the trigger renders while the component owns the value; V2: a component-owned listbox panel if V1 fails the spike probes",
    "question": "Virtual scroll shell strategy",
    "selected_value": "V1: keep the Material shell with a single hidden sentinel option so the trigger renders while the component owns the value; V2: a component-owned listbox panel if V1 fails the spike probes",
    "source": "approved-architecture",
    "status": "deferred",
    "blocking": false,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Only the spike can show whether the Material shell satisfies AC-021/AC-022 across Angular lines.",
    "supersedes": null,
    "revisit_condition": "Resolved by the virtual-scroll spike task before any rollout task; the chosen variant is recorded in the plan execution evidence.",
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-010",
     "R-011",
     "AC-021",
     "AC-022"
    ],
    "task_refs": [
     "TASK-024"
    ]
   },
   {
    "id": "D-031",
    "type": "decision",
    "statement": "Focus ring application rule: --sd-focus-ring-color defaults to var(--sd-primary), width 2px, offset 2px; only outline declarations change: existing component hooks keep precedence as var(<hook>, var(--sd-focus-ring-color)); always-dark surfaces use a component token; widths and offsets other than 2px stay local; outline none with box-shadow focus stays allowed; private tokens are never redefined",
    "question": "Focus ring application rule",
    "selected_value": "--sd-focus-ring-color defaults to var(--sd-primary), width 2px, offset 2px; only outline declarations change: existing component hooks keep precedence as var(<hook>, var(--sd-focus-ring-color)); always-dark surfaces use a component token; widths and offsets other than 2px stay local; outline none with box-shadow focus stays allowed; private tokens are never redefined",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Keeps light appearance and public hooks while giving every focus colour a token source.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-013",
     "AC-024",
     "INV-001"
    ],
    "task_refs": [
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ]
   },
   {
    "id": "D-032",
    "type": "decision",
    "statement": "Editor sanitizer policy: sdSanitizeEditorHtml uses an allowlist of CKEditor output tags and attributes; removes script, style, iframe, frame, object, embed, applet, base, meta, link, form controls, template and SVG animation/use/foreignObject elements with content; href allows http, https, mailto, tel, relative and #fragment; img src allows http, https, relative and data:image/*; srcset candidates follow img src; any other URL-bearing attribute is removed; returns the original string when nothing is removed and is idempotent; without DOMParser it returns HTML-escaped text; applied at editor #onEditorUserInput and #getFromEditor and mini-editor #convertOutput and getHtmlContent(); Markdown mode sanitizes HTML before conversion; content that loses constructs is written back once and marks the control dirty",
    "question": "Editor sanitizer policy",
    "selected_value": "sdSanitizeEditorHtml uses an allowlist of CKEditor output tags and attributes; removes script, style, iframe, frame, object, embed, applet, base, meta, link, form controls, template and SVG animation/use/foreignObject elements with content; href allows http, https, mailto, tel, relative and #fragment; img src allows http, https, relative and data:image/*; srcset candidates follow img src; any other URL-bearing attribute is removed; returns the original string when nothing is removed and is idempotent; without DOMParser it returns HTML-escaped text; applied at editor #onEditorUserInput and #getFromEditor and mini-editor #convertOutput and getHtmlContent(); Markdown mode sanitizes HTML before conversion; content that loses constructs is written back once and marks the control dirty",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "A denylist is not fail-closed, re-serialising clean HTML would create false diffs, and getHtmlContent() bypassed the filter.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-004",
     "AC-009",
     "AC-010",
     "INV-006"
    ],
    "task_refs": [
     "TASK-003",
     "TASK-008"
    ]
   },
   {
    "id": "D-033",
    "type": "decision",
    "statement": "URL guard specifics: sdIsSafeResourceUrl reuses sdParseUrl/sdResolveBaseOrigin (SSR-safe); allows http and https without embedded credentials, relative URLs resolved against the base origin, blob:, data:image/* and data:application/pdf; everything else, including mailto and tel, is refused for downloads, media and window navigation",
    "question": "URL guard specifics",
    "selected_value": "sdIsSafeResourceUrl reuses sdParseUrl/sdResolveBaseOrigin (SSR-safe); allows http and https without embedded credentials, relative URLs resolved against the base origin, blob:, data:image/* and data:application/pdf; everything else, including mailto and tel, is refused for downloads, media and window navigation",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "Aligns with existing url-safety helpers and keeps download/media policy separate from editor link policy.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-005",
     "AC-011",
     "AC-012",
     "INV-006"
    ],
    "task_refs": [
     "TASK-003",
     "TASK-007"
    ]
   },
   {
    "id": "D-034",
    "type": "decision",
    "statement": "Tooltip interaction mechanics: Focus shows through the existing activeTooltip singleton and blur hides; while visible, a capture-phase document keydown listener handles only Escape, hides the tooltip and stops propagation only when it hid one, and is removed on hide; the bubble root has role tooltip and a unique id; the directive adds and removes only its own id in the host aria-describedby; the sdTooltipColor default becomes var(--sd-tooltip-bg)",
    "question": "Tooltip interaction mechanics",
    "selected_value": "Focus shows through the existing activeTooltip singleton and blur hides; while visible, a capture-phase document keydown listener handles only Escape, hides the tooltip and stops propagation only when it hid one, and is removed on hide; the bubble root has role tooltip and a unique id; the directive adds and removes only its own id in the host aria-describedby; the sdTooltipColor default becomes var(--sd-tooltip-bg)",
    "source": "approved-architecture",
    "status": "approved",
    "blocking": true,
    "scope": "public-contract",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "A dialog listening on body would otherwise close first; a permanent capture listener would repeat the DS defect.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-003",
     "AC-006",
     "AC-007",
     "AC-008"
    ],
    "task_refs": [
     "TASK-006"
    ]
   },
   {
    "id": "D-035",
    "type": "decision",
    "statement": "Validation boundary: no authorization boundary in release 3.0",
    "question": "Validation boundary",
    "selected_value": "none for every requirement, acceptance criterion and invariant of this release",
    "source": "approved-plan",
    "status": "proposed",
    "blocking": false,
    "scope": "repository",
    "owner_repository_id": "sdcorejs-angular",
    "rationale": "The release changes a client-side UI library with no server authorization surface.",
    "supersedes": null,
    "revisit_condition": null,
    "convention_impact": {
     "candidate": false,
     "category": null
    },
    "downstream_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ],
    "task_refs": [
     "TASK-030"
    ],
    "validation_boundary": {
     "kind": "none",
     "source_refs": [
      "R-001",
      "R-002",
      "R-003",
      "R-004",
      "R-005",
      "R-006",
      "R-007",
      "R-008",
      "R-009",
      "R-010",
      "R-011",
      "R-013",
      "R-014",
      "R-015",
      "R-016",
      "R-017",
      "R-018",
      "R-019",
      "R-020",
      "R-021",
      "R-022",
      "R-023",
      "R-024",
      "AC-001",
      "AC-002",
      "AC-003",
      "AC-004",
      "AC-005",
      "AC-006",
      "AC-007",
      "AC-008",
      "AC-009",
      "AC-010",
      "AC-011",
      "AC-012",
      "AC-013",
      "AC-014",
      "AC-015",
      "AC-016",
      "AC-017",
      "AC-018",
      "AC-019",
      "AC-020",
      "AC-021",
      "AC-022",
      "AC-024",
      "AC-025",
      "AC-026",
      "AC-027",
      "AC-028",
      "AC-029",
      "AC-030",
      "AC-031",
      "AC-032",
      "AC-033",
      "AC-034",
      "AC-035",
      "AC-036",
      "AC-037",
      "AC-038",
      "INV-001",
      "INV-002",
      "INV-003",
      "INV-004",
      "INV-005",
      "INV-006",
      "INV-007",
      "INV-008"
     ]
    }
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
   },
   {
    "id": "INV-002",
    "type": "invariant",
    "statement": "Shared library changes are authored in versions/v19 and propagated only with npm run sync; check:sync passes.",
    "protected_refs": [
     "R-024",
     "AC-036"
    ],
    "task_refs": [
     "TASK-026",
     "TASK-029",
     "TASK-030"
    ],
    "evidence_refs": [
     "EVIDENCE-026",
     "EVIDENCE-029",
     "EVIDENCE-030"
    ]
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
    "task_refs": [
     "TASK-003",
     "TASK-016",
     "TASK-023",
     "TASK-024",
     "TASK-030"
    ],
    "evidence_refs": [
     "EVIDENCE-003",
     "EVIDENCE-016",
     "EVIDENCE-023",
     "EVIDENCE-024",
     "EVIDENCE-030"
    ]
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
    "task_refs": [
     "TASK-013",
     "TASK-015",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ],
    "evidence_refs": [
     "EVIDENCE-013",
     "EVIDENCE-015",
     "EVIDENCE-017",
     "EVIDENCE-018",
     "EVIDENCE-019",
     "EVIDENCE-020",
     "EVIDENCE-021"
    ]
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
    "task_refs": [
     "TASK-002",
     "TASK-004",
     "TASK-005",
     "TASK-010",
     "TASK-012",
     "TASK-030"
    ],
    "evidence_refs": [
     "EVIDENCE-002",
     "EVIDENCE-004",
     "EVIDENCE-005",
     "EVIDENCE-010",
     "EVIDENCE-012",
     "EVIDENCE-030"
    ]
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
    "task_refs": [
     "TASK-003",
     "TASK-007",
     "TASK-008",
     "TASK-011",
     "TASK-012"
    ],
    "evidence_refs": [
     "EVIDENCE-003",
     "EVIDENCE-007",
     "EVIDENCE-008",
     "EVIDENCE-011",
     "EVIDENCE-012"
    ]
   },
   {
    "id": "INV-007",
    "type": "invariant",
    "statement": "Library components reference colours only through var(--sd-*) tokens; hex literals exist only in themes and documented exemptions.",
    "protected_refs": [
     "R-018",
     "R-019",
     "AC-029",
     "AC-030"
    ],
    "task_refs": [
     "TASK-016",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021",
     "TASK-022",
     "TASK-023"
    ],
    "evidence_refs": [
     "EVIDENCE-016",
     "EVIDENCE-017",
     "EVIDENCE-018",
     "EVIDENCE-019",
     "EVIDENCE-020",
     "EVIDENCE-021",
     "EVIDENCE-022",
     "EVIDENCE-023"
    ]
   },
   {
    "id": "INV-008",
    "type": "invariant",
    "statement": "Every declaration emitted by theme() for light, including declarations derived from var(--sd-*), is emitted again with a dark value in every dark scope.",
    "protected_refs": [
     "R-017",
     "AC-028"
    ],
    "task_refs": [
     "TASK-013",
     "TASK-014",
     "TASK-023"
    ],
    "evidence_refs": [
     "EVIDENCE-013",
     "EVIDENCE-014",
     "EVIDENCE-023"
    ]
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
   },
   {
    "revision": 3,
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
      "id": "D-020",
      "type": "decision"
     },
     {
      "id": "D-021",
      "type": "decision"
     },
     {
      "id": "D-022",
      "type": "decision"
     },
     {
      "id": "D-023",
      "type": "decision"
     },
     {
      "id": "D-024",
      "type": "decision"
     },
     {
      "id": "D-025",
      "type": "decision"
     },
     {
      "id": "D-026",
      "type": "decision"
     },
     {
      "id": "D-027",
      "type": "decision"
     },
     {
      "id": "D-028",
      "type": "decision"
     },
     {
      "id": "D-029",
      "type": "decision"
     },
     {
      "id": "D-030",
      "type": "decision"
     },
     {
      "id": "D-031",
      "type": "decision"
     },
     {
      "id": "D-032",
      "type": "decision"
     },
     {
      "id": "D-033",
      "type": "decision"
     },
     {
      "id": "D-034",
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
     },
     {
      "id": "INV-007",
      "type": "invariant"
     },
     {
      "id": "INV-008",
      "type": "invariant"
     }
    ],
    "tombstones": []
   },
   {
    "revision": 4,
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
      "id": "D-020",
      "type": "decision"
     },
     {
      "id": "D-021",
      "type": "decision"
     },
     {
      "id": "D-022",
      "type": "decision"
     },
     {
      "id": "D-023",
      "type": "decision"
     },
     {
      "id": "D-024",
      "type": "decision"
     },
     {
      "id": "D-025",
      "type": "decision"
     },
     {
      "id": "D-026",
      "type": "decision"
     },
     {
      "id": "D-027",
      "type": "decision"
     },
     {
      "id": "D-028",
      "type": "decision"
     },
     {
      "id": "D-029",
      "type": "decision"
     },
     {
      "id": "D-030",
      "type": "decision"
     },
     {
      "id": "D-031",
      "type": "decision"
     },
     {
      "id": "D-032",
      "type": "decision"
     },
     {
      "id": "D-033",
      "type": "decision"
     },
     {
      "id": "D-034",
      "type": "decision"
     },
     {
      "id": "D-035",
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
     },
     {
      "id": "INV-007",
      "type": "invariant"
     },
     {
      "id": "INV-008",
      "type": "invariant"
     }
    ],
    "tombstones": []
   },
   {
    "revision": 5,
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
      "id": "D-020",
      "type": "decision"
     },
     {
      "id": "D-021",
      "type": "decision"
     },
     {
      "id": "D-022",
      "type": "decision"
     },
     {
      "id": "D-023",
      "type": "decision"
     },
     {
      "id": "D-024",
      "type": "decision"
     },
     {
      "id": "D-025",
      "type": "decision"
     },
     {
      "id": "D-026",
      "type": "decision"
     },
     {
      "id": "D-027",
      "type": "decision"
     },
     {
      "id": "D-028",
      "type": "decision"
     },
     {
      "id": "D-029",
      "type": "decision"
     },
     {
      "id": "D-030",
      "type": "decision"
     },
     {
      "id": "D-031",
      "type": "decision"
     },
     {
      "id": "D-032",
      "type": "decision"
     },
     {
      "id": "D-033",
      "type": "decision"
     },
     {
      "id": "D-034",
      "type": "decision"
     },
     {
      "id": "D-035",
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
     },
     {
      "id": "INV-007",
      "type": "invariant"
     },
     {
      "id": "INV-008",
      "type": "invariant"
     }
    ],
    "tombstones": [
     {
      "id": "R-012",
      "type": "requirement",
      "retired_revision": 5,
      "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
     },
     {
      "id": "AC-023",
      "type": "acceptance-criterion",
      "retired_revision": 5,
      "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
     },
     {
      "id": "D-013",
      "type": "decision",
      "retired_revision": 5,
      "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
     }
    ]
   },
   {
    "revision": 6,
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
      "id": "D-020",
      "type": "decision"
     },
     {
      "id": "D-021",
      "type": "decision"
     },
     {
      "id": "D-022",
      "type": "decision"
     },
     {
      "id": "D-023",
      "type": "decision"
     },
     {
      "id": "D-024",
      "type": "decision"
     },
     {
      "id": "D-025",
      "type": "decision"
     },
     {
      "id": "D-026",
      "type": "decision"
     },
     {
      "id": "D-027",
      "type": "decision"
     },
     {
      "id": "D-028",
      "type": "decision"
     },
     {
      "id": "D-029",
      "type": "decision"
     },
     {
      "id": "D-030",
      "type": "decision"
     },
     {
      "id": "D-031",
      "type": "decision"
     },
     {
      "id": "D-032",
      "type": "decision"
     },
     {
      "id": "D-033",
      "type": "decision"
     },
     {
      "id": "D-034",
      "type": "decision"
     },
     {
      "id": "D-035",
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
     },
     {
      "id": "INV-007",
      "type": "invariant"
     },
     {
      "id": "INV-008",
      "type": "invariant"
     }
    ],
    "tombstones": [
     {
      "id": "R-012",
      "type": "requirement",
      "retired_revision": 5,
      "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
     },
     {
      "id": "AC-023",
      "type": "acceptance-criterion",
      "retired_revision": 5,
      "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
     },
     {
      "id": "D-013",
      "type": "decision",
      "retired_revision": 5,
      "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
     }
    ]
   }
  ],
  "approved_artifact": {
   "metadata": {
    "allowed_paths": [
     "**"
    ],
    "approval_source": "user-approved-decision-coverage",
    "approved_at": "2026-08-09T00:00:00.000Z",
    "approved_by": "draft-self-review-provisional",
    "artifact_id": "decision-coverage-r6",
    "artifact_kind": "plan",
    "change_ref": "angular-core-3-0-release-20260925",
    "contract_id": "decision-coverage:v1",
    "owner_module_id": null,
    "owner_repository_id": "sdcorejs-angular",
    "owner_repository_role": "standalone",
    "parent_references": [],
    "parent_repository_id": null,
    "prohibited_paths": [],
    "repository_relative_path": ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-plan.md",
    "requirement_id": "decision-coverage",
    "schema_version": 1,
    "source_revision": "726df9964721a10740cb7bdd6e100a03307ef39a",
    "stack_profile": "markdown-skill-pack",
    "supersedes": null,
    "track": "workflow",
    "approval_hash": "sha256:v1:f4ef4257c19174665d07a9f26c52fd7673b5f0890d294e158e1b52fce51c16a2"
   },
   "body": "{\"history\":[{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"}],\"revision\":1,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"}],\"revision\":2,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"D-031\",\"type\":\"decision\"},{\"id\":\"D-032\",\"type\":\"decision\"},{\"id\":\"D-033\",\"type\":\"decision\"},{\"id\":\"D-034\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"}],\"revision\":3,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"D-031\",\"type\":\"decision\"},{\"id\":\"D-032\",\"type\":\"decision\"},{\"id\":\"D-033\",\"type\":\"decision\"},{\"id\":\"D-034\",\"type\":\"decision\"},{\"id\":\"D-035\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"}],\"revision\":4,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"D-031\",\"type\":\"decision\"},{\"id\":\"D-032\",\"type\":\"decision\"},{\"id\":\"D-033\",\"type\":\"decision\"},{\"id\":\"D-034\",\"type\":\"decision\"},{\"id\":\"D-035\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"}],\"revision\":5,\"tombstones\":[{\"id\":\"R-012\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"requirement\"},{\"id\":\"AC-023\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"acceptance-criterion\"},{\"id\":\"D-013\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"decision\"}]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"D-031\",\"type\":\"decision\"},{\"id\":\"D-032\",\"type\":\"decision\"},{\"id\":\"D-033\",\"type\":\"decision\"},{\"id\":\"D-034\",\"type\":\"decision\"},{\"id\":\"D-035\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"}],\"revision\":6,\"tombstones\":[{\"id\":\"R-012\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"requirement\"},{\"id\":\"AC-023\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"acceptance-criterion\"},{\"id\":\"D-013\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"decision\"}]}],\"records\":[{\"id\":\"R-001\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-table export honours export.max: when the rows to export exceed max, export does not start and an i18n warning names the limit.\",\"status\":\"active\",\"task_refs\":[\"TASK-002\",\"TASK-004\"],\"type\":\"requirement\"},{\"id\":\"R-002\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Toast notifications are announced through persistent polite/assertive live regions, pause auto-dismiss on hover and keyboard focus, and expose typed, labelled buttons.\",\"status\":\"active\",\"task_refs\":[\"TASK-002\",\"TASK-005\"],\"type\":\"requirement\"},{\"id\":\"R-003\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-tooltip meets WCAG 1.4.13: shows on focus, hides on blur, Escape dismisses, bubble is hoverable, role=tooltip with aria-describedby, token colour.\",\"status\":\"active\",\"task_refs\":[\"TASK-006\"],\"type\":\"requirement\"},{\"id\":\"R-004\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-mini-editor restricts link protocols and both editors emit HTML filtered of script URLs, non-image data URLs and on* attributes while keeping formatting.\",\"status\":\"active\",\"task_refs\":[\"TASK-003\",\"TASK-008\"],\"type\":\"requirement\"},{\"id\":\"R-005\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A shared URL scheme guard blocks unsafe download/open URLs in SdUtilities.download, preview-image, preview-pdf, upload-file and preview-video.\",\"status\":\"active\",\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"requirement\"},{\"id\":\"R-006\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"The side-drawer body scroll lock compensates the scrollbar width with padding-right and restores it on final release, except in container mode.\",\"status\":\"active\",\"task_refs\":[\"TASK-009\"],\"type\":\"requirement\"},{\"id\":\"R-007\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"I18nService exposes a BCP-47 locale signal; hard-coded vi-VN formatting in library code and the duplicate locale maps are replaced by it.\",\"status\":\"active\",\"task_refs\":[\"TASK-010\",\"TASK-012\"],\"type\":\"requirement\"},{\"id\":\"R-008\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A new sd-preview-video component in the preview entry point plays video with error/retry state, is used by the file-explorer detail, and ships md docs plus a showcase demo.\",\"status\":\"active\",\"task_refs\":[\"TASK-002\",\"TASK-012\",\"TASK-028\"],\"type\":\"requirement\"},{\"id\":\"R-009\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Diacritic-insensitive helpers sdNormalizeSearchText and sdFindHighlightRanges plus an sd-highlight component render matches safely without innerHTML or regex built from input.\",\"status\":\"active\",\"task_refs\":[\"TASK-003\",\"TASK-011\",\"TASK-028\"],\"type\":\"requirement\"},{\"id\":\"R-010\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-select supports opt-in virtual scrolling (default off) preserving keyboard navigation, selected display, multi-select values and select-all.\",\"status\":\"active\",\"task_refs\":[\"TASK-024\"],\"type\":\"requirement\"},{\"id\":\"R-011\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-autocomplete supports opt-in virtual scrolling (default off) preserving keyboard navigation and selection.\",\"status\":\"active\",\"task_refs\":[\"TASK-024\",\"TASK-025\"],\"type\":\"requirement\"},{\"id\":\"R-013\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Focus ring tokens exist (colour defaults to var(--sd-primary)); every focus outline colour comes from the shared token, a documented component hook falling back to it, or a component token for always-dark surfaces; no hex remains in focus rules.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"requirement\"},{\"id\":\"R-014\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"The semantic token layer adds status bg/fg, link, surface-inverse, text-on-solid, border-focus, border-danger and overlay-backdrop tokens.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\"],\"type\":\"requirement\"},{\"id\":\"R-015\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Non-colour tokens (space, radius, shadow, z-index, motion, typography) exist as CSS variables and exact-matching literals use them.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"requirement\"},{\"id\":\"R-016\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Colour ramps 50-950 are generated at runtime for the main colour families while existing -light/-dark/-contrast values stay unchanged.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\"],\"type\":\"requirement\"},{\"id\":\"R-017\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"An opt-in dark theme covers Core tokens and Material, scoped by [data-sd-theme=dark], with an auto mode following prefers-color-scheme.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\"],\"type\":\"requirement\"},{\"id\":\"R-018\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Hex colour literals are rejected by lint in library TS/templates and by a dependency-free SCSS check, both enforced in CI.\",\"status\":\"active\",\"task_refs\":[\"TASK-016\",\"TASK-022\",\"TASK-023\"],\"type\":\"requirement\"},{\"id\":\"R-019\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Raw hex colours in library SCSS and TS outside documented exemptions are replaced by tokens with identical values.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"requirement\"},{\"id\":\"R-020\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Theme contrast tests run in CI and cover default, every existing preset and dark mode.\",\"status\":\"active\",\"task_refs\":[\"TASK-014\",\"TASK-023\"],\"type\":\"requirement\"},{\"id\":\"R-021\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A new entry point @sdcorejs/angular/utilities/theme exposes readSdTokens and the SdColorToken type.\",\"status\":\"active\",\"task_refs\":[\"TASK-015\"],\"type\":\"requirement\"},{\"id\":\"R-022\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A showcase Theme & tokens guide and a published THEME.md document tokens, ramps, contrast and dark mode; the STYLE-GUIDE is updated.\",\"status\":\"active\",\"task_refs\":[\"TASK-027\",\"TASK-028\"],\"type\":\"requirement\"},{\"id\":\"R-023\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Release tooling accepts an x.0 suffix with an explicit baseline so 3.0 targets 19.3.0/20.3.0/21.3.0/22.3.0 against *.2.15.\",\"status\":\"active\",\"task_refs\":[\"TASK-026\"],\"type\":\"requirement\"},{\"id\":\"R-024\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Docs, changelog (with a BREAKING section and migration), npm README parity and v20-v22 rollout are delivered with the change.\",\"status\":\"active\",\"task_refs\":[\"TASK-001\",\"TASK-029\",\"TASK-030\"],\"type\":\"requirement\"},{\"behavior\":\"Server or local export where the row count exceeds export.max\",\"blocking\":true,\"expected_result\":\"No file is written, a warning notification with the i18n limit message is shown, exporting resets to false\",\"id\":\"AC-001\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Server or local export where the row count exceeds export.max -> No file is written, a warning notification with the i18n limit message is shown, exporting resets to false\",\"task_refs\":[\"TASK-004\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Export with max unset or row count within max\",\"blocking\":true,\"expected_result\":\"Export behaves exactly as in 2.15 and existing export specs stay green\",\"id\":\"AC-002\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Export with max unset or row count within max -> Export behaves exactly as in 2.15 and existing export specs stay green\",\"task_refs\":[\"TASK-004\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Showing info/success and warning/error toasts\",\"blocking\":true,\"expected_result\":\"The persistent polite region announces info/success and the assertive region announces warning/error\",\"id\":\"AC-003\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Showing info/success and warning/error toasts -> The persistent polite region announces info/success and the assertive region announces warning/error\",\"task_refs\":[\"TASK-005\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Keyboard focus enters and leaves a toast\",\"blocking\":true,\"expected_result\":\"Auto-dismiss pauses while focus is inside and resumes on blur; hover pause still works\",\"id\":\"AC-004\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Keyboard focus enters and leaves a toast -> Auto-dismiss pauses while focus is inside and resumes on blur; hover pause still works\",\"task_refs\":[\"TASK-005\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Rendering toast buttons\",\"blocking\":true,\"expected_result\":\"Close and action buttons are type=button and the close button has an i18n aria-label\",\"id\":\"AC-005\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Rendering toast buttons -> Close and action buttons are type=button and the close button has an i18n aria-label\",\"task_refs\":[\"TASK-005\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Keyboard focus on and off a tooltip host\",\"blocking\":true,\"expected_result\":\"The tooltip shows on focus and hides on blur; the bubble has role=tooltip; the host aria-describedby includes the bubble id only while visible and keeps existing ids\",\"id\":\"AC-006\",\"requirement_refs\":[\"R-003\"],\"statement\":\"Keyboard focus on and off a tooltip host -> The tooltip shows on focus and hides on blur; the bubble has role=tooltip; the host aria-describedby includes the bubble id only while visible and keeps existing ids\",\"task_refs\":[\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Pressing Escape with the tooltip visible and hidden\",\"blocking\":true,\"expected_result\":\"Visible: tooltip hides and the event does not propagate; hidden: the event propagates unchanged\",\"id\":\"AC-007\",\"requirement_refs\":[\"R-003\"],\"statement\":\"Pressing Escape with the tooltip visible and hidden -> Visible: tooltip hides and the event does not propagate; hidden: the event propagates unchanged\",\"task_refs\":[\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Pointer moves from host into the bubble; default colour inspected\",\"blocking\":true,\"expected_result\":\"The bubble stays visible while hovered; the default background comes from a token and the directive has no hex literal\",\"id\":\"AC-008\",\"requirement_refs\":[\"R-003\"],\"statement\":\"Pointer moves from host into the bubble; default colour inspected -> The bubble stays visible while hovered; the default background comes from a token and the directive has no hex literal\",\"task_refs\":[\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Inspecting the mini-editor CKEditor link config\",\"blocking\":true,\"expected_result\":\"link.allowedProtocols is https, http, mailto, tel\",\"id\":\"AC-009\",\"requirement_refs\":[\"R-004\"],\"statement\":\"Inspecting the mini-editor CKEditor link config -> link.allowedProtocols is https, http, mailto, tel\",\"task_refs\":[\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Editor and mini-editor emit HTML containing javascript:/vbscript: URLs, data:text URLs, on* attributes, styles, tables and https/data:image images\",\"blocking\":true,\"expected_result\":\"Unsafe URLs and on* attributes are removed; styles, tables and safe images are kept across valueChange, sdChange, contentChange and form value\",\"id\":\"AC-010\",\"requirement_refs\":[\"R-004\"],\"statement\":\"Editor and mini-editor emit HTML containing javascript:/vbscript: URLs, data:text URLs, on* attributes, styles, tables and https/data:image images -> Unsafe URLs and on* attributes are removed; styles, tables and safe images are kept across valueChange, sdChange, contentChange and form value\",\"task_refs\":[\"TASK-003\",\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Evaluating the URL guard against allowed and blocked inputs\",\"blocking\":true,\"expected_result\":\"https, http, relative, blob, data:image/* and data:application/pdf pass; javascript:, vbscript:, other data: and file: are blocked\",\"id\":\"AC-011\",\"requirement_refs\":[\"R-005\"],\"statement\":\"Evaluating the URL guard against allowed and blocked inputs -> https, http, relative, blob, data:image/* and data:application/pdf pass; javascript:, vbscript:, other data: and file: are blocked\",\"task_refs\":[\"TASK-003\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Triggering downloads with blocked URLs in SdUtilities.download, preview-image, preview-pdf and upload-file\",\"blocking\":true,\"expected_result\":\"No anchor navigation happens; upload-file no longer renders href=\\\"javascript:;\\\"\",\"id\":\"AC-012\",\"requirement_refs\":[\"R-005\"],\"statement\":\"Triggering downloads with blocked URLs in SdUtilities.download, preview-image, preview-pdf and upload-file -> No anchor navigation happens; upload-file no longer renders href=\\\"javascript:;\\\"\",\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Locking and releasing body scroll with a visible scrollbar, stacked locks and container mode\",\"blocking\":true,\"expected_result\":\"padding-right grows by the scrollbar width once, is restored on final release, and container mode is untouched\",\"id\":\"AC-013\",\"requirement_refs\":[\"R-006\"],\"statement\":\"Locking and releasing body scroll with a visible scrollbar, stacked locks and container mode -> padding-right grows by the scrollbar width once, is restored on final release, and container mode is untouched\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Switching language and rendering date/datetime min/max messages, forbidden/not-found/home pages and query-bar chips\",\"blocking\":true,\"expected_result\":\"locale() returns the mapped BCP-47 tag and formatting follows it; no vi-VN literal remains in library code except the single mapping table\",\"id\":\"AC-014\",\"requirement_refs\":[\"R-007\"],\"statement\":\"Switching language and rendering date/datetime min/max messages, forbidden/not-found/home pages and query-bar chips -> locale() returns the mapped BCP-47 tag and formatting follows it; no vi-VN literal remains in library code except the single mapping table\",\"task_refs\":[\"TASK-010\",\"TASK-012\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Rendering sd-preview-video with URL, Blob, poster, media error and download\",\"blocking\":true,\"expected_result\":\"A native video with controls plays; Blob URLs are revoked on destroy; errors show an i18n message with retry; downloads obey the URL guard; autoId attributes exist\",\"id\":\"AC-015\",\"requirement_refs\":[\"R-008\"],\"statement\":\"Rendering sd-preview-video with URL, Blob, poster, media error and download -> A native video with controls plays; Blob URLs are revoked on destroy; errors show an i18n message with retry; downloads obey the URL guard; autoId attributes exist\",\"task_refs\":[\"TASK-012\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Opening a video file in the file-explorer detail\",\"blocking\":true,\"expected_result\":\"sd-preview-video renders instead of the unavailable fallback\",\"id\":\"AC-016\",\"requirement_refs\":[\"R-008\"],\"statement\":\"Opening a video file in the file-explorer detail -> sd-preview-video renders instead of the unavailable fallback\",\"task_refs\":[\"TASK-012\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Reviewing sd-preview.md and the showcase preview page\",\"blocking\":true,\"expected_result\":\"The video section is documented, the duplicated pdf section is removed, and the demo plays a sample video\",\"id\":\"AC-017\",\"requirement_refs\":[\"R-008\"],\"statement\":\"Reviewing sd-preview.md and the showcase preview page -> The video section is documented, the duplicated pdf section is removed, and the demo plays a sample video\",\"task_refs\":[\"TASK-012\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"manual\"},{\"behavior\":\"Running highlight utilities on diacritics, đ/Đ, case, regex metacharacters, surrogate pairs and empty terms\",\"blocking\":true,\"expected_result\":\"Normalization and ranges match expected original-index ranges without throwing\",\"id\":\"AC-018\",\"requirement_refs\":[\"R-009\"],\"statement\":\"Running highlight utilities on diacritics, đ/Đ, case, regex metacharacters, surrogate pairs and empty terms -> Normalization and ranges match expected original-index ranges without throwing\",\"task_refs\":[\"TASK-003\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Rendering sd-highlight with text containing HTML markup\",\"blocking\":true,\"expected_result\":\"Matches render inside mark elements and markup is shown as text, never parsed\",\"id\":\"AC-019\",\"requirement_refs\":[\"R-009\"],\"statement\":\"Rendering sd-highlight with text containing HTML markup -> Matches render inside mark elements and markup is shown as text, never parsed\",\"task_refs\":[\"TASK-011\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Using sd-select with virtualScroll off\",\"blocking\":true,\"expected_result\":\"DOM and behaviour are identical to 2.15; no virtual viewport exists; existing select specs stay green\",\"id\":\"AC-020\",\"requirement_refs\":[\"R-010\"],\"statement\":\"Using sd-select with virtualScroll off -> DOM and behaviour are identical to 2.15; no virtual viewport exists; existing select specs stay green\",\"task_refs\":[\"TASK-024\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Using sd-select with virtualScroll on and 10000 local items, single and multi\",\"blocking\":true,\"expected_result\":\"Rendered options stay bounded; End/PageDown/typeahead reach every item; multi keeps selected values outside the viewport; trigger shows all selected labels; select-all covers the filtered set\",\"id\":\"AC-021\",\"requirement_refs\":[\"R-010\"],\"statement\":\"Using sd-select with virtualScroll on and 10000 local items, single and multi -> Rendered options stay bounded; End/PageDown/typeahead reach every item; multi keeps selected values outside the viewport; trigger shows all selected labels; select-all covers the filtered set\",\"task_refs\":[\"TASK-024\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Using sd-autocomplete with virtualScroll off and on with 10000 items\",\"blocking\":true,\"expected_result\":\"Off is identical to 2.15; on keeps rendering bounded, arrow keys reach every item and selection emits the right value\",\"id\":\"AC-022\",\"requirement_refs\":[\"R-011\"],\"statement\":\"Using sd-autocomplete with virtualScroll off and on with 10000 items -> Off is identical to 2.15; on keeps rendering bounded, arrow keys reach every item and selection emits the right value\",\"task_refs\":[\"TASK-025\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Scanning library focus rules and computing a focus outline\",\"blocking\":true,\"expected_result\":\"Every focus outline colour comes from a token (shared, hook with shared fallback, or component token); no hex remains; without hooks the default colour equals the primary colour; light appearance is unchanged\",\"id\":\"AC-024\",\"requirement_refs\":[\"R-013\"],\"statement\":\"Scanning library focus rules and computing a focus outline -> every focus outline colour comes from a token; no hex; default equals primary; light unchanged\",\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compiling default, every preset and dark themes\",\"blocking\":true,\"expected_result\":\"All new semantic tokens are emitted with the documented derivations\",\"id\":\"AC-025\",\"requirement_refs\":[\"R-014\"],\"statement\":\"Compiling default, every preset and dark themes -> All new semantic tokens are emitted with the documented derivations\",\"task_refs\":[\"TASK-013\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compiling themes and reviewing the literal migration report\",\"blocking\":true,\"expected_result\":\"Non-colour tokens are emitted; only exact-value literals were replaced; utility classes are unchanged\",\"id\":\"AC-026\",\"requirement_refs\":[\"R-015\"],\"statement\":\"Compiling themes and reviewing the literal migration report -> Non-colour tokens are emitted; only exact-value literals were replaced; utility classes are unchanged\",\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Comparing theme output with 2.15\",\"blocking\":true,\"expected_result\":\"Ramp tokens exist for 7 families x 11 steps; -light, -dark and -contrast values are unchanged for default and presets\",\"id\":\"AC-027\",\"requirement_refs\":[\"R-016\"],\"statement\":\"Comparing theme output with 2.15 -> Ramp tokens exist for 7 families x 11 steps; -light, -dark and -contrast values are unchanged for default and presets\",\"task_refs\":[\"TASK-013\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compiling sd.theme with mode omitted, dark and auto\",\"blocking\":true,\"expected_result\":\"Omitted mode keeps every 2.15 declaration with identical values and only adds new --sd-* properties and [data-sd-theme] blocks; dark redeclares every public and semantic token plus Material dark under [data-sd-theme=dark] with color-scheme dark; auto applies dark via prefers-color-scheme unless [data-sd-theme=light]\",\"id\":\"AC-028\",\"requirement_refs\":[\"R-017\"],\"statement\":\"Compiling sd.theme with mode omitted, dark and auto -> 2.15 declarations unchanged (additive only); complete dark scope; auto media scope\",\"task_refs\":[\"TASK-013\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Running the ESLint hex rule and the SCSS hex check on fixtures and on the repository\",\"blocking\":true,\"expected_result\":\"Planted hex fails, var() fallbacks and exemptions pass, the repository passes, and both run in CI\",\"id\":\"AC-029\",\"requirement_refs\":[\"R-018\"],\"statement\":\"Running the ESLint hex rule and the SCSS hex check on fixtures and on the repository -> Planted hex fails, var() fallbacks and exemptions pass, the repository passes, and both run in CI\",\"task_refs\":[\"TASK-016\",\"TASK-022\",\"TASK-023\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Scanning library SCSS and TS after migration\",\"blocking\":true,\"expected_result\":\"Zero raw hex remains outside documented exemptions and sampled computed styles are unchanged\",\"id\":\"AC-030\",\"requirement_refs\":[\"R-019\"],\"statement\":\"Scanning library SCSS and TS after migration -> Zero raw hex remains outside documented exemptions and sampled computed styles are unchanged\",\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Running test:scripts in CI with a contrast pair lowered below threshold\",\"blocking\":true,\"expected_result\":\"test:theme runs inside test:scripts, covers the pair matrix for default, existing presets and dark, and fails on the lowered pair\",\"id\":\"AC-031\",\"requirement_refs\":[\"R-020\"],\"statement\":\"Running test:scripts in CI with a contrast pair lowered below threshold -> contrast matrix for default, presets and dark fails on the lowered pair\",\"task_refs\":[\"TASK-014\",\"TASK-023\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Importing @sdcorejs/angular/utilities/theme\",\"blocking\":true,\"expected_result\":\"The entry builds; readSdTokens returns resolved values in a browser and an empty record without a document; SdColorToken matches the public token list\",\"id\":\"AC-032\",\"requirement_refs\":[\"R-021\"],\"statement\":\"Importing @sdcorejs/angular/utilities/theme -> The entry builds; readSdTokens returns resolved values in a browser and an empty record without a document; SdColorToken matches the public token list\",\"task_refs\":[\"TASK-015\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Building the showcase and published docs\",\"blocking\":true,\"expected_result\":\"The Theme & tokens page and THEME.md are registered, registry counts are updated and the docs guard passes\",\"id\":\"AC-033\",\"requirement_refs\":[\"R-022\"],\"statement\":\"Building the showcase and published docs -> The Theme & tokens page and THEME.md are registered, registry counts are updated and the docs guard passes\",\"task_refs\":[\"TASK-028\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Viewing the Theme & tokens page\",\"blocking\":true,\"expected_result\":\"Swatches, ramps, tokens, contrast tables and the dark toggle render correctly in light and dark\",\"id\":\"AC-034\",\"requirement_refs\":[\"R-022\"],\"statement\":\"Viewing the Theme & tokens page -> Swatches, ramps, tokens, contrast tables and the dark toggle render correctly in light and dark\",\"task_refs\":[\"TASK-027\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"manual\"},{\"behavior\":\"Running release tooling tests for 3.0 with baseline 2.15 and existing 2.x cases\",\"blocking\":true,\"expected_result\":\"Targets are 19.3.0, 20.3.0, 21.3.0, 22.3.0 with *.2.15 baselines; x.0 without an explicit baseline is rejected; existing tests stay green\",\"id\":\"AC-035\",\"requirement_refs\":[\"R-023\"],\"statement\":\"Running release tooling tests for 3.0 with baseline 2.15 and existing 2.x cases -> Targets are 19.3.0, 20.3.0, 21.3.0, 22.3.0 with *.2.15 baselines; x.0 without an explicit baseline is rejected; existing tests stay green\",\"task_refs\":[\"TASK-026\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Reviewing CHANGELOG, READMEs and derived workspaces after npm run sync\",\"blocking\":true,\"expected_result\":\"CHANGELOG [Unreleased] has a BREAKING section with migration diffs; README parity and check:sync pass; the mojibake scan is clean\",\"id\":\"AC-036\",\"requirement_refs\":[\"R-024\"],\"statement\":\"Reviewing CHANGELOG, READMEs and derived workspaces after npm run sync -> CHANGELOG [Unreleased] has a BREAKING section with migration diffs; README parity and check:sync pass; the mojibake scan is clean\",\"task_refs\":[\"TASK-029\",\"TASK-030\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Running v19 Karma with coverage, the library build and the showcase build\",\"blocking\":true,\"expected_result\":\"All pass with coverage thresholds met\",\"id\":\"AC-037\",\"requirement_refs\":[\"R-024\"],\"statement\":\"Running v19 Karma with coverage, the library build and the showcase build -> All pass with coverage thresholds met\",\"task_refs\":[\"TASK-030\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Installing and building v20, v21 and v22\",\"blocking\":true,\"expected_result\":\"All derived lines build; executed at the release-cut gate\",\"id\":\"AC-038\",\"requirement_refs\":[\"R-024\"],\"statement\":\"Installing and building v20, v21 and v22 -> All derived lines build; executed at the release-cut gate\",\"task_refs\":[\"TASK-030\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"deferred\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"Consumers with max set lose exports above the limit until they raise it.\",\"evidence_refs\":[\"EVIDENCE-004\"],\"id\":\"A-001\",\"impacted_refs\":[\"R-001\"],\"owner\":\"release owner\",\"rationale\":\"Legacy source and 2.15 never read export.max.\",\"source\":\"inferred\",\"statement\":\"No consumer depends on export.max being ignored, because neither Legacy nor 2.15 ever enforced it.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"Changelog BREAKING entry and code search of max usage in known consumers.\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"The output filter is still required as defence in depth; only test fixtures change.\",\"evidence_refs\":[\"EVIDENCE-003\",\"EVIDENCE-008\"],\"id\":\"A-002\",\"impacted_refs\":[\"R-004\"],\"owner\":\"implementer\",\"rationale\":\"Observed in ckeditor5-link data downcast during review.\",\"source\":\"inferred\",\"statement\":\"CKEditor 5 data output keeps javascript: hrefs and the mini-editor Link plugin accepts any protocol without allowedProtocols.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"RED unit test against the real editor build before implementing the filter.\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"The spec must be revised through change control for a custom listbox.\",\"evidence_refs\":[\"EVIDENCE-024\"],\"id\":\"A-003\",\"impacted_refs\":[\"R-010\",\"R-011\"],\"owner\":\"implementer\",\"rationale\":\"Known limitations exist; a spike isolates the risk.\",\"source\":\"inferred\",\"statement\":\"CDK virtual scrolling can be combined with mat-select and mat-autocomplete while keeping keyboard navigation and multi-select values.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"A spike task runs first and must pass AC-021/AC-022 probes before rollout.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Material dark must use per-line shims or be documented as consumer-configured.\",\"evidence_refs\":[\"EVIDENCE-013\"],\"id\":\"A-004\",\"impacted_refs\":[\"R-017\"],\"owner\":\"implementer\",\"rationale\":\"Material M3 mat.theme exposes theme-type.\",\"source\":\"inferred\",\"statement\":\"Angular Material 19-22 mat.theme supports theme-type dark inside a scoped selector.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"Theme compile test on v19 and derived-line builds at release cut.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Visual regressions appear in migrated components.\",\"evidence_refs\":[\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\",\"EVIDENCE-020\",\"EVIDENCE-021\"],\"id\":\"A-005\",\"impacted_refs\":[\"R-015\",\"R-019\"],\"owner\":\"implementer\",\"rationale\":\"Exact-value mapping is the migration rule.\",\"source\":\"defaulted\",\"statement\":\"Replacing literals and hex values only with tokens of identical value produces no visual change.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"Theme snapshot tests, computed-style spot checks and manual showcase review.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Visual checks could be automated instead.\",\"evidence_refs\":[\"EVIDENCE-012\",\"EVIDENCE-027\"],\"id\":\"A-006\",\"impacted_refs\":[\"R-008\",\"R-022\"],\"owner\":\"user\",\"rationale\":\"The Playwright integration failed to connect in this session.\",\"source\":\"explicit\",\"statement\":\"No browser automation is available, so visual verification of showcase pages is manual.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"Manual showcase review by the user.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Verification cannot run until the toolchain is fixed.\",\"evidence_refs\":[\"EVIDENCE-001\"],\"id\":\"A-007\",\"impacted_refs\":[\"R-024\"],\"owner\":\"implementer\",\"rationale\":\"Repository requires the exact Node version.\",\"source\":\"explicit\",\"statement\":\"Node 22.22.3 via fnm and npm ci --legacy-peer-deps work for v19 and the showcase in the worktree.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"fnm list shows v22.22.3; install runs in the first plan task.\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-010\",\"R-011\",\"AC-020\",\"AC-021\",\"AC-022\"],\"id\":\"D-001\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Virtual scroll scope\",\"rationale\":\"User choice; limits blast radius.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sd-select and sd-autocomplete only, opt-in input, default off; sd-table unchanged\",\"source\":\"explicit-user\",\"statement\":\"Virtual scroll scope: sd-select and sd-autocomplete only, opt-in input, default off; sd-table unchanged\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-024\",\"TASK-025\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\"],\"id\":\"D-002\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Dark theme activation\",\"rationale\":\"User choice.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Opt-in scope [data-sd-theme=dark] for Core and Material, plus mode auto following prefers-color-scheme\",\"source\":\"explicit-user\",\"statement\":\"Dark theme activation: Opt-in scope [data-sd-theme=dark] for Core and Material, plus mode auto following prefers-color-scheme\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-004\",\"AC-009\",\"AC-010\"],\"id\":\"D-003\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Editor output policy\",\"rationale\":\"User choice; full sanitizer would strip styles.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"link.allowedProtocols https/http/mailto/tel plus a light output filter keeping formatting\",\"source\":\"explicit-user\",\"statement\":\"Editor output policy: link.allowedProtocols https/http/mailto/tel plus a light output filter keeping formatting\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-008\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-023\",\"R-024\",\"AC-035\",\"AC-038\"],\"id\":\"D-004\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Branch and release boundary\",\"rationale\":\"User choice.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"Worktree branch release/3.0 from origin/main; stop before release cut, tag and publish\",\"source\":\"explicit-user\",\"statement\":\"Branch and release boundary: Worktree branch release/3.0 from origin/main; stop before release cut, tag and publish\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-001\",\"TASK-029\",\"TASK-030\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-001\",\"AC-002\"],\"id\":\"D-005\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"export.max semantics\",\"rationale\":\"User accepted default; safer than silent truncation.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Block the export and warn when rows exceed max\",\"source\":\"explicit-user\",\"statement\":\"export.max semantics: Block the export and warn when rows exceed max\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\",\"TASK-004\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-002\",\"AC-003\",\"AC-004\"],\"id\":\"D-006\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Toast announcement model\",\"rationale\":\"User accepted default; dynamic regions are often missed.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Persistent polite and assertive live regions in the container; pause on hover and focus\",\"source\":\"explicit-user\",\"statement\":\"Toast announcement model: Persistent polite and assertive live regions in the container; pause on hover and focus\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\",\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-003\",\"AC-006\"],\"id\":\"D-007\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Tooltip scope\",\"rationale\":\"User accepted default; MatTooltip already meets 1.4.13.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Fix sd-tooltip only; MatTooltip usages stay unchanged\",\"source\":\"explicit-user\",\"statement\":\"Tooltip scope: Fix sd-tooltip only; MatTooltip usages stay unchanged\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-005\",\"AC-011\",\"AC-012\"],\"id\":\"D-008\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"URL allow-list\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Allow https, http, relative, blob, data:image/*, data:application/pdf; block everything else\",\"source\":\"explicit-user\",\"statement\":\"URL allow-list: Allow https, http, relative, blob, data:image/*, data:application/pdf; block everything else\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"AC-013\"],\"id\":\"D-009\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Scroll-lock compensation\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"padding-right equal to scrollbar width on the side-drawer lock service; container mode skipped\",\"source\":\"explicit-user\",\"statement\":\"Scroll-lock compensation: padding-right equal to scrollbar width on the side-drawer lock service; container mode skipped\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-014\"],\"id\":\"D-010\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Locale source\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"I18nService.locale() signal with a single language-to-BCP-47 map\",\"source\":\"explicit-user\",\"statement\":\"Locale source: I18nService.locale() signal with a single language-to-BCP-47 map\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-010\",\"TASK-012\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-008\",\"AC-015\",\"AC-016\"],\"id\":\"D-011\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Preview video placement\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sd-preview-video inside the components/preview entry point, integrated into the file-explorer detail\",\"source\":\"explicit-user\",\"statement\":\"Preview video placement: sd-preview-video inside the components/preview entry point, integrated into the file-explorer detail\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\",\"TASK-012\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-009\",\"AC-018\",\"AC-019\"],\"id\":\"D-012\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Highlight delivery\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Utilities in utilities/extensions plus a new sd-highlight component; no adoption in other components yet\",\"source\":\"explicit-user\",\"statement\":\"Highlight delivery: Utilities in utilities/extensions plus a new sd-highlight component; no adoption in other components yet\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-011\",\"TASK-028\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-015\",\"R-019\",\"AC-026\",\"AC-030\"],\"id\":\"D-014\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Literal migration rule\",\"rationale\":\"User accepted default; guarantees no visual change.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Replace literals and hex only with tokens of identical value; add a token when none exists\",\"source\":\"explicit-user\",\"statement\":\"Literal migration rule: Replace literals and hex only with tokens of identical value; add a token when none exists\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-016\",\"AC-027\"],\"id\":\"D-015\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Ramp generation\",\"rationale\":\"User accepted default; consumer overrides propagate.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"color-mix at runtime from base tokens; -light/-dark/-contrast keep their current values\",\"source\":\"explicit-user\",\"statement\":\"Ramp generation: color-mix at runtime from base tokens; -light/-dark/-contrast keep their current values\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-018\",\"AC-029\"],\"id\":\"D-016\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Hex enforcement tooling\",\"rationale\":\"User accepted default; no new dependency.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"ESLint rule plus a dependency-free SCSS script at error level; var() fallbacks allowed\",\"source\":\"explicit-user\",\"statement\":\"Hex enforcement tooling: ESLint rule plus a dependency-free SCSS script at error level; var() fallbacks allowed\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-016\",\"TASK-022\",\"TASK-023\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-021\",\"AC-032\"],\"id\":\"D-017\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Token export entry point\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"New secondary entry @sdcorejs/angular/utilities/theme\",\"source\":\"explicit-user\",\"statement\":\"Token export entry point: New secondary entry @sdcorejs/angular/utilities/theme\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-015\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-024\",\"AC-037\"],\"id\":\"D-018\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Coverage approach\",\"rationale\":\"Repository rule for components and forms.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"TDD for library components, services and scripts\",\"source\":\"explicit-user\",\"statement\":\"Coverage approach: TDD for library components, services and scripts\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-001\",\"TASK-030\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-023\",\"AC-035\"],\"id\":\"D-019\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Release numbering\",\"rationale\":\"User asked for 3.0; major digit is locked to the Angular line.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"Release suffix 3.0 publishing 19.3.0, 20.3.0, 21.3.0, 22.3.0 against *.2.15\",\"source\":\"explicit-user\",\"statement\":\"Release numbering: Release suffix 3.0 publishing 19.3.0, 20.3.0, 21.3.0, 22.3.0 against *.2.15\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-026\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-013\",\"R-014\",\"R-015\",\"R-016\",\"R-019\",\"AC-024\",\"AC-025\",\"AC-026\",\"AC-027\"],\"id\":\"D-020\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Token tiers and naming\",\"rationale\":\"Independent migration units must pick identical names.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Primitive --sd-{family} and ramps --sd-{family}-{50..950}; semantic --sd-{role}; component tier --sd-{component}-{role} where {component} is the selector without sd- (preview-pdf, file-explorer, code-editor), declared only in themes/_component-tokens.scss; px-named --sd-space-{n} and --sd-radius-{n}; role-named --sd-z-{layer}, --sd-shadow-{xs..xl}, --sd-duration-{fast|base|slow}, --sd-ease-standard; --sd-font-size-{n}, --sd-font-weight-{name}, --sd-line-height-{n}; --sd-focus-ring-{color|width|offset}\",\"source\":\"approved-architecture\",\"statement\":\"Token tiers and naming: Primitive --sd-{family} and ramps --sd-{family}-{50..950}; semantic --sd-{role}; component tier --sd-{component}-{role} where {component} is the selector without sd- (preview-pdf, file-explorer, code-editor), declared only in themes/_component-tokens.scss; px-named --sd-space-{n} and --sd-radius-{n}; role-named --sd-z-{layer}, --sd-shadow-{xs..xl}, --sd-duration-{fast|base|slow}, --sd-ease-standard; --sd-font-size-{n}, --sd-font-weight-{name}, --sd-line-height-{n}; --sd-focus-ring-{color|width|offset}\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\",\"TASK-027\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\",\"INV-008\"],\"id\":\"D-021\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Emission unit and mode semantics\",\"rationale\":\"Custom properties holding var() resolve where declared; a partial or root-only emission leaves stale light values.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"theme() emits the complete declaration set on & only: light keeps the 2.15 declarations and adds new tokens; dark emits the dark set plus color-scheme dark and Material dark colour tokens; auto emits light on & plus @media (prefers-color-scheme: dark) { &:not([data-sd-theme=light]) { dark set } }; every declaration derived from var(--sd-*), including the Material form-field error icon variables, moves inside the emission\",\"source\":\"approved-architecture\",\"statement\":\"Emission unit and mode semantics: theme() emits the complete declaration set on & only: light keeps the 2.15 declarations and adds new tokens; dark emits the dark set plus color-scheme dark and Material dark colour tokens; auto emits light on & plus @media (prefers-color-scheme: dark) { &:not([data-sd-theme=light]) { dark set } }; every declaration derived from var(--sd-*), including the Material form-field error icon variables, moves inside the emission\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\",\"AC-031\"],\"id\":\"D-022\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Dark palette source\",\"rationale\":\"User instruction: keep the generic default preset only and let other presets be added separately; an explicit error prevents silently wrong dark colours.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Dark palette only for the default preset: $default-dark-theme; built-in named presets stay light-only; $preset other than default combined with $mode dark or auto raises a Sass @error that tells consumers to provide their own dark map through $theme; consumer $theme overrides apply on top of the default dark palette; in dark, X-light mixes with --sd-surface and X-dark mixes toward white\",\"source\":\"approved-architecture\",\"statement\":\"Dark palette source: Dark palette only for the default preset: $default-dark-theme; built-in named presets stay light-only; $preset other than default combined with $mode dark or auto raises a Sass @error that tells consumers to provide their own dark map through $theme; consumer $theme overrides apply on top of the default dark palette; in dark, X-light mixes with --sd-surface and X-dark mixes toward white\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\",\"TASK-014\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\",\"INV-001\"],\"id\":\"D-023\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Mode delivery and scope limits\",\"rationale\":\"Specificity makes attribute blocks override html-level custom themes, and overlays render outside nested islands.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sd-core.scss keeps html light unchanged and adds [data-sd-theme=dark] (dark) and [data-sd-theme=light] (light, color-scheme light); these built-in blocks cover the default preset with core source only; consumers with a custom theme, preset or material source re-include sd.theme(<same arguments>, $mode: dark) under their dark selector; modes are guaranteed when the attribute is on html; nested islands theme inline content only and overlays follow the document mode; the library never writes data-sd-theme\",\"source\":\"approved-architecture\",\"statement\":\"Mode delivery and scope limits: sd-core.scss keeps html light unchanged and adds [data-sd-theme=dark] (dark) and [data-sd-theme=light] (light, color-scheme light); these built-in blocks cover the default preset with core source only; consumers with a custom theme, preset or material source re-include sd.theme(<same arguments>, $mode: dark) under their dark selector; modes are guaranteed when the attribute is on html; nested islands theme inline content only and overlays follow the document mode; the library never writes data-sd-theme\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\",\"TASK-027\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\",\"INV-001\"],\"id\":\"D-024\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Material dark call\",\"rationale\":\"Material 19 mat.theme emits typography only when configured; light Material CSS stays identical and browser support stays broad.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Inside dark scopes call exactly mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette))) with no typography or density; set color-scheme dark in dark scopes and light in light islands; no theme-type color-scheme or light-dark()\",\"source\":\"approved-architecture\",\"statement\":\"Material dark call: Inside dark scopes call exactly mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette))) with no typography or density; set color-scheme dark in dark scopes and light in light islands; no theme-type color-scheme or light-dark()\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-004\",\"R-005\",\"R-009\",\"AC-010\",\"AC-011\",\"AC-018\"],\"id\":\"D-025\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Shared helper placement and naming\",\"rationale\":\"Entry points cannot import each other; utilities/extensions is the shared public entry and already uses the sd prefix.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Cross-entry helpers live in utilities/extensions with the sd prefix: sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges\",\"source\":\"approved-architecture\",\"statement\":\"Shared helper placement and naming: Cross-entry helpers live in utilities/extensions with the sd prefix: sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-011\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-010\",\"R-011\",\"AC-020\",\"AC-021\",\"AC-022\",\"INV-001\"],\"id\":\"D-026\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Virtual scroll value ownership\",\"rationale\":\"Material key managers only see rendered options and multi-select would drop unrendered values; hidden options for every selected value would render up to 10000 options after select-all.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"With virtualScroll on, the component owns the value: the mat-select/mat-autocomplete shell is not bound to the formControl; user selection events are applied to the component model; rendered options are synced from the model; trigger labels come from selectedItems; array items are not paged by limit; function (SdSearch) results render as returned; pinned-selected ordering and emitted value order match the non-virtual branch; the component intercepts navigation keys, keeps an active index over the full filtered list, calls scrollToIndex before activating, owns aria-activedescendant and runs its own typeahead; Material private APIs are allowed only in one adapter per component covered by specs; default-off branch unchanged\",\"source\":\"approved-architecture\",\"statement\":\"Virtual scroll value ownership: With virtualScroll on, the component owns the value: the mat-select/mat-autocomplete shell is not bound to the formControl; user selection events are applied to the component model; rendered options are synced from the model; trigger labels come from selectedItems; array items are not paged by limit; function (SdSearch) results render as returned; pinned-selected ordering and emitted value order match the non-virtual branch; the component intercepts navigation keys, keeps an active index over the full filtered list, calls scrollToIndex before activating, owns aria-activedescendant and runs its own typeahead; Material private APIs are allowed only in one adapter per component covered by specs; default-off branch unchanged\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-024\",\"TASK-025\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-002\",\"AC-003\"],\"id\":\"D-027\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Toast announcement ownership\",\"rationale\":\"One owner prevents double announcements and survives toast removal.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"The toast container template owns two persistent visually hidden regions (polite with data-autoid services-notify-live-polite, assertive with services-notify-live-assertive); the notify service announces through the container; toast elements carry no aria-live\",\"source\":\"approved-architecture\",\"statement\":\"Toast announcement ownership: The toast container template owns two persistent visually hidden regions (polite with data-autoid services-notify-live-polite, assertive with services-notify-live-assertive); the notify service announces through the container; toast elements carry no aria-live\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-023\",\"AC-035\"],\"id\":\"D-028\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Release x.0 mechanism\",\"rationale\":\"Keeps every 2.x rule, makes 3.0 expressible, and leaves release-cut artifacts to the approved release step.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"releaseTargets(suffix, { baselineSuffix }); patch 0 requires an explicit baseline with a lower minor, patch > 0 keeps patch - 1; loadReleaseContract reads baselineSuffix from scripts/release-contracts/<suffix>.json and passes it to materializeValidatedBundle/validateReleaseBundle; the baseline invariant compares with targets[].baselineVersion; deploy.ps1 gains -BaselineSuffix; tests cover 3.0 in release-package-contract, collect-release-docs, generate-showcase-changelog and build-published-page retention; publish-npm.yml pins, its retention assertion and the approved 3.0.json snapshot belong to the release cut\",\"source\":\"approved-architecture\",\"statement\":\"Release x.0 mechanism: releaseTargets(suffix, { baselineSuffix }); patch 0 requires an explicit baseline with a lower minor, patch > 0 keeps patch - 1; loadReleaseContract reads baselineSuffix from scripts/release-contracts/<suffix>.json and passes it to materializeValidatedBundle/validateReleaseBundle; the baseline invariant compares with targets[].baselineVersion; deploy.ps1 gains -BaselineSuffix; tests cover 3.0 in release-package-contract, collect-release-docs, generate-showcase-changelog and build-published-page retention; publish-npm.yml pins, its retention assertion and the approved 3.0.json snapshot belong to the release cut\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-026\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"R-019\",\"AC-030\",\"AC-031\"],\"id\":\"D-029\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Component token and host alias rule\",\"rationale\":\"A :host declaration would override the global dark value; aliases keep existing hooks.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Map a hex to a semantic or ramp token when values are identical; otherwise add --sd-{component}-{role} in themes/_component-tokens.scss with light value equal to the old hex and an explicit contrast-checked dark value; :host blocks may no longer hold hex and may only alias existing local names (--sd-pdf-*, --sd-fe-*, --sd-preview-*) to global tokens so consumer hooks keep working\",\"source\":\"approved-architecture\",\"statement\":\"Component token and host alias rule: Map a hex to a semantic or ramp token when values are identical; otherwise add --sd-{component}-{role} in themes/_component-tokens.scss with light value equal to the old hex and an explicit contrast-checked dark value; :host blocks may no longer hold hex and may only alias existing local names (--sd-pdf-*, --sd-fe-*, --sd-preview-*) to global tokens so consumer hooks keep working\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"decision\"},{\"blocking\":false,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-010\",\"R-011\",\"AC-021\",\"AC-022\"],\"id\":\"D-030\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Virtual scroll shell strategy\",\"rationale\":\"Only the spike can show whether the Material shell satisfies AC-021/AC-022 across Angular lines.\",\"revisit_condition\":\"Resolved by the virtual-scroll spike task before any rollout task; the chosen variant is recorded in the plan execution evidence.\",\"scope\":\"public-contract\",\"selected_value\":\"V1: keep the Material shell with a single hidden sentinel option so the trigger renders while the component owns the value; V2: a component-owned listbox panel if V1 fails the spike probes\",\"source\":\"approved-architecture\",\"statement\":\"Virtual scroll shell strategy: V1: keep the Material shell with a single hidden sentinel option so the trigger renders while the component owns the value; V2: a component-owned listbox panel if V1 fails the spike probes\",\"status\":\"deferred\",\"supersedes\":null,\"task_refs\":[\"TASK-024\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-013\",\"AC-024\",\"INV-001\"],\"id\":\"D-031\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Focus ring application rule\",\"rationale\":\"Keeps light appearance and public hooks while giving every focus colour a token source.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"--sd-focus-ring-color defaults to var(--sd-primary), width 2px, offset 2px; only outline declarations change: existing component hooks keep precedence as var(<hook>, var(--sd-focus-ring-color)); always-dark surfaces use a component token; widths and offsets other than 2px stay local; outline none with box-shadow focus stays allowed; private tokens are never redefined\",\"source\":\"approved-architecture\",\"statement\":\"Focus ring application rule: --sd-focus-ring-color defaults to var(--sd-primary), width 2px, offset 2px; only outline declarations change: existing component hooks keep precedence as var(<hook>, var(--sd-focus-ring-color)); always-dark surfaces use a component token; widths and offsets other than 2px stay local; outline none with box-shadow focus stays allowed; private tokens are never redefined\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-004\",\"AC-009\",\"AC-010\",\"INV-006\"],\"id\":\"D-032\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Editor sanitizer policy\",\"rationale\":\"A denylist is not fail-closed, re-serialising clean HTML would create false diffs, and getHtmlContent() bypassed the filter.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sdSanitizeEditorHtml uses an allowlist of CKEditor output tags and attributes; removes script, style, iframe, frame, object, embed, applet, base, meta, link, form controls, template and SVG animation/use/foreignObject elements with content; href allows http, https, mailto, tel, relative and #fragment; img src allows http, https, relative and data:image/*; srcset candidates follow img src; any other URL-bearing attribute is removed; returns the original string when nothing is removed and is idempotent; without DOMParser it returns HTML-escaped text; applied at editor #onEditorUserInput and #getFromEditor and mini-editor #convertOutput and getHtmlContent(); Markdown mode sanitizes HTML before conversion; content that loses constructs is written back once and marks the control dirty\",\"source\":\"approved-architecture\",\"statement\":\"Editor sanitizer policy: sdSanitizeEditorHtml uses an allowlist of CKEditor output tags and attributes; removes script, style, iframe, frame, object, embed, applet, base, meta, link, form controls, template and SVG animation/use/foreignObject elements with content; href allows http, https, mailto, tel, relative and #fragment; img src allows http, https, relative and data:image/*; srcset candidates follow img src; any other URL-bearing attribute is removed; returns the original string when nothing is removed and is idempotent; without DOMParser it returns HTML-escaped text; applied at editor #onEditorUserInput and #getFromEditor and mini-editor #convertOutput and getHtmlContent(); Markdown mode sanitizes HTML before conversion; content that loses constructs is written back once and marks the control dirty\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-008\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-005\",\"AC-011\",\"AC-012\",\"INV-006\"],\"id\":\"D-033\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"URL guard specifics\",\"rationale\":\"Aligns with existing url-safety helpers and keeps download/media policy separate from editor link policy.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sdIsSafeResourceUrl reuses sdParseUrl/sdResolveBaseOrigin (SSR-safe); allows http and https without embedded credentials, relative URLs resolved against the base origin, blob:, data:image/* and data:application/pdf; everything else, including mailto and tel, is refused for downloads, media and window navigation\",\"source\":\"approved-architecture\",\"statement\":\"URL guard specifics: sdIsSafeResourceUrl reuses sdParseUrl/sdResolveBaseOrigin (SSR-safe); allows http and https without embedded credentials, relative URLs resolved against the base origin, blob:, data:image/* and data:application/pdf; everything else, including mailto and tel, is refused for downloads, media and window navigation\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-003\",\"AC-006\",\"AC-007\",\"AC-008\"],\"id\":\"D-034\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Tooltip interaction mechanics\",\"rationale\":\"A dialog listening on body would otherwise close first; a permanent capture listener would repeat the DS defect.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Focus shows through the existing activeTooltip singleton and blur hides; while visible, a capture-phase document keydown listener handles only Escape, hides the tooltip and stops propagation only when it hid one, and is removed on hide; the bubble root has role tooltip and a unique id; the directive adds and removes only its own id in the host aria-describedby; the sdTooltipColor default becomes var(--sd-tooltip-bg)\",\"source\":\"approved-architecture\",\"statement\":\"Tooltip interaction mechanics: Focus shows through the existing activeTooltip singleton and blur hides; while visible, a capture-phase document keydown listener handles only Escape, hides the tooltip and stops propagation only when it hid one, and is removed on hide; the bubble root has role tooltip and a unique id; the directive adds and removes only its own id in the host aria-describedby; the sdTooltipColor default becomes var(--sd-tooltip-bg)\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":false,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-002\",\"R-003\",\"R-004\",\"R-005\",\"R-006\",\"R-007\",\"R-008\",\"R-009\",\"R-010\",\"R-011\",\"R-013\",\"R-014\",\"R-015\",\"R-016\",\"R-017\",\"R-018\",\"R-019\",\"R-020\",\"R-021\",\"R-022\",\"R-023\",\"R-024\",\"AC-001\",\"AC-002\",\"AC-003\",\"AC-004\",\"AC-005\",\"AC-006\",\"AC-007\",\"AC-008\",\"AC-009\",\"AC-010\",\"AC-011\",\"AC-012\",\"AC-013\",\"AC-014\",\"AC-015\",\"AC-016\",\"AC-017\",\"AC-018\",\"AC-019\",\"AC-020\",\"AC-021\",\"AC-022\",\"AC-024\",\"AC-025\",\"AC-026\",\"AC-027\",\"AC-028\",\"AC-029\",\"AC-030\",\"AC-031\",\"AC-032\",\"AC-033\",\"AC-034\",\"AC-035\",\"AC-036\",\"AC-037\",\"AC-038\",\"INV-001\",\"INV-002\",\"INV-003\",\"INV-004\",\"INV-005\",\"INV-006\",\"INV-007\",\"INV-008\"],\"id\":\"D-035\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Validation boundary\",\"rationale\":\"The release changes a client-side UI library with no server authorization surface.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"none for every requirement, acceptance criterion and invariant of this release\",\"source\":\"approved-plan\",\"statement\":\"Validation boundary: no authorization boundary in release 3.0\",\"status\":\"proposed\",\"supersedes\":null,\"task_refs\":[\"TASK-030\"],\"type\":\"decision\",\"validation_boundary\":{\"kind\":\"none\",\"source_refs\":[\"R-001\",\"R-002\",\"R-003\",\"R-004\",\"R-005\",\"R-006\",\"R-007\",\"R-008\",\"R-009\",\"R-010\",\"R-011\",\"R-013\",\"R-014\",\"R-015\",\"R-016\",\"R-017\",\"R-018\",\"R-019\",\"R-020\",\"R-021\",\"R-022\",\"R-023\",\"R-024\",\"AC-001\",\"AC-002\",\"AC-003\",\"AC-004\",\"AC-005\",\"AC-006\",\"AC-007\",\"AC-008\",\"AC-009\",\"AC-010\",\"AC-011\",\"AC-012\",\"AC-013\",\"AC-014\",\"AC-015\",\"AC-016\",\"AC-017\",\"AC-018\",\"AC-019\",\"AC-020\",\"AC-021\",\"AC-022\",\"AC-024\",\"AC-025\",\"AC-026\",\"AC-027\",\"AC-028\",\"AC-029\",\"AC-030\",\"AC-031\",\"AC-032\",\"AC-033\",\"AC-034\",\"AC-035\",\"AC-036\",\"AC-037\",\"AC-038\",\"INV-001\",\"INV-002\",\"INV-003\",\"INV-004\",\"INV-005\",\"INV-006\",\"INV-007\",\"INV-008\"]}},{\"evidence_refs\":[\"EVIDENCE-013\",\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\",\"EVIDENCE-020\",\"EVIDENCE-021\",\"EVIDENCE-024\",\"EVIDENCE-025\"],\"id\":\"INV-001\",\"protected_refs\":[\"R-010\",\"R-011\",\"R-017\",\"AC-020\",\"AC-022\",\"AC-028\"],\"statement\":\"When no new opt-in input or mode is used, rendering and behaviour match 2.15.\",\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\",\"TASK-024\",\"TASK-025\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-026\",\"EVIDENCE-029\",\"EVIDENCE-030\"],\"id\":\"INV-002\",\"protected_refs\":[\"R-024\",\"AC-036\"],\"statement\":\"Shared library changes are authored in versions/v19 and propagated only with npm run sync; check:sync passes.\",\"task_refs\":[\"TASK-026\",\"TASK-029\",\"TASK-030\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-003\",\"EVIDENCE-016\",\"EVIDENCE-023\",\"EVIDENCE-024\",\"EVIDENCE-030\"],\"id\":\"INV-003\",\"protected_refs\":[\"R-004\",\"R-010\",\"R-018\"],\"statement\":\"No new npm dependency is added; virtual scrolling uses the existing @angular/cdk peer.\",\"task_refs\":[\"TASK-003\",\"TASK-016\",\"TASK-023\",\"TASK-024\",\"TASK-030\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-013\",\"EVIDENCE-015\",\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\",\"EVIDENCE-020\",\"EVIDENCE-021\"],\"id\":\"INV-004\",\"protected_refs\":[\"R-014\",\"R-015\",\"R-016\",\"R-019\",\"AC-027\",\"AC-030\"],\"statement\":\"Existing --sd-* token names and light-mode values, including -light/-dark/-contrast, remain available and unchanged.\",\"task_refs\":[\"TASK-013\",\"TASK-015\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-002\",\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-010\",\"EVIDENCE-012\",\"EVIDENCE-030\"],\"id\":\"INV-005\",\"protected_refs\":[\"R-001\",\"R-002\",\"R-008\",\"AC-001\",\"AC-005\",\"AC-015\"],\"statement\":\"Every new user-facing string goes through I18nService with keys in all five catalogs.\",\"task_refs\":[\"TASK-002\",\"TASK-004\",\"TASK-005\",\"TASK-010\",\"TASK-012\",\"TASK-030\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-003\",\"EVIDENCE-007\",\"EVIDENCE-008\",\"EVIDENCE-011\",\"EVIDENCE-012\"],\"id\":\"INV-006\",\"protected_refs\":[\"R-004\",\"R-005\",\"AC-010\",\"AC-012\"],\"statement\":\"URL and HTML guards fail closed: an unrecognised scheme or attribute is removed or blocked.\",\"task_refs\":[\"TASK-003\",\"TASK-007\",\"TASK-008\",\"TASK-011\",\"TASK-012\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-016\",\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\",\"EVIDENCE-020\",\"EVIDENCE-021\",\"EVIDENCE-022\",\"EVIDENCE-023\"],\"id\":\"INV-007\",\"protected_refs\":[\"R-018\",\"R-019\",\"AC-029\",\"AC-030\"],\"statement\":\"Library components reference colours only through var(--sd-*) tokens; hex literals exist only in themes and documented exemptions.\",\"task_refs\":[\"TASK-016\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\",\"TASK-022\",\"TASK-023\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-013\",\"EVIDENCE-014\",\"EVIDENCE-023\"],\"id\":\"INV-008\",\"protected_refs\":[\"R-017\",\"AC-028\"],\"statement\":\"Every declaration emitted by theme() for light, including declarations derived from var(--sd-*), is emitted again with a dark value in every dark scope.\",\"task_refs\":[\"TASK-013\",\"TASK-014\",\"TASK-023\"],\"type\":\"invariant\"}],\"revision\":6,\"schema_version\":1}\n"
  }
 },
 "goal_backward_review": {
  "schema_version": 1,
  "mode": "sdcorejs-plan:goal-backward",
  "decision_coverage": {
   "schema_version": 1,
   "revision": 6,
   "records": [
    {
     "id": "R-001",
     "type": "requirement",
     "statement": "sd-table export honours export.max: when the rows to export exceed max, export does not start and an i18n warning names the limit.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-002",
      "TASK-004"
     ]
    },
    {
     "id": "R-002",
     "type": "requirement",
     "statement": "Toast notifications are announced through persistent polite/assertive live regions, pause auto-dismiss on hover and keyboard focus, and expose typed, labelled buttons.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-002",
      "TASK-005"
     ]
    },
    {
     "id": "R-003",
     "type": "requirement",
     "statement": "sd-tooltip meets WCAG 1.4.13: shows on focus, hides on blur, Escape dismisses, bubble is hoverable, role=tooltip with aria-describedby, token colour.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-006"
     ]
    },
    {
     "id": "R-004",
     "type": "requirement",
     "statement": "sd-mini-editor restricts link protocols and both editors emit HTML filtered of script URLs, non-image data URLs and on* attributes while keeping formatting.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-003",
      "TASK-008"
     ]
    },
    {
     "id": "R-005",
     "type": "requirement",
     "statement": "A shared URL scheme guard blocks unsafe download/open URLs in SdUtilities.download, preview-image, preview-pdf, upload-file and preview-video.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-003",
      "TASK-007"
     ]
    },
    {
     "id": "R-006",
     "type": "requirement",
     "statement": "The side-drawer body scroll lock compensates the scrollbar width with padding-right and restores it on final release, except in container mode.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-009"
     ]
    },
    {
     "id": "R-007",
     "type": "requirement",
     "statement": "I18nService exposes a BCP-47 locale signal; hard-coded vi-VN formatting in library code and the duplicate locale maps are replaced by it.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-010",
      "TASK-012"
     ]
    },
    {
     "id": "R-008",
     "type": "requirement",
     "statement": "A new sd-preview-video component in the preview entry point plays video with error/retry state, is used by the file-explorer detail, and ships md docs plus a showcase demo.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-002",
      "TASK-012",
      "TASK-028"
     ]
    },
    {
     "id": "R-009",
     "type": "requirement",
     "statement": "Diacritic-insensitive helpers sdNormalizeSearchText and sdFindHighlightRanges plus an sd-highlight component render matches safely without innerHTML or regex built from input.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-003",
      "TASK-011",
      "TASK-028"
     ]
    },
    {
     "id": "R-010",
     "type": "requirement",
     "statement": "sd-select supports opt-in virtual scrolling (default off) preserving keyboard navigation, selected display, multi-select values and select-all.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-024"
     ]
    },
    {
     "id": "R-011",
     "type": "requirement",
     "statement": "sd-autocomplete supports opt-in virtual scrolling (default off) preserving keyboard navigation and selection.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-024",
      "TASK-025"
     ]
    },
    {
     "id": "R-013",
     "type": "requirement",
     "statement": "Focus ring tokens exist (colour defaults to var(--sd-primary)); every focus outline colour comes from the shared token, a documented component hook falling back to it, or a component token for always-dark surfaces; no hex remains in focus rules.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-013",
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
    },
    {
     "id": "R-014",
     "type": "requirement",
     "statement": "The semantic token layer adds status bg/fg, link, surface-inverse, text-on-solid, border-focus, border-danger and overlay-backdrop tokens.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-013"
     ]
    },
    {
     "id": "R-015",
     "type": "requirement",
     "statement": "Non-colour tokens (space, radius, shadow, z-index, motion, typography) exist as CSS variables and exact-matching literals use them.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-013",
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
    },
    {
     "id": "R-016",
     "type": "requirement",
     "statement": "Colour ramps 50-950 are generated at runtime for the main colour families while existing -light/-dark/-contrast values stay unchanged.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-013"
     ]
    },
    {
     "id": "R-017",
     "type": "requirement",
     "statement": "An opt-in dark theme covers Core tokens and Material, scoped by [data-sd-theme=dark], with an auto mode following prefers-color-scheme.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-013"
     ]
    },
    {
     "id": "R-018",
     "type": "requirement",
     "statement": "Hex colour literals are rejected by lint in library TS/templates and by a dependency-free SCSS check, both enforced in CI.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-016",
      "TASK-022",
      "TASK-023"
     ]
    },
    {
     "id": "R-019",
     "type": "requirement",
     "statement": "Raw hex colours in library SCSS and TS outside documented exemptions are replaced by tokens with identical values.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-013",
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
    },
    {
     "id": "R-020",
     "type": "requirement",
     "statement": "Theme contrast tests run in CI and cover default, every existing preset and dark mode.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-014",
      "TASK-023"
     ]
    },
    {
     "id": "R-021",
     "type": "requirement",
     "statement": "A new entry point @sdcorejs/angular/utilities/theme exposes readSdTokens and the SdColorToken type.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-015"
     ]
    },
    {
     "id": "R-022",
     "type": "requirement",
     "statement": "A showcase Theme & tokens guide and a published THEME.md document tokens, ramps, contrast and dark mode; the STYLE-GUIDE is updated.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-027",
      "TASK-028"
     ]
    },
    {
     "id": "R-023",
     "type": "requirement",
     "statement": "Release tooling accepts an x.0 suffix with an explicit baseline so 3.0 targets 19.3.0/20.3.0/21.3.0/22.3.0 against *.2.15.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-026"
     ]
    },
    {
     "id": "R-024",
     "type": "requirement",
     "statement": "Docs, changelog (with a BREAKING section and migration), npm README parity and v20-v22 rollout are delivered with the change.",
     "source": "explicit-user",
     "status": "active",
     "owner_repository_id": "sdcorejs-angular",
     "owner_module_id": null,
     "task_refs": [
      "TASK-001",
      "TASK-029",
      "TASK-030"
     ]
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
     "task_refs": [
      "TASK-004"
     ]
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
     "task_refs": [
      "TASK-004"
     ]
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
     "task_refs": [
      "TASK-005"
     ]
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
     "task_refs": [
      "TASK-005"
     ]
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
     "task_refs": [
      "TASK-005"
     ]
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
     "task_refs": [
      "TASK-006"
     ]
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
     "task_refs": [
      "TASK-006"
     ]
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
     "task_refs": [
      "TASK-006"
     ]
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
     "task_refs": [
      "TASK-008"
     ]
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
     "task_refs": [
      "TASK-003",
      "TASK-008"
     ]
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
     "task_refs": [
      "TASK-003"
     ]
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
     "task_refs": [
      "TASK-003",
      "TASK-007"
     ]
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
     "task_refs": [
      "TASK-009"
     ]
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
     "task_refs": [
      "TASK-010",
      "TASK-012"
     ]
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
     "task_refs": [
      "TASK-012"
     ]
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
     "task_refs": [
      "TASK-012"
     ]
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
     "task_refs": [
      "TASK-012"
     ]
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
     "task_refs": [
      "TASK-003"
     ]
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
     "task_refs": [
      "TASK-011"
     ]
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
     "task_refs": [
      "TASK-024"
     ]
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
     "task_refs": [
      "TASK-024"
     ]
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
     "task_refs": [
      "TASK-025"
     ]
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
     "task_refs": [
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
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
     "task_refs": [
      "TASK-013"
     ]
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
     "task_refs": [
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
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
     "task_refs": [
      "TASK-013"
     ]
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
     "task_refs": [
      "TASK-013"
     ]
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
     "task_refs": [
      "TASK-016",
      "TASK-022",
      "TASK-023"
     ]
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
     "task_refs": [
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
    },
    {
     "id": "AC-031",
     "type": "acceptance-criterion",
     "statement": "Running test:scripts in CI with a contrast pair lowered below threshold -> contrast matrix for default, presets and dark fails on the lowered pair",
     "behavior": "Running test:scripts in CI with a contrast pair lowered below threshold",
     "expected_result": "test:theme runs inside test:scripts, covers the pair matrix for default, existing presets and dark, and fails on the lowered pair",
     "verification_kind": "automated",
     "blocking": true,
     "requirement_refs": [
      "R-020"
     ],
     "task_refs": [
      "TASK-014",
      "TASK-023"
     ]
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
     "task_refs": [
      "TASK-015"
     ]
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
     "task_refs": [
      "TASK-028"
     ]
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
     "task_refs": [
      "TASK-027"
     ]
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
     "task_refs": [
      "TASK-026"
     ]
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
     "task_refs": [
      "TASK-029",
      "TASK-030"
     ]
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
     "task_refs": [
      "TASK-030"
     ]
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
     "task_refs": [
      "TASK-030"
     ]
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
      "EVIDENCE-004"
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
      "EVIDENCE-003",
      "EVIDENCE-008"
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
      "EVIDENCE-024"
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
      "EVIDENCE-013"
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
      "EVIDENCE-017",
      "EVIDENCE-018",
      "EVIDENCE-019",
      "EVIDENCE-020",
      "EVIDENCE-021"
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
      "EVIDENCE-012",
      "EVIDENCE-027"
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
      "EVIDENCE-001"
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
     "task_refs": [
      "TASK-024",
      "TASK-025"
     ]
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
     "task_refs": [
      "TASK-013"
     ]
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
     "task_refs": [
      "TASK-008"
     ]
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
     "task_refs": [
      "TASK-001",
      "TASK-029",
      "TASK-030"
     ]
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
     "task_refs": [
      "TASK-002",
      "TASK-004"
     ]
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
     "task_refs": [
      "TASK-002",
      "TASK-005"
     ]
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
     "task_refs": [
      "TASK-006"
     ]
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
     "task_refs": [
      "TASK-003",
      "TASK-007"
     ]
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
     "task_refs": [
      "TASK-009"
     ]
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
     "task_refs": [
      "TASK-010",
      "TASK-012"
     ]
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
     "task_refs": [
      "TASK-002",
      "TASK-012"
     ]
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
     "task_refs": [
      "TASK-011",
      "TASK-028"
     ]
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
     "task_refs": [
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
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
     "task_refs": [
      "TASK-013"
     ]
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
     "task_refs": [
      "TASK-016",
      "TASK-022",
      "TASK-023"
     ]
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
     "task_refs": [
      "TASK-015"
     ]
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
     "task_refs": [
      "TASK-001",
      "TASK-030"
     ]
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
     "task_refs": [
      "TASK-026"
     ]
    },
    {
     "id": "D-020",
     "type": "decision",
     "statement": "Token tiers and naming: Primitive --sd-{family} and ramps --sd-{family}-{50..950}; semantic --sd-{role}; component tier --sd-{component}-{role} where {component} is the selector without sd- (preview-pdf, file-explorer, code-editor), declared only in themes/_component-tokens.scss; px-named --sd-space-{n} and --sd-radius-{n}; role-named --sd-z-{layer}, --sd-shadow-{xs..xl}, --sd-duration-{fast|base|slow}, --sd-ease-standard; --sd-font-size-{n}, --sd-font-weight-{name}, --sd-line-height-{n}; --sd-focus-ring-{color|width|offset}",
     "question": "Token tiers and naming",
     "selected_value": "Primitive --sd-{family} and ramps --sd-{family}-{50..950}; semantic --sd-{role}; component tier --sd-{component}-{role} where {component} is the selector without sd- (preview-pdf, file-explorer, code-editor), declared only in themes/_component-tokens.scss; px-named --sd-space-{n} and --sd-radius-{n}; role-named --sd-z-{layer}, --sd-shadow-{xs..xl}, --sd-duration-{fast|base|slow}, --sd-ease-standard; --sd-font-size-{n}, --sd-font-weight-{name}, --sd-line-height-{n}; --sd-focus-ring-{color|width|offset}",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Independent migration units must pick identical names.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-013",
      "R-014",
      "R-015",
      "R-016",
      "R-019",
      "AC-024",
      "AC-025",
      "AC-026",
      "AC-027"
     ],
     "task_refs": [
      "TASK-013",
      "TASK-027"
     ]
    },
    {
     "id": "D-021",
     "type": "decision",
     "statement": "Emission unit and mode semantics: theme() emits the complete declaration set on & only: light keeps the 2.15 declarations and adds new tokens; dark emits the dark set plus color-scheme dark and Material dark colour tokens; auto emits light on & plus @media (prefers-color-scheme: dark) { &:not([data-sd-theme=light]) { dark set } }; every declaration derived from var(--sd-*), including the Material form-field error icon variables, moves inside the emission",
     "question": "Emission unit and mode semantics",
     "selected_value": "theme() emits the complete declaration set on & only: light keeps the 2.15 declarations and adds new tokens; dark emits the dark set plus color-scheme dark and Material dark colour tokens; auto emits light on & plus @media (prefers-color-scheme: dark) { &:not([data-sd-theme=light]) { dark set } }; every declaration derived from var(--sd-*), including the Material form-field error icon variables, moves inside the emission",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Custom properties holding var() resolve where declared; a partial or root-only emission leaves stale light values.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-017",
      "AC-028",
      "INV-008"
     ],
     "task_refs": [
      "TASK-013"
     ]
    },
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
     "id": "D-023",
     "type": "decision",
     "statement": "Mode delivery and scope limits: sd-core.scss keeps html light unchanged and adds [data-sd-theme=dark] (dark) and [data-sd-theme=light] (light, color-scheme light); these built-in blocks cover the default preset with core source only; consumers with a custom theme, preset or material source re-include sd.theme(<same arguments>, $mode: dark) under their dark selector; modes are guaranteed when the attribute is on html; nested islands theme inline content only and overlays follow the document mode; the library never writes data-sd-theme",
     "question": "Mode delivery and scope limits",
     "selected_value": "sd-core.scss keeps html light unchanged and adds [data-sd-theme=dark] (dark) and [data-sd-theme=light] (light, color-scheme light); these built-in blocks cover the default preset with core source only; consumers with a custom theme, preset or material source re-include sd.theme(<same arguments>, $mode: dark) under their dark selector; modes are guaranteed when the attribute is on html; nested islands theme inline content only and overlays follow the document mode; the library never writes data-sd-theme",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Specificity makes attribute blocks override html-level custom themes, and overlays render outside nested islands.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-017",
      "AC-028",
      "INV-001"
     ],
     "task_refs": [
      "TASK-013",
      "TASK-027"
     ]
    },
    {
     "id": "D-024",
     "type": "decision",
     "statement": "Material dark call: Inside dark scopes call exactly mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette))) with no typography or density; set color-scheme dark in dark scopes and light in light islands; no theme-type color-scheme or light-dark()",
     "question": "Material dark call",
     "selected_value": "Inside dark scopes call exactly mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette))) with no typography or density; set color-scheme dark in dark scopes and light in light islands; no theme-type color-scheme or light-dark()",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Material 19 mat.theme emits typography only when configured; light Material CSS stays identical and browser support stays broad.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-017",
      "AC-028",
      "INV-001"
     ],
     "task_refs": [
      "TASK-013"
     ]
    },
    {
     "id": "D-025",
     "type": "decision",
     "statement": "Shared helper placement and naming: Cross-entry helpers live in utilities/extensions with the sd prefix: sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges",
     "question": "Shared helper placement and naming",
     "selected_value": "Cross-entry helpers live in utilities/extensions with the sd prefix: sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Entry points cannot import each other; utilities/extensions is the shared public entry and already uses the sd prefix.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-004",
      "R-005",
      "R-009",
      "AC-010",
      "AC-011",
      "AC-018"
     ],
     "task_refs": [
      "TASK-003",
      "TASK-011"
     ]
    },
    {
     "id": "D-026",
     "type": "decision",
     "statement": "Virtual scroll value ownership: With virtualScroll on, the component owns the value: the mat-select/mat-autocomplete shell is not bound to the formControl; user selection events are applied to the component model; rendered options are synced from the model; trigger labels come from selectedItems; array items are not paged by limit; function (SdSearch) results render as returned; pinned-selected ordering and emitted value order match the non-virtual branch; the component intercepts navigation keys, keeps an active index over the full filtered list, calls scrollToIndex before activating, owns aria-activedescendant and runs its own typeahead; Material private APIs are allowed only in one adapter per component covered by specs; default-off branch unchanged",
     "question": "Virtual scroll value ownership",
     "selected_value": "With virtualScroll on, the component owns the value: the mat-select/mat-autocomplete shell is not bound to the formControl; user selection events are applied to the component model; rendered options are synced from the model; trigger labels come from selectedItems; array items are not paged by limit; function (SdSearch) results render as returned; pinned-selected ordering and emitted value order match the non-virtual branch; the component intercepts navigation keys, keeps an active index over the full filtered list, calls scrollToIndex before activating, owns aria-activedescendant and runs its own typeahead; Material private APIs are allowed only in one adapter per component covered by specs; default-off branch unchanged",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Material key managers only see rendered options and multi-select would drop unrendered values; hidden options for every selected value would render up to 10000 options after select-all.",
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
      "AC-022",
      "INV-001"
     ],
     "task_refs": [
      "TASK-024",
      "TASK-025"
     ]
    },
    {
     "id": "D-027",
     "type": "decision",
     "statement": "Toast announcement ownership: The toast container template owns two persistent visually hidden regions (polite with data-autoid services-notify-live-polite, assertive with services-notify-live-assertive); the notify service announces through the container; toast elements carry no aria-live",
     "question": "Toast announcement ownership",
     "selected_value": "The toast container template owns two persistent visually hidden regions (polite with data-autoid services-notify-live-polite, assertive with services-notify-live-assertive); the notify service announces through the container; toast elements carry no aria-live",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "One owner prevents double announcements and survives toast removal.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-002",
      "AC-003"
     ],
     "task_refs": [
      "TASK-005"
     ]
    },
    {
     "id": "D-028",
     "type": "decision",
     "statement": "Release x.0 mechanism: releaseTargets(suffix, { baselineSuffix }); patch 0 requires an explicit baseline with a lower minor, patch > 0 keeps patch - 1; loadReleaseContract reads baselineSuffix from scripts/release-contracts/<suffix>.json and passes it to materializeValidatedBundle/validateReleaseBundle; the baseline invariant compares with targets[].baselineVersion; deploy.ps1 gains -BaselineSuffix; tests cover 3.0 in release-package-contract, collect-release-docs, generate-showcase-changelog and build-published-page retention; publish-npm.yml pins, its retention assertion and the approved 3.0.json snapshot belong to the release cut",
     "question": "Release x.0 mechanism",
     "selected_value": "releaseTargets(suffix, { baselineSuffix }); patch 0 requires an explicit baseline with a lower minor, patch > 0 keeps patch - 1; loadReleaseContract reads baselineSuffix from scripts/release-contracts/<suffix>.json and passes it to materializeValidatedBundle/validateReleaseBundle; the baseline invariant compares with targets[].baselineVersion; deploy.ps1 gains -BaselineSuffix; tests cover 3.0 in release-package-contract, collect-release-docs, generate-showcase-changelog and build-published-page retention; publish-npm.yml pins, its retention assertion and the approved 3.0.json snapshot belong to the release cut",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Keeps every 2.x rule, makes 3.0 expressible, and leaves release-cut artifacts to the approved release step.",
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
     "task_refs": [
      "TASK-026"
     ]
    },
    {
     "id": "D-029",
     "type": "decision",
     "statement": "Component token and host alias rule: Map a hex to a semantic or ramp token when values are identical; otherwise add --sd-{component}-{role} in themes/_component-tokens.scss with light value equal to the old hex and an explicit contrast-checked dark value; :host blocks may no longer hold hex and may only alias existing local names (--sd-pdf-*, --sd-fe-*, --sd-preview-*) to global tokens so consumer hooks keep working",
     "question": "Component token and host alias rule",
     "selected_value": "Map a hex to a semantic or ramp token when values are identical; otherwise add --sd-{component}-{role} in themes/_component-tokens.scss with light value equal to the old hex and an explicit contrast-checked dark value; :host blocks may no longer hold hex and may only alias existing local names (--sd-pdf-*, --sd-fe-*, --sd-preview-*) to global tokens so consumer hooks keep working",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "A :host declaration would override the global dark value; aliases keep existing hooks.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-017",
      "R-019",
      "AC-030",
      "AC-031"
     ],
     "task_refs": [
      "TASK-013",
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
    },
    {
     "id": "D-030",
     "type": "decision",
     "statement": "Virtual scroll shell strategy: V1: keep the Material shell with a single hidden sentinel option so the trigger renders while the component owns the value; V2: a component-owned listbox panel if V1 fails the spike probes",
     "question": "Virtual scroll shell strategy",
     "selected_value": "V1: keep the Material shell with a single hidden sentinel option so the trigger renders while the component owns the value; V2: a component-owned listbox panel if V1 fails the spike probes",
     "source": "approved-architecture",
     "status": "deferred",
     "blocking": false,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Only the spike can show whether the Material shell satisfies AC-021/AC-022 across Angular lines.",
     "supersedes": null,
     "revisit_condition": "Resolved by the virtual-scroll spike task before any rollout task; the chosen variant is recorded in the plan execution evidence.",
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-010",
      "R-011",
      "AC-021",
      "AC-022"
     ],
     "task_refs": [
      "TASK-024"
     ]
    },
    {
     "id": "D-031",
     "type": "decision",
     "statement": "Focus ring application rule: --sd-focus-ring-color defaults to var(--sd-primary), width 2px, offset 2px; only outline declarations change: existing component hooks keep precedence as var(<hook>, var(--sd-focus-ring-color)); always-dark surfaces use a component token; widths and offsets other than 2px stay local; outline none with box-shadow focus stays allowed; private tokens are never redefined",
     "question": "Focus ring application rule",
     "selected_value": "--sd-focus-ring-color defaults to var(--sd-primary), width 2px, offset 2px; only outline declarations change: existing component hooks keep precedence as var(<hook>, var(--sd-focus-ring-color)); always-dark surfaces use a component token; widths and offsets other than 2px stay local; outline none with box-shadow focus stays allowed; private tokens are never redefined",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Keeps light appearance and public hooks while giving every focus colour a token source.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-013",
      "AC-024",
      "INV-001"
     ],
     "task_refs": [
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ]
    },
    {
     "id": "D-032",
     "type": "decision",
     "statement": "Editor sanitizer policy: sdSanitizeEditorHtml uses an allowlist of CKEditor output tags and attributes; removes script, style, iframe, frame, object, embed, applet, base, meta, link, form controls, template and SVG animation/use/foreignObject elements with content; href allows http, https, mailto, tel, relative and #fragment; img src allows http, https, relative and data:image/*; srcset candidates follow img src; any other URL-bearing attribute is removed; returns the original string when nothing is removed and is idempotent; without DOMParser it returns HTML-escaped text; applied at editor #onEditorUserInput and #getFromEditor and mini-editor #convertOutput and getHtmlContent(); Markdown mode sanitizes HTML before conversion; content that loses constructs is written back once and marks the control dirty",
     "question": "Editor sanitizer policy",
     "selected_value": "sdSanitizeEditorHtml uses an allowlist of CKEditor output tags and attributes; removes script, style, iframe, frame, object, embed, applet, base, meta, link, form controls, template and SVG animation/use/foreignObject elements with content; href allows http, https, mailto, tel, relative and #fragment; img src allows http, https, relative and data:image/*; srcset candidates follow img src; any other URL-bearing attribute is removed; returns the original string when nothing is removed and is idempotent; without DOMParser it returns HTML-escaped text; applied at editor #onEditorUserInput and #getFromEditor and mini-editor #convertOutput and getHtmlContent(); Markdown mode sanitizes HTML before conversion; content that loses constructs is written back once and marks the control dirty",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "A denylist is not fail-closed, re-serialising clean HTML would create false diffs, and getHtmlContent() bypassed the filter.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-004",
      "AC-009",
      "AC-010",
      "INV-006"
     ],
     "task_refs": [
      "TASK-003",
      "TASK-008"
     ]
    },
    {
     "id": "D-033",
     "type": "decision",
     "statement": "URL guard specifics: sdIsSafeResourceUrl reuses sdParseUrl/sdResolveBaseOrigin (SSR-safe); allows http and https without embedded credentials, relative URLs resolved against the base origin, blob:, data:image/* and data:application/pdf; everything else, including mailto and tel, is refused for downloads, media and window navigation",
     "question": "URL guard specifics",
     "selected_value": "sdIsSafeResourceUrl reuses sdParseUrl/sdResolveBaseOrigin (SSR-safe); allows http and https without embedded credentials, relative URLs resolved against the base origin, blob:, data:image/* and data:application/pdf; everything else, including mailto and tel, is refused for downloads, media and window navigation",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "Aligns with existing url-safety helpers and keeps download/media policy separate from editor link policy.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-005",
      "AC-011",
      "AC-012",
      "INV-006"
     ],
     "task_refs": [
      "TASK-003",
      "TASK-007"
     ]
    },
    {
     "id": "D-034",
     "type": "decision",
     "statement": "Tooltip interaction mechanics: Focus shows through the existing activeTooltip singleton and blur hides; while visible, a capture-phase document keydown listener handles only Escape, hides the tooltip and stops propagation only when it hid one, and is removed on hide; the bubble root has role tooltip and a unique id; the directive adds and removes only its own id in the host aria-describedby; the sdTooltipColor default becomes var(--sd-tooltip-bg)",
     "question": "Tooltip interaction mechanics",
     "selected_value": "Focus shows through the existing activeTooltip singleton and blur hides; while visible, a capture-phase document keydown listener handles only Escape, hides the tooltip and stops propagation only when it hid one, and is removed on hide; the bubble root has role tooltip and a unique id; the directive adds and removes only its own id in the host aria-describedby; the sdTooltipColor default becomes var(--sd-tooltip-bg)",
     "source": "approved-architecture",
     "status": "approved",
     "blocking": true,
     "scope": "public-contract",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "A dialog listening on body would otherwise close first; a permanent capture listener would repeat the DS defect.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-003",
      "AC-006",
      "AC-007",
      "AC-008"
     ],
     "task_refs": [
      "TASK-006"
     ]
    },
    {
     "id": "D-035",
     "type": "decision",
     "statement": "Validation boundary: no authorization boundary in release 3.0",
     "question": "Validation boundary",
     "selected_value": "none for every requirement, acceptance criterion and invariant of this release",
     "source": "approved-plan",
     "status": "proposed",
     "blocking": false,
     "scope": "repository",
     "owner_repository_id": "sdcorejs-angular",
     "rationale": "The release changes a client-side UI library with no server authorization surface.",
     "supersedes": null,
     "revisit_condition": null,
     "convention_impact": {
      "candidate": false,
      "category": null
     },
     "downstream_refs": [
      "R-001",
      "R-002",
      "R-003",
      "R-004",
      "R-005",
      "R-006",
      "R-007",
      "R-008",
      "R-009",
      "R-010",
      "R-011",
      "R-013",
      "R-014",
      "R-015",
      "R-016",
      "R-017",
      "R-018",
      "R-019",
      "R-020",
      "R-021",
      "R-022",
      "R-023",
      "R-024",
      "AC-001",
      "AC-002",
      "AC-003",
      "AC-004",
      "AC-005",
      "AC-006",
      "AC-007",
      "AC-008",
      "AC-009",
      "AC-010",
      "AC-011",
      "AC-012",
      "AC-013",
      "AC-014",
      "AC-015",
      "AC-016",
      "AC-017",
      "AC-018",
      "AC-019",
      "AC-020",
      "AC-021",
      "AC-022",
      "AC-024",
      "AC-025",
      "AC-026",
      "AC-027",
      "AC-028",
      "AC-029",
      "AC-030",
      "AC-031",
      "AC-032",
      "AC-033",
      "AC-034",
      "AC-035",
      "AC-036",
      "AC-037",
      "AC-038",
      "INV-001",
      "INV-002",
      "INV-003",
      "INV-004",
      "INV-005",
      "INV-006",
      "INV-007",
      "INV-008"
     ],
     "task_refs": [
      "TASK-030"
     ],
     "validation_boundary": {
      "kind": "none",
      "source_refs": [
       "R-001",
       "R-002",
       "R-003",
       "R-004",
       "R-005",
       "R-006",
       "R-007",
       "R-008",
       "R-009",
       "R-010",
       "R-011",
       "R-013",
       "R-014",
       "R-015",
       "R-016",
       "R-017",
       "R-018",
       "R-019",
       "R-020",
       "R-021",
       "R-022",
       "R-023",
       "R-024",
       "AC-001",
       "AC-002",
       "AC-003",
       "AC-004",
       "AC-005",
       "AC-006",
       "AC-007",
       "AC-008",
       "AC-009",
       "AC-010",
       "AC-011",
       "AC-012",
       "AC-013",
       "AC-014",
       "AC-015",
       "AC-016",
       "AC-017",
       "AC-018",
       "AC-019",
       "AC-020",
       "AC-021",
       "AC-022",
       "AC-024",
       "AC-025",
       "AC-026",
       "AC-027",
       "AC-028",
       "AC-029",
       "AC-030",
       "AC-031",
       "AC-032",
       "AC-033",
       "AC-034",
       "AC-035",
       "AC-036",
       "AC-037",
       "AC-038",
       "INV-001",
       "INV-002",
       "INV-003",
       "INV-004",
       "INV-005",
       "INV-006",
       "INV-007",
       "INV-008"
      ]
     }
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
    },
    {
     "id": "INV-002",
     "type": "invariant",
     "statement": "Shared library changes are authored in versions/v19 and propagated only with npm run sync; check:sync passes.",
     "protected_refs": [
      "R-024",
      "AC-036"
     ],
     "task_refs": [
      "TASK-026",
      "TASK-029",
      "TASK-030"
     ],
     "evidence_refs": [
      "EVIDENCE-026",
      "EVIDENCE-029",
      "EVIDENCE-030"
     ]
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
     "task_refs": [
      "TASK-003",
      "TASK-016",
      "TASK-023",
      "TASK-024",
      "TASK-030"
     ],
     "evidence_refs": [
      "EVIDENCE-003",
      "EVIDENCE-016",
      "EVIDENCE-023",
      "EVIDENCE-024",
      "EVIDENCE-030"
     ]
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
     "task_refs": [
      "TASK-013",
      "TASK-015",
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021"
     ],
     "evidence_refs": [
      "EVIDENCE-013",
      "EVIDENCE-015",
      "EVIDENCE-017",
      "EVIDENCE-018",
      "EVIDENCE-019",
      "EVIDENCE-020",
      "EVIDENCE-021"
     ]
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
     "task_refs": [
      "TASK-002",
      "TASK-004",
      "TASK-005",
      "TASK-010",
      "TASK-012",
      "TASK-030"
     ],
     "evidence_refs": [
      "EVIDENCE-002",
      "EVIDENCE-004",
      "EVIDENCE-005",
      "EVIDENCE-010",
      "EVIDENCE-012",
      "EVIDENCE-030"
     ]
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
     "task_refs": [
      "TASK-003",
      "TASK-007",
      "TASK-008",
      "TASK-011",
      "TASK-012"
     ],
     "evidence_refs": [
      "EVIDENCE-003",
      "EVIDENCE-007",
      "EVIDENCE-008",
      "EVIDENCE-011",
      "EVIDENCE-012"
     ]
    },
    {
     "id": "INV-007",
     "type": "invariant",
     "statement": "Library components reference colours only through var(--sd-*) tokens; hex literals exist only in themes and documented exemptions.",
     "protected_refs": [
      "R-018",
      "R-019",
      "AC-029",
      "AC-030"
     ],
     "task_refs": [
      "TASK-016",
      "TASK-017",
      "TASK-018",
      "TASK-019",
      "TASK-020",
      "TASK-021",
      "TASK-022",
      "TASK-023"
     ],
     "evidence_refs": [
      "EVIDENCE-016",
      "EVIDENCE-017",
      "EVIDENCE-018",
      "EVIDENCE-019",
      "EVIDENCE-020",
      "EVIDENCE-021",
      "EVIDENCE-022",
      "EVIDENCE-023"
     ]
    },
    {
     "id": "INV-008",
     "type": "invariant",
     "statement": "Every declaration emitted by theme() for light, including declarations derived from var(--sd-*), is emitted again with a dark value in every dark scope.",
     "protected_refs": [
      "R-017",
      "AC-028"
     ],
     "task_refs": [
      "TASK-013",
      "TASK-014",
      "TASK-023"
     ],
     "evidence_refs": [
      "EVIDENCE-013",
      "EVIDENCE-014",
      "EVIDENCE-023"
     ]
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
    },
    {
     "revision": 3,
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
       "id": "D-020",
       "type": "decision"
      },
      {
       "id": "D-021",
       "type": "decision"
      },
      {
       "id": "D-022",
       "type": "decision"
      },
      {
       "id": "D-023",
       "type": "decision"
      },
      {
       "id": "D-024",
       "type": "decision"
      },
      {
       "id": "D-025",
       "type": "decision"
      },
      {
       "id": "D-026",
       "type": "decision"
      },
      {
       "id": "D-027",
       "type": "decision"
      },
      {
       "id": "D-028",
       "type": "decision"
      },
      {
       "id": "D-029",
       "type": "decision"
      },
      {
       "id": "D-030",
       "type": "decision"
      },
      {
       "id": "D-031",
       "type": "decision"
      },
      {
       "id": "D-032",
       "type": "decision"
      },
      {
       "id": "D-033",
       "type": "decision"
      },
      {
       "id": "D-034",
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
      },
      {
       "id": "INV-007",
       "type": "invariant"
      },
      {
       "id": "INV-008",
       "type": "invariant"
      }
     ],
     "tombstones": []
    },
    {
     "revision": 4,
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
       "id": "D-020",
       "type": "decision"
      },
      {
       "id": "D-021",
       "type": "decision"
      },
      {
       "id": "D-022",
       "type": "decision"
      },
      {
       "id": "D-023",
       "type": "decision"
      },
      {
       "id": "D-024",
       "type": "decision"
      },
      {
       "id": "D-025",
       "type": "decision"
      },
      {
       "id": "D-026",
       "type": "decision"
      },
      {
       "id": "D-027",
       "type": "decision"
      },
      {
       "id": "D-028",
       "type": "decision"
      },
      {
       "id": "D-029",
       "type": "decision"
      },
      {
       "id": "D-030",
       "type": "decision"
      },
      {
       "id": "D-031",
       "type": "decision"
      },
      {
       "id": "D-032",
       "type": "decision"
      },
      {
       "id": "D-033",
       "type": "decision"
      },
      {
       "id": "D-034",
       "type": "decision"
      },
      {
       "id": "D-035",
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
      },
      {
       "id": "INV-007",
       "type": "invariant"
      },
      {
       "id": "INV-008",
       "type": "invariant"
      }
     ],
     "tombstones": []
    },
    {
     "revision": 5,
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
       "id": "D-020",
       "type": "decision"
      },
      {
       "id": "D-021",
       "type": "decision"
      },
      {
       "id": "D-022",
       "type": "decision"
      },
      {
       "id": "D-023",
       "type": "decision"
      },
      {
       "id": "D-024",
       "type": "decision"
      },
      {
       "id": "D-025",
       "type": "decision"
      },
      {
       "id": "D-026",
       "type": "decision"
      },
      {
       "id": "D-027",
       "type": "decision"
      },
      {
       "id": "D-028",
       "type": "decision"
      },
      {
       "id": "D-029",
       "type": "decision"
      },
      {
       "id": "D-030",
       "type": "decision"
      },
      {
       "id": "D-031",
       "type": "decision"
      },
      {
       "id": "D-032",
       "type": "decision"
      },
      {
       "id": "D-033",
       "type": "decision"
      },
      {
       "id": "D-034",
       "type": "decision"
      },
      {
       "id": "D-035",
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
      },
      {
       "id": "INV-007",
       "type": "invariant"
      },
      {
       "id": "INV-008",
       "type": "invariant"
      }
     ],
     "tombstones": [
      {
       "id": "R-012",
       "type": "requirement",
       "retired_revision": 5,
       "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
      },
      {
       "id": "AC-023",
       "type": "acceptance-criterion",
       "retired_revision": 5,
       "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
      },
      {
       "id": "D-013",
       "type": "decision",
       "retired_revision": 5,
       "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
      }
     ]
    },
    {
     "revision": 6,
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
       "id": "D-020",
       "type": "decision"
      },
      {
       "id": "D-021",
       "type": "decision"
      },
      {
       "id": "D-022",
       "type": "decision"
      },
      {
       "id": "D-023",
       "type": "decision"
      },
      {
       "id": "D-024",
       "type": "decision"
      },
      {
       "id": "D-025",
       "type": "decision"
      },
      {
       "id": "D-026",
       "type": "decision"
      },
      {
       "id": "D-027",
       "type": "decision"
      },
      {
       "id": "D-028",
       "type": "decision"
      },
      {
       "id": "D-029",
       "type": "decision"
      },
      {
       "id": "D-030",
       "type": "decision"
      },
      {
       "id": "D-031",
       "type": "decision"
      },
      {
       "id": "D-032",
       "type": "decision"
      },
      {
       "id": "D-033",
       "type": "decision"
      },
      {
       "id": "D-034",
       "type": "decision"
      },
      {
       "id": "D-035",
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
      },
      {
       "id": "INV-007",
       "type": "invariant"
      },
      {
       "id": "INV-008",
       "type": "invariant"
      }
     ],
     "tombstones": [
      {
       "id": "R-012",
       "type": "requirement",
       "retired_revision": 5,
       "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
      },
      {
       "id": "AC-023",
       "type": "acceptance-criterion",
       "retired_revision": 5,
       "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
      },
      {
       "id": "D-013",
       "type": "decision",
       "retired_revision": 5,
       "reason": "Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only."
      }
     ]
    }
   ],
   "approved_artifact": {
    "metadata": {
     "allowed_paths": [
      "**"
     ],
     "approval_source": "user-approved-decision-coverage",
     "approved_at": "2026-08-09T00:00:00.000Z",
     "approved_by": "draft-self-review-provisional",
     "artifact_id": "decision-coverage-r6",
     "artifact_kind": "plan",
     "change_ref": "angular-core-3-0-release-20260925",
     "contract_id": "decision-coverage:v1",
     "owner_module_id": null,
     "owner_repository_id": "sdcorejs-angular",
     "owner_repository_role": "standalone",
     "parent_references": [],
     "parent_repository_id": null,
     "prohibited_paths": [],
     "repository_relative_path": ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-plan.md",
     "requirement_id": "decision-coverage",
     "schema_version": 1,
     "source_revision": "726df9964721a10740cb7bdd6e100a03307ef39a",
     "stack_profile": "markdown-skill-pack",
     "supersedes": null,
     "track": "workflow",
     "approval_hash": "sha256:v1:f4ef4257c19174665d07a9f26c52fd7673b5f0890d294e158e1b52fce51c16a2"
    },
    "body": "{\"history\":[{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"}],\"revision\":1,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"}],\"revision\":2,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"D-031\",\"type\":\"decision\"},{\"id\":\"D-032\",\"type\":\"decision\"},{\"id\":\"D-033\",\"type\":\"decision\"},{\"id\":\"D-034\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"}],\"revision\":3,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-012\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-023\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-013\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"D-031\",\"type\":\"decision\"},{\"id\":\"D-032\",\"type\":\"decision\"},{\"id\":\"D-033\",\"type\":\"decision\"},{\"id\":\"D-034\",\"type\":\"decision\"},{\"id\":\"D-035\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"}],\"revision\":4,\"tombstones\":[]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"D-031\",\"type\":\"decision\"},{\"id\":\"D-032\",\"type\":\"decision\"},{\"id\":\"D-033\",\"type\":\"decision\"},{\"id\":\"D-034\",\"type\":\"decision\"},{\"id\":\"D-035\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"}],\"revision\":5,\"tombstones\":[{\"id\":\"R-012\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"requirement\"},{\"id\":\"AC-023\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"acceptance-criterion\"},{\"id\":\"D-013\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"decision\"}]},{\"active\":[{\"id\":\"R-001\",\"type\":\"requirement\"},{\"id\":\"R-002\",\"type\":\"requirement\"},{\"id\":\"R-003\",\"type\":\"requirement\"},{\"id\":\"R-004\",\"type\":\"requirement\"},{\"id\":\"R-005\",\"type\":\"requirement\"},{\"id\":\"R-006\",\"type\":\"requirement\"},{\"id\":\"R-007\",\"type\":\"requirement\"},{\"id\":\"R-008\",\"type\":\"requirement\"},{\"id\":\"R-009\",\"type\":\"requirement\"},{\"id\":\"R-010\",\"type\":\"requirement\"},{\"id\":\"R-011\",\"type\":\"requirement\"},{\"id\":\"R-013\",\"type\":\"requirement\"},{\"id\":\"R-014\",\"type\":\"requirement\"},{\"id\":\"R-015\",\"type\":\"requirement\"},{\"id\":\"R-016\",\"type\":\"requirement\"},{\"id\":\"R-017\",\"type\":\"requirement\"},{\"id\":\"R-018\",\"type\":\"requirement\"},{\"id\":\"R-019\",\"type\":\"requirement\"},{\"id\":\"R-020\",\"type\":\"requirement\"},{\"id\":\"R-021\",\"type\":\"requirement\"},{\"id\":\"R-022\",\"type\":\"requirement\"},{\"id\":\"R-023\",\"type\":\"requirement\"},{\"id\":\"R-024\",\"type\":\"requirement\"},{\"id\":\"AC-001\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-002\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-003\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-004\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-005\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-006\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-007\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-008\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-009\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-010\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-011\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-012\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-013\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-014\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-015\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-016\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-017\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-018\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-019\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-020\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-021\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-022\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-024\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-025\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-026\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-027\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-028\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-029\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-030\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-031\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-032\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-033\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-034\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-035\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-036\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-037\",\"type\":\"acceptance-criterion\"},{\"id\":\"AC-038\",\"type\":\"acceptance-criterion\"},{\"id\":\"A-001\",\"type\":\"assumption\"},{\"id\":\"A-002\",\"type\":\"assumption\"},{\"id\":\"A-003\",\"type\":\"assumption\"},{\"id\":\"A-004\",\"type\":\"assumption\"},{\"id\":\"A-005\",\"type\":\"assumption\"},{\"id\":\"A-006\",\"type\":\"assumption\"},{\"id\":\"A-007\",\"type\":\"assumption\"},{\"id\":\"D-001\",\"type\":\"decision\"},{\"id\":\"D-002\",\"type\":\"decision\"},{\"id\":\"D-003\",\"type\":\"decision\"},{\"id\":\"D-004\",\"type\":\"decision\"},{\"id\":\"D-005\",\"type\":\"decision\"},{\"id\":\"D-006\",\"type\":\"decision\"},{\"id\":\"D-007\",\"type\":\"decision\"},{\"id\":\"D-008\",\"type\":\"decision\"},{\"id\":\"D-009\",\"type\":\"decision\"},{\"id\":\"D-010\",\"type\":\"decision\"},{\"id\":\"D-011\",\"type\":\"decision\"},{\"id\":\"D-012\",\"type\":\"decision\"},{\"id\":\"D-014\",\"type\":\"decision\"},{\"id\":\"D-015\",\"type\":\"decision\"},{\"id\":\"D-016\",\"type\":\"decision\"},{\"id\":\"D-017\",\"type\":\"decision\"},{\"id\":\"D-018\",\"type\":\"decision\"},{\"id\":\"D-019\",\"type\":\"decision\"},{\"id\":\"D-020\",\"type\":\"decision\"},{\"id\":\"D-021\",\"type\":\"decision\"},{\"id\":\"D-022\",\"type\":\"decision\"},{\"id\":\"D-023\",\"type\":\"decision\"},{\"id\":\"D-024\",\"type\":\"decision\"},{\"id\":\"D-025\",\"type\":\"decision\"},{\"id\":\"D-026\",\"type\":\"decision\"},{\"id\":\"D-027\",\"type\":\"decision\"},{\"id\":\"D-028\",\"type\":\"decision\"},{\"id\":\"D-029\",\"type\":\"decision\"},{\"id\":\"D-030\",\"type\":\"decision\"},{\"id\":\"D-031\",\"type\":\"decision\"},{\"id\":\"D-032\",\"type\":\"decision\"},{\"id\":\"D-033\",\"type\":\"decision\"},{\"id\":\"D-034\",\"type\":\"decision\"},{\"id\":\"D-035\",\"type\":\"decision\"},{\"id\":\"INV-001\",\"type\":\"invariant\"},{\"id\":\"INV-002\",\"type\":\"invariant\"},{\"id\":\"INV-003\",\"type\":\"invariant\"},{\"id\":\"INV-004\",\"type\":\"invariant\"},{\"id\":\"INV-005\",\"type\":\"invariant\"},{\"id\":\"INV-006\",\"type\":\"invariant\"},{\"id\":\"INV-007\",\"type\":\"invariant\"},{\"id\":\"INV-008\",\"type\":\"invariant\"}],\"revision\":6,\"tombstones\":[{\"id\":\"R-012\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"requirement\"},{\"id\":\"AC-023\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"acceptance-criterion\"},{\"id\":\"D-013\",\"reason\":\"Removed by explicit user instruction on 2026-09-25: nothing related to the omeu preset; release improves generic token/theming only.\",\"retired_revision\":5,\"type\":\"decision\"}]}],\"records\":[{\"id\":\"R-001\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-table export honours export.max: when the rows to export exceed max, export does not start and an i18n warning names the limit.\",\"status\":\"active\",\"task_refs\":[\"TASK-002\",\"TASK-004\"],\"type\":\"requirement\"},{\"id\":\"R-002\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Toast notifications are announced through persistent polite/assertive live regions, pause auto-dismiss on hover and keyboard focus, and expose typed, labelled buttons.\",\"status\":\"active\",\"task_refs\":[\"TASK-002\",\"TASK-005\"],\"type\":\"requirement\"},{\"id\":\"R-003\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-tooltip meets WCAG 1.4.13: shows on focus, hides on blur, Escape dismisses, bubble is hoverable, role=tooltip with aria-describedby, token colour.\",\"status\":\"active\",\"task_refs\":[\"TASK-006\"],\"type\":\"requirement\"},{\"id\":\"R-004\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-mini-editor restricts link protocols and both editors emit HTML filtered of script URLs, non-image data URLs and on* attributes while keeping formatting.\",\"status\":\"active\",\"task_refs\":[\"TASK-003\",\"TASK-008\"],\"type\":\"requirement\"},{\"id\":\"R-005\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A shared URL scheme guard blocks unsafe download/open URLs in SdUtilities.download, preview-image, preview-pdf, upload-file and preview-video.\",\"status\":\"active\",\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"requirement\"},{\"id\":\"R-006\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"The side-drawer body scroll lock compensates the scrollbar width with padding-right and restores it on final release, except in container mode.\",\"status\":\"active\",\"task_refs\":[\"TASK-009\"],\"type\":\"requirement\"},{\"id\":\"R-007\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"I18nService exposes a BCP-47 locale signal; hard-coded vi-VN formatting in library code and the duplicate locale maps are replaced by it.\",\"status\":\"active\",\"task_refs\":[\"TASK-010\",\"TASK-012\"],\"type\":\"requirement\"},{\"id\":\"R-008\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A new sd-preview-video component in the preview entry point plays video with error/retry state, is used by the file-explorer detail, and ships md docs plus a showcase demo.\",\"status\":\"active\",\"task_refs\":[\"TASK-002\",\"TASK-012\",\"TASK-028\"],\"type\":\"requirement\"},{\"id\":\"R-009\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Diacritic-insensitive helpers sdNormalizeSearchText and sdFindHighlightRanges plus an sd-highlight component render matches safely without innerHTML or regex built from input.\",\"status\":\"active\",\"task_refs\":[\"TASK-003\",\"TASK-011\",\"TASK-028\"],\"type\":\"requirement\"},{\"id\":\"R-010\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-select supports opt-in virtual scrolling (default off) preserving keyboard navigation, selected display, multi-select values and select-all.\",\"status\":\"active\",\"task_refs\":[\"TASK-024\"],\"type\":\"requirement\"},{\"id\":\"R-011\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"sd-autocomplete supports opt-in virtual scrolling (default off) preserving keyboard navigation and selection.\",\"status\":\"active\",\"task_refs\":[\"TASK-024\",\"TASK-025\"],\"type\":\"requirement\"},{\"id\":\"R-013\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Focus ring tokens exist (colour defaults to var(--sd-primary)); every focus outline colour comes from the shared token, a documented component hook falling back to it, or a component token for always-dark surfaces; no hex remains in focus rules.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"requirement\"},{\"id\":\"R-014\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"The semantic token layer adds status bg/fg, link, surface-inverse, text-on-solid, border-focus, border-danger and overlay-backdrop tokens.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\"],\"type\":\"requirement\"},{\"id\":\"R-015\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Non-colour tokens (space, radius, shadow, z-index, motion, typography) exist as CSS variables and exact-matching literals use them.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"requirement\"},{\"id\":\"R-016\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Colour ramps 50-950 are generated at runtime for the main colour families while existing -light/-dark/-contrast values stay unchanged.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\"],\"type\":\"requirement\"},{\"id\":\"R-017\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"An opt-in dark theme covers Core tokens and Material, scoped by [data-sd-theme=dark], with an auto mode following prefers-color-scheme.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\"],\"type\":\"requirement\"},{\"id\":\"R-018\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Hex colour literals are rejected by lint in library TS/templates and by a dependency-free SCSS check, both enforced in CI.\",\"status\":\"active\",\"task_refs\":[\"TASK-016\",\"TASK-022\",\"TASK-023\"],\"type\":\"requirement\"},{\"id\":\"R-019\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Raw hex colours in library SCSS and TS outside documented exemptions are replaced by tokens with identical values.\",\"status\":\"active\",\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"requirement\"},{\"id\":\"R-020\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Theme contrast tests run in CI and cover default, every existing preset and dark mode.\",\"status\":\"active\",\"task_refs\":[\"TASK-014\",\"TASK-023\"],\"type\":\"requirement\"},{\"id\":\"R-021\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A new entry point @sdcorejs/angular/utilities/theme exposes readSdTokens and the SdColorToken type.\",\"status\":\"active\",\"task_refs\":[\"TASK-015\"],\"type\":\"requirement\"},{\"id\":\"R-022\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"A showcase Theme & tokens guide and a published THEME.md document tokens, ramps, contrast and dark mode; the STYLE-GUIDE is updated.\",\"status\":\"active\",\"task_refs\":[\"TASK-027\",\"TASK-028\"],\"type\":\"requirement\"},{\"id\":\"R-023\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Release tooling accepts an x.0 suffix with an explicit baseline so 3.0 targets 19.3.0/20.3.0/21.3.0/22.3.0 against *.2.15.\",\"status\":\"active\",\"task_refs\":[\"TASK-026\"],\"type\":\"requirement\"},{\"id\":\"R-024\",\"owner_module_id\":null,\"owner_repository_id\":\"sdcorejs-angular\",\"source\":\"explicit-user\",\"statement\":\"Docs, changelog (with a BREAKING section and migration), npm README parity and v20-v22 rollout are delivered with the change.\",\"status\":\"active\",\"task_refs\":[\"TASK-001\",\"TASK-029\",\"TASK-030\"],\"type\":\"requirement\"},{\"behavior\":\"Server or local export where the row count exceeds export.max\",\"blocking\":true,\"expected_result\":\"No file is written, a warning notification with the i18n limit message is shown, exporting resets to false\",\"id\":\"AC-001\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Server or local export where the row count exceeds export.max -> No file is written, a warning notification with the i18n limit message is shown, exporting resets to false\",\"task_refs\":[\"TASK-004\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Export with max unset or row count within max\",\"blocking\":true,\"expected_result\":\"Export behaves exactly as in 2.15 and existing export specs stay green\",\"id\":\"AC-002\",\"requirement_refs\":[\"R-001\"],\"statement\":\"Export with max unset or row count within max -> Export behaves exactly as in 2.15 and existing export specs stay green\",\"task_refs\":[\"TASK-004\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Showing info/success and warning/error toasts\",\"blocking\":true,\"expected_result\":\"The persistent polite region announces info/success and the assertive region announces warning/error\",\"id\":\"AC-003\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Showing info/success and warning/error toasts -> The persistent polite region announces info/success and the assertive region announces warning/error\",\"task_refs\":[\"TASK-005\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Keyboard focus enters and leaves a toast\",\"blocking\":true,\"expected_result\":\"Auto-dismiss pauses while focus is inside and resumes on blur; hover pause still works\",\"id\":\"AC-004\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Keyboard focus enters and leaves a toast -> Auto-dismiss pauses while focus is inside and resumes on blur; hover pause still works\",\"task_refs\":[\"TASK-005\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Rendering toast buttons\",\"blocking\":true,\"expected_result\":\"Close and action buttons are type=button and the close button has an i18n aria-label\",\"id\":\"AC-005\",\"requirement_refs\":[\"R-002\"],\"statement\":\"Rendering toast buttons -> Close and action buttons are type=button and the close button has an i18n aria-label\",\"task_refs\":[\"TASK-005\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Keyboard focus on and off a tooltip host\",\"blocking\":true,\"expected_result\":\"The tooltip shows on focus and hides on blur; the bubble has role=tooltip; the host aria-describedby includes the bubble id only while visible and keeps existing ids\",\"id\":\"AC-006\",\"requirement_refs\":[\"R-003\"],\"statement\":\"Keyboard focus on and off a tooltip host -> The tooltip shows on focus and hides on blur; the bubble has role=tooltip; the host aria-describedby includes the bubble id only while visible and keeps existing ids\",\"task_refs\":[\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Pressing Escape with the tooltip visible and hidden\",\"blocking\":true,\"expected_result\":\"Visible: tooltip hides and the event does not propagate; hidden: the event propagates unchanged\",\"id\":\"AC-007\",\"requirement_refs\":[\"R-003\"],\"statement\":\"Pressing Escape with the tooltip visible and hidden -> Visible: tooltip hides and the event does not propagate; hidden: the event propagates unchanged\",\"task_refs\":[\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Pointer moves from host into the bubble; default colour inspected\",\"blocking\":true,\"expected_result\":\"The bubble stays visible while hovered; the default background comes from a token and the directive has no hex literal\",\"id\":\"AC-008\",\"requirement_refs\":[\"R-003\"],\"statement\":\"Pointer moves from host into the bubble; default colour inspected -> The bubble stays visible while hovered; the default background comes from a token and the directive has no hex literal\",\"task_refs\":[\"TASK-006\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Inspecting the mini-editor CKEditor link config\",\"blocking\":true,\"expected_result\":\"link.allowedProtocols is https, http, mailto, tel\",\"id\":\"AC-009\",\"requirement_refs\":[\"R-004\"],\"statement\":\"Inspecting the mini-editor CKEditor link config -> link.allowedProtocols is https, http, mailto, tel\",\"task_refs\":[\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Editor and mini-editor emit HTML containing javascript:/vbscript: URLs, data:text URLs, on* attributes, styles, tables and https/data:image images\",\"blocking\":true,\"expected_result\":\"Unsafe URLs and on* attributes are removed; styles, tables and safe images are kept across valueChange, sdChange, contentChange and form value\",\"id\":\"AC-010\",\"requirement_refs\":[\"R-004\"],\"statement\":\"Editor and mini-editor emit HTML containing javascript:/vbscript: URLs, data:text URLs, on* attributes, styles, tables and https/data:image images -> Unsafe URLs and on* attributes are removed; styles, tables and safe images are kept across valueChange, sdChange, contentChange and form value\",\"task_refs\":[\"TASK-003\",\"TASK-008\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Evaluating the URL guard against allowed and blocked inputs\",\"blocking\":true,\"expected_result\":\"https, http, relative, blob, data:image/* and data:application/pdf pass; javascript:, vbscript:, other data: and file: are blocked\",\"id\":\"AC-011\",\"requirement_refs\":[\"R-005\"],\"statement\":\"Evaluating the URL guard against allowed and blocked inputs -> https, http, relative, blob, data:image/* and data:application/pdf pass; javascript:, vbscript:, other data: and file: are blocked\",\"task_refs\":[\"TASK-003\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Triggering downloads with blocked URLs in SdUtilities.download, preview-image, preview-pdf and upload-file\",\"blocking\":true,\"expected_result\":\"No anchor navigation happens; upload-file no longer renders href=\\\"javascript:;\\\"\",\"id\":\"AC-012\",\"requirement_refs\":[\"R-005\"],\"statement\":\"Triggering downloads with blocked URLs in SdUtilities.download, preview-image, preview-pdf and upload-file -> No anchor navigation happens; upload-file no longer renders href=\\\"javascript:;\\\"\",\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Locking and releasing body scroll with a visible scrollbar, stacked locks and container mode\",\"blocking\":true,\"expected_result\":\"padding-right grows by the scrollbar width once, is restored on final release, and container mode is untouched\",\"id\":\"AC-013\",\"requirement_refs\":[\"R-006\"],\"statement\":\"Locking and releasing body scroll with a visible scrollbar, stacked locks and container mode -> padding-right grows by the scrollbar width once, is restored on final release, and container mode is untouched\",\"task_refs\":[\"TASK-009\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Switching language and rendering date/datetime min/max messages, forbidden/not-found/home pages and query-bar chips\",\"blocking\":true,\"expected_result\":\"locale() returns the mapped BCP-47 tag and formatting follows it; no vi-VN literal remains in library code except the single mapping table\",\"id\":\"AC-014\",\"requirement_refs\":[\"R-007\"],\"statement\":\"Switching language and rendering date/datetime min/max messages, forbidden/not-found/home pages and query-bar chips -> locale() returns the mapped BCP-47 tag and formatting follows it; no vi-VN literal remains in library code except the single mapping table\",\"task_refs\":[\"TASK-010\",\"TASK-012\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Rendering sd-preview-video with URL, Blob, poster, media error and download\",\"blocking\":true,\"expected_result\":\"A native video with controls plays; Blob URLs are revoked on destroy; errors show an i18n message with retry; downloads obey the URL guard; autoId attributes exist\",\"id\":\"AC-015\",\"requirement_refs\":[\"R-008\"],\"statement\":\"Rendering sd-preview-video with URL, Blob, poster, media error and download -> A native video with controls plays; Blob URLs are revoked on destroy; errors show an i18n message with retry; downloads obey the URL guard; autoId attributes exist\",\"task_refs\":[\"TASK-012\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Opening a video file in the file-explorer detail\",\"blocking\":true,\"expected_result\":\"sd-preview-video renders instead of the unavailable fallback\",\"id\":\"AC-016\",\"requirement_refs\":[\"R-008\"],\"statement\":\"Opening a video file in the file-explorer detail -> sd-preview-video renders instead of the unavailable fallback\",\"task_refs\":[\"TASK-012\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Reviewing sd-preview.md and the showcase preview page\",\"blocking\":true,\"expected_result\":\"The video section is documented, the duplicated pdf section is removed, and the demo plays a sample video\",\"id\":\"AC-017\",\"requirement_refs\":[\"R-008\"],\"statement\":\"Reviewing sd-preview.md and the showcase preview page -> The video section is documented, the duplicated pdf section is removed, and the demo plays a sample video\",\"task_refs\":[\"TASK-012\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"manual\"},{\"behavior\":\"Running highlight utilities on diacritics, đ/Đ, case, regex metacharacters, surrogate pairs and empty terms\",\"blocking\":true,\"expected_result\":\"Normalization and ranges match expected original-index ranges without throwing\",\"id\":\"AC-018\",\"requirement_refs\":[\"R-009\"],\"statement\":\"Running highlight utilities on diacritics, đ/Đ, case, regex metacharacters, surrogate pairs and empty terms -> Normalization and ranges match expected original-index ranges without throwing\",\"task_refs\":[\"TASK-003\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Rendering sd-highlight with text containing HTML markup\",\"blocking\":true,\"expected_result\":\"Matches render inside mark elements and markup is shown as text, never parsed\",\"id\":\"AC-019\",\"requirement_refs\":[\"R-009\"],\"statement\":\"Rendering sd-highlight with text containing HTML markup -> Matches render inside mark elements and markup is shown as text, never parsed\",\"task_refs\":[\"TASK-011\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Using sd-select with virtualScroll off\",\"blocking\":true,\"expected_result\":\"DOM and behaviour are identical to 2.15; no virtual viewport exists; existing select specs stay green\",\"id\":\"AC-020\",\"requirement_refs\":[\"R-010\"],\"statement\":\"Using sd-select with virtualScroll off -> DOM and behaviour are identical to 2.15; no virtual viewport exists; existing select specs stay green\",\"task_refs\":[\"TASK-024\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Using sd-select with virtualScroll on and 10000 local items, single and multi\",\"blocking\":true,\"expected_result\":\"Rendered options stay bounded; End/PageDown/typeahead reach every item; multi keeps selected values outside the viewport; trigger shows all selected labels; select-all covers the filtered set\",\"id\":\"AC-021\",\"requirement_refs\":[\"R-010\"],\"statement\":\"Using sd-select with virtualScroll on and 10000 local items, single and multi -> Rendered options stay bounded; End/PageDown/typeahead reach every item; multi keeps selected values outside the viewport; trigger shows all selected labels; select-all covers the filtered set\",\"task_refs\":[\"TASK-024\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Using sd-autocomplete with virtualScroll off and on with 10000 items\",\"blocking\":true,\"expected_result\":\"Off is identical to 2.15; on keeps rendering bounded, arrow keys reach every item and selection emits the right value\",\"id\":\"AC-022\",\"requirement_refs\":[\"R-011\"],\"statement\":\"Using sd-autocomplete with virtualScroll off and on with 10000 items -> Off is identical to 2.15; on keeps rendering bounded, arrow keys reach every item and selection emits the right value\",\"task_refs\":[\"TASK-025\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Scanning library focus rules and computing a focus outline\",\"blocking\":true,\"expected_result\":\"Every focus outline colour comes from a token (shared, hook with shared fallback, or component token); no hex remains; without hooks the default colour equals the primary colour; light appearance is unchanged\",\"id\":\"AC-024\",\"requirement_refs\":[\"R-013\"],\"statement\":\"Scanning library focus rules and computing a focus outline -> every focus outline colour comes from a token; no hex; default equals primary; light unchanged\",\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compiling default, every preset and dark themes\",\"blocking\":true,\"expected_result\":\"All new semantic tokens are emitted with the documented derivations\",\"id\":\"AC-025\",\"requirement_refs\":[\"R-014\"],\"statement\":\"Compiling default, every preset and dark themes -> All new semantic tokens are emitted with the documented derivations\",\"task_refs\":[\"TASK-013\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compiling themes and reviewing the literal migration report\",\"blocking\":true,\"expected_result\":\"Non-colour tokens are emitted; only exact-value literals were replaced; utility classes are unchanged\",\"id\":\"AC-026\",\"requirement_refs\":[\"R-015\"],\"statement\":\"Compiling themes and reviewing the literal migration report -> Non-colour tokens are emitted; only exact-value literals were replaced; utility classes are unchanged\",\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Comparing theme output with 2.15\",\"blocking\":true,\"expected_result\":\"Ramp tokens exist for 7 families x 11 steps; -light, -dark and -contrast values are unchanged for default and presets\",\"id\":\"AC-027\",\"requirement_refs\":[\"R-016\"],\"statement\":\"Comparing theme output with 2.15 -> Ramp tokens exist for 7 families x 11 steps; -light, -dark and -contrast values are unchanged for default and presets\",\"task_refs\":[\"TASK-013\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Compiling sd.theme with mode omitted, dark and auto\",\"blocking\":true,\"expected_result\":\"Omitted mode keeps every 2.15 declaration with identical values and only adds new --sd-* properties and [data-sd-theme] blocks; dark redeclares every public and semantic token plus Material dark under [data-sd-theme=dark] with color-scheme dark; auto applies dark via prefers-color-scheme unless [data-sd-theme=light]\",\"id\":\"AC-028\",\"requirement_refs\":[\"R-017\"],\"statement\":\"Compiling sd.theme with mode omitted, dark and auto -> 2.15 declarations unchanged (additive only); complete dark scope; auto media scope\",\"task_refs\":[\"TASK-013\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Running the ESLint hex rule and the SCSS hex check on fixtures and on the repository\",\"blocking\":true,\"expected_result\":\"Planted hex fails, var() fallbacks and exemptions pass, the repository passes, and both run in CI\",\"id\":\"AC-029\",\"requirement_refs\":[\"R-018\"],\"statement\":\"Running the ESLint hex rule and the SCSS hex check on fixtures and on the repository -> Planted hex fails, var() fallbacks and exemptions pass, the repository passes, and both run in CI\",\"task_refs\":[\"TASK-016\",\"TASK-022\",\"TASK-023\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Scanning library SCSS and TS after migration\",\"blocking\":true,\"expected_result\":\"Zero raw hex remains outside documented exemptions and sampled computed styles are unchanged\",\"id\":\"AC-030\",\"requirement_refs\":[\"R-019\"],\"statement\":\"Scanning library SCSS and TS after migration -> Zero raw hex remains outside documented exemptions and sampled computed styles are unchanged\",\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Running test:scripts in CI with a contrast pair lowered below threshold\",\"blocking\":true,\"expected_result\":\"test:theme runs inside test:scripts, covers the pair matrix for default, existing presets and dark, and fails on the lowered pair\",\"id\":\"AC-031\",\"requirement_refs\":[\"R-020\"],\"statement\":\"Running test:scripts in CI with a contrast pair lowered below threshold -> contrast matrix for default, presets and dark fails on the lowered pair\",\"task_refs\":[\"TASK-014\",\"TASK-023\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Importing @sdcorejs/angular/utilities/theme\",\"blocking\":true,\"expected_result\":\"The entry builds; readSdTokens returns resolved values in a browser and an empty record without a document; SdColorToken matches the public token list\",\"id\":\"AC-032\",\"requirement_refs\":[\"R-021\"],\"statement\":\"Importing @sdcorejs/angular/utilities/theme -> The entry builds; readSdTokens returns resolved values in a browser and an empty record without a document; SdColorToken matches the public token list\",\"task_refs\":[\"TASK-015\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Building the showcase and published docs\",\"blocking\":true,\"expected_result\":\"The Theme & tokens page and THEME.md are registered, registry counts are updated and the docs guard passes\",\"id\":\"AC-033\",\"requirement_refs\":[\"R-022\"],\"statement\":\"Building the showcase and published docs -> The Theme & tokens page and THEME.md are registered, registry counts are updated and the docs guard passes\",\"task_refs\":[\"TASK-028\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Viewing the Theme & tokens page\",\"blocking\":true,\"expected_result\":\"Swatches, ramps, tokens, contrast tables and the dark toggle render correctly in light and dark\",\"id\":\"AC-034\",\"requirement_refs\":[\"R-022\"],\"statement\":\"Viewing the Theme & tokens page -> Swatches, ramps, tokens, contrast tables and the dark toggle render correctly in light and dark\",\"task_refs\":[\"TASK-027\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"manual\"},{\"behavior\":\"Running release tooling tests for 3.0 with baseline 2.15 and existing 2.x cases\",\"blocking\":true,\"expected_result\":\"Targets are 19.3.0, 20.3.0, 21.3.0, 22.3.0 with *.2.15 baselines; x.0 without an explicit baseline is rejected; existing tests stay green\",\"id\":\"AC-035\",\"requirement_refs\":[\"R-023\"],\"statement\":\"Running release tooling tests for 3.0 with baseline 2.15 and existing 2.x cases -> Targets are 19.3.0, 20.3.0, 21.3.0, 22.3.0 with *.2.15 baselines; x.0 without an explicit baseline is rejected; existing tests stay green\",\"task_refs\":[\"TASK-026\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Reviewing CHANGELOG, READMEs and derived workspaces after npm run sync\",\"blocking\":true,\"expected_result\":\"CHANGELOG [Unreleased] has a BREAKING section with migration diffs; README parity and check:sync pass; the mojibake scan is clean\",\"id\":\"AC-036\",\"requirement_refs\":[\"R-024\"],\"statement\":\"Reviewing CHANGELOG, READMEs and derived workspaces after npm run sync -> CHANGELOG [Unreleased] has a BREAKING section with migration diffs; README parity and check:sync pass; the mojibake scan is clean\",\"task_refs\":[\"TASK-029\",\"TASK-030\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Running v19 Karma with coverage, the library build and the showcase build\",\"blocking\":true,\"expected_result\":\"All pass with coverage thresholds met\",\"id\":\"AC-037\",\"requirement_refs\":[\"R-024\"],\"statement\":\"Running v19 Karma with coverage, the library build and the showcase build -> All pass with coverage thresholds met\",\"task_refs\":[\"TASK-030\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"automated\"},{\"behavior\":\"Installing and building v20, v21 and v22\",\"blocking\":true,\"expected_result\":\"All derived lines build; executed at the release-cut gate\",\"id\":\"AC-038\",\"requirement_refs\":[\"R-024\"],\"statement\":\"Installing and building v20, v21 and v22 -> All derived lines build; executed at the release-cut gate\",\"task_refs\":[\"TASK-030\"],\"type\":\"acceptance-criterion\",\"verification_kind\":\"deferred\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"Consumers with max set lose exports above the limit until they raise it.\",\"evidence_refs\":[\"EVIDENCE-004\"],\"id\":\"A-001\",\"impacted_refs\":[\"R-001\"],\"owner\":\"release owner\",\"rationale\":\"Legacy source and 2.15 never read export.max.\",\"source\":\"inferred\",\"statement\":\"No consumer depends on export.max being ignored, because neither Legacy nor 2.15 ever enforced it.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"Changelog BREAKING entry and code search of max usage in known consumers.\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"The output filter is still required as defence in depth; only test fixtures change.\",\"evidence_refs\":[\"EVIDENCE-003\",\"EVIDENCE-008\"],\"id\":\"A-002\",\"impacted_refs\":[\"R-004\"],\"owner\":\"implementer\",\"rationale\":\"Observed in ckeditor5-link data downcast during review.\",\"source\":\"inferred\",\"statement\":\"CKEditor 5 data output keeps javascript: hrefs and the mini-editor Link plugin accepts any protocol without allowedProtocols.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"RED unit test against the real editor build before implementing the filter.\"},{\"blocking\":false,\"confidence\":\"medium\",\"consequence_if_wrong\":\"The spec must be revised through change control for a custom listbox.\",\"evidence_refs\":[\"EVIDENCE-024\"],\"id\":\"A-003\",\"impacted_refs\":[\"R-010\",\"R-011\"],\"owner\":\"implementer\",\"rationale\":\"Known limitations exist; a spike isolates the risk.\",\"source\":\"inferred\",\"statement\":\"CDK virtual scrolling can be combined with mat-select and mat-autocomplete while keeping keyboard navigation and multi-select values.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"A spike task runs first and must pass AC-021/AC-022 probes before rollout.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Material dark must use per-line shims or be documented as consumer-configured.\",\"evidence_refs\":[\"EVIDENCE-013\"],\"id\":\"A-004\",\"impacted_refs\":[\"R-017\"],\"owner\":\"implementer\",\"rationale\":\"Material M3 mat.theme exposes theme-type.\",\"source\":\"inferred\",\"statement\":\"Angular Material 19-22 mat.theme supports theme-type dark inside a scoped selector.\",\"status\":\"proposed\",\"type\":\"assumption\",\"validation_method\":\"Theme compile test on v19 and derived-line builds at release cut.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Visual regressions appear in migrated components.\",\"evidence_refs\":[\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\",\"EVIDENCE-020\",\"EVIDENCE-021\"],\"id\":\"A-005\",\"impacted_refs\":[\"R-015\",\"R-019\"],\"owner\":\"implementer\",\"rationale\":\"Exact-value mapping is the migration rule.\",\"source\":\"defaulted\",\"statement\":\"Replacing literals and hex values only with tokens of identical value produces no visual change.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"Theme snapshot tests, computed-style spot checks and manual showcase review.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Visual checks could be automated instead.\",\"evidence_refs\":[\"EVIDENCE-012\",\"EVIDENCE-027\"],\"id\":\"A-006\",\"impacted_refs\":[\"R-008\",\"R-022\"],\"owner\":\"user\",\"rationale\":\"The Playwright integration failed to connect in this session.\",\"source\":\"explicit\",\"statement\":\"No browser automation is available, so visual verification of showcase pages is manual.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"Manual showcase review by the user.\"},{\"blocking\":false,\"confidence\":\"high\",\"consequence_if_wrong\":\"Verification cannot run until the toolchain is fixed.\",\"evidence_refs\":[\"EVIDENCE-001\"],\"id\":\"A-007\",\"impacted_refs\":[\"R-024\"],\"owner\":\"implementer\",\"rationale\":\"Repository requires the exact Node version.\",\"source\":\"explicit\",\"statement\":\"Node 22.22.3 via fnm and npm ci --legacy-peer-deps work for v19 and the showcase in the worktree.\",\"status\":\"confirmed\",\"type\":\"assumption\",\"validation_method\":\"fnm list shows v22.22.3; install runs in the first plan task.\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-010\",\"R-011\",\"AC-020\",\"AC-021\",\"AC-022\"],\"id\":\"D-001\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Virtual scroll scope\",\"rationale\":\"User choice; limits blast radius.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sd-select and sd-autocomplete only, opt-in input, default off; sd-table unchanged\",\"source\":\"explicit-user\",\"statement\":\"Virtual scroll scope: sd-select and sd-autocomplete only, opt-in input, default off; sd-table unchanged\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-024\",\"TASK-025\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\"],\"id\":\"D-002\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Dark theme activation\",\"rationale\":\"User choice.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Opt-in scope [data-sd-theme=dark] for Core and Material, plus mode auto following prefers-color-scheme\",\"source\":\"explicit-user\",\"statement\":\"Dark theme activation: Opt-in scope [data-sd-theme=dark] for Core and Material, plus mode auto following prefers-color-scheme\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-004\",\"AC-009\",\"AC-010\"],\"id\":\"D-003\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Editor output policy\",\"rationale\":\"User choice; full sanitizer would strip styles.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"link.allowedProtocols https/http/mailto/tel plus a light output filter keeping formatting\",\"source\":\"explicit-user\",\"statement\":\"Editor output policy: link.allowedProtocols https/http/mailto/tel plus a light output filter keeping formatting\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-008\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-023\",\"R-024\",\"AC-035\",\"AC-038\"],\"id\":\"D-004\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Branch and release boundary\",\"rationale\":\"User choice.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"Worktree branch release/3.0 from origin/main; stop before release cut, tag and publish\",\"source\":\"explicit-user\",\"statement\":\"Branch and release boundary: Worktree branch release/3.0 from origin/main; stop before release cut, tag and publish\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-001\",\"TASK-029\",\"TASK-030\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"AC-001\",\"AC-002\"],\"id\":\"D-005\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"export.max semantics\",\"rationale\":\"User accepted default; safer than silent truncation.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Block the export and warn when rows exceed max\",\"source\":\"explicit-user\",\"statement\":\"export.max semantics: Block the export and warn when rows exceed max\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\",\"TASK-004\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-002\",\"AC-003\",\"AC-004\"],\"id\":\"D-006\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Toast announcement model\",\"rationale\":\"User accepted default; dynamic regions are often missed.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Persistent polite and assertive live regions in the container; pause on hover and focus\",\"source\":\"explicit-user\",\"statement\":\"Toast announcement model: Persistent polite and assertive live regions in the container; pause on hover and focus\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\",\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-003\",\"AC-006\"],\"id\":\"D-007\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Tooltip scope\",\"rationale\":\"User accepted default; MatTooltip already meets 1.4.13.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Fix sd-tooltip only; MatTooltip usages stay unchanged\",\"source\":\"explicit-user\",\"statement\":\"Tooltip scope: Fix sd-tooltip only; MatTooltip usages stay unchanged\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-005\",\"AC-011\",\"AC-012\"],\"id\":\"D-008\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"URL allow-list\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Allow https, http, relative, blob, data:image/*, data:application/pdf; block everything else\",\"source\":\"explicit-user\",\"statement\":\"URL allow-list: Allow https, http, relative, blob, data:image/*, data:application/pdf; block everything else\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-006\",\"AC-013\"],\"id\":\"D-009\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Scroll-lock compensation\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"padding-right equal to scrollbar width on the side-drawer lock service; container mode skipped\",\"source\":\"explicit-user\",\"statement\":\"Scroll-lock compensation: padding-right equal to scrollbar width on the side-drawer lock service; container mode skipped\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-009\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-007\",\"AC-014\"],\"id\":\"D-010\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Locale source\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"I18nService.locale() signal with a single language-to-BCP-47 map\",\"source\":\"explicit-user\",\"statement\":\"Locale source: I18nService.locale() signal with a single language-to-BCP-47 map\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-010\",\"TASK-012\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-008\",\"AC-015\",\"AC-016\"],\"id\":\"D-011\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Preview video placement\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sd-preview-video inside the components/preview entry point, integrated into the file-explorer detail\",\"source\":\"explicit-user\",\"statement\":\"Preview video placement: sd-preview-video inside the components/preview entry point, integrated into the file-explorer detail\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-002\",\"TASK-012\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-009\",\"AC-018\",\"AC-019\"],\"id\":\"D-012\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Highlight delivery\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Utilities in utilities/extensions plus a new sd-highlight component; no adoption in other components yet\",\"source\":\"explicit-user\",\"statement\":\"Highlight delivery: Utilities in utilities/extensions plus a new sd-highlight component; no adoption in other components yet\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-011\",\"TASK-028\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-015\",\"R-019\",\"AC-026\",\"AC-030\"],\"id\":\"D-014\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Literal migration rule\",\"rationale\":\"User accepted default; guarantees no visual change.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Replace literals and hex only with tokens of identical value; add a token when none exists\",\"source\":\"explicit-user\",\"statement\":\"Literal migration rule: Replace literals and hex only with tokens of identical value; add a token when none exists\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-016\",\"AC-027\"],\"id\":\"D-015\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Ramp generation\",\"rationale\":\"User accepted default; consumer overrides propagate.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"color-mix at runtime from base tokens; -light/-dark/-contrast keep their current values\",\"source\":\"explicit-user\",\"statement\":\"Ramp generation: color-mix at runtime from base tokens; -light/-dark/-contrast keep their current values\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-018\",\"AC-029\"],\"id\":\"D-016\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Hex enforcement tooling\",\"rationale\":\"User accepted default; no new dependency.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"ESLint rule plus a dependency-free SCSS script at error level; var() fallbacks allowed\",\"source\":\"explicit-user\",\"statement\":\"Hex enforcement tooling: ESLint rule plus a dependency-free SCSS script at error level; var() fallbacks allowed\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-016\",\"TASK-022\",\"TASK-023\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-021\",\"AC-032\"],\"id\":\"D-017\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Token export entry point\",\"rationale\":\"User accepted default.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"New secondary entry @sdcorejs/angular/utilities/theme\",\"source\":\"explicit-user\",\"statement\":\"Token export entry point: New secondary entry @sdcorejs/angular/utilities/theme\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-015\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-024\",\"AC-037\"],\"id\":\"D-018\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Coverage approach\",\"rationale\":\"Repository rule for components and forms.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"TDD for library components, services and scripts\",\"source\":\"explicit-user\",\"statement\":\"Coverage approach: TDD for library components, services and scripts\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-001\",\"TASK-030\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-023\",\"AC-035\"],\"id\":\"D-019\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Release numbering\",\"rationale\":\"User asked for 3.0; major digit is locked to the Angular line.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"Release suffix 3.0 publishing 19.3.0, 20.3.0, 21.3.0, 22.3.0 against *.2.15\",\"source\":\"explicit-user\",\"statement\":\"Release numbering: Release suffix 3.0 publishing 19.3.0, 20.3.0, 21.3.0, 22.3.0 against *.2.15\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-026\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-013\",\"R-014\",\"R-015\",\"R-016\",\"R-019\",\"AC-024\",\"AC-025\",\"AC-026\",\"AC-027\"],\"id\":\"D-020\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Token tiers and naming\",\"rationale\":\"Independent migration units must pick identical names.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Primitive --sd-{family} and ramps --sd-{family}-{50..950}; semantic --sd-{role}; component tier --sd-{component}-{role} where {component} is the selector without sd- (preview-pdf, file-explorer, code-editor), declared only in themes/_component-tokens.scss; px-named --sd-space-{n} and --sd-radius-{n}; role-named --sd-z-{layer}, --sd-shadow-{xs..xl}, --sd-duration-{fast|base|slow}, --sd-ease-standard; --sd-font-size-{n}, --sd-font-weight-{name}, --sd-line-height-{n}; --sd-focus-ring-{color|width|offset}\",\"source\":\"approved-architecture\",\"statement\":\"Token tiers and naming: Primitive --sd-{family} and ramps --sd-{family}-{50..950}; semantic --sd-{role}; component tier --sd-{component}-{role} where {component} is the selector without sd- (preview-pdf, file-explorer, code-editor), declared only in themes/_component-tokens.scss; px-named --sd-space-{n} and --sd-radius-{n}; role-named --sd-z-{layer}, --sd-shadow-{xs..xl}, --sd-duration-{fast|base|slow}, --sd-ease-standard; --sd-font-size-{n}, --sd-font-weight-{name}, --sd-line-height-{n}; --sd-focus-ring-{color|width|offset}\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\",\"TASK-027\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\",\"INV-008\"],\"id\":\"D-021\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Emission unit and mode semantics\",\"rationale\":\"Custom properties holding var() resolve where declared; a partial or root-only emission leaves stale light values.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"theme() emits the complete declaration set on & only: light keeps the 2.15 declarations and adds new tokens; dark emits the dark set plus color-scheme dark and Material dark colour tokens; auto emits light on & plus @media (prefers-color-scheme: dark) { &:not([data-sd-theme=light]) { dark set } }; every declaration derived from var(--sd-*), including the Material form-field error icon variables, moves inside the emission\",\"source\":\"approved-architecture\",\"statement\":\"Emission unit and mode semantics: theme() emits the complete declaration set on & only: light keeps the 2.15 declarations and adds new tokens; dark emits the dark set plus color-scheme dark and Material dark colour tokens; auto emits light on & plus @media (prefers-color-scheme: dark) { &:not([data-sd-theme=light]) { dark set } }; every declaration derived from var(--sd-*), including the Material form-field error icon variables, moves inside the emission\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\",\"AC-031\"],\"id\":\"D-022\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Dark palette source\",\"rationale\":\"User instruction: keep the generic default preset only and let other presets be added separately; an explicit error prevents silently wrong dark colours.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Dark palette only for the default preset: $default-dark-theme; built-in named presets stay light-only; $preset other than default combined with $mode dark or auto raises a Sass @error that tells consumers to provide their own dark map through $theme; consumer $theme overrides apply on top of the default dark palette; in dark, X-light mixes with --sd-surface and X-dark mixes toward white\",\"source\":\"approved-architecture\",\"statement\":\"Dark palette source: Dark palette only for the default preset: $default-dark-theme; built-in named presets stay light-only; $preset other than default combined with $mode dark or auto raises a Sass @error that tells consumers to provide their own dark map through $theme; consumer $theme overrides apply on top of the default dark palette; in dark, X-light mixes with --sd-surface and X-dark mixes toward white\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\",\"TASK-014\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\",\"INV-001\"],\"id\":\"D-023\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Mode delivery and scope limits\",\"rationale\":\"Specificity makes attribute blocks override html-level custom themes, and overlays render outside nested islands.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sd-core.scss keeps html light unchanged and adds [data-sd-theme=dark] (dark) and [data-sd-theme=light] (light, color-scheme light); these built-in blocks cover the default preset with core source only; consumers with a custom theme, preset or material source re-include sd.theme(<same arguments>, $mode: dark) under their dark selector; modes are guaranteed when the attribute is on html; nested islands theme inline content only and overlays follow the document mode; the library never writes data-sd-theme\",\"source\":\"approved-architecture\",\"statement\":\"Mode delivery and scope limits: sd-core.scss keeps html light unchanged and adds [data-sd-theme=dark] (dark) and [data-sd-theme=light] (light, color-scheme light); these built-in blocks cover the default preset with core source only; consumers with a custom theme, preset or material source re-include sd.theme(<same arguments>, $mode: dark) under their dark selector; modes are guaranteed when the attribute is on html; nested islands theme inline content only and overlays follow the document mode; the library never writes data-sd-theme\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\",\"TASK-027\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"AC-028\",\"INV-001\"],\"id\":\"D-024\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Material dark call\",\"rationale\":\"Material 19 mat.theme emits typography only when configured; light Material CSS stays identical and browser support stays broad.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Inside dark scopes call exactly mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette))) with no typography or density; set color-scheme dark in dark scopes and light in light islands; no theme-type color-scheme or light-dark()\",\"source\":\"approved-architecture\",\"statement\":\"Material dark call: Inside dark scopes call exactly mat.theme((color: (theme-type: dark, primary: mat.$azure-palette, tertiary: mat.$green-palette))) with no typography or density; set color-scheme dark in dark scopes and light in light islands; no theme-type color-scheme or light-dark()\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-004\",\"R-005\",\"R-009\",\"AC-010\",\"AC-011\",\"AC-018\"],\"id\":\"D-025\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Shared helper placement and naming\",\"rationale\":\"Entry points cannot import each other; utilities/extensions is the shared public entry and already uses the sd prefix.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Cross-entry helpers live in utilities/extensions with the sd prefix: sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges\",\"source\":\"approved-architecture\",\"statement\":\"Shared helper placement and naming: Cross-entry helpers live in utilities/extensions with the sd prefix: sdIsSafeResourceUrl, sdSanitizeEditorHtml, sdNormalizeSearchText, sdFindHighlightRanges\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-011\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-010\",\"R-011\",\"AC-020\",\"AC-021\",\"AC-022\",\"INV-001\"],\"id\":\"D-026\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Virtual scroll value ownership\",\"rationale\":\"Material key managers only see rendered options and multi-select would drop unrendered values; hidden options for every selected value would render up to 10000 options after select-all.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"With virtualScroll on, the component owns the value: the mat-select/mat-autocomplete shell is not bound to the formControl; user selection events are applied to the component model; rendered options are synced from the model; trigger labels come from selectedItems; array items are not paged by limit; function (SdSearch) results render as returned; pinned-selected ordering and emitted value order match the non-virtual branch; the component intercepts navigation keys, keeps an active index over the full filtered list, calls scrollToIndex before activating, owns aria-activedescendant and runs its own typeahead; Material private APIs are allowed only in one adapter per component covered by specs; default-off branch unchanged\",\"source\":\"approved-architecture\",\"statement\":\"Virtual scroll value ownership: With virtualScroll on, the component owns the value: the mat-select/mat-autocomplete shell is not bound to the formControl; user selection events are applied to the component model; rendered options are synced from the model; trigger labels come from selectedItems; array items are not paged by limit; function (SdSearch) results render as returned; pinned-selected ordering and emitted value order match the non-virtual branch; the component intercepts navigation keys, keeps an active index over the full filtered list, calls scrollToIndex before activating, owns aria-activedescendant and runs its own typeahead; Material private APIs are allowed only in one adapter per component covered by specs; default-off branch unchanged\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-024\",\"TASK-025\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-002\",\"AC-003\"],\"id\":\"D-027\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Toast announcement ownership\",\"rationale\":\"One owner prevents double announcements and survives toast removal.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"The toast container template owns two persistent visually hidden regions (polite with data-autoid services-notify-live-polite, assertive with services-notify-live-assertive); the notify service announces through the container; toast elements carry no aria-live\",\"source\":\"approved-architecture\",\"statement\":\"Toast announcement ownership: The toast container template owns two persistent visually hidden regions (polite with data-autoid services-notify-live-polite, assertive with services-notify-live-assertive); the notify service announces through the container; toast elements carry no aria-live\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-005\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-023\",\"AC-035\"],\"id\":\"D-028\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Release x.0 mechanism\",\"rationale\":\"Keeps every 2.x rule, makes 3.0 expressible, and leaves release-cut artifacts to the approved release step.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"releaseTargets(suffix, { baselineSuffix }); patch 0 requires an explicit baseline with a lower minor, patch > 0 keeps patch - 1; loadReleaseContract reads baselineSuffix from scripts/release-contracts/<suffix>.json and passes it to materializeValidatedBundle/validateReleaseBundle; the baseline invariant compares with targets[].baselineVersion; deploy.ps1 gains -BaselineSuffix; tests cover 3.0 in release-package-contract, collect-release-docs, generate-showcase-changelog and build-published-page retention; publish-npm.yml pins, its retention assertion and the approved 3.0.json snapshot belong to the release cut\",\"source\":\"approved-architecture\",\"statement\":\"Release x.0 mechanism: releaseTargets(suffix, { baselineSuffix }); patch 0 requires an explicit baseline with a lower minor, patch > 0 keeps patch - 1; loadReleaseContract reads baselineSuffix from scripts/release-contracts/<suffix>.json and passes it to materializeValidatedBundle/validateReleaseBundle; the baseline invariant compares with targets[].baselineVersion; deploy.ps1 gains -BaselineSuffix; tests cover 3.0 in release-package-contract, collect-release-docs, generate-showcase-changelog and build-published-page retention; publish-npm.yml pins, its retention assertion and the approved 3.0.json snapshot belong to the release cut\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-026\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-017\",\"R-019\",\"AC-030\",\"AC-031\"],\"id\":\"D-029\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Component token and host alias rule\",\"rationale\":\"A :host declaration would override the global dark value; aliases keep existing hooks.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Map a hex to a semantic or ramp token when values are identical; otherwise add --sd-{component}-{role} in themes/_component-tokens.scss with light value equal to the old hex and an explicit contrast-checked dark value; :host blocks may no longer hold hex and may only alias existing local names (--sd-pdf-*, --sd-fe-*, --sd-preview-*) to global tokens so consumer hooks keep working\",\"source\":\"approved-architecture\",\"statement\":\"Component token and host alias rule: Map a hex to a semantic or ramp token when values are identical; otherwise add --sd-{component}-{role} in themes/_component-tokens.scss with light value equal to the old hex and an explicit contrast-checked dark value; :host blocks may no longer hold hex and may only alias existing local names (--sd-pdf-*, --sd-fe-*, --sd-preview-*) to global tokens so consumer hooks keep working\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"decision\"},{\"blocking\":false,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-010\",\"R-011\",\"AC-021\",\"AC-022\"],\"id\":\"D-030\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Virtual scroll shell strategy\",\"rationale\":\"Only the spike can show whether the Material shell satisfies AC-021/AC-022 across Angular lines.\",\"revisit_condition\":\"Resolved by the virtual-scroll spike task before any rollout task; the chosen variant is recorded in the plan execution evidence.\",\"scope\":\"public-contract\",\"selected_value\":\"V1: keep the Material shell with a single hidden sentinel option so the trigger renders while the component owns the value; V2: a component-owned listbox panel if V1 fails the spike probes\",\"source\":\"approved-architecture\",\"statement\":\"Virtual scroll shell strategy: V1: keep the Material shell with a single hidden sentinel option so the trigger renders while the component owns the value; V2: a component-owned listbox panel if V1 fails the spike probes\",\"status\":\"deferred\",\"supersedes\":null,\"task_refs\":[\"TASK-024\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-013\",\"AC-024\",\"INV-001\"],\"id\":\"D-031\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Focus ring application rule\",\"rationale\":\"Keeps light appearance and public hooks while giving every focus colour a token source.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"--sd-focus-ring-color defaults to var(--sd-primary), width 2px, offset 2px; only outline declarations change: existing component hooks keep precedence as var(<hook>, var(--sd-focus-ring-color)); always-dark surfaces use a component token; widths and offsets other than 2px stay local; outline none with box-shadow focus stays allowed; private tokens are never redefined\",\"source\":\"approved-architecture\",\"statement\":\"Focus ring application rule: --sd-focus-ring-color defaults to var(--sd-primary), width 2px, offset 2px; only outline declarations change: existing component hooks keep precedence as var(<hook>, var(--sd-focus-ring-color)); always-dark surfaces use a component token; widths and offsets other than 2px stay local; outline none with box-shadow focus stays allowed; private tokens are never redefined\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-004\",\"AC-009\",\"AC-010\",\"INV-006\"],\"id\":\"D-032\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Editor sanitizer policy\",\"rationale\":\"A denylist is not fail-closed, re-serialising clean HTML would create false diffs, and getHtmlContent() bypassed the filter.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sdSanitizeEditorHtml uses an allowlist of CKEditor output tags and attributes; removes script, style, iframe, frame, object, embed, applet, base, meta, link, form controls, template and SVG animation/use/foreignObject elements with content; href allows http, https, mailto, tel, relative and #fragment; img src allows http, https, relative and data:image/*; srcset candidates follow img src; any other URL-bearing attribute is removed; returns the original string when nothing is removed and is idempotent; without DOMParser it returns HTML-escaped text; applied at editor #onEditorUserInput and #getFromEditor and mini-editor #convertOutput and getHtmlContent(); Markdown mode sanitizes HTML before conversion; content that loses constructs is written back once and marks the control dirty\",\"source\":\"approved-architecture\",\"statement\":\"Editor sanitizer policy: sdSanitizeEditorHtml uses an allowlist of CKEditor output tags and attributes; removes script, style, iframe, frame, object, embed, applet, base, meta, link, form controls, template and SVG animation/use/foreignObject elements with content; href allows http, https, mailto, tel, relative and #fragment; img src allows http, https, relative and data:image/*; srcset candidates follow img src; any other URL-bearing attribute is removed; returns the original string when nothing is removed and is idempotent; without DOMParser it returns HTML-escaped text; applied at editor #onEditorUserInput and #getFromEditor and mini-editor #convertOutput and getHtmlContent(); Markdown mode sanitizes HTML before conversion; content that loses constructs is written back once and marks the control dirty\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-008\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-005\",\"AC-011\",\"AC-012\",\"INV-006\"],\"id\":\"D-033\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"URL guard specifics\",\"rationale\":\"Aligns with existing url-safety helpers and keeps download/media policy separate from editor link policy.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"sdIsSafeResourceUrl reuses sdParseUrl/sdResolveBaseOrigin (SSR-safe); allows http and https without embedded credentials, relative URLs resolved against the base origin, blob:, data:image/* and data:application/pdf; everything else, including mailto and tel, is refused for downloads, media and window navigation\",\"source\":\"approved-architecture\",\"statement\":\"URL guard specifics: sdIsSafeResourceUrl reuses sdParseUrl/sdResolveBaseOrigin (SSR-safe); allows http and https without embedded credentials, relative URLs resolved against the base origin, blob:, data:image/* and data:application/pdf; everything else, including mailto and tel, is refused for downloads, media and window navigation\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-003\",\"TASK-007\"],\"type\":\"decision\"},{\"blocking\":true,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-003\",\"AC-006\",\"AC-007\",\"AC-008\"],\"id\":\"D-034\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Tooltip interaction mechanics\",\"rationale\":\"A dialog listening on body would otherwise close first; a permanent capture listener would repeat the DS defect.\",\"revisit_condition\":null,\"scope\":\"public-contract\",\"selected_value\":\"Focus shows through the existing activeTooltip singleton and blur hides; while visible, a capture-phase document keydown listener handles only Escape, hides the tooltip and stops propagation only when it hid one, and is removed on hide; the bubble root has role tooltip and a unique id; the directive adds and removes only its own id in the host aria-describedby; the sdTooltipColor default becomes var(--sd-tooltip-bg)\",\"source\":\"approved-architecture\",\"statement\":\"Tooltip interaction mechanics: Focus shows through the existing activeTooltip singleton and blur hides; while visible, a capture-phase document keydown listener handles only Escape, hides the tooltip and stops propagation only when it hid one, and is removed on hide; the bubble root has role tooltip and a unique id; the directive adds and removes only its own id in the host aria-describedby; the sdTooltipColor default becomes var(--sd-tooltip-bg)\",\"status\":\"approved\",\"supersedes\":null,\"task_refs\":[\"TASK-006\"],\"type\":\"decision\"},{\"blocking\":false,\"convention_impact\":{\"candidate\":false,\"category\":null},\"downstream_refs\":[\"R-001\",\"R-002\",\"R-003\",\"R-004\",\"R-005\",\"R-006\",\"R-007\",\"R-008\",\"R-009\",\"R-010\",\"R-011\",\"R-013\",\"R-014\",\"R-015\",\"R-016\",\"R-017\",\"R-018\",\"R-019\",\"R-020\",\"R-021\",\"R-022\",\"R-023\",\"R-024\",\"AC-001\",\"AC-002\",\"AC-003\",\"AC-004\",\"AC-005\",\"AC-006\",\"AC-007\",\"AC-008\",\"AC-009\",\"AC-010\",\"AC-011\",\"AC-012\",\"AC-013\",\"AC-014\",\"AC-015\",\"AC-016\",\"AC-017\",\"AC-018\",\"AC-019\",\"AC-020\",\"AC-021\",\"AC-022\",\"AC-024\",\"AC-025\",\"AC-026\",\"AC-027\",\"AC-028\",\"AC-029\",\"AC-030\",\"AC-031\",\"AC-032\",\"AC-033\",\"AC-034\",\"AC-035\",\"AC-036\",\"AC-037\",\"AC-038\",\"INV-001\",\"INV-002\",\"INV-003\",\"INV-004\",\"INV-005\",\"INV-006\",\"INV-007\",\"INV-008\"],\"id\":\"D-035\",\"owner_repository_id\":\"sdcorejs-angular\",\"question\":\"Validation boundary\",\"rationale\":\"The release changes a client-side UI library with no server authorization surface.\",\"revisit_condition\":null,\"scope\":\"repository\",\"selected_value\":\"none for every requirement, acceptance criterion and invariant of this release\",\"source\":\"approved-plan\",\"statement\":\"Validation boundary: no authorization boundary in release 3.0\",\"status\":\"proposed\",\"supersedes\":null,\"task_refs\":[\"TASK-030\"],\"type\":\"decision\",\"validation_boundary\":{\"kind\":\"none\",\"source_refs\":[\"R-001\",\"R-002\",\"R-003\",\"R-004\",\"R-005\",\"R-006\",\"R-007\",\"R-008\",\"R-009\",\"R-010\",\"R-011\",\"R-013\",\"R-014\",\"R-015\",\"R-016\",\"R-017\",\"R-018\",\"R-019\",\"R-020\",\"R-021\",\"R-022\",\"R-023\",\"R-024\",\"AC-001\",\"AC-002\",\"AC-003\",\"AC-004\",\"AC-005\",\"AC-006\",\"AC-007\",\"AC-008\",\"AC-009\",\"AC-010\",\"AC-011\",\"AC-012\",\"AC-013\",\"AC-014\",\"AC-015\",\"AC-016\",\"AC-017\",\"AC-018\",\"AC-019\",\"AC-020\",\"AC-021\",\"AC-022\",\"AC-024\",\"AC-025\",\"AC-026\",\"AC-027\",\"AC-028\",\"AC-029\",\"AC-030\",\"AC-031\",\"AC-032\",\"AC-033\",\"AC-034\",\"AC-035\",\"AC-036\",\"AC-037\",\"AC-038\",\"INV-001\",\"INV-002\",\"INV-003\",\"INV-004\",\"INV-005\",\"INV-006\",\"INV-007\",\"INV-008\"]}},{\"evidence_refs\":[\"EVIDENCE-013\",\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\",\"EVIDENCE-020\",\"EVIDENCE-021\",\"EVIDENCE-024\",\"EVIDENCE-025\"],\"id\":\"INV-001\",\"protected_refs\":[\"R-010\",\"R-011\",\"R-017\",\"AC-020\",\"AC-022\",\"AC-028\"],\"statement\":\"When no new opt-in input or mode is used, rendering and behaviour match 2.15.\",\"task_refs\":[\"TASK-013\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\",\"TASK-024\",\"TASK-025\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-026\",\"EVIDENCE-029\",\"EVIDENCE-030\"],\"id\":\"INV-002\",\"protected_refs\":[\"R-024\",\"AC-036\"],\"statement\":\"Shared library changes are authored in versions/v19 and propagated only with npm run sync; check:sync passes.\",\"task_refs\":[\"TASK-026\",\"TASK-029\",\"TASK-030\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-003\",\"EVIDENCE-016\",\"EVIDENCE-023\",\"EVIDENCE-024\",\"EVIDENCE-030\"],\"id\":\"INV-003\",\"protected_refs\":[\"R-004\",\"R-010\",\"R-018\"],\"statement\":\"No new npm dependency is added; virtual scrolling uses the existing @angular/cdk peer.\",\"task_refs\":[\"TASK-003\",\"TASK-016\",\"TASK-023\",\"TASK-024\",\"TASK-030\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-013\",\"EVIDENCE-015\",\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\",\"EVIDENCE-020\",\"EVIDENCE-021\"],\"id\":\"INV-004\",\"protected_refs\":[\"R-014\",\"R-015\",\"R-016\",\"R-019\",\"AC-027\",\"AC-030\"],\"statement\":\"Existing --sd-* token names and light-mode values, including -light/-dark/-contrast, remain available and unchanged.\",\"task_refs\":[\"TASK-013\",\"TASK-015\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-002\",\"EVIDENCE-004\",\"EVIDENCE-005\",\"EVIDENCE-010\",\"EVIDENCE-012\",\"EVIDENCE-030\"],\"id\":\"INV-005\",\"protected_refs\":[\"R-001\",\"R-002\",\"R-008\",\"AC-001\",\"AC-005\",\"AC-015\"],\"statement\":\"Every new user-facing string goes through I18nService with keys in all five catalogs.\",\"task_refs\":[\"TASK-002\",\"TASK-004\",\"TASK-005\",\"TASK-010\",\"TASK-012\",\"TASK-030\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-003\",\"EVIDENCE-007\",\"EVIDENCE-008\",\"EVIDENCE-011\",\"EVIDENCE-012\"],\"id\":\"INV-006\",\"protected_refs\":[\"R-004\",\"R-005\",\"AC-010\",\"AC-012\"],\"statement\":\"URL and HTML guards fail closed: an unrecognised scheme or attribute is removed or blocked.\",\"task_refs\":[\"TASK-003\",\"TASK-007\",\"TASK-008\",\"TASK-011\",\"TASK-012\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-016\",\"EVIDENCE-017\",\"EVIDENCE-018\",\"EVIDENCE-019\",\"EVIDENCE-020\",\"EVIDENCE-021\",\"EVIDENCE-022\",\"EVIDENCE-023\"],\"id\":\"INV-007\",\"protected_refs\":[\"R-018\",\"R-019\",\"AC-029\",\"AC-030\"],\"statement\":\"Library components reference colours only through var(--sd-*) tokens; hex literals exist only in themes and documented exemptions.\",\"task_refs\":[\"TASK-016\",\"TASK-017\",\"TASK-018\",\"TASK-019\",\"TASK-020\",\"TASK-021\",\"TASK-022\",\"TASK-023\"],\"type\":\"invariant\"},{\"evidence_refs\":[\"EVIDENCE-013\",\"EVIDENCE-014\",\"EVIDENCE-023\"],\"id\":\"INV-008\",\"protected_refs\":[\"R-017\",\"AC-028\"],\"statement\":\"Every declaration emitted by theme() for light, including declarations derived from var(--sd-*), is emitted again with a dark value in every dark scope.\",\"task_refs\":[\"TASK-013\",\"TASK-014\",\"TASK-023\"],\"type\":\"invariant\"}],\"revision\":6,\"schema_version\":1}\n"
   }
  },
  "goals": [
   {
    "id": "G-001",
    "statement": "P1 accessibility and security gaps are closed (export.max, toast, tooltip, editor output, download URLs).",
    "task_refs": [
     "TASK-002",
     "TASK-003",
     "TASK-004",
     "TASK-005",
     "TASK-006",
     "TASK-007",
     "TASK-008"
    ]
   },
   {
    "id": "G-002",
    "statement": "Selected P2 items ship: scroll-lock compensation, locale, preview video, highlight, opt-in virtual scroll.",
    "task_refs": [
     "TASK-009",
     "TASK-010",
     "TASK-011",
     "TASK-012",
     "TASK-024",
     "TASK-025"
    ]
   },
   {
    "id": "G-003",
    "statement": "A token/theme system with dark mode, contrast CI and hex enforcement replaces hard-coded colours.",
    "task_refs": [
     "TASK-013",
     "TASK-014",
     "TASK-015",
     "TASK-016",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021",
     "TASK-022",
     "TASK-023",
     "TASK-027"
    ]
   },
   {
    "id": "G-004",
    "statement": "Release 3.0 is prepared up to the release cut with x.0 tooling, docs, changelog, sync and full verification.",
    "task_refs": [
     "TASK-001",
     "TASK-026",
     "TASK-028",
     "TASK-029",
     "TASK-030"
    ]
   }
  ],
  "tasks": [
   {
    "id": "TASK-001",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [],
    "planned_paths": [
     ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-baseline.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-001",
      "record_refs": [
       "R-024"
      ]
     }
    ],
    "justification_refs": [
     "R-024",
     "D-004",
     "D-018"
    ],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-002",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/i18n/src/en.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-002",
      "record_refs": [
       "R-001",
       "R-002",
       "R-008",
       "INV-005"
      ]
     }
    ],
    "justification_refs": [
     "R-001",
     "R-002",
     "R-008",
     "D-005",
     "D-006",
     "D-011"
    ],
    "enforces_invariant_refs": [
     "INV-005"
    ]
   },
   {
    "id": "TASK-003",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.spec.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.spec.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/url-safety.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/url-safety.spec.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/utility.extension.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/utility.extension.spec.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/index.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/extensions.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-003",
      "record_refs": [
       "R-004",
       "R-005",
       "R-009",
       "AC-010",
       "AC-011",
       "AC-012",
       "AC-018",
       "INV-006",
       "INV-003"
      ]
     }
    ],
    "justification_refs": [
     "R-004",
     "R-005",
     "R-009",
     "D-008",
     "D-025",
     "D-032",
     "D-033"
    ],
    "enforces_invariant_refs": [
     "INV-006",
     "INV-003"
    ]
   },
   {
    "id": "TASK-004",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-002"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts",
     "versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/table/src/models/table-option-export.model.ts",
     "versions/v19/projects/sdcorejs-angular/components/table/sd-table.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-004",
      "record_refs": [
       "R-001",
       "AC-001",
       "AC-002",
       "INV-005"
      ]
     }
    ],
    "justification_refs": [
     "R-001",
     "D-005"
    ],
    "enforces_invariant_refs": [
     "INV-005"
    ]
   },
   {
    "id": "TASK-005",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-002",
     "TASK-013"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast-container.component.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast-container.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-005",
      "record_refs": [
       "R-002",
       "AC-003",
       "AC-004",
       "AC-005",
       "INV-005"
      ]
     }
    ],
    "justification_refs": [
     "R-002",
     "D-006",
     "D-027"
    ],
    "enforces_invariant_refs": [
     "INV-005"
    ]
   },
   {
    "id": "TASK-006",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.ts",
     "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts",
     "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-006",
      "record_refs": [
       "R-003",
       "AC-006",
       "AC-007",
       "AC-008"
      ]
     }
    ],
    "justification_refs": [
     "R-003",
     "D-007",
     "D-034"
    ],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-007",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-003"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.browser.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.html",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/sd-upload-file.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-007",
      "record_refs": [
       "R-005",
       "AC-012",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-005",
     "D-008",
     "D-033"
    ],
    "enforces_invariant_refs": [
     "INV-006"
    ]
   },
   {
    "id": "TASK-008",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-003"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/editor/sd-editor.md",
     "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/mini-editor/sd-mini-editor.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-008",
      "record_refs": [
       "R-004",
       "AC-009",
       "AC-010",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-004",
     "D-003",
     "D-032"
    ],
    "enforces_invariant_refs": [
     "INV-006"
    ]
   },
   {
    "id": "TASK-009",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.ts",
     "versions/v19/projects/sdcorejs-angular/components/side-drawer/sd-side-drawer.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-009",
      "record_refs": [
       "R-006",
       "AC-013"
      ]
     }
    ],
    "justification_refs": [
     "R-006",
     "D-009"
    ],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-010",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/i18n/src/i18n.service.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/i18n.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/i18n.md",
     "versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/modules/forbidden/pages/root/root.component.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/modules/not-found/pages/root/root.component.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/modules/home/components/home-page/home-page.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/sd-query-bar.md",
     "versions/v19/projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/inline-text/sd-inline-text.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-010",
      "record_refs": [
       "R-007",
       "AC-014",
       "INV-005"
      ]
     }
    ],
    "justification_refs": [
     "R-007",
     "D-010"
    ],
    "enforces_invariant_refs": [
     "INV-005"
    ]
   },
   {
    "id": "TASK-011",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-003"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/highlight/ng-package.json",
     "versions/v19/projects/sdcorejs-angular/components/highlight/index.ts",
     "versions/v19/projects/sdcorejs-angular/components/highlight/sd-highlight.md",
     "versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.spec.ts",
     "showcase/src/app/pages/components/highlight/highlight-demo.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/index.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-011",
      "record_refs": [
       "R-009",
       "AC-019",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-009",
     "D-012",
     "D-025"
    ],
    "enforces_invariant_refs": [
     "INV-006"
    ]
   },
   {
    "id": "TASK-012",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-002",
     "TASK-003",
     "TASK-007",
     "TASK-010"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.html",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/index.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/sd-preview.md",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.view-model.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/preview-panel.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/sd-file-explorer.md",
     "showcase/src/app/pages/components/preview/preview-demo.component.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-012",
      "record_refs": [
       "R-008",
       "R-007",
       "AC-015",
       "AC-016",
       "AC-017",
       "AC-014",
       "INV-005",
       "INV-006"
      ]
     }
    ],
    "justification_refs": [
     "R-008",
     "R-007",
     "D-011",
     "D-010"
    ],
    "enforces_invariant_refs": [
     "INV-005",
     "INV-006"
    ]
   },
   {
    "id": "TASK-013",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_scales.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_semantic.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_ramps.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/material-theme.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/sd-core.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/color.scss",
     "scripts/core-theme.test.mjs"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-013",
      "record_refs": [
       "R-013",
       "R-014",
       "R-015",
       "R-016",
       "R-017",
       "R-019",
       "AC-025",
       "AC-027",
       "AC-028",
       "INV-001",
       "INV-004",
       "INV-008"
      ]
     }
    ],
    "justification_refs": [
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-019",
     "D-002",
     "D-015",
     "D-020",
     "D-021",
     "D-022",
     "D-023",
     "D-024",
     "D-029"
    ],
    "enforces_invariant_refs": [
     "INV-001",
     "INV-004",
     "INV-008"
    ]
   },
   {
    "id": "TASK-014",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013"
    ],
    "planned_paths": [
     "scripts/theme-contrast.test.mjs"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-014",
      "record_refs": [
       "R-020",
       "AC-031",
       "INV-008"
      ]
     }
    ],
    "justification_refs": [
     "R-020",
     "D-022"
    ],
    "enforces_invariant_refs": [
     "INV-008"
    ]
   },
   {
    "id": "TASK-015",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/utilities/theme/ng-package.json",
     "versions/v19/projects/sdcorejs-angular/utilities/theme/index.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/theme/theme.md",
     "versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.spec.ts",
     "scripts/theme-token-list.test.mjs",
     "versions/v19/projects/sdcorejs-angular/utilities/index.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-015",
      "record_refs": [
       "R-021",
       "AC-032",
       "INV-004"
      ]
     }
    ],
    "justification_refs": [
     "R-021",
     "D-017"
    ],
    "enforces_invariant_refs": [
     "INV-004"
    ]
   },
   {
    "id": "TASK-016",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013"
    ],
    "planned_paths": [
     "scripts/check-scss-hex.mjs",
     "scripts/check-scss-hex.test.mjs"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-016",
      "record_refs": [
       "R-018",
       "AC-029",
       "INV-007",
       "INV-003"
      ]
     }
    ],
    "justification_refs": [
     "R-018",
     "D-016"
    ],
    "enforces_invariant_refs": [
     "INV-007",
     "INV-003"
    ]
   },
   {
    "id": "TASK-017",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013",
     "TASK-016"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/anchor/src/components/anchor-nav/anchor-nav.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/api-contract-builder.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/components/api-contract-node-editor.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/audit-diff/src/audit-diff.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/breadcrumb/src/breadcrumb.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/button/src/action-popover.scss",
     "versions/v19/projects/sdcorejs-angular/components/button/src/button.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/card/src/card.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/code-editor/src/code-editor.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/editor/src/plugins/image-upload/image-upload.plugin.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/folder-tree.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/item-list.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/preview-panel.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/transfer-panel.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/checkbox/control/checkbox-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/chip-calendar/control/chip-calendar-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/chip-string/control/chip-string-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/datetime/control/datetime-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/group/attribute/group-attribute.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/control/html-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/number/control/number-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/radio/control/radio-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/select/control/select-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/table/control/table-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/textarea/control/textarea-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/textfield/control/textfield-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/upload/control/upload-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-view.pipe.ts",
     "versions/v19/projects/sdcorejs-angular/components/history/src/history.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-017",
      "record_refs": [
       "R-013",
       "R-015",
       "R-019",
       "AC-024",
       "AC-026",
       "AC-030",
       "INV-001",
       "INV-004",
       "INV-007"
      ]
     }
    ],
    "justification_refs": [
     "R-013",
     "R-015",
     "R-019",
     "D-014",
     "D-029",
     "D-031"
    ],
    "enforces_invariant_refs": [
     "INV-001",
     "INV-004",
     "INV-007"
    ]
   },
   {
    "id": "TASK-018",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013",
     "TASK-016"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/import-excel/src/import-excel.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/job-progress/src/job-progress.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/modal/src/modal.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/operator/src/operator.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/org-chart/src/org-chart.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/actions-bar/actions-bar.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/build-chip/build-chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/chip-popover/chip-popover.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/field-picker/field-picker.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/popover-chip/popover-chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/query-bar.controls.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-builder/src/query-builder.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/quick-action/src/quick-action.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/splitter/src/splitter-handle/splitter-handle.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/splitter/src/splitter-panel/splitter-panel.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/stepper/src/stepper.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-item/tab-router-item.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-nav/tab-router-nav.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/tab/src/tab-group.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/tree/src/tree.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/components/preview/preview.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-018",
      "record_refs": [
       "R-013",
       "R-015",
       "R-019",
       "AC-024",
       "AC-026",
       "AC-030",
       "INV-001",
       "INV-004",
       "INV-007"
      ]
     }
    ],
    "justification_refs": [
     "R-013",
     "R-015",
     "R-019",
     "D-014",
     "D-029",
     "D-031"
    ],
    "enforces_invariant_refs": [
     "INV-001",
     "INV-004",
     "INV-007"
    ]
   },
   {
    "id": "TASK-019",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013",
     "TASK-016"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/command/desktop-command.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/config/config.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/view/view.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/quick-search/quick-search.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/mobile-cards/mobile-actions.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/mobile-cards/mobile-cards.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/popup-export/popup-export.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/selector-action/selector-action.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/table.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-019",
      "record_refs": [
       "R-013",
       "R-015",
       "R-019",
       "AC-024",
       "AC-026",
       "AC-030",
       "INV-001",
       "INV-004",
       "INV-007"
      ]
     }
    ],
    "justification_refs": [
     "R-013",
     "R-015",
     "R-019",
     "D-014",
     "D-029",
     "D-031"
    ],
    "enforces_invariant_refs": [
     "INV-001",
     "INV-004",
     "INV-007"
    ]
   },
   {
    "id": "TASK-020",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013",
     "TASK-016"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/forms/chip-calendar/src/chip-calendar.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/chip/src/chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/entity-picker/src/entity-picker.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/input-color/src/input-color.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/input-number/src/input-number.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/input/src/input.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/textarea/src/textarea.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/time-range/src/time-range.component.scss"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-020",
      "record_refs": [
       "R-013",
       "R-015",
       "R-019",
       "AC-024",
       "AC-026",
       "AC-030",
       "INV-001",
       "INV-004",
       "INV-007"
      ]
     }
    ],
    "justification_refs": [
     "R-013",
     "R-015",
     "R-019",
     "D-014",
     "D-029",
     "D-031"
    ],
    "enforces_invariant_refs": [
     "INV-001",
     "INV-004",
     "INV-007"
    ]
   },
   {
    "id": "TASK-021",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013",
     "TASK-016"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/assets/fonts/fonts.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/ckeditor5.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/_inline-edit.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/_read-state-panel.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/form.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/scrollbar.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_base.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_border.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_typography.scss",
     "versions/v19/projects/sdcorejs-angular/directives/src/sd-hover-copy.directive.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/page/page.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/menu-tree.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/user/user.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/user/user.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/modules/home/components/home-page/home-page.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/pipes/high-light-search.pipe.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
     "versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-021",
      "record_refs": [
       "R-013",
       "R-015",
       "R-019",
       "AC-024",
       "AC-026",
       "AC-030",
       "INV-001",
       "INV-004",
       "INV-007"
      ]
     }
    ],
    "justification_refs": [
     "R-013",
     "R-015",
     "R-019",
     "D-014",
     "D-029",
     "D-031"
    ],
    "enforces_invariant_refs": [
     "INV-001",
     "INV-004",
     "INV-007"
    ]
   },
   {
    "id": "TASK-022",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-006",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ],
    "planned_paths": [
     "versions/v19/eslint.config.js"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-022",
      "record_refs": [
       "R-018",
       "AC-029",
       "INV-007"
      ]
     }
    ],
    "justification_refs": [
     "R-018",
     "D-016"
    ],
    "enforces_invariant_refs": [
     "INV-007"
    ]
   },
   {
    "id": "TASK-023",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-014",
     "TASK-015",
     "TASK-016",
     "TASK-022"
    ],
    "planned_paths": [
     "package.json",
     ".github/workflows/ci.yml"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-023",
      "record_refs": [
       "R-018",
       "R-020",
       "AC-029",
       "AC-031",
       "INV-003",
       "INV-007",
       "INV-008"
      ]
     }
    ],
    "justification_refs": [
     "R-018",
     "R-020",
     "D-016"
    ],
    "enforces_invariant_refs": [
     "INV-003",
     "INV-007",
     "INV-008"
    ]
   },
   {
    "id": "TASK-024",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.virtual-scroll.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.virtual-scroll.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html",
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/select/sd-select.md",
     "showcase/src/app/pages/forms/select/select-demo.component.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-024",
      "record_refs": [
       "R-010",
       "R-011",
       "AC-020",
       "AC-021",
       "INV-001",
       "INV-003"
      ]
     }
    ],
    "justification_refs": [
     "R-010",
     "R-011",
     "D-001",
     "D-026",
     "D-030"
    ],
    "enforces_invariant_refs": [
     "INV-001",
     "INV-003"
    ]
   },
   {
    "id": "TASK-025",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-024"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.html",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/sd-autocomplete.md",
     "showcase/src/app/pages/forms/autocomplete/autocomplete-demo.component.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-025",
      "record_refs": [
       "R-011",
       "AC-022",
       "INV-001"
      ]
     }
    ],
    "justification_refs": [
     "R-011",
     "D-001",
     "D-026"
    ],
    "enforces_invariant_refs": [
     "INV-001"
    ]
   },
   {
    "id": "TASK-026",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-001"
    ],
    "planned_paths": [
     "scripts/release-package-contract.mjs",
     "scripts/release-package-contract.test.mjs",
     "scripts/deploy.ps1",
     "scripts/generate-showcase-changelog.test.mjs",
     "scripts/build-published-page.test.mjs",
     "scripts/collect-docs.test.mjs",
     "AGENTS.md",
     "CLAUDE.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-026",
      "record_refs": [
       "R-023",
       "AC-035",
       "INV-002"
      ]
     }
    ],
    "justification_refs": [
     "R-023",
     "D-019",
     "D-028"
    ],
    "enforces_invariant_refs": [
     "INV-002"
    ]
   },
   {
    "id": "TASK-027",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-013",
     "TASK-015",
     "TASK-021"
    ],
    "planned_paths": [
     "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
     "showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts",
     "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-027",
      "record_refs": [
       "R-022",
       "AC-034"
      ]
     }
    ],
    "justification_refs": [
     "R-022",
     "D-020",
     "D-023"
    ],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-028",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-011",
     "TASK-012",
     "TASK-024",
     "TASK-025",
     "TASK-027"
    ],
    "planned_paths": [
     "showcase/src/app/docs/core/documentation.registry.ts",
     "showcase/src/app/docs/core/documentation.registry.spec.ts",
     "showcase/src/app/docs/generated/example-manifest.generated.ts",
     "showcase/src/app/docs/generated/example-sources.generated.ts"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-028",
      "record_refs": [
       "R-022",
       "R-008",
       "R-009",
       "AC-033"
      ]
     }
    ],
    "justification_refs": [
     "R-022",
     "R-008",
     "R-009",
     "D-012"
    ],
    "enforces_invariant_refs": []
   },
   {
    "id": "TASK-029",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-004",
     "TASK-005",
     "TASK-006",
     "TASK-007",
     "TASK-008",
     "TASK-009",
     "TASK-010",
     "TASK-012",
     "TASK-023",
     "TASK-025",
     "TASK-026",
     "TASK-028"
    ],
    "planned_paths": [
     "CHANGELOG.md",
     "README.npm.md",
     "versions/v19/projects/sdcorejs-angular/README.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-029",
      "record_refs": [
       "R-024",
       "AC-036",
       "INV-002"
      ]
     }
    ],
    "justification_refs": [
     "R-024",
     "D-004"
    ],
    "enforces_invariant_refs": [
     "INV-002"
    ]
   },
   {
    "id": "TASK-030",
    "owner_repository_id": "sdcorejs-angular",
    "dependencies": [
     "TASK-029"
    ],
    "planned_paths": [
     ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-verification.md",
     "versions/v20/projects/sdcorejs-angular",
     "versions/v21/projects/sdcorejs-angular",
     "versions/v22/projects/sdcorejs-angular",
     "versions/v20/SYNC-STATUS.md",
     "versions/v21/SYNC-STATUS.md",
     "versions/v22/SYNC-STATUS.md"
    ],
    "planned_evidence": [
     {
      "id": "EVIDENCE-030",
      "record_refs": [
       "R-024",
       "AC-036",
       "AC-037",
       "AC-038",
       "INV-002",
       "INV-003",
       "INV-005"
      ]
     }
    ],
    "justification_refs": [
     "R-024",
     "D-004",
     "D-018",
     "D-035"
    ],
    "enforces_invariant_refs": [
     "INV-002",
     "INV-003",
     "INV-005"
    ]
   }
  ],
  "repository_inventory": {
   "repositories": [
    {
     "repository_id": "sdcorejs-angular",
     "existing_paths": [
      ".github/workflows/ci.yml",
      "AGENTS.md",
      "CHANGELOG.md",
      "CLAUDE.md",
      "README.npm.md",
      "package.json",
      "scripts/build-published-page.test.mjs",
      "scripts/collect-docs.test.mjs",
      "scripts/core-theme.test.mjs",
      "scripts/deploy.ps1",
      "scripts/generate-showcase-changelog.test.mjs",
      "scripts/release-package-contract.mjs",
      "scripts/release-package-contract.test.mjs",
      "showcase/src/app/docs/core/documentation.registry.spec.ts",
      "showcase/src/app/docs/core/documentation.registry.ts",
      "showcase/src/app/docs/generated/example-manifest.generated.ts",
      "showcase/src/app/docs/generated/example-sources.generated.ts",
      "showcase/src/app/pages/components/preview/preview-demo.component.ts",
      "showcase/src/app/pages/forms/autocomplete/autocomplete-demo.component.ts",
      "showcase/src/app/pages/forms/select/select-demo.component.ts",
      "versions/v19/eslint.config.js",
      "versions/v19/projects/sdcorejs-angular/README.md",
      "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
      "versions/v19/projects/sdcorejs-angular/assets/fonts/fonts.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/ckeditor5.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/core/_inline-edit.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/core/_read-state-panel.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/core/color.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/core/form.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/core/scrollbar.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_base.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_border.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_typography.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/sd-core.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
      "versions/v19/projects/sdcorejs-angular/assets/scss/themes/material-theme.scss",
      "versions/v19/projects/sdcorejs-angular/components/anchor/src/components/anchor-nav/anchor-nav.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/api-contract-builder.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/components/api-contract-node-editor.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/audit-diff/src/audit-diff.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/breadcrumb/src/breadcrumb.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/button/src/action-popover.scss",
      "versions/v19/projects/sdcorejs-angular/components/button/src/button.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/card/src/card.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/code-editor/src/code-editor.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/editor/sd-editor.md",
      "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/editor/src/plugins/image-upload/image-upload.plugin.scss",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/sd-file-explorer.md",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/folder-tree.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/item-list.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/preview-panel.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/preview-panel.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/transfer-panel.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.ts",
      "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.view-model.ts",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/checkbox/control/checkbox-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/chip-calendar/control/chip-calendar-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/chip-string/control/chip-string-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/datetime/control/datetime-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/group/attribute/group-attribute.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/control/html-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/number/control/number-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/radio/control/radio-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/select/control/select-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/table/control/table-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/textarea/control/textarea-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/textfield/control/textfield-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/upload/control/upload-control.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-view.pipe.ts",
      "versions/v19/projects/sdcorejs-angular/components/history/src/history.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/import-excel/src/import-excel.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/index.ts",
      "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/job-progress/src/job-progress.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/mini-editor/sd-mini-editor.md",
      "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/modal/src/modal.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/operator/src/operator.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/org-chart/src/org-chart.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/preview/index.ts",
      "versions/v19/projects/sdcorejs-angular/components/preview/sd-preview.md",
      "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.browser.ts",
      "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/sd-query-bar.md",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/actions-bar/actions-bar.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/build-chip/build-chip.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/chip-popover/chip-popover.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/field-picker/field-picker.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.ts",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/popover-chip/popover-chip.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-bar/src/query-bar.controls.scss",
      "versions/v19/projects/sdcorejs-angular/components/query-builder/src/query-builder.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/quick-action/src/quick-action.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/side-drawer/sd-side-drawer.md",
      "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.ts",
      "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/splitter/src/splitter-handle/splitter-handle.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/splitter/src/splitter-panel/splitter-panel.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/stepper/src/stepper.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-item/tab-router-item.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-nav/tab-router-nav.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/tab/src/tab-group.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/sd-table.md",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/command/desktop-command.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/config/config.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/view/view.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/quick-search/quick-search.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/mobile-cards/mobile-actions.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/mobile-cards/mobile-cards.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/popup-export/popup-export.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/components/selector-action/selector-action.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/table/src/models/table-option-export.model.ts",
      "versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts",
      "versions/v19/projects/sdcorejs-angular/components/table/src/table.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/tree/src/tree.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/upload-file/sd-upload-file.md",
      "versions/v19/projects/sdcorejs-angular/components/upload-file/src/components/preview/preview.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.html",
      "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.scss",
      "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.ts",
      "versions/v19/projects/sdcorejs-angular/directives/src/sd-hover-copy.directive.ts",
      "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts",
      "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.ts",
      "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.md",
      "versions/v19/projects/sdcorejs-angular/forms/autocomplete/sd-autocomplete.md",
      "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.html",
      "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.ts",
      "versions/v19/projects/sdcorejs-angular/forms/chip-calendar/src/chip-calendar.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/chip/src/chip.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.ts",
      "versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts",
      "versions/v19/projects/sdcorejs-angular/forms/entity-picker/src/entity-picker.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/inline-text/sd-inline-text.md",
      "versions/v19/projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.ts",
      "versions/v19/projects/sdcorejs-angular/forms/input-color/src/input-color.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/input-number/src/input-number.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/input/src/input.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/select/sd-select.md",
      "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html",
      "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.ts",
      "versions/v19/projects/sdcorejs-angular/forms/textarea/src/textarea.component.scss",
      "versions/v19/projects/sdcorejs-angular/forms/time-range/src/time-range.component.scss",
      "versions/v19/projects/sdcorejs-angular/i18n/i18n.md",
      "versions/v19/projects/sdcorejs-angular/i18n/src/en.ts",
      "versions/v19/projects/sdcorejs-angular/i18n/src/i18n.service.spec.ts",
      "versions/v19/projects/sdcorejs-angular/i18n/src/i18n.service.ts",
      "versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts",
      "versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts",
      "versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts",
      "versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/page/page.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/menu-tree.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/user/user.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/main.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/user/user.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/main.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/modules/forbidden/pages/root/root.component.ts",
      "versions/v19/projects/sdcorejs-angular/modules/layout/modules/home/components/home-page/home-page.component.scss",
      "versions/v19/projects/sdcorejs-angular/modules/layout/modules/home/components/home-page/home-page.component.ts",
      "versions/v19/projects/sdcorejs-angular/modules/layout/modules/not-found/pages/root/root.component.ts",
      "versions/v19/projects/sdcorejs-angular/modules/layout/pipes/high-light-search.pipe.ts",
      "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
      "versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast-container.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast-container.component.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
      "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
      "versions/v19/projects/sdcorejs-angular/utilities/extensions/extensions.md",
      "versions/v19/projects/sdcorejs-angular/utilities/extensions/index.ts",
      "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/url-safety.spec.ts",
      "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/url-safety.ts",
      "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/utility.extension.spec.ts",
      "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/utility.extension.ts",
      "versions/v19/projects/sdcorejs-angular/utilities/index.ts",
      "versions/v20/SYNC-STATUS.md",
      "versions/v20/projects/sdcorejs-angular",
      "versions/v21/SYNC-STATUS.md",
      "versions/v21/projects/sdcorejs-angular",
      "versions/v22/SYNC-STATUS.md",
      "versions/v22/projects/sdcorejs-angular"
     ],
     "intended_new_paths": [
      {
       "path": ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-baseline.md",
       "owner_task_id": "TASK-001"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.ts",
       "owner_task_id": "TASK-003"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.spec.ts",
       "owner_task_id": "TASK-003"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.ts",
       "owner_task_id": "TASK-003"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.spec.ts",
       "owner_task_id": "TASK-003"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.spec.ts",
       "owner_task_id": "TASK-009"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/highlight/ng-package.json",
       "owner_task_id": "TASK-011"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/highlight/index.ts",
       "owner_task_id": "TASK-011"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/highlight/sd-highlight.md",
       "owner_task_id": "TASK-011"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.ts",
       "owner_task_id": "TASK-011"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.spec.ts",
       "owner_task_id": "TASK-011"
      },
      {
       "path": "showcase/src/app/pages/components/highlight/highlight-demo.component.ts",
       "owner_task_id": "TASK-011"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.ts",
       "owner_task_id": "TASK-012"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.html",
       "owner_task_id": "TASK-012"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.scss",
       "owner_task_id": "TASK-012"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.spec.ts",
       "owner_task_id": "TASK-012"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_scales.scss",
       "owner_task_id": "TASK-013"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_semantic.scss",
       "owner_task_id": "TASK-013"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_ramps.scss",
       "owner_task_id": "TASK-013"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
       "owner_task_id": "TASK-013"
      },
      {
       "path": "scripts/theme-contrast.test.mjs",
       "owner_task_id": "TASK-014"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/theme/ng-package.json",
       "owner_task_id": "TASK-015"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/theme/index.ts",
       "owner_task_id": "TASK-015"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/theme/theme.md",
       "owner_task_id": "TASK-015"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.ts",
       "owner_task_id": "TASK-015"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.spec.ts",
       "owner_task_id": "TASK-015"
      },
      {
       "path": "scripts/theme-token-list.test.mjs",
       "owner_task_id": "TASK-015"
      },
      {
       "path": "scripts/check-scss-hex.mjs",
       "owner_task_id": "TASK-016"
      },
      {
       "path": "scripts/check-scss-hex.test.mjs",
       "owner_task_id": "TASK-016"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/forms/select/src/select.virtual-scroll.spec.ts",
       "owner_task_id": "TASK-024"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.virtual-scroll.spec.ts",
       "owner_task_id": "TASK-024"
      },
      {
       "path": "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
       "owner_task_id": "TASK-027"
      },
      {
       "path": "showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts",
       "owner_task_id": "TASK-027"
      },
      {
       "path": ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-verification.md",
       "owner_task_id": "TASK-030"
      }
     ]
    }
   ]
  },
  "critique_history": [
   {
    "round": 1,
    "checker_version": "sdcorejs-plan:goal-backward:v1",
    "blockers": [],
    "resolved_blockers": [],
    "unresolved_blockers": []
   }
  ]
 },
 "validation_map": [
  {
   "requirement_id": "R-001",
   "acceptance_criterion_id": "AC-001",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-001-server-or-local-export-where-the-row-cou"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-010",
    "EVIDENCE-012",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "No file is written, a warning notification with the i18n limit message is shown, exporting resets to false",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-001",
   "acceptance_criterion_id": "AC-002",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-002-export-with-max-unset-or-row-count-withi"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-010",
    "EVIDENCE-012",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Export behaves exactly as in 2.15 and existing export specs stay green",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-002",
   "acceptance_criterion_id": "AC-003",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-003-showing-info-success-and-warning-error-t"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-010",
    "EVIDENCE-012",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/services/notify/src/components/toast-container.component.spec.ts --include=projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "The persistent polite region announces info/success and the assertive region announces warning/error",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-002",
   "acceptance_criterion_id": "AC-004",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-004-keyboard-focus-enters-and-leaves-a-toast"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-010",
    "EVIDENCE-012",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Auto-dismiss pauses while focus is inside and resumes on blur; hover pause still works",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-002",
   "acceptance_criterion_id": "AC-005",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-005-rendering-toast-buttons"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-010",
    "EVIDENCE-012",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Close and action buttons are type=button and the close button has an i18n aria-label",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-003",
   "acceptance_criterion_id": "AC-006",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-006-keyboard-focus-on-and-off-a-tooltip-host"
   ],
   "evidence_refs": [],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "The tooltip shows on focus and hides on blur; the bubble has role=tooltip; the host aria-describedby includes the bubble id only while visible and keeps existing ids",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-003",
   "acceptance_criterion_id": "AC-007",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-007-pressing-escape-with-the-tooltip-visible"
   ],
   "evidence_refs": [],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Visible: tooltip hides and the event does not propagate; hidden: the event propagates unchanged",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-003",
   "acceptance_criterion_id": "AC-008",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-008-pointer-moves-from-host-into-the-bubble"
   ],
   "evidence_refs": [],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "The bubble stays visible while hovered; the default background comes from a token and the directive has no hex literal",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-004",
   "acceptance_criterion_id": "AC-009",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-009-inspecting-the-mini-editor-ckeditor-link"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-007",
    "EVIDENCE-008",
    "EVIDENCE-011",
    "EVIDENCE-012",
    "EVIDENCE-016",
    "EVIDENCE-023",
    "EVIDENCE-024",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "link.allowedProtocols is https, http, mailto, tel",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-004",
   "acceptance_criterion_id": "AC-010",
   "invariant_refs": [
    "INV-003",
    "INV-006"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-010-editor-and-mini-editor-emit-html-contain"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-007",
    "EVIDENCE-008",
    "EVIDENCE-011",
    "EVIDENCE-012",
    "EVIDENCE-016",
    "EVIDENCE-023",
    "EVIDENCE-024",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.spec.ts --include=projects/sdcorejs-angular/components/editor/src/editor.component.spec.ts --include=projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Unsafe URLs and on* attributes are removed; styles, tables and safe images are kept across valueChange, sdChange, contentChange and form value",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-005",
   "acceptance_criterion_id": "AC-011",
   "invariant_refs": [
    "INV-006"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-011-evaluating-the-url-guard-against-allowed"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-007",
    "EVIDENCE-008",
    "EVIDENCE-011",
    "EVIDENCE-012"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/utilities/extensions/src/url-safety.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "https, http, relative, blob, data:image/* and data:application/pdf pass; javascript:, vbscript:, other data: and file: are blocked",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-005",
   "acceptance_criterion_id": "AC-012",
   "invariant_refs": [
    "INV-006"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-012-triggering-downloads-with-blocked-urls-i"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-007",
    "EVIDENCE-008",
    "EVIDENCE-011",
    "EVIDENCE-012"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/utilities/extensions/src/utility.extension.spec.ts --include=projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.spec.ts --include=projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts --include=projects/sdcorejs-angular/components/upload-file/src/upload-file.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "No anchor navigation happens; upload-file no longer renders href=\"javascript:;\"",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-006",
   "acceptance_criterion_id": "AC-013",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-013-locking-and-releasing-body-scroll-with-a"
   ],
   "evidence_refs": [],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.spec.ts --include=projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "padding-right grows by the scrollbar width once, is restored on final release, and container mode is untouched",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-007",
   "acceptance_criterion_id": "AC-014",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-014-switching-language-and-rendering-date-da"
   ],
   "evidence_refs": [
    "EVIDENCE-010",
    "EVIDENCE-012"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/i18n/src/i18n.service.spec.ts --include=projects/sdcorejs-angular/forms/date/src/date.component.spec.ts --include=projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts --include=projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "locale() returns the mapped BCP-47 tag and formatting follows it; no vi-VN literal remains in library code except the single mapping table",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-015",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-015-rendering-sd-preview-video-with-url-blob"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-010",
    "EVIDENCE-012",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "A native video with controls plays; Blob URLs are revoked on destroy; errors show an i18n message with retry; downloads obey the URL guard; autoId attributes exist",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-016",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-016-opening-a-video-file-in-the-file-explore"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-010",
    "EVIDENCE-012",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "sd-preview-video renders instead of the unavailable fallback",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-008",
   "acceptance_criterion_id": "AC-017",
   "invariant_refs": [
    "INV-005"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-017-reviewing-sd-preview-md-and-the-showcase"
   ],
   "evidence_refs": [
    "EVIDENCE-002",
    "EVIDENCE-004",
    "EVIDENCE-005",
    "EVIDENCE-010",
    "EVIDENCE-012",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "uat"
   ],
   "planned_command": null,
   "command_source": "manual",
   "cwd": "showcase",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "manual",
   "expected_proof": "The video section is documented, the duplicated pdf section is removed, and the demo plays a sample video",
   "status": "covered",
   "rationale": "Video playback and doc rendering need a human check; no browser automation in this environment (A-006).",
   "owner": "user",
   "acknowledgement_required": true
  },
  {
   "requirement_id": "R-009",
   "acceptance_criterion_id": "AC-018",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-018-running-highlight-utilities-on-diacritic"
   ],
   "evidence_refs": [
    "EVIDENCE-003"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/utilities/extensions/src/text-search.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Normalization and ranges match expected original-index ranges without throwing",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-009",
   "acceptance_criterion_id": "AC-019",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-019-rendering-sd-highlight-with-text-contain"
   ],
   "evidence_refs": [
    "EVIDENCE-011"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/components/highlight/src/highlight.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Matches render inside mark elements and markup is shown as text, never parsed",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-010",
   "acceptance_criterion_id": "AC-020",
   "invariant_refs": [
    "INV-001",
    "INV-003"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-020-using-sd-select-with-virtualscroll-off"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-013",
    "EVIDENCE-016",
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021",
    "EVIDENCE-023",
    "EVIDENCE-024",
    "EVIDENCE-025",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/forms/select/src/select.component.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "DOM and behaviour are identical to 2.15; no virtual viewport exists; existing select specs stay green",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-010",
   "acceptance_criterion_id": "AC-021",
   "invariant_refs": [
    "INV-001",
    "INV-003"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-021-using-sd-select-with-virtualscroll-on-an"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-013",
    "EVIDENCE-016",
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021",
    "EVIDENCE-023",
    "EVIDENCE-024",
    "EVIDENCE-025",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/forms/select/src/select.virtual-scroll.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Rendered options stay bounded; End/PageDown/typeahead reach every item; multi keeps selected values outside the viewport; trigger shows all selected labels; select-all covers the filtered set",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-011",
   "acceptance_criterion_id": "AC-022",
   "invariant_refs": [
    "INV-001"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-022-using-sd-autocomplete-with-virtualscroll"
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
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.spec.ts --include=projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.virtual-scroll.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Off is identical to 2.15; on keeps rendering bounded, arrow keys reach every item and selection emits the right value",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-013",
   "acceptance_criterion_id": "AC-024",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-024-scanning-library-focus-rules-and-computi"
   ],
   "evidence_refs": [
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run check:scss-hex",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Every focus outline colour comes from a token (shared, hook with shared fallback, or component token); no hex remains; without hooks the default colour equals the primary colour; light appearance is unchanged",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-014",
   "acceptance_criterion_id": "AC-025",
   "invariant_refs": [
    "INV-004"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-025-compiling-default-every-preset-and-dark"
   ],
   "evidence_refs": [
    "EVIDENCE-013",
    "EVIDENCE-015",
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run test:theme",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "All new semantic tokens are emitted with the documented derivations",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-015",
   "acceptance_criterion_id": "AC-026",
   "invariant_refs": [
    "INV-004"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-026-compiling-themes-and-reviewing-the-liter"
   ],
   "evidence_refs": [
    "EVIDENCE-013",
    "EVIDENCE-015",
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run test:theme",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Non-colour tokens are emitted; only exact-value literals were replaced; utility classes are unchanged",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-016",
   "acceptance_criterion_id": "AC-027",
   "invariant_refs": [
    "INV-004"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-027-comparing-theme-output-with-2-15"
   ],
   "evidence_refs": [
    "EVIDENCE-013",
    "EVIDENCE-015",
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run test:theme",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Ramp tokens exist for 7 families x 11 steps; -light, -dark and -contrast values are unchanged for default and presets",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-017",
   "acceptance_criterion_id": "AC-028",
   "invariant_refs": [
    "INV-001",
    "INV-008"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-028-compiling-sd-theme-with-mode-omitted-dar"
   ],
   "evidence_refs": [
    "EVIDENCE-013",
    "EVIDENCE-014",
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021",
    "EVIDENCE-023",
    "EVIDENCE-024",
    "EVIDENCE-025"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run test:theme",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Omitted mode keeps every 2.15 declaration with identical values and only adds new --sd-* properties and [data-sd-theme] blocks; dark redeclares every public and semantic token plus Material dark under [data-sd-theme=dark] with color-scheme dark; auto applies dark via prefers-color-scheme unless [data-sd-theme=light]",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-018",
   "acceptance_criterion_id": "AC-029",
   "invariant_refs": [
    "INV-003",
    "INV-007"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-029-running-the-eslint-hex-rule-and-the-scss"
   ],
   "evidence_refs": [
    "EVIDENCE-003",
    "EVIDENCE-016",
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021",
    "EVIDENCE-022",
    "EVIDENCE-023",
    "EVIDENCE-024",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run test:scripts",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Planted hex fails, var() fallbacks and exemptions pass, the repository passes, and both run in CI",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-019",
   "acceptance_criterion_id": "AC-030",
   "invariant_refs": [
    "INV-004",
    "INV-007"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-030-scanning-library-scss-and-ts-after-migra"
   ],
   "evidence_refs": [
    "EVIDENCE-013",
    "EVIDENCE-015",
    "EVIDENCE-016",
    "EVIDENCE-017",
    "EVIDENCE-018",
    "EVIDENCE-019",
    "EVIDENCE-020",
    "EVIDENCE-021",
    "EVIDENCE-022",
    "EVIDENCE-023"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run check:scss-hex",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Zero raw hex remains outside documented exemptions and sampled computed styles are unchanged",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-020",
   "acceptance_criterion_id": "AC-031",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-031-running-test-scripts-in-ci-with-a-contra"
   ],
   "evidence_refs": [
    "EVIDENCE-014",
    "EVIDENCE-023"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run test:scripts",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "test:theme runs inside test:scripts, covers the pair matrix for default, existing presets and dark, and fails on the lowered pair",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-021",
   "acceptance_criterion_id": "AC-032",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-032-importing-sdcorejs-angular-utilities-the"
   ],
   "evidence_refs": [
    "EVIDENCE-015"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm test -- --watch=false --browsers=ChromeHeadless --include=projects/sdcorejs-angular/utilities/theme/src/theme-tokens.spec.ts",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "The entry builds; readSdTokens returns resolved values in a browser and an empty record without a document; SdColorToken matches the public token list",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-022",
   "acceptance_criterion_id": "AC-033",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-033-building-the-showcase-and-published-docs"
   ],
   "evidence_refs": [],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "component"
   ],
   "planned_command": "npm run test -- --include=src/app/docs/core/documentation.registry.spec.ts",
   "command_source": "package.json",
   "cwd": "showcase",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "The Theme & tokens page and THEME.md are registered, registry counts are updated and the docs guard passes",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-022",
   "acceptance_criterion_id": "AC-034",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-034-viewing-the-theme-tokens-page"
   ],
   "evidence_refs": [
    "EVIDENCE-027"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "uat"
   ],
   "planned_command": null,
   "command_source": "manual",
   "cwd": "showcase",
   "evidence_class": "SUPPLEMENTAL_SMOKE",
   "automation": "manual",
   "expected_proof": "Swatches, ramps, tokens, contrast tables and the dark toggle render correctly in light and dark",
   "status": "covered",
   "rationale": "Visual quality of swatches, contrast tables and the dark toggle needs a human check (A-006).",
   "owner": "user",
   "acknowledgement_required": true
  },
  {
   "requirement_id": "R-023",
   "acceptance_criterion_id": "AC-035",
   "invariant_refs": [],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-035-running-release-tooling-tests-for-3-0-wi"
   ],
   "evidence_refs": [
    "EVIDENCE-026"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run test:release-package-contract",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "Targets are 19.3.0, 20.3.0, 21.3.0, 22.3.0 with *.2.15 baselines; x.0 without an explicit baseline is rejected; existing tests stay green",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-024",
   "acceptance_criterion_id": "AC-036",
   "invariant_refs": [
    "INV-002"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-036-reviewing-changelog-readmes-and-derived"
   ],
   "evidence_refs": [
    "EVIDENCE-026",
    "EVIDENCE-029",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run check:sync",
   "command_source": "package.json",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "CHANGELOG [Unreleased] has a BREAKING section with migration diffs; README parity and check:sync pass; the mojibake scan is clean",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-024",
   "acceptance_criterion_id": "AC-037",
   "invariant_refs": [
    "INV-002"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-037-running-v19-karma-with-coverage-the-libr"
   ],
   "evidence_refs": [
    "EVIDENCE-026",
    "EVIDENCE-029",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "unit"
   ],
   "planned_command": "npm run test:ci",
   "command_source": "package.json",
   "cwd": "versions/v19",
   "evidence_class": "UNIT",
   "automation": "automated",
   "expected_proof": "All pass with coverage thresholds met",
   "status": "covered",
   "rationale": null,
   "owner": null,
   "acknowledgement_required": false
  },
  {
   "requirement_id": "R-024",
   "acceptance_criterion_id": "AC-038",
   "invariant_refs": [
    "INV-002"
   ],
   "risk": "regression",
   "boundary": {
    "kind": "none",
    "approval_ref": "D-035",
    "source_refs": [
     "R-001",
     "R-002",
     "R-003",
     "R-004",
     "R-005",
     "R-006",
     "R-007",
     "R-008",
     "R-009",
     "R-010",
     "R-011",
     "R-013",
     "R-014",
     "R-015",
     "R-016",
     "R-017",
     "R-018",
     "R-019",
     "R-020",
     "R-021",
     "R-022",
     "R-023",
     "R-024",
     "AC-001",
     "AC-002",
     "AC-003",
     "AC-004",
     "AC-005",
     "AC-006",
     "AC-007",
     "AC-008",
     "AC-009",
     "AC-010",
     "AC-011",
     "AC-012",
     "AC-013",
     "AC-014",
     "AC-015",
     "AC-016",
     "AC-017",
     "AC-018",
     "AC-019",
     "AC-020",
     "AC-021",
     "AC-022",
     "AC-024",
     "AC-025",
     "AC-026",
     "AC-027",
     "AC-028",
     "AC-029",
     "AC-030",
     "AC-031",
     "AC-032",
     "AC-033",
     "AC-034",
     "AC-035",
     "AC-036",
     "AC-037",
     "AC-038",
     "INV-001",
     "INV-002",
     "INV-003",
     "INV-004",
     "INV-005",
     "INV-006",
     "INV-007",
     "INV-008"
    ]
   },
   "authorization_boundary": false,
   "case_ids": [
    "case-ac-038-installing-and-building-v20-v21-and-v22"
   ],
   "evidence_refs": [
    "EVIDENCE-026",
    "EVIDENCE-029",
    "EVIDENCE-030"
   ],
   "module_e2e": false,
   "module_id": null,
   "owner_repository_id": null,
   "levels": [
    "integration"
   ],
   "planned_command": null,
   "command_source": "manual",
   "cwd": ".",
   "evidence_class": "UNIT",
   "automation": "deferred",
   "expected_proof": "All derived lines build; executed at the release-cut gate",
   "status": "deferred",
   "rationale": "Derived Angular 20-22 installs and builds run at the release-cut gate (D-004).",
   "owner": "release owner",
   "acknowledgement_required": true
  }
 ],
 "contract_id": "angular-core-3-0-release-20260925",
 "requirement_id": "R-001",
 "approved_spec_path": ".sdcorejs/specs/angular/2026-09-25-18-10-core-3-0-release.md",
 "approved_spec_hash": "sha256:v1:7282d6236f6e5f5c989e12d750120d1ee26604484d10d59873eb582084ef998a",
 "approved_spec_reference": {
  "immutable_identity": {
   "repository_id": "sdcorejs-angular",
   "artifact_id": "spec-angular-core-3-0-release-20260925-r3",
   "artifact_kind": "spec",
   "revision": "726df9964721a10740cb7bdd6e100a03307ef39a",
   "approval_hash": "sha256:v1:7282d6236f6e5f5c989e12d750120d1ee26604484d10d59873eb582084ef998a",
   "repository_relative_path": ".sdcorejs/specs/angular/2026-09-25-18-10-core-3-0-release.md"
  }
 },
 "approved_architecture_path": ".sdcorejs/architecture/angular/2026-09-25-18-30-core-3-0-release.md",
 "approved_architecture_hash": "sha256:v1:fc9451fe139114d0439b7ef4468ca650503fb63976003d1209250e8448874f5c",
 "approved_plan_path": "",
 "approved_plan_hash": "",
 "supersedes": ".sdcorejs/plans/angular/2026-09-25-18-45-core-3-0-release.md",
 "target_root": "C:/wt/core-3.0",
 "target_root_kind": "target-project",
 "owner_repository_id": "sdcorejs-angular",
 "owner_repository_role": "library",
 "owner_module_id": null,
 "execution_host_repository_id": "portal-onehub",
 "integration_owner_repository_id": "sdcorejs-angular",
 "dependency_order": [
  "sdcorejs-angular"
 ],
 "gitlink_updates_in_scope": false,
 "track": "angular",
 "stack_profile": "core-ui-angular",
 "task_count": 30,
 "phase_count": 9,
 "allowed_paths": [
  ".github/workflows/ci.yml",
  ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-baseline.md",
  ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-verification.md",
  "AGENTS.md",
  "CHANGELOG.md",
  "CLAUDE.md",
  "README.npm.md",
  "package.json",
  "scripts/build-published-page.test.mjs",
  "scripts/check-scss-hex.mjs",
  "scripts/check-scss-hex.test.mjs",
  "scripts/collect-docs.test.mjs",
  "scripts/core-theme.test.mjs",
  "scripts/deploy.ps1",
  "scripts/generate-showcase-changelog.test.mjs",
  "scripts/release-package-contract.mjs",
  "scripts/release-package-contract.test.mjs",
  "scripts/theme-contrast.test.mjs",
  "scripts/theme-token-list.test.mjs",
  "showcase/src/app/docs/core/documentation.registry.spec.ts",
  "showcase/src/app/docs/core/documentation.registry.ts",
  "showcase/src/app/docs/generated/example-manifest.generated.ts",
  "showcase/src/app/docs/generated/example-sources.generated.ts",
  "showcase/src/app/pages/components/highlight/highlight-demo.component.ts",
  "showcase/src/app/pages/components/preview/preview-demo.component.ts",
  "showcase/src/app/pages/forms/autocomplete/autocomplete-demo.component.ts",
  "showcase/src/app/pages/forms/select/select-demo.component.ts",
  "showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts",
  "versions/v19/eslint.config.js",
  "versions/v19/projects/sdcorejs-angular/README.md",
  "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md",
  "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
  "versions/v19/projects/sdcorejs-angular/assets/fonts/fonts.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/ckeditor5.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/core/_inline-edit.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/core/_read-state-panel.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/core/color.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/core/form.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/core/scrollbar.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_base.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_border.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_typography.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/sd-core.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_ramps.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_scales.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_semantic.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
  "versions/v19/projects/sdcorejs-angular/assets/scss/themes/material-theme.scss",
  "versions/v19/projects/sdcorejs-angular/components/anchor/src/components/anchor-nav/anchor-nav.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/api-contract-builder.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/components/api-contract-node-editor.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/audit-diff/src/audit-diff.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/breadcrumb/src/breadcrumb.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/button/src/action-popover.scss",
  "versions/v19/projects/sdcorejs-angular/components/button/src/button.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/card/src/card.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/code-editor/src/code-editor.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/editor/sd-editor.md",
  "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/editor/src/plugins/image-upload/image-upload.plugin.scss",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/sd-file-explorer.md",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/folder-tree.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/item-list.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/preview-panel.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/preview-panel.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/transfer-panel.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.ts",
  "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.view-model.ts",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/checkbox/control/checkbox-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/chip-calendar/control/chip-calendar-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/chip-string/control/chip-string-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/datetime/control/datetime-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/group/attribute/group-attribute.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/control/html-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/number/control/number-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/radio/control/radio-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/select/control/select-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/table/control/table-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/textarea/control/textarea-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/textfield/control/textfield-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/upload/control/upload-control.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-view.pipe.ts",
  "versions/v19/projects/sdcorejs-angular/components/highlight/index.ts",
  "versions/v19/projects/sdcorejs-angular/components/highlight/ng-package.json",
  "versions/v19/projects/sdcorejs-angular/components/highlight/sd-highlight.md",
  "versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/history/src/history.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/import-excel/src/import-excel.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/index.ts",
  "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/job-progress/src/job-progress.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/mini-editor/sd-mini-editor.md",
  "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/modal/src/modal.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/operator/src/operator.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/org-chart/src/org-chart.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/preview/index.ts",
  "versions/v19/projects/sdcorejs-angular/components/preview/sd-preview.md",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.browser.ts",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.html",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/sd-query-bar.md",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/actions-bar/actions-bar.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/build-chip/build-chip.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/chip-popover/chip-popover.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/field-picker/field-picker.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.ts",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/popover-chip/popover-chip.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-bar/src/query-bar.controls.scss",
  "versions/v19/projects/sdcorejs-angular/components/query-builder/src/query-builder.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/quick-action/src/quick-action.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/side-drawer/sd-side-drawer.md",
  "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.ts",
  "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/splitter/src/splitter-handle/splitter-handle.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/splitter/src/splitter-panel/splitter-panel.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/stepper/src/stepper.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-item/tab-router-item.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-nav/tab-router-nav.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/tab/src/tab-group.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/sd-table.md",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/command/desktop-command.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/config/config.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/view/view.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/quick-search/quick-search.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/mobile-cards/mobile-actions.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/mobile-cards/mobile-cards.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/popup-export/popup-export.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/components/selector-action/selector-action.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/table/src/models/table-option-export.model.ts",
  "versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts",
  "versions/v19/projects/sdcorejs-angular/components/table/src/table.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/tree/src/tree.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/upload-file/sd-upload-file.md",
  "versions/v19/projects/sdcorejs-angular/components/upload-file/src/components/preview/preview.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.html",
  "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.scss",
  "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.ts",
  "versions/v19/projects/sdcorejs-angular/directives/src/sd-hover-copy.directive.ts",
  "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts",
  "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.ts",
  "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.md",
  "versions/v19/projects/sdcorejs-angular/forms/autocomplete/sd-autocomplete.md",
  "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.html",
  "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.ts",
  "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.virtual-scroll.spec.ts",
  "versions/v19/projects/sdcorejs-angular/forms/chip-calendar/src/chip-calendar.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/chip/src/chip.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.ts",
  "versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts",
  "versions/v19/projects/sdcorejs-angular/forms/entity-picker/src/entity-picker.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/inline-text/sd-inline-text.md",
  "versions/v19/projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.ts",
  "versions/v19/projects/sdcorejs-angular/forms/input-color/src/input-color.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/input-number/src/input-number.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/input/src/input.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/select/sd-select.md",
  "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html",
  "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.ts",
  "versions/v19/projects/sdcorejs-angular/forms/select/src/select.virtual-scroll.spec.ts",
  "versions/v19/projects/sdcorejs-angular/forms/textarea/src/textarea.component.scss",
  "versions/v19/projects/sdcorejs-angular/forms/time-range/src/time-range.component.scss",
  "versions/v19/projects/sdcorejs-angular/i18n/i18n.md",
  "versions/v19/projects/sdcorejs-angular/i18n/src/en.ts",
  "versions/v19/projects/sdcorejs-angular/i18n/src/i18n.service.spec.ts",
  "versions/v19/projects/sdcorejs-angular/i18n/src/i18n.service.ts",
  "versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts",
  "versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts",
  "versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts",
  "versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/page/page.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/menu-tree.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/user/user.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/main.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/user/user.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/main.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/modules/forbidden/pages/root/root.component.ts",
  "versions/v19/projects/sdcorejs-angular/modules/layout/modules/home/components/home-page/home-page.component.scss",
  "versions/v19/projects/sdcorejs-angular/modules/layout/modules/home/components/home-page/home-page.component.ts",
  "versions/v19/projects/sdcorejs-angular/modules/layout/modules/not-found/pages/root/root.component.ts",
  "versions/v19/projects/sdcorejs-angular/modules/layout/pipes/high-light-search.pipe.ts",
  "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
  "versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast-container.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast-container.component.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
  "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/extensions.md",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/index.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.spec.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.spec.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/url-safety.spec.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/url-safety.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/utility.extension.spec.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/utility.extension.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/index.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/theme/index.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/theme/ng-package.json",
  "versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.spec.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.ts",
  "versions/v19/projects/sdcorejs-angular/utilities/theme/theme.md",
  "versions/v20/SYNC-STATUS.md",
  "versions/v20/projects/sdcorejs-angular/**",
  "versions/v21/SYNC-STATUS.md",
  "versions/v21/projects/sdcorejs-angular/**",
  "versions/v22/SYNC-STATUS.md",
  "versions/v22/projects/sdcorejs-angular/**"
 ],
 "prohibited_paths": [
  "published-docs/**",
  "published-pages/**",
  ".github/workflows/publish-npm.yml",
  "scripts/release-contracts/**",
  "**/package-lock.json",
  "**/.env*",
  "**/node_modules/**",
  "**/dist/**"
 ],
 "generated_artifacts": [
  "versions/v20/**",
  "versions/v21/**",
  "versions/v22/**",
  "showcase/src/app/docs/generated/example-manifest.generated.ts"
 ],
 "docs_artifacts": [
  "versions/v19/projects/sdcorejs-angular/**/*.md",
  "CHANGELOG.md",
  "README.npm.md",
  "AGENTS.md",
  "CLAUDE.md",
  ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-verification.md"
 ],
 "dependency_changes": {
  "required": false,
  "packages": [],
  "approval_required": false
 },
 "env_changes": {
  "required": false,
  "files": [],
  "approval_required": false
 },
 "migration_changes": {
  "required": false,
  "description": null,
  "approval_required": false
 },
 "frontend_architecture": {
  "required": true,
  "conformance_invariant_refs": [
   "INV-001",
   "INV-003",
   "INV-005",
   "INV-006",
   "INV-007"
  ],
  "not_applicable_reason": null,
  "project_conventions": {
   "component_style": "Standalone, signals (input/model/output/computed), OnPush, native control flow with @let caching.",
   "folder_convention": "Each component is a secondary entry point: components/<name>/{ng-package.json,index.ts,src/,sd-<name>.md}.",
   "state_convention": "Component-local signals; root services for cross-cutting state (I18nService, NotifyService, SdBodyScrollLockService).",
   "service_data_access_convention": "No data access in this change; pure helpers in utilities/extensions.",
   "registration_provider_convention": "providedIn root services; no NgModules; standalone imports.",
   "public_api_barrel_convention": "Entry index.ts plus components/index.ts and utilities/index.ts barrels re-exported by src/public-api.ts.",
   "test_convention": "Karma/Jasmine colocated *.spec.ts; node:test for scripts; TDD required for components/forms.",
   "evidence_inspected": [
    "versions/v19/projects/sdcorejs-angular/src/public-api.ts",
    "versions/v19/projects/sdcorejs-angular/components/index.ts",
    "versions/v19/projects/sdcorejs-angular/utilities/index.ts",
    "versions/v19/projects/sdcorejs-angular/components/preview/index.ts",
    "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html",
    "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
    "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.ts",
    "AGENTS.md",
    "CLAUDE.md"
   ]
  },
  "component_tree": [
   "sd-highlight (components/highlight) — leaf; renders text and mark segments from sdFindHighlightRanges",
   "sd-preview-video (components/preview/src/preview-video) — leaf media viewer; hosted lazily by file-explorer preview-panel",
   "toast-container (services/notify) — owns live regions; renders toast children",
   "sd-select / sd-autocomplete — existing components gain an opt-in virtual branch (viewport + shell per D-026/D-030)"
  ],
  "reuse_decisions": [
   "URL parsing: extend sdParseUrl/sdResolveBaseOrigin in utilities/extensions/src/url-safety.ts",
   "Lazy preview hosting: extend the preview-panel lazy pdf pattern in file-explorer",
   "Virtual list: reuse @angular/cdk/scrolling (existing peer)",
   "Scroll lock: extend SdBodyScrollLockService (side-drawer)",
   "Normalization: shared sdNormalizeSearchText; private helpers in file-explorer/tree stay (deferred)"
  ],
  "file_decisions": [
   "TASK-001: create .sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-baseline.md",
   "TASK-003: create versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.ts, versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.spec.ts, versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.ts, versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.spec.ts",
   "TASK-009: create versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.spec.ts",
   "TASK-011: create versions/v19/projects/sdcorejs-angular/components/highlight/ng-package.json, versions/v19/projects/sdcorejs-angular/components/highlight/index.ts, versions/v19/projects/sdcorejs-angular/components/highlight/sd-highlight.md, versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.ts, versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.spec.ts, showcase/src/app/pages/components/highlight/highlight-demo.component.ts",
   "TASK-012: create versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.ts, versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.html, versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.scss, versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.spec.ts",
   "TASK-013: create versions/v19/projects/sdcorejs-angular/assets/scss/themes/_scales.scss, versions/v19/projects/sdcorejs-angular/assets/scss/themes/_semantic.scss, versions/v19/projects/sdcorejs-angular/assets/scss/themes/_ramps.scss, versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
   "TASK-014: create scripts/theme-contrast.test.mjs",
   "TASK-015: create versions/v19/projects/sdcorejs-angular/utilities/theme/ng-package.json, versions/v19/projects/sdcorejs-angular/utilities/theme/index.ts, versions/v19/projects/sdcorejs-angular/utilities/theme/theme.md, versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.ts, versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.spec.ts, scripts/theme-token-list.test.mjs",
   "TASK-016: create scripts/check-scss-hex.mjs, scripts/check-scss-hex.test.mjs",
   "TASK-024: create versions/v19/projects/sdcorejs-angular/forms/select/src/select.virtual-scroll.spec.ts, versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.virtual-scroll.spec.ts",
   "TASK-027: create versions/v19/projects/sdcorejs-angular/assets/THEME.md, showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts",
   "TASK-030: create .sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-verification.md"
  ],
  "state_owners": [
   "ToastContainerComponent: Toast announcements (live regions)",
   "SdTooltipDirective: Tooltip id inside the host aria-describedby",
   "SdBodyScrollLockService: Body scroll lock ref-count and overflow/padding-right snapshot per Document",
   "I18nService: Language to BCP-47 locale mapping",
   "Consuming application (library never writes it): Theme mode attribute data-sd-theme",
   "Component value model (shell never owns the value): Selected values under virtual scrolling"
  ],
  "service_boundaries": [
   {
    "symbol": "sdIsSafeResourceUrl",
    "scope": "pure_function"
   },
   {
    "symbol": "sdSanitizeEditorHtml",
    "scope": "pure_function"
   },
   {
    "symbol": "sdNormalizeSearchText",
    "scope": "pure_function"
   },
   {
    "symbol": "sdFindHighlightRanges",
    "scope": "pure_function"
   },
   {
    "symbol": "readSdTokens",
    "scope": "pure_function"
   },
   {
    "symbol": "I18nService",
    "scope": "app"
   },
   {
    "symbol": "NotifyService",
    "scope": "app"
   },
   {
    "symbol": "SdBodyScrollLockService",
    "scope": "app"
   }
  ],
  "data_flow": [
   "editor data → sdSanitizeEditorHtml → value/events/form",
   "file-explorer item → PreviewKind video → sd-preview-video (src guarded by sdIsSafeResourceUrl)",
   "NotifyService.show → ToastContainer live region announcement",
   "select items → virtual viewport rendering; selection events → component value model"
  ],
  "declarations_and_registration": [
   "sd-highlight: standalone, exported from components/highlight/index.ts and components/index.ts",
   "sd-preview-video: standalone, exported from components/preview/index.ts",
   "utilities/theme: exported from utilities/theme/index.ts and utilities/index.ts"
  ],
  "public_exports": [
   "SdHighlight",
   "SdPreviewVideo",
   "sdIsSafeResourceUrl",
   "sdSanitizeEditorHtml",
   "sdNormalizeSearchText",
   "sdFindHighlightRanges",
   "readSdTokens",
   "SdColorToken",
   "SD_COLOR_TOKENS",
   "I18nService.locale"
  ],
  "remaining_contract": "New components are leaf presentational units with colocated specs, md docs and showcase demos; no facade/store is introduced; virtual scroll stays inside the existing components."
 },
 "agent_architecture": {
  "required": false,
  "conformance_invariant_refs": [],
  "not_applicable_reason": "No AI-agent capability in this change.",
  "contract": null
 },
 "verification_strategy": {
  "package_manager": "npm (package-lock.json at root, versions/v19, showcase); Node 22.22.3 via fnm for every install/build",
  "commands_planned": [
   "versions/v19: npm ci --legacy-peer-deps; npm run lint; npm run build; npm run test:ci; npm run check:i18n-parity; npm run check:i18n; npm test -- --watch=false --browsers=ChromeHeadless --include=<spec>",
   "root: npm ci; npm run test:scripts; npm run test:theme; npm run check:scss-hex (after TASK-023); npm run test:release-package-contract; npm run sync; npm run check:sync; npm run generate:showcase-examples",
   "showcase: npm ci --legacy-peer-deps; npm run build; npm run test"
  ],
  "commands_skipped": [
   "v20/v21/v22 installs and builds — release-cut gate (AC-038)",
   "scripts/deploy.ps1 -DryRun — release-cut preflight",
   "browser automation — unavailable (A-006)"
  ],
  "checks": "Focused spec per task (RED then GREEN); wave end: v19 npm run test:ci + npm run build + npm run lint; final full verification in TASK-030."
 },
 "parallel_candidates": {
  "allowed": false,
  "contract": "Sequential green-gated waves in one worktree; every path has one owning task, but shared build state (dist used by showcase and some specs) and sequential dependencies make parallel execution unsafe.",
  "shared_files": [
   "i18n catalogs — TASK-002 only",
   "theme partials and default.scss — TASK-013 only",
   "showcase registry and manifest — TASK-028 only",
   "package.json and ci.yml — TASK-023 only",
   "CHANGELOG/README — TASK-029 only"
  ]
 },
 "repository_plan": {
  "schema_version": 1,
  "integration_owner_repository_id": "sdcorejs-angular",
  "dependency_order": [
   "sdcorejs-angular"
  ],
  "gitlink_updates_in_scope": false,
  "repositories": [
   {
    "repository_id": "sdcorejs-angular",
    "role": "library",
    "module_id": null,
    "git_root": "C:/wt/core-3.0",
    "available": true,
    "writable": true
   }
  ],
  "steps": [
   {
    "id": "TASK-001",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-baseline.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-002",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/i18n/src/en.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/vi.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/ja.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/ko.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/zh.ts"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-001"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-003",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/editor-html-sanitizer.spec.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/text-search.spec.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/url-safety.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/url-safety.spec.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/utility.extension.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/src/utility.extension.spec.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/index.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/extensions/extensions.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-001"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-004",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.ts",
     "versions/v19/projects/sdcorejs-angular/components/table/src/services/table-export/table-export.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/table/src/models/table-option-export.model.ts",
     "versions/v19/projects/sdcorejs-angular/components/table/sd-table.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-002"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-005",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast-container.component.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast-container.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.html",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.scss",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/components/toast/toast.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/src/notify.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/services/notify/sd-notify.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-002",
     "TASK-013"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-006",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.ts",
     "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.directive.spec.ts",
     "versions/v19/projects/sdcorejs-angular/directives/src/sd-tooltip.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-001"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-007",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.browser.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.html",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/sd-upload-file.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-003"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-008",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/editor/sd-editor.md",
     "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/mini-editor/sd-mini-editor.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-003"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-009",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/body-scroll-lock.service.ts",
     "versions/v19/projects/sdcorejs-angular/components/side-drawer/sd-side-drawer.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-001"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-010",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/i18n/src/i18n.service.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/src/i18n.service.spec.ts",
     "versions/v19/projects/sdcorejs-angular/i18n/i18n.md",
     "versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/date/src/date.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/datetime/src/datetime.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/modules/forbidden/pages/root/root.component.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/modules/not-found/pages/root/root.component.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/modules/home/components/home-page/home-page.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/sd-query-bar.md",
     "versions/v19/projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/inline-text/sd-inline-text.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-001"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-011",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/highlight/ng-package.json",
     "versions/v19/projects/sdcorejs-angular/components/highlight/index.ts",
     "versions/v19/projects/sdcorejs-angular/components/highlight/sd-highlight.md",
     "versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/highlight/src/highlight.component.spec.ts",
     "showcase/src/app/pages/components/highlight/highlight-demo.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/index.ts"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-003"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-012",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.html",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-video/preview-video.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/index.ts",
     "versions/v19/projects/sdcorejs-angular/components/preview/sd-preview.md",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.utils.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.view-model.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/preview-panel.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/sd-file-explorer.md",
     "showcase/src/app/pages/components/preview/preview-demo.component.ts"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-002",
     "TASK-003",
     "TASK-007",
     "TASK-010"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-013",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_scales.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_semantic.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_ramps.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_component-tokens.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/default.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/_presets.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/themes/material-theme.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/sd-core.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/color.scss",
     "scripts/core-theme.test.mjs"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-001"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-014",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "scripts/theme-contrast.test.mjs"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-015",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/utilities/theme/ng-package.json",
     "versions/v19/projects/sdcorejs-angular/utilities/theme/index.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/theme/theme.md",
     "versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.ts",
     "versions/v19/projects/sdcorejs-angular/utilities/theme/src/theme-tokens.spec.ts",
     "scripts/theme-token-list.test.mjs",
     "versions/v19/projects/sdcorejs-angular/utilities/index.ts"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-016",
    "action": "CREATE",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "scripts/check-scss-hex.mjs",
     "scripts/check-scss-hex.test.mjs"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-017",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/anchor/src/components/anchor-nav/anchor-nav.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/api-contract-builder.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/api-contract-builder/src/components/api-contract-node-editor.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/audit-diff/src/audit-diff.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/autoid-inspector/src/autoid-inspector.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/avatar/src/avatar.component.ts",
     "versions/v19/projects/sdcorejs-angular/components/badge/src/badge.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/breadcrumb/src/breadcrumb.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/button/src/action-popover.scss",
     "versions/v19/projects/sdcorejs-angular/components/button/src/button.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/card/src/card.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/code-editor/src/code-editor.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/data-state/src/data-state.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/editor/src/editor.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/editor/src/plugins/image-upload/image-upload.plugin.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/folder-tree.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/item-list.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/preview-panel.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/components/transfer-panel.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/file-explorer/src/file-explorer.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-expression/attribute-expression.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-parameter/attribute-parameter.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-queries/build-queries.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/attribute-selection/components/build-variables/build-variables.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/checkbox/control/checkbox-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/chip-calendar/control/chip-calendar-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/chip-string/control/chip-string-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/configure-validation/configure-validation.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/datetime/control/datetime-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/expression-builder/expression-builder.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/group/attribute/group-attribute.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/attribute/components/build-queries/build-queries.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/html/control/html-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/number/control/number-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/radio/control/radio-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/select/control/select-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/table/control/table-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/textarea/control/textarea-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/textfield/control/textfield-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/components/upload/control/upload-control.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/form-builder/form-builder.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/components/sd-feel-expression/sd-feel-expression.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/form-generic/src/pipes/expression-view.pipe.ts",
     "versions/v19/projects/sdcorejs-angular/components/history/src/history.component.scss"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013",
     "TASK-016"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-018",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/import-excel/src/import-excel.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/inform/src/inform.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/job-progress/src/job-progress.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/mini-editor/src/mini-editor.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/modal-resizable/src/modal-resizable.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/modal/src/modal.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/operator/src/operator.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/org-chart/src/org-chart.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-image/preview-image.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/preview/src/preview-pdf/preview-pdf.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/actions-bar/actions-bar.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/build-chip/build-chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/chip-popover/chip-popover.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/field-picker/field-picker.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-chip/inline-chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/inline-value-chip/inline-value-chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/popover-chip/popover-chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/components/saved-filters-menu/saved-filters-menu.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/query-bar.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-bar/src/query-bar.controls.scss",
     "versions/v19/projects/sdcorejs-angular/components/query-builder/src/query-builder.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/quick-action/src/quick-action.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section-item/section-item.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/section/src/section.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/side-drawer/src/side-drawer.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/splitter/src/splitter-handle/splitter-handle.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/splitter/src/splitter-panel/splitter-panel.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/stepper/src/stepper.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-item/tab-router-item.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/tab-router/src/components/tab-router-nav/tab-router-nav.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/tab/src/tab-group.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/tree/src/tree.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/components/preview/preview.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/upload-file/src/upload-file.component.scss"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013",
     "TASK-016"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-019",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/command/desktop-command.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/config/config.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/desktop-cell.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/desktop-cell/view/view.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/column-filter/column-filter.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/filter/quick-search/quick-search.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/mobile-cards/mobile-actions.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/mobile-cards/mobile-cards.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/popup-export/popup-export.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/components/selector-action/selector-action.component.scss",
     "versions/v19/projects/sdcorejs-angular/components/table/src/table.component.scss"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013",
     "TASK-016"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-020",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/forms/chip-calendar/src/chip-calendar.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/chip/src/chip.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/date-range/src/date-range.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/entity-picker/src/entity-picker.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/inline-text/src/inline-text.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/input-color/src/input-color.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/input-number/src/input-number.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/input/src/input.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/textarea/src/textarea.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/time-range/src/time-range.component.scss"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013",
     "TASK-016"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-021",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/assets/fonts/fonts.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/ckeditor5.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/_inline-edit.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/_read-state-panel.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/form.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/scrollbar.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_base.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_border.scss",
     "versions/v19/projects/sdcorejs-angular/assets/scss/core/utilities/_typography.scss",
     "versions/v19/projects/sdcorejs-angular/directives/src/sd-hover-copy.directive.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/page/page.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/menu-tree/menu-tree.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/search-field/search-field.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/shared/user-menu/user-menu.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/sidebar/sidebar.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/components/user/user.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v1/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v2/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-mobile-v3/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/sidebar/sidebar.component.ts",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/components/user/user.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v1/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v2/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/components/sidebar-v3/main.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/modules/home/components/home-page/home-page.component.scss",
     "versions/v19/projects/sdcorejs-angular/modules/layout/pipes/high-light-search.pipe.ts",
     "versions/v19/projects/sdcorejs-angular/services/confirm/src/lib/components/dialog-confirm/dialog-confirm.component.scss",
     "versions/v19/projects/sdcorejs-angular/services/loading/src/loading.service.ts"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013",
     "TASK-016"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-022",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/eslint.config.js"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-006",
     "TASK-017",
     "TASK-018",
     "TASK-019",
     "TASK-020",
     "TASK-021"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-023",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "package.json",
     ".github/workflows/ci.yml"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-014",
     "TASK-015",
     "TASK-016",
     "TASK-022"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-024",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.virtual-scroll.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.virtual-scroll.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.html",
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/select/src/select.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/select/sd-select.md",
     "showcase/src/app/pages/forms/select/select-demo.component.ts"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-025",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.ts",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.html",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.scss",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/src/autocomplete.component.spec.ts",
     "versions/v19/projects/sdcorejs-angular/forms/autocomplete/sd-autocomplete.md",
     "showcase/src/app/pages/forms/autocomplete/autocomplete-demo.component.ts"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-024"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-026",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "scripts/release-package-contract.mjs",
     "scripts/release-package-contract.test.mjs",
     "scripts/deploy.ps1",
     "scripts/generate-showcase-changelog.test.mjs",
     "scripts/build-published-page.test.mjs",
     "scripts/collect-docs.test.mjs",
     "AGENTS.md",
     "CLAUDE.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-001"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-027",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "versions/v19/projects/sdcorejs-angular/assets/THEME.md",
     "showcase/src/app/pages/guides/theme-tokens/theme-tokens-demo.component.ts",
     "versions/v19/projects/sdcorejs-angular/assets/STYLE-GUIDE.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-013",
     "TASK-015",
     "TASK-021"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-028",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "showcase/src/app/docs/core/documentation.registry.ts",
     "showcase/src/app/docs/core/documentation.registry.spec.ts",
     "showcase/src/app/docs/generated/example-manifest.generated.ts",
     "showcase/src/app/docs/generated/example-sources.generated.ts"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-011",
     "TASK-012",
     "TASK-024",
     "TASK-025",
     "TASK-027"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-029",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     "CHANGELOG.md",
     "README.npm.md",
     "versions/v19/projects/sdcorejs-angular/README.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**",
     "versions/v20/**",
     "versions/v21/**",
     "versions/v22/**"
    ],
    "depends_on": [
     "TASK-004",
     "TASK-005",
     "TASK-006",
     "TASK-007",
     "TASK-008",
     "TASK-009",
     "TASK-010",
     "TASK-012",
     "TASK-023",
     "TASK-025",
     "TASK-026",
     "TASK-028"
    ],
    "semantic_scope": "repository"
   },
   {
    "id": "TASK-030",
    "action": "EDIT",
    "owner_repository_id": "sdcorejs-angular",
    "git_roots": [
     "sdcorejs-angular"
    ],
    "allowed_paths": [
     ".sdcorejs/docs/angular/2026-09-25-19-05-core-3-0-release-verification.md",
     "versions/v20/projects/sdcorejs-angular/**",
     "versions/v21/projects/sdcorejs-angular/**",
     "versions/v22/projects/sdcorejs-angular/**",
     "versions/v20/SYNC-STATUS.md",
     "versions/v21/SYNC-STATUS.md",
     "versions/v22/SYNC-STATUS.md"
    ],
    "prohibited_paths": [
     "published-docs/**",
     "published-pages/**",
     ".github/workflows/publish-npm.yml",
     "scripts/release-contracts/**",
     "**/package-lock.json",
     "**/.env*",
     "**/node_modules/**",
     "**/dist/**"
    ],
    "depends_on": [
     "TASK-029"
    ],
    "semantic_scope": "repository"
   }
  ]
 },
 "finish_tail": {
  "contract": {
   "docs_before_final_branch_ready": true,
   "verify_before_done": true,
   "branch_ready_final_gate": true,
   "no_writes_after_branch_ready": true
  }
 },
 "approval": {
  "approved": false,
  "approved_at": null
 },
 "change_control": {
  "revision": 3,
  "supersedes": "plan-angular-core-3-0-release-20260925-r2",
  "change_reason": "Execution-contract write-scope fixes: TASK-001 mutable action, clean prohibited patterns with per-step derived-workspace protection, sync globs and status files for TASK-030, both showcase generator outputs for TASK-028, repository availability flags."
 }
}
```

</details>
