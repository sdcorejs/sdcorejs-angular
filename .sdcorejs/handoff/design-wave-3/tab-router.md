# sd-tab-router

Tham chiếu: `Tab Router Review.dc.html` (mục 02–07). Phạm vi: `components/tab-router/**` (nav, item, outlet, service, model). Logic định tuyến, decorator `@SdTabComponent` và `beforeClose` giữ nguyên.

## Hiện trạng cần sửa
- Tab đang hover có nền trắng giống hệt tab đang mở. Tab chưa mở (#f2f3f4) đậm hơn nền thanh (#f9f9f9).
- Vạch ngăn 1×16px luôn hiện, kể cả sát tab đang mở hoặc đang hover.
- `.c-badge-title` bị ép `width: 184px` qua `::ng-deep`, nên tên bị cắt cụt không có ellipsis. Badge T14R (14px) đè cỡ 12px của item.
- Tab không khai icon vẫn hiện chấm `fiber_manual_record` của sd-badge. Tooltip luôn bật vì dùng `tooltip || name`.
- Nút đóng 16px, icon 12px, luôn hiện; màu hover `rgba(0,0,0,.12)` cứng.
- Nhiều tab: tab co lại tới vài px, không cuộn, không có menu.
- Compact mode nhắm vào `.tab-router__name` và `.tab-router__icon`, hai class không còn tồn tại.
- `[class.d-none]="tabs().length > 1"` ẩn thanh tab khi có **hơn** 1 tab; điều kiện bị ngược.
- Mỗi tab là 2 điểm dừng Tab. Không có role tablist/tab, không có `aria-selected`, không điều hướng bằng phím mũi tên.
- Kéo thả không có style riêng. `onDrop` sửa thẳng mảng của signal input.
- Code: fallback hex trong component token; class thừa `.flex-1`, `.tab-router__icon`, `.tab-router__name`; typo `#subsctiption`; outlet cố định `height: 100vh`; `.tab-router__empty` là div trống.

## Thanh tab
| Phần | Thông số |
|---|---|
| Thanh | Cao 40px, padding `0 8px`, nền surface-container (hiện ≈ #f0f1f5), tab căn đáy. |
| Tab · kích thước | `flex: 0 1 200px`, `min-width: 120px`, cao 34px, padding `0 6px 0 12px`, gap 8px, bo `8px 8px 0 0`. |
| Tab · chưa mở | Không nền, chữ `--sd-text-secondary`. |
| Tab · hover | Nền `--sd-text` 6% (≈ #e4e6ec), cùng hình dạng với tab đang mở, không bao giờ trắng. |
| Tab · đang mở | Nền `--sd-surface` liền khối với nội dung, chữ `--sd-text` weight 500. |
| Nội dung tab | Icon 16px màu theo `SdTabInfo.color` (bảng màu của badge) + tên 13px/18px, `min-width: 0`, ellipsis. Không dùng sd-badge. Không có icon thì không hiện gì. |
| Nút đóng | 20×20px, bo 6px, icon 14px. Luôn hiện ở tab đang mở; tab khác chỉ hiện khi hover hoặc focus. `pointer: coarse` luôn hiện, vùng chạm 32px. Hover nền `--sd-text` 8%. |
| Vạch ngăn | 1×16px, màu `--sd-tab-router-item-divider`. Ẩn ở hai bên tab đang mở và tab đang hover. |
| Focus | Vòng 2px primary, `outline-offset: -2px` (vẽ vào trong tab). |
| Tooltip | Chỉ hiện khi tên bị cắt, hoặc khi builder khai `tooltip`. |

Token: giữ tên `--sd-tab-router-nav-bg`, `-item-active-bg`, `-item-divider`, `-item-text` và đổi giá trị sang semantic token. `-item-muted-bg` không còn dùng; giữ alias một bản phát hành rồi mới xoá (Deprecated).

## Chấm "chưa lưu"
- Thêm `SdTabInfo.dirty?: boolean`, đẩy qua `tabInfoChanges`.
- Chấm 8px màu `--sd-text-secondary` nằm ở vị trí nút đóng; khi hover hoặc focus tab thì chấm đổi thành nút đóng.
- Tab đang mở mà dirty thì hiện chấm cho đến khi hover.
- Màn đã có `beforeClose` nên dùng cùng một nguồn trạng thái với `dirty`.

## Khi có nhiều tab
- Khi tổng `min-width` vượt quá chiều rộng thanh, thanh cuộn ngang. Bỏ compact mode, `mode` và `checkUI`.
- Lăn chuột dọc trên thanh cũng cuộn ngang. Khi đổi tab, cuộn bằng `scrollLeft` để tab đang mở hiện trọn.
- Lớp mờ 32px (gradient từ màu nền thanh) chỉ hiện ở cạnh còn nội dung bị khuất.
- **Nút danh sách tab:** chỉ hiện khi thanh bị tràn, cố định ở cuối thanh, ngăn với phần tab bằng vạch 1px. Cao 30px, bo 8px, hiện số tab (tabular-nums) và icon `expand_more`.
- **Menu danh sách:** rộng 320px, bo theo panel token, padding 6px. Tiêu đề "{n} tab đang mở". Mỗi mục cao 36px gồm icon, tên ellipsis và nút đóng hiện khi hover. Mục đang mở có nền primary 8% và chữ weight 500. Cuộn khi cao hơn 300px.

## Bàn phím, kéo thả, menu chuột phải
- Thanh có `role="tablist"`; mỗi tab có `role="tab"`, `aria-selected` và `aria-controls` trỏ tới pane.
- **Roving tabindex:** cả thanh chỉ có một điểm dừng Tab. ←/→ chuyển focus, Home/End về đầu/cuối, Enter/Space mở, Delete đóng. Nút đóng có `tabindex="-1"`.
- **Đóng tab đang mở:** focus và trạng thái mở chuyển sang tab bên phải; nếu không có thì sang bên trái. Đóng bằng nút chuột giữa vẫn giữ như cũ.
- **Kéo thả:** giữ khoá trục X.
  - Tab đang kéo nổi lên với bóng, bo đủ 4 góc 8px.
  - Chỗ thả là ô nền primary 12% có viền primary mảnh.
  - `onDrop` phát ra mảng mới thay vì sửa thẳng mảng của input.
- **Menu chuột phải:** chỉ có hai mục, "Đóng tab" và "Đóng các tab khác".
  - Mở bằng chuột phải, hoặc Shift+F10 / phím Menu trên tab đang focus.
  - Thêm `closeOthers(tab)` vào `SdTabRouterService`. Lệnh này vẫn chạy `beforeClose` của từng tab; tab nào trả về false thì được giữ lại.
  - Menu dùng panel token, mỗi mục cao 34px, có icon `close` ở mục "Đóng tab".

## Một tab và tiêu đề trình duyệt
- **Ẩn thanh khi ≤ 1 tab.** Đây là hành vi mặc định, không có input. Sửa điều kiện thành `tabs().length <= 1`.
  - Khi tab thứ hai mở, thanh hiện ra với chiều cao chạy từ 0 lên 40px trong 150ms (tắt khi reduced-motion).
  - Khi thanh ẩn, tab duy nhất không đóng được bằng giao diện; điều này chấp nhận được.
- **Đồng bộ tiêu đề trình duyệt:** input boolean `syncBrowserTitle` trên outlet, mặc định `false`.
  - Định dạng `{tên tab} – {tên app}`. Tên app là `document.title` tại thời điểm outlet khởi tạo.
  - Cập nhật khi đổi tab và khi `tabInfoChanges` đổi tên tab. Tab dirty thì thêm "● " vào đầu tiêu đề.
  - Dùng service `Title` của Angular. Khi outlet bị huỷ hoặc `disabled` thì trả lại tiêu đề cũ.

## Dọn dẹp
Sửa typo `#subsctiption`. Xoá class thừa.

**Chiều cao outlet:** giữ `:host { height: 100vh }`, thêm dòng `height: 100dvh` ngay sau đó:
```scss
:host {
  height: 100vh;  // fallback cho trình duyệt chưa hỗ trợ dvh
  height: 100dvh; // trên mobile, trừ phần thanh địa chỉ đang hiện
}
```
- `dvh` là chiều cao viewport động: tự trừ phần thanh địa chỉ của trình duyệt mobile, không cần JS. Hỗ trợ từ Chrome 108, Safari 15.4, Firefox 101; trình duyệt cũ hơn dùng dòng 100vh phía trên.
- Không thêm token. Khi có header phía trên, consumer tự đặt chiều cao bằng style trên thẻ, ví dụ `<sd-tab-router-outlet style="height: calc(100dvh - 56px)">`. Inline style thắng rule `:host` của component, nên cách này đã chạy được.
- Ghi ví dụ này trong sd-tab-router.md.

## CHANGELOG
- **Added:** `syncBrowserTitle`, `SdTabInfo.dirty`, `closeOthers`, menu chuột phải, nút danh sách tab, bàn phím tablist.
- **Changed:** giao diện thanh tab, cuộn thay cho compact, tab không dùng sd-badge.
- **Fixed:** điều kiện ẩn thanh tab, tên bị cắt cụt.
- **Deprecated:** `--sd-tab-router-item-muted-bg`.
- **Changed:** outlet dùng `100dvh` (fallback 100vh), nên chiều cao trên mobile đúng hơn.
