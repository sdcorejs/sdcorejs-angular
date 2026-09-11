# Read state và migration

Các type public nằm tại `@sdcorejs/angular/utilities/read-state` và barrel
`@sdcorejs/angular/utilities`:

```ts
import type { SdReadState, SdReadStatus, SdReadOperation, SdSearchReadState } from '@sdcorejs/angular/utilities/read-state';
```

| Status | Ý nghĩa |
| --- | --- |
| `idle` | Chưa có lần đọc áp dụng, hoặc ngữ cảnh cũ đã bị vô hiệu |
| `loading` | Đang thực hiện lần đọc hiện hành |
| `ready` | Đọc thành công, có dữ liệu |
| `empty` | Đọc thành công, không có dữ liệu |
| `error` | Đọc thất bại; snapshot có `error: unknown` nguyên bản |

Mỗi snapshot readonly có `status` và `operation` (`TABLE`, `VALUE`, `SEARCH`).
Chỉ nhánh `error` có thuộc tính `error`; cần narrow bằng `status` trước khi đọc.
Snapshot và object `channels` được freeze; exception giữ nguyên identity.
`ready` là kết quả đọc, không phải một giá trị mới của `SdDataStateKind`.

## API chung của control

| API | Hành vi |
| --- | --- |
| `readState()` | Signal readonly; đọc snapshot hiện hành |
| `(sdReadStateChange)` | Output đồng bộ khi một channel chuyển state; không phát initial idle |
| `retryRead()` | Retry lỗi còn hiệu lực, không đổi model/filter/page để tải lại |
| `[hideReadError]` | Boolean transform, mặc định `false`; ẩn toàn bộ vùng lỗi mặc định và custom |

`SdTable` trả `SdReadState`; hai form control trả `SdSearchReadState` có thêm
`channels.VALUE` và `channels.SEARCH`. Lỗi VALUE được ưu tiên hiển thị, sau đó lỗi
SEARCH; khi không có lỗi VALUE, SEARCH khác idle được hiển thị, nếu SEARCH idle
thì dùng VALUE. Thành công trên một kênh không xóa lỗi ở kênh kia.
`loading()` tổng hợp cả hai kênh và giai đoạn debounce; do đó có thể đang loading
trong khi snapshot tổng hợp vẫn báo lỗi của kênh còn lại. UI tích hợp của
select/autocomplete ưu tiên loading, tạm ẩn vùng lỗi trong khoảng này để không
hiện spinner cùng lỗi. Sau khi loading kết thúc, lỗi còn hiệu lực được hiện lại;
không xóa lỗi khỏi snapshot chỉ để thay đổi cách trình bày.

Khi cả hai cùng lỗi, `retryRead()` xử lý VALUE trước. Sau VALUE thành công, lỗi
SEARCH còn nguyên để retry tiếp. Gọi liên tiếp trong khi kênh đang retry không
tạo request trùng. Không có retry tự động.

## Request, cache và lifecycle

Request lưu loader cùng bản sao tham số tại thời điểm đọc. Retry nhận bản sao mới
của snapshot để loader không sửa tham số của các lần retry sau. Bảng giữ đủ filter,
paging và sort. Select/autocomplete giữ đúng `type`, `value` hoặc `searchText`.

Guards xét revision cùng context: loader, value/text, checksum, trường value/display;
bảng còn xét option và filter/paging/sort. Thay đổi context hoặc destroy làm kết
quả cũ không được cập nhật state, danh sách, label, cache hoặc loading của request mới.
Resize cột bảng chỉ đổi trình bày nên không hủy request đang chạy. Đóng/blur
autocomplete có đổi text sẽ vô hiệu SEARCH cũ; chuyển focus vào retry giữ text.

Cache lazy chỉ nhận kết quả thành công, kể cả `[]`. Lỗi không tạo cache entry hoặc
placeholder entry để che lỗi VALUE. Retry bỏ qua cache của request thất bại.
Core không tự xóa form value/selection và không phát `sdChange` do lỗi hoặc retry.
Dữ liệu cũ có thể vẫn hiển thị khi lần đọc mới lỗi; host xem read-state để biết lần
đọc hiện hành thất bại. Bảng giữ rows và total đã có cho đến lần đọc thành công.

## Host sở hữu UI lỗi

```ts
import { signal } from '@angular/core';
import type { SdReadState } from '@sdcorejs/angular/utilities/read-state';

readonly state = signal<SdReadState>({ status: 'idle', operation: 'SEARCH' });
```

```html
<sd-select #picker [items]="loadOptions" valueField="id" displayField="name"
  hideReadError (sdReadStateChange)="state.set($event)">
</sd-select>
@if (!picker.loading() && state().status === 'error') {
  <sd-data-state state="error" compact retryable (sdRetry)="picker.retryRead()" />
}
```

Đặt `ng-template[sdDataStateTemplate]` **trực tiếp trong control** để override
vùng state tích hợp. Control chuyển tiếp context rõ ràng tới component con.
`hideReadError=true` ẩn cả template override, nhưng state/output/retry vẫn hoạt động.
`retry` trong template gọi đúng `control.retryRead()`; `action` không tự chọn item.
Template không nhận exception; host đọc error qua signal/output nếu cần xử lý.

Nút mặc định dùng `type="button"`, nằm ngoài `mat-option`. Khi panel lỗi mở,
Tab từ trigger/input chuyển tới retry; Enter/Space kích hoạt nút, Escape trả focus
và đóng panel. Retry giữ panel và không chọn option hoặc submit form.
Template custom nên dùng button chuẩn hoặc `tabindex="0"` cho phần tử focus đầu tiên.

## Migration từ wrapper ở consumer

1. Bỏ việc suy luận unavailable/error từ `options.length === 0`.
2. API thành công với `[]`, `{ items: [], total: 0 }` hoặc `options.UNIT_TYPE: []`
   là **empty hợp lệ**. Core không dự đoán lỗi từ độ dài dữ liệu.
3. Muốn core nhận biết lỗi, để Promise reject / Observable error đi tới control.
   Autocomplete giữ hỗ trợ Observable của runtime hiện có; chữ ký `SdSearch`
   public vẫn là Promise như trước.
4. Nếu consumer đã `catch` và trả `[]`, core không thể biết lỗi ban đầu và sẽ báo
   `empty`. Giữ catch như vậy khi đó là fallback thành công có chủ đích.
5. Dùng `sdReadStateChange` cho wrapper/notice của host; dùng `hideReadError` để
   tránh hai vùng lỗi. Không cần sửa toàn bộ consumer để dùng các API mới.

Đây là API bổ sung. Static/local controls và chữ ký `items`/`SdSearch` giữ nguyên.
Hành vi thay đổi có chủ đích là reject/error không còn bị chuyển thành empty giả.
