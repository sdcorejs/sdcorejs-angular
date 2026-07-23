---
title: SdTable empty-result reload
track: angular
status: implemented
updated_at: 2026-07-23
source_of_truth: versions/v19/projects/sdcorejs-angular/components/table
---

# SdTable empty-result reload

## Mục đích

Khi consumer cấu hình `reload.visible: true`, `SdTable` luôn cho phép người dùng
bấm Reload dù lần tải gần nhất trả về `items.length === 0` hoặc `total === 0`.
Hành vi này giúp người dùng thử tải lại sau khi dữ liệu nguồn thay đổi hoặc lỗi
tạm thời mà không cần đổi bộ lọc hay rời khỏi màn hình.

## Public contract

```ts
const tableOption: SdTableOption<Row> = {
  type: 'server',
  items: async (filterReq, pagingReq) => api.search(filterReq, pagingReq),
  reload: { visible: true },
  paginate: { pageSize: 20 },
  columns: [{ field: 'name', type: 'string', title: 'Tên' }],
};
```

Contract hiển thị:

| Trạng thái | Reload | Export | Paginator |
| ---------- | ------ | ------ | --------- |
| `items.length === 0`, `total === 0` | Hiển thị và enabled khi `reload.visible` là `true` | Giữ điều kiện hiện tại; không hiển thị khi không có item | Giữ điều kiện hiện tại; ẩn khi tổng không vượt `pageSize` |
| Có dữ liệu | Không đổi | Không đổi | Không đổi |

Thay đổi không bổ sung input, output, type hoặc dependency mới. Callback
`reload.onReload` và luồng `SdTable.reload()` hiện có vẫn được giữ nguyên.

## Luồng xử lý

```text
reload.visible
  -> render SdButton
  -> user click
  -> SdTable.reload()
  -> gọi lại option.items(...)
  -> cập nhật items/total
  -> gọi reload.onReload nếu đã cấu hình
```

Template chỉ dùng `reload.visible` để quyết định render nút. Số lượng item không
còn được bind vào trạng thái `disabled`. Các predicate của export và paginator
không bị thay đổi.

## Source files

| Path | Trách nhiệm |
| ---- | ----------- |
| `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.html` | Render reload và giữ nguyên các predicate export/paginator |
| `versions/v19/projects/sdcorejs-angular/components/table/src/table.component.spec.ts` | Hồi quy empty-result: enabled, refetch, export hidden và paginator hidden |
| `versions/v19/projects/sdcorejs-angular/components/table/sd-table.md` | API reference công khai của component |
| `scripts/sync-multi-version-workspaces.ps1` | Mirror canonical v19 sang v20/v21 |
| `scripts/check-version-sync.mjs` | Xác nhận parity giữa ba Angular workspace |

`versions/v19` là source of truth. Không sửa tay logic dùng chung trong
`versions/v20` hoặc `versions/v21`.

## Test coverage

Suite `table.component.spec.ts` kiểm tra:

- nút reload vẫn được render và enabled khi server trả `{ items: [], total: 0 }`;
- click reload gọi lại `option.items`;
- export vẫn ẩn khi không có item;
- paginator vẫn mang class `d-none` khi `total === 0`.

Amendment test-only trong `preview-pdf.component.spec.ts` dùng type suy ra từ
`makeFakeDoc().getData()` để cùng test graph biên dịch trên TypeScript 5.9 của
Angular 21. Amendment không thay đổi runtime PDF.

## Verification

```powershell
npm --prefix versions/v19 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts
npm --prefix versions/v20 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts
npm --prefix versions/v21 run test -- sdcorejs-angular --watch=false --browsers=ChromeHeadless --code-coverage=false --include=projects/sdcorejs-angular/components/table/src/table.component.spec.ts
npm run lint:release
npm run check:sync
git diff --check
```

Evidence ngày 2026-07-23:

- focused `SdTable`: v19/v20/v21 đều `58/58` pass;
- focused PDF amendment: v19/v20/v21 đều `139/139` pass;
- release lint: pass trên v19/v20/v21;
- library build: pass trên v19/v20/v21;
- Showcase v19 build: pass;
- sync và whitespace guards: pass.
