# Handoff: sd-operator · dropdown và icon (bổ sung đợt 2, mục G)

## Overview
Bổ sung cho mục G (operator trong control) của đợt 2, làm cùng nhánh đang dở. Gồm:
1. A11y: trigger có tên, badge chỉ-xem không mất tooltip, hàng đang chọn có tick và `aria-checked`, vùng bấm ≥ 24px trong query-bar (A1–A4).
2. Dropdown: hàng một dòng 36px, ẩn mã API (`showCode` để bật), divider giữa các họ operator, trigger thành chip có mũi tên dùng chung `ɵ` với G, thứ tự theo cấu hình cột, nhãn vi (B1–B6).
3. Icon: hình mới đã có trong `@sdcorejs/utils` 1.3.1 (C1–C6), repo này nâng dependency và làm stroke theo cỡ (C7).
4. API `size`, `readonly`, `active`, `showCode`; gỡ 4 đoạn `::ng-deep` ở query-bar; sửa tài liệu (D1–D2).

Hình icon đã phát hành trong `@sdcorejs/utils` 1.3.1, khớp `operator.md` mục 5. Repo này chỉ nâng `@sdcorejs/utils` từ 1.3.0 lên 1.3.1, không sửa hình.

## Các file trong gói
| File | Nội dung |
|---|---|
| `README.md` | Tổng quan, quy tắc chung. |
| `operator.md` | Thông số đầy đủ: API, trigger, menu, hình icon, i18n, column-filter, query-bar, spec, khác biệt với README đợt 2. Đây là nguồn chính. |
| `Operator Review.dc.html` | Minh hoạ: hiện trạng (01), bảng icon hiện tại/đề xuất ở 20·16·14px (02), vấn đề A1–D2 (03), bản dựng đề xuất bấm được và trạng thái trigger (04), API (05). |
| `support.js` | Runtime cho file `.dc.html`, phải nằm cùng thư mục. |
| `screenshots/` | Ảnh chụp 2x của trang minh hoạ (danh sách bên dưới). |

### Ảnh chụp
| File | Nội dung |
|---|---|
| `01-hien-trang.png` | Trigger + mat-menu hai dòng trong column-filter, trạng thái phễu, chip query-bar 14px. |
| `02-bo-icon.png` | Bảng 17 icon + phễu, hiện tại và đề xuất ở 3 cỡ, ghi chú từng hình. |
| `03-icon-chevron-quy-tac.png` | &gt; hiện tại đặt cạnh chevron_right; quy tắc vẽ. |
| `04` – `07-van-de-*.png` | Danh sách vấn đề nhóm A, B, C, D. |
| `08-de-xuat-md-so.png` | Đề xuất, md, cột số, menu mở. |
| `09-de-xuat-sm-chuoi-showCode.png` | Đề xuất, sm, cột chuỗi, `showCode` bật. |
| `10-trang-thai-trigger.png` | Chip mặc định, hover, focus-visible, active, mở, disabled, chưa chọn, readonly xs. |
| `11-api.png` | Bảng API và ví dụ. |

## About the Design Files
File `.dc.html` là **bản tham chiếu thiết kế viết bằng HTML**, không phải mã production. Mở bằng trình duyệt. Demo ở mục 04 bấm được: bấm chip mở menu, chọn hàng, Esc đóng; công tắc đổi cột (số/chuỗi), cỡ (sm/md), bật mã operator.

Dựng lại bằng template Angular và SCSS hiện có: standalone component, signal input/model, token `--sd-*`, theo `CLAUDE.md`. Không copy markup hay inline style.

## Fidelity
**High-fidelity** về hình icon (toạ độ SVG trong `operator.md` mục 5 là giá trị chính xác), kích thước chip, hàng menu và trạng thái. Hex trong HTML là giá trị đã giải của palette mặc định; map sang token ở `operator.md` mục 3.2. Không đưa hex vào SCSS (`check:scss-hex` phải xanh). Hình query-builder trong demo chỉ là ngữ cảnh, không đổi query-builder trong đợt này.

## Điểm cần duyệt trước khi code
- Trigger mặc định đổi từ màu primary sang xám; tint primary chỉ khi `active`.
- Mã operator ẩn mặc định (khác dòng "giữ dòng mã" ở README đợt 2).
- column-filter khi chưa có operator: phương án (a) hay (b) ở `operator.md` mục 7.

## Quan hệ với README đợt 2
Đọc `operator.md` mục 10. Những dòng ở đó thay cho dòng tương ứng trong README đợt 2 mục G; phần còn lại của G giữ nguyên.
