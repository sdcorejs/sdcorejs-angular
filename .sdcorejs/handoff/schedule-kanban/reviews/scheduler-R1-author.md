# scheduler · R1 · phản hồi của tác giả
Review: [`scheduler-R1.md`](scheduler-R1.md) ở `86598cbc` (Chặn 0 · Nên sửa 5 · Ghi chú 11).

## Nên sửa
| # | Xử lý | Commit / test |
| --- | --- | --- |
| 1 | Tách điều phối pipeline dời sang `SdCalendarMoveRunner` (calendar-move.ts): một thao tác chờ, thanh hỏi phạm vi, đánh giá cờ lại trước `onMove`, năm kết quả, focus, live region. Calendar giữ phần kiểm riêng (khoảng, ngoài khoảng) rồi giao cho runner. Scheduler dùng cùng runner từ checkpoint 4, thêm `resourceId`, `axis`, `droppable`, mở nhóm qua phần kiểm và `accept` của plan. State chờ dùng chung một dạng: `{ id, target, saving }` (target có thêm `resourceId` ở scheduler). | `d7ac6828` refactor(calendar); `[CAL-SC-14]` runner bận |
| 2 | Từ checkpoint 3, commit RED chỉ thêm test, chạy trên code của checkpoint trước; báo cáo liệt kê test xanh sẵn. Không viết lại lịch sử CP2. | `a05b95f7` (RED CP3) |
| 3 | `[SCH-SC-16]` giờ kiểm dải lỗi có mặt và `sdLoadError` nhận `'SECRET'` trước khi kiểm DOM. | `c5b5b5f5` |
| 4 | Thêm test: ngày hỏng bị bỏ và cảnh báo một lần (`[SCH-SC-01]`), `step` lạ và giờ làm hỏng của component và của tài nguyên (`[SCH-C-13]`). | `c5b5b5f5` |
| 5 | Các thân hàm trùng chuyển sang `ɵ` của calendar: `SdCalendarReporter`, `SdCalendarHostWidth` (measureOnce + ResizeObserver), `SdCalendarMinuteTimer`, `sdCalendarIsRtl`, `sdCalendarInvalidItems`, `sdCalendarColor`, `sdCalendarIsOffDay`, `sdCalendarBrokenWeekdays`, `sdCalendarSelectionGone`, `sdCalendarMovedText`. Calendar và scheduler cùng dùng. | `d7ac6828`, `c5b5b5f5` |

## Ghi chú
| # | Xử lý |
| --- | --- |
| 6 | Giữ (Bước 0 câu 5: khoảng xem Tuần/Tháng của scheduler khác calendar). |
| 7 (cần PD chốt) | Giữ bộ đếm `#generation`: mỗi mảng `resources` mới là một lần tải mới và xoá lưới (H7 ghi "Đổi `resources`: xoá lưới tới khi có kết quả"). Nếu PD muốn chỉ xoá khi tập id đổi, đổi khoá sang `resourceIds`. |
| 8 (cần PD chốt) | Giữ `parseFloat`: biến kích thước phải là px; ghi trong `sd-scheduler.md`. `ROW_MIN`/`LANE` theo §7 (không có biến cho lane 32px). |
| 9 (cần PD chốt) | `SdSchedulerCellView` là kiểu của input `views` của directive (§8.5 "Thuộc tính `views` của directive ... không nhận `'day'`"); giữ để consumer khai báo được mảng có kiểu. |
| 10 (cần PD chốt) | `aria-label` đặt trên phần tử `role="grid"` (vùng cuộn là `div` không có role; ARIA 1.2 cấm `aria-label` trên phần tử generic). Nhãn = `ariaLabel` + tiêu đề. |
| 11 | Đổi truy vấn class nội bộ sang `[data-rows]`. Mã type test theo TESTING §3.7 không có mã riêng, giữ mã SC gần nhất; test hàm thuần mang mã C (thứ tự nhóm, hit test, kéo mép theo ngày) vì TESTING §6.1 không có mã U cho các hàm đó. |
| 12 | Kéo không dùng `#moving`: khối gốc giữ lane cũ (khung nét đứt), khối đề xuất vẽ ở hàng đích (checkpoint 4). `#moving` chỉ dùng khi đang chờ `onMove`, như calendar. |
| 13 (cần PD chốt) | Số đo production và số đo khi khối có `cdkDrag` sẽ có ở checkpoint 4 và G-final. |
| 14 | Đã sửa: chấm ngày lễ `observance` chỉ vẽ ở Tháng. |
| 15 (cần PD chốt) | Giữ: ‹ › ở Tuần/Tháng không đặt lại `scrollLeft` (spec chỉ nói cuộn khi vào chế độ và khi hôm nay bị khuất). |
| 16 | Không đổi hành vi. |
