# Date Panels · bằng chứng nghiệm thu

[Issue #166](https://github.com/sdcorejs/sdcorejs-angular/issues/166) · [PR #165](https://github.com/sdcorejs/sdcorejs-angular/pull/165) · [Mã triển khai](https://github.com/sdcorejs/sdcorejs-angular/commit/39384ebc4fc7bb6e99a219fc43c42cdf89e51686)

Ảnh chụp trực tiếp các trang Examples của Showcase với dữ liệu minh họa, ngày trình duyệt cố định 17/11/2026, múi giờ Asia/Ho_Chi_Minh. Màn hình desktop 1280×880, tablet 900×1000 và điện thoại 390×844. Desktop và tablet dùng ảnh cắt quanh panel để đọc chi tiết, điện thoại giữ nguyên viewport. Hai cấu hình cảm ứng dùng Playwright mô phỏng trên Chromium. Chưa thử trên thiết bị vật lý, Safari, Firefox hoặc trình đọc màn hình thật. Đầu việc này chạy tại trình duyệt với dữ liệu cục bộ.

## Bốn bộ chọn và các panel dùng chung

| Luồng hoặc trạng thái | Desktop | Tablet | Điện thoại |
| --- | --- | --- | --- |
| Ngày và focus bàn phím | [Sáng](1280-light-date.png) · [Tối](1280-dark-date.png) | [Sáng](900-light-date.png) · [Tối](900-dark-date.png) | [Sáng](390-light-date.png) · [Tối](390-dark-date.png) |
| Khoảng ngày trống | [Sáng](1280-light-range-empty.png) · [Tối](1280-dark-range-empty.png) | [Sáng](900-light-range-empty.png) · [Tối](900-dark-range-empty.png) | [Sáng](390-light-range-empty.png) · [Tối](390-dark-range-empty.png) |
| Đã chọn đầu khoảng | [Sáng](1280-light-range-pick-end.png) · [Tối](1280-dark-range-pick-end.png) | [Sáng](900-light-range-pick-end.png) · [Tối](900-dark-range-pick-end.png) | [Sáng](390-light-range-pick-end.png) · [Tối](390-dark-range-pick-end.png) |
| Mở lại khoảng 08–12/11, tính cả hai đầu | [Sáng](1280-light-range-selected.png) · [Tối](1280-dark-range-selected.png) | [Sáng](900-light-range-selected.png) · [Tối](900-dark-range-selected.png) | [Sáng](390-light-range-selected.png) · [Tối](390-dark-range-selected.png) |
| Ngày giờ, spinner và ba nút | [Sáng](1280-light-datetime.png) · [Tối](1280-dark-datetime.png) | [Sáng](900-light-datetime.png) · [Tối](900-dark-datetime.png) | [Sáng](390-light-datetime.png) · [Tối](390-dark-datetime.png) |
| Giờ, focus ở ô giờ | [Sáng](1280-light-time.png) · [Tối](1280-dark-time.png) | [Sáng](900-light-time.png) · [Tối](900-dark-time.png) | [Sáng](390-light-time.png) · [Tối](390-dark-time.png) |
| Chip calendar có ngày bị khóa bởi điều kiện | [Sáng](1280-light-chip-calendar.png) · [Tối](1280-dark-chip-calendar.png) | [Sáng](900-light-chip-calendar.png) · [Tối](900-dark-chip-calendar.png) | [Sáng](390-light-chip-calendar.png) · [Tối](390-dark-chip-calendar.png) |
| Select | [Sáng](after-select-light.png) · [Tối](after-select-dark.png) | [Sáng](900-light-select.png) · [Tối](900-dark-select.png) | [Sáng](390-light-select.png) · [Tối](390-dark-select.png) |
| Autocomplete | [Sáng](1280-light-autocomplete.png) · [Tối](1280-dark-autocomplete.png) | [Sáng](900-light-autocomplete.png) · [Tối](900-dark-autocomplete.png) | [Sáng](390-light-autocomplete.png) · [Tối](390-dark-autocomplete.png) |
| Action Popover | [Sáng](after-button-light.png) · [Tối](after-button-dark.png) | [Sáng](900-light-button.png) · [Tối](900-dark-button.png) | [Sáng](390-light-button.png) · [Tối](390-dark-button.png) |
| Query bar chọn trường | [Sáng](1280-light-query-fields.png) · [Tối](1280-dark-query-fields.png) | [Sáng](900-light-query-fields.png) · [Tối](900-dark-query-fields.png) | [Sáng](390-light-query-fields.png) · [Tối](390-dark-query-fields.png) |
| Query bar sửa chip | [Sáng](1280-light-query-chip.png) · [Tối](1280-dark-query-chip.png) | [Sáng](900-light-query-chip.png) · [Tối](900-dark-query-chip.png) | [Sáng](390-light-query-chip.png) · [Tối](390-dark-query-chip.png) |
| Query bar bộ lọc đã lưu | [Sáng](1280-light-query-saved.png) · [Tối](1280-dark-query-saved.png) | [Sáng](900-light-query-saved.png) · [Tối](900-dark-query-saved.png) | [Sáng](390-light-query-saved.png) · [Tối](390-dark-query-saved.png) |

Lưới chọn năm [sáng](1280-light-date-years.png) và [tối](1280-dark-date-years.png). [Khoảng đã chọn ở chế độ forced colors](1280-light-range-forced-colors.png). Playwright kiểm tra thêm `animation-name: none` khi bật reduced motion.

## Đối chiếu trước và sau

| Control | Trước trên 001 (65e9b545c) | Sau |
| --- | --- | --- |
| Select | [Sáng](before-select-light.png) · [Tối](before-select-dark.png) | [Sáng](after-select-light.png) · [Tối](after-select-dark.png) |
| Action Popover | [Sáng](before-button-light.png) · [Tối](before-button-dark.png) | [Sáng](after-button-light.png) · [Tối](after-button-dark.png) |

## Kiểm thử tại máy phát triển

- Windows, Node 24.22.1, Angular 19, Chrome Headless 157. **694/694** test liên quan đạt trong cùng một lượt, seed `520990`. Coverage của lượt chạy chọn lọc đạt 81,90% statements, 69,04% branches, 81,66% functions và 83,95% lines.
- **40/40** test Playwright chọn lọc đạt trên bản build Showcase, qua hai múi giờ Asia/Bangkok và UTC. Đã kiểm tra khung, kích thước, bàn phím, nhập tay, ngày chưa hoàn chỉnh, khoảng ngày, mở lại, high contrast và reduced motion. [Test panel](../../../showcase/e2e/forms/date-panels.e2e.ts) · [Test nhập tay](../../../showcase/e2e/forms/date-typing.e2e.ts).
- Lint và build thư viện v19, build Showcase, `test:scripts`, `check:scss-hex` và `check:sync` đạt. DP-11 quét toàn bộ source của forms. CI theo từng phiên bản nằm trong mục Checks của PR.
- Kiểm tra bổ sung trên cùng bản build: 14/14 test múi giờ qua hai cấu hình trình duyệt, gồm ngày 20/05/1960, khoảng ngày 25 giờ năm 1975 và thao tác Bây giờ. [Test múi giờ](../../../showcase/e2e/time-zone.e2e.ts).
- Trên các workspace Angular 20, 21 và 22, bộ hồi quy chọn lọc của các control đạt 384/384 ở mỗi bản.
