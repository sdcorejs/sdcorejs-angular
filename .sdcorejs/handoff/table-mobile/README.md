# Handoff · sd-table trên điện thoại

Bộ lọc, sắp xếp, Công cụ và thẻ của sd-table trên điện thoại:
- Bộ lọc chuyển sang hàng chip dưới ô tìm, bấm chip mở sheet một trường. Sheet bộ lọc đầy đủ dạng bottom-sheet hai cấp thay cho side-drawer.
- Sắp xếp thành chip, sheet chọn một cột và chiều.
- Nút Công cụ (⋮) lên cạnh ô tìm; chân trang chỉ còn phân trang. Làm mới đổi thành kéo xuống.
- Khung thẻ gọn: checkbox ở cột trái, ⋯ ở góc.
- API mới `mobile.template`: `TemplateRef` hoặc `{ layout?: 'card', data: (item) => SdTableMobileCardData<T> }`, kiểm tra field lúc build và lúc chạy. Có tùy chọn `autoTemplate` để tự suy thẻ từ columns.

Desktop không đổi.

## File
- `PROMPT.md`: giao cho agent implement.
- `table-mobile.md`: thông số, nguồn chính. Bảng đầu file cho biết khung mẫu nào đã chốt.
- `Table Mobile Proposal.dc.html` (+ `support.js`): file thảo luận theo vòng, mới nhất ở trên. Khung chốt: 1b, 1c, 1d, 1f (hình thẻ), 3a–3d, 4b.

## Thứ tự
1. Khung thẻ card.
2. `mobile.template`, renderer thẻ từ data, `autoTemplate`.
3. Hàng chip và sheet một trường.
4. Sheet bộ lọc đầy đủ.
5. Sắp xếp, Công cụ, chân trang, kéo để làm mới.
6. Docs, i18n, showcase.

Bố cục `list` (1e) để đợt 2, xem Phụ lục A của `table-mobile.md`.
