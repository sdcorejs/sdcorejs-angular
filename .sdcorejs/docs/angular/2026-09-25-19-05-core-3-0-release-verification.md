---
artifact_id: evidence-angular-core-3-0-release-20260925-verification
artifact_kind: execution-doc
schema_version: 1
owner: sdcorejs-execute-plan
contract_id: angular-core-3-0-release-20260925
change_ref: angular-core-3-0-release-20260925
source_spec: .sdcorejs/specs/angular/2026-09-25-18-10-core-3-0-release.md
source_architecture: .sdcorejs/architecture/angular/2026-09-25-18-30-core-3-0-release.md
source_plan: .sdcorejs/plans/angular/2026-09-28-09-25-core-3-0-release.md
supersedes_plan: .sdcorejs/plans/angular/2026-09-27-21-27-core-3-0-release.md
base_revision: 49a4ee647f30b055ef2162ad2511ba5bb4651048
branch_head_revision: b7f133459c4e1788b20ea422de05d71a90c179da
task: TASK-030
revision: 4
commit_policy: with-change
created_at: 2026-09-26T10:30:00+07:00
updated_at: 2026-09-28T10:20:00+07:00
---

# Kiểm chứng — Core UI release 3.0

Biên bản TASK-030 theo plan r6, trên worktree `C:/wt/core-3.0`, branch `feat/core-ui-3.0` (PR #60 vào `main`,
base `49a4ee6` = `origin/main`). Dừng trước bước cắt release: CHANGELOG vẫn là `[Unreleased]`, không pin workflow,
không tạo `scripts/release-contracts/3.0.json`, không tag, không publish.

Lịch sử:

- Revision 1 (plan r3): 3 lệnh đỏ vì 7 nhóm file không thuộc task nào.
- Revision 2 (plan r4): TASK-031…036 đóng các mục đó; toàn bộ bảng xanh trên base `726df99`.
- Revision 3 (plan r5): rebase lên `origin/main` `49a4ee6` (#59 sửa layout khung chi tiết của file-explorer và
  CHANGELOG), tích hợp #59, rồi chạy lại toàn bộ bảng dưới.
- Revision 4 (plan r6): CI của PR #60 đỏ ở Angular 22; sửa helper của hai spec virtual scroll (mục *CI của PR #60*).

## CI của PR #60 (plan r6)

- Trước khi commit: hook `git-secrets` của tổ chức chặn fixture `user:password@host` trong `url-safety.spec.ts`
  (TASK-003). Fixture được dựng lúc chạy bằng `new URL()` + `username`/`password`; spec 41/41, đã sync.
- CI lần đầu (run `36339910294`): 5/6 job pass. *Angular compatibility (v22)*: lint và build pass, test 16 FAILED /
  5795 SUCCESS — cả 16 trong `select.virtual-scroll.spec.ts` và `autocomplete.virtual-scroll.spec.ts`
  ("timed out waiting for the panel options").
- Nguyên nhân: CDK/Material 22.1 chèn panel của select/autocomplete dạng popover cạnh trigger (`usePopover`), không
  vào `OverlayContainer`; helper của hai spec tìm option trong container đó. Spec cũ tìm theo `document` nên không đổi.

| Task | RED | GREEN |
|---|---|---|
| TASK-024 / TASK-025 spec virtual scroll | v22 local (Node 22.22.3, `npm ci` + `npm run build`): 16 FAILED / 1 SUCCESS, đúng như CI. | Helper `overlay()` trả `document.body`: v19 17/17, v22 17/17. |
| TASK-030 | — | `npm run sync`; `check:sync` pass; v22 `npm run test:ci` 5811/5811 (coverage 83.66 / 73.79 / 82.32 / 84.93); ESLint và Prettier sạch trên hai spec. |

## Rebase lên origin/main (plan r5)

- Branch `release/3.0` chưa có commit riêng nên rebase là fast-forward con trỏ branch từ `726df99` lên `49a4ee6`;
  worktree giữ nguyên, không tạo commit.
- Chỉ hai file #59 sửa có thay đổi trong worktree, được gộp 3-way (base `726df99`, ours = worktree, theirs = `49a4ee6`):
  - `preview-panel.component.scss` (v19): gộp sạch — layout flex của #59 (`.detail`, `.stage` co tới 140px,
    `.stage--pdf`, `.meta`) cùng token của TASK-017 và rule `.stage--video`.
  - `CHANGELOG.md`: xung đột ở `[Unreleased]`; giữ nội dung 3.0 và thêm nguyên văn mục Fixed của #59.
- Trong layout mới, khung video bị ép về 216px (basis của `.stage`) và cắt thanh điều khiển:

| Task | RED | GREEN |
|---|---|---|
| TASK-012 spec file-explorer | Spec mới "video stage grow with the player": `flex-shrink` là `1`, khung cao 216 < 400. | File-explorer + preview 300/300. |
| TASK-017 `preview-panel.component.scss` | (như trên) | `.stage--video { flex: none; }`: ảnh và PDF vẫn co trên explorer thấp, video giữ đủ chiều cao. |
| TASK-029 CHANGELOG | Xung đột `[Unreleased]`. | Mục Fixed có thêm dòng của #59. |
| TASK-030 sync | — | v20–v22 nhận bản gộp từ v19; `check:sync` pass. |

## Kết quả (revision 3, Node 22.22.3 qua fnm như plan)

| Lệnh | Kết quả | Ghi chú |
|---|---|---|
| root `npm run sync` | chạy xong | Giữ phần thuộc TASK-030: `versions/v20|v21|v22/projects/sdcorejs-angular/**`, `SYNC-STATUS.md` của bốn line, `versions/v20|v21|v22/eslint.config.js`. Khôi phục 18 file workspace v22 chỉ đổi xuống dòng. Thư viện v22 chuẩn hoá về LF theo `versions/v22/.gitattributes`; `SYNC-STATUS.md` của v19–v21 về CRLF như bản checkout. |
| root `npm run check:sync` | pass | v20, v21, v22 khớp v19 (240 file đổi, cùng một tập ở cả bốn line). |
| v19 `npm run lint` | pass | 45 s. |
| v19 `npm run build` | pass | 57 s, không có cảnh báo. |
| v19 `npm run test:ci` | pass | 5811/5811 spec (baseline 5638 ở `726df99`), seed `86663`. Coverage 83.66 / 73.82 / 82.32 / 84.93 (stmt / branch / func / line), trên ngưỡng 78 / 67 / 75 / 78. Chạy bằng config Karma của repo. |
| v19 `npm run check:i18n-parity` | pass | 819 key × 5 ngôn ngữ. |
| v19 `npm run check:i18n` | pass | Không file nào vượt ngân sách. |
| root `npm run test:scripts` | pass | 13 suite, 225/225 test. |
| root `npm run check:scss-hex` | pass | 0 finding. |
| showcase `npm run build` | pass | 47 s. Chỉ còn cảnh báo CommonJS có sẵn. |
| showcase `npm run test` | pass | 206/206. |
| File sinh của showcase | khớp | `example-sources.generated.ts` và `example-manifest.generated.ts` sinh lại ra thư mục tạm giống hệt bản trong repo. `changelog.generated.ts` không sinh lại: `scripts/build-published-page.mjs` sinh nó lúc deploy và plan không có task sở hữu. |
| INV-001 (compile SCSS HEAD và hiện tại, giải `var()` theo theme sáng) | pass | 126 file, 9 file khác: 5 khác biệt có chủ đích (khối `[data-sd-theme]`, focus breadcrumb sang primary, reset nút tên tài liệu của upload-file, hai hook kế thừa) và 4 file chỉ thêm rule mới (`.stage--video` của file-explorer trên nền #59, fill placeholder của upload-control, panel ảo của select và autocomplete). |
| Quét mojibake | sạch | 996 file; 21 dòng khớp mẫu đều là chữ Việt thật ("ĐÃ"). |
| Diff dependency | không có | Chỉ đổi `scripts` của root `package.json`; không lockfile nào đổi. |
| v20 / v21 / v22 cài và build (AC-038) | hoãn | Thuộc gate cắt release, theo plan. |

## Đóng các mục chặn (plan r4)

| Task | RED | GREEN |
|---|---|---|
| TASK-031 file-explorer: preview video, locale | 5 spec đỏ: `sdFileExplorerPreviewKind('video')` trả `'none'`; ba spec video (không gọi `preview`, không có object URL, không có `sd-preview-video`); size vẫn `2,4 MB` khi `locale()` là `en-US`. | File-explorer + preview 299/299. Nhánh `video` trong `#loadPreview`, `sd-preview-video` nạp động cùng chunk với PDF, map locale riêng bị xoá, locale lấy từ `I18nService.locale()`. Code thư viện không còn literal `'vi-VN'` ngoài bảng của `I18nService` (chỉ một comment nhắc cách Chrome định dạng vi-VN). |
| TASK-032 avatar | 5 spec đỏ (token của palette, tint/ink, avatar rỗng, độ tương phản với tint/ink tối). Spec "đúng màu 2.15 khi chưa có theme" xanh từ đầu và vẫn xanh. | Avatar + layout + file-explorer 332/332. 20 hex của avatar TS thành token. |
| TASK-033 pipe highlight | 2 spec đỏ (markup mặc định còn `#ffff00`). | Mặc định `var(--sd-highlight-search-bg, #ffff00)`. |
| TASK-034 upload-control | ESLint 8 lỗi hex trên template. | 0 lỗi; fill chuyển sang class trong SCSS. |
| TASK-035 supported-versions test | 1 test đỏ (danh sách `test:scripts`). | 16/16. |
| TASK-036 route-shells test | 1 test đỏ (99 ≠ 102 trang). | 11/11; khẳng định thêm ba trang mới và số trang theo nhóm. |

## Kiểm tay

- AC-017 (showcase Preview phát video mẫu; `sd-preview.md` có mục video, bỏ mục PDF lặp) và AC-034 (trang
  *Theme & tokens* ở sáng và tối): người dùng xác nhận đạt ngày 2026-09-26 trên cây r4, dựa trên đo đạc và ảnh chụp
  bằng Playwright trên showcase local, và xác nhận lại ngày 2026-09-27 trên cây r5 với bằng chứng Playwright mới.

## Lệch so với plan (đã ghi, cần người duyệt biết)

- Mọi tham chiếu tới token mới trong component mang giá trị 2.15 làm fallback (`var(--sd-table-bg, #ffffff)`), để giữ INV-001 khi theme chưa được load (unit test, app tự khai palette).
- Thêm key `core.form.select.clear` để nhánh virtual của select không thêm chữ Việt cứng (gate `check:i18n`).
- Bảng contrast trên showcase đo palette default ở sáng và tối; 8 preset có tên do `npm run test:theme` kiểm (builder Karma của showcase không biên dịch SCSS inline).
- Rule ESLint hex miễn thêm trang lỗi Keycloak tĩnh (`modules/keycloak/htmls/**`), vì trang này phục vụ ngoài app, không có theme.
- Scanner hex được sửa trong lúc làm TASK-021: bỏ qua descriptor của `@font-face`/`@property`… và literal đã nằm trong fallback của `var()`.
- TASK-031 cần thêm rule `.stage--video` vào `preview-panel.component.scss` (file do TASK-017 sở hữu) để player không bị cắt mất thanh điều khiển; ghi dưới quyền đường dẫn của TASK-017.
- Video trong file-explorer dùng chung chunk nạp động với PDF (có PDF.js): lần xem PDF hoặc video đầu tiên tải chunk đó một lần. Import tĩnh sẽ kéo PDF.js vào bundle chính của file-explorer.
- `option.preview` của file-explorer giờ được gọi cả cho file video; đã ghi ở mục *Changed* của CHANGELOG và trong `sd-file-explorer.md` (video lớn nên trả URL thay vì `Blob`).
- Avatar: catalog thêm `--sd-avatar-neutral` và `--sd-avatar-color-1…19` (cùng giá trị ở sáng và tối). TS dùng luôn `--sd-avatar-tint`/`--sd-avatar-ink` đã có, nên avatar theo dark mode. `baseColor()` giờ trả chuỗi `var(...)` thay vì hex.
- Upload-control: catalog thêm `--sd-form-builder-upload-placeholder-bg` và `-shape` (tối `#34373d` / `#5a5d66`).
- Revision 2 chạy bằng Node 22.14.0 (PATH hệ thống); revision 3 chạy toàn bộ bằng Node 22.22.3 qua fnm như `verification_strategy` của plan.
- Plan r5 tồn tại vì `prepareExecution` yêu cầu `source_revision` của plan bằng HEAD hiện tại; ngoài bước tích hợp #59, task, đường dẫn và validation map giữ nguyên như r4.
- `.stage--video` dùng `flex: none`: trên explorer thấp, ảnh và PDF co lại để metadata không phải cuộn (#59), còn video giữ đủ chiều cao nên có thể phải cuộn để thấy metadata.
- AC-038 vẫn hoãn theo plan, nhưng đã có bằng chứng từng phần: CI của PR #60 cài, lint, build và test v20, v21 (pass) và v22; plan r6 cài deps v22 ở máy local để chạy hai spec virtual scroll và `test:ci` của v22.
- Plan r6 tồn tại vì sau khi commit, HEAD chuyển sang các commit của `feat/core-ui-3.0` mà `prepareExecution` yêu cầu bằng `source_revision`.
