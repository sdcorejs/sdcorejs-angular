# Handoff · sd-table lọc bằng query bar (phương án A)

Thêm `filter.mode: 'query-bar'` cho sd-table: quick search, external filter và filter dưới cột gộp vào một `sd-query-bar` ở đầu bảng. State lọc vẫn là `TableFilterValue`; một adapter thuần chuyển hai chiều giữa raw record và `SdQuery`, nên `items()`, cache, `required`, `default`, `manualFilter` giữ nguyên. Kèm icon lọc ở header cột. Mobile giữ giao diện mode default.

## File
- `PROMPT.md`: giao cho agent implement.
- `table-query-bar.md`: thông số, nguồn chính.
- `Table Query Bar Spec.dc.html` (+ `support.js`): bản bấm thử 7 trạng thái, kèm SdQuery → TableFilterValue → pagingReq cho từng trạng thái; trạng thái chip; icon header; bảng ánh xạ.

## Thứ tự
1. sd-query-bar: Q1–Q12 (cộng thêm, standalone không đổi).
2. sd-table nền: option, configuration, `sdTableQueryFields`, adapter. Chưa đổi giao diện.
3. sd-table giao diện: render thanh, áp dụng / required / manualFilter / xoá lọc, mobile.
4. Icon lọc ở header cột.
5. Docs, i18n, showcase.

Ngoài phạm vi: OR, nhiều chip cùng field, filter custom, saved filters, hàng chip trên mobile, đổi payload.

Nguồn đọc: `sdcorejs/sdcorejs-angular@main` (166f16c), `versions/v19/projects/sdcorejs-angular/components/table/` và `components/query-bar/`.
