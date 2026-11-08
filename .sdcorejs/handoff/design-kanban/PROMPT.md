> Gói này là một phần của `.sdcorejs/handoff/schedule-kanban/`. Đọc `../schedule-kanban/PROMPT.md` trước: file đó quy định nhánh, commit, push, test (`TESTING.md`), review độc lập (`REVIEW.md`) và hợp đồng chung (`SHARED-CONTRACT.md`), và ưu tiên hơn file này ở các điểm đó.

Repo `sdcorejs/sdcorejs-angular`, nhánh main. Tạo nhánh `feat/kanban-api` và mở PR.
Thư mục làm việc: `versions/v19/projects/sdcorejs-angular/components/kanban`.
Đọc `CLAUDE.md` của repo trước và làm đúng quy tắc trong đó: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`; không sửa tay v20/v21/v22, published-docs, published-pages, dist. Dùng đúng Node `22.22.3`.
Giải nén gói này vào `.sdcorejs/handoff/design-kanban/`.

## Đọc trước
1. `kanban.md` trong gói này: nguồn chính. Khi file này và HTML khác nhau thì theo file này.
2. `Kanban Review.dc.html`: mở bằng trình duyệt (cần `support.js` cùng thư mục). 8 mục: kết luận review, board P1, thẻ, kéo và sắp xếp, tải theo cột, API mới, bảng chuyển đổi, các điểm đã chốt.
3. Code hiện tại: `components/kanban/**` (nhất là `#move`, `#current`, `#trackFocus`, `#focusCard` trong component và `prepareKanbanMove`), `sd-kanban.md`, showcase `pages/components/kanban/kanban-demo.component.ts`, `assets/THEME.md` mục kanban.
4. Quy ước để đối chiếu: `components/file-explorer/**` (nhóm `move: { movable, onMove }`, `SdFileExplorerState`), `components/table/**` (quick search, debounce), gói `.sdcorejs/handoff/design-timeline/timeline.md` mục 3–4 (`items` hoặc `dataSource` theo cursor) và `design-calendar/calendar.md` mục 2.

## Mục tiêu
Đổi public API của `sd-kanban` sang dạng thẻ `{ id, columnId, title, data? }`, nguồn dữ liệu `items` hoặc `dataSource` theo cột, nhóm `option.move = { movable, droppable, reorder, onMove }`, thêm chọn thẻ và kéo bằng cả thẻ. Giữ pipeline dời, focus, live region và toàn bộ phần hình ảnh của main. Breaking change, không alias.

## Bước 0: đề xuất trước khi code (trả lời ngắn, chờ mình duyệt)
- Trả lời 5 câu ở mục 16 của `kanban.md`.
- Kế hoạch file và commit cho 6 checkpoint ở mục 15.
- Danh sách spec hiện có sẽ sửa, sẽ xoá (vì API cũ), sẽ thêm.
- Cấu trúc state theo cột ở chế độ `dataSource` (signal hay một store nhỏ trong component) và cách nối với điều kiện huỷ của `#current`.

## Bước 1 → 6
Làm đúng 6 checkpoint ở mục 15. Mỗi checkpoint một commit. Sửa hoặc viết spec RED trước (mục 13) rồi mới code. Hết mỗi checkpoint chạy test và lint, báo ngắn: đã làm gì, test nào xanh, chỗ nào lệch spec.

## Quy tắc
- Tên public, kiểu, `data-autoid`, i18n theo mục 3, 4, 11, 12. Không thêm alias cho API cũ.
- Không thêm token; không hex mới; `check:scss-hex` phải xanh.
- Không viết lại pipeline dời; chỉ sửa đầu vào, đầu ra như mục 7.5.
- Không thêm input, output hay layout ngoài spec. Thấy thiếu thì ghi vào báo cáo.
- `OnPush`, standalone, signal API, `@for` track theo id. Không `!important`, không `::ng-deep`.

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
- Showcase: đủ 4 ví dụ ở mục 14. Kiểm tra tay ví dụ Đơn hàng: kéo DH… từ Chờ xác nhận thì Hoàn tất mờ ngay; thả vào Đang giao; Hoàn tác; chuyển sang Đã huỷ rồi đóng hộp lý do (không hiện lỗi); Xem thêm; cột lỗi và Thử lại; bấm thẻ mở drawer; chỉ bàn phím (Tab vào thẻ, Enter, Alt + →); cảm ứng (chạm chọn, giữ 400ms để kéo); light, dark, RTL, forced-colors; board trong cột 400px.
- Grep không còn `getColumnId`, `withColumn`, `SdKanbanId`, `canMove`, `sdKanban…` cũ trong repo, trừ CHANGELOG và bảng chuyển đổi của `sd-kanban.md`.

## PR
Tiêu đề: `feat(kanban)!: API thẻ, dataSource theo cột, move.droppable, chọn thẻ`.
Mô tả gồm: bảng chuyển đổi (mục 07 của HTML), câu trả lời Bước 0 đã duyệt, ảnh ví dụ Đơn hàng khi đang kéo và khi cột lỗi, danh sách spec đã đổi.

Không push, tag hay publish khi mình chưa yêu cầu.
