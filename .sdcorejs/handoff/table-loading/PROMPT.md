Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/table-loading/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root vì CLAUDE.md cấm. Gói gồm:
- `README.md`: tổng quan.
- `table-loading.md`: thông số đầy đủ, là nguồn chính.
- `Table Loading Spec.dc.html`: hình minh hoạ và bản bấm thử (attribute, vùng live, diễn biến theo thời gian). Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục.

HTML chỉ là bản tham chiếu. Dựng lại bằng template Angular và SCSS hiện có cùng token `--sd-*`. Không copy markup hay inline style. Không thêm hex (`check:scss-hex` phải xanh). Hex trong spec chỉ là giá trị light để đối chiếu.

Phạm vi: `components/table` (sd-table desktop và mobile cards). Logic đọc dữ liệu trong `table.component.ts` (lịch đọc, debounce, huỷ response cũ, khoá paginator, `readState`) giữ nguyên; đợt này chỉ đổi lớp hiển thị và thêm signal suy ra từ `loading()`.

## Trước khi code
Đọc hết `table-loading.md`, `sd-table.md`, `table.component.{ts,html,scss}`, `mobile-cards.component.*`, `table.configuration.ts`, `table-option.model.ts`, các spec đang test `.c-loading` / `loading()` / `aria-busy`, `_component-tokens.scss`, `THEME.md` mục table, và `sd-data-state`. Sau đó trình kế hoạch ngắn gồm:
- Danh sách file sẽ đổi và commit dự kiến.
- Quyết định cho 6 điểm ở mục 14 "Cần duyệt" của `table-loading.md`, mỗi điểm một đoạn ngắn có lý do:
  1. Khung xương thẳng cột: grid đo từ header hay dòng giả trong dataSource.
  2. Thanh tiến trình: `mat-progress-bar` hay phần tử CSS; cách đo cao thead.
  3. Trước khi có `configuration`.
  4. Toast khi bảng local lỗi.
  5. Spinner trong nút expand mà vẫn giữ focus.
  6. Báo "đã tải xong" cho lần tải nhanh.
- Cách cài state machine ở mục 2 (signal nào, timer chạy ngoài zone thế nào, dọn timer ở đâu) và vì sao không đổi hành vi của `loading()` / `data-loading` / `aria-busy`.
- Cách áp lớp mờ lên `tr` mà ô sticky và footer sticky không bị trong suốt.
- Danh sách test hiện có sẽ sửa (ít nhất `table.component.spec.ts:154–171`) và test mới theo mục 13.
- i18n key mới và key dùng lại.

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi bước một commit (spec trước)
1. **Nền**: `SdTableOptionLoading`, `option.loading`, `ISdTableConfiguration.loading`, gộp ưu tiên option > configuration > mặc định; signal `loadingView` + timer theo mục 2; host `data-loading-view`; vùng live `.sd-table-live` + key `core.component.table.loaded` đủ 5 locale. Chưa đổi giao diện.
2. **Desktop**: bỏ `.c-loading` và mat-spinner; khung xương (mục 3); lớp mờ và thanh tiến trình (mục 4); token mới; reduced-motion, forced-colors.
3. **Mobile cards**: khung xương thẻ, lớp mờ, thanh tiến trình (mục 5).
4. **Spinner 16px**: tree, expand, mobile; bỏ `.lds-ring` (mục 6).
5. **Lỗi local** dùng `sd-data-state` (mục 7).

## Ràng buộc
- Không đổi hay rename public API, input/output, keyboard contract hiện có. Chỉ thêm những gì mục 10 liệt kê.
- `loading`, `data-loading`, `aria-busy`, `readState`, `retryRead()`, `reload()`, `sdDataStateTemplate`, khoá paginator giữ nguyên nghĩa và thời điểm.
- Lớp hiển thị không được chặn header, inline filter, sort, quick search, external filter, paginator, thanh cuộn.
- Không dùng `inert` trên thân bảng. Bàn phím không bị chặn trong `refresh`.
- Giữ các cải thiện a11y đang có trong template.
- Rà API consistency theo mục "Review bắt buộc" của CLAUDE.md. Ghi kết quả vào PR description.
- Thêm i18n key thì phải đủ 5 locale vi/en/ja/ko/zh.
- Transition và animation tắt khi `prefers-reduced-motion`.
- Timer phải dọn khi destroy; không set signal sau destroy.

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
- Thêm vào demo sd-table của showcase công tắc độ trễ giả và nút "lần tới lỗi" (mục 15), rồi kiểm tra đủ danh sách ở mục 15 của `table-loading.md`.
- Chế độ: light, dark (`data-sd-theme="dark"`), preset default và graphite, forced-colors, `prefers-reduced-motion`.
- Màn rộng, ≤ 600px, `pointer: coarse`.
- Cập nhật `sd-table.md` (mục Loading mới; sửa các dòng đang nói "loading overlay" và "centered Material spinner"; bảng attribute thêm `data-loading-view`; mục a11y), `THEME.md` (3 token mới), và `## [Unreleased]` trong `CHANGELOG.md` (thay đổi giao diện loading, class nội bộ đã bỏ).

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã đổi
- spec đã thêm hoặc sửa
- kết quả các lệnh kiểm tra
- ảnh chụp showcase trước/sau
- điểm nào lệch khỏi thông số và lý do
