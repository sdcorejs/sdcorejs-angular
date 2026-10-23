# Handoff: sd-icon · sd-icon-picker · sd-chip · sd-table

## Overview
Ba nhóm việc độc lập, gộp từ ba bản review ngày 22/10/2026 trên `main @ 769f9ca` (`versions/v19`):
- **IC** · sd-icon và component mới sd-icon-picker: 8 điểm sửa (I1–I8), danh mục icon sinh lúc build, picker hai model `[(model)]` + `[(fontSet)]`.
- **CH** · sd-chip: 23 vấn đề (A lỗi hành vi và a11y, B trải nghiệm nhập, C hình ảnh, D code/docs/test), áp lại bản sửa đã có ở sd-chip-calendar.
- **TB** · sd-table: header nhóm và kéo thả sắp xếp cột (H1–H8), loading (L1–L8).

Tổng 10 PR. Thứ tự và phụ thuộc ở mục 01 của trang HTML.

## Các file trong gói
| File | Nội dung |
|---|---|
| `README.md` | Tổng quan, quy tắc, quyết định đã chốt. |
| `PROMPT.md` | Prompt cho Claude Code: thứ tự làm, kế hoạch phải trình, kiểm tra. |
| `icon-picker.md` | **Nguồn chính nhóm IC**: I1–I8, danh mục, API sd-icon-picker, quy tắc giá trị, xếp hạng tìm kiếm, bàn phím, a11y, i18n, spec, lộ trình. |
| `chip.md` | **Nguồn chính nhóm CH**: A1–D4, input mới và input đổi hành vi, thang chip, i18n, spec RED, lộ trình. |
| `table.md` | **Nguồn chính nhóm TB**: H1–H8, thông số header nhóm, kéo thả (API, lưu im lặng, quy tắc), loading (L1–L8, đề xuất, cấu hình), token, i18n, spec, lộ trình. |
| `Icon Chip Table Review.dc.html` | Trang tổng hợp: tổng quan (10 PR, điểm chạm, 14 quyết định, chỗ cần kiểm), rồi 12 bảng review gốc, trong đó 5 bản bấm thử được (1.02, 2.03, 3.02, 3.03, 3.05). |
| `support.js` | Runtime cho file `.dc.html`, phải nằm cùng thư mục. Mở HTML bằng trình duyệt. |

## About the Design Files
File `.dc.html` là **bản tham chiếu thiết kế viết bằng HTML**, thể hiện giao diện và hành vi mong muốn, không phải mã production. Dựng lại trong component Angular: standalone, signal `input()`/`output()`/`model()`, OnPush, `@if/@for` có `track`, SCSS với token `--sd-*`, theo `CLAUDE.md` của repo. Không copy markup, inline style hay logic demo.

Bản bấm thử 1.02 (sd-icon-picker) chạy trên danh mục rút gọn 414 icon vì file danh mục đầy đủ của bản review gốc không đi kèm. Số liệu trong `icon-picker.md` là của danh mục đầy đủ (2.122 tên, 2.101 hiện trong picker).

## Fidelity
**High-fidelity** về bố cục, kích thước, khoảng cách và hành vi. Hex trong HTML là giá trị đã giải của palette mặc định; map sang token theo các file md, không đưa hex vào SCSS (`check:scss-hex` phải xanh). Không thuộc thiết kế: thanh “Input của …” bên trái mỗi demo, khung nhật ký sự kiện (modelChange, Lưu & sự kiện, Trình đọc màn hình nghe), các bảng dựng lại hiện trạng (1.01 mục 02, 2.01, 3.01).

## Quy tắc repo bắt buộc
- Chỉ sửa `versions/v19/**`, rồi `npm run sync` và `npm run check:sync`. Không sửa tay v20/v21/v22, `published-docs`, `published-pages`, `dist`.
- Gói này đặt ở `.sdcorejs/handoff/design-icon-chip-table/`. Không tạo `design/`, `product/`, `docs/` ở root.
- Không thêm dependency runtime. Danh mục icon sinh lúc build từ bản chụp metadata đã commit, không gọi mạng khi chạy.
- Mỗi PR một nhóm mục như bảng lộ trình. Không gộp hai nhóm vào một PR.
- Token màu mới chỉ khai báo trong `_component-tokens.scss`, có giá trị dark và fallback. Cập nhật `THEME.md`.
- Viết spec RED trước. Chạy full Karma tuần tự với `--code-coverage`.
- Rà API consistency theo “Review bắt buộc” trong `CLAUDE.md` (sd-icon-picker so với sd-badge-picker, sd-select; sd-chip so với sd-chip-calendar, sd-date, sd-select; option mới của sd-table so với `config.resizable`); ghi kết quả vào PR description.
- i18n đủ 5 locale vi/en/ja/ko/zh.
- Cập nhật docs của component (`sd-icon.md`, `sd-icon-picker.md` mới, `sd-chip.md`, `sd-table.md`), `THEME.md`, `CHANGELOG.md` mục `## [Unreleased]`, showcase.

## Quyết định đã chốt (22/10/2026)
sd-icon-picker
- Ghi ngay khi chọn, Esc đóng không đổi gì; không nút Xong.
- Đặt ở `@sdcorejs/angular/components/icon-picker`; autoId `components-icon-picker-<id>`.
- Đợt đầu chỉ Material (Outlined, Filled). Gặp `fontSet="lucide"` thì cảnh báo ở dev mode.
- Tìm theo tên và từ khoá tiếng Anh của Google, không dịch. App thêm thuật ngữ qua `[keywords]`.
- `[(fontSet)]` hai chiều, form lưu `{ icon, fontSet }`; ẩn 21 tên `_outline`/`_border`.

sd-chip
- `addOnBlur` mặc định true (thay đổi hành vi, ghi CHANGELOG).
- Xoá `onSelect` và autocomplete ở CH3 (breaking).
- So trùng phân biệt hoa thường; ví dụ email dùng `chipTransform`.
- Chỉ tách mixin SCSS `sd-chip-row()`; directive `sdChipRow` để sau.

sd-table
- `config.reorderable` mặc định false.
- Cột con chỉ đổi chỗ trong nhóm.
- `style.groupDivider` mặc định `'header'`.
- Kéo không ghim, không bỏ ghim.
- Cầm cả ô tiêu đề, kéo quá 4px; bấm tại chỗ vẫn là sort. Bàn phím Ctrl+Shift+← →.

## Cần kiểm khi đọc code
- Hành vi phím của `mat-chip-row` (A1, A7) suy ra từ mã nguồn Angular Material, chưa chạy trên showcase.
- Header nhóm sd-table dựng lại theo source, chưa đối chiếu ảnh chụp showcase.
- `@lucide/angular` có cho đọc danh sách icon đã đăng ký không (I5).
- Mọi chỗ gọi `match_case` (I1); app nào còn dùng `.material-symbols-outlined` (I6).
