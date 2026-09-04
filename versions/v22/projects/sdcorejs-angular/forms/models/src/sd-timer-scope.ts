import { DestroyRef, inject } from '@angular/core';

/**
 * @internal Macrotask timers owned by a component/directive injector.
 *
 * Every pending handle is cleared when the host is destroyed, so a deferred focus,
 * panel-open or emit can never run against a torn-down view.
 */
export interface ɵSdTimerScope {
  /**
   * `setTimeout` with the same observable timing, minus the leak: the handle is tracked
   * and cleared on destroy. Scheduling after destroy is a no-op.
   */
  schedule(handler: () => void, delayMs?: number): void;
  /** Cancels every pending timer without waiting for destroy. */
  clear(): void;
  /** Number of timers still pending. Test/diagnostics only. */
  readonly pending: number;
}

/**
 * @internal Creates a destroy-scoped timer bag. MUST be called from an injection context
 * (class field initializer or constructor) because it resolves `DestroyRef`.
 *
 * why: gần như mọi form control đều hoãn focus / mở panel bằng `setTimeout(..., 100)` để chờ
 * Material dựng xong DOM. Handle không được giữ lại nên callback vẫn chạy sau khi host view đã
 * destroy — route đổi nhanh hoặc chip bị gỡ giữa lúc focus là đủ để `detectChanges()` ném
 * `ViewDestroyedError`, hoặc để một output bắn ra sau khi consumer đã unsubscribe. Gom vào một
 * scope duy nhất để nơi dùng chỉ cần đổi `setTimeout(fn, ms)` → `#timers.schedule(fn, ms)`,
 * KHÔNG đổi độ trễ (đây là fix vòng đời, không phải fix hành vi).
 */
export function ɵsdTimerScope(): ɵSdTimerScope {
  const handles = new Set<ReturnType<typeof setTimeout>>();
  let destroyed = false;

  const clear = (): void => {
    handles.forEach(handle => clearTimeout(handle));
    handles.clear();
  };

  inject(DestroyRef).onDestroy(() => {
    destroyed = true;
    clear();
  });

  return {
    schedule(handler: () => void, delayMs = 0): void {
      if (destroyed) return;
      // why: `handles.delete` chạy TRƯỚC handler — handler có thể tự schedule tiếp, xoá sau
      // sẽ vứt nhầm handle mới nếu runtime tái sử dụng id (Node trả object nên an toàn, browser
      // trả number thì không).
      const handle = setTimeout(() => {
        handles.delete(handle);
        handler();
      }, delayMs);
      handles.add(handle);
    },
    clear,
    get pending(): number {
      return handles.size;
    },
  };
}
