# Handoff · sd-table loading (1e)

Thay lớp phủ tối + spinner 100px của sd-table bằng: khung xương khi chưa có dòng; thanh tiến trình 2px và làm mờ dòng cũ khi tải lại (trễ 300ms, giữ tối thiểu 400ms). Kèm spinner 16px cho tree/expand, giao diện lỗi chung cho local và server, và vùng live báo tải xong. Giải quyết L1–L8 ở Icon Chip Table Review · 3.05.

## File
- `PROMPT.md`: giao cho agent implement.
- `table-loading.md`: thông số, nguồn chính.
- `Table Loading Spec.dc.html` (+ `support.js`): hình minh hoạ, bản bấm thử.

## Thứ tự
1. Nền: option, configuration, `loadingView`, `data-loading-view`, vùng live, i18n.
2. Desktop: khung xương, lớp mờ, thanh tiến trình, token.
3. Mobile cards.
4. Spinner 16px.
5. Lỗi local dùng `sd-data-state`.

Độc lập với các đợt handoff khác. Cần token `--sd-table-*` và `--sd-duration-fast` đã có trên main.

Nguồn đọc: `sdcorejs/sdcorejs-angular@main` (aacb38e), `versions/v19/projects/sdcorejs-angular/components/table/`.
