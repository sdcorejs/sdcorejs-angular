# Handoff: SD Core UI · Đợt 3 (sd-badge, sd-avatar, sd-tab-router, sd-upload-file)

## Overview
Đợt 3 gồm bốn component, làm theo thứ tự vì có phụ thuộc:
1. **sd-badge** (`badge.md`): thang kích thước mới, ba type mới (solid, dot, pair), component mới `sd-badge-picker`.
2. **sd-avatar** (`avatar.md`): chấm trạng thái dùng `sd-badge type="dot"`, component mới `sd-avatar-group`. Cần bước 1.
3. **sd-tab-router** (`tab-router.md`): thanh tab mới, cuộn khi tràn, bàn phím, menu chuột phải, chấm chưa lưu, đồng bộ tiêu đề trình duyệt. Bỏ phụ thuộc vào sd-badge.
4. **sd-upload-file** (`upload-file.md`): ô tải lên và popup preview (phương án A). Không phụ thuộc ba component trên.

Điều kiện trước: đợt 1 và đợt 2 đã merge, tức là đã có `--sd-control-height-*`, token control/panel (`--sd-control-*`, `panel-radius`) và vòng focus chuẩn. Nếu chưa có thì dừng và báo.

## Các file trong gói
| File | Nội dung |
|---|---|
| `README.md` | Tổng quan, thứ tự, quy tắc chung. |
| `badge.md`, `avatar.md`, `tab-router.md`, `upload-file.md` | Thông số đầy đủ của từng component. Đây là nguồn chính. |
| `Badge Review.dc.html` | Minh hoạ sd-badge: hiện trạng, đề xuất, bảng type, demo sd-badge-picker bấm được. |
| `Avatar Review.dc.html` | Minh hoạ chấm trạng thái và sd-avatar-group (demo bấm được). |
| `Tab Router Review.dc.html` | Minh hoạ thanh tab (rê chuột vào tab), tràn tab, bàn phím, kéo thả, menu, tiêu đề trình duyệt. |
| `Upload File Spec.dc.html` | Minh hoạ ô tải lên và popup preview. |
| `support.js` | Runtime cho các file `.dc.html`, phải nằm cùng thư mục. |

## About the Design Files
Các file `.dc.html` là **bản tham chiếu thiết kế viết bằng HTML**, không phải mã production để copy. Mở bằng trình duyệt. Prop `showCurrent` ẩn/hiện phần "Hiện trạng", `showAnnotations` ẩn/hiện badge đánh số.

Dựng lại bằng template Angular và SCSS hiện có: standalone component, signal input/model, token `--sd-*`, theo đúng `CLAUDE.md`. Không copy markup hay inline style.

## Fidelity
**High-fidelity** về bố cục, kích thước, khoảng cách và hành vi. Hex trong HTML là giá trị đã giải của palette mặc định (`default.scss`). Map sang token có sẵn hoặc `color-mix()` từ token đó; không đưa hex vào SCSS (`check:scss-hex` phải xanh). Ảnh trong mockup là ô kẻ sọc giữ chỗ.

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi chạy `npm run sync` và `npm run check:sync`.
- Component token chỉ khai báo trong `_component-tokens.scss`, có bản dark nếu cần, có fallback khi tham chiếu. Cập nhật THEME.md.
- Viết spec RED trước khi sửa hành vi. Chạy full Karma tuần tự.
- Rà API consistency theo "Review bắt buộc" trong CLAUDE.md. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh. Dùng lại key có sẵn nếu đúng nghĩa.
- Hover chỉ là lớp hiển thị bổ sung. Mọi hành động phải dùng được bằng bàn phím và `pointer: coarse`. Transition và animation tắt khi `prefers-reduced-motion`.
- Cập nhật md của component đã đổi và mục `## [Unreleased]` trong `CHANGELOG.md` (Added / Changed / Fixed / Deprecated).

## Quyết định đã chốt (tóm tắt)
- Badge: thang 20/24/28px, chữ 12/13/14px, weight 500 cho round/tag/solid. Số đếm > 99 hiện "99+". Giữ 6 input boolean màu.
- Badge: thêm type `solid`, `dot`, `pair`; thêm `sd-badge-picker` chọn type + màu + icon, `sdChange` chỉ phát khi đóng panel.
- Avatar: phương án A (input `status`, `statusLabel`, `statusPulse` trên sd-avatar). Thêm `sd-avatar-group`.
- Tab router: menu chuột phải chỉ có "Đóng tab" và "Đóng các tab khác". Có chấm chưa lưu (`SdTabInfo.dirty`). Thanh tab ẩn khi ≤ 1 tab (mặc định, không input). Đồng bộ tiêu đề trình duyệt qua input `syncBrowserTitle`, mặc định tắt. Chiều cao outlet giữ 100vh và thêm 100dvh cho mobile; consumer có header thì tự đặt bằng inline style.
- Upload file: popup dùng phương án A; field có variant `default` và `inline`.
