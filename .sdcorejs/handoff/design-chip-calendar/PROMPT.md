Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/design-chip-calendar/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root vì CLAUDE.md cấm. Gói gồm:
- `README.md`: tổng quan, quy tắc chung, quyết định đã chốt.
- `chip-calendar.md`: thông số đầy đủ, là nguồn chính.
- `Chip Calendar Review.dc.html`: hiện trạng, danh sách vấn đề A1–D2, bản dựng đề xuất bấm được, API. Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục.
- `screenshots/`: ảnh chụp các phần và trạng thái chính của trang minh hoạ (danh sách trong README).

HTML chỉ là bản tham chiếu. Dựng lại bằng template Angular và SCSS hiện có cùng token `--sd-*`. Không copy markup hay inline style. Không thêm hex (`check:scss-hex` phải xanh).

Cần đợt 1 và đợt 2 đã merge (`--sd-control-height-*`, token control/panel, vòng focus chuẩn). Nếu chưa có thì dừng và báo.

## Trước khi code
Đọc hết README, `chip-calendar.md`, `sd-chip-calendar.md` hiện có, toàn bộ `forms/chip-calendar/**` (kể cả 2 file spec), wrapper trong form-render, và cách sd-date/sd-date-range đang dựng popup. Sau đó trình kế hoạch ngắn gồm:
- Danh sách file sẽ đổi và commit dự kiến.
- Bảng map hex trong spec sang token có sẵn hoặc component token mới (kèm giá trị light/dark).
- Cách dựng overlay: `cdkConnectedOverlay` hay `Overlay` service, cách gắn focus trap, cách trả focus về ô nhập, và có dùng lại được gì từ sd-date không.
- Cách làm `headerComponent` riêng cho `mat-calendar` (nút tháng trước/sau, nhãn mở multi-year view) và dùng lại `MatDatepickerIntl` ra sao.
- Chuẩn hoá model (mục 4.7): hàm nào của sd-date / `DateUtilities` / `SdDateTimeService` sẽ dùng lại cho từng phần tử, cách bỏ trùng, cách áp `transform`, và cách đảm bảo model từ cha không bị ghi ngược.
- Cách ghép `dateFilter` (mục 4.1) để ngày đã chọn trái filter vẫn bỏ được, ngày khoá không bấm được, và cách ép `mat-calendar` vẽ lại khi selection đổi.
- Cách ghi đè style ô ngày của Material trong `.sd-chip-calendar-panel` mà không `!important`.
- Cách đổi chiều cao chip/field theo 3 cỡ trong `mat-form-field` mà không còn `margin-top` bù.
- Ảnh hưởng tới consumer hiện có: placeholder mặc định đổi, `min`/`max` deprecated, lỗi không còn hiện khi chỉ `dirty`, `removable` nhận ngày đã chuẩn hoá.
- form-render: schema `validation` đã có `minItems` chưa.
- Danh sách i18n key mới và key dùng lại.

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi bước một commit (spec trước)
1. **Sửa lỗi và model (A1, A2, A4, A6)**
   - Predicate `removable` áp cho mọi đường bỏ ngày.
   - Model đọc `string | number | Date` giống sd-date, output `string[]`, input `transform` (mục 4.7).
   - Một điều kiện lỗi duy nhất, đóng popup thì touched.
   - `aria-label` cho chip và nút ✕.
2. **Popup mới (A3, A5, B4, B5, B6, C1)**
   - CDK overlay `role="dialog"`, header riêng, đầu/cuối popup, trạng thái ô ngày.
   - `minDate`, `maxDate`, `dateFilter`, `minCount`, `maxCount` (+ alias deprecated), `startAt`, `clearable`.
3. **Field mới (B1, B2, B3, C2, C3)**
   - Suffix (nút bỏ hết, nút lịch), thang 20/24/28 + `lg`.
   - Chip xếp theo ngày, chip khoá, `maxVisible` + “+N”, `displayFormat`, viewed.
4. **Dọn code, form-render, tài liệu (D1, D2)**

## Ràng buộc
- Không đổi hay rename public API, input/output, keyboard contract, trừ những gì `chip-calendar.md` liệt kê.
- Không đổi `DateAdapter` hay ngày đầu tuần trong đợt này.
- Giữ quy tắc model: luôn dựng mảng mới, không sửa mảng của consumer, `modelChange` và `sdChange` phát một lần mỗi thao tác.
- Giữ các cải thiện a11y đang có trong template (comment `why:`).
- Rà API consistency theo mục "Review bắt buộc" của CLAUDE.md. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh.
- Hover chỉ là lớp hiển thị bổ sung; mọi thứ vẫn dùng được bằng bàn phím và `pointer: coarse`. Transition tắt khi `prefers-reduced-motion`.

## Kiểm tra sau mỗi bước và trước khi xong
```
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm run lint
cd ../..
npm run test:theme
npm run check:scss-hex
npm run sync
npm run check:sync
```

Cuối cùng:
- Build lại lib v19, chạy `npm --prefix showcase run link:library`.
- Kiểm tra trên showcase:
  - 3 cỡ sm/md/lg, trống, 1 ngày, 20 ngày, có/không `maxVisible`.
  - `removable` dạng predicate (khoá ngày đã qua), `minDate="TODAY"`, `dateFilter` chặn cuối tuần, `maxCount` khi đủ.
  - Model là `Date[]`, `number[]`, ISO string, trộn lẫn; `transform="ISOString"`; có và không có `timeZone` cấu hình.
  - Ngày đã chọn ở tháng khác, `startAt`.
  - `required` + submit khi chưa chạm, `minCount` khi đang chọn dở, `hideInlineError`.
  - Trong sd-table (`size="sm"`, `hideInlineError`, `maxVisible="2"`), trong form-render, `labelPlacement="top"`, viewed, disabled, `sdViewDef`.
  - Chỉ dùng bàn phím: mở, Tab qua header/lưới/footer, chọn, bỏ, Esc, Backspace trên chip.
  - Screen reader (VoiceOver hoặc NVDA): tên chip, nút ✕, popup, thông báo đủ số lượng.
  - Chế độ: light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors.
  - Màn rộng, ≤ 600px, `pointer: coarse`.
- Cập nhật `sd-chip-calendar.md`, `THEME.md` (token mới) và mục `## [Unreleased]` trong `CHANGELOG.md`.

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã đổi
- spec đã thêm hoặc sửa
- kết quả các lệnh kiểm tra
- ảnh chụp showcase trước/sau
- điểm nào lệch khỏi thông số và lý do
