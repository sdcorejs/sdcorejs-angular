# Kiến trúc Task registry và Job Progress

## Mục đích

`SdTaskService` quản lý long-running task theo stable ID bằng signal registry và reference-counted lease. Nhiều consumer cùng ID chia sẻ một polling/SSE transport; `SdJobProgress` trình bày normalized state mà không phụ thuộc endpoint hoặc queue provider.

Business state và transport state là hai contract riêng: lỗi mạng không tự biến một task đang chạy thành `failed`.

## Public entrypoints

| Entrypoint | Vai trò |
| --- | --- |
| `@sdcorejs/angular/services/task` | Service, state/source/view models, retry config và DI tokens |
| `SdTaskService.watch()` | Tạo lease hoặc dùng chung entry theo stable ID |
| `SdTaskService.update()` | Cập nhật source `manual` hoặc host-owned state |
| `@sdcorejs/angular/components/job-progress` | Standalone `SdJobProgress` component |

Nguồn canonical: `versions/v19/projects/sdcorejs-angular/services/task/` và `components/job-progress/`.

## State contracts

Business status:

```ts
type SdTaskStatus = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
```

Connection state:

```ts
type SdTaskConnectionState = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error';
```

Progress được normalize về `0..100`. `succeeded`, `failed` và `cancelled` là terminal và đóng transport ngay.

## Registry and lease data flow

```text
watch({ id, source })
  -> first lease creates entry + owns transport
  -> duplicate ID reuses state/view/connection signals
  -> poll | SSE | manual source updates normalized state
  -> SdJobProgress reads taskId or direct state
  -> final lease destroy aborts/closes source and removes entry
```

Source options của watcher thứ hai cùng ID được bỏ qua có chủ ý. Consumer phải dùng ID duy nhất cho một logical task đang active.

## Transport lifecycle

### Polling

- Gọi `load({ id, signal })`.
- Chờ request settle và normalize state.
- Chỉ sau đó mới schedule lượt kế tiếp, nên poll không chồng lấn.
- Teardown/terminal state abort `AbortSignal`.

### Server-sent events

- `SD_TASK_EVENT_SOURCE_FACTORY` tạo EventSource tại browser boundary.
- Message parser được tuần tự hóa bằng Promise queue.
- Parse/transport error đóng source cũ trước khi reconnect.
- Factory mặc định trả `null` trên SSR.

### Manual

Host tạo state ban đầu, gọi `update(id, patch)`, và có thể cung cấp cancel handler. Mode này phù hợp Web Worker hoặc transport do ứng dụng sở hữu.

## Retry and cancellation

Transport error lưu ở view/connection layer, tăng failure count và schedule bounded exponential backoff với jitter. `SD_TASK_RANDOM` tách nguồn jitter để test deterministic.

Manual retry chỉ được nhận khi connection đang `error`, hoặc business state là `failed`/`cancelled`. Healthy source không bị restart.

Cancel calls cùng task được coalesce bằng shared Promise. Rejection fail-closed: business status không bị đổi thành `cancelled`; lỗi được đưa vào view. Late callback bị generation token vô hiệu hóa sau teardown/restart.

## Presentation boundary

`SdJobProgress` nhận:

- `taskId` để resolve registry state;
- hoặc `state` trực tiếp, có precedence cao hơn;
- `mode: 'bar' | 'compact' | 'details'`;
- `title`, `message`, `showActions`;
- outputs `sdCancel`, `sdRetry`.

Registry mode tự delegate action rồi vẫn emit output cho analytics/host effects. Direct mode để host tự thực thi action.

ARIA progress được tính từ normalized state; transport/business error dùng alert semantics; reduced-motion tắt animation và width transition.

## Dependencies and SSR

- Angular signals, DI và `DestroyRef`.
- `DOCUMENT.defaultView` chỉ được truy cập qua EventSource factory.
- Không phụ thuộc backend schema ngoài `SdTaskState<TResult>`.
- Consumer chịu trách nhiệm auth/credentials cho poll/SSE và phải override factory nếu cần authenticated EventSource.

## Invariants

- Không poll chồng lấn.
- Một active ID chỉ có một transport owner.
- Transport error không tự đổi business status.
- Terminal state không giữ timer/request/EventSource.
- Teardown/restart làm callback cũ mất hiệu lực.
- Pending cancel/retry phản ánh ngay qua signal để UI disable action.

## Verification

- Service specs kiểm tra manual/poll/SSE, shared leases, non-overlap polling, backoff, retry eligibility, cancel coalescing, late callbacks và deterministic teardown.
- Component specs kiểm tra direct/registry precedence, actions, progress ARIA, errors, responsive modes và reduced motion.
- Showcase routes: `/v/latest/services/task/examples` và `/v/latest/components/job-progress/examples`.
- Release acceptance và browser evidence: `.sdcorejs/docs/angular/2026-07-23-07-24-production-ready-1-4-quality-gate.md`.
