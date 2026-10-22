# Handoff: sd-chip-calendar · sửa lỗi và giao diện mới

## Overview
Một component, `sd-chip-calendar` (`forms/chip-calendar`), cùng wrapper trong form-render. Gồm:
1. Sửa lỗi hành vi và a11y (A1–A6): predicate `removable` bị bỏ qua, giá trị kiểu số, Tab đóng popup, lỗi không có thông báo, vượt `maxCount`, nút ✕ không có tên.
2. Giao diện và UX mới: icon lịch + nút bỏ hết ở suffix, chip theo thang 20/24/28 và xếp theo ngày, gộp “+N”, popup mới có đếm số ngày, chặn khi đủ, “Xoá hết”/“Xong”, giới hạn ngày (`minDate`, `maxDate`, `dateFilter`), mở đúng tháng.
3. Dọn code thừa và sửa tài liệu.

Điều kiện trước: đợt 1 và đợt 2 đã merge (`--sd-control-height-*`, token control/panel, vòng focus chuẩn). Nếu chưa có thì dừng và báo.

## Các file trong gói
| File | Nội dung |
|---|---|
| `README.md` | Tổng quan, quy tắc chung. |
| `chip-calendar.md` | Thông số đầy đủ: API, kích thước, trạng thái, hành vi, a11y, i18n, spec cần viết. Đây là nguồn chính. |
| `Chip Calendar Review.dc.html` | Minh hoạ: hiện trạng (01), danh sách vấn đề A1–D2 (02), bản dựng đề xuất bấm được (03), API (04). |
| `support.js` | Runtime cho file `.dc.html`, phải nằm cùng thư mục. |
| `screenshots/` | Ảnh chụp 2x của trang minh hoạ, dùng khi không mở được HTML (danh sách bên dưới). |

### Ảnh chụp
| File | Nội dung |
|---|---|
| `01-hien-trang.png` | Field và popup hiện tại (mat-chip mặc định, mat-menu 280px). |
| `02` – `05-van-de-*.png` | Danh sách vấn đề nhóm A, B, C, D. |
| `06-de-xuat-md-popup-mo.png` | Đề xuất, md, popup mở: chip xếp theo ngày, chip khoá, đủ các trạng thái ô. |
| `07-de-xuat-md-dong-gop-N.png` | Popup đóng, `maxVisible=2` gộp “+3”. |
| `08-de-xuat-du-maxCount.png` | Đủ `maxCount=5`: ô chưa chọn bị vô hiệu, dòng báo đủ. |
| `09-de-xuat-sm.png`, `10-de-xuat-lg.png` | Cỡ sm và lg. |
| `11-api.png` | Bảng API. |

Trong ảnh, nút bỏ hết hiện sẵn vì field đang mở; trên thực tế nút này hover-gated như sd-date.

## About the Design Files
File `.dc.html` là **bản tham chiếu thiết kế viết bằng HTML**, không phải mã production để copy. Mở bằng trình duyệt. Demo ở mục 03 bấm được: field, chip, “+N”, ô ngày, chuyển tháng, “Xoá hết”, “Xong”; công tắc bên trái đổi `size`, `maxCount`, `dateFilter`, `minDate` + `removable`, `maxVisible`.

Dựng lại bằng template Angular và SCSS hiện có: standalone component, signal input/model, token `--sd-*`, theo đúng `CLAUDE.md`. Không copy markup hay inline style.

## Fidelity
**High-fidelity** về bố cục, kích thước, khoảng cách và hành vi. Hex trong HTML là giá trị đã giải của palette mặc định (`default.scss`). Map sang token có sẵn hoặc `color-mix()` từ token đó; không đưa hex vào SCSS (`check:scss-hex` phải xanh). Tooltip lý do trên từng ô ngày trong demo chỉ để minh hoạ, không bắt buộc.

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi chạy `npm run sync` và `npm run check:sync`.
- Component token chỉ khai báo trong `_component-tokens.scss`, có bản dark nếu cần, có fallback khi tham chiếu. Cập nhật THEME.md.
- Viết spec RED trước khi sửa hành vi (danh sách ở mục 8 của `chip-calendar.md`). Chạy full Karma tuần tự.
- Rà API consistency theo "Review bắt buộc" trong CLAUDE.md, đặc biệt tên `minDate`/`maxDate`/`dateFilter`/`minCount`/`maxCount` so với sd-date, sd-date-range, sd-chip. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh. Dùng lại key có sẵn nếu đúng nghĩa.
- Hover chỉ là lớp hiển thị bổ sung. Mọi hành động phải dùng được bằng bàn phím và `pointer: coarse`. Transition tắt khi `prefers-reduced-motion`.
- Cập nhật `sd-chip-calendar.md` và mục `## [Unreleased]` trong `CHANGELOG.md`.

## Quyết định đã chốt
- Giữ tên `dateFilter` (khớp `mat-calendar`, tránh nhầm với filter của sd-table).
- `min`/`max` đổi thành `minCount`/`maxCount`; tên cũ giữ làm alias deprecated. Lý do thêm: ở sd-date, `min`/`max` là ngày, nên giữ nghĩa số lượng ở đây sẽ ngược nhau.
- `minDate`/`maxDate` cùng kiểu với sd-date, nhận cả `'TODAY'`.
- `model` vẫn là `model()` signal. Đầu vào nhận `string | number | Date` cho từng phần tử, đọc bằng cùng hàm chuẩn hoá và time zone với sd-date. Đầu ra luôn `string[]` (`yyyy/MM/dd`, hoặc theo `transform` như sd-date). Model từ cha không bị ghi ngược. Chỉ phần hiển thị sắp xếp theo ngày, thứ tự model không đổi.
- `clearable` mặc định `false` và dùng chung `.sd-clear-btn` hover-gated như sd-date.
- Popup chuyển từ `mat-menu` sang CDK overlay `role="dialog"`; chọn ngày không đóng popup; đóng bằng “Xong”, Esc hoặc bấm ra ngoài.
- Ô đã chọn: nền primary đặc. Ô đã chọn nhưng không bỏ được: nền primary-light. Focus dùng vòng focus chuẩn, không dùng background.
- `maxVisible` mặc định `null` (hiện tất cả, giữ hành vi cũ); khuyến nghị `2` trong sd-table.
- Lỗi hiện khi `invalid && (touched || submitted)`, đóng popup thì đánh dấu touched.
