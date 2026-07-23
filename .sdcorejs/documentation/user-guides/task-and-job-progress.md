# Theo dõi tác vụ dài và hiển thị tiến độ

Dùng `SdTaskService` khi import, export hoặc xử lý báo cáo tiếp tục chạy sau request khởi tạo. Service gom trạng thái theo stable ID; `SdJobProgress` chỉ hiển thị normalized state và không cần biết backend dùng polling, SSE hay transport riêng.

## Chọn cách theo dõi

| Trường hợp | Source mode |
| --- | --- |
| Backend có endpoint lấy trạng thái | `poll` |
| Backend phát Server-Sent Events | `sse` |
| Web Worker hoặc host tự cập nhật | `manual` |

Business status hợp lệ: `idle`, `queued`, `running`, `succeeded`, `failed`, `cancelled`. Progress nếu có nằm trong `0..100`.

## Import

```ts
import { DestroyRef, inject } from '@angular/core';
import { SdTaskService } from '@sdcorejs/angular/services/task';
import { SdJobProgress } from '@sdcorejs/angular/components/job-progress';
```

## Theo dõi bằng polling

```ts
readonly tasks = inject(SdTaskService);
readonly exportRef = this.tasks.watch<{ downloadUrl: string }>({
  id: this.exportId,
  source: {
    mode: 'poll',
    intervalMs: 2_000,
    load: async ({ id, signal }) => {
      const response = await fetch(`/api/tasks/${id}`, { signal });
      return response.json();
    },
    cancel: ({ id }) => fetch(`/api/tasks/${id}/cancel`, { method: 'POST' }).then(() => undefined),
  },
});

constructor() {
  inject(DestroyRef).onDestroy(() => this.exportRef.destroy());
}
```

```html
<sd-job-progress [taskId]="exportId" mode="details" (sdCancel)="trackCancel()" />
```

Polling không tạo request mới khi request trước chưa xong. Lỗi mạng chuyển connection sang reconnecting và retry theo backoff có giới hạn; business state vẫn giữ nguyên.

## Theo dõi bằng SSE

```ts
readonly importRef = this.tasks.watch({
  id: this.importId,
  source: {
    mode: 'sse',
    url: `/api/tasks/${this.importId}/events`,
    parse: event => JSON.parse(event.data),
    retry: { maxAttempts: 5, initialDelayMs: 1_000 },
  },
});
```

Nếu endpoint cần auth không tương thích native EventSource, cung cấp `SD_TASK_EVENT_SOURCE_FACTORY` phù hợp. SSE mặc định không mở trên SSR.

## Cập nhật thủ công

```ts
readonly localRef = this.tasks.watch({
  id: 'local-import',
  initialState: { id: 'local-import', status: 'queued' },
  source: { mode: 'manual', cancel: () => this.worker.cancel() },
});

start(): void {
  this.tasks.update('local-import', { status: 'running', progress: 25 });
}
```

## Chọn chế độ hiển thị

- `bar`: mặc định, phù hợp panel hoặc trang chi tiết.
- `compact`: dùng trong danh sách hoặc toolbar hẹp.
- `details`: thêm message chi tiết từ task.

Nếu không dùng registry, truyền `[state]` trực tiếp và xử lý `(sdCancel)` / `(sdRetry)` ở component cha. Dùng `[showActions]="false"` cho màn hình chỉ đọc.

## Cancel và retry

- Cancel nhiều lần trong khi request đang pending chỉ gọi handler một lần.
- Cancel lỗi giữ nguyên business state và hiển thị lỗi; không báo thành công giả.
- Retry chỉ hoạt động khi transport đã hết lượt hoặc task đang `failed`/`cancelled`.
- Với `taskId`, component delegate vào service rồi vẫn emit output.

## Quản lý vòng đời

Nhiều component theo dõi cùng ID dùng chung kết nối. Mỗi `watch()` vẫn tạo một lease và phải gọi `destroy()`; chỉ lease cuối đóng transport và xóa entry.

Không tái sử dụng một active ID cho công việc khác. Khi route/component đổi ID, hủy lease cũ trước khi theo dõi ID mới.

## Accessibility và vận hành

- Determinate progress có `aria-valuenow`; indeterminate progress không có.
- Error dùng live alert; action là native button.
- Reduced-motion preference tắt animation.
- Phân biệt transport error (`view.error`) với task thất bại (`state.error`).
- Không nhúng endpoint, queue name hoặc error kỹ thuật nhạy cảm vào title/message cho người dùng.

## Xử lý sự cố

| Hiện tượng | Kiểm tra |
| --- | --- |
| Hai backend request song song | Mỗi ID phải dùng một shared registry entry; không tự tạo timer bên ngoài |
| Task không biến mất khi rời trang | Mọi lease đã gọi `destroy()` chưa |
| Retry không chạy | Task/connection đã ở trạng thái cho phép retry chưa |
| SSE lỗi ngay trên server render | Đang dùng factory mặc định hoặc SSR-safe override chưa |
| Cancel báo lỗi nhưng trạng thái vẫn running | Đây là fail-closed contract; hiển thị lỗi và cho phép người dùng thử lại |

Showcase: `/v/latest/services/task/examples` và `/v/latest/components/job-progress/examples`. Script ảnh dùng hai mục tương ứng trong `capture-screenshots.playwright.mjs`.
