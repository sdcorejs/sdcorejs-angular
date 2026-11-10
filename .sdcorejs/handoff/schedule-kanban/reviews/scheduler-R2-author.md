# scheduler · R2 · phản hồi của tác giả
Nhánh `feat/scheduler`. Review ở `eb32766d2`: phần spec và code [`scheduler-R2-spec.md`](scheduler-R2-spec.md) (2 Chặn, 7 Nên sửa, 15 Ghi chú), phần test và thử phá [`scheduler-R2-tests.md`](scheduler-R2-tests.md) (2 Chặn, 6 Nên sửa, 6 Ghi chú).

Commit:
- `62566f854` `refactor(calendar): share the create runner, the scope bar and the range check with sd-scheduler` (spec #6). Calendar 192/192, `calendar-move.ts` 100%.
- `9c44e3e8f` `fix(scheduler): R2 lane order, compact first scroll, …` với mọi test `SCH-B-xx` trong `components/scheduler/src/scheduler.review.spec.ts`.
- Commit kế tiếp: dữ liệu showcase theo HTML, E2E, ảnh, báo cáo, sync v20/v21/v22.

Thử phá lại sau khi sửa (mỗi lần một chỗ, spec scheduler, hoàn tác): bỏ đánh giá lại cờ trước `onMove` → 2 đỏ `[SCH-B-40]`; bỏ guard `locked` → 1 đỏ `[SCH-B-41]`; khoá nhớ `droppable` chỉ theo tài nguyên → 1 đỏ `[SCH-B-42]`; bỏ khoá sắp theo giờ → 2 đỏ `[SCH-B-01]`; bỏ đo kích thước trước khi cuộn → 1 đỏ `[SCH-B-02]`; bỏ `isolation` của rãnh → 1 đỏ `[SCH-B-03]`.

## Phần spec và code
| Mục | Xử lý | Test |
| --- | --- | --- |
| 1 Chặn: lane và thứ tự DOM ở Tuần/Tháng theo thứ tự `onLoad` | `SdSchedulerLaneItem.at` (giờ bắt đầu thật) là khoá sắp sau `start` và `allDay` (§8.4 bước 2, 6) | `[SCH-B-01]` (hàm thuần và DOM) |
| 2 Chặn: host hẹp từ đầu cuộn tới `scrollTime` với kích thước rộng | `#scrollToTime` và `#revealToday` đo kích thước trước | `[SCH-B-02]` (Ngày mở ở 8 × 64px; Tuần đưa hôm nay sát cột 120px) |
| 3: khối, nét đứt, đề xuất, con trỏ đè lên phần dính | `isolation: isolate` trên `.sd-scheduler__track` | `[SCH-B-03]` (`elementFromPoint` dưới cột tài nguyên trả ô tài nguyên) |
| 4: khối đề xuất là hộp rỗng màu primary | Đề xuất là chính khối: lớp `sd-scheduler__event`, `data-color`, chấm, tên theo bậc, viền event-color, bóng lớn; không cắt nhãn | `[SCH-B-04]` |
| 5: tiêu đề hẹp bị cắt mất ngày | Trong lúc chờ PD chốt dạng tiêu đề: tiêu đề hẹp xuống dòng (`white-space: normal`), không mất ngày. **Cần PD chốt** "09/11/2026" (HTML) hay dạng của calendar. | `[SCH-B-05]` |
| 6: pipeline tạo và vài handler chép từ calendar | Dùng chung `ɵSdCalendarCreateRunner`, `ɵSdCalendarScopeBar` (hỏi, trả lời, Esc, focus), `ɵsdCalendarOutOfRange`. Còn lại các handler 1–3 dòng ghi vào signal của chính component (`setView`, `shift`, `goToday`, `openDay`, `dismissFailure`, `selectItem`): giữ, vì chúng là keo nối với `view`/`date`/`announcer` riêng của từng component. | Test hiện có của cả hai component; `calendar.shared.spec.ts` cho runner và scope bar |
| 7: vùng chạm 44px khi hẹp | Nút của dải, nút thanh hỏi phạm vi: `min-height: var(--sd-control-height-coarse, 44px)`; số ngày ở Tuần: vùng chạm 44px bằng `::after`. Ô Tháng 28px: **cần PD chốt** (mâu thuẫn §11). Calendar cùng lệch: đưa vào RX. | `[SCH-B-07]` |
| 8: ảnh không so 1:1 với HTML | Dữ liệu showcase đổi đúng theo HTML (phòng, xe, phòng kế toán, mã công và cột tổng, nhãn ô góc); đồng hồ ghim Thứ Hai 09/11/2026 10:40 (`page.clock.setFixedTime`), có vạch giờ hiện tại; khung 1122px; RTL bật rồi mở lại Ngày để cuộn tới `scrollTime`. Ảnh mới: 01 (Ngày, dark, RTL), 02 (Tuần, Tháng), 03 (đang chọn, đang lưu), 04 (quét, con trỏ lưới, hỏi phạm vi, bị từ chối, đổi hàng, hàng bị chặn, kéo mép), 06 (đang tải lại, lỗi tải, trống), 07 (700, 400, 360px). Không có ảnh "đang tải lần đầu": khối xương chỉ có trước câu trả lời đầu của `onLoad`, ví dụ client trả ngay; Karma kiểm (`SCH-C-02`). | E2E |
| 9: số ngày trên trục Tuần "9" thay vì "09" | Giữ định dạng của calendar như L5; ghi vào bảng lệch của PR. | — |
| 10, 11, 12 | **Cần PD chốt**, không đổi. | — |
| 13 | R1 #7, 8, 9, 10, 13, 15 vẫn chờ PD. | — |
| 14 | Trùng nhỏ còn lại (`sdSchedulerVisibleDays`, vòng from/to của `sdSchedulerColumnSpan`, vòng gán lane): không phải pipeline, giữ như R1 #6. | — |
| 15 | Xoá `sdSchedulerColumnAt` (không dùng) và JSDoc mồ côi; thêm `why:` cho hằng 2px của `#trackWidth`. | — |
| 16 | `Alt` + `↓` ở tài nguyên cuối không đọc gì. | `[SCH-B-16]` |
| 17 | `--sd-scheduler-group-height` ghi vào bảng API của PR (đã có trong `sd-scheduler.md`, THEME). | — |
| 18, 19, 20, 22 | Không đổi (theo spec; SC-43 và helper E2E chung để RX quyết; trình đọc màn hình ở bước tay). | — |
| 21 | Thêm `spyOn(console, 'warn')` ở test đổi `resources` của `SCH-C-02`; còn 6 dòng WARN từ test khác, không ảnh hưởng kết quả. | — |
| 23 | Ở `forced-colors`, chấm màu có viền `CanvasText`, số ngày hôm nay có viền `Highlight`. | `[SCH-B-23]` |
| 24 | Không đổi (vạch cuối cột cuối, con trỏ ngoài giới hạn khi rê). | — |

## Phần test và thử phá
| Mục | Xử lý | Test |
| --- | --- | --- |
| 1 Chặn: không test đánh giá lại cờ trong lúc thanh hỏi phạm vi mở | Thêm test cho `movable` và `droppable`, sự kiện lặp, `Alt` + `↓`, đổi cờ khi thanh đang mở | `[SCH-B-40]` |
| 2 Chặn: SC-17 thiếu nhánh bị khoá | `move()` và `Alt` + `→` khi `readonly`, `disabled`, đang tải lại, sau lỗi tải | `[SCH-B-41]` |
| 3: bộ nhớ `droppable` theo `(resourceId, start)` | Kéo dọc một hàng: 10:00 được, 11:00 bị chặn, quay lại 10:00 được, lần sau không gọi lại | `[SCH-B-42]` |
| 4: SC-32 không có `ResizeObserver` | Không lỗi, giao diện rộng | `[SCH-B-43]` |
| 5: nhánh phụ SC-01, SC-26, SC-29 | Id và tên sự kiện rỗng; chọn bằng chạm; focus sau lỗi và sau Huỷ phạm vi | `[SCH-B-44]`, `[SCH-B-45]`, `[SCH-B-46]` |
| 6: commit `c248d8ffa` không có mã `-B-` | Đặt thêm mã `[SCH-B-30]` (nhãn kéo mép), `[SCH-B-31]` (lật nhãn), `[SCH-B-32]` (tô ngoài `minDate`/`maxDate`), `[SCH-B-33]` (`sdCellSelect` khi `disabled`) | — |
| 7: ma trận E2E | Thêm zone `America/New_York` với `?timeZone=Asia/Ho_Chi_Minh` và `Asia/Kolkata` không cấu hình (như CAL-E-15). Preset `graphite` là tham số biên dịch SCSS, không đổi được trong showcase lúc chạy; locale `en` kiểm ở Karma (`scheduler.i18n.spec.ts`), như calendar. | E2E |
| 8: báo cáo thiếu số hiệu năng | Thêm mục Hiệu năng (dev server và production build) vào `reports/scheduler-tests.md`. | — |
| 9, 10 | **Cần PD chốt** (hiệu năng vượt 250ms ở dev server; viewport 1920). | — |
| 11, 13 | Không đổi (bảo vệ hai lớp; spec chạy ở `Asia/Ho_Chi_Minh`, zone máy không ảnh hưởng). | — |
| 12 | Nhánh còn trống: callback tự cuộn khi kéo sát mép, RTL của `#revealToday`. Branches component sau R2: 86.99%. | — |
| 14 | Xem mục 21 của phần spec. | — |
