# Hợp đồng chung: sd-calendar, sd-scheduler, sd-kanban

Ba component dùng chung hợp đồng dưới đây. Khi spec riêng (`calendar.md`, `scheduler.md`, `kanban.md`) hoặc phụ lục khác file này ở cùng một điểm, theo file này. Mỗi điểm có mã `SC-xx`; test tương ứng nằm ở `TESTING.md` mục 4.

## 1. Định danh và dữ liệu

| Mã | Quy tắc |
| --- | --- |
| SC-01 | Mọi id public là `string`, duy nhất trong phạm vi của nó (sự kiện, thẻ, tài nguyên, cột). Trùng hoặc rỗng là dữ liệu không hợp lệ. |
| SC-02 | Item có `data?: T` là DTO của consumer. Component không đọc, không sửa, không serialize `data`; sau mọi thao tác, item mới giữ **cùng tham chiếu** `data`. |
| SC-03 | Component không sửa mảng hay object consumer truyền vào. Cập nhật bằng object mới. |
| SC-04 | Không có hàm ánh xạ `get*`, `with*`. Consumer map DTO sang item của component trước khi đưa vào. |

## 2. Cờ năng lực

| Mã | Quy tắc |
| --- | --- |
| SC-05 | Kiểu cờ: `boolean \| ((context: C) => boolean)`. Tên kiểu theo component: `SdCalendarState`, `SdKanbanState` (scheduler dùng `SdCalendarState`). |
| SC-06 | Cờ được đánh giá khi render (để vẽ tay nắm, con trỏ, làm mờ) và **đánh giá lại ngay trước khi** gọi callback. Lần sau trả false thì dừng, không gọi callback. |
| SC-07 | Năng lực là một nhóm trong `option`: `create: { creatable?, onCreate }`, `move: { movable?, droppable?, onMove, … }`. Không khai báo nhóm thì giao diện tương ứng không có (không tay nắm, không menu, không phím). |
| SC-08 | `droppable` là hàm đồng bộ, không gọi API. Chạy khi bắt đầu kéo hoặc khi đích đổi, khi mở menu chuyển, khi dùng `Alt` + phím, và ngay trước `onMove`. Kiểm tra cuối cùng vẫn là `onMove`. |

## 3. `onMove`

Kiểu: `onMove: (request) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>`.

| Mã | Kết quả | Dữ liệu | Hiển thị | Output | Live region |
| --- | --- | --- | --- | --- | --- |
| SC-09 | `true` | Đổi sau khi trả về | Bỏ trạng thái chờ | `sdMove(request)` sau khi dữ liệu đã đổi | `moved` (hoặc `resized`) |
| SC-10 | `void` / `undefined` | Như `true` | Như `true` | Như `true` | Như `true` |
| SC-11 | `false` | Giữ nguyên | Về chỗ cũ, trạng thái thất bại (viền lỗi) và thông báo có nút Bỏ qua | `sdMoveError({ request, reason: 'rejected' })` | `rejected` |
| SC-12 | `'cancel'` | Giữ nguyên | Về chỗ cũ, **không** trạng thái thất bại, không thông báo | Không có | `cancelled` |
| SC-13 | throw / reject | Giữ nguyên | Như `false` | `sdMoveError({ request, reason: 'error', error })` | `error` |

Thêm:
- SC-14: Mỗi component chỉ có **một** thao tác chờ (tạo hoặc dời) tại một thời điểm. Thao tác thứ hai trong lúc chờ bị bỏ qua; `move()` trả `false`.
- SC-15: Request có `signal: AbortSignal`. Huỷ khi: nguồn dữ liệu đổi tham chiếu (`items`, `option`, `columns`, `resources`), khoảng xem đổi, `reload()`, `disabled` hoặc `readonly` bật, component bị huỷ. Kết quả trả về sau khi huỷ bị bỏ, không ghi đè dữ liệu mới. Huỷ là hợp tác: không hoàn tác thao tác backend đã xong.
- SC-16: Không hiển thị nội dung exception ở bất kỳ đâu.
- SC-17: `move(...)` public trả `Promise<boolean>`: `true` chỉ khi chấp nhận. Bị khoá, không tìm thấy, cờ trả false, đang chờ, `false`, `'cancel'`, lỗi → `false`.
- SC-18: Hoàn tác (pattern S1) là việc của consumer: sau `sdMove`, toast có nút Hoàn tác gọi `move(id, <vị trí cũ>, 'api')`. `'api'` không hỏi phạm vi lặp.

## 4. `onCreate` (calendar, scheduler)

| Mã | Kết quả | Xử lý |
| --- | --- | --- |
| SC-19 | Item | Chèn vào dữ liệu, chọn item mới (đặt `selectedId`, không phát `sdSelect`). |
| SC-20 | `void` | Huỷ: khối nét đứt biến mất, không thông báo. |
| SC-21 | throw / reject | Khối nét đứt biến mất, thông báo `create-error`. |

## 5. Nguồn dữ liệu

| Mã | Quy tắc |
| --- | --- |
| SC-22 | `option.dataSource.onLoad(args)` nhận `args.signal`, trả mảng/kết quả hoặc `Promise`. Component tự quản lý đang tải, lỗi, kết quả muộn. Không có input `loading`, `error`. |
| SC-23 | `reload()` huỷ lần tải đang chạy, gọi lại; giữ dữ liệu cũ trên màn hình tới khi có kết quả. |
| SC-24 | Lỗi tải: thông báo lỗi có nút Thử lại (gọi lại đúng lần tải đó) và output `sdLoadError`. Không phát `sdLoadError` khi lần tải bị huỷ. |
| SC-25 | Kanban, timeline có thêm `items` cho dữ liệu có sẵn. Có cả `items` và `dataSource` thì dùng `dataSource`, cảnh báo một lần ở dev mode. |

## 6. Chọn

| Mã | Quy tắc |
| --- | --- |
| SC-26 | `selectedId = model<string \| null>(null)` và output `sdSelect(item)`. Bấm (pointer di chuyển < 5px), chạm, Enter, Space. Esc bỏ chọn. |
| SC-27 | id đang chọn không còn trong dữ liệu thì `selectedId` về `null`. |
| SC-28 | `readonly` vẫn chọn được; `disabled` thì không. |

## 7. Focus sau thao tác

| Mã | Quy tắc |
| --- | --- |
| SC-29 | Thao tác bắt đầu từ bàn phím hoặc menu: khi xong (chấp nhận, từ chối, `'cancel'`, huỷ phạm vi), focus về item đó, kể cả khi item đã sang khoảng hoặc cột khác. |
| SC-30 | Trong lúc chờ, người dùng chủ động focus chỗ khác thì giữ nguyên chỗ đó. |
| SC-31 | `move()` với `source: 'api'` không lấy focus từ chỗ khác. Focus đang ở chính item khi thao tác bắt đầu (mọi `source`) thì đi theo item, kể cả khi item sang ngày, hàng hoặc cột khác, như kanban (RX #6, PD 2026-11-11). Calendar, scheduler: đổi giờ kết thúc (mép, `Alt` + `Shift` + mũi tên) có `source: 'resize'` (RX #2, PD 2026-11-11). |

## 8. Bố cục, trợ năng, i18n, E2E

| Mã | Quy tắc |
| --- | --- |
| SC-32 | Giao diện hẹp theo **bề rộng host** < 600px, đo bằng `ResizeObserver`; kiểm tra `typeof ResizeObserver` để chạy được SSR và test. Không dùng media query viewport cho ngưỡng này. |
| SC-33 | Một live region `role="status" aria-live="polite" aria-atomic="true"` mỗi instance. |
| SC-34 | `prefers-reduced-motion: reduce`: không transition, icon đang lưu đứng yên. |
| SC-35 | `forced-colors: active`: viền `CanvasText` cho khung, `Highlight` cho chọn và đang chờ. |
| SC-36 | Hover chỉ là lớp bổ sung (`@media (hover: hover)`); mọi hành động làm được bằng bàn phím và `pointer: coarse`. Vùng chạm tối thiểu 40px (kanban) / 44px (calendar, scheduler) như spec riêng. |
| SC-37 | i18n `core.component.<name>.*`, đủ vi/en/ja/ko/zh. Dùng lại key chung (Huỷ, Thử lại, Bỏ qua) nếu đã có. |
| SC-38 | `data-autoid="components-<name>-{autoId}"` trên gốc; phần tử con `…-<kind>-{encodeURIComponent(id)}`. Chỉ phát khi có `autoId`. |
| SC-39 | `disabled`, `readonly` dùng `booleanAttribute`; `ariaLabel`, `autoId` kiểu `string \| null \| undefined`. |

## 9. Mã nguồn

| Mã | Quy tắc |
| --- | --- |
| SC-40 | Standalone, `ChangeDetectionStrategy.OnPush`, signal `input()`/`model()`/`output()`, `@if`/`@for` với `track` theo id. |
| SC-41 | Ngày giờ chỉ qua `SdDateTimeService`. Không `new Date(string)`, không getter local trên giá trị model, không cộng 24 giờ để sang ngày. |
| SC-42 | Không thêm dependency. Kéo thả bằng `@angular/cdk/drag-drop`. |
| SC-43 | Màu chỉ bằng token `--sd-*`; không hex mới (`check:scss-hex`). Token của component (`--sd-calendar-*`, `--sd-scheduler-*`, `--sd-kanban-*`) phải có fallback; token lõi (`--sd-*` của theme, kể cả `--sd-shadow-*`) không cần, theo quy ước trên main; fallback đang có thì giữ (RX #8, PD 2026-11-11). Không `!important`, không `::ng-deep`. |
| SC-44 | Không render phần tử cho từng slot thời gian; vạch lưới vẽ bằng gradient. |
| SC-45 | Comment `why:` cho quyết định không hiển nhiên, như code hiện có. |
