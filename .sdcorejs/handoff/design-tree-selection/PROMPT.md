Repo `sdcorejs/sdcorejs-angular`, nhánh main. Tạo nhánh `feat/tree-navigation` và mở PR draft khi xong.
Đọc `CLAUDE.md` của repo trước và làm đúng quy tắc trong đó: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`; không sửa tay v20/v21/v22, published-docs, published-pages, dist. Dùng đúng Node `22.22.3`.
Giải nén gói này vào `.sdcorejs/handoff/design-tree-selection/`.
Gói `design-query-bar-panels` đang làm song song. Không sửa file của gói đó; nếu cùng chạm `table.component.html` thì rebase khi gói kia merge trước.

## Đọc trước
1. `tree-selection.md`: nguồn chính.
2. `SD Tree Review.dc.html` (cần `support.js` cùng thư mục): 01 hiện tại, 02 trạng thái gốc, 03 chế độ điều hướng, 04 trạng thái hàng, 05 thanh chọn nhiều, 06 API và bàn phím, 07 đã chốt.
3. Code: `components/tree/**`, `components/table/src/components/selector-action/*`, `command/desktop-command.*`, `filter/external-filter/*`, `filter/mobile-filter/mobile-filter-field.*`, `components/button/src/action-popover.*`, `components/quick-action/**`.

## Bước 0 (trả lời ngắn, chờ mình duyệt)
- 6 câu ở mục 18.
- Kế hoạch file và commit cho 6 checkpoint (mục 17), danh sách spec sẽ sửa, mã test sẽ thêm ở từng checkpoint.
- Rủi ro hồi quy với `sd-tree-select` và với thanh chọn của `sd-table` trên mobile.

## Bước 1 → 6
Đúng mục 17. Mỗi checkpoint: test RED (tên có mã) → code → `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='**/components/{tree,table,quick-action,button}/**/*.spec.ts'` và `npm run lint` xanh → một commit (`feat(tree): …`, `refactor(table): …`). Báo ngắn sau mỗi checkpoint.

## Review độc lập (mục 16)
Sau checkpoint 3 và sau checkpoint 6: mở một phiên Claude Code mới (không chia sẻ ngữ cảnh), dán prompt:
```
Bạn là reviewer độc lập cho sdcorejs/sdcorejs-angular, nhánh feat/tree-navigation. Không có lịch sử của phiên viết code. Không sửa code, không commit.
Đọc CLAUDE.md, rồi .sdcorejs/handoff/design-tree-selection/tree-selection.md (mục 16 cho cổng R1 hoặc R2) và HTML cùng thư mục.
Chạy lại lệnh kiểm tra bằng Node 22.22.3. Làm phần thử phá ở mục 16 trên bản sao làm việc rồi hoàn tác.
Đi từng mục spec trong phạm vi cổng: ✓ / ✗ (file:dòng, mục spec) / N/A (lý do). Đối chiếu mọi mã test ở mục 15.
Ghi .sdcorejs/handoff/design-tree-selection/reviews/<R1|R2>.md: Kết luận (Chặn n · Nên sửa n · Ghi chú n), lệnh đã chạy và kết quả thật, bảng kết quả, bảng thử phá.
Spec mơ hồ thì ghi “Ghi chú: cần PD chốt”.
```
Sửa mọi mục Chặn trước khi làm tiếp; mỗi sửa có test `TR-B-xx`.

## Kiểm tra cuối
```
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm run lint
npx ng build sdcorejs-angular
cd ../..
npm run test:theme
npm run check:scss-hex
npm run sync
npm run check:sync
```
Showcase: E2E và ảnh chụp ở mục 15. Grep MM-03.

## Quy tắc
- Tên public, key i18n, autoId theo spec; không alias, không thêm ngoài spec.
- Không thêm token, hex, dependency; không `!important`/`::ng-deep` mới.
- CHANGELOG `## [Unreleased]`: Added (navigation, activeId, expandedIds, count, reveal, reloadNode, expand, collapse, focusNode, onResolvePath, onSearch, sdTreeEmptyDef), Changed (lỗi gốc không hiện error.message; thanh chọn của cây nằm trong khung; ô icon thanh chọn của bảng sang primary; menu thiết lập external filter và menu toán tử mobile là Action Popover).

## PR
Tiêu đề: `feat(tree): chế độ điều hướng, thanh chọn dùng chung với sd-table`.
Mô tả: tóm tắt, Bước 0 đã duyệt, bảng mã test → file:dòng, link R1, R2, ảnh so với HTML.

Không merge, tag hay publish khi mình chưa yêu cầu.
