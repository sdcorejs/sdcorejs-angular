Repo `sdcorejs/sdcorejs-angular`, nhánh main. Tạo nhánh `feat/query-bar-panels` và mở PR draft khi xong.
Đọc `CLAUDE.md` của repo trước và làm đúng quy tắc trong đó: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`; không sửa tay v20/v21/v22, published-docs, published-pages, dist. Dùng đúng Node `22.22.3`.
Giải nén gói này vào `.sdcorejs/handoff/design-query-bar-panels/`.

## Đọc trước
1. `query-bar-panels.md`: nguồn chính. Khi file này và HTML khác nhau thì theo file này.
2. `Query Bar Saved Filters v2.dc.html` (mở bằng trình duyệt, cần `support.js` cùng thư mục): 9 mục, mục 09 là các điểm đã chốt.
3. Code: `components/query-bar/**`, `components/button/src/action-popover.*`, `forms/directives/src/search-field.*`, `services/notify/src/components/toast/*`, `components/table/src/table.component.ts` (phần query bar, `#clearQueryBar`, `queryBarOption`), `components/table/src/services/table-filter/table-query-bar.util.ts`, `sd-table.md` mục Query bar mode, `sd-query-bar.md`.

## Mục tiêu
Một khung panel cho ba popover của `sd-query-bar` (bỏ `mat-menu`); bộ lọc đã lưu theo khung đó, xoá có Hoàn tác, trạng thái trống và lỗi; bộ lọc bắt buộc luôn hiện, không xoá được giá trị; ô tìm dùng `sd-search-field`; mode inline có ô “Thêm điều kiện”; `sd-table` nối bộ lọc đã lưu và giữ giá trị bắt buộc khi Xoá lọc. Không đổi cơ chế lưu, không đổi giao diện `sd-button`.

## Bước 0: đề xuất trước khi code (trả lời ngắn, chờ mình duyệt)
- Trả lời 8 câu ở mục 16 của `query-bar-panels.md`.
- Kế hoạch file và commit cho 6 checkpoint ở mục 15.
- Danh sách spec hiện có sẽ sửa (selector mat-menu), sẽ xoá (`switchPickerMenu`), và mã test sẽ thêm ở mỗi checkpoint (mục 13).
- Rủi ro hồi quy bạn thấy với `openField()` từ header cột của bảng và với `applyOn: 'commit'`.

## Bước 1 → 6
Làm đúng 6 checkpoint ở mục 15. Mỗi checkpoint: test RED (tên test có mã) → code → `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='**/components/{query-bar,table,button}/**/*.spec.ts' --include='**/forms/directives/**/*.spec.ts'` và `npm run lint` xanh → một commit Conventional Commits (`feat(query-bar): …`, `fix(table): …`). Báo ngắn: đã làm gì, mã test nào đỏ rồi xanh, chỗ nào lệch spec.

## Review độc lập (mục 14)
- Sau checkpoint 3: dừng, mở **một phiên Claude Code mới** (không chia sẻ ngữ cảnh) làm reviewer R1 với prompt dưới. Sửa mọi mục Chặn, mỗi sửa có test `QB-B-xx`, rồi làm tiếp.
- Sau checkpoint 6 và lệnh đầy đủ: reviewer R2 (phiên mới), sửa, gọi kiểm lại.
- Phiên tác giả không viết hộ báo cáo review.

Prompt cho reviewer:
```
Bạn là reviewer độc lập cho sdcorejs/sdcorejs-angular, nhánh feat/query-bar-panels. Không có lịch sử của phiên viết code. Không sửa code, không commit.
Đọc CLAUDE.md, rồi .sdcorejs/handoff/design-query-bar-panels/query-bar-panels.md (mục 14 cho cổng R1 hoặc R2) và HTML trong cùng thư mục.
Chạy lại lệnh kiểm tra bằng Node 22.22.3. Làm phần thử phá ở mục 14 trên bản sao làm việc rồi hoàn tác.
Đi từng mục spec trong phạm vi cổng: ✓ / ✗ (file:dòng, mục spec) / N/A (lý do). Đối chiếu mọi mã test ở mục 13 có test tương ứng.
Ghi .sdcorejs/handoff/design-query-bar-panels/reviews/<R1|R2>.md: Kết luận (Chặn n · Nên sửa n · Ghi chú n), lệnh đã chạy và kết quả thật, bảng kết quả, bảng thử phá.
Spec mơ hồ thì ghi “Ghi chú: cần PD chốt”, không tự diễn giải.
```

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
- Coverage của file đã sửa trong `components/query-bar` và phần query bar của `table.component.ts`: statements ≥ 90%, branches ≥ 85%.
- Showcase: chạy QB-E-01…05 (mục 13.8), chụp ảnh so với HTML ở light, dark, RTL; `forced-colors` cho panel.
- Grep không còn `MatMenu`, `mat-menu`, `matMenuTriggerFor`, `.mat-mdc-menu-panel` trong `components/query-bar`, trừ CHANGELOG.
- `sd-button` Action Popover: ảnh chụp trước và sau giống nhau.

## Quy tắc
- Tên public, key i18n, `data-autoid` theo mục 11, 12. Không thêm input, output hay hành vi ngoài spec; thấy thiếu thì ghi vào báo cáo.
- Không thêm token, không hex mới, không `!important` hoặc `::ng-deep` mới, không dependency mới.
- `OnPush`, standalone, signal API; comment `why:` cho quyết định không hiển nhiên.
- CHANGELOG `## [Unreleased]`: Changed (panel query bar không còn là `mat-menu`; required kéo theo pinned; Xoá lọc giữ giá trị bắt buộc), Added (cỡ `xs` của `sd-search-field`, `savedFilters` của sd-table, ô Thêm điều kiện mode inline), Removed (`switchPickerMenu`).

## PR
Tiêu đề: `feat(query-bar): panel chung, bộ lọc đã lưu, bộ lọc bắt buộc, ô tìm`.
Mô tả: tóm tắt, câu trả lời Bước 0 đã duyệt, bảng mã test → file:dòng, link R1, R2, ảnh so với HTML, lệch thiết kế có chủ đích.

Không merge, tag hay publish khi mình chưa yêu cầu.
