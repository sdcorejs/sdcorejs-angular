# calendar · R2' lần 2 (N-1…N-4)

Nhánh `feat/calendar`, phạm vi `730cd408..e77967c2`: `8684685e` (test RED), `eb20d9dd` (sửa), `4eb6ae1c` (ảnh), `e77967c2` (sync). Reviewer độc lập, chỉ đọc code và chạy hai lệnh dưới. Đường dẫn file dưới đây tính từ `versions/v19/projects/sdcorejs-angular/components/calendar/src/`.

Mục mới: Chặn: 0 · Nên sửa: 1 · Ghi chú: 4
**Được mở PR.** Bốn mục N-1…N-4 đã sửa đúng ở code. Chỉ còn khoảng hở ở test: phần chữ của N-1 không có test bắt được (M-1).

## Đã chạy

| Lệnh | Kết quả |
| --- | --- |
| `npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --include='**/components/calendar/**/*.spec.ts'` (log `C:\tmp\r2pp-quick.log`) | `TOTAL: 173 SUCCESS`, seed 802679. Chạy trên Node 26.12.0 local, không phải 24.22.1. |
| `npm run check:sync` (root) | `Version workspace sync check passed: v20, v21, v22 match v19.` |
| `npx eslint` trên 5 file đã đổi (thêm, không bắt buộc) | Sạch |

## N-1…N-4

| Mục | Kết quả | Bằng chứng |
| --- | --- | --- |
| N-1 (RTL: chữ, padding, thanh tiến trình) | **Đã sửa đúng** (test chưa đủ, xem M-1) | `:host { text-align: start }` (`calendar.component.scss:89`). Bốn shorthand đã thành `padding-block`/`padding-inline`. Ở LTR giá trị giữ nguyên: toolbar `0 12 0 14` thành block 0, inline 14/12 (`:120–121`); corner `0 8 6 0` thành block 0/6, inline 0/8 (`:370–371`); all-day-label `8 8 0 0` thành block 8/0, inline 0/8 (`:383–384`); agenda-day `10 12 10 16` thành block 10, inline 16/12 (`:826–827`). Grep không còn shorthand 4 giá trị không đối xứng; hai shorthand 3 giá trị còn lại (`:692`, `:1240`) đối xứng ngang. Thanh tiến trình lật ở RTL bằng `.sd-calendar__progress:dir(rtl) { scaleX(-1) }` (`:957`). Transform đặt ở khung, còn animation `translateX` chạy trên `.sd-calendar__progress-bar` con (`:218–233`), nên hai transform không đè nhau. Ảnh `week-960-rtl.png`: tiêu đề và giờ của khối nằm sát chấm ở mép phải ("Demo sprint 42", "… ngân sách Q4"). Thanh cả ngày cũng vậy ("Trực đêm 22:00", "Nghỉ phép · Lan", "Công tác Đà Nẵng"). "GMT+7", "Cả ngày" và "08:00" cùng cách viền trái cột giờ khoảng 8px. Không có ảnh cho thanh tiến trình và Danh sách RTL; hai chỗ này chỉ kiểm bằng đọc code (M-4). |
| N-2 (listener Esc) | **Đã sửa đúng** | `#onDocumentKeydown` (`calendar.component.ts:1491–1511`) gỡ listener khi `#press`, `#dragSession` và `#resizeSession` đều null. Esc giữa lúc quét đặt `#press = null` rồi gỡ ngay, nên `onGridPointerUp` (`:920–922`) có `return` sớm cũng không còn rò. Esc giữa lúc kéo mép cũng vậy. Khi kéo khối, Esc chỉ đặt `cancelled = true`, `#dragSession` vẫn còn nên listener ở lại tới `onDragEnded` (`:1093`); không gỡ nhầm. Tay nắm có `(pointercancel)="onResizeCancel()"` (`calendar.component.html:367`). `onResizeCancel` (`ts:1146–1150`) xoá `#resizeSession` và `#resize`, rồi gỡ listener. Event vẫn nổi lên `onGridPointerCancel` (`html:263`); bên đó chỉ gỡ lại (vô hại) và xoá ghost khi không bận, nên không có tác dụng phụ. |
| N-3 (chấm của khối đề xuất) | **Đã sửa đúng** | `html:396–400` có `.sd-calendar__dot` và `.sd-calendar__event-content`, cùng cấu trúc với khối thường (`html:334–340`). SCSS `:1074–1085` đặt `flex-direction: row`, `gap: 4px` và chấm `margin-top: 5px`, khớp `.sd-calendar__event` (`:598–617`). Ghost vẫn giữ `column` từ rule chung (`:1048`). Màu chấm lấy `--sd-calendar-event-dot` từ nhóm token (`:554`). Ảnh `interaction-drag.png`: khối đề xuất ở T6 có chấm cam trước "Review ngân sá…", tiêu đề cắt bằng dấu ba chấm. |
| N-4 (tên nút "+N") | **Đã sửa đúng** | `allDayMoreLabel` (`ts:1194–1199`): nếu `more` đã bắt đầu bằng `more-short` thì giữ `more`, không thì ghép `"+2, " + more`, rồi nối nhãn ngày. Theo key: vi "+2 khác, …", en "+2 more, …", không lặp "+2". ja "+2, 他 2 件, …", ko "+2, 2개 더 보기, …", zh "+2, 还有 2 项, …". `i18n` có đúng 5 file ngôn ngữ và test duyệt cả 5. `I18nService.t` đọc signal `messages()`, nên gọi hàm này từ template OnPush vẫn phản ứng; dù vậy repo đang theo mô hình reload khi đổi ngôn ngữ. Nút "+N" ở ô tháng (`html:489`) hiện nguyên `more`, không có `aria-label`, nên không vướng 2.5.3. |

## Test [CAL-B-17]…[CAL-B-20]

Đỏ trên code cũ hay không: đánh giá bằng đọc code, không chạy lại trên code cũ.

| Test | Đỏ trên code cũ | Nhận xét |
| --- | --- | --- |
| `[CAL-B-17]` `calendar.edges.spec.ts:250` | Có, nhờ padding | Toolbar cũ ở RTL cho `[right, left] = [12, 14]` (mong `[14, 12]`). Corner và all-day-label cũ cho `[left, right] = [0, 8]` (mong `[8, 0]`). Phép kiểm `textAlign` (`:255`) không có tác dụng, xem M-1. Agenda-day và thanh tiến trình không có test. |
| `[CAL-B-18]` `calendar.edges.spec.ts:264` | Có | Giai đoạn "quét + Esc + thả" bắt đúng lỗi: code cũ không gỡ listener. Giai đoạn "pointercancel" đỏ nhờ phép kiểm giờ (`14:00 – 16:30` còn dính). Hai phép kiểm listener sau không có tác dụng, xem M-2. |
| `[CAL-B-19]` `calendar.edges.spec.ts:305` | Có (ja/ko/zh) | Không kiểm vi/en không lặp "+2", xem M-3. |
| `[CAL-B-20]` `calendar.interaction.spec.ts:641` | Có | `:scope > .sd-calendar__dot` là null trên code cũ. Nếu kéo không bắt đầu thì proposal null và `q(host, ':scope > …')` cũng null, nên test fail chứ không pass nhầm. |

## Mục mới

| # | Mức | Vị trí | Vấn đề | Đề xuất |
| --- | --- | --- | --- | --- |
| M-1 | Nên sửa | `calendar.edges.spec.ts:255` | `expect(getComputedStyle(host).textAlign).toBe('start')` cũng pass trên code cũ. Karma của `sdcorejs-angular` không nạp global style: `angular.json` → `test.options` không có `styles`, và `jasmine.css` không có `text-align`. Vì vậy `body { text-align: left }` (`assets/scss/core/utilities/_base.scss:42`) không có mặt, và host nhận giá trị khởi tạo `start`. Gỡ `text-align: start` khỏi `:host` (`scss:89`) thì không test nào đỏ, trong khi đó chính là triệu chứng chính của N-1 ở app có dùng reboot. | Trong test, đặt `document.body.style.textAlign = 'left'` trước `mount` và trả lại ở cuối (hoặc `afterEach`). Hoặc kiểm hình học ở RTL: mép phải của `.sd-calendar__event-title` cách chấm không quá `gap` + 1px. |
| M-2 | Ghi chú | `calendar.edges.spec.ts:272–275`; cùng mẫu `calendar.compact.spec.ts:143–146` (`[CAL-B-06]`) | `leaked()` so theo tham chiếu, mà `#onDocumentKeydown` chỉ có một tham chiếu. Sau lần gỡ đầu (giai đoạn quét), mọi lần gọi sau luôn trả 0. Nên hai phép kiểm "resize + Esc" và "resize + pointercancel" không kiểm gì. Trên code cũ hai đường này cũng không rò: `onResizeUp` luôn gỡ, và `pointercancel` của tay nắm nổi lên `onGridPointerCancel`. Lỗi thật của nhánh pointercancel là preview còn dính, và phép kiểm giờ đã bắt được. | Đếm theo thứ tự: sau mỗi giai đoạn, lần `removeEventListener('keydown', …, true)` cuối phải đến sau lần `addEventListener` cuối (so chỉ số trong `spy.calls.all()`). Hoặc đếm số lần add/remove tăng trong từng giai đoạn. |
| M-3 | Ghi chú | `calendar.edges.spec.ts:324` | Test chỉ kiểm `startsWith('+2')`. Đột biến luôn ghép `"+2, " + more` vẫn pass, ra "+2, +2 khác, …" ở vi/en. | Thêm `expect(label).not.toContain('+2, +2')`, hoặc so chính xác nhãn vi (`'+2 khác, ' + nhãn ngày`). |
| M-4 | Ghi chú | `.sdcorejs/handoff/schedule-kanban/reports/calendar-tests.md:135–141`, `:171` | Bảng test-ID dừng ở `CAL-B-16`, chưa có `CAL-B-17`…`CAL-B-20`. Dòng RTL của bảng ảnh (`:171`) chưa nhắc chữ và padding. R2' đề nghị cập nhật dòng này. Lúc review, `calendar-R2-author.md` đang được sửa và chưa commit (đã có N-1…N-4 ở `:70–73`). | Bổ sung trước khi mở PR. Ghi rằng thanh tiến trình và Danh sách RTL chỉ kiểm bằng đọc code, hoặc chụp thêm. |
| M-5 | Ghi chú | `calendar.component.ts:1146–1150` | `onResizeCancel` không gọi `stopPropagation`, nên `pointercancel` nổi lên `onGridPointerCancel`. Hiện vô hại: ở đó `#press` đã null, gỡ lại listener là no-op, và chỉ xoá ghost khi không bận. Nếu sau này `onGridPointerCancel` làm thêm việc thì sẽ chạy cả khi huỷ kéo mép. | Không bắt buộc. `onResizeDown` và `onResizeUp` đều `stopPropagation`; làm giống vậy thì cả ba handler của tay nắm nhất quán. |

**API consistency:** đã rà. `onResizeCancel` và `allDayMoreLabel` là `protected`, không đổi public API hay export. Tên `onResizeCancel` theo cặp `onGridPointerCancel` / `onResizeUp` đang có. Không đổi input/output. v20/v21/v22 chỉ đổi qua `npm run sync` (`e77967c2`), và `check:sync` xanh.

## Kết luận

**Được mở PR.** Không có mục Chặn. Nên sửa M-1 (test chưa bắt phần chữ của N-1) trước khi merge, hoặc ghi vào mô tả PR như việc còn mở. M-2…M-5 là ghi chú.
