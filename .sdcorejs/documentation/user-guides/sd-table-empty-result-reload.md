---
module: sd-table-empty-result-reload
title: Tải lại bảng khi chưa có dữ liệu
tracks: [angular]
generated_at: 2026-07-23T15:46:27+07:00
git_head: e6ec1eb242e84dc6be34cd42eb617c1d002b612e
routes: []
permissions: []
entities: []
screens: [empty-result-reload]
spec_refs: [docs/superpowers/specs/2026-07-23-sd-table-empty-reload-design.md]
prd_refs: []
coverage: { total: 7, met: 7, partial: 0, missing: 0 }
---

# Tải lại bảng khi chưa có dữ liệu - Hướng dẫn sử dụng

## Tổng quan

Ở màn hình có bảng dữ liệu dùng `SdTable`, nút Reload vẫn có thể bấm khi bảng
đang không có dòng nào. Điều này cho phép bạn kiểm tra lại dữ liệu sau khi nguồn
dữ liệu thay đổi hoặc sau một sự cố tạm thời mà không cần rời khỏi màn hình.

Nút Reload chỉ xuất hiện trên màn hình đã được ứng dụng cấu hình cho phép tải
lại. Thay đổi này không làm xuất hiện thêm nút trên các màn hình vốn không có
chức năng đó.

## Màn hình và thao tác

### Bảng có kết quả rỗng

- **Tình huống:** bảng hiển thị `0` bản ghi hoặc bộ lọc hiện tại không trả về dữ
  liệu.
- **Thao tác:** bấm nút có biểu tượng Reload ở thanh công cụ phía dưới bảng.
- **Kết quả mong đợi:** bảng gọi lại nguồn dữ liệu hiện tại và cập nhật kết quả
  khi việc tải hoàn tất.
- **Không thay đổi:** nút Export vẫn không hiển thị khi không có item; paginator
  vẫn ẩn khi tổng số bản ghi không vượt kích thước trang.

Nếu bấm Reload mà bảng vẫn rỗng, hãy kiểm tra lại bộ lọc hoặc xác nhận dữ liệu
nguồn đã tồn tại. Việc nút Reload hoạt động không đảm bảo nguồn dữ liệu sẽ trả về
bản ghi mới.

## Quyền truy cập

Tính năng không bổ sung permission code mới. Người dùng cần có quyền truy cập
màn hình chứa bảng theo quy tắc hiện có của ứng dụng.

## Tham chiếu dữ liệu

Tính năng không bổ sung entity hoặc field. Nó chỉ tải lại cùng nguồn dữ liệu và
bộ lọc mà bảng đang sử dụng.

## Thao tác đặc biệt

- Reload dùng lại luồng tải dữ liệu hiện có của bảng.
- Không có thay đổi đối với Export, pagination, empty-state layout hoặc mobile
  controls.
- Nếu màn hình có callback sau khi tải lại, callback đó tiếp tục chạy theo cấu
  hình hiện có.

## Core UI components được sử dụng

| Core UI | Vai trò trong tính năng |
| ------- | ----------------------- |
| `SdTable` | Hiển thị bảng và thực hiện lại luồng tải dữ liệu hiện có |
| `SdButton` | Render nút Reload đã được cấu hình và cho phép bấm khi bảng rỗng |

## Độ bao phủ so với yêu cầu

| # | Yêu cầu | Trạng thái | Được mô tả tại |
| -: | ------- | ---------- | ------------- |
| 1 | Reload hiển thị và enabled khi `items.length === 0` | ✅ đạt | Màn hình và thao tác |
| 2 | Reload hiển thị và enabled khi `total === 0` | ✅ đạt | Màn hình và thao tác |
| 3 | Click Reload gọi lại luồng refresh hiện có | ✅ đạt | Màn hình và thao tác |
| 4 | Reload vẫn ẩn khi màn hình không cấu hình `reload.visible` | ✅ đạt | Tổng quan |
| 5 | Export và paginator giữ hành vi hiện tại | ✅ đạt | Màn hình và thao tác |
| 6 | Hành vi nhất quán trên Angular 19, 20 và 21 | ✅ đạt | Core UI components được sử dụng |
| 7 | Regression test, tài liệu và changelog được cập nhật | ✅ đạt | Tài liệu kỹ thuật và session evidence |

## Danh sách ảnh minh họa

- [ ] `images/sd-table-empty-result-reload.png` — cần một Showcase fixture riêng
  cho trạng thái bảng rỗng trước khi capture; trang Table Examples hiện tại
  không cung cấp trạng thái này bằng selector ổn định.

Sau khi fixture tồn tại, đăng ký nó trong script capture rồi chạy:

```bash
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
