> Gói này là một phần của `.sdcorejs/handoff/schedule-kanban/`. Đọc `../schedule-kanban/PROMPT.md` trước: file đó quy định nhánh, commit, push, test (`TESTING.md`), review độc lập (`REVIEW.md`) và hợp đồng chung (`SHARED-CONTRACT.md`), và ưu tiên hơn file này ở các điểm đó.

# Handoff: sd-calendar · đợt 1

## Overview
Component mới `sd-calendar` (`@sdcorejs/angular/components/calendar`): lịch có 4 chế độ xem (Tháng, Tuần, Ngày, Danh sách), cho tạo, dời, đổi giờ sự kiện bằng chuột, cảm ứng và bàn phím. Dùng cho lịch họp, lịch hẹn khách, nghỉ phép và chấm công của một người. Đây là đợt 1 trong lộ trình bộ component lịch (đợt sau: `sd-recurrence`, `sd-slot-picker`, `sd-scheduler`, `sd-timeline`, `sd-gantt`).

Option theo quy ước của `sd-file-explorer` và `sd-table`: nguồn dữ liệu (`dataSource.onLoad`) và từng năng lực (`create: { creatable, onCreate }`, `move: { movable, onMove }`) là một nhóm trong `option`; năng lực nào không khai báo thì giao diện tương ứng không có. Input ngày giờ theo `sd-date`, `sd-time`, `sd-time-range` và `SdDateTimeService`. **sd-kanban chưa được review, không dùng làm mẫu.** Bảng đối chiếu từng tên ở mục 2 của `calendar.md`.

Điều kiện trước: đợt 1 và đợt 2 (thang chiều cao, token control/panel, vòng focus chuẩn) đã merge. Nếu chưa, vẫn làm được nhưng giữ literal kèm fallback và báo lại.

## Các file trong gói
| File | Nội dung |
|---|---|
| `README.md` | Tổng quan, quy tắc, quyết định đã chốt. |
| `PROMPT.md` | Prompt cho Claude Code: thứ tự làm, kế hoạch phải trình, kiểm tra. |
| `calendar.md` | **Nguồn chính**: API, giá trị ngày giờ, kích thước, trạng thái, tương tác, bàn phím, mobile, token, i18n, E2E, spec, showcase. |
| `SD Calendar Design.dc.html` | Thiết kế tĩnh: giải phẫu (01), 4 chế độ (02), khối sự kiện (03), 6 tương tác (04), trạng thái (05), mobile (06), thông số (07). |
| `Schedule Components Proposal.dc.html` | Đề xuất cả bộ. Mục 04 là demo sd-calendar bấm thử được. Mục 06 là API rút gọn, đã khớp `calendar.md`. |
| `ADDENDUM-2026-11-08.md` | **Phụ lục 08/11**: đối chiếu với sd-card, sd-timeline, drawer không route, và các điểm pattern P2 cần. Đọc ngay sau `calendar.md`. |
| `support.js` | Runtime cho file `.dc.html`, phải nằm cùng thư mục. Mở HTML bằng trình duyệt. |

## About the Design Files
Hai file `.dc.html` là **bản tham chiếu thiết kế viết bằng HTML**: thể hiện giao diện và hành vi mong muốn, không phải mã production. Dựng lại bằng standalone component Angular, signal `input()`/`model()`/`output()`, template `@if/@for`, SCSS với token `--sd-*`, theo đúng `CLAUDE.md` của repo. Không copy markup, inline style hay logic của demo. Demo giữ dữ liệu trong component và tự thêm sự kiện khi tạo; component thật gọi `create.onCreate` và chỉ chèn sự kiện consumer trả về.

## Fidelity
**High-fidelity** về bố cục, kích thước, khoảng cách, màu và hành vi. Hex trong HTML là giá trị đã giải của palette mặc định (`default.scss`); map sang token theo mục 8.1 và 14 của `calendar.md`, không đưa hex vào SCSS (`check:scss-hex` phải xanh). Panel “Chi tiết” và “Output đã phát” trong demo là phần consumer, không thuộc component.

## Screens / Views
Chi tiết đủ ở `calendar.md` mục 7–13. Tóm tắt:

- **Tuần** (mặc định): thanh công cụ 56px (Hôm nay, ‹ ›, tiêu đề 18/24, nhóm chế độ); tiêu đề ngày 72px và hàng cả ngày dính đầu vùng cuộn; cột giờ 56px; 1 giờ = 48px; ngoài giờ làm việc tô `--sd-calendar-off-hours`; đường giờ hiện tại 2px `--sd-calendar-now`; sự kiện giao nhau chia cột, chừa 8px bên phải.
- **Ngày**: một cột, chừa 24px, không có hàng tiêu đề ngày.
- **Tháng**: ô ≥ 104px, tối đa 3 dòng rồi “+N khác”; thanh cả ngày nối liền; bấm ô mở Ngày; không kéo thả.
- **Danh sách**: `agendaDays` ngày, bỏ ngày trống, hàng 32px, có trạng thái trống.
- **Giao diện hẹp (< 600px bề rộng component)**: Tuần thành Ngày + dải 7 ngày 56px, 3 nút chế độ, vùng chạm 44px, Tháng chỉ có chấm màu.

Khối sự kiện: nền `--sd-{color}-light`, viền 28% màu, chấm 6px, chữ luôn `--sd-text`; nội dung theo chiều cao (≥ 62 / 34–61 / < 34px); 7 trạng thái (mặc định, hover, chọn, focus, kéo, đang lưu, đã qua) cộng trạng thái thất bại.

## Interactions & Behavior
- Có `option.create`: quét trên ô trống, bấm hoặc chạm để tạo một slot (`step` phút), Enter trên lưới. Gọi `onCreate`, giữ khối nét đứt tới khi consumer trả sự kiện (chèn) hoặc void (huỷ).
- Có `option.move`: kéo để dời (bước `min(step, 15)`), kéo mép dưới để đổi giờ kết thúc, `Alt` + mũi tên. CDK drag-drop, ngưỡng 5px, cảm ứng giữ 400ms. `movable` khoá từng sự kiện.
- Dữ liệu chỉ đổi khi `onMove` chấp nhận; từ chối hay lỗi → về chỗ cũ, viền lỗi, dải “Bỏ qua”, `sdMoveError`.
- Lần lặp (server hoặc consumer mở rộng sẵn, đánh dấu bằng `occurrence`): hỏi “Chỉ lần này / Lần này và các lần sau / Tất cả / Huỷ” trước khi gọi `onMove`; hai phạm vi sau tự `reload()`.
- Bàn phím: lưới một điểm Tab, mũi tên chọn slot, Enter tạo; trên sự kiện Enter chọn, `Alt` + mũi tên dời, `Alt + Shift` đổi giờ kết thúc; Tháng là grid roving như `mat-calendar`.
- Không có animation bắt buộc; mọi transition tắt khi `prefers-reduced-motion`.

## State Management
Trong component (signal): khoảng xem tính từ `view`/`date`/`firstDayOfWeek`/`hideWeekends`/`agendaDays`/`compact`; sự kiện đã tải và trạng thái tải (đang tải, lỗi, `AbortController` của lần tải); `selectedId` (model); thao tác quét, kéo, đổi giờ đang diễn ra; thao tác chờ (tạo hoặc dời) với `AbortController`; lỗi dời hoặc tạo; con trỏ lưới; `compact` từ `ResizeObserver`; mốc “bây giờ” cập nhật mỗi phút.

Dữ liệu: `dataSource.onLoad({ from, to, view, signal })` gọi khi khởi tạo, khi khoảng đổi và khi `reload()`. Client trả cả mảng, server gọi API theo khoảng.

## Design Tokens
- Palette có sẵn: `--sd-primary`, `--sd-{color}-light`, `--sd-primary-contrast`, `--sd-surface`, `--sd-surface-muted`, `--sd-surface-inverse`, `--sd-text`, `--sd-text-secondary`, `--sd-border`, `--sd-border-strong`, `--sd-error`, `--sd-status-error-bg/fg`, `--sd-focus-ring-*`, `--sd-shadow-*`.
- Token mới (`_component-tokens.scss`): `--sd-calendar-line`, `--sd-calendar-line-half`, `--sd-calendar-off-hours`, `--sd-calendar-now`, `--sd-calendar-today`. Biểu thức và giá trị đã giải ở mục 14 `calendar.md`.
- Biến kích thước trên host: `--sd-calendar-hour-height` 48px, `--sd-calendar-gutter-width` 56/48px, `--sd-calendar-event-radius` 6px.
- Bo góc: gốc 12px, nút 8px, khối 6px, dòng Tháng 4px, ô dải ngày 12px.
- Chữ: tiêu đề 18/24 500, khối 12/16 600, nhãn 11/14, Danh sách 14/500 và 13px.

## Assets
Không có ảnh. Icon Material Symbols qua `sd-icon`: `chevron_left`, `chevron_right`, `repeat`, `sync`, `error`, `event_available`. Font: kế thừa app.

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi `npm run sync` và `npm run check:sync`. Không sửa tay v20/v21/v22, `published-docs`, `published-pages`, `dist`.
- Không tạo `design/`, `product/`, `docs/` ở root; gói này đặt ở `.sdcorejs/handoff/design-calendar/`.
- Không thêm dependency runtime. Kéo thả dùng `@angular/cdk/drag-drop` có sẵn.
- Token màu chỉ khai báo trong `_component-tokens.scss`, có giá trị dark, có fallback khi tham chiếu. Cập nhật `THEME.md`.
- Viết spec RED trước (mục 18 `calendar.md`). Chạy full Karma với `--code-coverage`.
- Rà API consistency theo “Review bắt buộc” trong `CLAUDE.md`; dùng bảng mục 2 `calendar.md` làm điểm xuất phát, ghi kết quả vào PR description. Không đối chiếu với sd-kanban.
- i18n đủ 5 locale vi/en/ja/ko/zh.
- Cập nhật `sd-calendar.md` (mới), `THEME.md`, `CHANGELOG.md` mục `## [Unreleased]` (Added), `documentation.registry.ts` của showcase.

## Quyết định đã chốt
- Option theo nhóm năng lực như sd-file-explorer: `dataSource: { onLoad }`, `create: { creatable?, onCreate }`, `move: { movable?, onMove }`. Cờ năng lực kiểu `boolean | ((context) => boolean)`. Callback đặt tên `on<Action>`.
- Sự kiện là `SdCalendarEvent<T>` (`id: string`, `title`, `start`, `end`, `allDay`, `color`, `occurrence`, `data?: T`); consumer map DTO trong `onLoad`. Không có hàm ánh xạ `get*`.
- Component tự quản lý dữ liệu đã tải, đang tải và lỗi tải; không có input `model`, `loading`, `error`.
- Dữ liệu chỉ đổi sau khi `onMove` chấp nhận; một thao tác chờ mỗi lúc; huỷ khi khoảng xem đổi, `reload()`, option đổi.
- Component không mở rộng RRULE trong đợt 1; lần lặp do server hoặc consumer cung cấp, component hiển thị và hỏi phạm vi.
- `onLoad` và `sdRangeChange` dùng khoảng ngày gồm cả hai đầu, dạng `SdDateRangeValue`.
- Tên: `step`, `firstDayOfWeek`, `scrollTime`, `minDate`/`maxDate` (không alias), `holiday.type`, `SD_CALENDAR_CONFIGURATION`.
- Di chuyển sự kiện bằng phím cần `Alt`.
- Tháng không kéo thả; Danh sách chỉ thêm cột địa điểm khi component ≥ 720px. Có thể đổi ở đợt sau.
- Sự kiện có giờ qua nửa đêm hiển thị ở hàng cả ngày; kết thúc đúng 24:00 vẫn ở lưới.
- Ngưỡng giao diện hẹp đo theo bề rộng component, không theo viewport.
- `onMove` trả thêm `'cancel'` (người dùng huỷ trong luồng của consumer) và có output `sdLoadError`: phụ lục mục 6.
