# `@sdcorejs/angular/modules/pattern`

Màn mẫu theo entity, chạy trên Core thật với mock API. Mỗi màn là code Angular hoàn chỉnh trong `features/`, theo cấu trúc project-structure của Angular Portal Blueprint. Tài liệu trong `docs/` giữ quy tắc và lý do; mọi khối code trong đó được trích từ `features/` khi build (`npm run pattern:docs`), nên không có code minh hoạ tách rời code chạy thật.

Đọc theo thứ tự: README này → `docs/<pattern>.md` của loại màn cần làm → thư mục `features/<entity>/` gần nhất. Gói npm mang theo cả ba (`node_modules/@sdcorejs/angular/modules/pattern/`).

## Chọn pattern theo loại màn

| Loại màn | Pattern | Selector / thành phần | Route mẫu |
| --- | --- | --- | --- |
| Danh sách có bảng | [list](docs/list.md) | `sd-page-list` + `sd-table` | `product`, `order`, `customer`, `category` |
| Xem một bản ghi | [detail](docs/detail.md) | `sd-page-detail` | `product/:id/detail`, `order/:id/detail`, `customer/:id/360` |
| Tạo / cập nhật một bước | [form](docs/form.md) | `sd-page-form` (`toc` khi nhiều nhóm) | `product/create`, `order/create`, `settings` |
| Quy trình nhiều bước | [flow](docs/flow.md) | `sd-page` hẹp + `sd-stepper`, nút bước ở footer | `import`, `partner/create` |
| Xem / sửa ngay trên danh sách | [drawer](docs/drawer.md) | `sd-side-drawer` trong route con | `customer/create`, `customer/:id/detail`, `category/:id/update` |
| Xử lý nhanh từng mục | [split](docs/split.md) | `sd-page-list detail="none"` + `sd-splitter` | `approval` |
| Chọn entity / enum | [select](docs/select.md) | wrapper `<entity>-select` của feature sở hữu entity | `product-select`, `customer-select` |
| Hiện quan hệ theo ID | [relation](docs/relation.md) | pipe `<entity>Detail` | `customerDetail`, `productDetail` |
| Nút ở header | [header-actions](docs/header-actions.md) | `headerRight`, Action Popover của `sd-button` | `product` (menu Nhập/Xuất) |
| Đang tải, rỗng, lỗi, thiếu quyền | [states](docs/states.md) | `sd-table`, `sd-data-state`, resolver, guard | mọi route |

Không có loại màn phù hợp: dùng `sd-page` và ghép các pattern trên. Có màn thứ ba cùng loại mới tách thành selector hoặc pattern riêng.

## Gắn vào portal

Route `pattern` của host lazy-load `SD_PATTERN_ROUTES` và đặt `provideSdPatterns({ mockApi: true })` trong `providers` của chính route đó. Interceptor mock chỉ chạy trên `HttpClient` con của route này; quyền mẫu (`SdPermissionService`, `SdPermissionGuard`, `SD_PERMISSION_CONFIGURATION`) cũng được cấp lại ở đây nên không đụng quyền của host. `mockApi: false` + `apiBaseUrl` cho service gọi API thật. Lỗi tải bản ghi trước khi mở trang (404, 403, timeout) đi tới navigation error handler của host; `forbiddenUrl` là trang host mở khi vai trò thiếu quyền vào route.

Thanh công cụ dưới cùng của `/pattern` (vai trò, độ trễ, lỗi giả lập, khôi phục dữ liệu, xem source) và drawer "Tuỳ chỉnh hiển thị" của `/pattern/order` thuộc `core/pattern-shell`, không phải code của feature: không chép sang màn thật.

## Cấu trúc một feature

```text
features/<entity>/
  routes.ts               route list + route con (create, :id/detail, :id/update), service cấp ở đây
  entity.resolver.ts      tải bản ghi bằng detail(id) trước khi mở trang
  services/<entity>.model.ts  DTO, Req, const/enum, badge
  services/<entity>.service.ts  gọi API qua BaseApiService; không biết có mock hay không
  pages/list|detail|create|update/  trang có route
  components/             -form, -view, -select, *-side-drawer của entity
  pipes/<entity>-detail.pipe.ts  relation theo ID cho màn khác
```

Tên feature đã có trong đường dẫn, không lặp lại trong tên file bên trong. Dựng feature mới: chép thư mục entity gần nhất rồi đổi tên.

## Quyết định đã chốt

| Mã | Quyết định |
| --- | --- |
| E1 | Danh sách vừa khít màn hình, không có scrollbar ngoài; chỉ vùng dữ liệu của bảng cuộn. Feature không viết chiều cao hay SCSS cho danh sách. |
| E2 | `backLink` hiện nút ← trước title; title, mô tả và tối đa hai badge truyền qua input. |
| E3 | Nút Lưu của page nằm ở `headerRight`; drawer và flow đặt nút ở footer. |
| E4 | Drawer chỉ đóng bằng X (cùng Esc, backdrop); không có nút Đóng/Huỷ thường trực. |
| E5 | Dùng "Cập nhật <entity>", không dùng "Chỉnh sửa". |
| E6 | Không dùng quick search cùng external filter trên một màn; mỗi field chỉ một chỗ lọc. |
| E7 | Giữ mặc định `hideInlineFilter: false`; màn ít dữ liệu dùng `'auto'`; không dùng `true`. |
| E8 | Flow là pattern: `sd-page` + `sd-stepper`, giữ dữ liệu khi đổi bước. |
| E9 | Drawer 480px mặc định, 600px cho chi tiết và form thường, tối đa 800px. |
| E10 | Code trong tài liệu được trích từ `features/`; khối lệch code thì kiểm tra trong CI thất bại. |
| E11 | Tài liệu không ghi chú theo version; khác biệt giữa version ghi ở CHANGELOG. |
| E12 | `features/*` theo cấu trúc project-structure của Blueprint. |
| E13 | Sau lưu: page sang chi tiết, drawer đóng và danh sách tải lại. Lưu lỗi: focus field lỗi đầu tiên, lỗi API gắn vào field. Xoá, duyệt, từ chối, mọi tác vụ đổi trạng thái đều hỏi xác nhận, cả từng bản ghi lẫn hàng loạt; hàng loạt báo kết quả từng phần và cho thử lại phần lỗi. |

## Mã quyền

`PATTERN_<ENTITY>_<R|C|U|D>_<ACTION>`: R đọc, C tạo, U đổi một bản ghi (cập nhật và mọi tác vụ trạng thái), D xoá. Feature ghi thẳng mã trong `data.permission` và `*sdPermission`; vai trò mẫu (Quản trị, Nhân viên không xoá không duyệt, Chỉ xem) nằm trong `core/permission`.

## Đóng góp

Thêm hoặc sửa một màn mẫu:

- [ ] Route trong `SD_PATTERN_ROUTES` và dòng trong mục lục `/pattern` (`core/pattern-shell/catalog`).
- [ ] Resource của mock API trong `core/mock-api/resources`, seed cố định.
- [ ] Mã quyền mới có trong `core/permission/pattern-permission.ts`; mã không còn dùng thì xoá.
- [ ] Tài liệu trong `docs/` trỏ tới file của feature bằng marker `@source`; chạy `npm run pattern:docs` (cập nhật cả manifest của tab Source).
- [ ] Playwright cho route trong `showcase/e2e/pattern/`.
- [ ] Quy tắc review: không có chiều cao hay `overflow` tự viết trong danh sách, không có `hideInlineFilter: true`, không có nút Đóng thường trực trong drawer, không có chữ "Chỉnh sửa".
