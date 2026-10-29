Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/table-query-bar/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root vì CLAUDE.md cấm. Gói gồm:
- `README.md`: tổng quan.
- `table-query-bar.md`: thông số đầy đủ, là nguồn chính.
- `Table Query Bar Spec.dc.html`: bản bấm thử, trạng thái chip, icon header, bảng ánh xạ, và payload SdQuery → TableFilterValue → pagingReq cho từng trạng thái. Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục.

HTML chỉ là bản tham chiếu. Dựng bằng template Angular và SCSS hiện có của sd-table và sd-query-bar cùng token `--sd-*`. Không copy markup hay inline style. Không thêm hex (`check:scss-hex` phải xanh).

Phương án đã chốt: A. Query bar chỉ là lớp hiển thị. `TableFilterValue`, `SdTableFilterService`, `SdConvertToPagingReq`, `items()`, `filterReq`, `pagingReq`, format cache giữ nguyên. Tiêu chí nghiệm thu chính: cùng thao tác lọc, `pagingReq` ở hai mode giống hệt nhau.

## Trước khi code
Đọc hết `table-query-bar.md`, `sd-table.md`, `sd-query-bar.md`, `table.component.{ts,html,scss}`, `table-filter.model.ts`, `table-filter.service.ts`, `table-quick-search.*`, `table-filter-operator.util.ts`, `column-filter`, `external-filter`, `quick-search`, `mobile-filter`, `table.configuration.ts`, toàn bộ `components/query-bar/src/**`, và các spec đang test filter (`table-quick-search.spec.ts`, `table-header-layout.spec.ts`, `table-external-filter-collapse.spec.ts`, `table.component.initial-read.spec.ts`, `table-filter.model.spec.ts`, `query-bar.component.spec.ts`). Sau đó trình kế hoạch ngắn gồm:
- Danh sách file sẽ đổi và commit dự kiến.
- Quyết định cho 6 điểm ở mục 14 "Cần duyệt" của `table-query-bar.md`, mỗi điểm một đoạn ngắn có lý do:
  1. Đồng bộ thanh và raw, chặn vòng lặp, giữ chip đang mở.
  2. Cổng chặn đọc khi external `required` rỗng mà không còn `ExternalFilterComponent.form`.
  3. Focus sau popover mở từ icon header.
  4. External `date`/`datetime` thiếu `defaultOperator`.
  5. Cột ẩn qua config.
  6. Thứ tự chip thêm.
- Cách cài Q1–Q12 ở sd-query-bar mà không đổi hành vi khi không dùng option mới; Q nào thấy không cần hoặc cần cách khác thì nói rõ.
- Cách giữ identity object `Filter` qua các lần raw → thanh (mục 5).
- Danh sách test hiện có sẽ sửa (nếu có) và test mới theo mục 15.
- i18n key mới và key dùng lại.

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi bước một commit (spec trước)
1. **sd-query-bar**: Q1–Q12 (mục 12). Spec cho từng mục. `sd-query-bar.md` cập nhật API, sửa ghi chú "không đưa `SdQuery.filters` vào `externalFilters`" thành trỏ sang mode query-bar của sd-table.
2. **sd-table nền**: `SdTableOptionFilterQueryBar`, `filter.mode`, `filter.queryBar`, `ISdTableConfiguration.filter.mode/queryBar`; `table-query-bar.util.ts` với `sdTableQueryFields`, `tableFilterToQuery`, `queryToTableFilter` (mục 3–5) và spec parity (mục 15 · 1–4). Chưa đổi giao diện.
3. **sd-table giao diện**: `effectiveMode`, `data-filter-mode`, render thanh thay quick search, ẩn external/inline filter (mục 1–2); áp dụng, `required`, `manualFilter`, `onFilter` (mục 6); xoá lọc (mục 7); cache (mục 9); mobile (mục 10); loading, a11y (mục 11); dev warning (mục 3).
4. **Icon lọc ở header cột** (mục 8).
5. **Docs, i18n, showcase** (mục 17–18).

## Ràng buộc
- Mode default không đổi gì: DOM, class, `data-autoid`, thứ tự emit, spec hiện có xanh mà không sửa.
- Không đổi hay rename public API, input/output hiện có của sd-table và sd-query-bar. Chỉ thêm những gì mục 12–13 liệt kê.
- Không đổi format cache, `#resolveKey`, `SdConvertToPagingReq`, `quickSearchConditions`, lọc local.
- Không sửa `ExternalFilterComponent`, `ColumnFilterComponent`, `TableQuickSearchComponent`, `mobile-filter`.
- Callback `onChange` / `operatorChange` gọi đúng tham số và chỉ khi người dùng đổi, như mode default.
- Thanh không bị lớp loading chặn.
- Rà API consistency theo mục "Review bắt buộc" của CLAUDE.md. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh.
- Subscription và effect dọn khi destroy.

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
- Build lại lib v19, chạy `npm --prefix showcase run link:library`.
- Thêm vào demo sd-table của showcase công tắc `mode` và `manualFilter`, khung in `pagingReq`, rồi kiểm tra đủ danh sách ở mục 18 của `table-query-bar.md`.
- Chế độ: light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors, `prefers-reduced-motion`.
- Màn rộng, ≤ 600px, `pointer: coarse`.
- Cập nhật `sd-table.md` (mục Filter: mode query-bar, ánh xạ, option bị bỏ qua, field bị loại; bảng attribute thêm `data-filter-mode`), `sd-query-bar.md` (Q1–Q12), và `## [Unreleased]` trong `CHANGELOG.md`.

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã đổi
- spec đã thêm hoặc sửa
- kết quả các lệnh kiểm tra
- ảnh chụp showcase hai mode
- điểm nào lệch khỏi thông số và lý do
