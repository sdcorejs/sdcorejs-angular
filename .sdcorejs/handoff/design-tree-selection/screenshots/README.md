# Ảnh chụp so với HTML mục 02–05

Chụp ngày 16/11/2026 trên showcase (`/v/latest/components/tree/examples`), Chrome, khung 1280px; mục 05 chụp thêm ở 360px. Mục 01 của `SD Tree Review.dc.html` là UI cũ nên không chụp lại. HTML chỉ có bản light, LTR; bản dark và RTL chỉ có ảnh triển khai. RTL đặt bằng `dir="rtl"` trên `<html>` sau khi trang tải.

| Mục | Thiết kế | Triển khai |
| --- | --- | --- |
| 02 Trạng thái gốc | `thiet-ke-02-goc.png` | `trien-khai-02-trang-thai-goc-khong-khop-{light,dark,rtl}.png` |
| 03 Chế độ điều hướng | `thiet-ke-03-moi.png` | `trien-khai-03-dieu-huong-nut-dang-mo-{light,dark,rtl}.png` |
| 04 Trạng thái hàng | `thiet-ke-04-hang.png` | `trien-khai-04-hang-tim-va-focus-{light,dark,rtl}.png` |
| 05 Thanh chọn nhiều | `thiet-ke-05-chon.png` | `trien-khai-05-thanh-chon-{1280px,360px}-{light,dark,rtl}.png` |

## Nhận xét

**02.** Chữ "không khớp" nằm giữa khối, màu muted, đúng thiết kế. Ví dụ tree-detail dùng `sdTreeEmptyDef` nên chữ là "Không có danh mục nào khớp …" thay cho chữ mặc định. Showcase không có ví dụ cho trạng thái lỗi gốc; phần này chỉ có unit test TR-11.

**03.** Nút đang mở có nền `--sd-tree-selected-bg`, ⋯ luôn hiện, số đếm canh phải, định dạng nghìn theo locale. Hai chỗ khác thiết kế, đều không thuộc thông số:
- Lá không có icon. Thiết kế vẽ icon tài liệu cho lá; cây giữ hành vi cũ: lá không có `treeItem.icon` thì không vẽ icon.
- Ô tìm của ví dụ là `<input>` thường, thiết kế dùng `sd-search-field sm`. Đây là phần consumer tự đặt.

**04.** Phần khớp tô bằng `--sd-warning-light` cho nền be nhạt, gần với `--sd-warning-container` của thiết kế (điểm cần chốt số 1). Nút cha chỉ nằm trên đường tới kết quả có màu muted. Hàng có focus có vòng focus và hiện ⋯.

**05.** Thanh có khung viền, ô icon primary, nút light cỡ sm, "Thêm ···" và × như thiết kế. Khác:
- Nút "Chuyển" màu xám: action này không khai `color` nên lấy mặc định `secondary` của `sd-button`. Thiết kế vẽ cả hai nút trực tiếp màu primary-light (điểm cần chốt số 2). "Lưu trữ" màu primary vì ví dụ khai `color: 'primary'`.
- Cột cây của showcase rộng khoảng 360px, nên ở khung 1280px thanh vẫn ở dạng hẹp: ngưỡng đo theo bề rộng của thanh (điểm cần chốt số 4). Thiết kế "cây rộng" là 640px, một hàng.
- Ở dạng hẹp, ba lệnh xếp thành hai hàng, "Thêm" giãn hết bề ngang, thanh cao khoảng 150px (R2 G4).

## Đã sửa nhờ ảnh chụp

- RTL: hàng con của cây không thụt lề vì padding đặt theo cạnh trái. Phần thụt lề, đường nối (`showLines`), số đếm và nút ⋯ chuyển sang cạnh logic.
- RTL: ở dạng hẹp, × của thanh chọn nằm ở góc đầu dòng, sát ô icon. × chuyển sang `inset-inline-end`, chỗ chừa cho × chuyển sang `padding-inline-end`.
- Dark: ô tìm và các nút của ví dụ sd-tree trên showcase ghi cứng màu hex (nền trắng trên trang tối). Các màu này đổi sang token, giữ hex cũ làm fallback.

Ảnh trong thư mục này chụp sau các sửa trên.
