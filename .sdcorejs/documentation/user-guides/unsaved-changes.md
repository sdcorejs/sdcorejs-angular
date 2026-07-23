---
module: unsaved-changes
title: Bảo vệ thay đổi chưa lưu
tracks: [angular]
generated_at: 2026-07-23T04:15:00+07:00
git_head: cc31df58253569ad19b2c90bf4e34f1077c7d954
routes:
  - { path: /v/latest/services/unsaved-changes/examples, screen: showcase-unsaved-changes, permission: null }
permissions: []
entities: []
screens: [showcase-unsaved-changes]
spec_refs: []
prd_refs: []
coverage: { total: 12, met: 12, partial: 0, missing: 0 }
---

# Bảo vệ thay đổi chưa lưu

`SdUnsavedChangesService` giúp một màn hình gom nhiều nguồn thay đổi, hỏi người dùng trước khi điều hướng/đóng UI, và cảnh báo khi reload hoặc đóng tab trình duyệt.

## Khi nào nên dùng

- Form tạo/sửa dữ liệu có thể bị rời màn hình trước khi save.
- Trang có nhiều editor hoặc widget, mỗi phần có dirty state riêng.
- Modal, side drawer, tab hoặc tab-router cần cùng một quy tắc xác nhận.
- Ứng dụng SSR cần tránh truy cập `window` trực tiếp.

Không đăng ký watcher cho dữ liệu chỉ đọc hoặc trạng thái UI có thể khôi phục tự động.

## Đăng ký một editor

```ts
readonly dirty = signal(false);
readonly unsaved = inject(SdUnsavedChangesService);

readonly editorRef = this.unsaved.register({
  id: 'customer-editor',
  scope: this.customerId,
  isDirty: this.dirty,
  message: 'Khách hàng có thay đổi chưa lưu.',
  save: async () => {
    await this.customerApi.save(this.form.getRawValue());
    this.dirty.set(false);
  },
  discard: () => this.dirty.set(false),
});
```

`id` chỉ cần duy nhất trong một `scope`. Đăng ký lại cùng scope/id sẽ trả đúng ref cũ. Hai scope khác nhau có thể dùng cùng id.

Khi component bị hủy:

```ts
inject(DestroyRef).onDestroy(() => this.editorRef.destroy());
```

## Dùng nhanh với FormGroup

```ts
readonly formRef = registerSdUnsavedChangesForm(this.unsaved, this.form, {
  id: 'customer-form',
  scope: this.customerId,
  save: value => this.customerApi.save(value),
});
```

- Adapter theo dõi `form.dirty` qua `form.events`.
- `discard()` và `reset()` mặc định trả form về snapshot đã lưu.
- Sau `save()` thành công, giá trị vừa lưu trở thành snapshot mới.
- `destroy()` tự unsubscribe.

Nếu callback trả `false`, throw hoặc reject, operation thất bại và dirty state được giữ lại.

## Chặn Angular route

```ts
const routes: Routes = [
  {
    path: 'customers/:id',
    component: CustomerEditorComponent,
    canDeactivate: [sdUnsavedChangesGuard],
  },
];
```

Guard mặc định xét toàn registry. Với page shell chứa nhiều scope, tạo guard ứng dụng gọi:

```ts
return unsaved.confirmLeave({ scope: customerId, reason: 'navigation' });
```

## Chặn đóng modal, drawer và tab

```ts
readonly beforeClose = createSdUnsavedChangesCloseGuard(this.unsaved, {
  scope: this.customerId,
});
```

```html
<sd-modal [beforeClose]="beforeClose" (sdCloseError)="report($event)">...</sd-modal>

<sd-side-drawer [beforeClose]="beforeClose" (sdCloseError)="report($event)">...</sd-side-drawer>

<sd-tab [beforeClose]="beforeClose" (closeError)="report($event)">...</sd-tab>
```

Không truyền `beforeClose` thì các component đóng đồng bộ như trước. Khi có guard:

- chỉ `true` mới đóng;
- `false`, throw hoặc reject đều giữ UI mở;
- nhiều click đóng trong lúc prompt đang chờ chỉ tạo một request;
- `forceClose()` chỉ nên dùng sau khi workflow save/discard đã hoàn tất chắc chắn.

Với TabRouter, inject `SD_TAB` và gán `tab.beforeClose = beforeClose`.

## Tùy biến hộp xác nhận

App có thể thay browser confirm bằng modal thiết kế riêng:

```ts
providers: [
  {
    provide: SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER,
    useValue: {
      confirm: context =>
        this.confirmDialog.open({
          message: context.message,
          actions: ['save', 'discard', 'cancel'],
        }),
    },
  },
];
```

Adapter trả `'save'`, `'discard'`, `'cancel'` hoặc boolean. `true` tương đương discard, `false` tương đương cancel. Lỗi adapter luôn fail closed.

## Reload và đóng trình duyệt

Service chỉ gắn listener `beforeunload` khi có ít nhất một watcher dirty. Listener được tháo ngay khi sạch hoặc khi service bị hủy. Trình duyệt có thể hiển thị thông báo mặc định thay vì message tùy biến; đây là giới hạn của browser, không phải lỗi service.

## Checklist tích hợp

- [ ] Mỗi watcher có scope/id ổn định.
- [ ] Callback save/discard cập nhật nguồn dirty thật.
- [ ] Registration được destroy cùng lifecycle feature.
- [ ] Route guard và close hook dùng đúng scope.
- [ ] Adapter có đủ save/discard/cancel và xử lý lỗi.
- [ ] Không gọi `forceClose()` trước khi save/discard hoàn tất.
- [ ] Kiểm thử reload, route navigation, close icon, backdrop và Escape.

## Troubleshooting

| Hiện tượng                      | Kiểm tra                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| Prompt không xuất hiện          | `registration.dirty()` có đang `true`; scope guard có đúng không.                                |
| Save xong vẫn bị hỏi            | Callback phải cập nhật dirty source hoặc dùng FormGroup adapter.                                 |
| Hai editor nhập thành một       | Dùng scope khác nhau hoặc id khác nhau trong cùng scope.                                         |
| UI đóng khi confirmation lỗi    | Không bypass bằng `forceClose`; dùng `beforeClose`/`requestClose`.                               |
| SSR lỗi `window is not defined` | Không dùng `window` trực tiếp; để token mặc định hoặc provide `SD_UNSAVED_CHANGES_WINDOW: null`. |

## Ảnh tài liệu

- [ ] `images/unsaved-changes-showcase.png`

Capture khi Showcase đang chạy:

```powershell
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
