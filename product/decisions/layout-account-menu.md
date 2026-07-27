# Decisions - Layout account menu

| Ngày       | Quyết định                                               | Lý do                                                    | Ảnh hưởng                |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------- | ------------------------ |
| 2026-07-25 | Dùng đúng tên `updateProfile`, `setting`, `notification` | Giữ semantic API nhỏ và rõ                               | Angular public config    |
| 2026-07-25 | Role nằm trong `SdLayoutUserInfo`                        | Role là identity metadata, không phải generic action     | V1/V2/V3 presentation    |
| 2026-07-25 | Notification count nhận number, Signal, Observable       | Consumer tái sử dụng state source hiện có                | Reactive lifecycle/tests |
| 2026-07-25 | Mobile profile + signout cùng hàng, action khác ở dưới   | Tránh disclosure thừa và tránh co tên/email              | Mobile V1/V2/V3          |
| 2026-07-25 | Không thêm generic `userActions[]`                       | Tránh public contract phình ngoài ba nhu cầu đã xác nhận | API scope                |
| 2026-07-26 | V1 dùng shared `SdLayoutUserMenuComponent`               | Đồng nhất UI/i18n/a11y và giảm duplicate markup          | V1 wrappers              |
| 2026-07-26 | Thêm localized accessible name cho rail toggle           | Icon-only button cần tên cho assistive technology        | A11y, 5 locale           |
