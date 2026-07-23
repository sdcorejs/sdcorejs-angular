---
module: entity-picker-and-tree-select
title: Entity Picker và Tree Select
tracks: [angular]
generated_at: 2026-07-23T03:48:00+07:00
git_head: cc31df58253569ad19b2c90bf4e34f1077c7d954
routes:
  - { path: /v/latest/forms/entity-picker/examples, screen: showcase-entity-picker, permission: null }
  - { path: /v/latest/forms/tree-select/examples, screen: showcase-tree-select, permission: null }
permissions: []
entities: []
screens: [showcase-entity-picker, showcase-tree-select]
spec_refs: []
prd_refs: []
coverage: { total: 12, met: 12, partial: 0, missing: 0 }
---

# Entity Picker và Tree Select - Hướng dẫn sử dụng

## Chọn control phù hợp

- Dùng `SdEntityPicker` khi dữ liệu là danh sách lớn/remote, cần tìm kiếm, filter, sort và phân trang trong bảng.
- Dùng `SdTreeSelect` khi dữ liệu có quan hệ cha-con và người dùng cần mở/đóng nhánh.
- Cả hai control lưu `TKey` hoặc `TKey[]`, không lưu object trả về từ API.

## Entity Picker với API phân trang

```ts
readonly employeeProvider: SdEntityPickerDataProvider<Employee, number> = {
  load: request => this.employeeApi.search({
    search: request.query.search,
    filters: request.query.filters,
    pageIndex: request.pageIndex,
    pageSize: request.pageSize,
    orderBy: request.orderBy,
    orderDirection: request.orderDirection,
    signal: request.signal,
  }),
  hydrate: (keys, signal) => this.employeeApi.findByIds(keys, signal),
};
```

```html
<sd-entity-picker
  [form]="form"
  name="approverIds"
  label="Người duyệt"
  [provider]="employeeProvider"
  [columns]="employeeColumns"
  [queryFields]="employeeQueryFields"
  valueField="id"
  displayField="name"
  [disabledEntity]="isInactive"
  multiple />
```

`hydrate` rất quan trọng khi form mở với key không nằm trong trang đầu. Nó tải entity tương ứng để trigger hiển thị tên, nhưng model vẫn giữ key ổn định. Nếu API hỗ trợ hủy request, truyền `request.signal` xuống HTTP client; nếu không, component vẫn bỏ qua kết quả/lỗi đã lỗi thời.

Select-all chỉ thay đổi các dòng của trang đang nhìn thấy và giữ lựa chọn ở trang khác. Nút Apply mới ghi draft vào form; Cancel không làm thay đổi model.

## Template và luồng tạo mới

```html
<sd-entity-picker ... addable (sdAdd)="openCreateEmployee()">
  <ng-template sdEntityPickerSelected let-entities="entities"> {{ entities.length }} nhân viên </ng-template>
  <ng-template sdEntityPickerRow let-item="item"> <strong>{{ item.name }}</strong> · {{ item.departmentName }} </ng-template>
  <ng-template sdEntityPickerDetail let-entities="entities"> {{ entities[0]?.email }} </ng-template>
</sd-entity-picker>
```

Library chỉ emit `sdAdd`; ứng dụng quyết định quyền tạo, modal nghiệp vụ và thao tác refresh sau khi tạo.

## Tree Select static

```ts
readonly departmentItems: SdTreeItemStatic<Department>[] = departments.map(department => ({
  id: String(department.id),
  label: department.name,
  data: department,
  children: department.children?.map(child => ({
    id: String(child.id),
    label: child.name,
    data: child,
  })),
}));
```

```html
<sd-tree-select
  [form]="form"
  name="departmentIds"
  [items]="departmentItems"
  valueField="id"
  displayField="name"
  multiple
  cascade="descendants" />
```

Cascade chỉ áp dụng cho descendants đã load. Khi chỉ một phần children được chọn, parent hiển thị indeterminate. Node disabled không thể chọn bằng chuột hoặc bàn phím.

## Tree Select lazy

```ts
readonly treeOption: SdTreeLazyOption<Department> = {
  loadType: 'lazy',
  onExpandChildren: node => this.departmentApi.children(node.data.id),
};
```

```html
<sd-tree-select [items]="rootDepartments" [tree]="treeOption" valueField="id" displayField="name" (sdLoadError)="logTreeError($event)" />
```

Lỗi root có nút retry toàn cây; lỗi lazy nằm tại đúng node và retry riêng. Key chưa load hoặc đang bị filter ẩn vẫn được giữ trong model. Trong `viewed`, key chưa resolve hiển thị fallback dạng chuỗi thay vì biến mất.

## Bàn phím và focus

Trong tree, dùng Arrow Up/Down để di chuyển, Home/End để tới đầu/cuối, Arrow Right/Left để mở/đóng hoặc về parent, Space/Enter để chọn. Modal giữ focus trong dialog; sau khi đóng, focus quay lại trigger của control.

## Trạng thái form

`disabled` đăng ký đúng trạng thái Angular Forms và không mở modal. `readonly` vẫn giữ giá trị nhưng không cho chỉnh sửa. `viewed=true` hiển thị tĩnh. `required` chạy qua shared form connector và dùng cùng model key của control.

## Quyền truy cập

Hai control không tự quyết định permission. Ứng dụng host chịu trách nhiệm ẩn/disable control, lọc entity/node và kiểm tra quyền lại ở backend.

| Permission code | Tác vụ                         | Vai trò                     |
| --------------- | ------------------------------ | --------------------------- |
| -               | Xem/chọn entity hoặc tree node | Do ứng dụng host quyết định |
| -               | Tạo entity qua `sdAdd`         | Do ứng dụng host quyết định |

## Coverage so với yêu cầu

|   # | Tính năng                          | Trạng thái | Bằng chứng                   |
| --: | ---------------------------------- | ---------- | ---------------------------- |
|   1 | Single/multiple stable keys        | met        | picker specs                 |
|   2 | Server paging/search/sort          | met        | provider contract + Showcase |
|   3 | Abort và stale-result containment  | met        | race specs                   |
|   4 | Initial/off-page hydration         | met        | hydration specs              |
|   5 | Select-all giữ key ngoài page      | met        | regression spec              |
|   6 | Disabled/readonly/viewed/FormGroup | met        | connector specs              |
|   7 | Error/retry và focus restore       | met        | component/tree specs         |
|   8 | Static/lazy tree                   | met        | TreeSelect/Tree specs        |
|   9 | Single/cascade/indeterminate       | met        | Tree specs                   |
|  10 | Hidden/unloaded key preservation   | met        | TreeSelect specs             |
|  11 | Keyboard/ARIA                      | met        | Tree specs                   |
|  12 | Custom templates và i18n           | met        | compile/Showcase/parity      |

## Ảnh minh họa

- [ ] `images/entity-picker-showcase.png`
- [ ] `images/tree-select-showcase.png`

Khi Showcase đang chạy:

```bash
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
