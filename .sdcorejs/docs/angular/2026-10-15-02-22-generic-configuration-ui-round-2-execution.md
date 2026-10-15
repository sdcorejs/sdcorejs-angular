# Execution + Handoff — Màn cấu hình generic vòng 2 và bộ icon kiểu dữ liệu — 2026-10-15

Tài liệu này để tiếp tục công việc trên máy khác. Nó gồm hai phần: nhật ký thực thi của plan vòng 2, và toàn bộ trạng thái của branch.

## 1. Trạng thái nhanh

- **Repo / branch:** `sdcorejs/sdcorejs-angular`, branch `feat/generic-crud-module`. PR [#82](https://github.com/sdcorejs/sdcorejs-angular/pull/82) mở vào `main`, đã bật Auto-fix trên máy cũ.
- **CI của PR:**
  - commit `3c5fc525` (trước vòng 2): pass cả 6 check (sync, scripts, v19 lint/build/coverage, compat v20/v21/v22);
  - các commit của vòng 2 (phần 6) chưa có kết quả CI lúc viết tài liệu này.
- **Vòng 2 (plan r2, 18 task):** đã xong hết và kiểm chứng local (phần 4).
- **Việc còn mở:** xem phần 7.

## 2. Chuỗi artifact đã duyệt (immutable — không sửa tay)

| Loại | Path | Hash |
| --- | --- | --- |
| Spec gốc (module generic) | `.sdcorejs/specs/angular/2026-10-13-09-59-generic-crud-module.md` | `sha256:v1:6107bece…` |
| Spec vòng 2 r1 (superseded) | `.sdcorejs/specs/angular/2026-10-15-00-36-generic-configuration-ui-round-2.md` | `sha256:v1:f522514a…` |
| **Spec vòng 2 r2** | `.sdcorejs/specs/angular/2026-10-15-00-36-generic-configuration-ui-round-2-r2.md` | `sha256:v1:69487fbb…` |
| Architecture r1, r2 (superseded) | `.sdcorejs/architecture/angular/2026-10-15-00-50-generic-configuration-ui-round-2{,-r2}.md` | |
| **Architecture r3** | `.sdcorejs/architecture/angular/2026-10-15-00-50-generic-configuration-ui-round-2-r3.md` | `sha256:v1:5b3bed02…` |
| Plan r1 (superseded) | `.sdcorejs/plans/angular/2026-10-15-02-22-generic-configuration-ui-round-2.md` | `sha256:v1:06f9c5a5…` |
| **Plan r2 (đang áp dụng)** | `.sdcorejs/plans/angular/2026-10-15-02-22-generic-configuration-ui-round-2-r2.md` | `sha256:v1:6d4eb4aa…` |
| Draft spec / architecture / plan | `.sdcorejs/docs/angular/…-spec.md`, `.sdcorejs/docs/architecture/…-architecture.md`, `.sdcorejs/docs/angular/…-plan.md` | (editable) |

Lý do có nhiều revision (cả ba đều chỉ đổi metadata hoặc write scope, nội dung không đổi):

- **Spec r2:** bỏ `parent_references` trỏ về spec trong cùng repo, vì validator handoff không verify được artifact cha của spec.
- **Architecture r3:** con trỏ profile frontend phải đúng `plan_context.frontend_architecture`.
- **Plan r2:** write scope có một path chứa `..` và các mục giả "(hand edits)", nên `prepareExecution` từ chối; mirror nay được khai dạng glob.

Người dùng đã duyệt từng bản.

## 3. Phạm vi vòng 2 (đã làm)

1. **External filter chỉ khai trong code.**
   - Bỏ checkbox "Bộ lọc ngoài" ở tab Danh sách.
   - `SdGenericSchemaService` bỏ `list.externalFilters` trước khi validate và trước `schemaStore.set`.
   - `sdGenericMergeSchema` xoá giá trị đã lưu rồi lấy từ schema nền (D-011, INV-004).
   - `validateSdGenericSchema` giữ nguyên (D-017).
2. **Bộ icon kiểu dữ liệu dùng chung** trong `@sdcorejs/angular/modules/icon` (file `src/data-type-icon.ts`).
   - Export `SdDataTypeIconKey` (22 khoá), `SD_DATA_TYPE_ICON`, `SD_DATA_TYPE_LABEL`, `SD_DATA_TYPE_LUCIDE_ICONS`, `sdDataTypeIcon()`.
   - Thêm 18 alias Lucide vào `SD_DEFAULT_LUCIDE_ALIASES`.
   - `number` dùng Material `numbers`, vì `tag` bị alias Material đổi thành `local_offer` (D-013).
   - `schedule`/`access_time` → Lucide `clock` (D-015).
3. **Palette form-generic** lấy icon từ `SD_DATA_TYPE_ICON`; icon hiển thị giữ nguyên (`radio`, `group`, `html` giữ literal).
4. **Khối định danh** `GenericPropertyIdentity` (`modules/generic/src/components/property-identity/`, nội bộ module).
   - Hiện icon kiểu dữ liệu (tooltip `sdTooltip` trên phần tử bọc, `ariaLabel` = tên kiểu đã dịch), nội dung được project, và key gốc ở dòng dưới.
   - Dùng ở tab Thông tin chung, Danh sách và Nhập Excel.
   - Map property → khoá qua `sdGenericPropertyIconKey` (`core/generic-property-icon.ts`).
5. **Kéo thả thứ tự cột** bằng CDK, có tay nắm `drag_indicator`; giữ nút lên/xuống.
   - Một hàm `reorder(fromIndex, toIndex)` duy nhất ghi thứ tự (D-012, INV-005).
   - `drop()` quy chỉ số trong drop list về vị trí trong `list.columns`.
   - Dòng chưa có trong bảng nằm ngoài drop list.
6. **Nhãn "Hiển thị" → "Hiện mặc định"**, kèm tooltip "Người dùng vẫn bật lại được cột này trong phần cấu hình cột của bảng."
7. **i18n**, đủ 5 catalog (`en`, `vi`, `ja`, `ko`, `zh`), 1269 khoá × 5:
   - thêm 22 khoá `core.data-type.*`, `core.module.generic.field.visible-hint`, `core.module.generic.action.drag`;
   - bỏ `core.module.generic.field.external-filter`.
8. **Showcase:**
   - trang Icon có section "Data-type icons" (cả Material lẫn Lucide);
   - `app.config.ts` đăng ký `...SD_DATA_TYPE_LUCIDE_ICONS`;
   - registry: trang Icon 5 → 6 section; spec: 413 → 414 example, trang Icon gộp 7 → 8;
   - sinh lại example sources.
9. **Docs:**
   - `modules/generic/sd-generic.md`: external filter chỉ khai trong code; mô tả các tab và dòng định danh.
   - `modules/icon/sd-icon.md`: mục "Data-type icons".
   - CHANGELOG Unreleased: Added icon set và màn cấu hình; Changed alias Lucide; sửa câu external filter của mục generic; mở rộng mục BREAKING i18n.

## 4. Kiểm chứng đã chạy (local, Node 26.12.0 — không phải 22.22.3)

| Lệnh | Kết quả |
| --- | --- |
| Spec RED trước GREEN: TASK-001, 004, 006, 010, 012 | đã ghi lỗi RED (compile/assert) trước khi code |
| `npm run check:i18n` + `check:i18n-parity` (v19) | OK, 1269 khoá × 5 |
| spec `modules/icon/**` | 19/19 |
| spec `modules/generic/**` | 182/182 |
| spec `components/form-generic/**` | 359/359 |
| `npm run lint` (v19) | All files pass (sau `eslint --fix` cho format Prettier của file mới) |
| `npm run build` (v19) | pass, 100 entry point |
| Full v19 `ng test … --code-coverage` | **6994/6994**; statements 89.31%, branches 78.14%, functions 89.69%, lines 91.77% |
| VAL-001 grep (không import ngược vào `modules/icon`) | không có kết quả (đạt) |
| Showcase `link:library` + `npm test` | 219/219 (sau `npx ng cache clean`, xem phần 8) |
| Showcase `npm run build` | pass |
| `npm run sync` + `npm run check:sync` | pass |
| `npm run test:scripts` | 258/258 |
| `npm run check:scss-hex` | 0 finding |
| Quét mojibake trên 153 file đã đổi | sạch |
| Kiểm UI (Showcase dev server, `/demo/generic/showcase/product/configuration`) | xem chi tiết dưới bảng |

Chi tiết kiểm UI ở tab Danh sách:
- 11 dòng: 10 cột trong bảng có tay nắm kéo, dòng "Specs" chưa có trong bảng thì không có;
- không còn "Bộ lọc ngoài";
- "Hiện mặc định" × 10;
- icon nằm cạnh checkbox, key ở dòng dưới.

Lỗi bố cục do `:host` của SCSS dùng chung đã được sửa ngay trong vòng này.

## 5. Sai khác so với plan (cần biết khi review)

- **TASK-008:** viết spec rồi viết component ngay sau đó, không chạy riêng bước RED. Spec pass sau khi có component (3/3).
- **TASK-011 có sửa thêm `generic-configuration.scss`** (rule `.cfg-rows--unlisted`), dù plan giao file này cho TASK-009. File vẫn nằm trong `allowed_paths` của plan.
- **SCSS sửa thêm sau khi kiểm UI:** `:host(.cfg-identity)` thêm `flex-direction: row; padding-top: 0`, vì stylesheet dùng chung có `:host { flex-direction: column; padding-top: 16px }` dành cho các tab.
- **Executor:** dùng generic harness thay cho `sdcorejs-angular`. Repo đích là source của thư viện, không phải app dùng Core UI.
- **TASK-014 là test khoá hành vi** (pass cả trước và sau refactor), không có RED. Đây là bản chất của refactor giữ nguyên icon.

## 6. Commit của vòng 2 (trên `feat/generic-crud-module`)

Thứ tự: commit feature v19 + Showcase + docs + CHANGELOG + artifact SDLC → commit mirror v20/v21/v22 → commit handoff này. Xem bằng lệnh:

```bash
git log --oneline origin/main..HEAD
```

## 7. Việc còn mở / bước tiếp theo

1. **Đợi CI trên PR #82** cho các commit vòng 2. Gate chính thức chạy trên Node 22.22.3. Trong session cũ, Auto-fix đã bật và sẽ đánh thức session đó khi có lỗi; máy mới thì xem tab Checks của PR.
2. **Independent review chưa làm**, cho cả hai phần sau, cần một lượt review độc lập trước khi merge:
   - vòng 1 (góp ý UI ngày 14/10, sửa `sd-input`, merge main);
   - vòng 2 (toàn bộ phần 3).

   Gợi ý: `sdcorejs-review` với dimension `consistency` và `architecture`.
3. **Ship gate:** chạy `sdcorejs-ship` (verify-before-done, rồi branch-ready) trên HEAD mới.
4. **Cập nhật mô tả PR #82** cho vòng 2. Body hiện tại chỉ mô tả đến commit `3c5fc525`.
5. **Ngoài phạm vi, để sau** (non-goals của spec):
   - chuyển query-bar (`SD_QUERY_TYPE_ICON`) và query-builder (`SD_QB_TYPE_ICON`) sang bộ chung;
   - kéo thả bằng bàn phím;
   - đổi thứ tự ở tab Thông tin chung / Nhập Excel.
6. **Từ vòng 1** (nhật ký `.sdcorejs/docs/angular/2026-10-13-15-57-generic-crud-module-execution.md`):
   - S5/S7 mới ghi vào tài liệu;
   - Simplify Q1–Q17 mới phân tích;
   - test loader Layout dùng timeout mặc định 5 s.

## 8. Hướng dẫn tiếp tục trên máy khác

```bash
git fetch origin
git checkout feat/generic-crud-module
git pull --ff-only
```

- **Node:** repo yêu cầu đúng 22.22.3; Angular CLI 22 từ chối Node < 22.22.3 (máy cũ chạy 26.12.0 cho gate local).
- **Cài dependency theo từng workspace** (luôn chạy lại sau khi merge main, vì main có thể đổi lockfile):

```bash
npm ci
```

```bash
npm --prefix versions/v19 ci --legacy-peer-deps
```

```bash
npm --prefix showcase ci --legacy-peer-deps
```

- **Showcase ăn lib đã build:** `npm --prefix versions/v19 run build`, rồi `npm --prefix showcase run link:library`. Nếu test Showcase báo thiếu export mới, chạy `npx ng cache clean` trong `showcase/`.
- **Spec v19 resolve `@sdcorejs/angular/*` từ `dist` trước source** (tsconfig `paths`). Import chéo entry point mới thì phải build lại v19 trước khi chạy spec.
- **Sau `npm run sync` trên Windows:** v22 có `eol=lf`, nên sync làm hàng trăm file v22 hiện `M` chỉ vì CRLF. Chỉ khôi phục file không có diff nội dung, rồi chạy lại `npm run check:sync`:

```bash
git diff --name-only -- versions/v22
```

- **Sửa code chung:** sửa ở `versions/v19` rồi `npm run sync` và `npm run check:sync`. Không sửa tay v20/v21/v22.
