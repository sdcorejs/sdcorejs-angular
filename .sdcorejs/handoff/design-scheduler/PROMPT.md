> Gói này là một phần của `.sdcorejs/handoff/schedule-kanban/`. Đọc `../schedule-kanban/PROMPT.md` trước: file đó quy định nhánh, commit, push, test (`TESTING.md`), review độc lập (`REVIEW.md`) và hợp đồng chung (`SHARED-CONTRACT.md`), và ưu tiên hơn file này ở các điểm đó.

Repo `sdcorejs/sdcorejs-angular`, nhánh main. Tạo nhánh `feat/scheduler` và mở PR.
Thư mục làm việc: `versions/v19/projects/sdcorejs-angular/components/scheduler` (mới).
Đọc `CLAUDE.md` của repo trước và làm đúng quy tắc trong đó: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`; không sửa tay v20/v21/v22, published-docs, published-pages, dist. Dùng đúng Node `22.22.3`.
Giải nén gói này vào `.sdcorejs/handoff/design-scheduler/`.

Điều kiện trước: `sd-calendar` đợt 1 đã merge vào main. Nếu chưa, chỉ làm Bước 0 rồi dừng.

## Đọc trước
1. `scheduler.md` trong gói này. Đây là nguồn chính; khi file này và HTML khác nhau thì theo file này.
2. `.sdcorejs/handoff/design-calendar/calendar.md` và `ADDENDUM-2026-11-08.md`. `scheduler.md` ghi “như calendar X” ở nhiều chỗ, nghĩa là làm đúng mục X của file này.
3. `SD Scheduler Design.dc.html`: mở bằng trình duyệt (cần `support.js` cùng thư mục). 9 mục: giải phẫu Ngày, Tuần và Tháng, khối sự kiện, tương tác, template ô, trạng thái, giao diện hẹp, API nháp, các điểm đã chốt.
4. Code: `components/calendar/**` đã merge (model, utils, pipeline dời, template directive, spec, `sd-calendar.md`), `components/file-explorer/**` (option theo nhóm năng lực), `components/avatar/**`, `services/date-time/**`, `assets/THEME.md`, `_component-tokens.scss`, `i18n/src/vi.ts`, trang Calendar trong showcase.
5. **Không dùng `components/kanban/**` làm mẫu.**

## Mục tiêu
Component mới `sd-scheduler`: lịch theo tài nguyên, 3 chế độ (Ngày theo giờ; Tuần, Tháng theo ngày), cột tài nguyên có nhóm, tạo bằng quét trên một hàng, dời theo hai trục với `move.droppable` và `move.axis`, template ô cho bảng chấm công. Dùng lại model, cấu hình, token và pipeline của sd-calendar; không viết lại phần đã có.

## Bước 0: đề xuất trước khi code (trả lời ngắn, chờ mình duyệt)
- Trả lời 5 câu ở mục 19 của `scheduler.md`.
- Kế hoạch file: file nào thêm, file nào sửa trong `components/calendar` (nếu cần export thêm), commit dự kiến cho 6 checkpoint ở mục 18.
- Cách dựng kéo hai trục bằng CDK: cách tính hàng đích và slot từ pointer khi có cột tài nguyên dính trái và trục giờ dính trên, cách chạy `droppable` mỗi khi đích đổi mà không làm giật, `cdkDragLockAxis` cho `axis`.
- Cấu trúc signal/computed: khoảng xem, cột, hàng (tài nguyên + nhóm thu gọn), lane theo hàng, toạ độ khối; điểm nào dùng `effect`.
- Danh sách key i18n mới và key dùng lại của calendar (mục 14).

## Bước 1 → 6
Làm đúng 6 checkpoint ở mục 18. Mỗi checkpoint là một commit. Viết test RED trước (mục 16) rồi mới code. Hết mỗi checkpoint thì chạy test và lint, báo ngắn: đã làm gì, test nào xanh, chỗ nào lệch spec.

## Quy tắc
- Tên public, kiểu, `data-autoid` và namespace i18n theo đúng mục 2, 3, 4, 14, 15. Không thêm alias.
- Không thêm chế độ, input hay output ngoài spec. Thấy thiếu thì ghi vào báo cáo.
- Không thêm token màu; dùng lại `--sd-calendar-*` kèm fallback. Không có hex mới; `check:scss-hex` phải xanh.
- Ngày giờ đọc qua `SdDateTimeService`, như calendar. Không `new Date(string)`, không cộng 24 giờ để sang ngày.
- Không sửa mảng hay object consumer trả về; cập nhật bằng object mới, giữ tham chiếu `data`.
- Không đổi API public của sd-calendar. Nếu cần export thêm hàm hoặc type từ calendar, ghi ở Bước 0.
- `ChangeDetectionStrategy.OnPush`, standalone, signal API, `@if/@for` với `track` theo ID. Không `!important`, không `::ng-deep`.
- Không render phần tử cho từng slot; vạch lưới vẽ bằng gradient; con trỏ lưới là một phần tử.

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
- Showcase: trang Scheduler có đủ 4 ví dụ và công tắc ở mục 17.
- Kiểm tra tay: kéo sang hàng bị `droppable` chặn; `axis: 'time'` ở ví dụ nghỉ phép; nhóm thu gọn rồi dời bằng `Alt` + `↑` `↓` vào nhóm đó; 150 tài nguyên × 31 ngày; component rộng 1200px, 700px, 400px; `pointer: coarse`; light, dark, RTL, forced-colors; chỉ bàn phím; VoiceOver hoặc NVDA.

## PR
Tiêu đề: `feat(scheduler): thêm sd-scheduler`.
Mô tả gồm: tóm tắt API, bảng đối chiếu với sd-calendar (mục 2), câu trả lời Bước 0 đã duyệt, ảnh 4 ví dụ của showcase, số đo render ở câu 4 mục 19.

Không push, tag hay publish khi mình chưa yêu cầu.
