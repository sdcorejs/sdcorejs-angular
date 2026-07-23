---
title: Unsaved changes architecture
track: angular
status: implemented-in-v19
updated_at: 2026-07-23
source_of_truth: versions/v19/projects/sdcorejs-angular
---

# Unsaved changes architecture

## Phạm vi

Task 10 thêm secondary entrypoint `@sdcorejs/angular/services/unsaved-changes`, functional route guard, FormGroup/close adapters, và hook additive cho Modal, SideDrawer, Tab, TabRouter. V19 là source-of-truth; rollout v20/v21 thuộc Task 14.

## Luồng quyết định

```text
dirty sources -> SdUnsavedChangesService registry
              -> beforeunload (browser only, dirty only)
              -> confirmLeave(scope, reason)
                 -> SD_UNSAVED_CHANGES_CONFIRMATION_ADAPTER
                    -> save    -> saveAll(scope)
                    -> discard -> discardAll(scope)
                    -> cancel  -> false
                    -> error   -> false (fail closed)
```

Route guard và close hooks chỉ là adapters mỏng; Modal/Drawer/Tab không import service. Điều này tránh cycle từ component entrypoints về services và cho phép consumer dùng guard khác.

## Registry identity

Registration identity là cặp `(scope, id)`:

- so sánh scope bằng `Object.is`;
- register lặp trả cùng ref;
- cùng id ở scope khác tạo ref khác;
- ref destroy idempotent;
- watcher bị bỏ qua do duplicate vẫn chạy `cleanup` ngay để không rò subscription.

Registry dùng signal array vì scope có thể là primitive hoặc object; string key ghép thủ công sẽ làm mất identity object và dễ collision.

## Dirty source

`isDirty` nhận boolean, Angular `Signal<boolean>` hoặc function. Registration cung cấp `markDirty()`/`markPristine()` cho các nguồn không có signal riêng. Callback save/reset/discard sở hữu việc cập nhật dirty source; service chỉ tổng hợp và tuần tự hóa action.

Actions chạy tuần tự trên snapshot watcher đang dirty và dừng ở failure đầu tiên. `false`, throw, và rejection đều trả `false`.

## Prompt concurrency

Pending prompt được coalesce theo exact scope:

- cùng scope nhận cùng một Promise;
- scope khác không tái sử dụng quyết định;
- entry pending được xóa trong `finally` chỉ khi vẫn là request hiện tại.

Coalesce toàn cục là không an toàn: prompt scope A có thể trả `true` cho caller scope B dù watcher B chưa save/discard. Vì vậy pending registry dùng `Map<unknown, Promise<boolean>>`.

## FormGroup adapter

`registerSdUnsavedChangesForm`:

1. clone `getRawValue()` làm snapshot;
2. subscribe `form.events` để mirror `form.dirty`;
3. save thành công đánh pristine và promote raw value thành snapshot mới;
4. reset/discard mặc định clone snapshot trở lại form;
5. đưa unsubscribe vào watcher `cleanup` để service quản lý một lifecycle duy nhất.

Clone hỗ trợ object, array và Date; không giữ object identity. Consumer có custom class/Map/Set nên cung cấp callback reset/discard riêng.

## Close hooks

Modal, SideDrawer và Tab có chung contract:

```ts
type BeforeClose = () => boolean | Promise<boolean>;
requestClose(): Promise<boolean>;
forceClose(): void;
```

- `close()` không hook giữ hành vi đồng bộ cũ.
- `requestClose()` coalesce request đang chờ.
- chỉ `true` gọi `forceClose()`.
- error phát output (`sdCloseError` hoặc `closeError`) và resolve `false`.
- Modal đặt Material `disableClose=true` khi có guard, rồi route backdrop/Escape qua `requestClose()` để Material không bypass callback.
- TabGroup giữ `tabClosed` đồng bộ khi không guard; khi có guard chỉ emit sau result true.
- TabRouter đổi exception path từ fail-open sang fail-closed.

## Browser/SSR

`SD_UNSAVED_CHANGES_WINDOW` factory đọc `DOCUMENT.defaultView`. Khi null:

- service vẫn theo dõi dirty state;
- không đăng ký `beforeunload`;
- native confirmation adapter trả cancel;
- không có global access tới `window` trong constructor/module evaluation.

Effect `beforeunload` đăng ký listener chỉ khi `dirty()` true và dùng `onCleanup` để tháo khi state đổi. DestroyRef đánh destroyed cho refs, chạy watcher cleanup, xóa registry và pending map.

## Public surface

| File                                 | Responsibility                                                   |
| ------------------------------------ | ---------------------------------------------------------------- |
| `unsaved-changes.model.ts`           | watcher, registration, prompt, decision, options types           |
| `unsaved-changes.tokens.ts`          | window abstraction và confirmation adapter token                 |
| `unsaved-changes.service.ts`         | scoped registry, dirty aggregate, actions, prompts, beforeunload |
| `unsaved-changes.adapters.ts`        | FormGroup, close guard, functional CanDeactivate guard           |
| `components/{modal,side-drawer,tab}` | additive before-close contract                                   |
| `components/tab-router`              | existing tab model hook, fail-closed execution                   |

## Verification matrix

| Risk                                 | Evidence                                    |
| ------------------------------------ | ------------------------------------------- |
| Multiple watchers/scopes/idempotency | service specs                               |
| Cross-scope prompt reuse             | distinct-scope concurrency spec             |
| Save/discard/reset/error             | service and FormGroup adapter specs         |
| Snapshot after save                  | adapter regression spec                     |
| beforeunload/SSR/cleanup             | fake-window and teardown specs              |
| Modal/drawer/tab guard hooks         | component specs including backdrop/Escape   |
| TabRouter callback exception         | integration spec expects tab remains open   |
| Consumer exports                     | root public API compile-time smoke spec     |
| Documentation route                  | Showcase registry/demo specs and generators |
