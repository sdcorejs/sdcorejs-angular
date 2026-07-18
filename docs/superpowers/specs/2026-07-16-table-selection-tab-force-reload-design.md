# Thiết kế sửa chọn tất cả và reload tab

**Ngày:** 2026-07-16
**Repo:** `sdcorejs-angular`
**Phạm vi nguồn:** `versions/v19/projects/sdcorejs-angular/components/{table,tab-router}`; sau đó rollout sang v20/v21

## Mục tiêu

1. `sd-table` không được chọn checkbox đang disabled khi người dùng bấm chọn tất cả.
2. `sd-tab-router` hỗ trợ navigation state `forceReload: true`. Nếu tab đích đã tồn tại, component của tab đó phải bị hủy và tạo lại thay vì chỉ được activate.
3. Giữ nguyên hành vi cũ khi không truyền `forceReload`.

## Nguyên nhân hiện tại

### `sd-table`

`selectionVisible` có thể đặt `row.meta.selector.selectable = true`. Trong nhánh selector có actions, `selectionDisabled` trả về `true` cho checkbox disabled nhưng không đồng bộ lại `selectable = false`. `onSelectAll()` chỉ đọc `selectable`, vì vậy vẫn chọn dòng đang disabled.

### `sd-tab-router`

Tab được nhận diện bằng hash của URL và query params. Khi key đã tồn tại, outlet cố ý giữ nguyên tab object và injector để giữ sống component. Đây là hành vi đúng cho navigation thường nhưng khiến tab không thể reload có chủ đích.

## Thiết kế

### 1. Selection eligibility của `sd-table`

- `selectionDisabled` phải tính một kết quả disabled cuối cùng và luôn đồng bộ `row.meta.selector.selectable` với kết quả đó ở mọi nhánh, bao gồm selector có actions.
- Dòng đã selected tiếp tục được enable để người dùng có thể bỏ chọn, giữ tương thích với `preserveSelection`.
- `onSelectAll()` chỉ thay đổi các dòng có `selectable === true` và action tương thích.
- Trạng thái "đã chọn tất cả" chỉ xét tập dòng selectable; dòng disabled không làm header checkbox sai trạng thái.
- Group select-all tiếp tục dùng cùng cờ `selectable`, vì vậy tự động loại dòng disabled.

### 2. Navigation state `forceReload`

API sử dụng:

```ts
this.router.navigate(['/employees', id], {
  state: { forceReload: true },
});
```

Quy tắc:

| Tab đích | `forceReload` | Kết quả |
| --- | --- | --- |
| Chưa tồn tại | `false` hoặc không truyền | Mở tab mới như hiện tại |
| Chưa tồn tại | `true` | Mở tab mới như hiện tại |
| Đã tồn tại | `false` hoặc không truyền | Chỉ activate, giữ component/injector hiện tại |
| Đã tồn tại | `true` | Thay tab instance/injector tại đúng vị trí cũ; component cũ bị destroy và component mới được tạo |

- Số lượng và thứ tự tab không đổi khi reload một tab đã tồn tại.
- `replaceTab` và `forceReload` trực giao. Nếu cùng là `true`, `replaceTab` loại active tab khác còn `forceReload` tái tạo tab đích đã tồn tại.
- `forceReload` là yêu cầu hủy state có chủ đích nên bỏ qua `beforeClose`, giống đường `replaceTab` hiện tại. Tài liệu phải nêu rõ hành vi này.
- Navigation cùng URL đang active thường bị Angular bỏ qua. Outlet sẽ nhận diện navigation skipped có `forceReload` và chạy lại activation cho route hiện tại để option vẫn có tác dụng.
- Pane và nav item phải được track theo instance/injector (fallback về key) để tab reload thực sự tạo lifecycle mới và subscription metadata không bám tab object cũ. Navigation thường vẫn giữ injector nên không recreate.

## Kiểm thử TDD

### `sd-table`

- Pipe: selector có bulk action và predicate disabled trả `true` phải trả disabled đồng thời đặt `selectable = false`.
- Component: chọn tất cả với một dòng enabled và một dòng disabled chỉ chọn dòng enabled; `onSelectAll` chỉ nhận dòng enabled.
- Select-all state: bỏ qua dòng không selectable.

### `sd-tab-router`

- Navigation lại tab tồn tại không có `forceReload` giữ nguyên tab object/injector và component instance.
- Navigation với `forceReload: true` thay tab object/injector, gọi destroy cho instance cũ và tạo instance mới, không đổi count/order.
- Reload tab đang active qua same-URL skipped navigation vẫn hoạt động.
- `beforeClose` không được gọi và không chặn explicit force reload.
- Kết hợp `replaceTab: true` và `forceReload: true` cho đúng tập tab cuối cùng.

Mỗi test mới phải được chạy RED trước khi sửa production code, sau đó chạy GREEN và regression suite liên quan.

## Rollout và xác minh

1. Viết test và sửa source of truth trong `versions/v19`.
2. Cập nhật `sd-table.md` và `sd-tab-router.md`.
3. Chạy focused tests và build v19.
4. Chạy `npm run sync`, `npm run check:sync`, rồi build v20/v21.
5. Không chỉnh tay `published-docs/**`; archive được tạo ở release flow.
6. Giữ nguyên các thay đổi WIP hiện có trong `.sdcorejs`, `.superpowers` và generated showcase files.

## Ngoài phạm vi

- Không thêm method reload mới vào `SdTabRouterService`.
- Không đổi cách tạo key tab từ URL và query params.
- Không thay đổi hành vi đóng tab thông thường hoặc contract `beforeClose` ngoài explicit `forceReload`.
- Không refactor các phần table/tab-router không liên quan.
