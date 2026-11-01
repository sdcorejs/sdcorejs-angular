Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/table-mobile/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root. Gói gồm:
- `README.md`: tổng quan.
- `table-mobile.md`: thông số đầy đủ, là nguồn chính. Bảng đầu file cho biết khung mẫu nào đã chốt, khung nào bị loại.
- `Table Mobile Proposal.dc.html`: file thảo luận có mọi phương án. Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục.

HTML chỉ là bản tham chiếu. Dựng bằng `sd-modal view="bottom-sheet"`, `sd-chip` (nếu có, không thì `sd-button`), `sd-input`, `sd-checkbox`, `sd-radio`, `sd-button` và token `--sd-*` hiện có. Không copy markup hay inline style. Không thêm hex (`check:scss-hex` phải xanh).

Chỉ đổi giao diện điện thoại. Desktop, query bar và modal Thiết lập không đổi.

## Trước khi code
Đọc hết các tài liệu sau:
- `table-mobile.md`;
- `sd-table.md` (Mobile row cards, Lifecycle sticky và mobile, filter, sort, reload, export), `sd-modal.md` (bottom-sheet), `sd-button.md`, `sd-input.md`, `sd-badge.md`;
- `components/filter/mobile-filter/*`, `components/filter/column-filter/*`;
- `components/mobile-cards/*` (gồm `mobile-actions`, `mobile-action.model.ts`);
- `directives/sd-table-row-mobile-def.directive.ts`, `models/table-column.model.ts`, model `SdTableOption` và `SD_TABLE_CONFIGURATION`;
- `table-query-bar.util` (phần dựng nhãn chip);
- trong `table.component.{ts,html}`: `mobileToolsActions`, footer mobile, chỗ chọn giữa thẻ và bảng desktop;
- spec hiện có của các file trên.

Sau đó trình kế hoạch ngắn gồm:
- Danh sách file sẽ đổi và commit dự kiến cho từng bước.
- Quyết định cho 6 điểm ở mục 15 "Cần duyệt trong kế hoạch" của `table-mobile.md`, mỗi điểm một đoạn ngắn có lý do.
- Public API mới (kiểu, input, config) và nơi export.
- Test hiện có sẽ sửa và test mới theo mục 13.
- i18n key: key dùng lại, key mới (đủ 5 locale), key không còn dùng trên điện thoại.
- Thay đổi hành vi cần ghi vào CHANGELOG.

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi bước một commit (spec trước)
1. **Khung thẻ card** (mục 8): checkbox ở cột trái, ⋯ ở góc trên phải, bỏ hàng "Chi tiết · ⋯", dòng Chi tiết khi có expand, khoảng cách, trạng thái đang chọn. `sdTableRowMobileDef` chạy như cũ trong khung mới.
2. **`mobile.template` và data** (mục 9, 10): kiểu và export, thứ tự ưu tiên ở 9.2, renderer thẻ từ data (Thêm / Thu gọn, highlight, `maxFields`), `resolveMobileView` + cảnh báo dev, cache, `autoTemplate`, quy tắc field ẩn, test kiểu.
3. **Hàng chip và sheet một trường** (mục 3, 4): chip Bộ lọc, chip trường, tóm tắt dùng chung với query bar, mask mép phải, sheet một trường với bản sao.
4. **Sheet bộ lọc đầy đủ** (mục 5): thay `sd-side-drawer` bằng bottom-sheet hai cấp, control 44px, nhãn trên ô, operator là nút chữ, values thành danh sách checkbox có ô tìm khi > 8, Xóa tất cả, Hủy / Áp dụng.
5. **Sắp xếp, Công cụ, chân trang, kéo để làm mới** (mục 2, 3.2, 6, 7): chip Sắp xếp và nút `swap_vert` khi không có hàng chip, sheet sắp xếp, nút ⋮ ở hàng đầu, sheet Công cụ bỏ Lọc / Sắp xếp / Làm mới và trải phẳng Xuất, chân trang chỉ còn phân trang, kéo để làm mới.
6. **Docs, i18n, showcase**.

## Ràng buộc
- `sdTableRowMobileDef`, `mobile.rowLabel`, sheet hành động dòng, thanh chọn và expand giữ API và hành vi. Chỉ vị trí trong khung thay đổi.
- Không khai báo `template` và không bật `autoTemplate`: điện thoại vẫn hiện bảng desktop như hiện tại.
- Không thêm tùy chọn layout vào `SD_TABLE_CONFIGURATION`. Bỏ `layout` luôn là `'card'`.
- Không làm `layout: 'list'` (Phụ lục A). Kiểu đợt này chỉ có nhánh card.
- `mobile-filter` giữ `filterRegister`, bản sao làm việc và thứ tự external → filterDef → cột. Áp dụng tải lại đúng một lần.
- Sắp xếp trên điện thoại chỉ một cột. Cột ẩn trong Thiết lập vẫn sắp xếp được.
- Nút ⋮ giữ autoId và aria-label của nút Công cụ cũ. AutoId mới theo quy ước hiện có (vd. `-mobile-filter`, `-mobile-filter-{key}`, `-mobile-sort`).
- Không đổi hay rename input/output public hiện có. API mới chỉ thêm vào.
- Rà API consistency theo mục "Review bắt buộc" của CLAUDE.md. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh. Dùng lại key có sẵn nếu cùng nghĩa.
- Vùng chạm ≥ 44px. Sheet có focus trap, trả focus về chip hoặc nút đã mở nó.
- Listener cử chỉ passive; subscription, listener và effect dọn khi destroy.

## Kiểm tra sau mỗi bước và trước khi xong
```
cd versions/v19
npx ng test sdcorejs-angular --watch=false --browsers=ChromeHeadlessCI --code-coverage
npm run lint
cd ../..
npm run test:theme
npm run check:scss-hex
npm run sync
npm run check:sync
```

Cuối cùng:
- Build lại lib v19 và chạy `npm --prefix showcase run link:library`.
- Kiểm tra đủ danh sách ở mục 14 "Kiểm tra trên showcase" của `table-mobile.md`, viewport 360 × 720.
- Cập nhật `sd-table.md`: Mobile row cards, `mobile.template`, `autoTemplate`, bộ lọc / sắp xếp / Công cụ trên điện thoại, kéo để làm mới.
- Cập nhật `## [Unreleased]` trong `CHANGELOG.md`. Ghi rõ các thay đổi hành vi: drawer lọc thành bottom-sheet; nút Công cụ chuyển lên hàng đầu; bỏ Lọc, Sắp xếp, Làm mới khỏi sheet Công cụ; kéo để làm mới; khung thẻ mới.

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã đổi;
- spec đã thêm hoặc sửa;
- kết quả các lệnh kiểm tra;
- ảnh chụp 360 × 720 của các màn trong bước đó;
- điểm nào lệch khỏi thông số và lý do.
