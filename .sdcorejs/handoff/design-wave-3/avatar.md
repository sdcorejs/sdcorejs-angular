# sd-avatar · trạng thái và nhóm

Tham chiếu: `Avatar Review.dc.html`. Phạm vi: `components/avatar/**` (thêm `sd-avatar-group`). Cần sd-badge `type="dot"` và `pulse` (badge.md) đã xong.

Cách hiển thị avatar hiện tại giữ nguyên: nền `color-mix(palette 14%, tint)`, chữ `color-mix(palette 45%, ink)`, weight 600, cỡ chữ `size / 2.5`, màu theo hash tên, bảng `--sd-avatar-color-*`.

## Chấm trạng thái (phương án A)
### Input mới trên sd-avatar
| Input | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `status` | `Color \| null` | `null` | Màu chấm. Không có thì không hiện chấm. |
| `statusLabel` | `string` | — | Chữ mô tả trạng thái, ví dụ "Đang hoạt động". Dùng làm tooltip của chấm và nối vào `aria-label`. Bắt buộc khi có `status`; thiếu thì `console.warn` ở chế độ dev. |
| `statusPulse` | `boolean` | `false` | Vòng sáng nhấp nháy (truyền `pulse` xuống badge). |
| `name` | `string` | — | Tuỳ chọn. Tên dùng cho `aria-label` và tooltip khi `src` là URL ảnh. Khi `src` là tên thì dùng luôn `src`. |

### Hình học
- Đường kính chấm: `clamp(8px, size × 0.25, 20px)`.
- Viền: 2px khi `size` < 64, 3px khi `size` ≥ 64. Màu viền `--sd-avatar-status-ring` (component token mới, mặc định `var(--sd-surface)`). Nơi có nền khác (header tối, hàng đang chọn) thì đặt lại token này.
- Vị trí: `right = bottom = size × 0.146 − (chấm + 2 × viền) / 2`, để tâm chấm nằm trên mép avatar ở góc 45°.

| size | chấm | viền |
|---|---|---|
| 24 | 8 | 2 |
| 32 | 8 | 2 |
| 40 | 10 | 2 |
| 64 | 16 | 3 |
| 96 | 20 | 3 |

### Cấu trúc
- `.sd-avatar` đang có `overflow: hidden`, nên chấm phải là phần tử anh em của `.sd-avatar`, không nằm bên trong.
- Host đổi thành `display: inline-flex; position: relative`. Đây là **Changed**; kiểm tra các nơi đang dùng sd-avatar inline với chữ.
- Chấm được render bằng `<sd-badge type="dot">`, nhận màu, `title = statusLabel` và `pulse`.

### A11y
- Host có `role="img"` và `aria-label` = tên, nối thêm ", {statusLabel}" nếu có trạng thái.
- `<img>` bên trong có `alt=""` để không đọc lặp, thay cho `alt="avatar"` hiện tại.
- Chấm không nhận focus.

## sd-avatar-group (component mới)
### API
| Input / output | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `items` | `SdAvatarGroupItem[]` | `[]` | `{ src, name?, status?, statusLabel?, statusPulse? }` |
| `max` | `number` | `4` | Số avatar hiện. Nếu chỉ dư đúng 1 người thì hiện luôn người đó, không có ô "+1". |
| `size` | `number` | `32` | Truyền xuống từng avatar. |
| `ariaLabel` | `string` | i18n "{n} người" | Tên của nhóm. |
| `(moreClick)` | `SdAvatarGroupItem[]` | | Phát khi bấm "+N", kèm danh sách người bị ẩn. Nếu output này được lắng nghe thì không mở popover mặc định. |

### Bố cục
- Mỗi avatar lấn sang avatar trước `round(size × 0.15)` (5px khi cỡ 32). Mức nhỏ này để không che chữ viết tắt của avatar phía sau.
- Mỗi avatar có vòng `0 0 0 2px` màu `--sd-avatar-status-ring` (3px khi size ≥ 64).
- Avatar bên trái nằm trên (z-index giảm dần sang phải), nên chấm ở góc dưới phải không bị avatar kế tiếp che.
- **Ô "+N":** là `<button>` cùng cỡ với avatar, nền `--sd-surface-muted`, chữ `--sd-text-secondary` weight 600 cỡ `size / 2.5`, nằm dưới cùng. Hover nền đậm hơn một bậc; khi popover mở thì có vòng focus primary.
- **Popover:** rộng 280px, bo theo panel token, padding 6px.
  - Tiêu đề "{N} người khác" (12px, weight 500, text-secondary).
  - Mỗi dòng cao 44px: avatar 28px (có chấm), tên 13px/18px ellipsis, trạng thái 12px text-secondary (hiện statusLabel; không có thì để trống).
  - Cuộn khi cao hơn 320px.
- **Tooltip:** rê chuột vào từng avatar hiện "{tên} · {statusLabel}".

### A11y
- Nhóm có `role="group"` và `aria-label`.
- Ô "+N" có `aria-label` "Xem thêm {N} người" và `aria-expanded`.
- Popover nhận focus vào dòng đầu khi mở; Esc đóng và trả focus về ô "+N".

## CHANGELOG
- **Added:** `status`, `statusLabel`, `statusPulse`, `name` trên sd-avatar; `sd-avatar-group`; token `--sd-avatar-status-ring`.
- **Changed:** host sd-avatar đổi sang `inline-flex` + `relative`; `alt` của ảnh đổi thành rỗng khi host đã có `aria-label`.
