---
module: angular-modern-api-migration
title: Hướng dẫn dùng library sau Angular modern API migration
tracks: [angular]
generated_at: 2026-07-20T14:54:56+07:00
git_head: f8c39ec636772eba10734dd64e7838302addeec8
routes: []
permissions: []
entities: []
screens: []
spec_refs: []
prd_refs: []
coverage: { total: 6, met: 6, partial: 0, missing: 0 }
---

# Hướng dẫn dùng library sau Angular modern API migration

## Tổng quan

Các component của `@sdcorejs/angular` đã bắt đầu dùng signal inputs, signal outputs và field-level `inject()`. Binding trong template vẫn tương thích; ứng dụng đang dùng component qua HTML không cần đổi chỉ vì migration này.

Guide này dành cho developer sử dụng hoặc kế thừa class của library. Migration không tạo route, màn hình, permission hay domain entity mới.

## Template consumer

Input/output names không đổi, vì vậy cách bind hiện tại tiếp tục hoạt động:

```html
<sd-component [value]="selectedValue" (sdChange)="selectedValue = $event"> </sd-component>
```

Không cần thêm provider hoặc cấu hình application root. v19, v20 và v21 nhận cùng public behavior sau khi source v19 được đồng bộ.

## TypeScript consumer

Khi truy cập trực tiếp instance của component, cần phân biệt API cũ và API đã migrate:

```ts
// Signal input: đọc bằng lời gọi hàm.
const currentValue = component.value();

// Signal output: emit và subscribe theo Angular output contract.
component.sdChange.emit(nextValue);
const subscription = component.sdChange.subscribe(value => handle(value));
subscription.unsubscribe();
```

Không ghi trực tiếp vào signal input và không dựa vào RxJS-specific methods như `pipe()`, `complete()` hoặc `error()` trên output đã migrate. Trong test, ưu tiên tạo component qua Angular TestBed và đặt input bằng `fixture.componentRef.setInput(...)`.

## Khi kế thừa component/service

Những class được chuyển sang `inject()` vẫn có compatibility constructor khi cần giữ inheritance contract của public library. Lớp kế thừa nên gọi `super()` và để Angular tạo instance trong injection context.

Không khởi tạo trực tiếp bằng `new` một class dùng field `inject()`. Nếu cần unit test, dùng `TestBed.runInInjectionContext(...)` hoặc fixture phù hợp. `VariableComponent` là ngoại lệ đã biết và vẫn nhận `ChangeDetectorRef` qua constructor vì library có call site direct construction.

## Outputs còn dùng `EventEmitter`

Một số outputs chủ đích chưa đổi:

| Component                  | Output             | Lý do                                          |
| -------------------------- | ------------------ | ---------------------------------------------- |
| `SdBadge`                  | `click`            | UI kiểm tra có listener qua `.observed`        |
| `SdAutocomplete`           | `sdAdd`            | Add action chỉ render khi có listener          |
| `SdInput`, `SdInputNumber` | `sdFocusForceBlur` | Focus behavior kiểm tra `.observed`            |
| `GenericSelectComponent`   | ba outputs hiện có | Cần thống nhất type contract trước khi migrate |

Consumer không cần xử lý khác cho các output này trong template.

## Quy trình đóng góp thay đổi

Khi sửa code dùng chung, chỉ chỉnh source tại `versions/v19`, sau đó chạy:

```powershell
npm run sync
npm run check:sync
npm run lint:release
```

Nếu thêm hoặc đổi input/output, cần test cả template binding và direct TypeScript access. Nếu đổi constructor DI, tìm tất cả call site `new ClassName(...)` trước khi dùng `inject()`.

## Troubleshooting

| Hiện tượng                                                  | Nguyên nhân thường gặp                                            | Cách xử lý                                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `TypeError: component.value is not a function`              | Test/consumer đang dùng contract cũ hoặc dist chưa build lại      | Build đúng workspace và đọc signal input bằng `value()`                                         |
| `NG0203: inject() must be called from an injection context` | Class dùng `inject()` bị khởi tạo trực tiếp bằng `new`            | Tạo qua Angular DI/TestBed hoặc giữ constructor DI nếu direct construction là contract bắt buộc |
| Không có `.pipe()` trên output                              | Output đã là `OutputEmitterRef`, không còn là RxJS `EventEmitter` | Dùng `.subscribe()` hoặc bind trong template; chuyển RxJS orchestration ra service/state layer  |
| v20/v21 khác v19                                            | Sửa trực tiếp derived workspace hoặc chưa chạy sync               | Khôi phục source of truth ở v19 rồi chạy `npm run sync` và `npm run check:sync`                 |

## Coverage so với yêu cầu

|   # | Yêu cầu                                            | Trạng thái | Được mô tả tại                  |
| --: | -------------------------------------------------- | ---------- | ------------------------------- |
|   1 | Template bindings tiếp tục tương thích             | ✅ đạt     | Template consumer               |
|   2 | Direct TypeScript access dùng đúng signal contract | ✅ đạt     | TypeScript consumer             |
|   3 | Inheritance và DI context được lưu ý               | ✅ đạt     | Khi kế thừa component/service   |
|   4 | Ngoại lệ `EventEmitter` được nhận diện             | ✅ đạt     | Outputs còn dùng `EventEmitter` |
|   5 | v19 là source of truth và sync sang v20/v21        | ✅ đạt     | Quy trình đóng góp thay đổi     |
|   6 | Lỗi phổ biến có cách xử lý                         | ✅ đạt     | Troubleshooting                 |

## Danh sách ảnh minh họa

Không áp dụng: đây là migration API/library, không có màn hình hoặc route riêng để capture. Script screenshot chung vẫn được duy trì cho các user guide có UI:

```bash
SDCOREJS_DOCS_BASE_URL=http://localhost:4200 node .sdcorejs/documentation/user-guides/capture-screenshots.playwright.mjs
```
