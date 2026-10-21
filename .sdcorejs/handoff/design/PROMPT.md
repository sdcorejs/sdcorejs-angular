Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/design/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root vì CLAUDE.md cấm. Gói gồm:
- `wave-1/README.md`: thông số đợt 1 (nguồn chính).
- `wave-1/Wave 1 Spec.dc.html`: hình minh hoạ đợt 1.
- `wave-1/SD Core Design Review.dc.html`: bối cảnh. Phần redesign sd-table trong đó ngoài phạm vi, trừ mục 02C (token).
- `wave-2/README.md`: thông số đợt 2 (nguồn chính).
- `wave-2/Wave 2 Controls.dc.html`: hình minh hoạ đợt 2.
- Mở file `.dc.html` bằng trình duyệt; `support.js` phải nằm cùng thư mục.

HTML chỉ là bản tham chiếu. Dựng lại bằng SCSS và template Angular hiện có cùng token `--sd-*`. Không copy markup hay inline style. Không thêm hex mới (`check:scss-hex` phải xanh).

Khi hai README mâu thuẫn, README đợt 2 thắng. Trường hợp hiện có: bo góc, viền và focus của primitive tìm kiếm, và bo góc track sd-segmented.

## Trước khi code
Đọc hết hai README, rồi trình kế hoạch ngắn gồm:
- Danh sách file sẽ đổi ở từng bước.
- Tên token Material đã xác minh cho từng major (19–22), dùng ở bước 2 và 3.
- Kết quả grep control dạng ô tự viết (README đợt 2, mục D), kèm quyết định đổi hay giữ cho từng chỗ.

Dừng chờ tôi duyệt.

## Thứ tự làm, mỗi bước một commit
1. **[Đợt 1 · A] Thang chiều cao control**
   - Thêm `control-height-{sm,md,lg,coarse}` = 32/40/48/44px vào `_scales.scss`.
   - Thay literal bằng token trong `button.component.scss` (height, `.c-square`) và `form.scss` (`--mat-form-field-container-height`), có fallback.
   - Bước này không được đổi hình ảnh. Cập nhật THEME.md.
2. **[Đợt 2 · D] Token control**
   - Thêm `control-radius`, `panel-radius` vào `_scales.scss` và các `--sd-control-*` vào `_semantic.scss`.
   - Gán vào token Material outlined (cả hai prefix) trong `_material-tokens.scss`.
   - Thêm vòng focus, nền label float, fallback forced-colors và nền disabled trong `form.scss`.
   - Áp panel cho select, autocomplete và menu sd-operator. Giữ option 36px, không thêm khoảng cách dọc (virtual scroll).
   - Chỉnh sd-entity-picker. Primitive tìm kiếm và segmented để tới bước của chúng.
   - Cập nhật THEME.md, có mục opt-out.
3. **[Đợt 2 · E] Checkbox và radio**
   - Bo 3 / 4 / 5px theo cỡ; rule chung cho mat-checkbox dùng trực tiếp và mat-pseudo-checkbox.
   - Viền chưa chọn `--sd-border-strong`, hover/focus `--sd-text-secondary`. Radio cùng màu viền.
   - Spec trước.
4. **[Đợt 1] sd-segmented**
   - Áp bảng trong README đợt 1: tổng chiều cao 32/40/48, track `3px 4px`, bỏ `margin-top`, item radius `calc(radius - 3px)`, `--sd-segmented-ring-offset: 1px`.
   - Track dùng `--sd-control-radius`.
   - Cho `#reveal()` đọc biến offset mới. Spec trước, sửa sau.
5. **[Đợt 1 · B] Primitive tìm kiếm nội bộ (`ɵ`)**
   - Trước khi tạo file, đề xuất vị trí entry point (tránh vòng phụ thuộc) và tên, rồi dừng chờ tôi duyệt.
   - Bo góc, viền, hover và focus theo README đợt 2 mục D (thay cho thông số trong README đợt 1). Phần còn lại theo README đợt 1.
   - Thay `.sd-kanban__search`, `.sd-quick-search-field`, `.fb-search`, và `.filter-input-wrapper` trong panel sd-select nếu hợp. Giữ hành vi riêng của từng nơi.
   - Không đặt `aria-hidden` trên input.
6. **[Đợt 1 · C] Token table**
   - Đổi các token `table-*` liệt kê trong README đợt 1 sang `color-mix` từ palette và `--sd-table-bg`, light = dark.
   - Sửa màu viết thẳng trong `table.component.scss` (icon sort dùng `mask-image`, drag preview, reorder, resize/tree hover, `.c-btn-add`).
   - Không đụng `.c-loading`, `.lds-ring`, empty state.
   - Cập nhật header comment D-014, THEME.md và các cặp tương phản trong theme test.
7. **[Đợt 1] sd-form-builder**
   - Chế độ và khung nhìn dùng `sd-segmented size="sm"`; gỡ `.fb-seg` và `onSegmentKeydown`.
   - Tab trang kiểu gạch chân, thao tác trang gom vào menu ⋯ trên tab đang chọn, thêm nút "+ Trang".
   - Giữ `data-page-action`, `data-builder-page` và điều kiện disabled.
   - Dọn `.msi` và token `form-builder-md-*` trong một commit riêng. Alias `--md-sys-color-*` chỉ gỡ nếu an toàn; không thì để lại và ghi vào PR.
8. **[Đợt 1] sd-kanban**
   - Thêm 6 token `kanban-*` trong `_component-tokens.scss`.
   - Làn trung tính, chấm màu 8px, số đếm dạng chữ, thẻ không shadow.
   - Công cụ thẻ ẩn bằng opacity trên fine pointer, hiện khi hover, focus-within, pending, failed hoặc menu đang mở.
   - Làn đang được kéo vào và placeholder dạng khe nét đứt. Không thêm option `appearance`.
9. **[Đợt 2 · F] Indicator trên sd-button**
   - Thêm `indicator`, `indicatorColor`, `indicatorMax`, `indicatorLabel` đúng bảng và hình học trong README đợt 2.
   - Thêm token `button-indicator-ring` vào `_component-tokens.scss`.
   - Không đổi kích thước nút; `aria-describedby` từ `indicatorLabel`.
   - Spec trước; cập nhật `sd-button.md` và showcase.
10. **[Đợt 2 · G] Operator trong control**
    - Trước khi code, trình 3 điểm ở mục "Bước thiết kế" của README đợt 2: kiến trúc trigger dùng chung, tên API trên control, operator khoảng/trống có trong `@sdcorejs/utils` không. Dừng chờ tôi duyệt.
    - Sau khi được duyệt:
      - Thêm chip tiền tố cho sd-input, sd-input-number, sd-select, sd-date, sd-date-range.
      - Chuyển column-filter sang dùng chip. Template custom giữ sd-operator rời.
      - Giữ `operatorChange`, `filterChange`, `filterCommit`.

## Ràng buộc
- Không đổi hay rename public API, input/output, keyboard, live region hay move contract, trừ những gì hai README liệt kê.
- `sd-operator` giữ nguyên public API.
- Rà API consistency theo mục "Review bắt buộc" của CLAUDE.md. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh.
- Hover chỉ là lớp hiển thị bổ sung; mọi thứ vẫn dùng được bằng bàn phím và `pointer: coarse`. Transition tắt khi `prefers-reduced-motion`.
- Ngoài phạm vi: bố cục sd-table (toolbar, thanh chọn, pager, hàng filter inline, trạng thái đang lọc của ô filter), indicator cho sd-tab và sidebar.

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
- Kiểm tra showcase các trang input, input-number, textarea, select (single, multiple, virtual scroll), autocomplete, date, datetime, date-range, input-color, entity-picker, checkbox, radio, button, segmented, kanban, form-builder và table (column filter, cột chọn, token màu).
  - Chế độ: light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors.
  - Kích thước: sm, md, và `pointer: coarse`.
- Cập nhật md của các component đã đổi, `THEME.md`, và một mục `## [Unreleased]` trong `CHANGELOG.md` (Added / Changed / Removed) cho cả hai đợt.

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã đổi
- spec đã thêm hoặc sửa
- kết quả các lệnh kiểm tra
- ảnh chụp showcase trước/sau nếu có thay đổi hình ảnh
- điểm nào lệch khỏi thông số và lý do
