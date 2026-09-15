---
artifact_id: plan-action-popover-r1-draft
artifact_kind: plan
contract_id: angular-action-popover-20260914
change_ref: angular-action-popover-20260914
owner: sdcorejs-plan
owner_repository_id: sdcorejs-angular
owner_repository_role: library
track: angular
source_spec: .sdcorejs/docs/angular/2026-09-14-action-popover-spec.md
source_architecture: .sdcorejs/docs/architecture/2026-09-14-action-popover-architecture.md
source_plan: none
commit_policy: with-change
status: draft
approved: false
revision: 1
---

# Plan — Action Popover

Đề xuất triển khai để duyệt cùng spec/architecture r1; chưa thực thi, chưa có approved snapshot/hash. Khi người dùng duyệt bộ này, lưu approved artifacts theo thứ tự spec → architecture → plan trước khi sửa code.

## Owner và write scope

Một repository owner `sdcorejs-angular`, Git root `C:/Users/nghiatt15_onemount/Documents/sdcorejs/sdcorejs-angular`; baseline HEAD tại lúc soạn: `864789c8d1d76f393dcc834a4dab872c6eb18278` cộng các thay đổi chưa commit từ yêu cầu trước.

Allowed: canonical button/table, Showcase Button/Table examples + documentation registry, CHANGELOG và generated Showcase catalogs; spec/architecture/plan của change này. Generated mirrors v20/v21/v22 chỉ qua `npm run sync`. Không sửa `.sdcorejs/tmp`, unrelated dirty files, dependencies/lockfiles, published archives/pages, release contracts hoặc workflows.

Frontend architecture được định nghĩa đầy đủ trong `source_architecture`; mỗi bước dưới đây thực hiện boundary và invariants tương ứng. Làm tuần tự, không cần subagent.

## Các bước và file

1. **Preflight + tests thất bại trước khi triển khai** (AC-001–011).
   Kiểm tra git status/diff/staged/untracked/branch/HEAD, giữ các sửa trước. CREATE `versions/v19/projects/sdcorejs-angular/components/button/src/button-action-popover.spec.ts` với consumer host, form, dynamic signals và OverlayContainer. Giữ regression tests trong `button.component.spec.ts`. Xác nhận thất bại vì thiếu behavior/API cần thêm.

2. **Definitions và primitive** (INV-002/004/005).
   CREATE `components/button/src/button-item.component.ts`, `button-item-divider.component.ts`, `action-popover.ts`, `action-popover.scss` dưới canonical library root. Shared token ordered definition chỉ nằm nội bộ; ưu tiên đặt cùng file primitive nếu đủ gọn. EDIT `components/button/index.ts` export hai components. Implement CDK Overlay/TemplatePortal, positioning, focus/keyboard, style token và cleanup. Không export primitive.

3. **Tích hợp SdButton** (INV-001–005).
   EDIT `components/button/src/button.component.{ts,html,scss}`: signal content query; tách slots; action mode ARIA/chevron/type button; projected label fallback; lazy overlay. Giữ nguyên normal click throttle, loading/disabled, sizes/colors và bản fix disabled secondary text icon trước. Thêm case đổi variant khi đang mở, callback mở dialog, destroy và dynamic focus.

4. **Command Table adapter** (AC-012/013).
   EDIT `components/table/src/components/command/desktop-command.component.{ts,html,scss,spec.ts}` để children dùng SdButton/SdButtonItem. Giữ primary native command và row density. Resolver `pipes/{filter,command}.pipe.ts` chỉ sửa nếu test chứng minh vấn đề context; không thay model. Test row A→B, replacement/reused view, hidden async, disabled, htmlTemplate, icon/fontSet/color và autoId.

5. **Selection Action và export** (AC-014/015/016).
   EDIT `components/table/src/components/selector-action/selector-action.component.{ts,html,scss,spec.ts}` và `selector-action-layout.component.spec.ts`: map direct children/overflow sang item, giữ labels/group heading và padding 8px. EDIT `components/table/src/table.component.{ts,html}` cho export; VERIFY THEN EDIT test hiện có bao phủ export hoặc CREATE test scoped khi chưa có. Sau khi reference search xác nhận không còn consumer, DELETE `components/table/src/components/action-menu/action-menu.{ts,scss}`. Mobile/filter menu không sửa hành vi; chạy regression mobile tests.

6. **Demo và docs** (AC-016).
   EDIT `components/button/sd-button.md`, `components/table/sd-table.md`, `CHANGELOG.md` (Unreleased). CREATE `showcase/src/app/pages/components/button/examples/button-action-popover.example.{ts,html}`; EDIT `button-demo.component.ts`, table-demo.component.ts và documentation.registry.ts khi thêm section. Demo normal/basic, prefix/suffix/both, success/error, disabled, divider, @if dynamic; kết quả action hiện trong status. Table demos đang có children được cập nhật để kiểm tra row/selection. Docs ghi imports, title precedence, htmlType và D-005 mobile boundary. Chỉ sửa entry count khi thực sự thêm section.

7. **Generate, verify và browser** (AC-017).
   Chạy generators, sync đúng source of truth; unit/lint/build thật như bên dưới. Mở Showcase kiểm tra normal/action button, table children/export, desktop/mobile, viewport edges, keyboard, disabled state và dark/theme tokens. Sửa lỗi trong phạm vi rồi chạy lại phần liên quan. Ghi kết quả thật, không dùng kết quả test trước feature làm bằng chứng.

## Validation map

| Evidence | AC |
|---|---|
| Button behavior/form/dynamic/icon/DOM tests | AC-001–008 |
| Overlay focus/keyboard/outside/destroy/multiple-origin tests | AC-009–011 |
| Browser geometry: sát đáy, hai cạnh, narrow viewport, scroll/resize | AC-004/009/010/015 |
| DesktopCommand và row reuse integration | AC-012/013 |
| SelectorAction eligibility/selection/group regression | AC-014 |
| Export và mobile Table regression | AC-015 |
| Docs generator freshness/reference search/demo review | AC-016 |
| Sync/lint/test/build và public import smoke checks | AC-017 |

## Lệnh kiểm tra dự kiến

Node 22.22.3 theo repo; dùng npm scripts có sẵn, không cài dependency mới. Root commands:

```powershell
npm run generate:showcase
npm run sync
npm run check:sync
npm run test:scripts
npm run lint:v19
npm --prefix versions/v19 test -- --watch=false --browsers=ChromeHeadless
npm --prefix versions/v19 run build
npm --prefix showcase test
npm --prefix showcase run build
```

Sau canonical green, chạy `npm run lint:release` và `npm --prefix versions/v20 run build`, tương tự v21/v22, để kiểm chứng public API qua Angular compiler của mỗi line. Build đảm nhiệm typecheck library/templates thật. Showcase không khai báo lint script riêng; không báo Showcase lint pass nếu không có runner. Không coi build thay cho unit tests.

Dev Showcase đã được yêu cầu chạy tại `http://127.0.0.1:4200`; kiểm tra process trước, tái dùng nếu còn chạy. Nếu cần khởi động lại, build canonical trước rồi `npm --prefix showcase start -- --host 127.0.0.1 --port 4200`.

## Delivery và change control

Báo cáo API/architecture, files đổi/xóa/generated, coverage và kết quả từng nhóm check, hạn chế nếu có. Không publish/tag/release trong plan này. Giữ các thay đổi trước; không tự dọn working tree. Nếu implementation buộc phải đổi public model hoặc mobile modal behavior so với D-004/D-005, cập nhật phương án và trình duyệt thay đổi đó trước.

Tự review: các task bám component boundaries, source-of-truth và AC; không tạo menu framework/dependency mới; tests có context/focus/geometry thay vì chỉ mirror implementation. Tất cả file CREATE phải kiểm tra chưa tồn tại ngay trước khi ghi để tránh đè công việc mới.
