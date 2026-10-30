Bạn đang làm trong repo `sdcorejs/sdcorejs-angular`. Đọc `CLAUDE.md` trước và làm đúng quy tắc trong đó. Quan trọng nhất: chỉ sửa `versions/v19/**`, rollout bằng `npm run sync`, kiểm tra bằng `npm run check:sync`. Không sửa tay v20/v21/v22, published-docs, published-pages, dist.

Gói thiết kế này cần nằm ở `.sdcorejs/handoff/table-settings/`. Nếu tôi upload dạng zip thì giải nén vào đó; không đặt ở `design/` root. Gói gồm:
- `README.md`: tổng quan.
- `table-settings.md`: thông số đầy đủ, là nguồn chính.
- `Table Settings Spec.dc.html`: bản mẫu tab Cột (3a) và nút Thiết lập có chấm (3b). Mở bằng trình duyệt; `support.js` phải nằm cùng thư mục.

HTML chỉ là bản tham chiếu. Dựng bằng `sd-modal`, `sd-input`, `sd-checkbox`, `sd-button`, CDK drag-drop và token `--sd-*` hiện có. Không copy markup hay inline style. Không thêm hex (`check:scss-hex` phải xanh).

Phần lọc bằng query bar đã làm ở đợt trước, không nằm trong đợt này. Nếu modal đã có tab Cột / Bộ lọc thì chỉ đổi tab Cột và footer chung; không đổi tab Bộ lọc.

## Trước khi code
Đọc hết các tài liệu sau:
- `table-settings.md`;
- `sd-table.md`, `sd-button.md` (mục Indicator), `sd-input.md`, `sd-modal.md`;
- `config.component.{ts,html,scss}` và `config.component.spec.ts`;
- `config.service.ts` và `config.service.spec.ts`;
- `table-option-config.model.ts`;
- phần footer của `table.component.html`, chỗ `configComponent` trong `table.component.ts`.

Sau đó trình kế hoạch ngắn gồm:
- Danh sách file sẽ đổi và commit dự kiến.
- Quyết định cho 5 điểm ở mục "Cần duyệt trong kế hoạch" của `table-settings.md`, mỗi điểm một đoạn ngắn có lý do:
  1. Đổi thứ tự bằng phím trên `cdkDropList`.
  2. Cách tính `hasCustomSetup`.
  3. Giữ style preview và khe rơi khi bỏ mat-table.
  4. Nhận diện độ rộng không phải px, kẹp min/max.
  5. Dòng đang mở khi ô tìm lọc mất nó.
- Test hiện có sẽ sửa (nếu có) và test mới theo mục Spec.
- i18n key mới, key đổi nội dung (`config.drag-hint`), key giữ nhưng không dùng nữa trong modal (`core.component.table.fixed`, `char-limit`, `core.component.form-builder.default`).

Dừng chờ tôi duyệt.

## Phạm vi, làm theo thứ tự, mỗi bước một commit (spec trước)
1. **Tab Cột**: danh sách `cdkDropList` + `cdkDragHandle`, dòng 44px, phần chi tiết (float label sm, độ rộng px, 2 checkbox), ô tìm khi hơn 8 cột, Hiện {n}/{total} cột, Hiện tất cả, footer mới.
2. **Bàn phím**: nhấc / di chuyển / thả / Esc trên handle, vùng live, thứ tự Tab.
3. **Chấm trên nút Thiết lập**: `hasCustomSetup`, `indicator` / `indicatorColor="primary"` / `indicatorLabel` trên nút `-config`; tắt ngay sau Khôi phục mặc định; không có trên mobile.
4. **Docs, i18n, showcase**.

## Ràng buộc
- Không đổi `ConfiguredColumn`, `ConfiguredTable`, `ConfiguredTableResult`, `ConfigService` API, storage key hay format.
- Giữ `open()`, `close()`, `onSave()`, `onReset()`, hộp xác nhận reset, autoId `-config`, `-config-skip`, `-config-reset`, `-config-apply`.
- Ô Hiện không bao giờ khoá; cột ẩn khoá phần chi tiết.
- Nút dùng dáng mặc định của sd-button, không override radius; input và nút đều `size="sm"`.
- Không đổi hay rename public API, input/output hiện có.
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
- Build lại lib v19 và chạy `npm --prefix showcase run link:library`.
- Kiểm tra đủ danh sách ở mục "Kiểm tra trên showcase" của `table-settings.md`.
- Cập nhật `sd-table.md` (modal Thiết lập, chấm trên nút Thiết lập) và `## [Unreleased]` trong `CHANGELOG.md`.

Không commit, push, tag hay publish khi tôi chưa yêu cầu. Khi xong mỗi bước, báo lại:
- file đã đổi;
- spec đã thêm hoặc sửa;
- kết quả các lệnh kiểm tra;
- ảnh chụp modal (5 cột và 12+ cột, một dòng đang mở) và footer bảng có chấm;
- điểm nào lệch khỏi thông số và lý do.
