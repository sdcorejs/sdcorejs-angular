---
artifact_id: execution-table-field-path-fallback-20261001
artifact_kind: execution-doc
change_ref: table-field-path-fallback
source_spec: .sdcorejs/specs/angular/2026-10-01-17-06-table-field-path-fallback.md
source_plan: .sdcorejs/plans/angular/2026-10-01-17-06-table-field-path-fallback.md
commit_policy: with-change
owner: sdcorejs-angular
track: angular
created_at: 2026-10-01T09:40:00.000Z
redaction_applied: false
---

# Change Execution Record - SdTable đọc field không phải path hợp lệ và nâng @sdcorejs/utils 1.2.5

## Requested Outcome

Port fix NSP-5745 của `@sd-angular/core` (MR !209) sang `@sdcorejs/angular`. `@sdcorejs/utils` 1.2 từ chối property path có khoảng trắng hoặc `*`, nên bảng có cột lấy từ key của BE (`Số phòng ngủ`, `Loại sản phẩm*`) báo "Không thể tải dữ liệu". Cùng change nâng `@sdcorejs/utils` lên `1.2.5` (sdcorejs-utils PR #15) để `instanceof FilePickerCancelledError` đúng trong app đã bundle.

## Material Changes

Mọi path dưới đây thuộc `versions/v19/projects/sdcorejs-angular/components/table/` trừ khi ghi khác.

- CREATE `src/services/field-value.util.ts`: `resolveFieldValue` nội bộ, port nguyên từ Core (probe có cache, fallback own-property, chặn prototype). Không export.
- CREATE `src/services/field-value.util.spec.ts`: 24 case, port từ Core.
- EDIT 7 file source, thay 13 lượt đọc theo `column.field`/group field: desktop cell, `SdGroupPipe`, aggregate (column và group), export (3 chỗ), quick search, format (lazy-values và từng ô, lượt đọc ô nằm trong try của ô), local filter và sort.
- EDIT 7 spec, thêm case NSP-5745: read-state, format (2 case), local, group, aggregate, quick search, export.
- EDIT `sd-table.md`, dòng `field`.
- EDIT `CHANGELOG.md`: bullet utils trong `[Unreleased]` → `### Changed` (xem deviation dưới).
- EDIT `@sdcorejs/utils` `1.2.4` → `1.2.5`: `versions/v19/package.json`, `versions/v19/projects/sdcorejs-angular/package.json`, `showcase/package.json` và 2 lockfile.
- `npm run sync`: v20, v21, v22 sinh lại từ v19 (mỗi line 21 path, gồm `SYNC-STATUS.md`); lockfile v20, v21, v22 cập nhật bằng `npm install`.

## Decisions And Invariants

- D-001: resolver giống hệt Core; chỉ đổi comment "utils 1.2.4" thành "utils 1.2" và bỏ dòng `eslint-disable` không cần trong repo này.
- D-002: `rowKey`, `valueField`, `displayField` vẫn dùng `getNestedValue` (grep sau sửa chỉ còn các lượt đọc này).
- A-002: thư viện không kế thừa và không re-export lỗi của utils; chỉ import `FilePickerCancelledError` để so `instanceof` (upload-file, api, excel).
- INV-002: `components/table/index.ts` không đổi so với `origin/main`.

### Revision 2 (traceability only, 2026-10-01)

`sdcorejs-ship` convergence trên plan r1 BLOCKED (`UNTRACED_TASK` ×2, `UNRELATED_PASSING_TEST` ×5): validation row của AC-001, AC-003, AC-007, AC-009 không có invariant, và TASK-002 không link R-001. Code không lỗi.

Người dùng chọn sửa hợp đồng. Spec r2 (`sha256:v1:6c97aad9394339376e4cc959bd979847146a5971c72a55d24e3c17f00ce21d15`) thêm INV-003..INV-006 và D-006 (vị trí CHANGELOG), sửa câu chữ AC-009. Plan r2 (`sha256:v1:c557302a051a98a401d58efb174a222aa066fbdc1039173325c4747dd1d3d075`) gắn mỗi row một invariant và link R-001 với TASK-002; task, path, lệnh giữ nguyên. Thực thi r2 không ghi source; chỉ cập nhật record này rồi chạy lại verification và convergence.

### Approved deviation (review R1)

Spec r1 và plan r1 ghi AC-009 là "mục Fixed cho table và cho việc nâng utils"; spec r2 đã đưa nội dung này vào D-006 và AC-009. Review phát hiện cả 4 bản đã publish (`19/20/21/22.2.15`) đều dùng utils `1.1.4`, nên lỗi bảng và lỗi huỷ chọn file chưa từng lên bản phát hành. `[Unreleased]` đã có bullet `### Changed` "nâng `1.1.4` lên `1.2.4`" khẳng định huỷ chọn file không báo lỗi, điều sai trong app đã bundle với 1.2.4.

Theo lựa chọn của người dùng ở repair loop (2026-10-01), bỏ 2 bullet Fixed; sửa bullet `### Changed`: `1.2.5`, sub-bullet cho field của bảng, ghi chú 1.2.5 cần cho việc huỷ chọn file trong app bundle, và quy tắc `errorName` cho consumer. Lệnh kiểm AC-009 đổi theo vị trí mới.

## Verification Evidence

Mọi lệnh chạy bằng Node `22.22.3` (fnm), lệnh test chạy trong `versions/v19`: `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadless --include=<spec>`.

- Baseline trên `origin/main` `2385701`: spec table v19 651/651 SUCCESS; `npm run check:sync` pass.
- RED TASK-001: spec resolver lỗi compile `TS2307 Cannot find module './field-value.util'`.
- RED TASK-002 (spec resolver tạm cất ra ngoài): 153 spec, 8 FAILED, đúng 8 case mới (7 do `UnsafePropertyPathError`, read-state `Expected 'error' to be 'ready'`).
- GREEN: resolver 24/24; 8 spec của change 177/177.
- Utils 1.2.5: spec upload-file, api, excel 209/209.
- Final trên diff cuối: spec table v19 cùng upload-file, api, excel 892/892 SUCCESS; `npm run build` (v19) `Built Angular Package`.
- `npm run check:sync`: pass sau khi sync lần cuối.
- `npm ls @sdcorejs/utils`: `1.2.5` ở v19, v20, v21, v22, showcase.
- ESLint trực tiếp 16 file `.ts` đã sửa ở v19: 0 lỗi, 0 cảnh báo.
- Kiểm pin, lockfile và docs (AC-007, AC-009): 29/29.
- `git diff --check` sạch.

## Known Gaps

- `npm run lint:phase:release` lint file của commit gần nhất, không lint thay đổi chưa commit; đã thay bằng ESLint trực tiếp trên file đã sửa.
- Không chạy `test:ci` toàn thư viện, không test hoặc build riêng v20–v22 (bản sync; `check:sync` chứng minh đồng bộ).
- Review R2 (advisory): dropdown `filter.quickSearch.filters[].field` vẫn qua `FilterUtilities.match` với path chặt; field do dev khai báo, ngoài D-002.
- Review R3 (advisory, tooling): trên máy có `core.autocrlf=true`, `npm run sync` copy file CRLF vào v22 (v22 có `.gitattributes` `eol=lf`), làm 1014 file hiện `M` dù blob giống index; đã checkout lại bản LF sau khi xác nhận 1014/1014 blob trùng. `npm install` ở v20/v21 viết lại lockfile với indent 2 space; đã ghi lại với indent 4 space sau khi xác nhận nội dung JSON chỉ khác 4 giá trị của utils.
- `npm install` ở showcase gỡ bản `@sdcorejs/angular` do `link:library` copy vào `node_modules` (không thuộc git); `prestart`/`prebuild` tự copy lại.

## Related Artifacts

- Spec draft: `.sdcorejs/docs/angular/2026-10-01-15-12-table-field-path-fallback-spec.md`
- Approved spec: `.sdcorejs/specs/angular/2026-10-01-15-12-table-field-path-fallback.md` (`sha256:v1:06d790bfec6a729c210427255b35d074efc7b084f2002d6e13d19d18a22d7f86`)
- Plan draft: `.sdcorejs/docs/angular/2026-10-01-15-38-table-field-path-fallback-plan.md`
- Approved plan: `.sdcorejs/plans/angular/2026-10-01-15-38-table-field-path-fallback.md` (`sha256:v1:bd9645c2ce1b5ea8991bb14b575be54a087ff79424179aafd8234897f824243f`)
- Spec r2 draft: `.sdcorejs/docs/angular/2026-10-01-17-06-table-field-path-fallback-spec.md`
- Approved spec r2: `.sdcorejs/specs/angular/2026-10-01-17-06-table-field-path-fallback.md` (`sha256:v1:6c97aad9394339376e4cc959bd979847146a5971c72a55d24e3c17f00ce21d15`)
- Plan r2 draft: `.sdcorejs/docs/angular/2026-10-01-17-06-table-field-path-fallback-plan.md`
- Approved plan r2: `.sdcorejs/plans/angular/2026-10-01-17-06-table-field-path-fallback.md` (`sha256:v1:c557302a051a98a401d58efb174a222aa066fbdc1039173325c4747dd1d3d075`)
- Upstream: `@sd-angular/core` MR !209 (NSP-5745), sdcorejs-utils PR #15 và release #16.
