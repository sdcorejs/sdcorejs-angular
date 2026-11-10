# calendar · R1 · phản hồi của tác giả
Ngày: 2026-11-09 · Báo cáo gốc: `calendar-R1.md` (Chặn 0 · Nên sửa 8 · Ghi chú 13)

## SHA sau khi viết lại lịch sử (N4)
Nhánh chưa push. Commit handoff được tách lại cho đúng (chỉ còn `.sdcorejs/handoff/**`); các commit sau giữ nguyên tree.

| Cũ | Mới | Commit |
| --- | --- | --- |
| `7918a929` | `f3a259a1` | chore(handoff): gói handoff |
| `1c578914` | `a19f0515` | test(calendar): CP1 RED (giờ chứa toàn bộ khung + spec CP1) |
| `d31465eb` | `a0e56c2e` | feat(calendar): CP1 |
| `9c414456` | `d57f92a0` | test(calendar): CP2 RED |
| `55f33d2e` | `4b20dafb` | feat(calendar): CP2 |

## Xử lý từng mục

| # | Xử lý | Commit |
| --- | --- | --- |
| N1 | Giữ cho checkpoint 5 (giao diện hẹp): đo bề rộng host trước lần tải đầu, có test một lần `onLoad`/`sdRangeChange` khi host hẹp lúc khởi tạo. | CP5 |
| N2 | Ghi nhận. Từ CP3, spec RED truy cập phần tử qua `?.`/`expect(...).not.toBeNull()` trước khi thao tác để đỏ bằng assert, không bằng `TypeError`. | — |
| N3 | Ghi nhận (2 test thêm trong commit xanh CP2: `minDate`/`maxDate`, nhãn múi giờ). Từ CP3, test của checkpoint nằm trong commit RED. | — |
| N4 | Đã sửa bằng viết lại lịch sử chưa push (bảng trên). | `f3a259a1` |
| N5 | PD chốt (a): giữ các hook `data-*`, liệt kê đầy đủ trong `sd-calendar.md` mục E2E (CP6). Test mới ưu tiên role/`aria-label`. | CP6 |
| N6 | Đã thêm test: tiêu đề mọi chế độ (vi, en), mở Ngày từ số ngày và “+N”, giới hạn dòng Tháng có/không ngày lễ, thanh nối nhiều ngày, ngày Danh sách chỉ có ngày lễ, cảnh báo `step`. Nhánh `calendar.component.ts` 84.5% → 87.5%. | `c34838f3` |
| N7 | Đã thêm test abort `onLoad` khi `option` đổi và khi destroy. | `c34838f3` |
| N8 | Đã sửa: map token trong SCSS lưu `var(--sd-x, #hex)`; `check:scss-hex` 0 finding. | `f6b96dff` |
| G1 | PD chốt xoá sự kiện khi tải lỗi (§13). Test hồi quy `CAL-B-01`. | `b9071330` |
| G2 | Không cần lệch nữa: đọc wall clock bằng `SdDateTimeService.toFormat`, ghi bằng `parseFrom` (đúng SC-41), vẫn không qua carrier `Date` local nên an toàn với DST của zone trình duyệt. | `f6b96dff` |
| G3 | Giữ key `day-label-holiday` (§15 có đoạn “[, {holiday}]” trong nhãn ô Tháng); chờ PD phản đối nếu muốn gộp. | — |
| G4 | PD chốt giữ §6. `sd-calendar.md` và showcase: `?view=` theo `[(view)]`, `?date=` theo `[(date)]`; `sdRangeChange` chỉ để biết khoảng dữ liệu. | CP6 |
| G5 | PD chốt `data-autoid` chỉ ở đoạn đầu. Test hồi quy `CAL-B-02`. | `b9071330` |

Các mục Ghi chú khác của báo cáo được đối chiếu lại ở R2.
